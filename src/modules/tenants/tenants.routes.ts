import { Router } from 'express';
import { tenantsController } from './tenants.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requirePlatformAdmin } from '../../middleware/rbac';
import { listTenantsQuery, updateTenantSchema, tenantIdParam } from './tenants.schema';

const router = Router();

// All platform tenant routes require platform admin
router.use(authenticate, requirePlatformAdmin);

router.get(
    '/',
    validate({ query: listTenantsQuery }),
    tenantsController.list,
);

router.get(
    '/:tenantId',
    validate({ params: tenantIdParam }),
    tenantsController.getById,
);

router.get(
    '/:tenantId/stats',
    validate({ params: tenantIdParam }),
    tenantsController.getStats,
);

router.patch(
    '/:tenantId',
    validate({ params: tenantIdParam, body: updateTenantSchema }),
    tenantsController.update,
);

router.delete(
    '/:tenantId',
    validate({ params: tenantIdParam }),
    tenantsController.remove,
);

export default router;
