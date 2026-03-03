import { Request, Response, NextFunction } from 'express';
import { contactService } from './contact.service';

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
}

export const contactController = new ContactController();
