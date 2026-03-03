import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { hashPassword } from '../../utils/password';
import { ConflictError, NotFoundError } from '../../utils/errors';
import type { ListUsersQuery, CreateUserInput, UpdateUserInput } from './users.schema';

const SELECT_USER = {
    id: true,
    tenantId: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};

export class UsersService {
    async list(tenantId: string, query: ListUsersQuery) {
        const where: any = { tenantId };
        if (query.role) where.role = query.role;
        if (query.isActive !== undefined) where.isActive = query.isActive;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.user.findMany({ where, select: SELECT_USER, orderBy: { createdAt: 'desc' }, ...paginationArgs(query) }),
            prisma.user.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, userId: string) {
        const user = await prisma.user.findFirst({ where: { id: userId, tenantId }, select: SELECT_USER });
        if (!user) throw new NotFoundError('User');
        return user;
    }

    async create(tenantId: string, input: CreateUserInput, actorId: string) {
        const exists = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: input.email.toLowerCase() } },
        });
        if (exists) throw new ConflictError('Email already registered in this tenant');

        const passwordHash = await hashPassword(input.password);

        const user = await prisma.user.create({
            data: {
                tenantId,
                email: input.email.toLowerCase(),
                passwordHash,
                name: input.name,
                role: input.role,
            },
            select: SELECT_USER,
        });

        await prisma.auditLog.create({
            data: { tenantId, actorId, action: 'USER_CREATED', entityType: 'USER', entityId: user.id },
        });

        return user;
    }

    async update(tenantId: string, userId: string, input: UpdateUserInput, actorId: string) {
        const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
        if (!user) throw new NotFoundError('User');

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.role !== undefined && { role: input.role }),
                ...(input.isActive !== undefined && { isActive: input.isActive }),
            },
            select: SELECT_USER,
        });

        await prisma.auditLog.create({
            data: {
                tenantId,
                actorId,
                action: input.role !== undefined ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
                entityType: 'USER',
                entityId: userId,
                meta: input as any,
            },
        });

        return updated;
    }

    async remove(tenantId: string, userId: string, actorId: string) {
        const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
        if (!user) throw new NotFoundError('User');

        await prisma.user.delete({ where: { id: userId } });

        await prisma.auditLog.create({
            data: { tenantId, actorId, action: 'USER_DELETED', entityType: 'USER', entityId: userId },
        });

        return { message: 'User deleted' };
    }
}

export const usersService = new UsersService();
