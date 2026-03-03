/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,auth0_sub]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth0_sub" VARCHAR(255),
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_auth0_sub_key" ON "users"("tenant_id", "auth0_sub");
