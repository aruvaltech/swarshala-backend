import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import type { ListTenantsQuery, UpdateTenantInput } from './tenants.schema';

export class TenantsService {
    async list(query: ListTenantsQuery) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { slug: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.tenant.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.tenant.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundError('Tenant');
        return tenant;
    }

    async getStats(tenantId: string) {
        const [leads, clients, invoices, users] = await Promise.all([
            prisma.lead.count({ where: { tenantId } }),
            prisma.client.count({ where: { tenantId } }),
            prisma.invoice.count({ where: { tenantId } }),
            prisma.user.count({ where: { tenantId } }),
        ]);
        return { tenantId, leads, clients, invoices, users };
    }

    async update(tenantId: string, input: UpdateTenantInput) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundError('Tenant');

        return prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.settings !== undefined && { settings: input.settings as any }),
            },
        });
    }

    async delete(tenantId: string) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundError('Tenant');
        await prisma.tenant.delete({ where: { id: tenantId } });
        return { message: 'Tenant deleted' };
    }
}

export const tenantsService = new TenantsService();
