import express from 'express';
import SupportTicket from '../models/SupportTicket.js';

const router = express.Router();

// POST /api/support  { name, email, subject, message, userId? }
router.post('/', async (req, res) => {
  try {
    const { name, email, subject = '', message = '', userId } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email and message are required' });
    const ticket = await SupportTicket.create({ name, email, subject, message, userId, lastActivityAt: new Date() });
    res.status(201).json({ id: ticket._id });
  } catch (err) {
    console.error('POST /support error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/support?status=open|resolved|archived (admin)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query || {};
    const filter = status ? { status } : {};
    const items = await SupportTicket.find(filter).sort({ lastActivityAt: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('GET /support error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/support/:id/resolve
router.post('/:id/resolve', async (req, res) => {
  try {
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

export default router;
