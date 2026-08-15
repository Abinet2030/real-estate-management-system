import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import propertiesRouter from './routes/properties.js';
import authRouter from './routes/auth.js';
import uploadsRouter from './routes/uploads.js';
import mediaRouter from './routes/media.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
  });
});

app.use('/api/properties', propertiesRouter);
app.use('/api/auth', authRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/media', mediaRouter);

// Serve uploaded files from /uploads/:filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.get('/uploads/:name', (req, res) => {
  const name = String(req.params.name || '');
  const filePath = path.join(uploadsDir, name);
  return res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending upload file', err);
      res.status(err.status || 404).send('Not found');
    }
  });
});

// Also serve via /api/uploads/:name for URLs returned by the API
app.get('/api/uploads/:name', (req, res) => {
  const name = String(req.params.name || '');
  const filePath = path.join(uploadsDir, name);
  return res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending upload file (api)', err);
      res.status(err.status || 404).send('Not found');
    }
  });
});

export default app;