import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Property from '../models/Property.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

export async function seedFromFixtures() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const fixturesPath = path.join(__dirname, 'fixtures.json');
    if (!fs.existsSync(fixturesPath)) {
      return; // no fixtures, nothing to do
    }

    const raw = fs.readFileSync(fixturesPath, 'utf-8');
    const data = JSON.parse(raw);

    // Seed users
    const users = Array.isArray(data.users) ? data.users : [];
    const emailToId = new Map();
    for (const u of users) {
      if (!u?.email) continue;
      const existing = await User.findOne({ email: u.email.toLowerCase() });
      if (existing) {
        emailToId.set(existing.email, existing._id);
        continue;
      }

      const passwordPlain = u.password || '1234';
      const passwordHash = await bcrypt.hash(String(passwordPlain), 10);
      const created = await User.create({
        name: u.name || u.email.split('@')[0],
        email: u.email.toLowerCase(),
        passwordHash,
        role: u.role || 'buyer',
        status: u.status || 'active',
        phone: u.phone || undefined,
        address: u.address || undefined,
        profileImageUrl: u.profileImageUrl || undefined,
        bio: u.bio || undefined,
        linkedin: u.linkedin || undefined,
        telegram: u.telegram || undefined,
        agentCode: u.agentCode || undefined,
      });
      emailToId.set(created.email, created._id);
      console.log(`Seeded user: ${created.email} (${created.role})`);
    }

    // Seed properties
    const properties = Array.isArray(data.properties) ? data.properties : [];
    for (const p of properties) {
      if (!p?.title || (!p?.ownerEmail && !p?.agentEmail)) continue;
      const ownerId = p.ownerEmail ? emailToId.get(p.ownerEmail.toLowerCase()) || (await User.findOne({ email: p.ownerEmail.toLowerCase() })?._id) : undefined;
      const agentId = p.agentEmail ? emailToId.get(p.agentEmail.toLowerCase()) || (await User.findOne({ email: p.agentEmail.toLowerCase() })?._id) : undefined;

      // Skip if we cannot link to any user
      if (!ownerId && !agentId) continue;

      const existing = await Property.findOne({ title: p.title, ...(ownerId ? { ownerId } : {}) });
      if (existing) continue;

      await Property.create({
        title: p.title,
        description: p.description || '',
        price: Number(p.price) || 0,
        currency: p.currency || 'USD',
        type: p.type || 'house',
        bedrooms: Number(p.bedrooms) || 0,
        bathrooms: Number(p.bathrooms) || 0,
        areaSqm: Number(p.areaSqm) || 0,
        location: p.location || {},
        images: Array.isArray(p.images) ? p.images : [],
        ownerId: ownerId,
        agentId: agentId,
        status: p.status || 'pending',
      });
      console.log(`Seeded property: ${p.title}`);
    }
  } catch (err) {
    console.error('Fixture seeding failed:', err);
  }
}
