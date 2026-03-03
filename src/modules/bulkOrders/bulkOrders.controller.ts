import { Request, Response, NextFunction } from 'express';
import { bulkOrdersService } from './bulkOrders.service';

export class BulkOrdersController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await bulkOrdersService.create(req.tenant!.id, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await bulkOrdersService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await bulkOrdersService.getById(req.tenant!.id, req.params.orderId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await bulkOrdersService.updateStatus(
                req.tenant!.id,
                req.params.orderId as string,
                req.body.status,
                req.user!.id,
            );
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const bulkOrdersController = new BulkOrdersController();
