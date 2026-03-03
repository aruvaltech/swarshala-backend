import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

export const listProductsQuery = paginationSchema.extend({
    type: z.enum(['COURSE', 'PACKAGE', 'INSTRUMENT', 'SERVICE']).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
});

export const createProductSchema = z.object({
    type: z.enum(['COURSE', 'PACKAGE', 'INSTRUMENT', 'SERVICE']),
    name: z.string().min(1).max(255),
    description: z.string().max(5000).optional(),
    price: z.number().min(0),
    currency: z.string().length(3).default('INR'),
    duration: z.string().max(100).optional(),
    taxRate: z.number().min(0).max(100).default(0),
    isActive: z.boolean().default(true),
});

export const updateProductSchema = z.object({
    type: z.enum(['COURSE', 'PACKAGE', 'INSTRUMENT', 'SERVICE']).optional(),
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().length(3).optional(),
    duration: z.string().max(100).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
});

export const productIdParam = z.object({ productId: z.string().uuid() });

export type ListProductsQuery = z.infer<typeof listProductsQuery>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
