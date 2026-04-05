/**
 * server/routes/ratings.ts
 *
 * POST /api/ratings         — submit a session rating (great/average/poor)
 * GET  /api/ratings         — user's own ratings history
 * GET  /api/ratings/accuracy — user's prediction accuracy %
 * GET  /api/ratings/export  — full CSV dump for AI training (admin/internal)
 */

import { Router, Request, Response } from 'express';
import { requireAuth }               from '../index.js';
import { Ratings }                    from '../db.js';

const router = Router();
router.use(requireAuth as unknown as (req: Request, res: Response, next: () => void) => void);

type AuthRequest = Request & { user: { uid: string } };
function uid(req: Request): string {
  return (req as AuthRequest).user.uid;
}

// ── POST /  —  Submit a rating ───────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { date, hour, horaRuler, score, planets, rating } = req.body ?? {};

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  if (typeof hour !== 'number' || hour < 0 || hour > 23) {
    return res.status(400).json({ error: 'hour must be 0-23' });
  }
  if (!['great', 'average', 'poor'].includes(rating)) {
    return res.status(400).json({ error: 'rating must be great|average|poor' });
  }

  try {
    await Ratings.add({
      uid:       uid(req),
      date,
      hour,
      horaRuler: horaRuler ?? '',
      score:     score ?? 0,
      planets:   planets ?? [],
      rating,
      ratedAt:   new Date().toISOString(),
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[ratings/post]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /  —  My ratings ─────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    return res.json(await Ratings.forUser(uid(req)));
  } catch (err) {
    console.error('[ratings/get]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /accuracy  —  How well predictions matched ──────────────────────────
router.get('/accuracy', async (req: Request, res: Response) => {
  try {
    const accuracy = await Ratings.accuracy(uid(req));
    return res.json({ accuracy });
  } catch (err) {
    console.error('[ratings/accuracy]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
