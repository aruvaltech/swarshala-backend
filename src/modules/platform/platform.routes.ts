import { Router } from 'express';
import { platformController } from './platform.controller';
import { validate } from '../../middleware/validate';
import {
    listPlatformLeadsQuery,
    listPlatformContactsQuery,
    assignLeadSchema,
    createAdminSchema,
} from './platform.schema';

const router = Router();

// Website leads — central pool (assigned + unassigned)
router.get('/leads', validate({ query: listPlatformLeadsQuery }), platformController.listLeads);
router.post('/leads/:leadId/assign', validate({ body: assignLeadSchema }), platformController.assignLead);

// Website contact messages
router.get('/contacts', validate({ query: listPlatformContactsQuery }), platformController.listContacts);

// Super admins
router.get('/admins', platformController.listAdmins);
router.post('/admins', validate({ body: createAdminSchema }), platformController.createAdmin);

export default router;
