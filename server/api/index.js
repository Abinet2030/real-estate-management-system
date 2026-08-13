import app from '../app.js';

// Handle the root /api path
export default function handler(req, res) {
  return app(req, res);
}
