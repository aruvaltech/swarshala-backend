import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listPlatformLeadsQuery = paginationSchema.extend({
    assigned: z.enum(['true', 'false']).optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']).optional(),
    search: z.string().optional(),
});

export const listPlatformContactsQuery = paginationSchema.extend({
    status: z.string().optional(),
    search: z.string().optional(),
});

export const assignLeadSchema = z.object({
    tenantId: z.string().uuid(),
});

export const createAdminSchema = z.object({
    name: z.string().min(2).max(255),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
});

export type ListPlatformLeadsQuery = z.infer<typeof listPlatformLeadsQuery>;
export type ListPlatformContactsQuery = z.infer<typeof listPlatformContactsQuery>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
