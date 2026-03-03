import dotenv from 'dotenv';
dotenv.config();

function env(key: string, fallback?: string): string {
    const val = process.env[key] ?? fallback;
    if (val === undefined) throw new Error(`Missing env var: ${key}`);
    return val;
}

export const config = {
    nodeEnv: env('NODE_ENV', 'production'),
    port: parseInt(env('PORT', '4000'), 10),
    baseDomain: env('BASE_DOMAIN', 'swarshala.com'),
    backendUrl: env('BACKEND_URL', 'https://api.swarshala.com'),

    databaseUrl: env('DATABASE_URL'),

    jwt: {
        accessSecret: env('JWT_ACCESS_SECRET', 'dev-access-secret-change-me-!!'),
        refreshSecret: env('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-!!'),
        accessExpiresIn: env('JWT_ACCESS_EXPIRES_IN', '15m'),
        refreshExpiresIn: env('JWT_REFRESH_EXPIRES_IN', '7d'),
    },

    cors: {
        origins: env('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(','),
    },

    rateLimit: {
        windowMs: parseInt(env('RATE_LIMIT_WINDOW_MS', '900000'), 10),
        max: parseInt(env('RATE_LIMIT_MAX', '100'), 10),
    },

    auth0: {
        domain: env('AUTH0_DOMAIN', ''),
        audience: env('AUTH0_AUDIENCE', 'https://api.swarshala.com'),
    },

    logLevel: env('LOG_LEVEL', 'info'),
} as const;
