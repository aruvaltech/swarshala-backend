import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/app';

const app = createApp();

// Vercel routes every path here (see routes in vercel.json); delegate to Express.
export default function handler(req: IncomingMessage, res: ServerResponse) {
    if (!req.url) req.url = '/';
    (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
