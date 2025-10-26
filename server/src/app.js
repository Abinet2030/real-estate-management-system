import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './lib/db.js';
import { seedAdminIfNeeded } from './lib/seed.js';
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

// Ensure DB is connected on first request (cached across invocations)
let bootstrapped = false;
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    if (!bootstrapped) {
      await seedAdminIfNeeded();
      bootstrapped = true;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// In serverless we won't use local uploads dir; still keep static for local dev if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// Routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/properties', propertiesRouter);
app.use('/uploads', uploadsRouter);
app.use('/inquiries', inquiriesRouter);
app.use('/offers', offersRouter);
app.use('/media', mediaRouter);
app.use('/agents', agentsRouter);
app.use('/support', supportRouter);

export default app;
