import { Router } from 'express';
import { leadsController } from './leads.controller';
import { validate } from '../../middleware/validate';
import { requireAnyTenantRole } from '../../middleware/rbac';
import {
    publicLeadSchema,
    listLeadsQuery,
    updateLeadSchema,
    assignLeadSchema,
    convertLeadSchema,
    leadIdParam,
} from './leads.schema';

const router = Router();

// All authenticated lead routes (tenant + auth already applied at app level)
router.use(requireAnyTenantRole);

router.get('/', validate({ query: listLeadsQuery }), leadsController.list);
router.post('/', validate({ body: publicLeadSchema }), leadsController.create);
router.get('/:leadId', validate({ params: leadIdParam }), leadsController.getById);
router.patch('/:leadId', validate({ params: leadIdParam, body: updateLeadSchema }), leadsController.update);
router.patch('/:leadId/assign', validate({ params: leadIdParam, body: assignLeadSchema }), leadsController.assign);
router.post('/:leadId/convert', validate({ params: leadIdParam, body: convertLeadSchema }), leadsController.convert);

export default router;
