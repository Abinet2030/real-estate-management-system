import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function seedAdminIfNeeded() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password) return; // seeding disabled

  const existing = await User.findOne({ email });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, passwordHash, role: 'admin' });
  console.log(`Seeded admin user: ${email}`);
}
