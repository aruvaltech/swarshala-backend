import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export type Role = 'PLATFORM_ADMIN' | 'TENANT_OWNER' | 'TENANT_ADMIN' | 'TENANT_STAFF' | 'TENANT_ACCOUNTANT';

/**
 * Middleware factory: restrict access to users with any of the specified roles.
 */
export function requireRole(allowedRoles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ForbiddenError('Authentication required'));
        }
        if (!allowedRoles.includes(req.user.role as Role)) {
            return next(new ForbiddenError(`Requires one of: ${allowedRoles.join(', ')}`));
        }
        next();
    };
}

/** Shorthand: any tenant role (owner, admin, staff, accountant) */
export const requireAnyTenantRole = requireRole([
    'TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF', 'TENANT_ACCOUNTANT',
]);

/** Shorthand: tenant owner or admin */
export const requireTenantAdmin = requireRole(['TENANT_OWNER', 'TENANT_ADMIN']);

/** Shorthand: platform admin only */
export const requirePlatformAdmin = requireRole(['PLATFORM_ADMIN']);

/** Shorthand: billing access (owner, admin, accountant) */
export const requireBillingAccess = requireRole(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_ACCOUNTANT']);
