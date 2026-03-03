import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';

export interface AccessTokenPayload {
    sub: string;      // user id
    tid: string;      // tenant id
    role: string;
    email: string;
}

export interface RefreshTokenPayload {
    sub: string;
    jti: string;      // token id for rotation
}

/** Sign an access token */
export function signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn,
    } as jwt.SignOptions);
}

/** Sign a refresh token */
export function signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);
}

/** Verify access token */
export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
}

/** Verify refresh token */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}

/** Hash a token value for DB storage (SHA-256) */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/** Generate a random token string */
export function generateRandomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
}

/** Parse "7d" / "15m" etc. into milliseconds */
export function parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // default 15min
    const val = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return val * (multipliers[unit] ?? 60_000);
}
