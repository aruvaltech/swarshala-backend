import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import type { CreateInvoiceInput, ListInvoicesQuery } from './invoices.schema';

export class InvoicesService {
    /** Generate a unique invoice number per tenant: INV-YYYYMM-XXXX */
    private async generateInvoiceNumber(tenantId: string): Promise<string> {
        const now = new Date();
        const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

        const lastInvoice = await prisma.invoice.findFirst({
            where: { tenantId, invoiceNumber: { startsWith: prefix } },
            orderBy: { invoiceNumber: 'desc' },
        });

        let seq = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            seq = parseInt(parts[parts.length - 1], 10) + 1;
        }

        return `${prefix}-${String(seq).padStart(4, '0')}`;
    }

    async create(tenantId: string, input: CreateInvoiceInput, actorId: string) {
        // Verify client belongs to tenant
        const client = await prisma.client.findFirst({ where: { id: input.clientId, tenantId } });
        if (!client) throw new NotFoundError('Client');

        const invoiceNumber = await this.generateInvoiceNumber(tenantId);

        // Compute totals server-side
        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;

        for (const item of input.items) {
            subtotal += item.qty * item.unitPrice;
            discountTotal += item.discount;
            taxTotal += item.tax;
        }

        const total = subtotal - discountTotal + taxTotal;

        const invoice = await prisma.invoice.create({
            data: {
                tenantId,
                clientId: input.clientId,
                invoiceNumber,
                status: 'DRAFT',
                dueAt: input.dueAt ? new Date(input.dueAt) : null,
                subtotal,
                discountTotal,
                taxTotal,
                total,
                notes: input.notes,
                createdById: actorId,
                items: {
                    create: input.items.map((item) => ({
                        productId: item.productId ?? null,
                        description: item.description,
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        tax: item.tax,
                    })),
                },
            },
            include: { items: true },
        });

        await prisma.auditLog.create({
            data: {
                tenantId,
                actorId,
                action: 'INVOICE_CREATED',
                entityType: 'INVOICE',
                entityId: invoice.id,
                meta: { invoiceNumber },
            },
        });

        return invoice;
    }

    async list(tenantId: string, query: ListInvoicesQuery) {
        const where: any = { tenantId };
        if (query.status) where.status = query.status;
        if (query.clientId) where.clientId = query.clientId;
        if (query.search) {
            where.invoiceNumber = { contains: query.search, mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    client: { select: { id: true, name: true } },
                    items: true,
                },
                orderBy: { createdAt: 'desc' },
                ...paginationArgs(query),
            }),
            prisma.invoice.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, invoiceId: string) {
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, tenantId },
            include: {
                client: { select: { id: true, name: true, email: true, phone: true } },
                items: { include: { product: { select: { id: true, name: true } } } },
                payments: true,
                createdBy: { select: { id: true, name: true } },
            },
        });
        if (!invoice) throw new NotFoundError('Invoice');
        return invoice;
    }

    async updateStatus(tenantId: string, invoiceId: string, status: string, actorId: string) {
        const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
        if (!invoice) throw new NotFoundError('Invoice');

        const validTransitions: Record<string, string[]> = {
            DRAFT: ['ISSUED', 'VOID'],
            ISSUED: ['PAID', 'VOID', 'OVERDUE'],
            OVERDUE: ['PAID', 'VOID'],
            PAID: [],
            VOID: [],
        };

        if (!validTransitions[invoice.status]?.includes(status)) {
            throw new BadRequestError(`Cannot transition invoice from ${invoice.status} to ${status}`);
        }

        const updated = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status,
                ...(status === 'ISSUED' && !invoice.issuedAt ? { issuedAt: new Date() } : {}),
            },
            include: { items: true },
        });

        await prisma.auditLog.create({
            data: {
                tenantId,
                actorId,
                action: 'INVOICE_STATUS_CHANGED',
                entityType: 'INVOICE',
                entityId: invoiceId,
                meta: { from: invoice.status, to: status },
            },
        });

        return updated;
    }
}

export const invoicesService = new InvoicesService();
