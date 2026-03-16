import { Request, Response, NextFunction } from 'express';
import { contactService } from './contact.service';
import { NotFoundError } from '../../utils/errors';

export class ContactController {
    /** Public: submit contact form */
    async createPublic(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await contactService.createPublic(req.body);
            res.status(201).json({
                success: true,
                message: 'Thank you for reaching out! We will get back to you within 2 hours.',
                id: result.id,
            });
        } catch (err) {
            next(err);
        }
    }

    /** Authenticated: list all contact messages */
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await contactService.list(req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    /** Authenticated: get a single contact message */
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { contactId } = req.params as { contactId: string };
            const message = await contactService.getById(contactId);
            if (!message) throw new NotFoundError('Contact message not found');
            res.json(message);
        } catch (err) {
            next(err);
        }
    }

    /** Authenticated: update contact message status */
    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { contactId } = req.params as { contactId: string };
            const message = await contactService.updateStatus(contactId, req.body.status);
            res.json(message);
        } catch (err) {
            next(err);
        }
    }
}

export const contactController = new ContactController();
