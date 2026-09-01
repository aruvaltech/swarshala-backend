import { Request, Response, NextFunction } from 'express';
import { leadsService } from './leads.service';

export class LeadsController {
    /** Public: create lead via tenantSlug param */
    async createPublic(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.createPublic(req.params.tenantSlug as string, req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    /** Public: create lead via resolved tenant (Host header) */
    async createPublicFromHost(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.createPublic(req.tenant!.slug, req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    /** Public: create an unassigned website lead (central pool) */
    async createUnassigned(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.createUnassigned(req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    /** Authenticated: create lead */
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.create(req.tenant!.id, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.getById(req.tenant!.id, req.params.leadId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.update(req.tenant!.id, req.params.leadId as string, req.body, req.user!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async assign(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.assign(req.tenant!.id, req.params.leadId as string, req.body.assignedToId, req.user!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async convert(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await leadsService.convert(req.tenant!.id, req.params.leadId as string, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const leadsController = new LeadsController();
