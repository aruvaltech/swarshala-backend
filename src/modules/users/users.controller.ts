import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export class UsersController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await usersService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await usersService.getById(req.tenant!.id, req.params.userId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await usersService.create(req.tenant!.id, req.body, req.user!.id);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await usersService.update(req.tenant!.id, req.params.userId as string, req.body, req.user!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await usersService.remove(req.tenant!.id, req.params.userId as string, req.user!.id);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const usersController = new UsersController();
