import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        logger.warn({ err, path: req.path }, err.message);
        res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            },
        });
        return;
    }

    // Unexpected error
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
        },
    });
}
