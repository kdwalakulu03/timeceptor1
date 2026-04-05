/**
 * server/routes/users.ts
 *
 * POST /api/users/sync     — create or update profile on login
 * GET  /api/users/me       — fetch own profile
 * PATCH /api/users/me      — update birth data / location
 * GET  /api/users/me/access — free/paid access status
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../index.js';
import { Users, NatalCharts }       from '../db.js';
import { calculateChart }            from '../../client/src/lib/astrology.js';
import { generateUserScores }        from '../jobs/score.js';
import { ensureTransitsCurrent }     from '../jobs/transits.js';

const router = Router();
router.use(requireAuth as unknown as (req: Request, res: Response, next: () => void) => void);

type AuthRequest = Request & { user: { uid: string; email?: string; name?: string; picture?: string } };

function uid(req: Request): string {
  return (req as AuthRequest).user.uid;
}
function firebaseUser(req: Request) {
  return (req as AuthRequest).user;
}

function safeProfile(p: Awaited<ReturnType<typeof Users.upsert>>) {
  // Strip nothing — profile is already sanitised; just return it
  return p;
}

// ── POST /sync ────────────────────────────────────────────────────────────────
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const u    = firebaseUser(req);
    const body = req.body as {
      birthDate?: string; birthTime?: string;
      lat?: number; lng?: number; locationName?: string;
    };

    const profile = await Users.upsert(u.uid, {
      uid:         u.uid,
      email:       u.email       ?? '',
      displayName: u.name        ?? null,
      photoURL:    u.picture     ?? null,
      ...(body.birthDate    != null ? { birthDate:    body.birthDate    } : {}),
      ...(body.birthTime    != null ? { birthTime:    body.birthTime    } : {}),
      ...(body.lat          != null ? { lat:          body.lat          } : {}),
      ...(body.lng          != null ? { lng:          body.lng          } : {}),
      ...(body.locationName != null ? { locationName: body.locationName } : {}),
    });

    // Rolling free window: always refresh to now+3 days on every visit
    await Users.refreshFreeUntil(u.uid);

    return res.json(safeProfile(profile));
  } catch (err) {
    console.error('[users/sync]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /me ───────────────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  try {
    const profile = await Users.get(uid(req));
    if (!profile) return res.status(404).json({ error: 'Profile not found. Call /sync first.' });
    return res.json(safeProfile(profile));
  } catch (err) {
    console.error('[users/me]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /me ─────────────────────────────────────────────────────────────────
router.patch('/me', async (req: Request, res: Response) => {
  try {
    const existing = await Users.get(uid(req));
    if (!existing) return res.status(404).json({ error: 'Profile not found. Call /sync first.' });

    const { birthDate, birthTime, lat, lng, locationName } = req.body as Partial<{
      birthDate: string; birthTime: string; lat: number; lng: number; locationName: string;
    }>;

    const profile = await Users.upsert(uid(req), {
      ...(birthDate    != null ? { birthDate    } : {}),
      ...(birthTime    != null ? { birthTime    } : {}),
      ...(lat          != null ? { lat          } : {}),
      ...(lng          != null ? { lng          } : {}),
      ...(locationName != null ? { locationName } : {}),
    });

    return res.json(safeProfile(profile));
  } catch (err) {
    console.error('[users/me PATCH]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /me/access ────────────────────────────────────────────────────────────
router.get('/me/access', async (req: Request, res: Response) => {
  try {
    const profile = await Users.get(uid(req));
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });

    const now  = Date.now();
    const free = profile.freeUntil ? new Date(profile.freeUntil).getTime() > now : false;
    const paid = profile.paidUntil ? new Date(profile.paidUntil).getTime() > now : false;

    const expiryTs = paid
      ? new Date(profile.paidUntil!).getTime()
      : free
      ? new Date(profile.freeUntil!).getTime()
      : now;

    const daysLeft = Math.max(0, Math.ceil((expiryTs - now) / 86400000));

    return res.json({ free, paid, freeUntil: profile.freeUntil, paidUntil: profile.paidUntil, daysLeft });
  } catch (err) {
    console.error('[users/access]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /setup ── Save birth data → compute natal chart → generate scores ──
router.post('/setup', async (req: Request, res: Response) => {
  const { birthDate, birthTime, lat, lng, locationName } = req.body ?? {};

  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return res.status(400).json({ error: 'birthDate must be YYYY-MM-DD' });
  }
  if (!birthTime || !/^\d{2}:\d{2}$/.test(birthTime)) {
    return res.status(400).json({ error: 'birthTime must be HH:MM' });
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng must be numbers' });
  }

  try {
    const id = uid(req);

    // 1. Update user profile with birth data + location
    await Users.upsert(id, { birthDate, birthTime, lat, lng, locationName });

    // 2. Compute natal chart (once, permanent)
    const birthDT = new Date(`${birthDate}T${birthTime}`);
    const chart   = calculateChart(birthDT, lat, lng);
    const p       = chart.planets;

    await NatalCharts.save(id, {
      birthDate, birthTime, lat, lng,
      sunLong:     p['sun']?.siderealLongitude     ?? 0,
      moonLong:    p['moon']?.siderealLongitude    ?? 0,
      marsLong:    p['mars']?.siderealLongitude    ?? 0,
      mercuryLong: p['mercury']?.siderealLongitude ?? 0,
      jupiterLong: p['jupiter']?.siderealLongitude ?? 0,
      venusLong:   p['venus']?.siderealLongitude   ?? 0,
      saturnLong:  p['saturn']?.siderealLongitude  ?? 0,
      rahuLong:    p['rahu']?.siderealLongitude    ?? 0,
      ketuLong:    p['ketu']?.siderealLongitude    ?? 0,
      ascendant:   chart.ascendant,
      ayanamsa:    chart.ayanamsa,
    });

    // 3. Ensure transit table is filled
    await ensureTransitsCurrent(90);

    // 4. Smart compute: free users get 7 days (enough for weekly view),
    //    paid users get full 90 days
    const profile = await Users.get(id);
    const now     = Date.now();
    const hasPaid = profile?.paidUntil ? new Date(profile.paidUntil).getTime() > now : false;
    const computeDays = hasPaid ? 90 : 7;
    const scored = await generateUserScores(id, computeDays);

    return res.json({ ok: true, natalSaved: true, scoresGenerated: scored });
  } catch (err) {
    console.error('[users/setup]', err);
    return res.status(500).json({ error: 'Setup failed', detail: String(err) });
  }
});

// ── POST /telegram ── Link Telegram chat ID for notifications ────────────────
router.post('/telegram', async (req: Request, res: Response) => {
  const { chatId } = req.body ?? {};
  if (!chatId || typeof chatId !== 'string') {
    return res.status(400).json({ error: 'chatId required (string)' });
  }

  try {
    await Users.setTelegramChatId(uid(req), chatId);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[users/telegram]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
