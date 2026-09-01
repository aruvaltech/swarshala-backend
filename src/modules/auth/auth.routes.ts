import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { resolveTenant } from '../../middleware/resolveTenant';
import { authenticate } from '../../middleware/auth';
import { requireTenantAdmin } from '../../middleware/rbac';
import { authLimiter } from '../../middleware/rateLimit';
import {
    signupSchema,
    loginSchema,
    refreshSchema,
    logoutSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    inviteUserSchema,
} from './auth.schema';

const router = Router();

// Signup does NOT require tenant resolution (creates a new tenant)
router.post(
    '/signup',
    authLimiter,
    validate({ body: signupSchema }),
    authController.signup,
);

// Login requires tenant context
router.post(
    '/login',
    authLimiter,
    resolveTenant,
    validate({ body: loginSchema }),
    authController.login,
);

// Super-admin login — no tenant/workspace needed
router.post(
    '/admin-login',
    authLimiter,
    validate({ body: loginSchema }),
    authController.adminLogin,
);

// Refresh — no tenant resolution needed (token contains tenant info)
router.post(
    '/refresh',
    authLimiter,
    validate({ body: refreshSchema }),
    authController.refresh,
);

// Logout
router.post(
    '/logout',
    validate({ body: logoutSchema }),
    authController.logout,
);

// Forgot password (tenant scoped)
router.post(
    '/forgot-password',
    authLimiter,
    resolveTenant,
    validate({ body: forgotPasswordSchema }),
    authController.forgotPassword,
);

// Reset password (no auth needed, token-based)
router.post(
    '/reset-password',
    authLimiter,
    validate({ body: resetPasswordSchema }),
    authController.resetPassword,
);

// Invite user (tenant admin only)
router.post(
    '/invite',
    resolveTenant,
    authenticate,
    requireTenantAdmin,
    validate({ body: inviteUserSchema }),
    authController.inviteUser,
);

export default router;
