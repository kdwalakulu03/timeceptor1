/**
 * canvas/shared.ts — All shared types, constants, data, colors, fonts, and
 * drawing primitives used by every phase renderer.
 */

/* ═══ Layout ══════════════════════════════════════════════════════════════ */

export interface Layout {
  W: number; H: number;
  pad: number;
  fs: number;
  wide: boolean;
}

export function getLayout(containerW: number): Layout {
  if (containerW >= 768) return { W: 1600, H: 960, pad: 60, fs: 1.0, wide: true };
  return { W: 1080, H: 1440, pad: 50, fs: 0.85, wide: false };
}

/* ═══ Colors ══════════════════════════════════════════════════════════════ */

export const C = {
  bg:       '#05050D',
  gold:     '#D4A84B',
  goldHi:   '#F0C96A',
  goldDim:  'rgba(212,168,75,0.18)',
  goldBd:   'rgba(212,168,75,0.40)',
  goldBd2:  'rgba(212,168,75,0.18)',
  cream:    '#F0ECD8',
  creamSub: 'rgba(240,236,216,0.70)',
  creamDm:  'rgba(240,236,216,0.40)',
  sage:     '#7BAF8D',
  sageDim:  'rgba(123,175,141,0.35)',
  red:      '#D46868',
  redDim:   'rgba(212,104,104,0.15)',
  redBd:    'rgba(212,104,104,0.30)',
  border:   'rgba(255,255,255,0.06)',
};

/* ═══ Scaled fonts ════════════════════════════════════════════════════════ */

export function mkF(s: number) {
  const px = (n: number) => Math.round(n * s);
  return {
    logo:    `600 ${px(26)}px "JetBrains Mono",monospace`,
    xs:      `600 ${px(20)}px "JetBrains Mono",monospace`,
    sm:      `600 ${px(24)}px "JetBrains Mono",monospace`,
    md:      `600 ${px(30)}px "JetBrains Mono",monospace`,
    label:   `600 ${px(22)}px "JetBrains Mono",monospace`,
    body:    `400 ${px(26)}px "Outfit",sans-serif`,
    bodyLg:  `400 ${px(32)}px "Outfit",sans-serif`,
    heading: `500 ${px(46)}px "Outfit",sans-serif`,
    title:   `600 ${px(64)}px "Outfit",sans-serif`,
    hook:    `400 ${px(30)}px "Outfit",sans-serif`,
    hookEm:  `500 ${px(30)}px "Outfit",sans-serif`,
    hookCta: `400 italic ${px(20)}px "Outfit",sans-serif`,
    svc:     `600 ${px(20)}px "JetBrains Mono",monospace`,
    tiny:    `500 ${px(15)}px "JetBrains Mono",monospace`,
  };
}
export type F = ReturnType<typeof mkF>;

/* ═══ Data ════════════════════════════════════════════════════════════════ */

export const HOOKS = [
  { emoji: '🧘', l1: 'Did your morning yoga leave you', l2: 'more tired than refreshed?', cta: 'Generic timings don\'t work for everyone.' },
  { emoji: '🏋️', l1: 'Given up on your gym session', l2: 'before you even broke a sweat?', cta: 'Maybe it was the wrong hour — not you.' },
  { emoji: '🧠', l1: 'Tried to meditate but your mind', l2: 'kept racing the whole time?', cta: 'Planetary hours affect your focus.' },
  { emoji: '📈', l1: 'Made a business call at the wrong time', l2: 'and the deal slipped away?', cta: 'Timing is everything in decisions.' },
  { emoji: '🎨', l1: 'Sat down to create something', l2: 'but the flow just never came?', cta: 'Creativity peaks at specific hours.' },
];

export const SERVICES = [
  { label: 'Yoga', icon: '🧘' },
  { label: 'Gym', icon: '🏋️' },
  { label: 'Meditate', icon: '🪬' },
  { label: 'Business', icon: '💼' },
  { label: 'Creative', icon: '✍️' },
];

export const FIELDS = [
  { label: 'DATE OF BIRTH', value: '14 / 03 / 1990' },
  { label: 'TIME OF BIRTH', value: '06:45 AM' },
  { label: 'LOCATION',      value: 'Mumbai, India' },
];

export const ORBS = [
  { sym: '☉', r: 1.0,  spd: 0.018, col: '#D4A84B' },
  { sym: '☽', r: 1.50, spd: 0.028, col: '#B8C4D8' },
  { sym: '♂', r: 1.96, spd: 0.013, col: '#D06050' },
  { sym: '☿', r: 1.26, spd: 0.032, col: '#80C8B0' },
  { sym: '♃', r: 2.30, spd: 0.009, col: '#D0A860' },
  { sym: '♀', r: 1.70, spd: 0.022, col: '#D080B0' },
  { sym: '♄', r: 2.60, spd: 0.007, col: '#8090C0' },
];

