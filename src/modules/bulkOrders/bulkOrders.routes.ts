import { Router } from 'express';
import { bulkOrdersController } from './bulkOrders.controller';
import { validate } from '../../middleware/validate';
import { requireAnyTenantRole, requireTenantAdmin } from '../../middleware/rbac';
import { createBulkOrderSchema, updateBulkOrderStatusSchema, listBulkOrdersQuery, bulkOrderIdParam } from './bulkOrders.schema';

const router = Router();

router.get('/', requireAnyTenantRole, validate({ query: listBulkOrdersQuery }), bulkOrdersController.list);
router.post('/', requireTenantAdmin, validate({ body: createBulkOrderSchema }), bulkOrdersController.create);
router.get('/:orderId', requireAnyTenantRole, validate({ params: bulkOrderIdParam }), bulkOrdersController.getById);
router.patch('/:orderId/status', requireTenantAdmin, validate({ params: bulkOrderIdParam, body: updateBulkOrderStatusSchema }), bulkOrdersController.updateStatus);

export default router;
