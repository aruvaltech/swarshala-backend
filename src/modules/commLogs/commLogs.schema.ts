import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const createCommLogSchema = z.object({
    entityType: z.enum(['LEAD', 'CLIENT']),
    entityId: z.string().uuid(),
    type: z.enum(['NOTE', 'CALL', 'WHATSAPP', 'EMAIL']),
    subject: z.string().max(500).optional(),
    body: z.string().max(10000).optional(),
    meta: z.record(z.unknown()).optional(),
});

export const listCommLogsQuery = paginationSchema.extend({
    entityType: z.enum(['LEAD', 'CLIENT']).optional(),
    entityId: z.string().uuid().optional(),
    type: z.enum(['NOTE', 'CALL', 'WHATSAPP', 'EMAIL']).optional(),
});

export const commLogIdParam = z.object({ commLogId: z.string().uuid() });

export type CreateCommLogInput = z.infer<typeof createCommLogSchema>;
export type ListCommLogsQuery = z.infer<typeof listCommLogsQuery>;
