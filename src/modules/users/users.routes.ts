import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../middleware/validate';
import { requireTenantAdmin } from '../../middleware/rbac';
import { listUsersQuery, createUserSchema, updateUserSchema, userIdParam } from './users.schema';

const router = Router();

// All user management routes require tenant admin
router.use(requireTenantAdmin);

router.get('/', validate({ query: listUsersQuery }), usersController.list);
router.get('/:userId', validate({ params: userIdParam }), usersController.getById);
router.post('/', validate({ body: createUserSchema }), usersController.create);
router.patch('/:userId', validate({ params: userIdParam, body: updateUserSchema }), usersController.update);
router.delete('/:userId', validate({ params: userIdParam }), usersController.remove);

export default router;
