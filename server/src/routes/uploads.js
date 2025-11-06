import express from 'express';
import multer from 'multer';
import path from 'path';

// Store files on local disk under ../uploads (served statically from /api/uploads)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Save into server/uploads relative to this file
    cb(null, path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const safeName = (file.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}_${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!String(file.mimetype || '').startsWith('image/')) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

const router = express.Router();

// POST /api/uploads/images (multipart/form-data) field name: files
router.post('/images', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

    const base = `${req.protocol}://${req.get('host')}`;
    const urls = files.map((f) => `${base}/api/uploads/${f.filename}`);
    res.status(201).json({ urls });
  } catch (err) {
    console.error('POST /uploads/images error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
