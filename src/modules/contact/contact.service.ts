import { prisma } from '../../db/client';
import type { PublicContactInput, ListContactsQuery } from './contact.schema';

export class ContactService {
    /** Public: create a contact message from the website form */
    async createPublic(input: PublicContactInput) {
        const message = await prisma.contactMessage.create({
            data: {
                name: input.name,
                email: input.email.toLowerCase(),
                phone: input.phone ?? null,
                subject: input.subject,
                message: input.message,
                status: 'NEW',
            },
        });

        return message;
    }

    /** Authenticated: list contact messages with pagination, filters */
    async list(query: ListContactsQuery) {
        const { page, limit, status, search } = query;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            prisma.contactMessage.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.contactMessage.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /** Authenticated: get a single contact message by ID */
    async getById(id: string) {
        const message = await prisma.contactMessage.findUnique({ where: { id } });
        return message;
    }

    /** Authenticated: update a contact message status */
    async updateStatus(id: string, status: string) {
        const message = await prisma.contactMessage.update({
            where: { id },
            data: { status },
        });
        return message;
    }
}

export const contactService = new ContactService();
