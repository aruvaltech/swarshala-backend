import { prisma } from '../../db/client';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class Auth0Service {
    /**
     * Find the local user record that matches an Auth0 identity within a tenant.
     *
     * Resolution order:
     *  1. Match by auth0Sub + tenantId
     *  2. Match by email + tenantId  (first-login link)
     *
     * If matched by email only, we persist the auth0Sub so future lookups are instant.
     */
    async getMe(auth0Sub: string, email: string | undefined, tenantId: string) {
        // Try by auth0Sub first
        let user = await prisma.user.findFirst({
            where: { tenantId, auth0Sub },
            select: { id: true, tenantId: true, email: true, name: true, role: true, isActive: true },
        });

        // Fallback: match by email within the same tenant
        if (!user && email) {
            user = await prisma.user.findUnique({
                where: { tenantId_email: { tenantId, email } },
                select: { id: true, tenantId: true, email: true, name: true, role: true, isActive: true },
            });

            // Link the Auth0 identity so future lookups are direct
            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { auth0Sub },
                });
                logger.info({ userId: user.id, auth0Sub }, 'Linked Auth0 identity to existing user');
            }
        }

        if (!user) {
            throw new NotFoundError('User');
        }

        if (!user.isActive) {
            throw new ForbiddenError('Account is deactivated');
        }

        return { id: user.id, tenantId: user.tenantId, email: user.email, name: user.name, role: user.role };
    }

    /**
     * Onboard a new Auth0 user.
     *
     * Two modes:
     *  - "join"   – join an existing tenant by slug (user gets TENANT_STAFF role)
     *  - "create" – create a brand-new tenant and become its TENANT_OWNER
     */
    async onboard(params: {
        auth0Sub: string;
        email: string;
        name: string;
        tenantSlug: string;
        tenantName?: string;
    }) {
        const { auth0Sub, email, name, tenantSlug, tenantName } = params;

        // If tenantName is provided → "create" mode
        if (tenantName) {
            // Make sure slug is not taken
            const existing = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
            if (existing) {
                throw new ConflictError(`Tenant slug "${tenantSlug}" is already taken`);
            }

            // Create tenant + owner in a transaction
            const result = await prisma.$transaction(async (tx) => {
                const tenant = await tx.tenant.create({
                    data: { slug: tenantSlug, name: tenantName },
                });

                const user = await tx.user.create({
                    data: {
                        tenantId: tenant.id,
                        email,
                        name,
                        auth0Sub,
                        role: 'TENANT_OWNER',
                    },
                });

                return {
                    id: user.id,
                    tenantId: user.tenantId,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenant: { slug: tenant.slug, name: tenant.name },
                };
            });

            logger.info({ tenantSlug, userId: result.id }, 'New tenant created via onboarding');
            return result;
        }

        // "join" mode — tenant must exist
        const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        // Make sure user doesn't already exist in this tenant
        const existingUser = await prisma.user.findFirst({
            where: {
                tenantId: tenant.id,
                OR: [{ auth0Sub }, { email }],
            },
        });
        if (existingUser) {
            throw new ConflictError('You already have an account in this organization');
        }

        const user = await prisma.user.create({
            data: {
                tenantId: tenant.id,
                email,
                name,
                auth0Sub,
                role: 'TENANT_STAFF',
            },
        });

        logger.info({ tenantSlug, userId: user.id }, 'User joined tenant via onboarding');
        return {
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant: { slug: tenant.slug, name: tenant.name },
        };
    }
}

export const auth0Service = new Auth0Service();
