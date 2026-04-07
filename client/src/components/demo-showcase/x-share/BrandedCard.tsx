/**
 * BrandedCard — CSS replica of the real canvas-rendered Timeceptor verdict card.
 *
 * Mirrors the look of `renderVerdictCard()` from lib/cardRenderer.ts:
 *  - Dark gradient background (#0b0b24 → #0f0f1a)
 *  - Gold rounded border
 *  - Logo watermark top-right (actual /logo.png)
 *  - Score circle with colour coding
 *  - Verdict label, service, hora ruler
 *  - Activity recommendation
 *  - Next golden window (if not "go")
 *  - Today's top windows row
 *  - Branded footer (logo + "timeceptor.com — powered by timecept.com™ ©")
 *
 * Separate file so iteration is easy.
 */
import React from 'react';

export interface BrandedCardProps {
  score: number;
  verdict: 'go' | 'caution' | 'wait';
  verdictLabel: string;
  serviceName: string;
  horaRuler: string;
  activity: string;
  nextBetter?: {
    label: string;
    score: number;
    horaRuler: string;
    hoursFromNow: number;
  } | null;
  todayWindows?: { hour: number; score: number }[];
  className?: string;
}

/* ── Helpers ─────────────────────────────────────────────── */
function scoreColor(s: number): string {
  if (s >= 62) return '#34d399';
  if (s >= 45) return '#F4A11D';
  if (s >= 30) return '#fbbf24';
  return '#f87171';
}

function fmtHour(h: number): string {
  return `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`;
}

function verdictSymbol(v: 'go' | 'caution' | 'wait'): string {
  return v === 'go' ? '✓' : v === 'caution' ? '⚠' : '✕';
}

/* ── Component ───────────────────────────────────────────── */
export function BrandedCard({
  score, verdict, verdictLabel, serviceName,
  horaRuler, activity, nextBetter, todayWindows = [],
  className = '',
}: BrandedCardProps) {
  const clr = scoreColor(score);
  const borderClr = verdict === 'go' ? 'rgba(52,211,153,0.4)' : verdict === 'caution' ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)';

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #0b0b24 0%, #0f0f1a 100%)',
        border: `2px solid rgba(244,161,29,0.35)`,
        fontFamily: 'monospace',
      }}
    >
      {/* Logo watermark — top right, low opacity */}
      <img
        src="/logo.png"
        alt=""
        className="absolute top-2 right-2 w-12 h-12 sm:w-14 sm:h-14 object-contain opacity-[0.08] pointer-events-none select-none"
        draggable={false}
      />

      <div className="relative z-10 p-4 sm:p-5">
        {/* ── Row 1: Score circle + verdict + service ──────── */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3">
          {/* Score circle */}
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center flex-shrink-0"
            style={{ border: `3px solid ${clr}` }}
          >
            <span className="text-lg sm:text-xl font-bold leading-none" style={{ color: clr }}>
              {score}
            </span>
            <span className="text-[8px] leading-none mt-0.5" style={{ color: 'rgba(240,236,216,0.5)' }}>
              /100
            </span>
          </div>

          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold leading-tight" style={{ color: clr }}>
              {verdictSymbol(verdict)} {verdictLabel}
            </div>
            <div className="text-[11px] sm:text-xs leading-snug mt-0.5" style={{ color: '#f0ecd8' }}>
              {serviceName}
            </div>
            <div className="text-[10px] leading-snug mt-0.5" style={{ color: 'rgba(165,180,252,0.9)' }}>
              {horaRuler} hora
            </div>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────── */}
        <div className="h-px mx-1 mb-3" style={{ background: 'rgba(244,161,29,0.18)' }} />

        {/* ── Activity ───────────────────────────────────── */}
        <div className="mb-3">
          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(244,161,29,0.7)' }}>
            Recommended Activity
          </div>
          <div className="text-[11px] sm:text-xs leading-relaxed" style={{ color: '#f0ecd8' }}>
            {activity}
          </div>
        </div>

        {/* ── Next golden window (only when not "go") ─────── */}
        {nextBetter && verdict !== 'go' && (
          <div className="mb-3">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(244,161,29,0.7)' }}>
              Next Golden Window
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold" style={{ color: '#F4A11D' }}>{nextBetter.label}</span>
              <span className="text-[10px]" style={{ color: 'rgba(240,236,216,0.6)' }}>
                Score {nextBetter.score}/100 · {nextBetter.horaRuler} hora · {nextBetter.hoursFromNow}h away
              </span>
            </div>
          </div>
        )}

        {/* ── "Go" status badge ──────────────────────────── */}
        {verdict === 'go' && (
          <div className="mb-3">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>
              Status
            </div>
            <div className="text-[11px] sm:text-xs" style={{ color: '#34d399' }}>
              Golden window active — go for it now!
            </div>
          </div>
        )}

        {/* ── Today's top windows ────────────────────────── */}
        {todayWindows.length > 0 && (
          <div className="mb-2">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(244,161,29,0.7)' }}>
              Today's Top Windows
            </div>
            <div className="flex flex-wrap gap-1.5">
              {todayWindows.slice(0, 4).map((w, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: scoreColor(w.score),
                  }}
                >
                  {fmtHour(w.hour)}<span style={{ color: 'rgba(240,236,216,0.4)', fontSize: '9px', marginLeft: 3 }}>({w.score})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Branded footer ─────────────────────────────── */}
        <div className="h-px mx-1 mt-2 mb-2" style={{ background: 'rgba(244,161,29,0.12)' }} />
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt=""
            className="w-6 h-6 object-contain opacity-60"
            draggable={false}
          />
          <span className="text-[8px] sm:text-[9px] tracking-wide" style={{ color: 'rgba(244,161,29,0.35)' }}>
            timeceptor.com — powered by timecept.com™ ©
          </span>
        </div>
      </div>
    </div>
  );
}
