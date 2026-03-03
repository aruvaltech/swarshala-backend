import { z } from 'zod';

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function paginationArgs(input: PaginationInput) {
    return {
        skip: (input.page - 1) * input.limit,
        take: input.limit,
    };
}

export function paginatedResponse<T>(
    data: T[],
    total: number,
    input: PaginationInput,
): PaginatedResult<T> {
    return {
        data,
        meta: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
        },
    };
}
