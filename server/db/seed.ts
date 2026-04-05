/**
 * server/db/seed.ts — One-time migration from flat-file JSON to PostgreSQL.
 *
 * Run ONCE after setting up the database:
 *   npx tsx server/db/seed.ts
 *
 * Safe to re-run — uses ON CONFLICT DO NOTHING / DO UPDATE throughout.
 * Imports:
 *   data/users.json          → users table
 *   data/subscribers.json    → subscribers table
 *   data/ratings.json        → ratings table
 *   data/windows/*.json      → scoring_windows table
 */

import 'dotenv/config';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';
import { migrate } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..', '..');
const DATA       = path.join(ROOT, 'data');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJsonSafe<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

// ─── Seed users ───────────────────────────────────────────────────────────────

async function seedUsers(): Promise<number> {
  const raw = readJsonSafe<Record<string, Record<string, unknown>>>(
    path.join(DATA, 'users.json'), {},
  );
  const users = Object.values(raw);
  if (users.length === 0) { console.log('  users.json — empty, skipping'); return 0; }

  let count = 0;
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (
         uid, email, display_name, photo_url,
         birth_date, birth_time, lat, lng, location_name,
         free_until, paid_until, telegram_chat_id,
         created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (uid) DO NOTHING`,
      [
        u.uid, u.email, u.displayName ?? null, u.photoURL ?? null,
        u.birthDate ?? null, u.birthTime ?? null,
        u.lat ?? null, u.lng ?? null, u.locationName ?? null,
        u.freeUntil ?? null, u.paidUntil ?? null, u.telegramChatId ?? null,
        u.createdAt ?? new Date().toISOString(),
        u.updatedAt ?? new Date().toISOString(),
      ],
    );
    count++;
  }
  return count;
}

// ─── Seed subscribers ─────────────────────────────────────────────────────────

async function seedSubscribers(): Promise<number> {
  type Sub = { email: string; service?: string; joinedAt?: string };
  const subs = readJsonSafe<Sub[]>(path.join(DATA, 'subscribers.json'), []);
  if (subs.length === 0) { console.log('  subscribers.json — empty, skipping'); return 0; }

  let count = 0;
  for (const s of subs) {
    await pool.query(
      `INSERT INTO subscribers (email, service, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [s.email, s.service ?? null, s.joinedAt ?? new Date().toISOString()],
    );
    count++;
  }
  return count;
}

// ─── Seed ratings ─────────────────────────────────────────────────────────────

async function seedRatings(): Promise<number> {
  type Rating = {
    uid: string; date: string; hour: number; horaRuler: string;
    score: number; planets: string[]; rating: string; ratedAt: string;
  };
  const ratings = readJsonSafe<Rating[]>(path.join(DATA, 'ratings.json'), []);
  if (ratings.length === 0) { console.log('  ratings.json — empty, skipping'); return 0; }

  let count = 0;
  for (const r of ratings) {
    await pool.query(
      `INSERT INTO ratings (uid, date, hour, hora_ruler, score, planets, rating, rated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING`,
      [r.uid, r.date, r.hour, r.horaRuler, r.score, r.planets, r.rating, r.ratedAt],
    );
    count++;
  }
  return count;
}

// ─── Seed scoring windows ─────────────────────────────────────────────────────

async function seedWindows(): Promise<number> {
  const windowsDir = path.join(DATA, 'windows');
  if (!fs.existsSync(windowsDir)) { console.log('  data/windows/ — missing, skipping'); return 0; }

  const files = fs.readdirSync(windowsDir).filter(f => f.endsWith('.json'));
  let total = 0;

  for (const file of files) {
    const raw = readJsonSafe<{
      uid: string; birthDate: string; birthTime: string; lat: number; lng: number;
      calculatedAt: string; expiresAt: string;
      windows: Array<{ d: string; h: number; s: number; a: string; r: string; p: string[] }>;
    }>(path.join(windowsDir, file), null as never);

    if (!raw?.windows?.length) continue;

    const uid = raw.uid;
    let count = 0;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const w of raw.windows) {
        await client.query(
          `INSERT INTO scoring_windows
             (uid, date, hour, score, activity, hora_ruler, planets, is_morning,
              birth_date, birth_time, lat, lng, calculated_at, expires_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (uid, date, hour) DO NOTHING`,
          [
            uid, w.d, w.h, w.s, w.a, w.r,
            JSON.stringify(w.p ?? []),
            (w.h >= 4 && w.h <= 9),
            raw.birthDate, raw.birthTime, raw.lat, raw.lng,
            raw.calculatedAt, raw.expiresAt,
          ],
        );
        count++;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ✗ windows/${file}:`, err);
    } finally {
      client.release();
    }
    console.log(`  ✓ windows/${file} → ${count} rows`);
    total += count;
  }
  return total;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════');
  console.log(' Timeceptor — JSON → PostgreSQL seed');
  console.log('═══════════════════════════════════════\n');

  console.log('Running migrations...');
  await migrate();

  console.log('\nSeeding data from data/ ...');

  const [users, subs, ratings, windows] = await Promise.all([
    seedUsers(),
    seedSubscribers(),
    seedRatings(),
    seedWindows(),
  ]);

  console.log('\n─── Summary ───────────────────────────');
  console.log(`  users:            ${users}`);
  console.log(`  subscribers:      ${subs}`);
  console.log(`  ratings:          ${ratings}`);
  console.log(`  scoring_windows:  ${windows}`);
  console.log('───────────────────────────────────────');
  console.log('\n✓ Seed complete\n');

  await pool.end();
}

main().catch(err => {
  console.error('\n✗ Seed failed:', err);
  process.exit(1);
});
