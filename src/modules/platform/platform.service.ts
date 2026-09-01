import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { hashPassword } from '../../utils/password';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import type {
    ListPlatformLeadsQuery,
    ListPlatformContactsQuery,
    CreateAdminInput,
} from './platform.schema';

const PLATFORM_TENANT_SLUG = 'platform';

export class PlatformService {
    /** Website leads across all workspaces, including the unassigned central pool */
    async listLeads(query: ListPlatformLeadsQuery) {
        const where: any = {};
        if (query.assigned === 'true') where.tenantId = { not: null };
        if (query.assigned === 'false') where.tenantId = null;
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                include: { tenant: { select: { id: true, slug: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.lead.count({ where }),
        ]);
        return paginatedResponse(data, total, query);
    }

    /** Route a lead to a workspace */
    async assignLead(leadId: string, tenantId: string) {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) throw new NotFoundError('Lead');
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundError('Workspace');

        const updated = await prisma.lead.update({ where: { id: leadId }, data: { tenantId } });
        await prisma.leadActivity.create({
            data: { leadId, action: 'ASSIGNED', details: { tenantId, tenantSlug: tenant.slug } },
        });
        return updated;
    }

    /** Global website contact messages */
    async listContacts(query: ListPlatformContactsQuery) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { subject: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.contactMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.contactMessage.count({ where }),
        ]);
        return paginatedResponse(data, total, query);
    }

    /** List super admins */
    async listAdmins() {
        return prisma.user.findMany({
            where: { role: 'PLATFORM_ADMIN' },
            select: { id: true, name: true, email: true, isActive: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    /** Create another super admin (in the platform workspace) */
    async createAdmin(input: CreateAdminInput) {
        const platformTenant = await prisma.tenant.findUnique({ where: { slug: PLATFORM_TENANT_SLUG } });
        if (!platformTenant) throw new BadRequestError('Platform workspace not found');

        const existing = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId: platformTenant.id, email: input.email.toLowerCase() } },
        });
        if (existing) throw new ConflictError('An admin with this email already exists');

        const passwordHash = await hashPassword(input.password);
        const user = await prisma.user.create({
            data: {
                tenantId: platformTenant.id,
                email: input.email.toLowerCase(),
                passwordHash,
                name: input.name,
                role: 'PLATFORM_ADMIN',
                isActive: true,
            },
        });
        return { id: user.id, name: user.name, email: user.email, role: user.role };
    }
}

export const platformService = new PlatformService();
