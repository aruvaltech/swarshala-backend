import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';

export class AuditController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await auditService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const auditController = new AuditController();
