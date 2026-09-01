-- Central lead pool: website leads can be unassigned until a super admin routes them to a workspace
ALTER TABLE "leads" ALTER COLUMN "tenant_id" DROP NOT NULL;
