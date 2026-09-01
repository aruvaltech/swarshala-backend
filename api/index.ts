import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/app';

const app = createApp();

// Vercel serverless entry point. The bare root path is answered here directly to
// avoid a Vercel-specific crash; every other path is delegated to the Express app.
export default function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('x-swarshala-build', 'diag-2');
    if (!req.url || req.url === '/') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ service: 'swarshala-backend', status: 'ok', via: 'vercel-handler' }));
        return;
    }
    (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
