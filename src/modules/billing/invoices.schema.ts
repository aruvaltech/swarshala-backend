import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

const invoiceItemSchema = z.object({
    productId: z.string().uuid().nullable().optional(),
    description: z.string().min(1).max(500),
    qty: z.number().int().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
    tax: z.number().min(0).default(0),
});

export const createInvoiceSchema = z.object({
    clientId: z.string().uuid(),
    dueAt: z.string().datetime().optional(),
    notes: z.string().max(2000).optional(),
    items: z.array(invoiceItemSchema).min(1),
});

export const updateInvoiceStatusSchema = z.object({
    status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE']),
});

export const listInvoicesQuery = paginationSchema.extend({
    status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE']).optional(),
    clientId: z.string().uuid().optional(),
    search: z.string().optional(),
});

export const invoiceIdParam = z.object({ invoiceId: z.string().uuid() });

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuery>;
