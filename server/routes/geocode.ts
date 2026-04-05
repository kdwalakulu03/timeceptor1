/**
 * server/routes/geocode.ts
 * Nominatim proxy — keeps User-Agent + rate-limit logic server-side.
 * GET /api/geocode?q=<city or lat,lng>
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Simple in-memory rate limiter: max 1 Nominatim call per 1 100ms window (OSM policy)
let lastCallTime = 0;
const MIN_INTERVAL_MS = 1100;

router.get('/', async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  if (!q) return res.status(400).json({ error: 'Query param "q" is required' });

  // Enforce Nominatim's 1 req/sec policy
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastCallTime);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCallTime = Date.now();

  const limit = Math.min(parseInt((req.query.limit as string) ?? '1', 10), 8);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&addressdetails=1`;

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Timeceptor/1.0 (timeceptor.com; hello@timecept.com)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) return res.status(502).json({ error: 'Geocoding upstream unavailable' });

    const data = await upstream.json();
    return res.json(data);
  } catch (err) {
    console.error('[geocode] upstream error:', err);
    return res.status(500).json({ error: 'Geocoding failed' });
  }
});

export default router;
