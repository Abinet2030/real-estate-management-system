import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import { getPostgresPool } from '../lib/postgres.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/support  { name, email, senderAddress?, subject, message, userId? }
router.post('/', async (req, res) => {
  try {
    const { name, email, senderAddress = '', subject = '', message = '', userId } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email and message are required' });
    if (process.env.DATABASE_URL) {
      const { rows } = await getPostgresPool().query(
        `INSERT INTO support_tickets (user_id, name, email, sender_address, subject, message, last_activity_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [isUuid(userId) ? userId : null, String(name).trim(), String(email).trim().toLowerCase(), String(senderAddress).trim().slice(0, 500), String(subject).trim(), String(message).trim()],
      );
      return res.status(201).json({ id: rows[0].id });
    }
    const ticket = await SupportTicket.create({ name, email, senderAddress, subject, message, userId, lastActivityAt: new Date() });
    res.status(201).json({ id: ticket._id });
  } catch (err) {
    console.error('POST /support error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/support?status=open|resolved|archived (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query || {};
    if (status && !['open', 'resolved', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (process.env.DATABASE_URL) {
      const values = [];
      const where = status ? 'WHERE status = $1' : '';
      if (status) values.push(status);
      const { rows } = await getPostgresPool().query(
        `SELECT id, user_id AS "userId", name, email, sender_address AS "senderAddress", subject, message, status,
                last_activity_at AS "lastActivityAt", created_at AS "createdAt", updated_at AS "updatedAt"
         FROM support_tickets ${where} ORDER BY last_activity_at DESC, created_at DESC`,
        values,
      );
      return res.json(rows);
    }
    const filter = status ? { status } : {};
    const items = await SupportTicket.find(filter).sort({ lastActivityAt: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('GET /support error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/support/:id/resolve
router.post('/:id/resolve', requireAdmin, async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const { rowCount } = await getPostgresPool().query(
        `UPDATE support_tickets
         SET status = 'resolved', last_activity_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [req.params.id],
      );
      if (!rowCount) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true });
    }
    const t = await SupportTicket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    t.status = 'resolved';
    t.lastActivityAt = new Date();
    await t.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /support/:id/resolve error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default router;
