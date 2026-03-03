import { Tenant, User } from '@prisma/client';
import { Auth0TokenPayload } from '../middleware/auth0';

declare global {
    namespace Express {
        interface Request {
            tenant?: Tenant;
            user?: Pick<User, 'id' | 'tenantId' | 'email' | 'name' | 'role'>;
            auth0User?: Auth0TokenPayload;
        }
    }
}

export { };
