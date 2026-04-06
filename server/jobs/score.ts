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

// ══ Bio-Rhythmic Cycle (Pancha Pakshi overlay) ════════════════════════════════
type BioAct = 0 | 1 | 2 | 3 | 4; // Eat Walk Rule Sleep Dead
const BIO_SCORES: Record<BioAct, number> = { 0: 12, 1: 6, 2: 20, 3: -6, 4: -14 };
const BIRD_NAKS: number[][] = [
  [0,5,6,11,12,17,18,23,24],    // Vulture
  [1,4,7,10,13,16,19,22,25],    // Owl
  [2,3,8,9,14,15,20,21,26],     // Crow
  [/* rooster uses fallthrough */],
  [/* peacock uses fallthrough */],
];
function moonToBird(moonSidLng: number): number {
  const idx = Math.floor(((moonSidLng % 360) + 360) % 360 / (360 / 27));
  for (let b = 0; b < 3; b++) if (BIRD_NAKS[b].includes(idx)) return b;
  return idx % 2 === 0 ? 3 : 4;
}
function bioDayGroup(dow: number, isNight: boolean): string {
  const d = [[1,4],[2,5],[3,6],[0,-1]][Math.min(dow > 0 ? Math.floor((dow - 1) / 2) : 3, 3)];
  if (d.includes(dow)) return isNight ? `${dow}n` : `${dow}d`;
  return isNight ? '0n' : '0d';
}
/* Compact day/night yamam sequences — [bird][yamam] => activity */
const BD: Record<string, number[][]> = {
  '1d': [[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3]],
  '2d': [[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4]],
  '3d': [[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0]],
  '4d': [[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1]],
  '5d': [[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2]],
  '6d': [[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3]],
  '0d': [[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1]],
};
const BN: Record<string, number[][]> = {
  '1n': [[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0]],
  '2n': [[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1]],
  '3n': [[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2]],
  '4n': [[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3]],
  '5n': [[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4]],
  '6n': [[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0]],
  '0n': [[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3]],
};
const BIO_SUB: Record<string, Record<BioAct, number>> = {
  sd: { 0:30, 1:26, 2:36, 3:24, 4:28 },
  sn: { 0:28, 1:24, 2:36, 3:30, 4:26 },
  kd: { 0:28, 1:30, 2:36, 3:26, 4:24 },
  kn: { 0:26, 1:28, 2:36, 3:24, 4:30 },
};
const S_DEATH: Record<number, number[]> = { 0:[4], 1:[3], 2:[0], 3:[2], 4:[1] };
const S_RULE:  Record<number, number[]> = { 0:[2], 1:[1], 2:[4], 3:[0], 4:[3] };
const K_DEATH: Record<number, number[]> = { 0:[2], 1:[1], 2:[4], 3:[0], 4:[3] };
const K_RULE:  Record<number, number[]> = { 0:[4], 1:[3], 2:[0], 3:[2], 4:[1] };

function isShukla(dt: Date): boolean {
  const phase = Astronomy.MoonPhase(dt);
  return phase < 180;
}

function bioScoreCalc(
  bird: number, dow: number, hour: number, minute: number,
  sunriseH: number, sunsetH: number, shukla: boolean,
): number {
  const totalMin = hour * 60 + minute;
  const srMin = sunriseH * 60;
  const ssMin = sunsetH * 60;
  const dayLen = ssMin - srMin;
  const nightLen = 1440 - dayLen;
  const dayYamam = dayLen / 5;
  const nightYamam = nightLen / 5;

  let yamam: number, isNight: boolean, minuteInYamam: number;
  if (totalMin >= srMin && totalMin < ssMin) {
    isNight = false;
    const elapsed = totalMin - srMin;
    yamam = Math.min(Math.floor(elapsed / dayYamam), 4);
    minuteInYamam = Math.floor(elapsed - yamam * dayYamam);
  } else if (totalMin >= ssMin) {
    isNight = true;
    const elapsed = totalMin - ssMin;
    yamam = Math.min(Math.floor(elapsed / nightYamam), 4);
    minuteInYamam = Math.floor(elapsed - yamam * nightYamam);
  } else {
    isNight = true;
    const elapsed = totalMin + (1440 - ssMin);
    yamam = Math.min(Math.floor(elapsed / nightYamam), 4);
    minuteInYamam = Math.floor(elapsed - yamam * nightYamam);
  }
  minuteInYamam = Math.max(0, Math.min(minuteInYamam, 143));

  const group = bioDayGroup(dow, isNight);
  const seqTable = isNight ? BN[group] : BD[group];
  if (!seqTable) return 0;
  const primary = (seqTable[bird]?.[yamam] ?? 0) as BioAct;

  const subKey = (shukla ? 's' : 'k') + (isNight ? 'n' : 'd');
  const subDur = BIO_SUB[subKey];
  const subOrder: BioAct[] = [];
  for (let i = 0; i < 5; i++) subOrder.push(((primary + i) % 5) as BioAct);

  let elapsed2 = 0;
  let subAct: BioAct = subOrder[4];
  for (const act of subOrder) {
    if (elapsed2 + subDur[act] > minuteInYamam) { subAct = act; break; }
    elapsed2 += subDur[act];
  }

  const base = BIO_SCORES[primary];
  const sub = Math.round(BIO_SCORES[subAct] * 0.5);
  const deathDays = shukla ? S_DEATH[bird] : K_DEATH[bird];
  const ruleDays = shukla ? S_RULE[bird] : K_RULE[bird];
  let dayBonus = 0;
  if (ruleDays?.includes(dow)) dayBonus = 8;
  else if (deathDays?.includes(dow)) dayBonus = -10;

  return base + sub + dayBonus;
}

function normaliseBio(raw: number): number {
  return Math.round(((raw + 31) / 69) * 24 - 12);
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
  const birthBird     = moonToBird(natal.moonLong);

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
  let cachedShukla = true;

  for (const tp of transits) {
    const dtLocal = tp.dt; // UTC hour
    const ymd     = dtLocal.toISOString().slice(0, 10);

    // ── Jupiter aspect + lunar phase — refresh once per day ─────────────
    if (ymd !== lastJupDay) {
      lastJupDay  = ymd;
      cachedShukla = isShukla(dtLocal);
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

    // ── Bio-rhythmic cycle overlay ──────────────────────────────────────
    const sunsetHour = Math.min(sunriseHour + 12, 19);
    const bioRaw = bioScoreCalc(birthBird, dayOfWeek, dtHour, 0,
      sunriseHour, sunsetHour, cachedShukla);
    const bioPts = normaliseBio(bioRaw);

    const score = Math.max(0, Math.min(100,
      horaData.base + transitBoost + morningBonus + bioPts));

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
