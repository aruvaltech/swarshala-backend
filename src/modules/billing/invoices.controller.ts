import { Request, Response, NextFunction } from 'express';
import { invoicesService } from './invoices.service';

export class InvoicesController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await invoicesService.create(req.tenant!.id, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await invoicesService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await invoicesService.getById(req.tenant!.id, req.params.invoiceId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await invoicesService.updateStatus(
                req.tenant!.id,
                req.params.invoiceId as string,
                req.body.status,
                req.user!.id,
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const invoicesController = new InvoicesController();
