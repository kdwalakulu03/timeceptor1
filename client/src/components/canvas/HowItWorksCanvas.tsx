/**
 * canvas/HowItWorksCanvas.tsx — Player-style orchestrator.
 *
 * Interactive controls drawn ON the canvas:
 *   ‹ › side arrows    — navigate between phases
 *   ● ○ ○ ○ phase dots — jump to any phase
 *   center click       — pause / play
 *   keyboard           — ← → Space
 *   progress bar       — shows position within current phase
 *
 * Four phases (47 s auto-play, looping):
 *   1. DISCOVER   14 s
 *   2. CALCULATE   3 s
 *   3. RESULTS    20 s  (4 sub-slides, 5 s each)
 *   4. ALERTS     10 s
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  type Layout, type F, type Star,
  getLayout, mkF, makeStars,
  C, P_DUR, TOTAL, PHASE_LABELS,
  drawGlow, drawStars,
} from './shared';
import { drawForm }    from './phaseForm';
import { drawCalc }    from './phaseCalc';
import { drawResults } from './phaseResults';
import { drawAlerts }  from './phaseAlerts';

/* ═══ Phase renderers (indexed) ═══════════════════════════════════════════ */

const PHASES = [drawForm, drawCalc, drawResults, drawAlerts] as const;
const FADE_SPD = 2.5; // 0→1 in ~0.4 s

/* ═══ Hit-test zones ═════════════════════════════════════════════════════ */

type Zone = 'left' | 'right' | 'center' | 'dot0' | 'dot1' | 'dot2' | 'dot3';

/** Convert pointer coordinates to canvas-space. */
function canvasXY(
  e: { clientX: number; clientY: number },
  canvas: HTMLCanvasElement,
  L: Layout,
): [number, number] {
  const rect = canvas.getBoundingClientRect();
  return [
    ((e.clientX - rect.left) / rect.width)  * L.W,
    ((e.clientY - rect.top)  / rect.height) * L.H,
  ];
}

/** Geometry constants for all interactive controls. */
function controlGeom(L: Layout) {
  const { W, H, pad } = L;
  const arrowR  = L.wide ? 30 : 26;
  const arrowY  = H * 0.48;
  const lx      = pad + arrowR + 12;
  const rx      = W - pad - arrowR - 12;
  const barY    = H - 72;                           // dots vertical center
  const dotGap  = L.wide ? 36 : 30;
  const dotsX0  = W / 2 - ((3) * dotGap) / 2;      // center of first dot
  return { arrowR, arrowY, lx, rx, barY, dotGap, dotsX0 };
}

/** Determine which interactive zone a point lands in. */
function hitTest(x: number, y: number, L: Layout): Zone {
  const g = controlGeom(L);
  // Side arrows (generous hit areas)
  if (Math.hypot(x - g.lx, y - g.arrowY) < g.arrowR + 16) return 'left';
  if (Math.hypot(x - g.rx, y - g.arrowY) < g.arrowR + 16) return 'right';
  // Phase dots
  for (let i = 0; i < 4; i++) {
    const dx = g.dotsX0 + i * g.dotGap;
    if (Math.hypot(x - dx, y - g.barY) < 20) return `dot${i}` as Zone;
  }
  return 'center';
}

/* ═══ Draw player controls overlay ════════════════════════════════════════ */

