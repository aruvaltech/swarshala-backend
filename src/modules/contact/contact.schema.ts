import { z } from 'zod';

export const publicContactSchema = z.object({
    name: z.string().min(2).max(255),
    email: z.string().email().max(255),
    phone: z.string().max(30).optional(),
    subject: z.string().min(5).max(500),
    message: z.string().min(10).max(2000),
});

export type PublicContactInput = z.infer<typeof publicContactSchema>;

// ── Authenticated schemas ────────────────────────────────────
export const listContactsQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['NEW', 'READ', 'REPLIED', 'CLOSED']).optional(),
    search: z.string().max(255).optional(),
});

export type ListContactsQuery = z.infer<typeof listContactsQuery>;

export const contactIdParam = z.object({
    contactId: z.string().uuid(),
});

export const updateContactStatusSchema = z.object({
    status: z.enum(['NEW', 'READ', 'REPLIED', 'CLOSED']),
});
