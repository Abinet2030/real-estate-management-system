import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
let pool;

// Marketplace Postgres integrations commonly expose POSTGRES_URL.  Supporting
// DATABASE_URL too keeps local development and other Postgres providers simple.
export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function getPostgresPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) throw new Error('DATABASE_URL or POSTGRES_URL is required');
    const connTimeout = process.env.PG_CONNECTION_TIMEOUT_MS ? parseInt(process.env.PG_CONNECTION_TIMEOUT_MS, 10) : 2000;
    pool = new Pool({
      connectionString,
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
