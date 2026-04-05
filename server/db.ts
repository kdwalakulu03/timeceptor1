/**
 * server/db.ts — Timeceptor database layer (PostgreSQL)
 *
 * All methods are async. Routes must await them.
 *
 * Tables (managed by server/db/migrate.ts):
 *   users            — user profiles, keyed by Firebase UID
 *   subscribers      — email capture list
 *   ratings          — session ratings for AI training (Phase 5)
 *   scoring_windows  — pre-calculated 90-day windows
 *   cron_log         — background job audit trail
 *
 * Connection: DATABASE_URL in .env
 *   postgresql://user:pass@localhost:5432/timeceptor
 */

import pool from './db/pool.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid:            string;
  email:          string;
  displayName:    string | null;
  photoURL:       string | null;
  birthDate:      string | null;   // 'YYYY-MM-DD'
  birthTime:      string | null;   // 'HH:MM'
  lat:            number | null;
  lng:            number | null;
  locationName:   string | null;
  freeUntil:      string | null;   // ISO string
  paidUntil:      string | null;   // ISO string
  telegramChatId: string | null;
  createdAt:      string;
  updatedAt:      string;
}

export interface SessionRating {
  uid:       string;
  date:      string;   // 'YYYY-MM-DD'
  hour:      number;
  horaRuler: string;
  score:     number;
  planets:   string[];
  rating:    'great' | 'average' | 'poor';
  ratedAt:   string;
}

export interface DayRatingEntry {
  uid:            string;
  date:           string;   // 'YYYY-MM-DD'
  service:        string;   // yoga|meditation|business|…
  predictedAvg:   number;   // engine avg score that day
  predictedPeak:  number;   // engine peak score
  userRating:     number;   // 1=blame, 2=meh, 3=okay, 4=nice, 5=cheers
  predictionGrid: object[]; // full 24h window data
  ratedAt:        string;
}

export interface ScoringWindow {
  uid:          string;
  date:         string;
  hour:         number;
  score:        number;
  activity:     string;
  horaRuler:    string;
  planets:      string[];
  isMorning:    boolean;
  birthDate:    string;
  birthTime:    string;
  lat:          number;
  lng:          number;
  calculatedAt: string;
  expiresAt:    string;
}

