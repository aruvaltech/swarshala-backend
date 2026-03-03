import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './db/client';

async function main() {
    const app = createApp();

    // Verify DB connection
    try {
        await prisma.$connect();
        logger.info('Connected to PostgreSQL');
    } catch (err) {
        logger.fatal({ err }, 'Failed to connect to database');
        process.exit(1);
    }

    const server = app.listen(config.port, () => {
        logger.info({ port: config.port, env: config.nodeEnv }, `SwarShala backend is running`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info({ signal }, 'Received shutdown signal');
        server.close(async () => {
            await prisma.$disconnect();
            logger.info('Server stopped');
            process.exit(0);
        });

        // Force exit after 10s
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10_000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (err) => {
        logger.error({ err }, 'Unhandled rejection');
    });

    process.on('uncaughtException', (err) => {
        logger.fatal({ err }, 'Uncaught exception');
        process.exit(1);
    });
}

main();
