import { Request, Response, NextFunction } from 'express';
import { platformService } from './platform.service';

export class PlatformController {
    async listLeads(req: Request, res: Response, next: NextFunction) {
        try {
            res.json(await platformService.listLeads(req.query as any));
        } catch (err) {
            next(err);
        }
    }

    async assignLead(req: Request, res: Response, next: NextFunction) {
        try {
            res.json(await platformService.assignLead(req.params.leadId as string, req.body.tenantId));
        } catch (err) {
            next(err);
        }
    }

    async listContacts(req: Request, res: Response, next: NextFunction) {
        try {
            res.json(await platformService.listContacts(req.query as any));
        } catch (err) {
            next(err);
        }
    }

    async listAdmins(_req: Request, res: Response, next: NextFunction) {
        try {
            res.json(await platformService.listAdmins());
        } catch (err) {
            next(err);
        }
    }

    async createAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            res.status(201).json(await platformService.createAdmin(req.body));
        } catch (err) {
            next(err);
        }
    }
}

export const platformController = new PlatformController();
