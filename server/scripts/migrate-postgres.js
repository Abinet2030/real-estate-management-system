import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required. Example: postgresql://postgres:password@localhost:5432/relstate');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'relstate.sql'), 'utf8');
const pool = new pg.Pool({ connectionString, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false });

try {
  await pool.query(sql);
  console.log('PostgreSQL schema is ready: relstate');
} finally {
  await pool.end();
}
