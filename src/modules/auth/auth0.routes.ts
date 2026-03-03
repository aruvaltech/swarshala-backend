import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticateAuth0 } from '../../middleware/auth0';
import { resolveTenant } from '../../middleware/resolveTenant';
import { auth0Service } from './auth0.service';
import { BadRequestError } from '../../utils/errors';

const router = Router();

/**
 * GET /api/v1/auth/me
 *
 * Verifies the Auth0 access token and returns the local user profile.
 * Requires X-Tenant-Slug header (or subdomain) for tenant resolution.
 */
router.get(
    '/me',
    authenticateAuth0,
    resolveTenant,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub, email } = req.auth0User!;
            const tenantId = req.tenant!.id;

            const user = await auth0Service.getMe(sub, email, tenantId);
            res.json(user);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/v1/auth/onboard
 *
 * Creates a new user (and optionally a new tenant) for a first-time
 * Auth0 user who doesn't yet have a backend record.
 *
 * Body:
 *   { name, tenantSlug, tenantName? }
 *   – If tenantName is present → creates a new tenant
 *   – Otherwise → joins an existing tenant by slug
 */
router.post(
    '/onboard',
    authenticateAuth0,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sub, email } = req.auth0User!;

            if (!email) {
                throw new BadRequestError('Auth0 token does not contain an email claim');
            }

            const { name, tenantSlug, tenantName } = req.body;
            if (!name || !tenantSlug) {
                throw new BadRequestError('name and tenantSlug are required');
            }

            const result = await auth0Service.onboard({
                auth0Sub: sub,
                email,
                name,
                tenantSlug,
                tenantName,
            });

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    },
);

export default router;
