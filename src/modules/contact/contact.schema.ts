import { z } from 'zod';

export const publicContactSchema = z.object({
    name: z.string().min(2).max(255),
    email: z.string().email().max(255),
    phone: z.string().max(30).optional(),
    subject: z.string().min(5).max(500),
    message: z.string().min(10).max(2000),
});

export type PublicContactInput = z.infer<typeof publicContactSchema>;
