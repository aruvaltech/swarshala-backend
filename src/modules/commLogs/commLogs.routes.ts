import { Router } from 'express';
import { commLogsController } from './commLogs.controller';
import { validate } from '../../middleware/validate';
import { requireAnyTenantRole } from '../../middleware/rbac';
import { createCommLogSchema, listCommLogsQuery, commLogIdParam } from './commLogs.schema';

const router = Router();

router.use(requireAnyTenantRole);

router.get('/', validate({ query: listCommLogsQuery }), commLogsController.list);
router.post('/', validate({ body: createCommLogSchema }), commLogsController.create);
router.get('/:commLogId', validate({ params: commLogIdParam }), commLogsController.getById);

export default router;
