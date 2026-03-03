import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

const bulkOrderItemSchema = z.object({
    productId: z.string().uuid(),
    qty: z.number().int().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).default(0),
    tax: z.number().min(0).default(0),
});

export const createBulkOrderSchema = z.object({
    clientId: z.string().uuid().nullable().optional(),
    items: z.array(bulkOrderItemSchema).min(1),
});

export const updateBulkOrderStatusSchema = z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'FULFILLED', 'CANCELLED']),
});

export const listBulkOrdersQuery = paginationSchema.extend({
    status: z.enum(['DRAFT', 'CONFIRMED', 'FULFILLED', 'CANCELLED']).optional(),
    clientId: z.string().uuid().optional(),
});

export const bulkOrderIdParam = z.object({ orderId: z.string().uuid() });

export type CreateBulkOrderInput = z.infer<typeof createBulkOrderSchema>;
export type ListBulkOrdersQuery = z.infer<typeof listBulkOrdersQuery>;
