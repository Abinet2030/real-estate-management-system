import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/users  (supports ?role=&status= filters)
router.get('/', async (req, res) => {
  try {
    const { role, status } = req.query || {}
    const filter = {}
    if (role) filter.role = role
    if (status) filter.status = status
    const users = await User.find(filter, { passwordHash: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/users/pending-sellers
router.get('/pending-sellers', async (_req, res) => {
  try {
    const users = await User.find({ role: 'seller', status: 'pending' }, { passwordHash: 0 }).sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    console.error('GET /users/pending-sellers error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/users/pending-agents
router.get('/pending-agents', async (_req, res) => {
  try {
    const users = await User.find({ role: 'agent', status: 'pending' }, { passwordHash: 0 }).sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    console.error('GET /users/pending-agents error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { passwordHash: 0 });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    console.error('GET /users/:id error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/users/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.status = 'active';
    await user.save();
    const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone, address: user.address };
    res.json({ user: safeUser, message: 'User approved' });
  } catch (err) {
    console.error('POST /users/:id/approve error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/users/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.status = 'rejected';
    await user.save();
    const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone, address: user.address };
    res.json({ user: safeUser, message: 'User rejected' });
  } catch (err) {
    console.error('POST /users/:id/reject error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /users/:id error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
