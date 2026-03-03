import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { config } from '../config';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Resolve the current tenant from the Host header (subdomain) or
 * from X-Tenant-Slug header in development mode.
 *
 * Attaches `req.tenant` on success.
 */
export async function resolveTenant(req: Request, _res: Response, next: NextFunction) {
    try {
        let slug: string | undefined;

        // Dev mode: allow header override
        if (config.nodeEnv === 'development') {
            const headerSlug = req.headers['x-tenant-slug'];
            if (typeof headerSlug === 'string' && headerSlug.length > 0) {
                slug = headerSlug;
            }
        }

        // Production: parse subdomain from Host header
        if (!slug) {
            const host = req.hostname; // e.g. instatune.swarshala.com
            const baseDomain = config.baseDomain; // swarshala.com

            if (host.endsWith(`.${baseDomain}`)) {
                const subdomain = host.slice(0, -(baseDomain.length + 1)); // strip .swarshala.com
                if (subdomain && !subdomain.includes('.')) {
                    slug = subdomain;
                }
            }
        }

        if (!slug) {
            throw new AppError(400, 'Tenant could not be resolved. Use a tenant subdomain or set X-Tenant-Slug header in development.', 'TENANT_NOT_RESOLVED');
        }

        const tenant = await prisma.tenant.findUnique({ where: { slug } });

        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        if (tenant.status !== 'ACTIVE') {
            throw new AppError(403, 'Tenant is suspended or inactive', 'TENANT_SUSPENDED');
        }

        req.tenant = tenant;
        next();
    } catch (err) {
        next(err);
    }
}
