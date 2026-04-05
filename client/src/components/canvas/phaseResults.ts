/**
 * canvas/phaseResults.ts — Phase 3: RESULTS
 *
 * SLIDE-BASED approach: 4 sub-slides that cross-fade across the 10s phase.
 *   Slide A (0–3 s): Zodiac reveal + predictions
 *   Slide B (3–6 s): Best/Avoid windows (full frame)
 *   Slide C (6–8.5 s): 24-hour chart (full frame)
 *   Slide D (8.5–10 s): CTA + hook
 *
 * Each sub-slide fills the entire canvas content area — no 3-column cramming.
 */
import {
  type Layout, type F, C,
  PREDICTIONS, SCORES, PEAK, PEAK_H,
  box, rbox, ease, barCol, hRule,
  drawHeader,
  type PhaseDraw,
} from './shared';

/* ── Sub-slide timing helpers ────────────────────────────────────────── */

const SLIDES = [
  { start: 0,    end: 6.0  },  // A: zodiac   — 6 s (5 readable)
  { start: 5.0,  end: 11.0 },  // B: best/avoid — 6 s
  { start: 10.0, end: 16.0 },  // C: 24h chart  — 6 s
  { start: 15.0, end: 20.0 },  // D: CTA        — 5 s
];
const XFADE = 1.0; // 1 s crossfade between sub-slides

function slideAlpha(pt: number, s: typeof SLIDES[0]): number {
  const fadeIn  = Math.min(1, Math.max(0, (pt - s.start) / XFADE));
  const fadeOut = Math.min(1, Math.max(0, (s.end - pt) / XFADE));
  return Math.min(fadeIn, fadeOut);
}

/* ── Slide A: Zodiac Reveal + Predictions ────────────────────────────── */

function drawSlideZodiac(
  ctx: CanvasRenderingContext2D, L: Layout, f: F,
  alpha: number, pt: number, _t: number,
) {
  const { W, pad } = L;
  const cx = W / 2;
  const contentW = L.wide ? W * 0.55 : W - pad * 2;
  const contentX = L.wide ? cx - contentW / 2 : pad;
  let y = pad + 110;

  // Large zodiac badge — centered, big
  const badgeW = Math.min(contentW, 520), badgeH = 130;
  const badgeX = contentX + (contentW - badgeW) / 2;
  const za = ease(pt, 0, 2.0);
  ctx.globalAlpha = alpha * za;

  rbox(ctx, badgeX, y, badgeW, badgeH, 12, 'rgba(212,168,75,0.06)', C.goldBd, 1.5);
  ctx.font = `${Math.round(60 * L.fs)}px serif`; ctx.textAlign = 'center';
  ctx.fillStyle = C.gold; ctx.fillText('♈', badgeX + 56, y + 82);
  ctx.textAlign = 'left';
  ctx.font = f.heading; ctx.fillStyle = C.gold;
  ctx.fillText('ARIES', badgeX + 100, y + 54);
  ctx.font = f.body; ctx.fillStyle = C.creamSub;
  ctx.fillText('Fire sign · Mars ruled', badgeX + 100, y + 84);
  ctx.font = f.xs; ctx.fillStyle = C.creamDm;
  ctx.fillText('MARCH 14, 1990 · 06:45 AM · MUMBAI', badgeX + 100, y + 112);

  y += badgeH + 30;
  hRule(ctx, L, y); y += 24;

  // Prediction cards — stacked full-width, staggered fade
  PREDICTIONS.forEach((p, i) => {
    const pa = ease(pt, 0.4 + i * 0.3, 2.0);
    ctx.globalAlpha = alpha * pa;
    const cardH = L.wide ? 56 : 48;
    const cardY = y + i * (cardH + 10);
    rbox(ctx, contentX, cardY, contentW, cardH, 6,
      i < 2 ? C.redDim : 'rgba(0,0,0,0.30)',
      i < 2 ? C.redBd  : C.goldBd2, 1);
    ctx.font = `${Math.round(24 * L.fs)}px serif`; ctx.textAlign = 'left';
    ctx.fillText(p.icon, contentX + 16, cardY + cardH * 0.65);
    ctx.font = f.sm; ctx.fillStyle = i < 2 ? C.red : C.creamSub;
    ctx.fillText(p.text, contentX + 50, cardY + cardH * 0.62);
  });
}

/* ── Slide B: Best Window + Avoid ─────────────────────────────────────── */

