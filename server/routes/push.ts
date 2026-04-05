/**
 * server/routes/push.ts — Web Push subscription management
 *
 * Endpoints:
 *   GET  /api/push/vapid-public-key  — Returns the VAPID public key
 *   POST /api/push/subscribe         — Store a push subscription (auth required)
 *   POST /api/push/unsubscribe       — Remove a push subscription (auth required)
 *
 * Env vars needed:
 *   VAPID_PUBLIC_KEY   — base64url VAPID public key
 *   VAPID_PRIVATE_KEY  — base64url VAPID private key
 *   VAPID_EMAIL        — mailto:your@email.com (required by push spec)
 *
 * Generate keys:
 *   npx web-push generate-vapid-keys
 */

import { Router, Request, Response } from 'express';
import webPush from 'web-push';
import pool from '../db/pool.js';
import { requireAuth } from '../index.js';

const router = Router();

// ── Configure web-push ───────────────────────────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL   = process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL || 'mailto:hello@timeceptor.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log('[push] VAPID keys configured ✓');
} else {
  console.warn('[push] VAPID keys not set — push notifications disabled. Run: npx web-push generate-vapid-keys');
}

// ── GET /vapid-public-key ────────────────────────────────────────────────
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  if (!VAPID_PUBLIC) {
    return res.json({ key: null, configured: false });
  }
  return res.json({ key: VAPID_PUBLIC, configured: true });
});

// ── POST /subscribe ──────────────────────────────────────────────────────
router.post('/subscribe', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { subscription } = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Missing push subscription object' });
  }

  try {
    await pool.query(
      `INSERT INTO push_subscriptions (uid, endpoint, p256dh, auth, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (endpoint) DO UPDATE SET
         uid = EXCLUDED.uid,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         created_at = NOW()`,
      [
        user.uid,
        subscription.endpoint,
        subscription.keys?.p256dh ?? '',
        subscription.keys?.auth ?? '',
      ]
    );

    console.log(`[push] subscription stored for uid=${user.uid}`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[push] subscribe error:', err);
    return res.status(500).json({ error: 'Failed to store subscription' });
  }
});

// ── POST /unsubscribe ────────────────────────────────────────────────────
router.post('/unsubscribe', requireAuth, async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

  try {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[push] unsubscribe error:', err);
    return res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

// ── Utility: send push to a specific user ────────────────────────────────
export async function sendPushToUser(uid: string, payload: { title: string; body: string; url?: string; tag?: string }): Promise<number> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return 0;

  const { rows } = await pool.query(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE uid = $1',
    [uid]
  );

  let sent = 0;
  for (const row of rows) {
    const sub = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    try {
      await webPush.sendNotification(sub, JSON.stringify(payload));
      sent++;
    } catch (err: any) {
      // 410 Gone = subscription expired, clean up
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]);
        console.log(`[push] removed expired subscription for uid=${uid}`);
      } else {
        console.warn(`[push] send failed for uid=${uid}:`, err.message);
      }
    }
  }
  return sent;
}

export default router;
