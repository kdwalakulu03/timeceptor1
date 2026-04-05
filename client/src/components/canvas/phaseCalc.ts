/**
 * canvas/phaseCalc.ts — Phase 2: CALCULATING
 *
 * Orbiting planets, scan arm, progress bar. ~2s duration.
 */
import {
  type Layout, type F, C,
  ORBS, PEAK,
  box, drawHeader,
  type PhaseDraw,
} from './shared';

export const drawCalc: PhaseDraw = (ctx, L, f, alpha, phaseT, t) => {
  ctx.save(); ctx.globalAlpha = alpha;
  const { W, H } = L;
  const cx = W / 2, cy = L.wide ? H / 2 - 10 : H / 2 - 50;
  const os = L.wide ? 120 : 110;

  drawHeader(ctx, L, f);

  ctx.font = f.sm; ctx.fillStyle = C.cream; ctx.textAlign = 'center';
  ctx.fillText('CALCULATING PLANETARY POSITIONS', cx, cy - os * 2.8);
  ctx.font = f.xs; ctx.fillStyle = C.creamSub;
  ctx.fillText('NATAL CHART  ×  DAILY TRANSITS', cx, cy - os * 2.8 + 30);

  // Orbit rings
  ORBS.forEach(o => {
    ctx.beginPath(); ctx.arc(cx, cy, o.r * os, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212,168,75,0.04)'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 9]); ctx.stroke(); ctx.setLineDash([]);
  });

  // Scan arm
  const sa = t * 0.8;
  const armLen = os * 2.8;
  const sg = ctx.createLinearGradient(cx, cy, cx + Math.cos(sa) * armLen, cy + Math.sin(sa) * armLen);
  sg.addColorStop(0, 'rgba(212,168,75,0)'); sg.addColorStop(1, 'rgba(212,168,75,0.22)');
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(sa) * armLen, cy + Math.sin(sa) * armLen);
  ctx.strokeStyle = sg; ctx.lineWidth = 1.5; ctx.stroke();

  // Planets
  ORBS.forEach((o, i) => {
    const r = o.r * os;
    const ang = i * (Math.PI * 2 / 7) + t * o.spd;
    for (let k = 1; k <= 5; k++) {
      const ta = ang - k * 0.07;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ta) * r, cy + Math.sin(ta) * r, 3, 0, Math.PI * 2);
      const hexA = Math.floor((1 - k / 5) * 0.3 * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = o.col + hexA; ctx.fill();
    }
    const ox = cx + Math.cos(ang) * r, oy = cy + Math.sin(ang) * r;
    ctx.beginPath(); ctx.arc(ox, oy, 10, 0, Math.PI * 2);
    ctx.fillStyle = o.col; ctx.fill();
    ctx.font = `${Math.round(20 * L.fs)}px serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(o.sym, ox, oy + 7);
  });

  // Center
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = C.gold; ctx.fill();

  // Progress bar
  const prog = Math.min(1, phaseT / 1.5);
  const bW = L.wide ? 440 : 360, bX = cx - bW / 2, bY = cy + os * 2.8 + 16;
  ctx.font = f.xs; ctx.fillStyle = C.creamSub; ctx.textAlign = 'center';
  ctx.fillText('SCORING YOUR WINDOWS', cx, bY - 20);
  box(ctx, bX, bY, bW, 4, 'rgba(255,255,255,0.06)', null);
  if (prog > 0) box(ctx, bX, bY, bW * prog, 4, C.gold, null);
  ctx.font = f.md; ctx.fillStyle = C.gold;
  ctx.fillText(Math.round(prog * 100) + '%', cx, bY + 40);
  ctx.textAlign = 'left';

  ctx.restore();
};
