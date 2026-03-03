import { Router } from 'express';
import { productsController } from './products.controller';
import { validate } from '../../middleware/validate';
import { requireTenantAdmin } from '../../middleware/rbac';
import { requireAnyTenantRole } from '../../middleware/rbac';
import { listProductsQuery, createProductSchema, updateProductSchema, productIdParam } from './products.schema';

const router = Router();

// Read: any tenant role; Write: admin only
router.get('/', requireAnyTenantRole, validate({ query: listProductsQuery }), productsController.list);
router.get('/:productId', requireAnyTenantRole, validate({ params: productIdParam }), productsController.getById);
router.post('/', requireTenantAdmin, validate({ body: createProductSchema }), productsController.create);
router.patch('/:productId', requireTenantAdmin, validate({ params: productIdParam, body: updateProductSchema }), productsController.update);
router.delete('/:productId', requireTenantAdmin, validate({ params: productIdParam }), productsController.remove);

export default router;
