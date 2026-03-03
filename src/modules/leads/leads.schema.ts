import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const publicLeadSchema = z.object({
    name: z.string().min(1).max(255),
    phone: z.string().max(30).optional(),
    email: z.string().email().max(255).optional(),
    city: z.string().max(100).optional(),
    instrument: z.string().max(100).optional(),
    courseInterest: z.string().max(255).optional(),
    preferredTime: z.string().max(100).optional(),
    message: z.string().max(2000).optional(),
    source: z.string().max(100).optional(),
    utm: z.object({
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        utm_campaign: z.string().optional(),
        utm_term: z.string().optional(),
        utm_content: z.string().optional(),
    }).optional(),
});

export const listLeadsQuery = paginationSchema.extend({
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']).optional(),
    source: z.string().optional(),
    assignedToId: z.string().uuid().optional(),
    search: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
});

export const updateLeadSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().max(30).optional(),
    email: z.string().email().max(255).optional(),
    city: z.string().max(100).optional(),
    instrument: z.string().max(100).optional(),
    courseInterest: z.string().max(255).optional(),
    preferredTime: z.string().max(100).optional(),
    message: z.string().max(2000).optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']).optional(),
    source: z.string().max(100).optional(),
});

export const assignLeadSchema = z.object({
    assignedToId: z.string().uuid().nullable(),
});

export const convertLeadSchema = z.object({
    address: z.string().optional(),
    instruments: z.array(z.string()).optional(),
    preferences: z.record(z.unknown()).optional(),
});

export const leadIdParam = z.object({ leadId: z.string().uuid() });
export const tenantSlugParam = z.object({ tenantSlug: z.string().min(3).max(63) });

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuery>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
