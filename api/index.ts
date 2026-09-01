import { createApp } from '../src/app';

// Vercel serverless entry point — exports the Express app as the request handler.
// All routes are funneled here via the rewrite rule in vercel.json.
export default createApp();
