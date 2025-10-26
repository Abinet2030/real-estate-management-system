import express from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';

// Use in-memory storage to keep files in RAM then upload to Blob
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed'));
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

    const uploads = await Promise.all(
      files.map(async (f) => {
        const safeName = (f.originalname || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
        const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
        const objectName = `${unique}_${safeName}`;

        const result = await put(objectName, f.buffer, {
          access: 'public',
          contentType: f.mimetype || 'application/octet-stream',
        });
        return result.url; // absolute URL
      })
    );

    res.status(201).json({ urls: uploads });
  } catch (err) {
    console.error('POST /uploads/images error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
