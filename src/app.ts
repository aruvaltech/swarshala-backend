import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter, publicLeadLimiter } from './middleware/rateLimit';
import { resolveTenant } from './middleware/resolveTenant';
import { authenticate } from './middleware/auth';
import { requirePlatformAdmin } from './middleware/rbac';
import { logger } from './utils/logger';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import auth0Routes from './modules/auth/auth0.routes';
import tenantsRoutes from './modules/tenants/tenants.routes';
import usersRoutes from './modules/users/users.routes';
import leadsRoutes from './modules/leads/leads.routes';
import clientsRoutes from './modules/clients/clients.routes';
import productsRoutes from './modules/products/products.routes';
import bulkOrdersRoutes from './modules/bulkOrders/bulkOrders.routes';
import invoicesRoutes from './modules/billing/invoices.routes';
import paymentsRoutes from './modules/billing/payments.routes';
import commLogsRoutes from './modules/commLogs/commLogs.routes';
import auditRoutes from './modules/audit/audit.routes';
import contactRoutes from './modules/contact/contact.routes';
import seoRoutes from './modules/seo/seo.routes';

// Lead controller for public route
import { leadsController } from './modules/leads/leads.controller';
import { validate } from './middleware/validate';
import { publicLeadSchema, tenantSlugParam } from './modules/leads/leads.schema';

// Contact controller for public route
import { contactController } from './modules/contact/contact.controller';
import { publicContactSchema } from './modules/contact/contact.schema';

export function createApp() {
    const app = express();

    // ── Global middleware ──────────────────────────────────────
    app.use(helmet());
    app.use(cors({
        origin: config.cors.origins,
        credentials: true,
    }));
    app.use(compression());
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use(generalLimiter);

    // Request logging
    app.use((req, _res, next) => {
        logger.info({ method: req.method, path: req.path, host: req.hostname }, 'incoming request');
        next();
    });

    // ── Health check ───────────────────────────────────────────
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ── Auth routes (mixed: some need tenant, some don't) ─────
    app.use('/api/v1/auth', authRoutes);

    // ── Auth0 routes (token-verified, no local JWT) ───────────
    app.use('/api/v1/auth', auth0Routes);

    // ── Public lead intake ─────────────────────────────────────
    // Via path param: POST /api/v1/public/:tenantSlug/leads
    app.post(
        '/api/v1/public/:tenantSlug/leads',
        publicLeadLimiter,
        validate({ params: tenantSlugParam, body: publicLeadSchema }),
        leadsController.createPublic,
    );

    // Via host header: POST /api/v1/public/leads (resolved by subdomain)
    app.post(
        '/api/v1/public/leads',
        publicLeadLimiter,
        resolveTenant,
        validate({ body: publicLeadSchema }),
        leadsController.createPublicFromHost,
    );

    // ── Public contact form ────────────────────────────────────
    app.post(
        '/api/v1/public/contact',
        publicLeadLimiter,
        validate({ body: publicContactSchema }),
        contactController.createPublic,
    );

    // ── Platform admin routes (no tenant context) ─────────────
    app.use('/api/v1/platform/tenants', authenticate, requirePlatformAdmin, tenantsRoutes);

    // ── SEO module routes (authenticated) ─────────────────────
    app.use('/api/v1/seo', authenticate, seoRoutes);

    // ── Tenant-scoped routes ───────────────────────────────────
    // All routes below require tenant resolution + authentication
    const tenantRouter = express.Router();
    tenantRouter.use(resolveTenant, authenticate);

    tenantRouter.use('/users', usersRoutes);
    tenantRouter.use('/leads', leadsRoutes);
    tenantRouter.use('/clients', clientsRoutes);
    tenantRouter.use('/products', productsRoutes);
    tenantRouter.use('/bulk-orders', bulkOrdersRoutes);
    tenantRouter.use('/invoices', invoicesRoutes);
    tenantRouter.use('/payments', paymentsRoutes);
    tenantRouter.use('/comm-logs', commLogsRoutes);
    tenantRouter.use('/contacts', contactRoutes);
    tenantRouter.use('/audit-logs', auditRoutes);

    app.use('/api/v1', tenantRouter);

    // ── 404 ────────────────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
    });

    // ── Error handler (must be last) ──────────────────────────
    app.use(errorHandler);

    return app;
}
