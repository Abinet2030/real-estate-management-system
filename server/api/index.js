import serverless from 'serverless-http';
import app from '../src/app.js';

// Export a handler compatible with Vercel's Node runtime
export default serverless(app);
