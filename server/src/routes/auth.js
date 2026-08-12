import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getPostgresPool } from '../lib/postgres.js';

const router = express.Router();

function signToken(user) {
  const id = user.id || user._id;
  const payload = { sub: id.toString(), role: user.role, email: user.email, name: user.name };
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

// Public registration is deliberately disabled: Relstate is managed by one administrator.
router.post('/register', async (req, res) => {
  return res.status(403).json({ error: 'Registration is disabled. This site is managed by an administrator.' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = (email || '').toLowerCase().trim();
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = process.env.DATABASE_URL
      ? (await getPostgresPool().query(
          `SELECT id, name, email, password_hash, 'admin' AS role, 'active' AS status
           FROM administrators WHERE LOWER(email) = $1`,
          [email],
        )).rows[0]
      : await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Only the administrator can sign in' });

    // Defensive check: if passwordHash is missing (e.g., legacy or malformed record),
    // avoid throwing inside bcrypt and respond with a safe 401.
    const passwordHash = user.password_hash || user.passwordHash;
    if (!passwordHash) {
      console.warn('Login attempt for user without password hash:', { email: user.email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    const safeUser = { id: user.id || user._id, name: user.name, email: user.email, role: user.role, status: user.status, phone: user.phone, address: user.address, agentCode: user.agentCode };

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
