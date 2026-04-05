/**
 * server/index.ts — Timeceptor production server
 *
 * Responsibilities:
 *   1. Serve built frontend (dist/)
 *   2. Proxy geocoding requests to Nominatim
 *   3. Handle email subscriptions → data/subscribers.json
 *   4. Verify Firebase Auth tokens on protected routes
 *
 * Data files location: <project-root>/data/
 * Build output:        <project-root>/dist/
 *
 * Start:  npm start      (tsx server/index.ts)
 * PM2:    npm run start:pm2
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { cert, initializeApp as initAdminApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import geocodeRouter   from './routes/geocode.js';
import subscribeRouter from './routes/subscribe.js';
import windowsRouter   from './routes/windows.js';
import usersRouter     from './routes/users.js';
import ratingsRouter   from './routes/ratings.js';
import dayRatingsRouter from './routes/day-ratings.js';
import pushRouter       from './routes/push.js';
import stripeRouter     from './routes/stripe.js';
import { migrate }                from './db.js';
import { ensureTransitsCurrent } from './jobs/transits.js';

// Telegram bot + cron jobs — loaded after DB is ready
// (side-effect imports: bot starts polling, cron schedules register)
const loadCronAndBot = async () => {
  await import('./telegram.js');  // starts Telegram polling if TELEGRAM_BOT_TOKEN is set
  await import('./cron.js');      // registers node-cron schedules
};

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = parseInt(process.env.PORT ?? '47000', 10);

// Paths are relative to project root (one level up from server/)
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');        // built frontend
const DATA = path.join(ROOT, 'data');        // runtime data (subscribers, etc.)

// ── Firebase Admin (Auth token verification) ─────────────────────────────
// Uses GOOGLE_APPLICATION_CREDENTIALS env var pointing to your service account JSON
// OR falls back to Application Default Credentials on Firebase-hosted infra.
// Set FIREBASE_PROJECT_ID in .env for explicit project binding.
if (!getApps().length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    initAdminApp({ credential: cert(serviceAccount) });
    console.log('[firebase-admin] Initialized with service account');
  } else {
    initAdminApp({
      projectId: process.env.FIREBASE_PROJECT_ID ?? 'timeceptor1',
    });
    console.log('[firebase-admin] Initialized with project ID (no service account file)');
  }
}

// Middleware: verify Firebase ID token on protected routes.
// Usage: router.get('/protected', requireAuth, handler)
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  try {
    const token = header.split('Bearer ')[1];
    const decoded = await getAuth().verifyIdToken(token);
    (req as Request & { user: typeof decoded }).user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ── Express setup ────────────────────────────────────────────────────────

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.disable('x-powered-by');

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self)');
  next();
});

// ── Static assets (built frontend) ──────────────────────────────────────
app.use(express.static(DIST, {
  maxAge: '1y',
  etag: true,
  setHeaders: (res, filePath) => {
    // Never cache index.html — new deploys must propagate immediately
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// ── API routes ───────────────────────────────────────────────────────────
app.use('/api/geocode',   geocodeRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/windows',   windowsRouter);
app.use('/api/users',     usersRouter);       // protected inside the router
app.use('/api/ratings',   ratingsRouter);     // protected inside the router
app.use('/api/day-ratings', dayRatingsRouter); // protected inside the router
app.use('/api/push',        pushRouter);       // push subscription management
app.use('/api/stripe',      stripeRouter);     // Stripe checkout + webhook

// Telegram bot info (public — so the frontend can build deep links)
app.get('/api/telegram/info', async (_req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.json({ enabled: false });
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const d = await r.json() as { ok: boolean; result?: { username?: string; first_name?: string } };
    if (d.ok && d.result?.username) {
      return res.json({ enabled: true, username: d.result.username, name: d.result.first_name });
    }
    return res.json({ enabled: false });
  } catch {
    return res.json({ enabled: false });
  }
});

// ── Email collection → data/emails.json ──────────────────────────────
// Collected for manual outreach — lightweight JSON append
app.post('/api/emails', (req: Request, res: Response) => {
  const { email, uid } = req.body as { email?: string; uid?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const emailsFile = path.join(DATA, 'emails.json');
  let list: Array<{ email: string; uid: string; ts: string }> = [];
  try {
    if (fs.existsSync(emailsFile)) {
      list = JSON.parse(fs.readFileSync(emailsFile, 'utf-8'));
    }
  } catch { /* start fresh */ }
  // Deduplicate by email
  if (list.some(e => e.email === email)) {
    return res.json({ ok: true, note: 'already saved' });
  }
  list.push({ email, uid: uid ?? 'anonymous', ts: new Date().toISOString() });
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(emailsFile, JSON.stringify(list, null, 2));
  console.log(`[emails] +1 → ${email} | total: ${list.length}`);
  return res.json({ ok: true });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV ?? 'development',
    dataDir: DATA,
    distDir: DIST,
    distExists: fs.existsSync(DIST),
    uptime: process.uptime(),
  });
});

// ── SPA fallback ─────────────────────────────────────────────────────────
app.get('*', (_req: Request, res: Response) => {
  const index = path.join(DIST, 'index.html');
  if (fs.existsSync(index)) return res.sendFile(index);
  return res.status(503).send('App not built yet — run: npm run build');
});

// ── Start ────────────────────────────────────────────────────────────────
async function start() {
  try {
    await migrate(); // run schema migrations before accepting traffic
  } catch (err) {
    console.error('[startup] DB migration failed — exiting:', err);
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✦ Timeceptor running → http://0.0.0.0:${PORT}`);
    console.log(`  env:  ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`  dist: ${DIST}`);
    console.log(`  data: ${DATA}`);

    // Fill global transit table non-blocking — don't hold up request serving
    ensureTransitsCurrent(90).catch(
      (err) => console.error('[startup] transit prefill failed:', err),
    );

    // Start Telegram bot + cron jobs
    loadCronAndBot().catch(
      (err) => console.error('[startup] cron/telegram failed:', err),
    );
  });
}

start();
