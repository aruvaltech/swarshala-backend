import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import type { ListProductsQuery, CreateProductInput, UpdateProductInput } from './products.schema';

export class ProductsService {
    async list(tenantId: string, query: ListProductsQuery) {
        const where: any = { tenantId };
        if (query.type) where.type = query.type;
        if (query.isActive !== undefined) where.isActive = query.isActive;
        if (query.search) {
            where.name = { contains: query.search, mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginationArgs(query) }),
            prisma.product.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, productId: string) {
        const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
        if (!product) throw new NotFoundError('Product');
        return product;
    }

    async create(tenantId: string, input: CreateProductInput) {
        return prisma.product.create({
            data: {
                tenantId,
                type: input.type,
                name: input.name,
                description: input.description,
                price: input.price,
                currency: input.currency,
                duration: input.duration,
                taxRate: input.taxRate,
                isActive: input.isActive,
            },
        });
    }

    async update(tenantId: string, productId: string, input: UpdateProductInput) {
        const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
        if (!product) throw new NotFoundError('Product');

        return prisma.product.update({
            where: { id: productId },
            data: {
                ...(input.type !== undefined && { type: input.type }),
                ...(input.name !== undefined && { name: input.name }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.price !== undefined && { price: input.price }),
                ...(input.currency !== undefined && { currency: input.currency }),
                ...(input.duration !== undefined && { duration: input.duration }),
                ...(input.taxRate !== undefined && { taxRate: input.taxRate }),
                ...(input.isActive !== undefined && { isActive: input.isActive }),
            },
        });
    }

    async remove(tenantId: string, productId: string) {
        const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
        if (!product) throw new NotFoundError('Product');
        await prisma.product.delete({ where: { id: productId } });
        return { message: 'Product deleted' };
    }
}

export const productsService = new ProductsService();
