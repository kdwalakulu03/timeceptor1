/**
 * server/db/migrate.ts — Run schema migrations on startup.
 *
 * Idempotent — safe to run every time the server boots.
 * Uses IF NOT EXISTS / DO NOTHING patterns throughout.
 *
 * Tables:
 *   users            — Firebase-authed user profiles
 *   subscribers      — Email capture list
 *   ratings          — User session ratings (AI training data)
 *   scoring_windows  — Pre-calculated 90-day planetary windows
 *   cron_log         — Background job audit trail
 */

import pool from './pool.js';

const SCHEMA = /* sql */ `

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  uid              TEXT PRIMARY KEY,
  email            TEXT NOT NULL,
  display_name     TEXT,
  photo_url        TEXT,
  birth_date       TEXT,                 -- 'YYYY-MM-DD'
  birth_time       TEXT,                 -- 'HH:MM'
  lat              DOUBLE PRECISION,     -- home/current location
  lng              DOUBLE PRECISION,
  location_name    TEXT,
  free_until       TIMESTAMPTZ,          -- Phase 3 access gate
  paid_until       TIMESTAMPTZ,          -- Phase 3 paid gate
  telegram_chat_id TEXT,                 -- Phase 4 bot
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SUBSCRIBERS (email list)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  service    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RATINGS (session feedback → AI training)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id           BIGSERIAL PRIMARY KEY,
  uid          TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  date         TEXT NOT NULL,            -- 'YYYY-MM-DD'
  hour         SMALLINT NOT NULL,
  hora_ruler   TEXT NOT NULL,
  score        SMALLINT NOT NULL,
  planets      TEXT[] NOT NULL DEFAULT '{}',
  rating       TEXT NOT NULL CHECK (rating IN ('great', 'average', 'poor')),
  rated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ratings_uid_idx  ON ratings(uid);
CREATE INDEX IF NOT EXISTS ratings_date_idx ON ratings(date);

-- ─────────────────────────────────────────────────────────────────────────────
-- SCORING WINDOWS (pre-calculated planetary timing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scoring_windows (
  id            BIGSERIAL PRIMARY KEY,
  uid           TEXT NOT NULL,
  date          TEXT NOT NULL,           -- 'YYYY-MM-DD'
  hour          SMALLINT NOT NULL,       -- 0–23
  score         SMALLINT NOT NULL,       -- 0–100
  activity      TEXT NOT NULL,           -- physical|mental|social|creative|rest
  hora_ruler    TEXT NOT NULL,
  planets       JSONB NOT NULL DEFAULT '[]',
  is_morning    BOOLEAN NOT NULL DEFAULT FALSE,
  birth_date    TEXT NOT NULL,
  birth_time    TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  UNIQUE (uid, date, hour)
);
CREATE INDEX IF NOT EXISTS sw_uid_date_idx ON scoring_windows(uid, date);
CREATE INDEX IF NOT EXISTS sw_expires_idx  ON scoring_windows(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- NATAL CHARTS
-- Calculated once at signup from birth data + location. Never changes.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS natal_charts (
  uid          TEXT PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
  birth_date   TEXT NOT NULL,             -- 'YYYY-MM-DD'
  birth_time   TEXT NOT NULL,             -- 'HH:MM'
  lat          DOUBLE PRECISION NOT NULL, -- home/birth location for hora + sunrise
  lng          DOUBLE PRECISION NOT NULL,
  sun_long     DOUBLE PRECISION NOT NULL, -- sidereal longitudes (Lahiri)
  moon_long    DOUBLE PRECISION NOT NULL,
  mars_long    DOUBLE PRECISION NOT NULL,
  mercury_long DOUBLE PRECISION NOT NULL,
  jupiter_long DOUBLE PRECISION NOT NULL,
  venus_long   DOUBLE PRECISION NOT NULL,
  saturn_long  DOUBLE PRECISION NOT NULL,
  rahu_long    DOUBLE PRECISION NOT NULL,
  ketu_long    DOUBLE PRECISION NOT NULL,
  ascendant    DOUBLE PRECISION NOT NULL,
  ayanamsa     DOUBLE PRECISION NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRANSIT POSITIONS
-- Global. One row per UTC hour. Same positions for everyone on Earth.
-- Pre-calculate 1 year ahead via cron. 8,760 rows/year — tiny.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transit_positions (
  dt           TIMESTAMPTZ PRIMARY KEY,   -- UTC datetime (minutes=0, seconds=0)
  sun_long     DOUBLE PRECISION NOT NULL,
  moon_long    DOUBLE PRECISION NOT NULL, -- Moon moves ~0.54°/hr — must be hourly
  mars_long    DOUBLE PRECISION NOT NULL,
  mercury_long DOUBLE PRECISION NOT NULL,
  jupiter_long DOUBLE PRECISION NOT NULL,
  venus_long   DOUBLE PRECISION NOT NULL,
  saturn_long  DOUBLE PRECISION NOT NULL,
  rahu_long    DOUBLE PRECISION NOT NULL,
  ketu_long    DOUBLE PRECISION NOT NULL,
  ayanamsa     DOUBLE PRECISION NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USER SCORES  (natal_charts × transit_positions = score)
-- Generated by background job on signup and refreshed every 90 days.
-- Weekly view reads straight from here — zero computation at request time.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_scores (
  uid        TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  dt         TIMESTAMPTZ NOT NULL,        -- local wall-clock hour as UTC
  score      SMALLINT NOT NULL,           -- 0–100
  activity   TEXT NOT NULL,               -- physical|mental|social|creative|rest
  hora_lord  TEXT NOT NULL,               -- Mars|Sun|Jupiter|Venus|Moon|Mercury|Saturn
  planets    JSONB NOT NULL DEFAULT '[]', -- aspect signals detected e.g. ["Moon ☌ Mars"]
  is_morning BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (uid, dt)
);
-- The one index that matters — every query is uid + date range
CREATE INDEX IF NOT EXISTS idx_user_scores_uid_dt ON user_scores (uid, dt);

-- ─────────────────────────────────────────────────────────────────────────────
-- CRON LOG (background job audit)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cron_log (
  id         BIGSERIAL PRIMARY KEY,
  job        TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('ok', 'error')),
  detail     TEXT,
  ran_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS cron_log_job_idx ON cron_log(job, ran_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- DAY RATINGS (user feedback per day → AI training)
-- blame(1) → meh(2) → okay(3) → nice(4) → cheers(5)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS day_ratings (
  id              BIGSERIAL PRIMARY KEY,
  uid             TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  date            TEXT NOT NULL,              -- 'YYYY-MM-DD'
  service         TEXT NOT NULL DEFAULT 'yoga',
  predicted_avg   SMALLINT NOT NULL,          -- engine avg score that day
  predicted_peak  SMALLINT NOT NULL,          -- engine peak score
  user_rating     SMALLINT NOT NULL CHECK (user_rating BETWEEN 1 AND 5),
  prediction_grid JSONB NOT NULL DEFAULT '[]', -- full 24h window array
  rated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(uid, date, service)
);
CREATE INDEX IF NOT EXISTS day_ratings_uid_idx  ON day_ratings(uid);
CREATE INDEX IF NOT EXISTS day_ratings_date_idx ON day_ratings(date);

-- ─────────────────────────────────────────────────────────────────────────────
-- PUSH SUBSCRIPTIONS (Web Push for notifications)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         BIGSERIAL PRIMARY KEY,
  uid        TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  endpoint   TEXT UNIQUE NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS push_sub_uid_idx ON push_subscriptions(uid);

`;

export async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(SCHEMA);
    await client.query('COMMIT');
    console.log('[db] migrations applied ✓');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[db] migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Standalone entry — run via: npm run db:migrate
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  migrate()
    .then(() => { pool.end(); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}
