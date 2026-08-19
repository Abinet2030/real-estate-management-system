import "dotenv/config";
import pg from "pg";
import createJsonDb from './jsonDb.js';

const { Pool } = pg;

let pool;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function useJsonDb() {
  return String(process.env.USE_JSON_DB || '').toLowerCase() === 'true';
}

export function getPostgresPool() {
  if (useJsonDb()) {
    return createJsonDb();
  }

  if (!pool) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("DATABASE_URL or POSTGRES_URL is required");
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    });
  }

  return pool;
}

export async function connectPostgres() {
  if (useJsonDb()) {
    return getPostgresPool();
  }
  const client = await getPostgresPool().connect();
  client.release();
  return getPostgresPool();
}