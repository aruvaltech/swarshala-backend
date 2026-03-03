import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import type { CreateCommLogInput, ListCommLogsQuery } from './commLogs.schema';

export class CommLogsService {
    async create(tenantId: string, input: CreateCommLogInput, actorId: string) {
        // Verify entity belongs to tenant
        if (input.entityType === 'LEAD') {
            const lead = await prisma.lead.findFirst({ where: { id: input.entityId, tenantId } });
            if (!lead) throw new NotFoundError('Lead');
        } else if (input.entityType === 'CLIENT') {
            const client = await prisma.client.findFirst({ where: { id: input.entityId, tenantId } });
            if (!client) throw new NotFoundError('Client');
        }

        const log = await prisma.commLog.create({
            data: {
                tenantId,
                entityType: input.entityType,
                entityId: input.entityId,
                type: input.type,
                subject: input.subject,
                body: input.body,
                meta: (input.meta ?? {}) as any,
                createdById: actorId,
            },
        });

        // If it's a lead note, also create a lead activity
        if (input.entityType === 'LEAD' && input.type === 'NOTE') {
            await prisma.leadActivity.create({
                data: {
                    leadId: input.entityId,
                    action: 'NOTE_ADDED',
                    actorId,
                    details: { commLogId: log.id },
                },
            });
        }

        return log;
    }

    async list(tenantId: string, query: ListCommLogsQuery) {
        const where: any = { tenantId };
        if (query.entityType) where.entityType = query.entityType;
        if (query.entityId) where.entityId = query.entityId;
        if (query.type) where.type = query.type;

        const [data, total] = await Promise.all([
            prisma.commLog.findMany({
                where,
                include: { createdBy: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.commLog.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, commLogId: string) {
        const log = await prisma.commLog.findFirst({
            where: { id: commLogId, tenantId },
            include: { createdBy: { select: { id: true, name: true } } },
        });
        if (!log) throw new NotFoundError('Communication log');
        return log;
    }
}

export const commLogsService = new CommLogsService();
