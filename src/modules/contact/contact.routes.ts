import { Router } from 'express';
import { contactController } from './contact.controller';
import { validate } from '../../middleware/validate';
import { requireAnyTenantRole } from '../../middleware/rbac';
import {
    listContactsQuery,
    contactIdParam,
    updateContactStatusSchema,
} from './contact.schema';

const router = Router();

// Contact messages are global (no tenant), accessible to all tenant roles
router.use(requireAnyTenantRole);

router.get('/', validate({ query: listContactsQuery }), contactController.list);
router.get('/:contactId', validate({ params: contactIdParam }), contactController.getById);
router.patch('/:contactId/status', validate({ params: contactIdParam, body: updateContactStatusSchema }), contactController.updateStatus);

export default router;