function drawControls(
  ctx: CanvasRenderingContext2D,
  L:   Layout,
  f:   F,
  phase:   number,
  phaseT:  number,
  paused:  boolean,
  hover:   Zone | null,
) {
  const { W, H } = L;
  const g = controlGeom(L);

  ctx.save();

  /* ── Side arrows ── */

  const drawArrow = (cx: number, cy: number, dir: 1 | -1, hot: boolean) => {
    const base = paused ? 0.65 : 0.20;
    ctx.globalAlpha = hot ? 0.85 : base;

    // background circle
    ctx.beginPath();
    ctx.arc(cx, cy, g.arrowR, 0, Math.PI * 2);
    ctx.fillStyle = hot ? 'rgba(212,168,75,0.14)' : 'rgba(5,5,13,0.50)';
    ctx.fill();
    ctx.strokeStyle = hot ? C.goldBd : 'rgba(212,168,75,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // chevron path
    const s = g.arrowR * 0.38;
    ctx.beginPath();
    ctx.moveTo(cx + dir * s,  cy - s * 1.3);
    ctx.lineTo(cx - dir * s,  cy);
    ctx.lineTo(cx + dir * s,  cy + s * 1.3);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
  };

  drawArrow(g.lx, g.arrowY,  1, hover === 'left');   // ‹ previous
  drawArrow(g.rx, g.arrowY, -1, hover === 'right');   // › next

  /* ── Phase dots ── */

  for (let i = 0; i < 4; i++) {
    const dx      = g.dotsX0 + i * g.dotGap;
    const active  = i === phase;
    const hot     = hover === `dot${i}`;

    ctx.globalAlpha = active ? 0.90 : hot ? 0.60 : 0.30;
    ctx.beginPath();
    ctx.arc(dx, g.barY, active ? 6.5 : 4.5, 0, Math.PI * 2);

    if (active) {
      ctx.fillStyle = C.gold;
      ctx.fill();
    } else {
      ctx.fillStyle = hot ? 'rgba(212,168,75,0.25)' : 'transparent';
      ctx.fill();
      ctx.strokeStyle = 'rgba(212,168,75,0.30)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }
  }

  /* ── Phase label (above dots) ── */

  ctx.globalAlpha = 0.45;
  ctx.font        = f.tiny;
  ctx.fillStyle   = C.creamDm;
  ctx.textAlign   = 'center';
  ctx.fillText(`${phase + 1} / 4  ·  ${PHASE_LABELS[phase]}`, W / 2, g.barY - 18);

  /* ── Segmented progress bar (below dots) ── */

  const barTotalW = L.wide ? 300 : 220;
  const barH      = 3;
  const barX0     = W / 2 - barTotalW / 2;
  const barY      = g.barY + 18;

  ctx.globalAlpha = 0.35;
  let sx = barX0;
  for (let i = 0; i < 4; i++) {
    const segW = (P_DUR[i] / TOTAL) * barTotalW;

    // background track
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(sx, barY, segW - 2, barH);

    // fill
    if (i < phase) {
      ctx.fillStyle = 'rgba(212,168,75,0.30)';
      ctx.fillRect(sx, barY, segW - 2, barH);
    } else if (i === phase) {
      const frac = Math.min(1, phaseT / P_DUR[i]);
      ctx.fillStyle = C.gold;
      ctx.fillRect(sx, barY, (segW - 2) * frac, barH);
    }

    sx += segW;
  }

  /* ── Pause indicator ── */

  if (paused) {
    const py = g.arrowY;
    const sz = L.wide ? 22 : 18;

    // play triangle (subtle, doesn't block content)
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(W / 2 - sz * 0.45, py - sz);
    ctx.lineTo(W / 2 - sz * 0.45, py + sz);
    ctx.lineTo(W / 2 + sz * 0.85, py);
    ctx.closePath();
    ctx.fillStyle = C.gold;
    ctx.fill();

    ctx.globalAlpha = 0.28;
    ctx.font      = f.tiny;
    ctx.fillStyle = C.creamDm;
    ctx.fillText('PAUSED  ·  TAP TO PLAY', W / 2, py + sz + 28);
  }

  /* ── Footer ── */

  ctx.globalAlpha = 0.38;
  ctx.font      = f.xs;
  ctx.fillStyle = C.creamDm;
  ctx.fillText('timeceptor.com', W / 2, H - 20);

  ctx.textAlign = 'left';
  ctx.restore();
}

/* ═══ React Component ═════════════════════════════════════════════════════ */

export function HowItWorksCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  const [visible, setVisible] = useState(false);
  const [layout,  setLayout]  = useState<Layout>(() =>
    getLayout(typeof window !== 'undefined' ? window.innerWidth : 1200),
  );

  const starsRef = useRef(makeStars(layout));
  const fontsRef = useRef(mkF(layout.fs));

  /* ── Animation state (refs so the rAF loop doesn't re-render React) ── */

  const pausedRef    = useRef(false);
  const phaseRef     = useRef(0);
  const phaseTimeRef = useRef(0);
  const fadeRef      = useRef(1);            // 0→1 fade-in on phase switch
  const hoverRef     = useRef<Zone | null>(null);

  /** Jump to a phase, resetting its timer and triggering a fade-in. */
  const gotoPhase = useCallback((idx: number) => {
    phaseRef.current     = ((idx % 4) + 4) % 4;
    phaseTimeRef.current = 0;
    fadeRef.current       = 0;
  }, []);

  /* ── Layout (resize) ── */

  const updateLayout = useCallback(() => {
    const w = containerRef.current?.clientWidth ?? window.innerWidth;
    const nl = getLayout(w);
    setLayout(prev => {
      if (prev.W === nl.W && prev.H === nl.H) return prev;
      starsRef.current = makeStars(nl);
      fontsRef.current = mkF(nl.fs);
      return nl;
    });
  }, []);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  /* ── Intersection observer (play only when visible) ── */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── Canvas sizing ── */

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width  = layout.W;
    c.height = layout.H;
  }, [layout]);

  /* ── Pointer & keyboard events ── */

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const L = layout;

    const onMove = (e: PointerEvent) => {
      const [x, y] = canvasXY(e, c, L);
      hoverRef.current = hitTest(x, y, L);
    };

    const onClick = (e: MouseEvent) => {
      const [x, y] = canvasXY(e, c, L);
      const zone = hitTest(x, y, L);

      if (zone === 'left') {
        gotoPhase(phaseRef.current - 1);
        pausedRef.current = true;            // manual nav → pause
      } else if (zone === 'right') {
        gotoPhase(phaseRef.current + 1);
        pausedRef.current = true;
      } else if (zone.startsWith('dot')) {
        gotoPhase(parseInt(zone[3]));
        pausedRef.current = true;
      } else {
        pausedRef.current = !pausedRef.current;  // center → toggle
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  { gotoPhase(phaseRef.current - 1); pausedRef.current = true; }
      if (e.key === 'ArrowRight') { gotoPhase(phaseRef.current + 1); pausedRef.current = true; }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
      }
    };

    const onLeave = () => { hoverRef.current = null; };

    c.addEventListener('pointermove',  onMove);
    c.addEventListener('click',        onClick);
    c.addEventListener('keydown',      onKey);
    c.addEventListener('pointerleave', onLeave);

    return () => {
      c.removeEventListener('pointermove',  onMove);
      c.removeEventListener('click',        onClick);
      c.removeEventListener('keydown',      onKey);
      c.removeEventListener('pointerleave', onLeave);
    };
  }, [layout, gotoPhase]);

  /* ── Animation loop ── */

  useEffect(() => {
    if (!visible) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let lastMs = performance.now();
    const L = layout, F = fontsRef.current, S = starsRef.current;

    function loop(now: number) {
      const dt      = Math.min((now - lastMs) / 1000, 0.1); // cap to avoid jumps
      lastMs        = now;
      const globalT = now / 1000;

      /* advance phase time if playing */
      if (!pausedRef.current) {
        phaseTimeRef.current += dt;
        if (phaseTimeRef.current >= P_DUR[phaseRef.current]) {
          phaseRef.current     = (phaseRef.current + 1) % 4;
          phaseTimeRef.current = 0;
          fadeRef.current      = 0;
        }
      }

      /* advance fade-in */
      fadeRef.current = Math.min(1, fadeRef.current + dt * FADE_SPD);

      const phase = phaseRef.current;
      const pt    = phaseTimeRef.current;
      const fade  = fadeRef.current;

      /* ── draw ── */
      ctx.clearRect(0, 0, L.W, L.H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, L.W, L.H);
      drawGlow(ctx, L);
      drawStars(ctx, S, globalT);

      // current phase content (with fade-in alpha)
      PHASES[phase](ctx, L, F, fade, pt, globalT);

      // controls overlay (always at full alpha relative to visible)
      drawControls(ctx, L, F, phase, pt, pausedRef.current, hoverRef.current);

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, layout]);

  /* ── JSX ── */

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="w-full rounded-lg border border-gold/10 shadow-2xl outline-none"
        style={{
          height: 'auto',
          aspectRatio: layout.wide ? '5 / 3' : '3 / 4',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
