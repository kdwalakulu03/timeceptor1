/**
 * server/routes/day-ratings.ts
 *
 * POST /api/day-ratings          — submit or update a day rating (1–5)
 * GET  /api/day-ratings          — user's own day ratings
 * GET  /api/day-ratings/week     — ratings for specific dates (for WeeklyView hydration)
 * GET  /api/day-ratings/export   — full dump for AI training (admin/internal)
 */

import { Router, Request, Response } from 'express';
import { requireAuth }               from '../index.js';
import { DayRatings }                from '../db.js';

const router = Router();
router.use(requireAuth as unknown as (req: Request, res: Response, next: () => void) => void);

type AuthRequest = Request & { user: { uid: string } };
function uid(req: Request): string {
  return (req as AuthRequest).user.uid;
}

// ── POST /  —  Submit or update a day rating ─────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { date, service, predictedAvg, predictedPeak, userRating, predictionGrid } = req.body ?? {};

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  if (typeof userRating !== 'number' || userRating < 1 || userRating > 5) {
    return res.status(400).json({ error: 'userRating must be 1–5' });
  }

  try {
    await DayRatings.upsert({
      uid:            uid(req),
      date,
      service:        service ?? 'yoga',
      predictedAvg:   predictedAvg ?? 0,
      predictedPeak:  predictedPeak ?? 0,
      userRating,
      predictionGrid: predictionGrid ?? [],
      ratedAt:        new Date().toISOString(),
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[day-ratings/post]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /  —  All my day ratings ─────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    return res.json(await DayRatings.forUser(uid(req)));
  } catch (err) {
    console.error('[day-ratings/get]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /week?dates=2026-04-01,2026-04-02,...  ——————————————————————————————
router.get('/week', async (req: Request, res: Response) => {
  const datesParam = (req.query.dates as string) ?? '';
  const dates = datesParam.split(',').filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (dates.length === 0) {
    return res.json({});
  }
  try {
    return res.json(await DayRatings.forUserWeek(uid(req), dates));
  } catch (err) {
    console.error('[day-ratings/week]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /export  — AI training data dump ─────────────————————————————————
router.get('/export', async (_req: Request, res: Response) => {
  try {
    return res.json(await DayRatings.all());
  } catch (err) {
    console.error('[day-ratings/export]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
