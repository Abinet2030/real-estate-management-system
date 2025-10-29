import app from '../src/app.js';
import serverless from 'serverless-http';

// Wrap Express app for Vercel serverless
const handler = serverless(app);

// Catch-all to handle /api/* paths. In Vercel, this function lives at /api/[...all],
// so incoming URLs are relative (e.g., "/health"). Our Express app defines routes
// with a "/api" prefix, so we prefix the URL before delegating to Express.
export default function vercelHandler(req, res) {
  try {
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : `/${req.url}`);
    }
  } catch {}
  return handler(req, res);
}
