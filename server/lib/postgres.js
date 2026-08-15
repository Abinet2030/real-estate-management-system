import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

let pool;

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

export function getPostgresPool() {
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
  const client = await getPostgresPool().connect();
  client.release();
  return getPostgresPool();
}