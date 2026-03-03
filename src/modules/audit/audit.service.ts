import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse, PaginationInput } from '../../utils/pagination';
import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listAuditLogsQuery = paginationSchema.extend({
    action: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().uuid().optional(),
    actorId: z.string().uuid().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuery>;

export class AuditService {
    async list(tenantId: string, query: ListAuditLogsQuery) {
        const where: any = { tenantId };
        if (query.action) where.action = query.action;
        if (query.entityType) where.entityType = query.entityType;
        if (query.entityId) where.entityId = query.entityId;
        if (query.actorId) where.actorId = query.actorId;

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: { actor: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.auditLog.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    /** Helper to log from any module */
    static async log(params: {
        tenantId?: string;
        actorId?: string;
        action: string;
        entityType?: string;
        entityId?: string;
        meta?: Record<string, unknown>;
    }) {
        await prisma.auditLog.create({
            data: {
                tenantId: params.tenantId ?? null,
                actorId: params.actorId ?? null,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                meta: (params.meta ?? {}) as any,
            },
        });
    }
}

export const auditService = new AuditService();
