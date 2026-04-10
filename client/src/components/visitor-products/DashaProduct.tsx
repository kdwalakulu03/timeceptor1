/**
 * DashaProduct — Vimshottari Dasha calculation display.
 * Computes major (Maha) and sub (Antar) dasha periods from Moon's nakshatra.
 */
import React, { useMemo } from 'react';
import type { SubProductProps } from './types';

/* ── Vimshottari Dasha constants ────────────────────────────────── */
const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/** Dasha lords in Vimshottari sequence & their period duration (years) */
const DASHA_SEQUENCE: { lord: string; years: number }[] = [
  { lord: 'Ketu',    years: 7  },
  { lord: 'Venus',   years: 20 },
  { lord: 'Sun',     years: 6  },
  { lord: 'Moon',    years: 10 },
  { lord: 'Mars',    years: 7  },
  { lord: 'Rahu',    years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn',  years: 19 },
  { lord: 'Mercury', years: 17 },
];

const TOTAL_YEARS = 120; // Vimshottari = 120-year cycle

/** Nakshatra index → starting dasha lord index in DASHA_SEQUENCE */
const NAKSHATRA_DASHA_LORD: number[] = [
  0, // Ashwini → Ketu
  1, // Bharani → Venus
  2, // Krittika → Sun
  3, // Rohini → Moon
  4, // Mrigashira → Mars
  5, // Ardra → Rahu
  6, // Punarvasu → Jupiter
  7, // Pushya → Saturn
  8, // Ashlesha → Mercury
  0, // Magha → Ketu
  1, // Purva Phalguni → Venus
  2, // Uttara Phalguni → Sun
  3, // Hasta → Moon
  4, // Chitra → Mars
  5, // Swati → Rahu
  6, // Vishakha → Jupiter
  7, // Anuradha → Saturn
  8, // Jyeshtha → Mercury
  0, // Mula → Ketu
  1, // Purva Ashadha → Venus
  2, // Uttara Ashadha → Sun
  3, // Shravana → Moon
  4, // Dhanishta → Mars
  5, // Shatabhisha → Rahu
  6, // Purva Bhadrapada → Jupiter
  7, // Uttara Bhadrapada → Saturn
  8, // Revati → Mercury
];

const LORD_EMOJI: Record<string, string> = {
  Ketu: '🌑', Venus: '💎', Sun: '☀️', Moon: '🌙',
  Mars: '♂️', Rahu: '🐍', Jupiter: '🔱', Saturn: '🪐', Mercury: '☿️',
};

interface DashaPeriod {
  lord: string;
  startDate: Date;
  endDate: Date;
  years: number;
  isCurrent: boolean;
  subPeriods: SubDashaPeriod[];
}

interface SubDashaPeriod {
  lord: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeDasha(moonSiderealLong: number, birthDate: Date): DashaPeriod[] {
  // Nakshatra: each is 13°20' = 13.3333°
  const nakshatraSpan = 360 / 27; // ~13.333°
  const nakshatraIdx = Math.floor(moonSiderealLong / nakshatraSpan);
  const posInNakshatra = (moonSiderealLong % nakshatraSpan) / nakshatraSpan;

  // Starting dasha lord
  const startLordIdx = NAKSHATRA_DASHA_LORD[nakshatraIdx];

  // Balance of first dasha (how much is remaining at birth)
  const firstDashaFullYears = DASHA_SEQUENCE[startLordIdx].years;
  const balanceYears = firstDashaFullYears * (1 - posInNakshatra);

  const now = new Date();
  const periods: DashaPeriod[] = [];
  let cursor = new Date(birthDate);

  for (let i = 0; i < 9; i++) {
    const seqIdx = (startLordIdx + i) % 9;
    const { lord, years: fullYears } = DASHA_SEQUENCE[seqIdx];
    const actualYears = i === 0 ? balanceYears : fullYears;
    const endMs = cursor.getTime() + actualYears * 365.25 * 24 * 3600 * 1000;
    const endDate = new Date(endMs);

    const isCurrent = cursor <= now && now < endDate;

    // Sub-periods (Antardasha)
    const subPeriods: SubDashaPeriod[] = [];
    let subCursor = new Date(cursor);
    for (let j = 0; j < 9; j++) {
      const subIdx = (seqIdx + j) % 9;
      const subLord = DASHA_SEQUENCE[subIdx].lord;
      const subYears = (actualYears * DASHA_SEQUENCE[subIdx].years) / TOTAL_YEARS;
      const subEndMs = subCursor.getTime() + subYears * 365.25 * 24 * 3600 * 1000;
      const subEnd = new Date(subEndMs);
      subPeriods.push({
        lord: subLord,
        startDate: new Date(subCursor),
        endDate: subEnd,
        isCurrent: subCursor <= now && now < subEnd,
      });
      subCursor = new Date(subEndMs);
    }

    periods.push({
      lord,
      startDate: new Date(cursor),
      endDate,
      years: Math.round(actualYears * 10) / 10,
      isCurrent,
      subPeriods,
    });

    cursor = endDate;
  }

  return periods;
}

export function DashaProduct({ birth, computed }: SubProductProps) {
  const { chart } = computed;

  const moonData = chart.planets['moon'];
  const moonSidLong = moonData?.siderealLongitude ?? 0;
  const nakshatraIdx = Math.floor(moonSidLong / (360 / 27));
  const nakshatraName = NAKSHATRA_NAMES[nakshatraIdx] ?? 'Unknown';

  const periods = useMemo(() => {
    const birthDate = new Date(`${birth.dob}T${birth.tob}`);
    return computeDasha(moonSidLong, birthDate);
  }, [moonSidLong, birth.dob, birth.tob]);

  const currentPeriod = periods.find(p => p.isCurrent);
  const currentSub = currentPeriod?.subPeriods.find(s => s.isCurrent);

  return (
    <div className="space-y-6">
      {/* Moon info header */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border border-gold/15 rounded-lg bg-white/[0.02]">
          <div className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-1">Moon Nakshatra</div>
          <div className="text-gold font-display font-semibold">{nakshatraName}</div>
          <div className="text-cream-dim/60 text-xs mt-0.5">in {moonData?.sign ?? '—'}</div>
        </div>
        <div className="p-3 border border-gold/15 rounded-lg bg-white/[0.02]">
          <div className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-1">Current Dasha</div>
          <div className="text-gold font-display font-semibold">
            {LORD_EMOJI[currentPeriod?.lord ?? ''] ?? ''} {currentPeriod?.lord ?? '—'}
          </div>
          <div className="text-cream-dim/60 text-xs mt-0.5">
            Sub: {currentSub?.lord ?? '—'}
          </div>
        </div>
      </div>

      {/* Dasha timeline */}
      <div>
        <h4 className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-3">
          Vimshottari Maha Dasha Periods
        </h4>
        <div className="space-y-1">
          {periods.map((p, i) => {
            const now = new Date();
            const totalMs = p.endDate.getTime() - p.startDate.getTime();
            const elapsedMs = Math.max(0, Math.min(now.getTime() - p.startDate.getTime(), totalMs));
            const pct = totalMs > 0 ? (elapsedMs / totalMs) * 100 : 0;
            const isPast = now > p.endDate;
            const isFuture = now < p.startDate;

            return (
              <div
                key={i}
                className={`p-3 border rounded-lg transition-colors ${
                  p.isCurrent
                    ? 'border-gold/40 bg-gold/[0.06]'
                    : isPast
                      ? 'border-white/[0.04] bg-white/[0.01] opacity-60'
                      : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{LORD_EMOJI[p.lord] ?? '·'}</span>
                    <span className={`font-semibold text-sm ${p.isCurrent ? 'text-gold' : 'text-cream-dim'}`}>
                      {p.lord}
                    </span>
                    <span className="text-[10px] text-cream-dim/40 font-mono">({p.years}y)</span>
                    {p.isCurrent && (
                      <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                        active
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-cream-dim/40 font-mono">
                    {formatDate(p.startDate)} – {formatDate(p.endDate)}
                  </span>
                </div>

                {/* Progress bar */}
                {!isFuture && (
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.isCurrent ? 'bg-gold' : 'bg-cream-dim/20'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}

                {/* Sub-periods for current Maha Dasha */}
                {p.isCurrent && (
                  <div className="mt-3 ml-4 space-y-1">
                    <div className="font-mono text-[9px] text-cream-dim/40 uppercase tracking-widest mb-2">
                      Antardasha (Sub-periods)
                    </div>
                    {p.subPeriods.map((sp, j) => (
                      <div
                        key={j}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                          sp.isCurrent
                            ? 'bg-gold/10 border border-gold/25 text-gold font-semibold'
                            : new Date() > sp.endDate
                              ? 'text-cream-dim/30'
                              : 'text-cream-dim/60'
                        }`}
                      >
                        <span>{LORD_EMOJI[sp.lord] ?? '·'} {sp.lord}</span>
                        <span className="font-mono text-[10px]">
                          {formatDate(sp.startDate)} – {formatDate(sp.endDate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[10px] text-cream-dim/40 font-mono pt-2 border-t border-white/[0.05]">
        Vimshottari Dasha based on Moon at {moonSidLong.toFixed(2)}° · Nakshatra: {nakshatraName}
      </div>
    </div>
  );
}
