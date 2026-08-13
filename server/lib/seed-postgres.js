import bcrypt from 'bcryptjs';
import { getPostgresPool } from './postgres.js';

export async function seedPostgresAdminIfNeeded() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await getPostgresPool().query(
    `INSERT INTO administrators (name, email, password_hash)
     VALUES ($1, LOWER($2), $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
    [ADMIN_NAME || 'Administrator', ADMIN_EMAIL, passwordHash],
  );
  console.log(`PostgreSQL administrator is ready: ${ADMIN_EMAIL}`);
}
