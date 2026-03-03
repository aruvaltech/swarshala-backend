import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import type { CreatePaymentInput, ListPaymentsQuery } from './payments.schema';

export class PaymentsService {
    async create(tenantId: string, input: CreatePaymentInput, actorId: string) {
        // Verify invoice belongs to tenant
        const invoice = await prisma.invoice.findFirst({ where: { id: input.invoiceId, tenantId } });
        if (!invoice) throw new NotFoundError('Invoice');

        const payment = await prisma.payment.create({
            data: {
                tenantId,
                invoiceId: input.invoiceId,
                amount: input.amount,
                method: input.method,
                reference: input.reference,
                receivedAt: new Date(input.receivedAt),
                createdById: actorId,
            },
        });

        // Check if invoice is fully paid → auto-update status
        const totalPaid = await prisma.payment.aggregate({
            where: { invoiceId: input.invoiceId },
            _sum: { amount: true },
        });

        const paidAmount = totalPaid._sum.amount ? Number(totalPaid._sum.amount) : 0;
        if (paidAmount >= Number(invoice.total) && invoice.status !== 'PAID') {
            await prisma.invoice.update({
                where: { id: input.invoiceId },
                data: { status: 'PAID' },
            });
        }

        await prisma.auditLog.create({
            data: {
                tenantId,
                actorId,
                action: 'PAYMENT_ADDED',
                entityType: 'PAYMENT',
                entityId: payment.id,
                meta: { invoiceId: input.invoiceId, amount: input.amount, method: input.method },
            },
        });

        return payment;
    }

    async list(tenantId: string, query: ListPaymentsQuery) {
        const where: any = { tenantId };
        if (query.invoiceId) where.invoiceId = query.invoiceId;
        if (query.method) where.method = query.method;

        const [data, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    invoice: { select: { id: true, invoiceNumber: true, total: true } },
                    createdBy: { select: { id: true, name: true } },
                },
                orderBy: { receivedAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.payment.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, paymentId: string) {
        const payment = await prisma.payment.findFirst({
            where: { id: paymentId, tenantId },
            include: {
                invoice: { select: { id: true, invoiceNumber: true, total: true, status: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });
        if (!payment) throw new NotFoundError('Payment');
        return payment;
    }
}

export const paymentsService = new PaymentsService();
