/**
 * Shared card renderer — canvas utilities for all timing / verdict / plan cards.
 *
 * Deduplicates branding, gradient, border, footer, share/download logic
 * from SwotPage, DecidePage, and PlansPage.
 */

/* ── Score color ────────────────────────────────────────────────────────── */
export function getScoreColor(score: number): string {
  if (score >= 62) return '#34d399';  // emerald
  if (score >= 45) return '#F4A11D';  // gold
  if (score >= 30) return '#fbbf24';  // amber
  return '#f87171';                    // red
}

export function getScoreTailwind(score: number): string {
  if (score >= 62) return 'text-emerald-400';
  if (score >= 45) return 'text-gold';
  if (score >= 30) return 'text-amber-400';
  return 'text-red-400';
}

export function getVerdictInfo(score: number): { label: string; symbol: string; color: string } {
  if (score >= 62) return { label: 'Go for it!', symbol: '✓', color: '#34d399' };
  if (score >= 40) return { label: 'Acceptable', symbol: '⚠', color: '#fbbf24' };
  return { label: 'Better to wait', symbol: '✕', color: '#f87171' };
}

/* ── Canvas factories ───────────────────────────────────────────────────── */

/**
 * Create a branded canvas with gradient bg + gold rounded border.
 */
export function createBrandedCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0b0b24');
  grad.addColorStop(1, '#07071a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Gold rounded border
  const rr = 16;
  ctx.strokeStyle = 'rgba(244,161,29,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rr + 6, 6);
  ctx.lineTo(width - rr - 6, 6);
  ctx.arcTo(width - 6, 6, width - 6, rr + 6, rr);
  ctx.lineTo(width - 6, height - rr - 6);
  ctx.arcTo(width - 6, height - 6, width - rr - 6, height - 6, rr);
  ctx.lineTo(rr + 6, height - 6);
  ctx.arcTo(6, height - 6, 6, height - rr - 6, rr);
  ctx.lineTo(6, rr + 6);
  ctx.arcTo(6, 6, rr + 6, 6, rr);
  ctx.stroke();

  return { canvas, ctx };
}

/**
 * Draw a logo watermark in the top-right corner.
 */
export function drawLogoWatermark(ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement | null, width: number) {
  if (!logoImg) return;
  ctx.globalAlpha = 0.08;
  ctx.drawImage(logoImg, width - 220, 10, 200, 200);
  ctx.globalAlpha = 1;
}

/**
 * Draw the standard branded footer.
 */
export function drawCardFooter(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, logoImg: HTMLImageElement | null) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = 'rgba(244,161,29,0.25)';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('timeceptor.com — powered by timecept.com™  ©', W / 2, H - 16);
  if (logoImg) {
    ctx.globalAlpha = 0.7;
    ctx.drawImage(logoImg, 14, H - 72, 64, 64);
    ctx.globalAlpha = 1;
  }
}

/**
 * Draw a horizontal divider line.
 */
export function drawDivider(ctx: CanvasRenderingContext2D, y: number, width: number) {
  ctx.strokeStyle = 'rgba(244,161,29,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, y);
  ctx.lineTo(width - 28, y);
  ctx.stroke();
}

/**
 * Draw a score circle at the specified position.
 */
