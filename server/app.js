import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { seedPostgresAdminIfNeeded } from './lib/seed-postgres.js';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import propertiesRouter from './routes/properties.js';
import uploadsRouter from './routes/uploads.js';
import inquiriesRouter from './routes/inquiries.js';
import offersRouter from './routes/offers.js';
import mediaRouter from './routes/media.js';
import supportRouter from './routes/support.js';
import agentsRouter from './routes/agents.js';
import { connectPostgres, getDatabaseUrl, getPostgresPool } from './lib/postgres.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check (placed before any DB initialization) — must return quickly in serverless.
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        env: process.env.NODE_ENV || 'development',
        postgres: getDatabaseUrl() ? 'configured' : 'not_configured'
    });
});

// Respond quickly to favicon requests to avoid hitting serverless timeouts.
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Root handler (fast)
app.get('/', (_req, res) => {
    res.send('API server is running. See /api/health');
});

// API root redirect
app.get(['/api', '/api/'], (_req, res) => {
    res.redirect('/api/health');
});

// Ensure PostgreSQL is connected on first request when a database is configured.
// Some deployments (like Vercel previews or temporary/public health checks) do not
// have DATABASE_URL set, and the app should still respond on /api/health.
let bootstrapped = false;

app.use(async (_req, _res, next) => {
    try {
        // Postgres: only ensure pool is created when configured. Avoid awaiting a live
        // connection on every request to prevent serverless cold-start timeouts.
        if (getDatabaseUrl()) {
            // instantiate pool synchronously (does not network-connect)
            getPostgresPool();

            // Only perform seeding when explicitly requested via env var to avoid
            // blocking startup in serverless environments.
            if (!bootstrapped && process.env.SEED_ON_BOOT === 'true') {
                // connect and seed; this may fail fast due to pool timeouts
                await connectPostgres();
                await seedPostgresAdminIfNeeded();
                bootstrapped = true;
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});

// In serverless we won't use local uploads directory;
// keep static uploads for local development if present.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
    '/api/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

// (health/root routes are declared earlier to avoid DB bootstrapping on health checks)

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/offers', offersRouter);
app.use('/api/media', mediaRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/support', supportRouter);

// Generic error handler to ensure JSON responses from the API
// This prevents serverless runtimes from returning opaque HTML/text errors
// and makes debugging in production easier.
app.use((err, _req, res, _next) => {
    console.error('Unhandled error in API:', err && err.stack ? err.stack : err);
    const isProd = (process.env.NODE_ENV || 'development').toLowerCase() === 'production';
    const status = err && err.status ? err.status : 500;
    const payload = isProd
        ? { error: { code: String(status), message: 'A server error has occurred' } }
        : { error: { message: err?.message || String(err), stack: err?.stack } };
    try {
        res.status(status).json(payload);
    } catch (e) {
        // In case response streaming fails, at least log the error
        console.error('Failed to send error response:', e);
    }
});

export default app;