function drawSlideBestAvoid(
  ctx: CanvasRenderingContext2D, L: Layout, f: F,
  alpha: number, pt: number, t: number,
) {
  const { W, H, pad } = L;
  const cx = W / 2;
  const spt = pt - SLIDES[1].start; // local time
  const contentW = L.wide ? W * 0.55 : W - pad * 2;
  const contentX = L.wide ? cx - contentW / 2 : pad;
  let y = pad + 110;

  // Title
  const ta = ease(spt, 0, 2.0);
  ctx.globalAlpha = alpha * ta;
  ctx.font = f.heading; ctx.fillStyle = C.cream; ctx.textAlign = 'center';
  ctx.fillText("YOUR WINDOWS TODAY", cx, y);
  ctx.textAlign = 'left';
  y += 50;

  // Best window — big card
  const ba = ease(spt, 0.2, 2.0);
  ctx.globalAlpha = alpha * ba;
  const bestH = L.wide ? 160 : 130;
  ctx.shadowColor = 'rgba(212,168,75,0.12)'; ctx.shadowBlur = 24;
  rbox(ctx, contentX, y, contentW, bestH, 10, 'rgba(212,168,75,0.07)', C.goldBd, 2);
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

  ctx.font = f.label; ctx.fillStyle = C.gold;
  ctx.fillText('✦  BEST WINDOW', contentX + 20, y + 32);
  ctx.font = `600 ${Math.round(48 * L.fs)}px "Outfit",sans-serif`; ctx.fillStyle = C.cream;
  ctx.fillText('6:00 – 7:00 AM', contentX + 20, y + 84);
  ctx.font = f.body; ctx.fillStyle = C.creamSub;
  ctx.fillText('♂ Mars hora · Score ' + PEAK, contentX + 20, y + 116);

  // Planet badge on right side
  ctx.beginPath(); ctx.arc(contentX + contentW - 56, y + bestH / 2, 36, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212,168,75,0.10)'; ctx.fill();
  ctx.font = '38px serif'; ctx.fillStyle = C.gold; ctx.textAlign = 'center';
  ctx.fillText('♂', contentX + contentW - 56, y + bestH / 2 + 12);
  ctx.textAlign = 'left';

  if (L.wide) y += bestH + 24; else y += bestH + 16;

  // Avoid window
  const aa = ease(spt, 0.6, 2.0);
  ctx.globalAlpha = alpha * aa;
  const avoidH = L.wide ? 130 : 110;
  rbox(ctx, contentX, y, contentW, avoidH, 10, 'rgba(0,0,0,0.45)', C.redBd, 1.5);
  ctx.font = f.label; ctx.fillStyle = C.red;
  ctx.fillText('⚠  AVOID', contentX + 20, y + 30);
  ctx.font = `600 ${Math.round(42 * L.fs)}px "Outfit",sans-serif`; ctx.fillStyle = C.cream;
  ctx.fillText('1:00 – 3:00 PM', contentX + 20, y + 74);
  ctx.font = f.body; ctx.fillStyle = C.creamSub;
  ctx.fillText('♄ Saturn · Low energy phase', contentX + 20, y + 106);

  y += avoidH + 24;

  // Hook question
  const hk = ease(spt, 1.0, 2.0);
  ctx.globalAlpha = alpha * hk;
  rbox(ctx, contentX, y, contentW, 52, 6, C.redDim, C.redBd, 1);
  ctx.font = f.sm; ctx.fillStyle = C.red; ctx.textAlign = 'center';
  ctx.fillText('Gym at 2 PM? That\'s your worst hour 🤔', cx, y + 34);
  ctx.textAlign = 'left';
}

/* ── Slide C: 24-Hour Chart ──────────────────────────────────────────── */