export function drawScoreCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  score: number,
) {
  const color = getScoreColor(score);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = `bold ${radius < 30 ? 22 : 30}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(String(score), cx, cy + (radius < 30 ? 8 : 10));
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(240,236,216,0.5)';
  ctx.fillText('/100', cx, cy + (radius < 30 ? 20 : 24));
}

/* ── Golden Hour Card (new — for free viral sharing) ──────────────────── */

export interface GoldenHourCardData {
  score: number;
  hour: number;       // 0-23
  serviceName: string;
  serviceIcon: string;
  horaRuler: string;
  activity: string;
  userName?: string;
  /** How many more golden hours are hidden today (for teaser) */
  remainingGoldenHours?: number;
}

export function renderGoldenHourCard(
  data: GoldenHourCardData,
  logoImg: HTMLImageElement | null,
): HTMLCanvasElement {
  const W = 600, H = 340;
  const { canvas, ctx } = createBrandedCanvas(W, H);
  drawLogoWatermark(ctx, logoImg, W);

  const color = getScoreColor(data.score);

  // Title
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = 'rgba(244,161,29,0.7)';
  ctx.fillText('YOUR GOLDEN HOUR', 28, 40);

  if (data.userName) {
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.4)';
    ctx.fillText(`for ${data.userName}`, 200, 40);
  }

  // Service badge
  ctx.font = '24px serif';
  ctx.fillText(data.serviceIcon, 28, 80);
  ctx.font = 'bold 20px serif';
  ctx.fillStyle = '#f0ecd8';
  ctx.fillText(data.serviceName, 62, 80);

  // Score circle
  drawScoreCircle(ctx, W - 80, 68, 34, data.score);

  drawDivider(ctx, 106, W);

  // Time
  const h = data.hour;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(`${h12}:00`, 28, 168);
  ctx.font = 'bold 28px monospace';
  ctx.fillText(ap, 200, 168);

  // Hora ruler
  ctx.font = '13px monospace';
  ctx.fillStyle = 'rgba(165,180,252,0.9)';
  ctx.fillText(`${data.horaRuler} hora`, 28, 196);

  // Activity
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = 'rgba(244,161,29,0.7)';
  ctx.fillText('RECOMMENDED', 28, 232);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#f0ecd8';

  // Wrap activity text
  const words = data.activity.split(' ');
  let line = '';
  let y = 254;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > W - 56) {
      ctx.fillText(line.trim(), 28, y);
      line = word + ' ';
      y += 20;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), 28, y);

  // Teaser: remaining golden hours
  if (data.remainingGoldenHours && data.remainingGoldenHours > 0) {
    const teaserY = Math.min(y + 30, H - 60);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(244,161,29,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`+${data.remainingGoldenHours} more golden hours hidden · Sign in for your full schedule`, W / 2, teaserY);
  }

  drawCardFooter(ctx, canvas, logoImg);
  return canvas;
}

/* ── Act-or-Wait Verdict Card (refactored from DecidePage) ────────────── */

export interface VerdictCardData {
  currentScore: number;
  currentHoraRuler: string;
  currentActivity: string;
  verdictLabel: string;
  verdict: 'go' | 'wait' | 'caution';
  nextBetter: {
    label: string;
    score: number;
    horaRuler: string;
    hoursFromNow: number;
  } | null;
  todayWindows: { hour: number; score: number }[];
  serviceName: string;
}

export function renderVerdictCard(
  data: VerdictCardData,
  logoImg: HTMLImageElement | null,
): HTMLCanvasElement {
  const W = 600, H = 340;
  const { canvas, ctx } = createBrandedCanvas(W, H);
  drawLogoWatermark(ctx, logoImg, W);

  const scoreClr = data.verdict === 'go' ? '#34d399' : data.verdict === 'caution' ? '#fbbf24' : '#f87171';

  // Score circle
  drawScoreCircle(ctx, 70, 70, 36, data.currentScore);

  // Verdict label
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px serif';
  ctx.fillStyle = scoreClr;
  const verdictSymbol = data.verdict === 'go' ? '✓' : data.verdict === 'caution' ? '⚠' : '✕';
  ctx.fillText(`${verdictSymbol} ${data.verdictLabel}`, 130, 52);

  // Service name
  ctx.font = '14px monospace';
  ctx.fillStyle = '#f0ecd8';
  ctx.fillText(data.serviceName, 130, 76);

  // Hora ruler
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(165,180,252,0.9)';
  ctx.fillText(`${data.currentHoraRuler} hora`, 130, 96);

  drawDivider(ctx, 120, W);

  // Activity
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = 'rgba(244,161,29,0.7)';
  ctx.fillText('RECOMMENDED ACTIVITY', 28, 144);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#f0ecd8';
  ctx.fillText(data.currentActivity, 28, 164);

  // Next better window
  if (data.nextBetter && data.verdict !== 'go') {
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText('NEXT GOLDEN WINDOW', 28, 198);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#F4A11D';
    ctx.fillText(data.nextBetter.label, 28, 220);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.6)';
    ctx.fillText(`Score ${data.nextBetter.score}/100 · ${data.nextBetter.horaRuler} hora · ${data.nextBetter.hoursFromNow}h away`, 28, 240);
  } else if (data.verdict === 'go') {
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(52,211,153,0.7)';
    ctx.fillText('STATUS', 28, 198);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText('Golden window active — go for it now!', 28, 220);
  }

  // Today's windows
  if (data.todayWindows.length > 0) {
    const winY = 264;
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText("TODAY'S TOP WINDOWS", 28, winY);
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.6)';
    const topStr = data.todayWindows.slice(0, 4).map(w => {
      const h = w.hour;
      const ap = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}${ap}(${w.score})`;
    }).join('  ·  ');
    ctx.fillText(topStr, 28, winY + 18);
  }

  drawCardFooter(ctx, canvas, logoImg);
  return canvas;
}

