import { Router } from 'express';
import { invoicesController } from './invoices.controller';
import { validate } from '../../middleware/validate';
import { requireBillingAccess } from '../../middleware/rbac';
import { createInvoiceSchema, updateInvoiceStatusSchema, listInvoicesQuery, invoiceIdParam } from './invoices.schema';

const router = Router();

router.use(requireBillingAccess);

router.get('/', validate({ query: listInvoicesQuery }), invoicesController.list);
router.post('/', validate({ body: createInvoiceSchema }), invoicesController.create);
router.get('/:invoiceId', validate({ params: invoiceIdParam }), invoicesController.getById);
router.patch('/:invoiceId/status', validate({ params: invoiceIdParam, body: updateInvoiceStatusSchema }), invoicesController.updateStatus);

export default router;
