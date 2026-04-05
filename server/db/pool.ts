/**
 * server/db/pool.ts — PostgreSQL connection pool (singleton)
 *
 * All server code imports `pool` from here.
 * Configure via DATABASE_URL in .env:
 *   postgresql://user:pass@localhost:5432/timeceptor
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to your .env file.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max:                    10,   // max concurrent connections
  idleTimeoutMillis:   30000,   // close idle connections after 30s
  connectionTimeoutMillis: 5000, // error if no connection available in 5s
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[pg] Unexpected pool error:', err.message);
});

pool.on('connect', () => {
  // Uncomment to debug connection churn
  // console.debug('[pg] New client connected');
});

export default pool;
