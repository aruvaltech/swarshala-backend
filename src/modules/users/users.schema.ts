import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listUsersQuery = paginationSchema.extend({
    role: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
});

export const createUserSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(255),
    role: z.enum(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF', 'TENANT_ACCOUNTANT']),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    role: z.enum(['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_STAFF', 'TENANT_ACCOUNTANT']).optional(),
    isActive: z.boolean().optional(),
});

export const userIdParam = z.object({
    userId: z.string().uuid(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
