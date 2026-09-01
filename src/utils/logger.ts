import pino from 'pino';
import { config } from '../config';

// Pino throws if `level` is not a known level; guard against an empty/invalid LOG_LEVEL.
const PINO_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'];
const requestedLevel = config.logLevel.trim().toLowerCase();
const level = PINO_LEVELS.includes(requestedLevel) ? requestedLevel : 'info';

export const logger = pino({
    level,
    transport:
        config.nodeEnv === 'development'
            ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
            : undefined,
    base: { service: 'swarshala-backend' },
});
