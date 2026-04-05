/**
 * canvas/phaseForm.ts — Phase 1: FORM
 *
 * Layout (desktop): main area = services (big, full-width) → DOB fields below.
 *   Right sidebar = rotating emotional hook (slow, readable).
 * Layout (mobile): stacked — hook → services → fields.
 *
 * No pointless left/right content split.
 */
import {
  type Layout, type F, C,
  HOOKS, SERVICES, FIELDS, ORBS,
  P_DUR, CHAR_MS, PAUSE_MS, SVC_DWELL, HOOK_DWELL,
  hRule, box, ease, drawHeader,
  type PhaseDraw,
} from './shared';

/* ── Compute helpers ─────────────────────────────────────────────────── */

function getHookIdx(pt: number) { return Math.floor(pt / HOOK_DWELL) % HOOKS.length; }
function getHookFade(pt: number) {
  const c = pt % HOOK_DWELL;
  if (c < 0.6) return c / 0.6;
  if (c > HOOK_DWELL - 0.6) return (HOOK_DWELL - c) / 0.6;
  return 1;
}

function getSvcIdx(pt: number) {
  if (pt >= P_DUR[0] - 1.5) return 0;
  return Math.floor(pt / SVC_DWELL) % SERVICES.length;
}

function getTyping(pt: number) {
  let ms = Math.max(0, pt - 4.0) * 1000; // typing starts later (4s)
  let field = 0, chars = 0, done = false;
  for (let fi = 0; fi < FIELDS.length; fi++) {
    const len = FIELDS[fi].value.length;
    const typeT = len * CHAR_MS;
    if (ms <= 0) { field = fi; chars = 0; break; }
    if (ms < typeT) { field = fi; chars = Math.floor(ms / CHAR_MS); break; }
    ms -= typeT;
    if (ms < PAUSE_MS) { field = fi; chars = len; break; }
    ms -= PAUSE_MS;
    if (fi === FIELDS.length - 1) { done = true; field = fi; chars = len; }
  }
  return { field, chars, done };
}

/* ── Input field widget ──────────────────────────────────────────────── */

function drawInput(
  ctx: CanvasRenderingContext2D, f: F,
  label: string, value: string,
  x: number, y: number, w: number, h: number,
  active: boolean, t: number, alpha: number,
) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = f.label; ctx.fillStyle = C.gold;
  ctx.fillText(label, x, y);
  const by = y + 14;
  if (active) { ctx.shadowColor = 'rgba(212,168,75,0.20)'; ctx.shadowBlur = 12; }
  box(ctx, x, by, w, h, 'rgba(0,0,0,0.75)', active ? C.gold : C.goldBd2, active ? 2 : 1);
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  ctx.font = f.body; ctx.fillStyle = C.cream;
  ctx.fillText(value, x + 14, by + h * 0.66);
  if (active && Math.sin(t * 4.5) > 0) {
    const tw = ctx.measureText(value).width;
    ctx.fillStyle = C.gold; ctx.fillRect(x + 14 + tw + 2, by + h * 0.2, 2, h * 0.5);
  }
  ctx.restore();
}

/* ── Main draw ───────────────────────────────────────────────────────── */

