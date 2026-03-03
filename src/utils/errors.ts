export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
        public details?: unknown,
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request', details?: unknown) {
        super(400, message, 'BAD_REQUEST', details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(entity = 'Resource') {
        super(404, `${entity} not found`, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(409, message, 'CONFLICT');
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests') {
        super(429, message, 'TOO_MANY_REQUESTS');
    }
}
