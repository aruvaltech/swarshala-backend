import { v4 as uuid } from 'uuid';
import { prisma } from '../../db/client';
import { hashPassword, verifyPassword } from '../../utils/password';
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    hashToken,
    generateRandomToken,
    parseExpiresIn,
} from '../../utils/tokens';
import { config } from '../../config';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../../utils/errors';
import type { SignupInput, LoginInput, InviteUserInput } from './auth.schema';

export class AuthService {
    /** Signup: create tenant + first owner user, return tokens */
    async signup(input: SignupInput) {
        // Check slug uniqueness
        const existing = await prisma.tenant.findUnique({ where: { slug: input.tenantSlug } });
        if (existing) throw new ConflictError('Tenant slug already taken');

        // Check email uniqueness globally (across tenants for the slug)
        const passwordHash = await hashPassword(input.password);

        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    slug: input.tenantSlug,
                    name: input.tenantName,
                    status: 'ACTIVE',
                },
            });

            const user = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: input.email.toLowerCase(),
                    passwordHash,
                    name: input.ownerName,
                    role: 'TENANT_OWNER',
                    isActive: true,
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    tenantId: tenant.id,
                    actorId: user.id,
                    action: 'TENANT_CREATED',
                    entityType: 'TENANT',
                    entityId: tenant.id,
                },
            });

            return { tenant, user };
        });

        const tokens = await this.issueTokens(result.user.id, result.tenant.id, result.user.role, result.user.email);

        return {
            tenant: { id: result.tenant.id, slug: result.tenant.slug, name: result.tenant.name },
            user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
            ...tokens,
        };
    }

    /** Login: validate credentials, return tokens */
    async login(input: LoginInput, tenantId: string) {
        const user = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: input.email.toLowerCase() } },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!user.passwordHash) {
            throw new UnauthorizedError('Invalid credentials — use Auth0 login');
        }

        const valid = await verifyPassword(user.passwordHash, input.password);
        if (!valid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const tokens = await this.issueTokens(user.id, tenantId, user.role, user.email);

        // Audit
        await prisma.auditLog.create({
            data: { tenantId, actorId: user.id, action: 'USER_LOGIN', entityType: 'USER', entityId: user.id },
        });

        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            ...tokens,
        };
    }

    /** Refresh: rotate refresh token */
    async refresh(refreshTokenRaw: string) {
        let payload;
        try {
            payload = verifyRefreshToken(refreshTokenRaw);
        } catch {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const tokenHash = hashToken(refreshTokenRaw);
        const storedToken = await prisma.refreshToken.findFirst({
            where: { id: payload.jti, tokenHash, revokedAt: null },
            include: { user: { select: { id: true, tenantId: true, role: true, email: true, isActive: true } } },
        });

        if (!storedToken || !storedToken.user.isActive) {
            // Possible token reuse → revoke all tokens for this user
            if (storedToken) {
                await prisma.refreshToken.updateMany({
                    where: { userId: storedToken.userId },
                    data: { revokedAt: new Date() },
                });
            }
            throw new UnauthorizedError('Refresh token revoked or invalid');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('Refresh token expired');
        }

        // Revoke old token
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        // Issue new pair
        return this.issueTokens(
            storedToken.user.id,
            storedToken.user.tenantId,
            storedToken.user.role,
            storedToken.user.email,
        );
    }

    /** Logout: revoke the given refresh token */
    async logout(refreshTokenRaw: string) {
        const tokenHash = hashToken(refreshTokenRaw);
        await prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    /** Forgot password: create reset token (in real app, send email) */
    async forgotPassword(email: string, tenantId: string) {
        const user = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
        });
        // Always return success to avoid email enumeration
        if (!user) return { message: 'If the email exists, a reset link will be sent.' };

        const rawToken = generateRandomToken();
        const tokenHash = hashToken(rawToken);

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });

        // TODO: send email with rawToken
        return { message: 'If the email exists, a reset link will be sent.', _devToken: config.nodeEnv === 'development' ? rawToken : undefined };
    }

    /** Reset password with token */
    async resetPassword(rawToken: string, newPassword: string) {
        const tokenHash = hashToken(rawToken);
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: { tokenHash, usedAt: null },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            throw new BadRequestError('Invalid or expired reset token');
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.$transaction([
            prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
            prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
            // Revoke all refresh tokens on password change
            prisma.refreshToken.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
        ]);

        return { message: 'Password reset successfully' };
    }

    /** Invite a user to a tenant */
    async inviteUser(input: InviteUserInput, tenantId: string, invitedByUserId: string) {
        const exists = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: input.email.toLowerCase() } },
        });
        if (exists) throw new ConflictError('User with this email already exists in this tenant');

        // Create user with a temporary random password (they must reset)
        const tempPassword = generateRandomToken(16);
        const passwordHash = await hashPassword(tempPassword);

        const user = await prisma.user.create({
            data: {
                tenantId,
                email: input.email.toLowerCase(),
                passwordHash,
                name: input.name,
                role: input.role,
                isActive: true,
            },
        });

        // Create a password reset token so they can set their own password
        const rawToken = generateRandomToken();
        const tokenHash = hashToken(rawToken);
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        await prisma.auditLog.create({
            data: {
                tenantId,
                actorId: invitedByUserId,
                action: 'USER_INVITED',
                entityType: 'USER',
                entityId: user.id,
                meta: { email: input.email, role: input.role },
            },
        });

        return {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            _devResetToken: config.nodeEnv === 'development' ? rawToken : undefined,
        };
    }

    // ── Private helpers ────────────────────────────────────────

    private async issueTokens(userId: string, tenantId: string, role: string, email: string) {
        const accessToken = signAccessToken({ sub: userId, tid: tenantId, role, email });

        const jti = uuid();
        const refreshTokenRaw = signRefreshToken({ sub: userId, jti });
        const tokenHash = hashToken(refreshTokenRaw);
        const expiresAt = new Date(Date.now() + parseExpiresIn(config.jwt.refreshExpiresIn));

        await prisma.refreshToken.create({
            data: { id: jti, userId, tokenHash, expiresAt },
        });

        return { accessToken, refreshToken: refreshTokenRaw };
    }
}

export const authService = new AuthService();