/* ── SWOT Analysis Card (rich branded card with matrix + actions) ───── */

export interface SwotCardService {
  name: string;
  icon: string;
  avgScore: number;
}

export interface SwotCardStrength {
  title: string;
  detail: string;
}

export interface SwotCardData {
  services: SwotCardService[];   // sorted best→worst (8 items)
  strengths: SwotCardStrength[]; // top 2–3 with prose
  weaknesses: SwotCardStrength[]; // bottom 2 with prose
  opportunities: SwotCardStrength[]; // rising / peak-rich
  threats: SwotCardStrength[]; // falling / many lows
  userName?: string;
  /** Yoga action plan snippet */
  yogaAction?: string;
  /** Health action plan snippet */
  healthAction?: string;
  /** Today's 24-hour window slots for the day chart */
  todayWindows?: { hour: number; score: number }[];
  /** Golden hour data */
  goldenHour?: {
    score: number;
    hour: number;
    horaRuler: string;
    serviceName: string;
    serviceIcon: string;
  } | null;
  /** Remaining golden hours count */
  remainingGoldenHours?: number;
  /** Key Insights data for the card */
  insights?: {
    bestName: string;
    bestIcon: string;
    bestScore: number;
    bestTrend: 'rising' | 'falling' | 'stable';
    worstName: string;
    worstIcon: string;
    worstPeakCount: number;
    worstTrend: 'rising' | 'falling' | 'stable';
    chronoLabel: string;   // 'mornings' | 'evenings' | 'any time of day'
    totalPeaks: number;
    lockedNames: string[]; // e.g. ['📈 Business', '📱 Social Media Post', ...]
  };
}