export const drawForm: PhaseDraw = (ctx, L, f, alpha, phaseT, t) => {
  ctx.save(); ctx.globalAlpha = alpha;
  const { W, H, pad } = L;
  const cx = W / 2;
  const hook = HOOKS[getHookIdx(phaseT)];
  const hookA = getHookFade(phaseT);
  const svcIdx = getSvcIdx(phaseT);
  const typing = getTyping(phaseT);

  drawHeader(ctx, L, f);

  if (L.wide) {
    /* ═══ DESKTOP ═══
     * Main area (left 72%): services (big) → fields below
     * Sidebar (right 26%): rotating curious hook, slow readable
     */
    const mainX = pad, mainW = W * 0.70 - pad;
    const sideX = W * 0.72, sideW = W - sideX - pad;
    let my = pad + 100;

    // ── CHOOSE ACTIVITY heading
    ctx.font = f.label; ctx.fillStyle = C.creamDm;
    ctx.fillText('CHOOSE ACTIVITY', mainX, my + 14);
    my += 36;

    // ── Services — BIG tiles, full main width, 2 rows if needed
    const cols = SERVICES.length;
    const gap = 10;
    const tileW = (mainW - (cols - 1) * gap) / cols;
    const tileH = 110;
    SERVICES.forEach((s, i) => {
      const isA = i === svcIdx;
      const tx = mainX + i * (tileW + gap);
      const ty = my;
      ctx.globalAlpha = alpha * (isA ? 1 : 0.30);
      box(ctx, tx, ty, tileW, tileH,
        isA ? 'rgba(212,168,75,0.10)' : 'rgba(0,0,0,0.25)',
        isA ? C.goldBd : C.goldBd2,
        isA ? 2 : 1);
      // Icon big
      ctx.font = `${isA ? 40 : 30}px serif`; ctx.textAlign = 'center';
      ctx.fillStyle = C.cream;
      ctx.fillText(s.icon, tx + tileW / 2, ty + 50);
      // Label
      ctx.font = isA ? f.sm : f.svc;
      ctx.fillStyle = isA ? C.gold : C.creamDm;
      ctx.fillText(s.label.toUpperCase(), tx + tileW / 2, ty + 84);
      ctx.textAlign = 'left';
    });
    ctx.globalAlpha = alpha;
    my += tileH + 12;

    // Pulsing selected
    ctx.font = f.xs; ctx.fillStyle = C.gold;
    ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(t * 1.5));
    ctx.fillText(`▸  Optimizing for ${SERVICES[svcIdx].label}`, mainX, my + 8);
    ctx.globalAlpha = alpha;
    my += 28;

    hRule(ctx, L, my); my += 20;

    // ── BIRTH DETAILS — right below services, same main area
    ctx.font = f.label; ctx.fillStyle = C.creamDm;
    ctx.fillText('YOUR BIRTH DETAILS', mainX, my + 10);
    my += 34;

    const fW = (mainW - 14) / 2, fh = 54;
    const dv = typing.field > 0 ? FIELDS[0].value : FIELDS[0].value.slice(0, typing.chars);
    drawInput(ctx, f, FIELDS[0].label, dv, mainX, my, fW, fh, typing.field === 0, t, alpha);

    const tv = typing.field > 1 ? FIELDS[1].value : typing.field === 1 ? FIELDS[1].value.slice(0, typing.chars) : '';
    drawInput(ctx, f, FIELDS[1].label, tv, mainX + fW + 14, my, fW, fh, typing.field === 1, t, alpha);

    const lv = typing.field >= 2 ? (typing.field > 2 ? FIELDS[2].value : FIELDS[2].value.slice(0, typing.chars)) : '';
    drawInput(ctx, f, FIELDS[2].label, lv, mainX, my + 90, mainW, fh, typing.field === 2, t, alpha);

    // CTA button
    const btnAlpha = typing.done ? ease(phaseT, 8.0, 1.5) : 0;
    if (btnAlpha > 0.01) {
      ctx.globalAlpha = alpha * btnAlpha;
      const btnY = my + 175;
      const pulse = (Math.sin(t * 1.5) + 1) / 2 * 0.10;
      box(ctx, mainX, btnY, mainW, 58, C.gold, null);
      box(ctx, mainX, btnY, mainW, 58, `rgba(255,255,255,${pulse})`, null);
      ctx.font = f.sm; ctx.fillStyle = '#05050D'; ctx.textAlign = 'center';
      ctx.fillText('✦  REVEAL MY COSMIC WINDOW', mainX + mainW / 2, btnY + 38);
      ctx.textAlign = 'left';
    }
    ctx.globalAlpha = alpha;

    // ── RIGHT SIDEBAR — rotating emotional hook
    let sy = pad + 100;
    // Decorative border
    ctx.strokeStyle = C.goldBd2; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sideX - 16, sy); ctx.lineTo(sideX - 16, H - pad - 40);
    ctx.stroke();

    ctx.globalAlpha = alpha * hookA;
    // Emoji
    ctx.font = `${Math.round(48 * L.fs)}px serif`; ctx.textAlign = 'left';
    ctx.fillStyle = C.cream;
    ctx.fillText(hook.emoji, sideX, sy + 10);
    sy += 50;

    // Line 1
    ctx.font = f.hook; ctx.fillStyle = C.cream;
    wrapText(ctx, hook.l1, sideX, sy, sideW, 36);
    sy += lineCount(ctx, hook.l1, sideW) * 36 + 8;

    // Line 2 (gold emphasis)
    ctx.font = f.hookEm; ctx.fillStyle = C.goldHi;
    wrapText(ctx, hook.l2, sideX, sy, sideW, 36);
    sy += lineCount(ctx, hook.l2, sideW) * 36 + 14;

    // CTA italic
    ctx.font = f.hookCta; ctx.fillStyle = C.creamDm;
    wrapText(ctx, hook.cta, sideX, sy, sideW, 26);
    ctx.globalAlpha = alpha;

    // Decorative mini orbits at bottom of sidebar
    const orbCx = sideX + sideW / 2, orbCy = H - pad - 120;
    ctx.globalAlpha = alpha * 0.15;
    ORBS.slice(0, 4).forEach((o, i) => {
      const r = o.r * 36;
      ctx.beginPath(); ctx.arc(orbCx, orbCy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212,168,75,0.06)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([]);
      const ang = i * (Math.PI * 2 / 4) + t * o.spd * 0.4;
      ctx.beginPath(); ctx.arc(orbCx + Math.cos(ang) * r, orbCy + Math.sin(ang) * r, 4, 0, Math.PI * 2);
      ctx.fillStyle = o.col; ctx.fill();
    });

  } else {
    /* ═══ MOBILE — stacked: hook → services → fields ═══ */
    let y = pad + 100;

    // Emotional hook
    ctx.globalAlpha = alpha * hookA;
    ctx.font = `${Math.round(38 * L.fs)}px serif`; ctx.textAlign = 'center';
    ctx.fillStyle = C.cream; ctx.fillText(hook.emoji, cx, y);
    y += 40;
    ctx.font = f.hook; ctx.fillStyle = C.cream;
    ctx.fillText(hook.l1, cx, y);
    ctx.font = f.hookEm; ctx.fillStyle = C.goldHi;
    ctx.fillText(hook.l2, cx, y + 38);
    ctx.font = f.hookCta; ctx.fillStyle = C.creamDm;
    ctx.fillText(hook.cta, cx, y + 74);
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'left';
    y += 110;

    hRule(ctx, L, y); y += 24;

    // Service row
    const sw = (W - pad * 2) / SERVICES.length;
    SERVICES.forEach((s, i) => {
      const sx = pad + i * sw;
      const isA = i === svcIdx;
      ctx.globalAlpha = alpha * (isA ? 1 : 0.3);
      box(ctx, sx, y, sw - 6, 82, isA ? 'rgba(212,168,75,0.10)' : null, isA ? C.goldBd : C.goldBd2, isA ? 2 : 1);
      ctx.font = `${isA ? 30 : 24}px serif`; ctx.textAlign = 'center';
      ctx.fillText(s.icon, sx + sw / 2, y + 38);
      ctx.font = f.svc; ctx.fillStyle = isA ? C.gold : C.creamDm;
      ctx.fillText(s.label.toUpperCase(), sx + sw / 2, y + 66);
      ctx.textAlign = 'left';
    });
    ctx.globalAlpha = alpha;
    y += 106;

    ctx.font = f.xs; ctx.fillStyle = C.gold; ctx.textAlign = 'center';
    ctx.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(t * 1.5));
    ctx.fillText(`▸  ${SERVICES[svcIdx].label}`, cx, y);
    ctx.globalAlpha = alpha; ctx.textAlign = 'left';
    y += 28;
    hRule(ctx, L, y); y += 26;

    // Fields
    const colW = (W - pad * 2 - 14) / 2, fh = 54;
    const dv = typing.field > 0 ? FIELDS[0].value : FIELDS[0].value.slice(0, typing.chars);
    drawInput(ctx, f, FIELDS[0].label, dv, pad, y, colW, fh, typing.field === 0, t, alpha);
    const tv = typing.field > 1 ? FIELDS[1].value : typing.field === 1 ? FIELDS[1].value.slice(0, typing.chars) : '';
    drawInput(ctx, f, FIELDS[1].label, tv, pad + colW + 14, y, colW, fh, typing.field === 1, t, alpha);
    const lv = typing.field >= 2 ? (typing.field > 2 ? FIELDS[2].value : FIELDS[2].value.slice(0, typing.chars)) : '';
    drawInput(ctx, f, FIELDS[2].label, lv, pad, y + 90, W - pad * 2, fh, typing.field === 2, t, alpha);

    // CTA
    const btnAlpha = typing.done ? ease(phaseT, 8.0, 1.5) : 0;
    if (btnAlpha > 0.01) {
      ctx.globalAlpha = alpha * btnAlpha;
      const btnY = y + 180;
      const pulse = (Math.sin(t * 1.5) + 1) / 2 * 0.10;
      box(ctx, pad, btnY, W - pad * 2, 64, C.gold, null);
      box(ctx, pad, btnY, W - pad * 2, 64, `rgba(255,255,255,${pulse})`, null);
      ctx.font = f.sm; ctx.fillStyle = '#05050D'; ctx.textAlign = 'center';
      ctx.fillText('✦  REVEAL MY COSMIC WINDOW', cx, btnY + 40);
      ctx.textAlign = 'left';
    }
  }

  ctx.globalAlpha = alpha;
  ctx.restore();
};

/* ── Text wrapping helper ────────────────────────────────────────────── */

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(' ');
  let line = '', ly = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ly); ly += lineH; line = w;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, ly);
}

function lineCount(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' ');
  let line = '', count = 1;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { count++; line = w; }
    else { line = test; }
  }
  return count;
}
