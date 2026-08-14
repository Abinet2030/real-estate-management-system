import pg from 'pg';

const { Pool } = pg;

// Lazily create the Pool only when a connection string is present and a query is
// actually performed. This prevents module-import-time failures in serverless
// environments (like Vercel) when DATABASE_URL / POSTGRES_URL is not configured.
let _pool = null;
function createPoolIfNeeded() {
  if (_pool) return _pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) return null;
  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  return _pool;
}

// Export a lightweight proxy with the same `query` method signature so existing
// imports that call `pool.query(...)` keep working. The actual Pool is created
// on first query attempt; if no DB is configured, a descriptive error is thrown
// at call time instead of during module import.
const poolProxy = {
  query: async (...args) => {
    const p = createPoolIfNeeded();
    if (!p) throw new Error('POSTGRES_URL or DATABASE_URL is not configured');
    return p.query(...args);
  },
  // expose connect for callers that may need it
  connect: async () => {
    const p = createPoolIfNeeded();
    if (!p) throw new Error('POSTGRES_URL or DATABASE_URL is not configured');
    return p.connect();
  }
};

export default poolProxy;