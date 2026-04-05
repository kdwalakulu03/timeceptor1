/**
 * server/jobs/score.ts
 *
 * Generates `user_scores` rows for a specific user by joining:
 *   natal_charts  (per-user, permanent)
 * × transit_positions (global, pre-filled hourly)
 *
 * Hora lord calculation is location-dependent (needs sunrise for the user's
 * lat/lng) so it is computed here — NOT stored in transit_positions.
 *
 * Scoring algorithm mirrors client/src/lib/scoring.ts.
 *
 * Usage:
 *   import { generateUserScores } from './jobs/score.js';
 *   await generateUserScores(uid, 90);   // next 90 days
 */

import * as Astronomy from 'astronomy-engine';
import { NatalCharts, TransitPositions, UserScores } from '../db.js';
import { getSunrise } from '../../client/src/lib/astrology.js';

// ── Constants (mirrors client/src/constants.ts) ───────────────────────────────

const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

/** Chaldean Hour Sequence — index into PLANET_NAMES */
const CHALDEAN_HOUR_SEQUENCE = [6, 4, 2, 0, 5, 3, 1] as const; // Saturn,Jupiter,Mars,Sun,Venus,Mercury,Moon

type ActivityType = 'physical' | 'mental' | 'creative' | 'social' | 'rest';

const HORA_BASES: Record<string, { base: number; activity: ActivityType }> = {
  Mars:    { base: 48, activity: 'physical' },
  Sun:     { base: 44, activity: 'physical' },
  Jupiter: { base: 40, activity: 'mental'   },
  Venus:   { base: 36, activity: 'social'   },
  Moon:    { base: 32, activity: 'creative' },
  Mercury: { base: 30, activity: 'mental'   },
  Saturn:  { base: 10, activity: 'rest'     },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function angularDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate user_scores for `uid` for the next `daysAhead` days.
 * Requires:
 *  - natal_charts row for the user
 *  - transit_positions filled for the requested range
 *
 * Returns number of rows written.
 */
export async function generateUserScores(
  uid:       string,
  daysAhead  = 90,
): Promise<number> {
  // 1. Load natal chart
  const natal = await NatalCharts.get(uid);
  if (!natal) {
    throw new Error(`[score] No natal chart found for uid=${uid}`);
  }

  const natalMarsLong = natal.marsLong;
  const natalSunLong  = natal.sunLong;
  const lat           = natal.lat;
  const lng           = natal.lng;

  // 2. Load transits for the range
  const from = new Date();
  from.setUTCMinutes(0, 0, 0); // start of current hour
  const to   = new Date(from.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const transits = await TransitPositions.forRange(from, to);
  if (transits.length === 0) {
    throw new Error('[score] No transit positions found — run prefillTransits first');
  }

  console.log(`[score] uid=${uid} computing ${transits.length} hours`);

  // 3. Cache sunrise per calendar day (expensive call, ~100ms each)
  // key: "YYYY-MM-DD", value: sunrise Date
  const sunriseCache = new Map<string, Date>();

  function getSunriseForDay(date: Date): Date {
    const ymd = date.toISOString().slice(0, 10); // "YYYY-MM-DD"
    if (sunriseCache.has(ymd)) return sunriseCache.get(ymd)!;

    const dayStart = new Date(`${ymd}T00:00:00Z`);
    let sunrise: Date;
    try {
      sunrise = getSunrise(dayStart, lat, lng);
      const h = sunrise.getUTCHours();
      if (h < 3 || h > 10) throw new Error('unreasonable');
    } catch {
      sunrise = new Date(`${ymd}T05:30:00Z`);
    }
    sunriseCache.set(ymd, sunrise);
    return sunrise;
  }

  // 4. Score each hourly transit
  const scores: Array<{
    dt: Date; score: number; activity: string;
    horaLord: string; planets: string[]; isMorning: boolean;
  }> = [];

  // Jupiter signal is re-evaluated daily (changes ~0.08°/day)
  // Track by day key to avoid recomputing every hour
  let lastJupDay   = '';
  let jupSignal: string | null = null;
  let jupiterBoost = 0;

  for (const tp of transits) {
    const dtLocal = tp.dt; // UTC hour
    const ymd     = dtLocal.toISOString().slice(0, 10);

    // ── Jupiter aspect — refresh once per day ───────────────────────────
    if (ymd !== lastJupDay) {
      lastJupDay  = ymd;
      const jupOrb = angularDiff(tp.jupiterLong, natalSunLong);
      jupSignal    =
        jupOrb < 5                  ? 'Jupiter ☌ Sun' :
        Math.abs(jupOrb - 120) < 5  ? 'Jupiter △ Sun' :
        null;
      jupiterBoost = jupSignal ? (jupOrb < 5 ? 12 : 8) : 0;
    }

    // ── Hora ruler — sunrise-based, location-specific ───────────────────
    const sunrise     = getSunriseForDay(dtLocal);
    const sunriseHour = sunrise.getUTCHours();
    const dtHour      = dtLocal.getUTCHours();
    const dayOfWeek   = dtLocal.getDay(); // 0=Sun … 6=Sat

    // Number of planetary hours since sunrise today
    const hSinceSunrise =
      dtHour >= sunriseHour
        ? dtHour - sunriseHour
        : (24 - sunriseHour) + dtHour;

    const startPlanetIdx = CHALDEAN_HOUR_SEQUENCE.indexOf(dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    const planetIdx      = CHALDEAN_HOUR_SEQUENCE[(startPlanetIdx + hSinceSunrise) % 7];
    const horaRuler      = PLANET_NAMES[planetIdx];
    const horaData       = HORA_BASES[horaRuler] ?? { base: 14, activity: 'rest' as ActivityType };

    // ── Moon vs natal Mars ──────────────────────────────────────────────
    const moonMarsOrb = angularDiff(tp.moonLong, natalMarsLong);
    const signals: string[] = [];
    let transitBoost = 0;

    if (moonMarsOrb < 5) {
      transitBoost += Math.round(18 * (1 - moonMarsOrb / 5));
      signals.push('Moon ☌ Mars');
    }

    if (jupSignal) {
      transitBoost += jupiterBoost;
      signals.push(jupSignal);
    }

    // ── Morning bonus (local 5–8 AM approximation via UTC offset) ──────
    const morningBonus = (dtHour >= 5 && dtHour <= 8) ? 4 : 0;

    const score = Math.min(100, horaData.base + transitBoost + morningBonus);

    scores.push({
      dt:        dtLocal,
      score,
      activity:  horaData.activity,
      horaLord:  horaRuler,
      planets:   signals,
      isMorning: dtHour >= 4 && dtHour <= 9,
    });
  }

  // 5. Persist
  const written = await UserScores.bulkInsert(uid, scores);
  console.log(`[score] uid=${uid} saved ${written} rows`);
  return written;
}

// Allow running as a standalone script:
//   tsx server/jobs/score.ts <uid>
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  process.argv[1].replace(/\\/g, '/').endsWith('server/jobs/score.ts');

if (isMain) {
  const uid = process.argv[2];
  if (!uid) {
    console.error('Usage: tsx server/jobs/score.ts <uid>');
    process.exit(1);
  }
  generateUserScores(uid, 90)
    .then((n) => {
      console.log(`[score] done — ${n} rows written`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[score] error', err);
      process.exit(1);
    });
}