// ── Row → type mappers ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(r: any): UserProfile {
  return {
    uid:            r.uid,
    email:          r.email,
    displayName:    r.display_name   ?? null,
    photoURL:       r.photo_url      ?? null,
    birthDate:      r.birth_date     ?? null,
    birthTime:      r.birth_time     ?? null,
    lat:            r.lat            ?? null,
    lng:            r.lng            ?? null,
    locationName:   r.location_name  ?? null,
    freeUntil:      r.free_until     ? new Date(r.free_until).toISOString()  : null,
    paidUntil:      r.paid_until     ? new Date(r.paid_until).toISOString()  : null,
    telegramChatId: r.telegram_chat_id ?? null,
    createdAt:      new Date(r.created_at).toISOString(),
    updatedAt:      new Date(r.updated_at).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRating(r: any): SessionRating {
  return {
    uid:       r.uid,
    date:      r.date,
    hour:      r.hour,
    horaRuler: r.hora_ruler,
    score:     r.score,
    planets:   r.planets ?? [],
    rating:    r.rating,
    ratedAt:   new Date(r.rated_at).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDayRating(r: any): DayRatingEntry {
  return {
    uid:            r.uid,
    date:           r.date,
    service:        r.service,
    predictedAvg:   r.predicted_avg,
    predictedPeak:  r.predicted_peak,
    userRating:     r.user_rating,
    predictionGrid: r.prediction_grid ?? [],
    ratedAt:        new Date(r.rated_at).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToWindow(r: any): ScoringWindow {
  return {
    uid:          r.uid,
    date:         r.date,
    hour:         r.hour,
    score:        r.score,
    activity:     r.activity,
    horaRuler:    r.hora_ruler,
    planets:      r.planets ?? [],
    isMorning:    r.is_morning,
    birthDate:    r.birth_date,
    birthTime:    r.birth_time,
    lat:          r.lat,
    lng:          r.lng,
    calculatedAt: new Date(r.calculated_at).toISOString(),
    expiresAt:    new Date(r.expires_at).toISOString(),
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const Users = {
  async get(uid: string): Promise<UserProfile | null> {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE uid = $1',
      [uid],
    );
    return rows[0] ? rowToUser(rows[0]) : null;
  },

  async upsert(uid: string, patch: Partial<UserProfile>): Promise<UserProfile> {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { rows } = await pool.query(
      `INSERT INTO users (
         uid, email, display_name, photo_url,
         birth_date, birth_time, lat, lng, location_name,
         free_until, paid_until, telegram_chat_id,
         created_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       ON CONFLICT (uid) DO UPDATE SET
         email            = COALESCE(EXCLUDED.email,            users.email),
         display_name     = COALESCE(EXCLUDED.display_name,     users.display_name),
         photo_url        = COALESCE(EXCLUDED.photo_url,        users.photo_url),
         birth_date       = COALESCE(EXCLUDED.birth_date,       users.birth_date),
         birth_time       = COALESCE(EXCLUDED.birth_time,       users.birth_time),
         lat              = COALESCE(EXCLUDED.lat,              users.lat),
         lng              = COALESCE(EXCLUDED.lng,              users.lng),
         location_name    = COALESCE(EXCLUDED.location_name,    users.location_name),
         paid_until       = COALESCE(EXCLUDED.paid_until,       users.paid_until),
         telegram_chat_id = COALESCE(EXCLUDED.telegram_chat_id, users.telegram_chat_id),
         updated_at       = NOW()
       RETURNING *`,
      [
        uid,
        patch.email          ?? '',
        patch.displayName    ?? null,
        patch.photoURL       ?? null,
        patch.birthDate      ?? null,
        patch.birthTime      ?? null,
        patch.lat            ?? null,
        patch.lng            ?? null,
        patch.locationName   ?? null,
        patch.freeUntil      ?? threeDays.toISOString(),  // new users get 3-day free trial
        patch.paidUntil      ?? null,
        patch.telegramChatId ?? null,
      ],
    );

    console.log(`[db] user upserted uid=${uid}`);
    return rowToUser(rows[0]);
  },

  async list(): Promise<UserProfile[]> {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(rowToUser);
  },

  async delete(uid: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM users WHERE uid = $1', [uid]);
    return (rowCount ?? 0) > 0;
  },

  /** Set telegram_chat_id for Phase 4 bot link */
  async setTelegramChatId(uid: string, chatId: string): Promise<void> {
    await pool.query(
      'UPDATE users SET telegram_chat_id = $1, updated_at = NOW() WHERE uid = $2',
      [chatId, uid],
    );
  },

  /** Set paid_until after Stripe payment confirmation */
  async setPaidUntil(uid: string, paidUntil: string): Promise<void> {
    await pool.query(
      'UPDATE users SET paid_until = $1, updated_at = NOW() WHERE uid = $2',
      [paidUntil, uid],
    );
    console.log(`[db] paid_until set uid=${uid} until=${paidUntil}`);
  },

  /** Refresh free_until to now + 3 days (rolling free window on every visit) */
  async refreshFreeUntil(uid: string): Promise<void> {
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET free_until = $1, updated_at = NOW() WHERE uid = $2',
      [threeDays.toISOString(), uid],
    );
  },
};

// ── Ratings ───────────────────────────────────────────────────────────────────

export const Ratings = {
  async add(entry: SessionRating): Promise<void> {
    await pool.query(
      `INSERT INTO ratings (uid, date, hour, hora_ruler, score, planets, rating, rated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.uid,
        entry.date,
        entry.hour,
        entry.horaRuler,
        entry.score,
        entry.planets,
        entry.rating,
        entry.ratedAt,
      ],
    );
    console.log(`[db] rating saved uid=${entry.uid} date=${entry.date} h=${entry.hour} → ${entry.rating}`);
  },

  async forUser(uid: string): Promise<SessionRating[]> {
    const { rows } = await pool.query(
      'SELECT * FROM ratings WHERE uid = $1 ORDER BY rated_at DESC',
      [uid],
    );
    return rows.map(rowToRating);
  },

  /** Accuracy %: great / total × 100 */
  async accuracy(uid: string): Promise<number> {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                                      AS total,
         COUNT(*) FILTER (WHERE rating = 'great')     AS great
       FROM ratings WHERE uid = $1`,
      [uid],
    );
    const { total, great } = rows[0];
    if (Number(total) === 0) return 0;
    return Math.round((Number(great) / Number(total)) * 100);
  },

  /** All ratings — for AI training data export */
  async all(): Promise<SessionRating[]> {
    const { rows } = await pool.query('SELECT * FROM ratings ORDER BY rated_at DESC');
    return rows.map(rowToRating);
  },
};

// ── Day Ratings (per-day user feedback for AI training) ───────────────────────

export const DayRatings = {
  /** Upsert a day rating: replaces existing rating for same uid+date+service */
  async upsert(entry: DayRatingEntry): Promise<void> {
    await pool.query(
      `INSERT INTO day_ratings (uid, date, service, predicted_avg, predicted_peak, user_rating, prediction_grid, rated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (uid, date, service) DO UPDATE SET
         predicted_avg   = EXCLUDED.predicted_avg,
         predicted_peak  = EXCLUDED.predicted_peak,
         user_rating     = EXCLUDED.user_rating,
         prediction_grid = EXCLUDED.prediction_grid,
         rated_at        = EXCLUDED.rated_at`,
      [
        entry.uid,
        entry.date,
        entry.service,
        entry.predictedAvg,
        entry.predictedPeak,
        entry.userRating,
        JSON.stringify(entry.predictionGrid),
        entry.ratedAt,
      ],
    );
    console.log(`[db] day_rating saved uid=${entry.uid} date=${entry.date} service=${entry.service} → ${entry.userRating}/5`);
  },

  /** Get all day ratings for a user (newest first) */
  async forUser(uid: string): Promise<DayRatingEntry[]> {
    const { rows } = await pool.query(
      'SELECT * FROM day_ratings WHERE uid = $1 ORDER BY date DESC',
      [uid],
    );
    return rows.map(rowToDayRating);
  },

  /** Get ratings for a specific user + date range (for loading into WeeklyView) */
  async forUserWeek(uid: string, dates: string[]): Promise<Record<string, number>> {
    if (dates.length === 0) return {};
    const { rows } = await pool.query(
      'SELECT date, service, user_rating FROM day_ratings WHERE uid = $1 AND date = ANY($2)',
      [uid, dates],
    );
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[`${r.date}_${r.service}`] = r.user_rating;
    }
    return map;
  },

  /** AI training export: all day ratings with full prediction grids */
  async all(): Promise<DayRatingEntry[]> {
    const { rows } = await pool.query('SELECT * FROM day_ratings ORDER BY rated_at DESC');
    return rows.map(rowToDayRating);
  },

  /** Average user rating for a given user (to track satisfaction over time) */
  async avgRating(uid: string): Promise<number> {
    const { rows } = await pool.query(
      'SELECT AVG(user_rating)::numeric(3,1) AS avg FROM day_ratings WHERE uid = $1',
      [uid],
    );
    return parseFloat(rows[0]?.avg ?? '0');
  },
};

// ── Scoring Windows ───────────────────────────────────────────────────────────

export const Windows = {
  /** True if non-expired windows exist for this uid */
  async hasValid(uid: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM scoring_windows
       WHERE uid = $1 AND expires_at > NOW()
       LIMIT 1`,
      [uid],
    );
    return rows.length > 0;
  },

  /** Bulk insert — replaces existing rows for uid (upsert on uid+date+hour) */
  async bulkUpsert(
    uid: string,
    windows: Array<{
      date: string; hour: number; score: number;
      activity: string; horaRuler: string; planets: string[];
      isMorning: boolean; birthDate: string; birthTime: string;
      lat: number; lng: number; expiresAt: string;
    }>,
  ): Promise<number> {
    if (windows.length === 0) return 0;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Delete stale rows for this uid so we always have fresh data
      await client.query('DELETE FROM scoring_windows WHERE uid = $1', [uid]);
      let count = 0;
      for (const w of windows) {
        await client.query(
          `INSERT INTO scoring_windows
             (uid, date, hour, score, activity, hora_ruler, planets, is_morning,
              birth_date, birth_time, lat, lng, calculated_at, expires_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13)
           ON CONFLICT (uid, date, hour) DO UPDATE SET
             score         = EXCLUDED.score,
             activity      = EXCLUDED.activity,
             hora_ruler    = EXCLUDED.hora_ruler,
             planets       = EXCLUDED.planets,
             is_morning    = EXCLUDED.is_morning,
             calculated_at = NOW(),
             expires_at    = EXCLUDED.expires_at`,
          [
            uid, w.date, w.hour, w.score, w.activity, w.horaRuler,
            JSON.stringify(w.planets), w.isMorning,
            w.birthDate, w.birthTime, w.lat, w.lng, w.expiresAt,
          ],
        );
        count++;
      }
      await client.query('COMMIT');
      console.log(`[db] windows upserted uid=${uid} count=${count}`);
      return count;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Fetch a date range — for weekly view, AI training, Telegram bot */
  async forRange(uid: string, fromDate: string, toDate: string): Promise<ScoringWindow[]> {
    const { rows } = await pool.query(
      `SELECT * FROM scoring_windows
       WHERE uid = $1 AND date >= $2 AND date <= $3
       ORDER BY date, hour`,
      [uid, fromDate, toDate],
    );
    return rows.map(rowToWindow);
  },

  async meta(uid: string): Promise<{
    exists: boolean; calculatedAt: string | null;
    expiresAt: string | null; windowCount: number; isExpired: boolean;
  }> {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                AS count,
         MIN(calculated_at)      AS calculated_at,
         MAX(expires_at)         AS expires_at,
         BOOL_AND(expires_at < NOW()) AS is_expired
       FROM scoring_windows WHERE uid = $1`,
      [uid],
    );
    const r = rows[0];
    if (Number(r.count) === 0) {
      return { exists: false, calculatedAt: null, expiresAt: null, windowCount: 0, isExpired: false };
    }
    return {
      exists:       true,
      calculatedAt: new Date(r.calculated_at).toISOString(),
      expiresAt:    new Date(r.expires_at).toISOString(),
      windowCount:  Number(r.count),
      isExpired:    r.is_expired,
    };
  },
};

// ── Subscribers ───────────────────────────────────────────────────────────────

export const Subscribers = {
  async add(email: string, service?: string): Promise<'added' | 'duplicate'> {
    try {
      await pool.query(
        'INSERT INTO subscribers (email, service) VALUES ($1, $2)',
        [email, service ?? null],
      );
      console.log(`[db] subscriber added email=${email} service=${service}`);
      return 'added';
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
        return 'duplicate'; // unique violation
      }
      throw err;
    }
  },

  async list(): Promise<Array<{ email: string; service: string | null; createdAt: string }>> {
    const { rows } = await pool.query('SELECT * FROM subscribers ORDER BY created_at DESC');
    return rows.map(r => ({
      email:     r.email,
      service:   r.service,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  },

  async count(): Promise<number> {
    const { rows } = await pool.query('SELECT COUNT(*) AS n FROM subscribers');
    return Number(rows[0].n);
  },
};

// ── Cron log ──────────────────────────────────────────────────────────────────

export const CronLog = {
  async record(job: string, status: 'ok' | 'error', detail?: string): Promise<void> {
    await pool.query(
      'INSERT INTO cron_log (job, status, detail) VALUES ($1, $2, $3)',
      [job, status, detail ?? null],
    );
  },
  async recent(job: string, limit = 20): Promise<Array<{ status: string; detail: string | null; ranAt: string }>> {
    const { rows } = await pool.query(
      'SELECT status, detail, ran_at FROM cron_log WHERE job = $1 ORDER BY ran_at DESC LIMIT $2',
      [job, limit],
    );
    return rows.map(r => ({ status: r.status, detail: r.detail, ranAt: new Date(r.ran_at).toISOString() }));
  },
};

// Re-export the pool for raw queries in special cases
export { default as pool } from './db/pool.js';

// Re-export migrate for server startup
export { migrate } from './db/migrate.js';

// ── Natal Charts ──────────────────────────────────────────────────────────────

export interface NatalChart {
  uid:         string;
  birthDate:   string;
  birthTime:   string;
  lat:         number;
  lng:         number;
  sunLong:     number;
  moonLong:    number;
  marsLong:    number;
  mercuryLong: number;
  jupiterLong: number;
  venusLong:   number;
  saturnLong:  number;
  rahuLong:    number;
  ketuLong:    number;
  ascendant:   number;
  ayanamsa:    number;
  createdAt:   string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNatal(r: any): NatalChart {
  return {
    uid:         r.uid,
    birthDate:   r.birth_date,
    birthTime:   r.birth_time,
    lat:         r.lat,
    lng:         r.lng,
    sunLong:     r.sun_long,
    moonLong:    r.moon_long,
    marsLong:    r.mars_long,
    mercuryLong: r.mercury_long,
    jupiterLong: r.jupiter_long,
    venusLong:   r.venus_long,
    saturnLong:  r.saturn_long,
    rahuLong:    r.rahu_long,
    ketuLong:    r.ketu_long,
    ascendant:   r.ascendant,
    ayanamsa:    r.ayanamsa,
    createdAt:   new Date(r.created_at).toISOString(),
  };
}

export const NatalCharts = {
  async save(uid: string, data: Omit<NatalChart, 'uid' | 'createdAt'>): Promise<NatalChart> {
    const { rows } = await pool.query(
      `INSERT INTO natal_charts
         (uid, birth_date, birth_time, lat, lng,
          sun_long, moon_long, mars_long, mercury_long, jupiter_long,
          venus_long, saturn_long, rahu_long, ketu_long, ascendant, ayanamsa)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (uid) DO UPDATE SET
         birth_date   = EXCLUDED.birth_date,
         birth_time   = EXCLUDED.birth_time,
         lat          = EXCLUDED.lat,
         lng          = EXCLUDED.lng,
         sun_long     = EXCLUDED.sun_long,
         moon_long    = EXCLUDED.moon_long,
         mars_long    = EXCLUDED.mars_long,
         mercury_long = EXCLUDED.mercury_long,
         jupiter_long = EXCLUDED.jupiter_long,
         venus_long   = EXCLUDED.venus_long,
         saturn_long  = EXCLUDED.saturn_long,
         rahu_long    = EXCLUDED.rahu_long,
         ketu_long    = EXCLUDED.ketu_long,
         ascendant    = EXCLUDED.ascendant,
         ayanamsa     = EXCLUDED.ayanamsa
       RETURNING *`,
      [
        uid, data.birthDate, data.birthTime, data.lat, data.lng,
        data.sunLong, data.moonLong, data.marsLong, data.mercuryLong,
        data.jupiterLong, data.venusLong, data.saturnLong,
        data.rahuLong, data.ketuLong, data.ascendant, data.ayanamsa,
      ],
    );
    console.log(`[db] natal chart saved uid=${uid}`);
    return rowToNatal(rows[0]);
  },

  async get(uid: string): Promise<NatalChart | null> {
    const { rows } = await pool.query(
      'SELECT * FROM natal_charts WHERE uid = $1',
      [uid],
    );
    return rows[0] ? rowToNatal(rows[0]) : null;
  },
};

// ── Transit Positions ─────────────────────────────────────────────────────────

export interface TransitPosition {
  dt:          Date;
  sunLong:     number;
  moonLong:    number;
  marsLong:    number;
  mercuryLong: number;
  jupiterLong: number;
  venusLong:   number;
  saturnLong:  number;
  rahuLong:    number;
  ketuLong:    number;
  ayanamsa:    number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTransit(r: any): TransitPosition {
  return {
    dt:          new Date(r.dt),
    sunLong:     r.sun_long,
    moonLong:    r.moon_long,
    marsLong:    r.mars_long,
    mercuryLong: r.mercury_long,
    jupiterLong: r.jupiter_long,
    venusLong:   r.venus_long,
    saturnLong:  r.saturn_long,
    rahuLong:    r.rahu_long,
    ketuLong:    r.ketu_long,
    ayanamsa:    r.ayanamsa,
  };
}

export const TransitPositions = {
  async bulkUpsert(transits: TransitPosition[]): Promise<number> {
    if (transits.length === 0) return 0;
    const client = await pool.connect();
    let count = 0;
    try {
      await client.query('BEGIN');
      for (const t of transits) {
        await client.query(
          `INSERT INTO transit_positions
             (dt, sun_long, moon_long, mars_long, mercury_long, jupiter_long,
              venus_long, saturn_long, rahu_long, ketu_long, ayanamsa)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           ON CONFLICT (dt) DO UPDATE SET
             sun_long     = EXCLUDED.sun_long,
             moon_long    = EXCLUDED.moon_long,
             mars_long    = EXCLUDED.mars_long,
             mercury_long = EXCLUDED.mercury_long,
             jupiter_long = EXCLUDED.jupiter_long,
             venus_long   = EXCLUDED.venus_long,
             saturn_long  = EXCLUDED.saturn_long,
             rahu_long    = EXCLUDED.rahu_long,
             ketu_long    = EXCLUDED.ketu_long,
             ayanamsa     = EXCLUDED.ayanamsa,
             calculated_at = NOW()`,
          [
            t.dt.toISOString(), t.sunLong, t.moonLong, t.marsLong, t.mercuryLong,
            t.jupiterLong, t.venusLong, t.saturnLong, t.rahuLong, t.ketuLong, t.ayanamsa,
          ],
        );
        count++;
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return count;
  },

  async forRange(from: Date, to: Date): Promise<TransitPosition[]> {
    const { rows } = await pool.query(
      'SELECT * FROM transit_positions WHERE dt >= $1 AND dt < $2 ORDER BY dt',
      [from.toISOString(), to.toISOString()],
    );
    return rows.map(rowToTransit);
  },

  /** Latest dt in the table — used by prefill job to know how far ahead we've gone */
  async latestDt(): Promise<Date | null> {
    const { rows } = await pool.query('SELECT MAX(dt) AS dt FROM transit_positions');
    return rows[0]?.dt ? new Date(rows[0].dt) : null;
  },

  async count(): Promise<number> {
    const { rows } = await pool.query('SELECT COUNT(*) AS n FROM transit_positions');
    return Number(rows[0].n);
  },
};

// ── User Scores ───────────────────────────────────────────────────────────────

export interface UserScore {
  uid:       string;
  dt:        Date;
  score:     number;
  activity:  string;
  horaLord:  string;
  planets:   string[];
  isMorning: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUserScore(r: any): UserScore {
  return {
    uid:       r.uid,
    dt:        new Date(r.dt),
    score:     r.score,
    activity:  r.activity,
    horaLord:  r.hora_lord,
    planets:   r.planets ?? [],
    isMorning: r.is_morning,
  };
}

export const UserScores = {
  async bulkInsert(
    uid: string,
    scores: Array<{ dt: Date; score: number; activity: string; horaLord: string; planets: string[]; isMorning: boolean }>,
  ): Promise<number> {
    if (scores.length === 0) return 0;
    const client = await pool.connect();
    let count = 0;
    try {
      await client.query('BEGIN');
      // Delete existing scores for this uid and replace — always fresh
      await client.query('DELETE FROM user_scores WHERE uid = $1', [uid]);
      for (const s of scores) {
        await client.query(
          `INSERT INTO user_scores (uid, dt, score, activity, hora_lord, planets, is_morning)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (uid, dt) DO UPDATE SET
             score     = EXCLUDED.score,
             activity  = EXCLUDED.activity,
             hora_lord = EXCLUDED.hora_lord,
             planets   = EXCLUDED.planets,
             is_morning = EXCLUDED.is_morning`,
          [uid, s.dt.toISOString(), s.score, s.activity, s.horaLord,
           JSON.stringify(s.planets), s.isMorning],
        );
        count++;
      }
      await client.query('COMMIT');
      console.log(`[db] user_scores saved uid=${uid} count=${count}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return count;
  },

  async forRange(uid: string, from: Date, to: Date): Promise<UserScore[]> {
    const { rows } = await pool.query(
      'SELECT * FROM user_scores WHERE uid = $1 AND dt >= $2 AND dt < $3 ORDER BY dt',
      [uid, from.toISOString(), to.toISOString()],
    );
    return rows.map(rowToUserScore);
  },

  /** True if user has non-stale scores (within last 91 days) */
  async hasRecent(uid: string): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM user_scores
       WHERE uid = $1
         AND dt > NOW()
       LIMIT 1`,
      [uid],
    );
    return rows.length > 0;
  },

  async meta(uid: string): Promise<{
    exists: boolean; minDt: string | null; maxDt: string | null; count: number;
  }> {
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS n, MIN(dt) AS min_dt, MAX(dt) AS max_dt FROM user_scores WHERE uid = $1',
      [uid],
    );
    const r = rows[0];
    const n = Number(r.n);
    return {
      exists: n > 0,
      minDt:  r.min_dt ? new Date(r.min_dt).toISOString() : null,
      maxDt:  r.max_dt ? new Date(r.max_dt).toISOString() : null,
      count:  n,
    };
  },

  /** For Telegram bot: next N high-score windows from now */
  async upcoming(uid: string, minScore = 70, limit = 5): Promise<UserScore[]> {
    const { rows } = await pool.query(
      `SELECT * FROM user_scores
       WHERE uid = $1 AND dt > NOW() AND score >= $2
       ORDER BY dt ASC
       LIMIT $3`,
      [uid, minScore, limit],
    );
    return rows.map(rowToUserScore);
  },
};
