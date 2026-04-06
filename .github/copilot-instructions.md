# Timeceptor — Copilot Instructions

**Read this fully before every response.**

## Project
- Vedic planetary timing web app at **timeceptor.com**
- Stack: React 19 + Vite 6 + TypeScript (client) / Express 4 + tsx (server) / PostgreSQL 14
- App path: `/home/ubuntu/store1/lab2/timeceptor`
- Live on PM2 (process: `timeceptor`, port 47000) behind nginx on Oracle Cloud Ubuntu 22.04 ARM64

## Deploy workflow
1. Edit source files freely — live site is NOT affected
2. `npm run build` inside `/home/ubuntu/store1/lab2/timeceptor` (~8s)
3. `pm2 restart timeceptor` — zero downtime restart
4. **Do NOT build unless user explicitly says to build/deploy/push live**

## Dev server
- `nohup npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/vite-dev.log 2>&1 &`
- Runs on port 5173, separate from production — safe to run simultaneously

## Critical rules
Strictly dont do things that break the core functionality or security of the app. This includes, but is not limited to: always asking before making changes to lock logic, never committing sensitive files, and ensuring that the core Vedic scoring engine remains intact. Always prioritize the integrity and security of the app over minor UI tweaks or optimizations.
- **Never filter or remove day rows** in `WeeklyView.tsx` — locked rows must still render visually
- Lock logic is controlled by `day.locked` flag — only overlay appearance should change, not rendering
- `VITE_FIREBASE_AUTH_DOMAIN` must stay as `timeceptor1.firebaseapp.com` (NOT timeceptor.com)
- Firebase service account key at `data/windows/firebase-service-account.json` — never commit this file
- Stripe live keys are active — test carefully before deploying payment changes

## Key files
| File | Purpose |
|------|---------|
| `client/src/components/WeeklyView.tsx` | Main results UI — day rows, lock overlays, CTA cards |
| `client/src/pages/DashboardPage.tsx` | Dashboard — greeting, service selector, weekly view |
| `client/src/pages/AppPage.tsx` | Birth data form → redirects to /dashboard |
| `client/src/pages/SwotPage.tsx` | SWOT analysis for paid users (90 days × 8 services) |
| `client/src/lib/scoring.ts` | `getWeeklyWindows(days)` — core Vedic scoring engine |
| `client/index.html` | SEO meta tags (OG, Twitter, JSON-LD) — already complete |
| `client/public/logo.png` | Transparent logo for navbar |
| `client/public/favicon.ico` | Favicon (from bg-less logo) |
| `server/index.ts` | Express API — auth, profile, payments, push |

## Access / payments
- Free users: 3 days unlocked
- Paid users: 90 days + SWOT page ($0.99 one-time via Stripe)
- `hasPaid` flag checked from `/api/users/profile`

## Style constants (WeeklyView / inline styles use these)
- `C.gold = '#F4A11D'`, `C.goldDim = 'rgba(244,161,29,0.55)'`
- `C.emerald = '#20C5A0'`, `C.text`, `C.textMid`, `C.textDim`
- Font: `FONT = "'Cinzel', serif"`
- Day row grid: `gridTemplateColumns: '74px 1fr 56px 18px'`

## Git
- Remote: `https://github.com/kdwalakulu03/timeceptor1.git` (main branch)
- Never commit `data/windows/firebase-service-account.json` or `.env`