export const PREDICTIONS = [
  { icon: '🔥', text: 'You are ♈ Aries — fire sign, Mars ruled' },
  { icon: '🍽️', text: 'Avoid heavy meals after 3 PM today' },
  { icon: '📅', text: 'Skip new projects on Saturday this week' },
  { icon: '💧', text: 'Fire element dominant — stay hydrated' },
  { icon: '🌙', text: 'Moon in 4th house — rest before 10 PM' },
];

/* ═══ Timings ═════════════════════════════════════════════════════════════ */

export const P_DUR   = [14.0, 3.0, 20.0, 10.0]; // 47s total
export const TOTAL   = P_DUR[0] + P_DUR[1] + P_DUR[2] + P_DUR[3];
export const PHASE_LABELS = ['DISCOVER', 'CALCULATE', 'YOUR RESULTS', 'GET ALERTS'];
export const CHAR_MS     = 85;
export const PAUSE_MS    = 700;
export const SVC_DWELL   = 1.3;
export const HOOK_DWELL  = 4.0;

/* ═══ Hourly scores ═══════════════════════════════════════════════════════ */

function mkScores() {
  return Array.from({ length: 24 }, (_, h) => {
    if (h >= 5 && h <= 7)   return 65 + (h * 11) % 30;
    if (h >= 17 && h <= 19) return 55 + (h * 7) % 25;
    if (h >= 21 || h <= 3)  return 3 + (h * 2) % 8;
    if (h >= 13 && h <= 15) return 8 + (h * 3) % 10;
    return 15 + (h * 4) % 18;
  });
}
export const SCORES = mkScores();
export const PEAK   = Math.max(...SCORES);
export const PEAK_H = SCORES.indexOf(PEAK);

export function barCol(s: number) {
  if (s >= 75) return C.gold;
  if (s >= 50) return C.sage;
  if (s >= 25) return 'rgba(255,255,255,0.14)';
  return 'rgba(255,255,255,0.04)';
}

/* ═══ Stars ═══════════════════════════════════════════════════════════════ */

export type Star = { x: number; y: number; r: number; p: number; s: number };

export function makeStars(L: Layout): Star[] {
  return Array.from({ length: 55 }, () => ({
    x: Math.random() * L.W, y: Math.random() * L.H,
    r: Math.random() * 1.2 + 0.3, p: Math.random() * Math.PI * 2,
    s: Math.random() * 0.5 + 0.2,
  }));
}

export function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], t: number) {
  for (const s of stars) {
    const a = s.s * (0.4 + 0.6 * Math.sin(t * 0.3 + s.p));
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a * 0.35})`; ctx.fill();
  }
}

/* ═══ Drawing primitives ═════════════════════════════════════════════════ */

export function drawGlow(ctx: CanvasRenderingContext2D, L: Layout) {
  const g = ctx.createRadialGradient(L.W / 2, 0, 0, L.W / 2, 0, L.H * 0.5);
  g.addColorStop(0, 'rgba(212,168,75,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H * 0.5);
}

export function hRule(ctx: CanvasRenderingContext2D, L: Layout, y: number) {
  ctx.beginPath(); ctx.moveTo(L.pad, y); ctx.lineTo(L.W - L.pad, y);
  ctx.strokeStyle = 'rgba(212,168,75,0.18)'; ctx.lineWidth = 1; ctx.stroke();
}

export function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill?: string | null, stroke?: string | null, lw = 1.5) {
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw); }
}

export function rbox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[], fill?: string, stroke?: string, lw = 1.5) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

export function ease(a: number, delay: number, speed = 2.0) {
  return Math.min(1, Math.max(0, (a - delay) * speed));
}

export function drawHeader(ctx: CanvasRenderingContext2D, L: Layout, f: F) {
  const cx = L.W / 2;
  ctx.font = f.logo; ctx.fillStyle = C.gold; ctx.textAlign = 'center';
  ctx.fillText('T I M E C E P T O R', cx, L.pad + 34);
  ctx.font = f.xs; ctx.fillStyle = C.creamDm;
  ctx.fillText('VEDIC PLANETARY TIMING', cx, L.pad + 60);
  hRule(ctx, L, L.pad + 76);
  ctx.textAlign = 'left';
}

export function drawFooter(ctx: CanvasRenderingContext2D, L: Layout, f: F) {
  ctx.font = f.xs; ctx.fillStyle = C.creamDm; ctx.textAlign = 'center';
  ctx.fillText('timeceptor.com', L.W / 2, L.H - 22);
  ctx.textAlign = 'left';
}

/** Standard phase-draw function signature. */
export type PhaseDraw = (
  ctx: CanvasRenderingContext2D,
  L: Layout,
  f: F,
  alpha: number,
  phaseT: number,
  t: number,
) => void;
