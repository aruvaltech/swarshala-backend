import { prisma } from '../../db/client';
import type { PublicContactInput } from './contact.schema';

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
}

export const contactService = new ContactService();
