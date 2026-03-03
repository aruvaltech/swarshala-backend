import { Router } from 'express';
import { auditController } from './audit.controller';
import { validate } from '../../middleware/validate';
import { requireTenantAdmin } from '../../middleware/rbac';
import { listAuditLogsQuery } from './audit.service';

const router = Router();

router.use(requireTenantAdmin);

router.get('/', validate({ query: listAuditLogsQuery }), auditController.list);

export default router;
