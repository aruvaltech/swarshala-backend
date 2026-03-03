import { Request, Response, NextFunction } from 'express';
import { tenantsService } from './tenants.service';

export class TenantsController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await tenantsService.list(req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await tenantsService.getById(req.params.tenantId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await tenantsService.getStats(req.params.tenantId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await tenantsService.update(req.params.tenantId as string, req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await tenantsService.delete(req.params.tenantId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const tenantsController = new TenantsController();
