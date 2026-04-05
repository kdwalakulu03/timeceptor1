/**
 * server/routes/subscribe.ts
 * POST /api/subscribe  { email: string, service?: string }
 * Now backed by PostgreSQL subscribers table.
 */

import { Router, Request, Response } from 'express';
import { Subscribers } from '../db.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { email, service } = req.body as { email?: string; service?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const result = await Subscribers.add(email, service);
    if (result === 'duplicate') {
      return res.status(409).json({ message: 'Already subscribed' });
    }
    const total = await Subscribers.count();
    console.log(`[subscribe] +1 → ${email} (${service ?? 'n/a'}) | total: ${total}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[subscribe]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
