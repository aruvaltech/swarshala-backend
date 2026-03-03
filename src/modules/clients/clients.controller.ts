import { Request, Response, NextFunction } from 'express';
import { clientsService } from './clients.service';

export class ClientsController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await clientsService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await clientsService.getById(req.tenant!.id, req.params.clientId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await clientsService.create(req.tenant!.id, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await clientsService.update(req.tenant!.id, req.params.clientId as string, req.body, req.user!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await clientsService.remove(req.tenant!.id, req.params.clientId as string, req.user!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const clientsController = new ClientsController();
