import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import type { CreateBulkOrderInput, ListBulkOrdersQuery } from './bulkOrders.schema';

export class BulkOrdersService {
    async create(tenantId: string, input: CreateBulkOrderInput, actorId: string) {
        // Compute totals
        let discountTotal = 0;
        let taxTotal = 0;
        let grandTotal = 0;

        for (const item of input.items) {
            const lineTotal = item.qty * item.unitPrice - item.discount + item.tax;
            discountTotal += item.discount;
            taxTotal += item.tax;
            grandTotal += lineTotal;
        }

        const order = await prisma.bulkOrder.create({
            data: {
                tenantId,
                clientId: input.clientId ?? null,
                status: 'DRAFT',
                discountTotal,
                taxTotal,
                grandTotal,
                createdById: actorId,
                items: {
                    create: input.items.map((item) => ({
                        productId: item.productId,
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        tax: item.tax,
                    })),
                },
            },
            include: { items: true },
        });

        return order;
    }

    async list(tenantId: string, query: ListBulkOrdersQuery) {
        const where: any = { tenantId };
        if (query.status) where.status = query.status;
        if (query.clientId) where.clientId = query.clientId;

        const [data, total] = await Promise.all([
            prisma.bulkOrder.findMany({
                where,
                include: { items: true, client: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.bulkOrder.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, orderId: string) {
        const order = await prisma.bulkOrder.findFirst({
            where: { id: orderId, tenantId },
            include: {
                items: { include: { product: { select: { id: true, name: true, type: true } } } },
                client: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
        if (!order) throw new NotFoundError('Bulk order');
        return order;
    }

    async updateStatus(tenantId: string, orderId: string, status: string, actorId: string) {
        const order = await prisma.bulkOrder.findFirst({ where: { id: orderId, tenantId } });
        if (!order) throw new NotFoundError('Bulk order');

        // Validate transitions
        const validTransitions: Record<string, string[]> = {
            DRAFT: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['FULFILLED', 'CANCELLED'],
            FULFILLED: [],
            CANCELLED: [],
        };

        if (!validTransitions[order.status]?.includes(status)) {
            throw new BadRequestError(`Cannot transition from ${order.status} to ${status}`);
        }

        const updated = await prisma.bulkOrder.update({
            where: { id: orderId },
            data: { status },
            include: { items: true },
        });

        await prisma.auditLog.create({
            data: {
                tenantId,
                actorId,
                action: 'BULK_ORDER_STATUS_CHANGED',
                entityType: 'BULK_ORDER',
                entityId: orderId,
                meta: { from: order.status, to: status },
            },
        });

        return updated;
    }
}

export const bulkOrdersService = new BulkOrdersService();
