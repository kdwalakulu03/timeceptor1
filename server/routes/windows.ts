/**
 * server/routes/windows.ts
 *
 * POST /api/windows/precalc
 *   Save natal chart + generate user_scores from transit_positions.
 *   Body: { uid, birthDate, birthTime, lat, lng }
 *   Returns: { stored, key, fromCache }
 *
 * GET /api/windows/weekly?uid=...&weekStart=YYYY-MM-DD
 *   Returns scored HourWindow[] for the 7-day window from weekStart.
 *
 * GET /api/windows/meta?uid=...
 *   Returns { exists, minDt, maxDt, count }
 */

import express, { Request, Response } from 'express';
import { NatalCharts, UserScores, Users } from '../db.js';
import { calculateChart }              from '../../client/src/lib/astrology.js';
import { generateUserScores }          from '../jobs/score.js';
import { ensureTransitsCurrent }       from '../jobs/transits.js';

const router = express.Router();

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}
function isValidTime(s: string): boolean {
  return /^\d{2}:\d{2}$/.test(s);
}

// ── POST /precalc ─────────────────────────────────────────────────────────────
router.post('/precalc', async (req: Request, res: Response) => {
  const { uid, birthDate, birthTime, lat, lng } = req.body ?? {};

  if (!uid || typeof uid !== 'string' || uid.length > 128) {
    return res.status(400).json({ error: 'uid required (max 128 chars)' });
  }
  if (!isValidDate(birthDate)) {
    return res.status(400).json({ error: 'birthDate must be YYYY-MM-DD' });
  }
  if (!isValidTime(birthTime)) {
    return res.status(400).json({ error: 'birthTime must be HH:MM' });
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng must be numbers' });
  }

  try {
    // Check if we already have fresh scores
    const hasRecent = await UserScores.hasRecent(uid);
    if (hasRecent) {
      const meta = await UserScores.meta(uid);
      return res.json({ stored: meta.count, key: uid, fromCache: true });
    }

    // 1. Compute natal chart positions
    const birthDT  = new Date(`${birthDate}T${birthTime}`);
    const chart    = calculateChart(birthDT, lat, lng);
    const planets  = chart.planets;

    await NatalCharts.save(uid, {
      birthDate, birthTime, lat, lng,
      sunLong:     planets['sun']?.siderealLongitude     ?? 0,
      moonLong:    planets['moon']?.siderealLongitude    ?? 0,
      marsLong:    planets['mars']?.siderealLongitude    ?? 0,
      mercuryLong: planets['mercury']?.siderealLongitude ?? 0,
      jupiterLong: planets['jupiter']?.siderealLongitude ?? 0,
      venusLong:   planets['venus']?.siderealLongitude   ?? 0,
      saturnLong:  planets['saturn']?.siderealLongitude  ?? 0,
      rahuLong:    planets['rahu']?.siderealLongitude    ?? 0,
      ketuLong:    planets['ketu']?.siderealLongitude    ?? 0,
      ascendant:   chart.ascendant,
      ayanamsa:    chart.ayanamsa,
    });

    // 2. Ensure global transit table is filled
    await ensureTransitsCurrent(90);

    // 3. Smart compute: only generate what user is entitled to
    //    Check if user has paid — if so, compute 90 days. Otherwise, just 7.
    //    (We compute 7 not 3, so the weekly view has data & we show locked overlay.)
    const user = await Users.get(uid);
    const now  = Date.now();
    const hasPaid = user?.paidUntil ? new Date(user.paidUntil).getTime() > now : false;
    const computeDays = hasPaid ? 90 : 7;

    // 3. Generate user_scores (natal × transit)
    const stored = await generateUserScores(uid, computeDays);

    return res.json({ stored, key: uid, fromCache: false });
  } catch (err) {
    console.error('[windows/precalc]', err);
    return res.status(500).json({ error: 'Calculation failed', detail: String(err) });
  }
});

