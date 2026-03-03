import { Router } from 'express';
import { clientsController } from './clients.controller';
import { validate } from '../../middleware/validate';
import { requireAnyTenantRole } from '../../middleware/rbac';
import { listClientsQuery, createClientSchema, updateClientSchema, clientIdParam } from './clients.schema';

const router = Router();

router.use(requireAnyTenantRole);

router.get('/', validate({ query: listClientsQuery }), clientsController.list);
router.post('/', validate({ body: createClientSchema }), clientsController.create);
router.get('/:clientId', validate({ params: clientIdParam }), clientsController.getById);
router.patch('/:clientId', validate({ params: clientIdParam, body: updateClientSchema }), clientsController.update);
router.delete('/:clientId', validate({ params: clientIdParam }), clientsController.remove);

export default router;
