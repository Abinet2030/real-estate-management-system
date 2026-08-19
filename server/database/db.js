import pg from 'pg';

const { Pool } = pg;

let _pool = null;

function createPoolIfNeeded() {
  if (_pool) return _pool;

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) return null;

  _pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },

    // Important for Vercel
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 5
  });

  return _pool;
}

const poolProxy = {
  query: async (...args) => {
    const pool = createPoolIfNeeded();

    if (!pool) {
      throw new Error(
        "POSTGRES_URL or DATABASE_URL is not configured"
      );
    }

    return pool.query(...args);
  },

  connect: async () => {
    const pool = createPoolIfNeeded();

    if (!pool) {
      throw new Error(
        "POSTGRES_URL or DATABASE_URL is not configured"
      );
    }

    return pool.connect();
  }
};

export default poolProxy;