function drawSlideChart(
  ctx: CanvasRenderingContext2D, L: Layout, f: F,
  alpha: number, pt: number, _t: number,
) {
  const { W, H, pad } = L;
  const cx = W / 2;
  const spt = pt - SLIDES[2].start;
  const chartPad = L.wide ? 80 : pad;
  const chartW = W - chartPad * 2;
  let y = pad + 110;

  // Title
  const ta = ease(spt, 0, 2.0);
  ctx.globalAlpha = alpha * ta;
  ctx.font = f.label; ctx.fillStyle = C.cream; ctx.textAlign = 'left';
  ctx.fillText("TODAY'S 24-HOUR MAP", chartPad, y + 16);
  ctx.font = f.xs; ctx.fillStyle = C.creamDm; ctx.textAlign = 'right';
  ctx.fillText('MON · MAR 14', chartPad + chartW, y + 16);
  ctx.textAlign = 'left';
  y += 34;

  // Chart box
  const chartH = L.wide ? 440 : 320;
  box(ctx, chartPad, y, chartW, chartH, 'rgba(0,0,0,0.28)', C.goldBd2, 1);

  // Day/night zones
  const dayX1 = chartPad + 16 + (6 / 24) * (chartW - 32);
  const dayX2 = chartPad + 16 + (18 / 24) * (chartW - 32);
  ctx.fillStyle = 'rgba(212,168,75,0.03)';
  ctx.fillRect(dayX1, y + 2, dayX2 - dayX1, chartH - 4);

  // Sun/Moon markers
  const sunX = chartPad + 16 + (12 / 24) * (chartW - 32);
  const moonX = chartPad + 16;
  ctx.font = `${Math.round(18 * L.fs)}px serif`; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(212,168,75,0.4)'; ctx.fillText('☉', sunX, y + 18);
  ctx.fillStyle = 'rgba(180,196,216,0.4)'; ctx.fillText('☽', moonX, y + 18);
  ctx.fillStyle = 'rgba(180,196,216,0.4)';
  ctx.fillText('☽', chartPad + 16 + (23.5 / 24) * (chartW - 32), y + 18);
  ctx.textAlign = 'left';

  // Bars
  const barW = (chartW - 32) / 24 - 2;
  const barAreaH = chartH - 50;
  SCORES.forEach((s, h) => {
    const bh = Math.max(3, (s / 100) * barAreaH);
    const bx = chartPad + 16 + h * (barW + 2);
    const by = y + chartH - 16 - bh;
    const ba = ease(spt, 0.2 + h * 0.03, 2.5);
    ctx.globalAlpha = alpha * ta * ba;
    ctx.fillStyle = barCol(s);
    ctx.fillRect(bx, by, barW, bh);
    if (h === PEAK_H) {
      ctx.strokeStyle = C.gold; ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - 1, by - 1, barW + 2, bh + 2);
    }
    if (h === 0 || h === 6 || h === 12 || h === 18 || h === 23) {
      ctx.font = f.tiny; ctx.fillStyle = C.creamDm; ctx.textAlign = 'center';
      ctx.fillText(String(h).padStart(2, '0') + ':00', bx + barW / 2, y + chartH - 2);
      ctx.textAlign = 'left';
    }
  });
  ctx.globalAlpha = alpha * ta;

  // NOW indicator (h=9)
  const ctX = chartPad + 16 + (9 / 24) * (chartW - 32) + barW / 2;
  ctx.beginPath(); ctx.moveTo(ctX, y + 22); ctx.lineTo(ctX, y + chartH - 16);
  ctx.strokeStyle = 'rgba(240,236,216,0.25)'; ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = f.tiny; ctx.fillStyle = C.creamDm; ctx.textAlign = 'center';
  ctx.fillText('NOW', ctX, y + chartH + 14);
  ctx.textAlign = 'left';

  // Legend below chart
  const legY = y + chartH + 30;
  const legs = [
    { col: C.gold, lbl: 'Peak 75+' }, { col: C.sage, lbl: 'Good 50+' },
    { col: 'rgba(255,255,255,0.14)', lbl: 'Low' }, { col: 'rgba(255,255,255,0.04)', lbl: 'Avoid' },
  ];
  let lx = chartPad;
  legs.forEach(l => {
    ctx.fillStyle = l.col; ctx.fillRect(lx, legY, 10, 10);
    ctx.font = f.tiny; ctx.fillStyle = C.creamDm;
    ctx.fillText(l.lbl, lx + 14, legY + 9);
    lx += ctx.measureText(l.lbl).width + 30;
  });
}

/* ── Slide D: CTA ─────────────────────────────────────────────────────── */

function drawSlideCTA(
  ctx: CanvasRenderingContext2D, L: Layout, f: F,
  alpha: number, pt: number, t: number,
) {
  const { W, H, pad } = L;
  const cx = W / 2;
  const spt = pt - SLIDES[3].start;
  let y = L.wide ? H / 2 - 120 : pad + 160;

  const ta = ease(spt, 0, 2.0);
  ctx.globalAlpha = alpha * ta;

  ctx.font = f.heading; ctx.fillStyle = C.cream; ctx.textAlign = 'center';
  ctx.fillText('Your Best Window is 6 – 7 AM', cx, y);
  ctx.font = f.body; ctx.fillStyle = C.creamSub;
  ctx.fillText('Mars hora · Score ' + PEAK + ' · Perfect for Yoga', cx, y + 44);
  y += 90;

  // Pulsing CTA
  const pulse = (Math.sin(t * 1.5) + 1) / 2 * 0.10;
  const btnW = L.wide ? 460 : W - pad * 2;
  const btnX = cx - btnW / 2;
  rbox(ctx, btnX, y, btnW, 64, 8, C.gold, null);
  rbox(ctx, btnX, y, btnW, 64, 8, `rgba(255,255,255,${pulse})`, null);
  ctx.font = f.sm; ctx.fillStyle = '#05050D';
  ctx.fillText('SEE FULL WEEK  →', cx, y + 40);
  ctx.textAlign = 'left';

  // Subtle suggestion
  y += 90;
  ctx.font = f.hookCta; ctx.fillStyle = C.creamDm; ctx.textAlign = 'center';
  ctx.fillText('Get alerts 15 min before every peak window', cx, y);
  ctx.textAlign = 'left';
}

/* ── Main draw — composites all sub-slides ──────────────────────────── */

export const drawResults: PhaseDraw = (ctx, L, f, alpha, phaseT, t) => {
  ctx.save(); ctx.globalAlpha = alpha;

  drawHeader(ctx, L, f);

  // Render each sub-slide with its fade
  const drawFns = [drawSlideZodiac, drawSlideBestAvoid, drawSlideChart, drawSlideCTA];
  SLIDES.forEach((s, i) => {
    const sa = slideAlpha(phaseT, s);
    if (sa > 0.01) {
      ctx.save();
      ctx.globalAlpha = alpha * sa;
      drawFns[i](ctx, L, f, alpha * sa, phaseT, t);
      ctx.restore();
    }
  });

  ctx.globalAlpha = alpha;
  ctx.restore();
};
