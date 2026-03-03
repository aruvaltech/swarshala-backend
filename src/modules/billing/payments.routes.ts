import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { validate } from '../../middleware/validate';
import { requireBillingAccess } from '../../middleware/rbac';
import { createPaymentSchema, listPaymentsQuery, paymentIdParam } from './payments.schema';

const router = Router();

router.use(requireBillingAccess);

router.get('/', validate({ query: listPaymentsQuery }), paymentsController.list);
router.post('/', validate({ body: createPaymentSchema }), paymentsController.create);
router.get('/:paymentId', validate({ params: paymentIdParam }), paymentsController.getById);

export default router;
