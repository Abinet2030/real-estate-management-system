import app from '../src/app.js';

// Catch-all to handle /api/* paths and forward to Express
export default function handler(req, res) {
  return app(req, res);
}