// ── GET /weekly ───────────────────────────────────────────────────────────────
router.get('/weekly', async (req: Request, res: Response) => {
  const { uid, weekStart } = req.query as { uid?: string; weekStart?: string };

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'uid required' });
  }
  if (!weekStart || !isValidDate(weekStart)) {
    return res.status(400).json({ error: 'weekStart must be YYYY-MM-DD' });
  }

  try {
    // Access gating: determine how far user can see
    const user = await Users.get(uid);
    const now  = Date.now();
    const hasPaid  = user?.paidUntil  ? new Date(user.paidUntil).getTime()  > now : false;
    const hasFree  = user?.freeUntil  ? new Date(user.freeUntil).getTime()  > now : false;

    // Determine the access horizon
    let accessHorizon: Date;
    if (hasPaid) {
      accessHorizon = new Date(user!.paidUntil!);
    } else if (hasFree) {
      accessHorizon = new Date(user!.freeUntil!);
    } else {
      // Default: 3 days from now
      accessHorizon = new Date(now + 3 * 24 * 60 * 60 * 1000);
    }
    const from = new Date(`${weekStart}T00:00:00Z`);
    const to   = new Date(from);
    to.setDate(from.getDate() + 7); // exclusive upper bound

    const rows = await UserScores.forRange(uid, from, to);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'No pre-calculated data found. Call /precalc first.',
      });
    }

    const windows = rows.map(w => {
      const withinAccess = w.dt.getTime() < accessHorizon.getTime();
      return {
        date:      w.dt.toISOString().slice(0, 10),
        hour:      w.dt.getUTCHours(),
        score:     withinAccess ? w.score     : 0,
        activity:  withinAccess ? w.activity  : 'rest',
        horaRuler: withinAccess ? w.horaLord  : '',
        planets:   withinAccess ? w.planets   : [],
        isMorning: w.isMorning,
        locked:    !withinAccess,
      };
    });

    // Tell the client how many days are unlocked & whether user has paid
    const accessDays = Math.max(0, Math.ceil((accessHorizon.getTime() - now) / 86400000));

    return res.json({ uid, weekStart, windows, accessDays, hasPaid, hasFree });
  } catch (err) {
    console.error('[windows/weekly]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /meta ─────────────────────────────────────────────────────────────────
router.get('/meta', async (req: Request, res: Response) => {
  const { uid } = req.query as { uid?: string };
  if (!uid) return res.status(400).json({ error: 'uid required' });

  try {
    return res.json(await UserScores.meta(uid));
  } catch (err) {
    console.error('[windows/meta]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
// ── GET /month?uid=...&month=YYYY-MM ─────────────────────────────────────────
// Returns ~720 hourly scores for the calendar month.
// Requires active paid_until OR free_until to return data beyond 3 days.
router.get('/month', async (req: Request, res: Response) => {
  const { uid, month } = req.query as { uid?: string; month?: string };

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'uid required' });
  }
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month must be YYYY-MM' });
  }

  try {
    // Check access — user must have active free trial or paid subscription
    const user = await Users.get(uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now      = Date.now();
    const hasFree  = user.freeUntil  ? new Date(user.freeUntil).getTime()  > now : false;
    const hasPaid  = user.paidUntil  ? new Date(user.paidUntil).getTime()  > now : false;

    if (!hasFree && !hasPaid) {
      return res.status(403).json({
        error: 'Monthly view requires an active subscription.',
        code:  'SUBSCRIPTION_REQUIRED',
      });
    }

    const from = new Date(`${month}-01T00:00:00Z`);
    // Next month, day 1
    const to = new Date(from);
    to.setUTCMonth(to.getUTCMonth() + 1);

    const rows = await UserScores.forRange(uid, from, to);

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'No scores for this month. Call /precalc first.',
      });
    }

    const windows = rows.map(w => ({
      date:      w.dt.toISOString().slice(0, 10),
      hour:      w.dt.getUTCHours(),
      score:     w.score,
      activity:  w.activity,
      horaRuler: w.horaLord,
      planets:   w.planets,
      isMorning: w.isMorning,
    }));

    return res.json({ uid, month, windows });
  } catch (err) {
    console.error('[windows/month]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
export default router;
