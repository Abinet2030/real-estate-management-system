import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectPostgres } from './lib/postgres.js';
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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Ensure PostgreSQL is connected on first request
// Connection is cached across serverless invocations
let bootstrapped = false;

app.use(async (_req, _res, next) => {
    try {
        await connectPostgres();

        if (!bootstrapped) {
            await seedPostgresAdminIfNeeded();
            bootstrapped = true;
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
    express.static(path.join(__dirname, '..', 'uploads'))
);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        env: process.env.NODE_ENV || 'development'
    });
});

// Root handler
app.get('/', (_req, res) => {
    res.send('API server is running. See /api/health');
});

// API root
app.get(['/api', '/api/'], (_req, res) => {
    res.redirect('/api/health');
});

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

export default app;