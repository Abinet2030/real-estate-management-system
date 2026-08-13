import pg from 'pg';

const { Pool } = pg;
let pool;

export function getPostgresPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    const connTimeout = process.env.PG_CONNECTION_TIMEOUT_MS ? parseInt(process.env.PG_CONNECTION_TIMEOUT_MS, 10) : 2000;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      // Fail fast when the Postgres server is unreachable to avoid Vercel function timeouts
      connectionTimeoutMillis: connTimeout,
      // Keep clients healthy but not too long in idle
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function connectPostgres() {
  const client = await getPostgresPool().connect();
  client.release();
  return getPostgresPool();
}
