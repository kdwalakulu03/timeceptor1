import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { computeDasha, NAKSHATRA_NAMES, DASHA_SEQUENCE } from '../../lib/astrology';
import type { ChartData } from '../../lib/astrology';

const AVATAR_URL = '/ronaldo.png';

const PLANET_SYMBOLS: Record<string, string> = {
  Ketu:'☋', Venus:'♀', Sun:'☉', Moon:'☽',
  Mars:'♂', Rahu:'☊', Jupiter:'♃', Saturn:'♄', Mercury:'☿',
};
const PLANET_COLOR: Record<string, string> = {
  Sun: '#e8c97a', Moon: '#8ab4d4', Mars: '#c45c5c',
  Mercury: '#6dc89a', Jupiter: '#C1A661', Venus: '#f2c4ce',
  Saturn: '#9090b0', Rahu: '#a78bfa', Ketu: '#fb923c',
};

function fmtYear(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
function fmtYearShort(d: Date) {
  return d.getFullYear().toString();
}

interface SlideDashaProps {
  name: string;
  chart: ChartData;
  dob: string;
  tob: string;
  recordStep?: number;
}

export function SlideDasha({ name, chart, dob, tob, recordStep }: SlideDashaProps) {
  const moonLong = chart.planets['moon']?.siderealLongitude ?? 0;
  const nakshatraIdx = Math.floor(moonLong / (360 / 27));
  const nakshatra = NAKSHATRA_NAMES[nakshatraIdx] ?? '—';
  const moonSign = chart.planets['moon']?.sign ?? '—';

  const periods = useMemo(() => {
    const birthDate = new Date(`${dob}T${tob}`);
    return computeDasha(moonLong, birthDate);
  }, [moonLong, dob, tob]);

  const now = new Date();
  const currentIdx = periods.findIndex(p => p.isCurrent);
  const current    = currentIdx >= 0 ? periods[currentIdx] : null;
  const currentSub = current?.subPeriods.find(s => s.isCurrent);

  const totalMs   = current ? current.endDate.getTime() - current.startDate.getTime() : 1;
  const elapsedMs = current ? Math.max(0, now.getTime() - current.startDate.getTime()) : 0;
  const pct       = Math.min(100, (elapsedMs / totalMs) * 100);
  const color     = current ? (PLANET_COLOR[current.lord] ?? '#C1A661') : '#C1A661';

  // Timeline: 2 past + current + 3 upcoming — centred on current
  const timelineItems = useMemo(() => {
    if (currentIdx < 0) return periods.slice(0, 6);
    const start = Math.max(0, currentIdx - 2);
    const end   = Math.min(periods.length, currentIdx + 4);
    return periods.slice(start, end);
  }, [periods, currentIdx]);

  const rec = recordStep != null;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030303] overflow-hidden">
      {/* Ambient glow */}
      {!rec && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[180px] rounded-full blur-[90px] pointer-events-none"
          style={{ background: `${color}0e` }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 pt-4 px-4 pb-1 flex items-center justify-between gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C1A661]/30 bg-[#111] flex-shrink-0">
            <img src={AVATAR_URL} alt={name} className="w-full h-full object-contain object-top scale-110" />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-[13px] text-white/85 leading-none truncate">{name}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#C1A661]/65 leading-none mt-0.5">Vimshottari Dasha</p>
          </div>
        </div>
        {/* Moon nakshatra pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/12 bg-white/[0.04] flex-shrink-0">
          <span className="text-[#8ab4d4] text-[12px]">☽</span>
          <span className="font-mono text-[9px] text-white/60 uppercase tracking-wider">
            {nakshatra.split(' ')[0]} · {moonSign.slice(0,3)}
          </span>
        </div>
      </div>

      {/* Current period compact hero */}
      {current && (!rec || recordStep! >= 1) && (
        <motion.div
          initial={rec ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={rec ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mx-4 mt-3 rounded-xl border px-4 py-3 overflow-hidden"
          style={{ borderColor: `${color}30`, background: `${color}07` }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top left, ${color}10 0%, transparent 65%)` }}
          />
          <div className="relative z-10 flex items-center gap-3 mb-2.5">
            <span className="text-[26px] leading-none" style={{ color }}>
              {PLANET_SYMBOLS[current.lord] ?? '·'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-serif text-[18px] text-white/90 leading-none">{current.lord}</p>
                <span
                  className="font-mono text-[10px] uppercase tracking-widest border px-2 py-0.5 rounded-full leading-none"
                  style={{ color, borderColor: `${color}40` }}
                >
                  Active
                </span>
              </div>
              <p className="font-mono text-[9px] text-white/60 mt-0.5">
                {fmtYear(current.startDate)} — {fmtYear(current.endDate)} · {current.years}y
              </p>
            </div>
            {/* Sub-period badge */}
            {currentSub && (
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-[10px] text-white/70 uppercase tracking-wide leading-none mb-0.5">Sub</p>
                <span style={{ color: PLANET_COLOR[currentSub.lord] }} className="text-[16px] leading-none">
                  {PLANET_SYMBOLS[currentSub.lord] ?? '·'}
                </span>
                <p className="font-mono text-[10px] text-white/70 leading-none">{currentSub.lord}</p>
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="flex justify-between font-mono text-[10px] text-white/70 mb-1">
            <span>{fmtYearShort(current.startDate)}</span>
            <span className="text-white/80">{Math.round(pct)}%</span>
            <span>{fmtYearShort(current.endDate)}</span>
          </div>
          <div className="relative h-[3px] w-full rounded-full bg-white/[0.08]">
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{ left: `calc(${pct}% - 4px)`, background: color, boxShadow: `0 0 8px ${color}, 0 0 16px ${color}66` }}
            />
          </div>
        </motion.div>
      )}

      {/* ── CV / Resume Vertical Timeline ── */}
      <div className="relative z-10 flex-1 px-4 mt-4 overflow-hidden">
        <p className="font-mono text-[10px] text-white/70 uppercase tracking-[0.28em] mb-3">
          Life Timeline
        </p>

        {/* Spine line */}
        <div className="absolute left-[28px] top-[56px] bottom-[24px] w-px bg-gradient-to-b from-transparent via-white/[0.12] to-transparent pointer-events-none" />

        <div className="space-y-0">
          {timelineItems.map((p, i) => {
            const isCurr  = p.isCurrent;
            const isPast  = now > p.endDate;
            const isFuture= now < p.startDate;
            const c       = PLANET_COLOR[p.lord] ?? '#888';

            return (
              rec && recordStep! < 2 + i ? null :
              <motion.div
                key={p.lord + p.startDate.getTime()}
                initial={rec ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={rec ? { duration: 0 } : { delay: 0.15 + i * 0.07, duration: 0.38, ease: [0.22,1,0.36,1] }}
                className="flex items-start gap-0 relative"
              >
                {/* Timeline dot column */}
                <div className="flex flex-col items-center w-[24px] flex-shrink-0 pt-[6px]">
                  {isCurr ? (
                    /* Pulsing active dot */
                    <div className="relative flex-shrink-0">
                      <motion.div
                        className="absolute rounded-full"
                        style={{ inset:'-4px', background: `${c}30` }}
                        animate={{ scale:[1, 1.6, 1], opacity:[0.6, 0, 0.6] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      />
                      <div
                        className="w-[10px] h-[10px] rounded-full border-2 relative z-10"
                        style={{ background: c, borderColor: `${c}80`, boxShadow: `0 0 10px ${c}` }}
                      />
                    </div>
                  ) : isPast ? (
                    /* Filled past dot */
                    <div
                      className="w-[8px] h-[8px] rounded-full opacity-50"
                      style={{ background: c }}
                    />
                  ) : (
                    /* Open future dot */
                    <div
                      className="w-[8px] h-[8px] rounded-full border opacity-35"
                      style={{ borderColor: c }}
                    />
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 min-w-0 pb-[14px] pl-2 border-l border-transparent ${
                    isCurr ? 'opacity-100' : isPast ? 'opacity-80' : 'opacity-65'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] leading-none flex-shrink-0" style={{ color: c }}>
                      {PLANET_SYMBOLS[p.lord] ?? '·'}
                    </span>
                    <span className={`font-serif leading-none ${isCurr ? 'text-[14px] text-white/95' : 'text-[13px] text-white/75'}`}>
                      {p.lord}
                    </span>
                    {isCurr && (
                      <span
                        className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-[2px] rounded-full border leading-none ml-1"
                        style={{ color: c, borderColor: `${c}50`, background: `${c}12` }}
                      >
                        NOW
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[11px] text-white/70 flex-shrink-0">
                      {p.years}y
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-white/70 mt-[3px]">
                    {fmtYearShort(p.startDate)} — {fmtYearShort(p.endDate)}
                  </p>
                  {/* Current: show active antardasha inline */}
                  {isCurr && currentSub && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="w-[4px] h-[4px] rounded-full flex-shrink-0" style={{ background: PLANET_COLOR[currentSub.lord] }} />
                      <span className="font-mono text-[11px]" style={{ color: PLANET_COLOR[currentSub.lord] }}>
                        {PLANET_SYMBOLS[currentSub.lord]}
                      </span>
                      <span className="font-mono text-[11px] text-white/75">{currentSub.lord} sub · until {fmtYearShort(currentSub.endDate)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer watermark */}
      <div className="relative z-10 pb-3 pt-1 flex items-center justify-center opacity-15">
        <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-[#C1A661]">Timeceptor</span>
      </div>
    </div>
  );
}

export function dashaRecordConfig(timelineCount: number) {
  return {
    total: 2 + timelineCount,
    holdFrames(step: number): number {
      if (step === 0) return 6;    // header
      if (step === 1) return 13;   // hero card 0.55s
      return 2;                    // timeline items stagger 0.07s
    },
  };
}
