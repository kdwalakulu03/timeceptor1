/**
 * server/jobs/transits.ts
 *
 * Pre-fills the global `transit_positions` table.
 *
 * Transit positions are the same for everyone on Earth at a given UTC hour
 * (Moon parallax < 0.5°, well within the 5° orb used for aspects).
 * We compute at lat=0, lng=0 and store one row per UTC hour.
 *
 * Run on startup (if table is empty or stale) or via cron to keep filled
 * `daysAhead` hours into the future.
 *
 * Usage:
 *   import { prefillTransits } from './jobs/transits.js';
 *   await prefillTransits(365);          // fill 1 year ahead
 *   await prefillTransits(90, true);     // back-fill 90 days into the past too
 */

import * as Astronomy from 'astronomy-engine';
import { TransitPositions, type TransitPosition } from '../db.js';
import { calculateLahiriAyanamsa } from '../../client/src/lib/astrology.js';

const OBSERVER = new Astronomy.Observer(0, 0, 0); // lat=0, lng=0, alt=0

/**
 * Compute transit positions for a single UTC hour.
 */
function computeTransitForHour(dt: Date): TransitPosition {
  const time = Astronomy.MakeTime(dt);
  const ayanamsa = calculateLahiriAyanamsa(dt);

  function getSidereal(body: Astronomy.Body): number {
    const equ = Astronomy.Equator(body, time, OBSERVER, true, true);
    const ecl = Astronomy.Ecliptic(equ.vec);
    return ((ecl.elon - ayanamsa) % 360 + 360) % 360;
  }

  // Mean Rahu (North Node) — standard J2000 formula
  const jd = dt.getTime() / 86400000 + 2440587.5;
  const d  = jd - 2451545.0; // days since J2000
  let rahuTrop = (125.04452 - 0.0529537648 * d) % 360;
  if (rahuTrop < 0) rahuTrop += 360;
  const rahuLong = ((rahuTrop - ayanamsa) % 360 + 360) % 360;
  const ketuLong = (rahuLong + 180) % 360;

  return {
    dt,
    sunLong:     getSidereal(Astronomy.Body.Sun),
    moonLong:    getSidereal(Astronomy.Body.Moon),
    marsLong:    getSidereal(Astronomy.Body.Mars),
    mercuryLong: getSidereal(Astronomy.Body.Mercury),
    jupiterLong: getSidereal(Astronomy.Body.Jupiter),
    venusLong:   getSidereal(Astronomy.Body.Venus),
    saturnLong:  getSidereal(Astronomy.Body.Saturn),
    rahuLong,
    ketuLong,
    ayanamsa,
  };
}

/**
 * Pre-fill transit_positions for the next `daysAhead` days (and optionally `daysBefore`).
 * Already-computed hours are upserted (idempotent).
 *
 * Returns total rows written.
 */
export async function prefillTransits(
  daysAhead  = 365,
  daysBefore = 0,
): Promise<number> {
  const now        = new Date();
  const startHour  = new Date(now);
  startHour.setUTCMinutes(0, 0, 0);
  startHour.setTime(startHour.getTime() - daysBefore * 24 * 60 * 60 * 1000);

  const totalHours = (daysAhead + daysBefore) * 24;
  const BATCH_SIZE = 168; // 7 days per transaction

  let written = 0;
  let batchStart = 0;

  while (batchStart < totalHours) {
    const batch: TransitPosition[] = [];
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalHours);

    for (let h = batchStart; h < batchEnd; h++) {
      const dt = new Date(startHour.getTime() + h * 3600 * 1000);
      // truncate to the hour (avoid sub-ms drift)
      dt.setUTCMinutes(0, 0, 0);
      batch.push(computeTransitForHour(dt));
    }

    written += await TransitPositions.bulkUpsert(batch);
    batchStart = batchEnd;
    console.log(`[transits] written ${written}/${totalHours} rows`);
  }

  return written;
}

/**
 * Ensure the table is filled at least `daysAhead` days from now.
 * Call on server startup — no-op if already filled.
 */
export async function ensureTransitsCurrent(daysAhead = 90): Promise<void> {
  const target   = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const latestDt = await TransitPositions.latestDt();

  if (latestDt && latestDt >= target) {
    console.log(`[transits] up-to-date through ${latestDt.toISOString()}`);
    return;
  }

  console.log(`[transits] filling through ${target.toISOString()} …`);
  await prefillTransits(daysAhead);
}

// Allow running as a standalone script: `tsx server/jobs/transits.ts`
const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  process.argv[1].replace(/\\/g, '/').endsWith('server/jobs/transits.ts');

if (isMain) {
  const days = Number(process.argv[2] ?? 365);
  console.log(`[transits] prefilling ${days} days…`);
  prefillTransits(days, 30 /* also back-fill 30 days */)
    .then((n) => {
      console.log(`[transits] done — ${n} rows written`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[transits] error', err);
      process.exit(1);
    });
}
