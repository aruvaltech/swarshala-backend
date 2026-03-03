import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const createPaymentSchema = z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().min(0.01),
    method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
    reference: z.string().max(255).optional(),
    receivedAt: z.string().datetime(),
});

export const listPaymentsQuery = paginationSchema.extend({
    invoiceId: z.string().uuid().optional(),
    method: z.string().optional(),
});

export const paymentIdParam = z.object({ paymentId: z.string().uuid() });

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuery>;
