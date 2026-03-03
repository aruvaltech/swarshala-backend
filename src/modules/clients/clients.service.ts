import { prisma } from '../../db/client';
import { paginationArgs, paginatedResponse } from '../../utils/pagination';
import { NotFoundError } from '../../utils/errors';
import type { ListClientsQuery, CreateClientInput, UpdateClientInput } from './clients.schema';

export class ClientsService {
    async list(tenantId: string, query: ListClientsQuery) {
        const where: any = { tenantId };
        if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginationArgs(query) }),
            prisma.client.count({ where }),
        ]);

        return paginatedResponse(data, total, query);
    }

    async getById(tenantId: string, clientId: string) {
        const client = await prisma.client.findFirst({
            where: { id: clientId, tenantId },
            include: { convertedFrom: { select: { id: true, name: true, status: true } } },
        });
        if (!client) throw new NotFoundError('Client');
        return client;
    }

    async create(tenantId: string, input: CreateClientInput, actorId: string) {
        const client = await prisma.client.create({
            data: {
                tenantId,
                name: input.name,
                phone: input.phone,
                email: input.email?.toLowerCase(),
                address: input.address,
                city: input.city,
                instruments: input.instruments ?? [],
                preferences: (input.preferences ?? {}) as any,
            },
        });

        await prisma.auditLog.create({
            data: { tenantId, actorId, action: 'CLIENT_CREATED', entityType: 'CLIENT', entityId: client.id },
        });

        return client;
    }

    async update(tenantId: string, clientId: string, input: UpdateClientInput, actorId: string) {
        const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new NotFoundError('Client');

        const updated = await prisma.client.update({
            where: { id: clientId },
            data: {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.phone !== undefined && { phone: input.phone }),
                ...(input.email !== undefined && { email: input.email?.toLowerCase() }),
                ...(input.address !== undefined && { address: input.address }),
                ...(input.city !== undefined && { city: input.city }),
                ...(input.instruments !== undefined && { instruments: input.instruments as any }),
                ...(input.preferences !== undefined && { preferences: input.preferences as any }),
            },
        });

        await prisma.auditLog.create({
            data: { tenantId, actorId, action: 'CLIENT_UPDATED', entityType: 'CLIENT', entityId: clientId },
        });

        return updated;
    }

    async remove(tenantId: string, clientId: string, actorId: string) {
        const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new NotFoundError('Client');

        await prisma.client.delete({ where: { id: clientId } });

        await prisma.auditLog.create({
            data: { tenantId, actorId, action: 'CLIENT_DELETED', entityType: 'CLIENT', entityId: clientId },
        });

        return { message: 'Client deleted' };
    }
}

export const clientsService = new ClientsService();
