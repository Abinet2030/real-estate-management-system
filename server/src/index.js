import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './lib/db.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import { seedAdminIfNeeded } from './lib/seed.js';
import propertiesRouter from './routes/properties.js';
import uploadsRouter from './routes/uploads.js';
import inquiriesRouter from './routes/inquiries.js';
import offersRouter from './routes/offers.js';
import mediaRouter from './routes/media.js';
import supportRouter from './routes/support.js';
import agentsRouter from './routes/agents.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
 

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Static files for uploaded images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
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

// Start server ONLY after DB is connected (with retry)
async function start() {
  const maxDelay = 30000; // cap backoff at 30s
  let attempt = 0;
  while (true) {
    try {
      await connectDB();
      await seedAdminIfNeeded();
      console.log('Database connected and seeded');
      break;
    } catch (err) {
      attempt += 1;
      const delay = Math.min(1000 * Math.pow(2, Math.min(attempt, 5)), maxDelay);
      const msg = err && err.message ? err.message : String(err);
      console.error(`DB connection failed (attempt ${attempt}). Retrying in ${Math.round(delay / 1000)}s...`, msg);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((e) => {
  console.error('Fatal startup error:', e);
  process.exit(1);
});
