import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Save files to server/uploads (one level above src)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, unique + '_' + safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // accept images only
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB each, up to 10 files
});

const router = express.Router();

// POST /api/uploads/images (multipart/form-data) field name: files
router.post('/images', upload.array('files', 10), (req, res) => {
  try {
    const files = req.files || [];
    const urls = files.map((f) => `/uploads/${path.basename(f.path)}`);
    res.status(201).json({ urls });
  } catch (err) {
    console.error('POST /uploads/images error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
