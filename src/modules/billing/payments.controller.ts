import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';

export class PaymentsController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await paymentsService.create(req.tenant!.id, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await paymentsService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await paymentsService.getById(req.tenant!.id, req.params.paymentId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const paymentsController = new PaymentsController();
