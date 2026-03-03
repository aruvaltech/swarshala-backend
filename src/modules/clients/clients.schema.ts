import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listClientsQuery = paginationSchema.extend({
    search: z.string().optional(),
    city: z.string().optional(),
});

export const createClientSchema = z.object({
    name: z.string().min(1).max(255),
    phone: z.string().max(30).optional(),
    email: z.string().email().max(255).optional(),
    address: z.string().max(1000).optional(),
    city: z.string().max(100).optional(),
    instruments: z.array(z.string()).optional(),
    preferences: z.record(z.unknown()).optional(),
});

export const updateClientSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().max(30).optional(),
    email: z.string().email().max(255).optional(),
    address: z.string().max(1000).optional(),
    city: z.string().max(100).optional(),
    instruments: z.array(z.string()).optional(),
    preferences: z.record(z.unknown()).optional(),
});

export const clientIdParam = z.object({ clientId: z.string().uuid() });

export type ListClientsQuery = z.infer<typeof listClientsQuery>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
