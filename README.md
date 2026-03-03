# SwarShala Backend — Multi-Tenant SaaS API

Production-ready multi-tenant backend for managing music institutes/schools.  
Built with **Node.js + Express + TypeScript + PostgreSQL + Prisma**.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Client (Postman / Frontend)                │
│      Host: instatune.swarshala.com  OR  X-Tenant-Slug        │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                   Express Server (:4000)                      │
├──────────────────────────────────────────────────────────────┤
│  Middleware:  Helmet → CORS → RateLimit → JSON → Logger      │
│              → resolveTenant → authenticate → RBAC            │
├──────────────────────────────────────────────────────────────┤
│  Routes:     /api/v1/auth/*                                  │
│              /api/v1/public/:tenantSlug/leads                 │
│              /api/v1/platform/tenants/*  (admin)              │
│              /api/v1/{leads,clients,users,...}  (tenant)      │
├──────────────────────────────────────────────────────────────┤
│  Services:   AuthService, LeadsService, InvoicesService, … │
├──────────────────────────────────────────────────────────────┤
│  Prisma ORM  →  PostgreSQL (single DB, tenant_id isolation)  │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 20 |
| Framework | Express 4 |
| Language | TypeScript 5 |
| Database | PostgreSQL 15+ |
| ORM | Prisma 6 |
| Validation | Zod |
| Auth | JWT (access + refresh rotation) |
| Password | Argon2id |
| Logging | Pino |
| Security | Helmet, CORS, express-rate-limit |

## Quick Start

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 15 running locally
- npm or yarn

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Run migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed the database

```bash
npx tsx scripts/seed.ts
```

### 5. Start the server

```bash
npm run dev
```

Server starts at `http://localhost:4000`.

---

## Environment Variables

| Variable | Description | Default |
|----------|------------|---------|
| `NODE_ENV` | `development` / `production` | `development` |
| `PORT` | Server port | `4000` |
| `BASE_DOMAIN` | Base domain for subdomain parsing | `swarshala.com` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_ACCESS_SECRET` | Access token secret | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `LOG_LEVEL` | Pino log level | `info` |

---

## Multi-Tenancy

Tenants are resolved from the **Host header subdomain**:

- **Production**: `instatune.swarshala.com` → slug = `instatune`
- **Development**: Set `X-Tenant-Slug: instatune` header when using localhost

All tenant-scoped queries filter by `tenant_id` enforced at the service layer.

### Roles & RBAC

| Role | Scope |
|------|-------|
| `PLATFORM_ADMIN` | Manage all tenants (platform routes only) |
| `TENANT_OWNER` | Full access within their tenant |
| `TENANT_ADMIN` | Manage users, products, invoices, leads |
| `TENANT_STAFF` | Manage leads, clients, comm logs |
| `TENANT_ACCOUNTANT` | Invoices and payments only |

---

## API Reference

### Auth

```http
### Signup (creates tenant + owner)
POST http://localhost:4000/api/v1/auth/signup
Content-Type: application/json

{
  "tenantName": "My Music School",
  "tenantSlug": "myschool",
  "ownerName": "John Doe",
  "email": "john@myschool.com",
  "password": "SecurePass123"
}

### Login (requires tenant context)
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json
X-Tenant-Slug: instatune

{
  "email": "owner@instatune.com",
  "password": "Owner@12345"
}

### Refresh Token
POST http://localhost:4000/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}

### Logout
POST http://localhost:4000/api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}

### Forgot Password
POST http://localhost:4000/api/v1/auth/forgot-password
Content-Type: application/json
X-Tenant-Slug: instatune

{
  "email": "owner@instatune.com"
}

### Reset Password
POST http://localhost:4000/api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "<reset_token>",
  "newPassword": "NewSecurePass123"
}

### Invite User (owner/admin only)
POST http://localhost:4000/api/v1/auth/invite
Content-Type: application/json
Authorization: Bearer <access_token>
X-Tenant-Slug: instatune

{
  "email": "newuser@instatune.com",
  "name": "New User",
  "role": "TENANT_STAFF"
}
```

### Public Lead Intake (no auth)

```http
### Via path param
POST http://localhost:4000/api/v1/public/instatune/leads
Content-Type: application/json

{
  "name": "Ravi Kumar",
  "phone": "+91-9876543210",
  "email": "ravi@example.com",
  "city": "Mumbai",
  "instrument": "Guitar",
  "courseInterest": "Beginner Guitar",
  "preferredTime": "Weekday Evenings",
  "message": "I want to learn guitar.",
  "source": "WEBSITE",
  "utm": { "utm_source": "google", "utm_medium": "cpc" }
}

### Via host header (subdomain)
POST http://localhost:4000/api/v1/public/leads
Content-Type: application/json
X-Tenant-Slug: instatune

{ "name": "Ravi Kumar", "phone": "+91-9876543210" }
```

### Tenant-Scoped Endpoints

All require `Authorization: Bearer <token>` and tenant context (`X-Tenant-Slug` header in dev).

```http
### ── Users ──
GET    /api/v1/users?page=1&limit=20&role=TENANT_STAFF
POST   /api/v1/users
GET    /api/v1/users/:userId
PATCH  /api/v1/users/:userId
DELETE /api/v1/users/:userId

### ── Leads ──
GET    /api/v1/leads?status=NEW&source=WEBSITE&page=1
POST   /api/v1/leads
GET    /api/v1/leads/:leadId
PATCH  /api/v1/leads/:leadId
PATCH  /api/v1/leads/:leadId/assign    { "assignedToId": "<userId>" }
POST   /api/v1/leads/:leadId/convert   { "address": "...", "instruments": ["Guitar"] }

### ── Clients ──
GET    /api/v1/clients?search=neha&city=Mumbai
POST   /api/v1/clients
GET    /api/v1/clients/:clientId
PATCH  /api/v1/clients/:clientId
DELETE /api/v1/clients/:clientId

### ── Products ──
GET    /api/v1/products?type=COURSE&isActive=true
POST   /api/v1/products
GET    /api/v1/products/:productId
PATCH  /api/v1/products/:productId
DELETE /api/v1/products/:productId

### ── Bulk Orders ──
GET    /api/v1/bulk-orders?status=DRAFT
POST   /api/v1/bulk-orders
GET    /api/v1/bulk-orders/:orderId
PATCH  /api/v1/bulk-orders/:orderId/status  { "status": "CONFIRMED" }

### ── Invoices ──
GET    /api/v1/invoices?status=ISSUED&clientId=<uuid>
POST   /api/v1/invoices
GET    /api/v1/invoices/:invoiceId
PATCH  /api/v1/invoices/:invoiceId/status   { "status": "ISSUED" }

### ── Payments ──
GET    /api/v1/payments?invoiceId=<uuid>
POST   /api/v1/payments
GET    /api/v1/payments/:paymentId

### ── Communication Logs ──
GET    /api/v1/comm-logs?entityType=LEAD&entityId=<uuid>&type=NOTE
POST   /api/v1/comm-logs
GET    /api/v1/comm-logs/:commLogId

### ── Audit Logs ──
GET    /api/v1/audit-logs?action=INVOICE_CREATED&entityType=INVOICE
```

### Platform Admin Endpoints

Requires `PLATFORM_ADMIN` role. No tenant context needed.

```http
### List tenants
GET http://localhost:4000/api/v1/platform/tenants?page=1&status=ACTIVE
Authorization: Bearer <platform_admin_token>

### Get tenant
GET http://localhost:4000/api/v1/platform/tenants/:tenantId
Authorization: Bearer <platform_admin_token>

### Get tenant stats
GET http://localhost:4000/api/v1/platform/tenants/:tenantId/stats
Authorization: Bearer <platform_admin_token>

### Suspend/update tenant
PATCH http://localhost:4000/api/v1/platform/tenants/:tenantId
Authorization: Bearer <platform_admin_token>
Content-Type: application/json

{ "status": "SUSPENDED" }

### Delete tenant
DELETE http://localhost:4000/api/v1/platform/tenants/:tenantId
Authorization: Bearer <platform_admin_token>
```

---

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── seed.ts                # Seed script
├── src/
│   ├── config/
│   │   └── index.ts           # Environment config
│   ├── db/
│   │   └── client.ts          # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   ├── errorHandler.ts    # Central error handler
│   │   ├── rateLimit.ts       # Rate limiters
│   │   ├── rbac.ts            # Role-based access control
│   │   ├── resolveTenant.ts   # Tenant resolution from host/header
│   │   └── validate.ts        # Zod validation middleware
│   ├── modules/
│   │   ├── auth/              # Signup, login, refresh, invite
│   │   ├── audit/             # Audit log viewer
│   │   ├── billing/           # Invoices + payments
│   │   ├── bulkOrders/        # Bulk product orders
│   │   ├── clients/           # Client/student management
│   │   ├── commLogs/          # Communication logs
│   │   ├── leads/             # Lead management + public intake
│   │   ├── products/          # Product catalog
│   │   ├── tenants/           # Platform admin tenant mgmt
│   │   └── users/             # Tenant user management
│   ├── types/
│   │   └── express.d.ts       # Express type augmentation
│   ├── utils/
│   │   ├── errors.ts          # Typed error classes
│   │   ├── logger.ts          # Pino logger
│   │   ├── pagination.ts      # Pagination helpers
│   │   ├── password.ts        # Argon2 hash/verify
│   │   └── tokens.ts          # JWT sign/verify helpers
│   ├── app.ts                 # Express app factory
│   └── server.ts              # Server entry point
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Seeded Credentials

| User | Email | Password | Role | Tenant |
|------|-------|----------|------|--------|
| Platform Admin | admin@swarshala.com | Admin@12345 | PLATFORM_ADMIN | platform |
| Tenant Owner | owner@instatune.com | Owner@12345 | TENANT_OWNER | instatune |
| Tenant Staff | staff@instatune.com | Staff@12345 | TENANT_STAFF | instatune |

---

## Key Design Decisions

1. **Single-DB multi-tenancy**: Every table has `tenant_id` with composite indexes. No schema-per-tenant complexity.
2. **Subdomain-based resolution**: Middleware extracts tenant from Host header; dev mode falls back to `X-Tenant-Slug`.
3. **Refresh token rotation**: Each refresh issues a new pair; old token is revoked. Reuse detection revokes all user tokens.
4. **Server-side totals**: Invoice/order totals computed server-side to prevent client manipulation.
5. **Audit trail**: All critical actions (login, CRUD, status changes) logged to `audit_logs`.
6. **Lead lifecycle**: Full pipeline from intake → assignment → status tracking → conversion to client.

---

## License

Private — SwarShala © 2026
# swarshala-backend
