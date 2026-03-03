import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { verifyAccessToken } from '../utils/tokens';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../db/client';
import { config } from '../config';
import { logger } from '../utils/logger';

/** Cached JWKS */
let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;
function getJWKS() {
    if (!jwks && config.auth0.domain) {
        jwks = jose.createRemoteJWKSet(new URL(`https://${config.auth0.domain}/.well-known/jwks.json`));
    }
    return jwks;
}

/**
 * Authenticate the request by verifying the Bearer JWT.
 *
 * Supports TWO token types:
 *  1. Legacy local JWTs (HS256, signed with JWT_ACCESS_SECRET)
 *  2. Auth0 JWTs (RS256, verified via JWKS)
 *
 * Attaches `req.user` on success.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or malformed authorization header');
        }

        const token = authHeader.slice(7);

        let user: { id: string; tenantId: string; email: string; name: string; role: string; isActive: boolean } | null = null;

        // ── Try Auth0 JWT first (RS256) ───────────────────────
        const jwksInstance = getJWKS();
        if (jwksInstance && config.auth0.domain) {
            try {
                // Accept both access tokens (with API audience) and id_tokens
                // (audience = client_id). Try with API audience first, then
                // fall back to accepting any audience (for id_tokens in local dev).
                let payload: any;
                try {
                    ({ payload } = await jose.jwtVerify(token, jwksInstance, {
                        issuer: `https://${config.auth0.domain}/`,
                        audience: config.auth0.audience,
                    }));
                } catch {
                    // Retry without audience check — covers id_tokens whose
                    // audience is the Auth0 client_id rather than the API id.
                    ({ payload } = await jose.jwtVerify(token, jwksInstance, {
                        issuer: `https://${config.auth0.domain}/`,
                    }));
                }

                const auth0Sub = payload.sub!;
                const email = (payload as any).email ?? (payload as any)['https://swarshala.com/email'];

                // Look up user by auth0Sub (across tenants if no tenant context, or within tenant)
                const where: any = auth0Sub ? { auth0Sub } : { email };
                if (req.tenant) {
                    where.tenantId = req.tenant.id;
                }

                user = await prisma.user.findFirst({
                    where,
                    select: { id: true, tenantId: true, email: true, name: true, role: true, isActive: true },
                });

                // Fallback: match by email within tenant
                if (!user && email && req.tenant) {
                    user = await prisma.user.findUnique({
                        where: { tenantId_email: { tenantId: req.tenant.id, email } },
                        select: { id: true, tenantId: true, email: true, name: true, role: true, isActive: true },
                    });
                    if (user && !user.isActive) { user = null; }
                    // Link auth0Sub
                    if (user && auth0Sub) {
                        await prisma.user.update({ where: { id: user.id }, data: { auth0Sub } });
                    }
                }
            } catch {
                // Not an Auth0 token – fall through to legacy check
            }
        }

        // ── Fallback: legacy local JWT (HS256) ────────────────
        if (!user) {
            try {
                const payload = verifyAccessToken(token);
                user = await prisma.user.findUnique({
                    where: { id: payload.sub },
                    select: { id: true, tenantId: true, email: true, name: true, role: true, isActive: true },
                });
            } catch {
                throw new UnauthorizedError('Invalid or expired token');
            }
        }

        if (!user || !user.isActive) {
            throw new UnauthorizedError('User not found or deactivated');
        }

        // If we have a tenant context, verify user belongs to this tenant
        if (req.tenant && user.tenantId !== req.tenant.id) {
            throw new UnauthorizedError('User does not belong to this tenant');
        }

        req.user = { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role };
        next();
    } catch (err: any) {
        if (err instanceof UnauthorizedError) return next(err);
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Invalid or expired token'));
        }
        next(err);
    }
}
