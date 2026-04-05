/**
 * canvas/phaseAlerts.ts — Phase 4: ALERTS
 *
 * Desktop: left text + method cards, right phone mockup.
 * Mobile: stacked — title → phone → methods → CTA.
 * Duration: 8s.
 */
import {
  type Layout, type F, C,
  PEAK,
  box, rbox, ease, drawHeader,
  type PhaseDraw,
} from './shared';

/* ── Methods data (local) ─────────────────────────────────────────────── */

const METHODS = [
  { icon: '🔔', name: 'PUSH',     sub: 'Instant', badge: '★', primary: true  },
  { icon: '✈️', name: 'TELEGRAM', sub: 'Chat',    badge: null, primary: false },
  { icon: '📧', name: 'EMAIL',    sub: 'Daily',   badge: null, primary: false },
];

/* ── Draw phone mockup (shared between layouts) ─────────────────────── */

function drawPhone(
  ctx: CanvasRenderingContext2D, L: Layout, f: F,
  alpha: number, phaseT: number,
  phoneX: number, phoneY: number, phoneW: number, phoneH: number,
) {
  const pa = ease(phaseT, 0, 2.0);
  ctx.globalAlpha = alpha * pa;

  rbox(ctx, phoneX, phoneY, phoneW, phoneH, 22, 'rgba(18,18,36,0.92)', C.goldBd, 1.5);
  rbox(ctx, phoneX + phoneW / 2 - phoneW * 0.15, phoneY, phoneW * 0.3, 18, [0, 0, 8, 8] as any, '#05050D');
  ctx.font = f.tiny; ctx.fillStyle = C.creamSub; ctx.textAlign = 'left';
  ctx.fillText('9:41', phoneX + 16, phoneY + 36);
  ctx.textAlign = 'right'; ctx.fillText('●●●', phoneX + phoneW - 16, phoneY + 36);
  ctx.textAlign = 'left';

  // Notification 1
  const n1a = ease(phaseT, 0.6, 2.0);
  if (n1a > 0.01) {
    ctx.globalAlpha = alpha * n1a;
    const nx = phoneX + 12, nw = phoneW - 24;
    const ny = phoneY + 48 + (1 - n1a) * -30;
    const nh = Math.round(phoneH * 0.17);
    rbox(ctx, nx, ny, nw, nh, 10, 'rgba(28,28,50,0.95)', 'rgba(212,168,75,0.30)', 1);
    const is = Math.round(nh * 0.3);
    rbox(ctx, nx + 8, ny + 8, is, is, 5, C.gold);
    ctx.font = `${Math.round(is * 0.6)}px serif`; ctx.fillStyle = '#05050D'; ctx.textAlign = 'center';
    ctx.fillText('✦', nx + 8 + is / 2, ny + 8 + is * 0.72); ctx.textAlign = 'left';
    const fs2 = Math.round(14 * L.fs);
    ctx.font = `600 ${fs2}px "JetBrains Mono",monospace`; ctx.fillStyle = C.gold;
    ctx.fillText('⏰ Peak Window 6 AM', nx + is + 18, ny + nh * 0.34);
    ctx.font = `400 ${fs2 - 1}px "Outfit",sans-serif`; ctx.fillStyle = C.creamSub;
    ctx.fillText('Score ' + PEAK + ' · Mars hora', nx + is + 18, ny + nh * 0.56);
    ctx.font = f.tiny; ctx.fillStyle = C.creamDm;
    ctx.fillText('now · Timeceptor', nx + 8, ny + nh * 0.86);
  }

  // Notification 2
  const n2a = ease(phaseT, 1.8, 2.0);
  if (n2a > 0.01) {
    ctx.globalAlpha = alpha * n2a;
    const nx = phoneX + 12, nw = phoneW - 24;
    const ny = phoneY + 48 + phoneH * 0.21 + (1 - n2a) * -20;
    const nh = Math.round(phoneH * 0.14);
    rbox(ctx, nx, ny, nw, nh, 10, 'rgba(28,28,50,0.90)', C.sageDim, 1);
    const is = Math.round(nh * 0.34);
    rbox(ctx, nx + 8, ny + 8, is, is, 5, C.sage);
    ctx.font = `${Math.round(is * 0.6)}px serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('⭐', nx + 8 + is / 2, ny + 8 + is * 0.72); ctx.textAlign = 'left';
    const fs2 = Math.round(14 * L.fs);
    ctx.font = `600 ${fs2}px "JetBrains Mono",monospace`; ctx.fillStyle = C.sage;
    ctx.fillText('How was your session?', nx + is + 18, ny + nh * 0.40);
    ctx.font = `400 ${fs2 - 1}px "Outfit",sans-serif`; ctx.fillStyle = C.creamSub;
    ctx.fillText('Rate 6 AM Yoga window', nx + is + 18, ny + nh * 0.70);
  }
}

/* ── Main draw ────────────────────────────────────────────────────────── */

export const drawAlerts: PhaseDraw = (ctx, L, f, alpha, phaseT, t) => {
  ctx.save(); ctx.globalAlpha = alpha;
  const { W, H, pad } = L;
  const cx = W / 2;

  drawHeader(ctx, L, f);

  if (L.wide) {
    /* ═══ DESKTOP — left: text + methods, right: phone ═══ */
    const leftX = pad, leftW = W * 0.44 - pad;
    const rightX = W * 0.48, rightW = W - rightX - pad;
    let ly = pad + 110;

    ctx.font = f.heading; ctx.fillStyle = C.cream; ctx.textAlign = 'left';
    ctx.fillText('Never Miss', leftX, ly);
    ctx.font = f.title; ctx.fillStyle = C.gold;
    ctx.fillText('a Peak Hour', leftX, ly + 68);
    ctx.font = f.xs; ctx.fillStyle = C.creamSub;
    ctx.fillText('ALERTS ARRIVE 15 MIN BEFORE YOUR WINDOW', leftX, ly + 98);

    // No-install badge
    const bdA = ease(phaseT, 0.6, 2.0);
    ctx.globalAlpha = alpha * bdA;
    ly += 128;
    rbox(ctx, leftX, ly, 310, 32, 5, 'rgba(123,175,141,0.08)', C.sageDim, 1);
    ctx.font = f.xs; ctx.fillStyle = C.sage;
    ctx.fillText('✓  NO APP INSTALL NEEDED', leftX + 14, ly + 22);

    // Method cards
    ly += 52;
    const cw = (leftW - 12) / 3;
    METHODS.forEach((m, i) => {
      const ma = ease(phaseT, 1.0 + i * 0.2, 2.0);
      ctx.globalAlpha = alpha * ma;
      const mx = leftX + i * (cw + 6);
      box(ctx, mx, ly, cw, 100,
        m.primary ? 'rgba(212,168,75,0.07)' : 'rgba(0,0,0,0.35)',
        m.primary ? C.goldBd : C.goldBd2, m.primary ? 2 : 1);
      ctx.font = '26px serif'; ctx.textAlign = 'center';
      ctx.fillText(m.icon, mx + cw / 2, ly + 34);
      ctx.font = f.svc; ctx.fillStyle = m.primary ? C.gold : C.creamDm;
      ctx.fillText(m.name, mx + cw / 2, ly + 58);
      ctx.font = f.tiny; ctx.fillStyle = C.creamDm;
      ctx.fillText(m.sub, mx + cw / 2, ly + 76);
      if (m.badge) { ctx.font = f.tiny; ctx.fillStyle = C.gold; ctx.fillText(m.badge, mx + cw / 2, ly + 92); }
      ctx.textAlign = 'left';
    });
    ctx.globalAlpha = alpha;

    // CTA button
    const btnA = ease(phaseT, 2.0, 1.5);
    ctx.globalAlpha = alpha * btnA;
    ly += 120;
    const pulse = (Math.sin(t * 1.5) + 1) / 2 * 0.10;
    box(ctx, leftX, ly, leftW, 54, C.gold, null);
    box(ctx, leftX, ly, leftW, 54, `rgba(255,255,255,${pulse})`, null);
    ctx.font = f.sm; ctx.fillStyle = '#05050D'; ctx.textAlign = 'center';
    ctx.fillText('✦  GET FREE ALERTS', leftX + leftW / 2, ly + 35);
    ctx.textAlign = 'left';

    // Right: phone mockup
    const phoneW = Math.min(280, rightW * 0.65), phoneH = phoneW * 1.7;
    const phoneX = rightX + (rightW - phoneW) / 2;
    const phoneY = pad + 100;
    drawPhone(ctx, L, f, alpha, phaseT, phoneX, phoneY, phoneW, phoneH);

  } else {
    /* ═══ MOBILE — stacked ═══ */
    let y = pad + 90;
    ctx.font = f.heading; ctx.fillStyle = C.cream; ctx.textAlign = 'center';
    ctx.fillText('Never Miss a Peak', cx, y);
    ctx.font = f.title; ctx.fillStyle = C.gold;
    ctx.fillText('Get Alerted', cx, y + 64);
    ctx.font = f.xs; ctx.fillStyle = C.creamSub;
    ctx.fillText('NO APP INSTALL NEEDED', cx, y + 96);
    ctx.textAlign = 'left';
    y += 130;

    // Phone
    const phoneW = Math.min(320, W - pad * 4), phoneH = phoneW * 1.3;
    const phoneX = cx - phoneW / 2;
    drawPhone(ctx, L, f, alpha, phaseT, phoneX, y, phoneW, phoneH);
    ctx.globalAlpha = alpha;
    y += phoneH + 18;

    // Methods
    const cw = (W - pad * 2 - 12) / 3;
    METHODS.forEach((m, i) => {
      const ma = ease(phaseT, 1.2 + i * 0.2, 2.0);
      ctx.globalAlpha = alpha * ma;
      const mx = pad + i * (cw + 6);
      box(ctx, mx, y, cw, 70,
        m.primary ? 'rgba(212,168,75,0.07)' : 'rgba(0,0,0,0.35)',
        m.primary ? C.goldBd : C.goldBd2, m.primary ? 2 : 1);
      ctx.font = '24px serif'; ctx.textAlign = 'center';
      ctx.fillText(m.icon, mx + cw / 2, y + 30);
      ctx.font = f.svc; ctx.fillStyle = m.primary ? C.gold : C.creamDm;
      ctx.fillText(m.name, mx + cw / 2, y + 52);
      if (m.badge) { ctx.font = f.tiny; ctx.fillStyle = C.gold; ctx.fillText(m.badge, mx + cw / 2, y + 66); }
      ctx.textAlign = 'left';
    });
    ctx.globalAlpha = alpha;

    y += 86;
    const btnA = ease(phaseT, 2.2, 1.5);
    ctx.globalAlpha = alpha * btnA;
    const pulse = (Math.sin(t * 1.5) + 1) / 2 * 0.10;
    box(ctx, pad, y, W - pad * 2, 58, C.gold, null);
    box(ctx, pad, y, W - pad * 2, 58, `rgba(255,255,255,${pulse})`, null);
    ctx.font = f.sm; ctx.fillStyle = '#05050D'; ctx.textAlign = 'center';
    ctx.fillText('✦  GET FREE ALERTS', cx, y + 37);
    ctx.textAlign = 'left';
  }

  ctx.globalAlpha = alpha;
  ctx.restore();
};
