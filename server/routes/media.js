import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Files live in server/uploads (one level above src)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const router = express.Router();

// GET /api/media?ownerId=... (ownerId is reserved for future use; currently we list all files)
router.get('/', async (_req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) return res.json([]);
    const files = await fs.promises.readdir(uploadsDir);
    const items = await Promise.all(
      files.map(async (name) => {
        const full = path.join(uploadsDir, name);
        const stat = await fs.promises.stat(full);
        if (!stat.isFile()) return null;
        return {
          filename: name,
          url: `/uploads/${name}`,
          size: stat.size,
          modifiedAt: stat.mtime,
        };
      })
    );
    res.json(items.filter(Boolean));
  } catch (err) {
    console.error('GET /media error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
