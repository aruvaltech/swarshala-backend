import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listTenantsQuery = paginationSchema.extend({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
    search: z.string().optional(),
});

export const updateTenantSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
    settings: z.record(z.unknown()).optional(),
});

export const tenantIdParam = z.object({
    tenantId: z.string().uuid(),
});

export type ListTenantsQuery = z.infer<typeof listTenantsQuery>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
