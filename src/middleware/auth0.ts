import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Cached JWKS remote key set – reuses connections and refreshes
 * keys automatically when Auth0 rotates them.
 */
let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJWKS() {
    if (!jwks) {
        const jwksUrl = new URL(`https://${config.auth0.domain}/.well-known/jwks.json`);
        jwks = jose.createRemoteJWKSet(jwksUrl);
    }
    return jwks;
}

export interface Auth0TokenPayload {
    sub: string;   // Auth0 user id  (e.g. "auth0|abc123")
    email?: string;
    email_verified?: boolean;
}

/**
 * Middleware that verifies an Auth0 JWT access token (RS256).
 *
 * On success it attaches `req.auth0User` with the decoded token
 * claims so downstream handlers can look up / create the local
 * user record.
 *
 * This does NOT set `req.user` – the route handler is responsible
 * for matching the Auth0 identity to a local user.
 */
export async function authenticateAuth0(req: Request, _res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or malformed authorization header');
        }

        const token = authHeader.slice(7);

        // Accept both access tokens (API audience) and id_tokens (client_id audience)
        let payload: jose.JWTPayload;
        try {
            ({ payload } = await jose.jwtVerify(token, getJWKS(), {
                issuer: `https://${config.auth0.domain}/`,
                audience: config.auth0.audience,
            }));
        } catch {
            ({ payload } = await jose.jwtVerify(token, getJWKS(), {
                issuer: `https://${config.auth0.domain}/`,
            }));
        }

        if (!payload.sub) {
            throw new UnauthorizedError('Token missing sub claim');
        }

        // Attach decoded Auth0 info to request
        (req as any).auth0User = {
            sub: payload.sub,
            email: (payload as any).email ?? (payload as any)['https://swarshala.com/email'],
            email_verified: (payload as any).email_verified ?? true,
        } as Auth0TokenPayload;

        next();
    } catch (err: any) {
        logger.warn({ error: err.message }, 'Auth0 token verification failed');
        if (err instanceof UnauthorizedError) return next(err);
        return next(new UnauthorizedError('Invalid or expired Auth0 token'));
    }
}
