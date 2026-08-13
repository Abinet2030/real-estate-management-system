import app from '../app.js';

// Vercel's Node runtime accepts an Express app directly. Wrapping it with
// serverless-http prevents the response from completing in this runtime.
export default app;
