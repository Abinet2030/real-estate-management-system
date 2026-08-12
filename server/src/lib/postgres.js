import pg from 'pg';

const { Pool } = pg;
let pool;

export function getPostgresPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function connectPostgres() {
  const client = await getPostgresPool().connect();
  client.release();
  return getPostgresPool();
}
