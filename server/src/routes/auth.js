import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

function signToken(user) {
  const payload = { sub: user._id.toString(), role: user.role, email: user.email, name: user.name };
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role = 'buyer', phone, address } = req.body || {};
    email = (email || '').toLowerCase().trim();
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const isSellerLike = role === 'seller' || role === 'agent';
    const status = isSellerLike ? 'pending' : 'active';
    let agentCode;
    if (role === 'agent') {
      // Generate AG + 6-digit code, e.g., AG123456
      const six = Math.floor(100000 + Math.random() * 900000);
      agentCode = `AG${six}`;
    }
    const user = await User.create({ name, email, passwordHash, role, status, phone, address, ...(agentCode ? { agentCode } : {}) });

    // Do not return passwordHash
    const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone, address: user.address, agentCode: user.agentCode };
    const message = isSellerLike
      ? 'Registration received. Your account is pending admin approval.'
      : 'Registration successful.';
    return res.status(201).json({ user: safeUser, message });
  } catch (err) {
    // Duplicate key (race with pre-check or unique index violation)
    if (err && (err.code === 11000 || err.code === 11001)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    // Validation errors
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    // Database unavailable (mirror login behavior)
    const message = (err && typeof err.message === 'string') ? err.message.toLowerCase() : '';
    const isDbUnavailable =
      (err && (err.name === 'MongoServerSelectionError' || err.name === 'MongooseError')) ||
      message.includes('failed to connect') ||
      message.includes('connection timed out') ||
      message.includes('buffering timed out');
    console.error('POST /auth/register error:', err && err.message ? err.message : err);
    if (isDbUnavailable) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    }
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return res.status(500).json({ error: 'Internal Server Error', name: err?.name || 'Error', message: err?.message || '' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = (email || '').toLowerCase().trim();
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Defensive check: if passwordHash is missing (e.g., legacy or malformed record),
    // avoid throwing inside bcrypt and respond with a safe 401.
    if (!user.passwordHash) {
      console.warn('Login attempt for user without passwordHash:', { id: user._id?.toString?.(), email: user.email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone, address: user.address, agentCode: user.agentCode };

    return res.json({ token, user: safeUser });
  } catch (err) {
    // If DB is unavailable, avoid breaking the UI: respond with safe 401
    const message = (err && typeof err.message === 'string') ? err.message.toLowerCase() : '';
    const isDbUnavailable =
      (err && (err.name === 'MongoServerSelectionError' || err.name === 'MongooseError')) ||
      message.includes('failed to connect') ||
      message.includes('connection timed out') ||
      message.includes('buffering timed out');
    console.error('POST /auth/login error:', err && err.message ? err.message : err);
    if (isDbUnavailable) {
      return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    }
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      return res.status(500).json({ error: 'Internal Server Error', name: err?.name || 'Error', message: err?.message || '' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