/** Word-wrap helper — returns lines array */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur + w + ' ';
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur.trim());
      cur = w + ' ';
    } else {
      cur = test;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

export function renderSwotCard(
  data: SwotCardData,
  logoImg: HTMLImageElement | null,
): HTMLCanvasElement {
  const W = 600;

  // Phase 1: render content onto oversized transparent canvas to measure height
  const _tmp = document.createElement('canvas');
  _tmp.width = W; _tmp.height = 1400;
  const ctx = _tmp.getContext('2d')!;

  let y = 0;

  // ── Title ──
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = 'rgba(244,161,29,0.8)';
  ctx.fillText('YOUR COSMIC SWOT ANALYSIS', 28, 38);

  // 7-day badge
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = 'rgba(251,191,36,0.7)';
  ctx.textAlign = 'right';
  ctx.fillText('7-DAY PREVIEW', W - 28, 38);
  ctx.textAlign = 'left';

  if (data.userName) {
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.4)';
    ctx.fillText(`for ${data.userName}`, 28, 56);
  }

  drawDivider(ctx, data.userName ? 68 : 52, W);
  y = data.userName ? 82 : 66;

  // ── Top 4 services as compact icons+score row ──
  const topSorted = data.services.slice(0, 4);
  const colW = (W - 56) / 4;
  topSorted.forEach((svc, i) => {
    const cx = 28 + i * colW + colW / 2;
    const color = getScoreColor(svc.avgScore);
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0ecd8';
    ctx.fillText(svc.icon, cx, y + 4);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = color;
    ctx.fillText(String(svc.avgScore), cx, y + 24);
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.45)';
    ctx.fillText(svc.name, cx, y + 36);
    // Best / Weak badge
    if (i === 0) {
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#34d399';
      ctx.fillText('★ BEST', cx, y + 48);
    }
  });

  y += 60;
  drawDivider(ctx, y, W);
  y += 16;

  // ── SWOT Matrix (2×2 quadrants) ──
  const quadW = (W - 56 - 12) / 2;
  const quadPad = 10;

  const drawQuadrant = (qx: number, qy: number, title: string, color: string, items: SwotCardStrength[], emoji: string) => {
    // Border rect
    ctx.strokeStyle = color + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const rr = 6;
    ctx.moveTo(qx + rr, qy);
    ctx.lineTo(qx + quadW - rr, qy);
    ctx.arcTo(qx + quadW, qy, qx + quadW, qy + rr, rr);
    ctx.lineTo(qx + quadW, qy + 80 - rr);
    ctx.arcTo(qx + quadW, qy + 80, qx + quadW - rr, qy + 80, rr);
    ctx.lineTo(qx + rr, qy + 80);
    ctx.arcTo(qx, qy + 80, qx, qy + 80 - rr, rr);
    ctx.lineTo(qx, qy + rr);
    ctx.arcTo(qx, qy, qx + rr, qy, rr);
    ctx.stroke();

    // Emoji + title
    ctx.textAlign = 'left';
    ctx.font = '10px serif';
    ctx.fillStyle = '#f0ecd8';
    ctx.fillText(emoji, qx + quadPad, qy + 16);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = color;
    ctx.fillText(title, qx + quadPad + 16, qy + 16);

    // Items (1–2 lines each)
    let iy = qy + 32;
    items.slice(0, 2).forEach(item => {
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(240,236,216,0.65)';
      const lines = wrapText(ctx, item.title, quadW - quadPad * 2);
      lines.slice(0, 2).forEach(line => {
        ctx.fillText(line, qx + quadPad, iy);
        iy += 12;
      });
      iy += 4;
    });
  };

  const leftX = 28;
  const rightX = 28 + quadW + 12;

  drawQuadrant(leftX, y, 'STRENGTHS', '#34d399', data.strengths, '💪');
  drawQuadrant(rightX, y, 'WEAKNESSES', '#f87171', data.weaknesses, '⚡');
  y += 90;
  drawQuadrant(leftX, y, 'OPPORTUNITIES', '#60a5fa', data.opportunities, '🚀');
  drawQuadrant(rightX, y, 'THREATS', '#fbbf24', data.threats, '⚠️');
  y += 98;

  drawDivider(ctx, y, W);
  y += 14;

  // ── Action Plan Preview (Yoga + Health) ──
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = 'rgba(244,161,29,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('ACTION PLAN PREVIEW', 28, y);
  y += 16;

  if (data.yogaAction) {
    const yogaSvc = data.services.find(s => s.name.toLowerCase().includes('yoga'));
    ctx.font = '12px serif';
    ctx.fillStyle = '#f0ecd8';
    ctx.fillText(yogaSvc?.icon ?? '🧘', 28, y + 2);
    ctx.font = 'bold 10px monospace';
    ctx.fillText('Yoga', 46, y);
    y += 14;
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.6)';
    const yogaLines = wrapText(ctx, data.yogaAction, W - 56);
    yogaLines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 28, y);
      y += 12;
    });
    y += 6;
  }

  if (data.healthAction) {
    const healthSvc = data.services.find(s => s.name.toLowerCase().includes('health'));
    ctx.font = '12px serif';
    ctx.fillStyle = '#f0ecd8';
    ctx.fillText(healthSvc?.icon ?? '💪', 28, y + 2);
    ctx.font = 'bold 10px monospace';
    ctx.fillText('Health', 46, y);
    y += 14;
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.6)';
    const healthLines = wrapText(ctx, data.healthAction, W - 56);
    healthLines.slice(0, 2).forEach(line => {
      ctx.fillText(line, 28, y);
      y += 12;
    });
    y += 6;
  }

  // ── Key Insights section ──
  if (data.insights) {
    const ins = data.insights;
    drawDivider(ctx, y, W);
    y += 14;

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('KEY INSIGHTS', 28, y);
    y += 16;

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(240,236,216,0.7)';

    // Strongest service
    const bestTrendText = ins.bestTrend === 'rising' ? " and it's getting stronger!" : ins.bestTrend === 'falling' ? ', though energy is shifting.' : '.';
    const bestLine = `${ins.bestIcon} Strongest: ${ins.bestName} (score ${ins.bestScore})${bestTrendText}`;
    const bestLines = wrapText(ctx, bestLine, W - 56);
    bestLines.forEach(l => {
      ctx.fillText(l, 28, y);
      y += 13;
    });
    y += 2;

    // Weakest service
    const worstLine = `${ins.worstIcon} ${ins.worstName} needs careful timing — only ${ins.worstPeakCount} golden windows.${ins.worstTrend === 'rising' ? ' But improving!' : ''}`;
    const worstLines = wrapText(ctx, worstLine, W - 56);
    worstLines.forEach(l => {
      ctx.fillText(l, 28, y);
      y += 13;
    });
    y += 2;

    // Golden hour reference (already available as data.goldenHour)
    if (data.goldenHour) {
      const gh = data.goldenHour;
      const ghh = gh.hour % 12 || 12;
      const ghap = gh.hour >= 12 ? 'PM' : 'AM';
      const ghQuality = gh.score >= 62 ? 'excellent!' : gh.score >= 45 ? 'good window.' : 'use wisely.';
      ctx.fillText(`Golden hour today: ${ghh}:00 ${ghap} for ${gh.serviceIcon} ${gh.serviceName} — ${ghQuality}`, 28, y);
      y += 15;
    }

    // Chronotype + peaks
    ctx.fillText(`You perform best during ${ins.chronoLabel}. ${ins.totalPeaks} peak windows this week.`, 28, y);
    y += 15;

    // Locked categories
    if (ins.lockedNames.length > 0) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(244,161,29,0.6)';
      ctx.fillText(`${ins.lockedNames.length} more categories calculated but locked:`, 28, y);
      y += 13;
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(240,236,216,0.5)';
      // Wrap the locked names
      const lockedStr = ins.lockedNames.join('  ');
      const lockedLines = wrapText(ctx, lockedStr, W - 56);
      lockedLines.slice(0, 2).forEach(l => {
        ctx.fillText(l, 28, y);
        y += 12;
      });
      y += 2;
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(244,161,29,0.7)';
      ctx.fillText('Sign in to see insights across all 8 life domains', 28, y);
      y += 12;
    }

    y += 4;
  }

  // ── Today's 24-hour bar chart ──
  if (data.todayWindows && data.todayWindows.length > 0) {
    drawDivider(ctx, y, W);
    y += 14;

    // Golden hour callout
    if (data.goldenHour) {
      const gh = data.goldenHour;
      const ghColor = getScoreColor(gh.score);
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = 'rgba(244,161,29,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText("TODAY'S GOLDEN HOUR", 28, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = ghColor;
      const h12 = gh.hour % 12 || 12;
      const ap = gh.hour >= 12 ? 'PM' : 'AM';
      ctx.fillText(`${h12}:00 ${ap}  ·  ${gh.score}/100`, W - 28, y);
      y += 6;
      ctx.textAlign = 'left';
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(165,180,252,0.8)';
      ctx.fillText(`${gh.horaRuler} hora · ${gh.serviceName}`, 28, y + 10);
      y += 18;
    } else {
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = 'rgba(244,161,29,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText("TODAY'S ENERGY MAP", 28, y);
      y += 14;
    }

    // Draw 24 bars
    const barAreaW = W - 56;
    const barH = 28;
    const barGap = 1.5;
    const barW = (barAreaW - 23 * barGap) / 24;
    const nowHour = new Date().getHours();
    const dayMax = Math.max(...data.todayWindows.map(w => w.score), 1);

    // Rank coloring
    const winSorted = [...data.todayWindows].sort((a, b) => b.score - a.score);
    const rankMap = new Map(winSorted.map((w, idx) => [w.hour, idx]));

    data.todayWindows.forEach((w, i) => {
      const x = 28 + i * (barW + barGap);
      const isPast = i < nowHour;
      const rank = rankMap.get(i) ?? 99;
      let color: string;
      if (isPast) {
        color = 'rgba(100,110,165,0.12)';
      } else if (rank === 0) {
        color = 'rgba(244,161,29,1)';
      } else if (rank <= 3) {
        color = 'rgba(32,197,160,1)';
      } else if (rank <= 12) {
        color = 'rgba(100,115,200,1)';
      } else {
        color = 'rgba(65,72,120,0.85)';
      }

      const bh = Math.max(3, Math.round((w.score / dayMax) * barH));
      // Bar background
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, y, barW, barH);
      // Score bar
      ctx.fillStyle = color;
      ctx.fillRect(x, y + barH - bh, barW, bh);

      // Now marker
      if (i === nowHour) {
        ctx.strokeStyle = 'rgba(244,161,29,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 0.5, y - 0.5, barW + 1, barH + 1);
      }
    });

    // NOW needle
    const needleX = 28 + (nowHour + 0.5) * (barW + barGap);
    ctx.fillStyle = 'rgba(244,161,29,0.9)';
    ctx.fillRect(needleX - 1, y, 2, barH);

    y += barH + 6;

    // Time labels
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(233,231,242,0.35)';
    [0, 6, 12, 18, 23].forEach(h => {
      const lx = 28 + (h + 0.5) * (barW + barGap);
      ctx.fillText(String(h).padStart(2, '0'), lx, y + 2);
    });

    // Remaining hours teaser
    if (data.remainingGoldenHours && data.remainingGoldenHours > 1) {
      y += 14;
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(244,161,29,0.55)';
      ctx.textAlign = 'center';
      ctx.fillText(`+${data.remainingGoldenHours - 1} more golden hours today · Sign in for your full schedule`, W / 2, y);
    }

    y += 10;
  }

  y += 8;
  drawDivider(ctx, y, W);
  y += 16;
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = 'rgba(244,161,29,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('\u23f3 7-day data \u00b7 Sign in for 90-day deep analysis', W / 2, y);
  y += 20;

  // Phase 2: create branded canvas at exact content height
  const H = Math.max(y + 50, 500);
  const { canvas, ctx: out } = createBrandedCanvas(W, H);
  drawLogoWatermark(out, logoImg, W);
  out.drawImage(_tmp, 0, 0);
  drawCardFooter(out, canvas, logoImg);
  return canvas;
}

/* ── Share / Download helpers ─────────────────────────────────────────── */

export async function shareCanvasAsImage(canvas: HTMLCanvasElement, title: string, text: string, filename: string) {
  try {
    const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'));
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return;
    }
  } catch { /* fallback to download */ }
  downloadCanvasAsImage(canvas, filename);
}

export function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ── Preload logo helper ──────────────────────────────────────────────── */

let _cachedLogo: HTMLImageElement | null = null;
let _logoLoading = false;

export function preloadLogo(): Promise<HTMLImageElement | null> {
  if (_cachedLogo) return Promise.resolve(_cachedLogo);
  if (_logoLoading) {
    return new Promise((res) => {
      const interval = setInterval(() => {
        if (_cachedLogo) { clearInterval(interval); res(_cachedLogo); }
      }, 50);
      setTimeout(() => { clearInterval(interval); res(null); }, 3000);
    });
  }
  _logoLoading = true;
  return new Promise((res) => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => { _cachedLogo = img; res(img); };
    img.onerror = () => { res(null); };
  });
}

export function getCachedLogo(): HTMLImageElement | null {
  return _cachedLogo;
}
