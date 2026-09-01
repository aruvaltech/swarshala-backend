import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import type { PublicLeadInput, ListLeadsQuery, UpdateLeadInput } from './leads.schema';

export class LeadsService {
    /** Public intake: create a lead for a tenant (no auth) */
    async createPublic(tenantSlug: string, input: PublicLeadInput) {
        const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
        if (!tenant || tenant.status !== 'ACTIVE') throw new NotFoundError('Tenant');

        const lead = await prisma.lead.create({
            data: {
                tenantId: tenant.id,
                name: input.name,
                phone: input.phone,
                email: input.email?.toLowerCase(),
                city: input.city,
                instrument: input.instrument,
                courseInterest: input.courseInterest,
                preferredTime: input.preferredTime,
                message: input.message,
                source: input.source,
                utm: (input.utm as any) ?? {},
                status: 'NEW',
            },
        });

        // Activity timeline
        await prisma.leadActivity.create({
            data: { leadId: lead.id, action: 'CREATED', details: { source: input.source } },
        });

        return lead;
    }

    /** Public intake from the marketing website: unassigned lead (central pool) */
    async createUnassigned(input: PublicLeadInput) {
        const lead = await prisma.lead.create({
            data: {
                tenantId: null,
                name: input.name,
                phone: input.phone,
                email: input.email?.toLowerCase(),
                city: input.city,
                instrument: input.instrument,
                courseInterest: input.courseInterest,
                preferredTime: input.preferredTime,
                message: input.message,
                source: input.source ?? 'WEBSITE',
                utm: (input.utm as any) ?? {},
                status: 'NEW',
            },
        });
        await prisma.leadActivity.create({
            data: { leadId: lead.id, action: 'CREATED', details: { source: input.source ?? 'WEBSITE' } },
        });
        return lead;
    }

    /** Create lead from authenticated tenant user */
    async create(tenantId: string, input: PublicLeadInput, actorId: string) {
        const lead = await prisma.lead.create({
            data: {
                tenantId,
                name: input.name,
                phone: input.phone,
                email: input.email?.toLowerCase(),
                city: input.city,
                instrument: input.instrument,
                courseInterest: input.courseInterest,
                preferredTime: input.preferredTime,
                message: input.message,
                source: input.source ?? 'MANUAL',
                utm: (input.utm as any) ?? {},
                status: 'NEW',
            },
        });

        await prisma.leadActivity.create({
            data: { leadId: lead.id, action: 'CREATED', actorId, details: { source: 'MANUAL' } },
        });

        return lead;
    }

    async list(tenantId: string, query: ListLeadsQuery) {
        const where: any = { tenantId };
        if (query.status) where.status = query.status;
        if (query.source) where.source = { contains: query.source, mode: 'insensitive' };
        if (query.assignedToId) where.assignedToId = query.assignedToId;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
            ];
        }
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
        }

        const [data, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                include: { assignedTo: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.lead.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, leadId: string) {
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, tenantId },
            include: {
                assignedTo: { select: { id: true, name: true, email: true } },
                activities: { orderBy: { createdAt: 'desc' }, take: 50 },
            },
        });
        if (!lead) throw new NotFoundError('Lead');
        return lead;
    }

    async update(tenantId: string, leadId: string, input: UpdateLeadInput, actorId: string) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } });
        if (!lead) throw new NotFoundError('Lead');

        const updated = await prisma.lead.update({
            where: { id: leadId },
            data: {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.phone !== undefined && { phone: input.phone }),
                ...(input.email !== undefined && { email: input.email?.toLowerCase() }),
                ...(input.city !== undefined && { city: input.city }),
                ...(input.instrument !== undefined && { instrument: input.instrument }),
                ...(input.courseInterest !== undefined && { courseInterest: input.courseInterest }),
                ...(input.preferredTime !== undefined && { preferredTime: input.preferredTime }),
                ...(input.message !== undefined && { message: input.message }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.source !== undefined && { source: input.source }),
            },
        });

        // Track status change
        if (input.status && input.status !== lead.status) {
            await prisma.leadActivity.create({
                data: {
                    leadId,
                    action: 'STATUS_CHANGED',
                    actorId,
                    details: { from: lead.status, to: input.status },
                },
            });
        }

        return updated;
    }

    async assign(tenantId: string, leadId: string, assignedToId: string | null, actorId: string) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } });
        if (!lead) throw new NotFoundError('Lead');

        if (assignedToId) {
            const assignee = await prisma.user.findFirst({ where: { id: assignedToId, tenantId } });
            if (!assignee) throw new NotFoundError('Assignee user');
        }

        const updated = await prisma.lead.update({
            where: { id: leadId },
            data: { assignedToId },
        });

        await prisma.leadActivity.create({
            data: {
                leadId,
                action: 'ASSIGNED',
                actorId,
                details: { assignedToId },
            },
        });

        return updated;
    }

    /** Convert lead to client */
    async convert(
        tenantId: string,
        leadId: string,
        extra: { address?: string; instruments?: string[]; preferences?: Record<string, unknown> },
        actorId: string,
    ) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId } });
        if (!lead) throw new NotFoundError('Lead');
        if (lead.status === 'LOST') throw new BadRequestError('Cannot convert a lost lead');

        // Check if already converted
        const existing = await prisma.client.findFirst({ where: { convertedFromLeadId: leadId } });
        if (existing) throw new BadRequestError('Lead already converted to a client');

        const result = await prisma.$transaction(async (tx) => {
            const client = await tx.client.create({
                data: {
                    tenantId,
                    name: lead.name,
                    phone: lead.phone,
                    email: lead.email,
                    city: lead.city,
                    address: extra.address,
                    instruments: extra.instruments ?? (lead.instrument ? [lead.instrument] : []),
                    preferences: (extra.preferences ?? {}) as any,
                    convertedFromLeadId: leadId,
                },
            });

            await tx.lead.update({ where: { id: leadId }, data: { status: 'WON' } });

            await tx.leadActivity.create({
                data: {
                    leadId,
                    action: 'CONVERTED',
                    actorId,
                    details: { clientId: client.id },
                },
            });

            await tx.auditLog.create({
                data: {
                    tenantId,
                    actorId,
                    action: 'LEAD_CONVERTED',
                    entityType: 'LEAD',
                    entityId: leadId,
                    meta: { clientId: client.id },
                },
            });

            return client;
        });

        return result;
    }
}

export const leadsService = new LeadsService();
