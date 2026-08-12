import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { DATABASE_URL, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD are required');
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false });
try {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await pool.query(
    `INSERT INTO administrators (name, email, password_hash)
     VALUES ($1, LOWER($2), $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
    [ADMIN_NAME || 'Administrator', ADMIN_EMAIL, passwordHash],
  );
  console.log(`Administrator account is ready: ${ADMIN_EMAIL}`);
} finally {
  await pool.end();
}
