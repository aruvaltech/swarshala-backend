import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';

export class ProductsController {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await productsService.list(req.tenant!.id, req.query as any);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await productsService.getById(req.tenant!.id, req.params.productId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await productsService.create(req.tenant!.id, req.body);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await productsService.update(req.tenant!.id, req.params.productId as string, req.body);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await productsService.remove(req.tenant!.id, req.params.productId as string);
            res.json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const productsController = new ProductsController();
