import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

/**
 * Validate request body / query / params with a Zod schema.
 * Usage: validate({ body: someSchema, query: someQuerySchema })
 */
export function validate(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query) as any;
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params) as any;
            }
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                const formatted = err.errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                return next(new BadRequestError('Validation failed', formatted));
            }
            next(err);
        }
    };
}
