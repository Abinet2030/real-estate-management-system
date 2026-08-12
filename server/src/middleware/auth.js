import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'dev_secret_change_me';

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Admin authentication is required' });
  try {
    const user = jwt.verify(token, secret());
    if (user.role !== 'admin') return res.status(403).json({ error: 'Administrator access is required' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session is invalid or has expired' });
  }
}
