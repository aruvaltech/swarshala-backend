import { Request, Response, NextFunction } from 'express';
import { commLogsService } from './commLogs.service';

export class CommLogsController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await commLogsService.create(req.tenant!.id, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await commLogsService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await commLogsService.getById(req.tenant!.id, req.params.commLogId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const commLogsController = new CommLogsController();
