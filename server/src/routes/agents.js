import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// GET /api/agents  (supports ?scope=international)
router.get('/', async (req, res) => {
  try {
    const { scope } = req.query || {}
    const filter = { role: 'agent', status: 'active' }
    if (String(scope || '').toLowerCase() === 'international') {
      const home = process.env.DEFAULT_COUNTRY || 'Ethiopia'
      filter['address.country'] = { $ne: home }
    }
    const agents = await User.find(filter, { passwordHash: 0 }).sort({ createdAt: -1 });
    res.json(agents);
  } catch (err) {
    console.error('GET /agents error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/agents/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid agent id' })
    }
    const agent = await User.findById(id, { passwordHash: 0 });
    if (!agent || agent.role !== 'agent') return res.status(404).json({ error: 'Not found' });
    res.json(agent);
  } catch (err) {
    console.error('GET /agents/:id error:', err?.message || err);
    // In development, avoid breaking the UI with 500s on transient DB issues
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
