import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { computeDasha } from '../../lib/astrology';
import type { ChartData } from '../../lib/astrology';

const AVATAR_URL = '/ronaldo.png';

// ─── Dignity tables (mirrors scoring.ts) ─────────────────────────────────────

const DIGNITY: Record<string, { exalted: string; ownSigns: string[]; debilitated: string; natural: string }> = {
  Sun:     { exalted: 'Aries',     ownSigns: ['Leo'],                    debilitated: 'Libra',      natural: 'authority, vitality, leadership' },
  Moon:    { exalted: 'Taurus',    ownSigns: ['Cancer'],                 debilitated: 'Scorpio',    natural: 'intuition, empathy, adaptability' },
  Mars:    { exalted: 'Capricorn', ownSigns: ['Aries','Scorpio'],       debilitated: 'Cancer',     natural: 'drive, courage, decisive action' },
  Mercury: { exalted: 'Virgo',     ownSigns: ['Gemini','Virgo'],        debilitated: 'Pisces',     natural: 'intellect, communication, strategy' },
  Jupiter: { exalted: 'Cancer',    ownSigns: ['Sagittarius','Pisces'],  debilitated: 'Capricorn',  natural: 'wisdom, abundance, spiritual growth' },
  Venus:   { exalted: 'Pisces',    ownSigns: ['Taurus','Libra'],        debilitated: 'Virgo',      natural: 'charm, creativity, relationships' },
  Saturn:  { exalted: 'Libra',     ownSigns: ['Capricorn','Aquarius'],  debilitated: 'Aries',      natural: 'discipline, endurance, karmic mastery' },
};

const DEBILITY_MEANING: Record<string, string> = {
  Sun:     'Self-doubt undermines authority',
  Moon:    'Emotional turbulence, fear of vulnerability',
  Mars:    'Energy disperses; reactive over proactive',
  Mercury: 'Mental fog; precision eludes you',
  Jupiter: 'Growth blocked by chronic self-doubt',
  Venus:   'Over-analytical; beauty feels inaccessible',
  Saturn:  'Impatient with limits; authority conflicts',
};

const MALEFICS = ['Mars', 'Saturn', 'Rahu', 'Ketu'];
const SENSITIVE_HOUSES = [6, 8, 12]; // Dusthana houses

interface SWOTItem { planet: string; sign: string; label: string; detail: string }

interface SWOTData {
  strengths:    SWOTItem[];
  weaknesses:   SWOTItem[];
  opportunities: { label: string; detail: string }[];
  threats:       { label: string; detail: string }[];
}

function computeSWOT(chart: ChartData, dob: string, tob: string): SWOTData {
  const strengths:   SWOTItem[] = [];
  const weaknesses:  SWOTItem[] = [];

  for (const [key, p] of Object.entries(chart.planets)) {
    const name = p.name;
    const d = DIGNITY[name];
    if (!d) continue;
    if (p.sign === d.exalted) {
      strengths.push({ planet: name, sign: p.sign, label: `${name} Exalted`, detail: d.natural });
    } else if (d.ownSigns.includes(p.sign)) {
      strengths.push({ planet: name, sign: p.sign, label: `${name} in Own Sign`, detail: d.natural });
    } else if (p.sign === d.debilitated) {
      weaknesses.push({ planet: name, sign: p.sign, label: `${name} Debilitated`, detail: DEBILITY_MEANING[name] ?? 'Natural energy weakened' });
    }
  }

  // Opportunities — current dasha lord natural gifts
  const birthDate = new Date(`${dob}T${tob}`);
  const moonLong = chart.planets['moon']?.siderealLongitude ?? 0;
  const periods = computeDasha(moonLong, birthDate);
  const currentPeriod = periods.find(p => p.isCurrent);
  const currentSub = currentPeriod?.subPeriods.find(s => s.isCurrent);

  const opportunities: { label: string; detail: string }[] = [];
  if (currentPeriod) {
    const d = DIGNITY[currentPeriod.lord];
    if (d) {
      opportunities.push({ label: `${currentPeriod.lord} Dasha Active`, detail: `Amplified ${d.natural}` });
    }
  }
  if (currentSub && currentSub.lord !== currentPeriod?.lord) {
    const d = DIGNITY[currentSub.lord];
    if (d) {
      opportunities.push({ label: `${currentSub.lord} Sub-period`, detail: `Window for ${d.natural.split(',')[0]}` });
    }
  }
  // Jupiter in beneficial houses = opportunity
  const jup = chart.planets['jupiter'];
  if (jup && [1,2,5,9,10,11].includes(jup.house)) {
    opportunities.push({ label: 'Jupiter benefic house', detail: `Abundance in house ${jup.house}` });
  }
  if (opportunities.length === 0) {
    opportunities.push({ label: 'Neutral Dasha Period', detail: 'Use this time for preparation' });
  }

  // Threats — malefics in dusthana houses
  const threats: { label: string; detail: string }[] = [];
  for (const [, p] of Object.entries(chart.planets)) {
    if (MALEFICS.includes(p.name) && SENSITIVE_HOUSES.includes(p.house)) {
      const houseLabel = p.house === 6 ? 'enemies & health' : p.house === 8 ? 'sudden change' : 'loss & isolation';
      threats.push({ label: `${p.name} in House ${p.house}`, detail: `Caution: ${houseLabel}` });
    }
  }
  // Moon in Scorpio (debilitated) = emotional threat
  if (chart.planets['moon']?.sign === 'Scorpio') {
    threats.push({ label: 'Moon Debilitated', detail: 'Emotional decisions may mislead' });
  }
  if (threats.length === 0) {
    threats.push({ label: 'No Major Threats', detail: 'Chart is relatively well-protected' });
  }

  return { strengths, weaknesses, opportunities, threats };
}

// ─── Vertical Tile component ──────────────────────────────────────────────────

const Tile: React.FC<{
  icon: string;
  title: string;
  color: string;
  items: { label: string; detail: string }[];
  delay: number;
  rec?: boolean;
}> = function Tile({ icon, title, color, items, delay, rec }) {
  return (
    <motion.div
      initial={rec ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={rec ? { duration: 0 } : { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl px-4 py-3 flex gap-3 items-start overflow-hidden"
      style={{ background: `${color}08`, border: `1px solid ${color}28` }}
    >
      {/* Icon column */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <span className="text-[15px] leading-none">{icon}</span>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] mb-1.5 leading-none" style={{ color }}>
          {title}
        </p>
        {items.length === 0 ? (
          <p className="font-mono text-[10px] text-white/35 italic">—</p>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 3).map((item, i) => (
              <div key={i}>
                <p className="font-serif text-[13px] text-white/88 leading-tight">{item.label}</p>
                <p className="font-mono text-[10px] mt-0.5 leading-snug" style={{ color: `${color}bb` }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Slide ────────────────────────────────────────────────────────────────────

interface SlideSWOTProps {
  chart: ChartData;
  dob: string;
  tob: string;
  name: string;
  recordStep?: number;
}

export function SlideSWOT({ chart, dob, tob, name, recordStep }: SlideSWOTProps) {
  const swot = useMemo(() => computeSWOT(chart, dob, tob), [chart, dob, tob]);

  const rec = recordStep != null;

  type TileDef = { icon:string; title: string; color: string; items: { label: string; detail: string }[]; delay: number };
  const tiles: TileDef[] = [
    { icon:'⚡', title: 'Strengths',      color: '#34d399', items: swot.strengths.map(s => ({ label: s.label, detail: `${s.sign} · ${s.detail}` })),      delay: 0.08 },
    { icon:'⚠', title: 'Weaknesses',     color: '#f87171', items: swot.weaknesses.map(w => ({ label: w.label, detail: `${w.sign} · ${w.detail}` })),     delay: 0.16 },
    { icon:'✦', title: 'Opportunities',  color: '#60a5fa', items: swot.opportunities,                                                                      delay: 0.24 },
    { icon:'◈', title: 'Threats',        color: '#fb923c', items: swot.threats,                                                                            delay: 0.32 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030303] overflow-hidden">
      {/* Glows */}
      {!rec && (
        <>
          <div className="absolute top-0 left-0 w-[200px] h-[200px] rounded-full bg-[#34d399]/[0.04] blur-[70px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[200px] h-[200px] rounded-full bg-[#f87171]/[0.04] blur-[70px] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <div className="relative z-10 pt-6 px-5 pb-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#C1A661]/70 mb-1">
          Astrological SWOT
        </p>
        <div className="flex items-center justify-between">
          <p className="font-serif text-[18px] text-white/85 leading-none">Cosmic DNA Decoded</p>
          <div className="flex items-center gap-2">
            <p className="font-serif text-[12px] text-white/70 leading-none truncate max-w-[100px]">{name}</p>
            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#C1A661]/30 bg-[#111] flex-shrink-0">
              <img src={AVATAR_URL} alt={name} className="w-full h-full object-contain object-top scale-110" />
            </div>
          </div>
        </div>
      </div>

      {/* Vertical tiles */}
      <div className="relative z-10 flex-1 px-4 pb-4 flex flex-col gap-2.5 overflow-hidden">
        {tiles.map((t, i) => (
          rec && recordStep! < 1 + i ? null :
          <Tile
            key={t.title}
            icon={t.icon}
            title={t.title}
            color={t.color}
            items={t.items}
            delay={t.delay}
            rec={rec}
          />
        ))}
      </div>

      {/* CTA */}
      {(!rec || recordStep! >= 5) && (
      <motion.div
        initial={rec ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={rec ? { duration: 0 } : { delay: 0.45, duration: 0.4 }}
        className="relative z-10 mx-4 mb-3"
      >
        <a
          href="https://timeceptor.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#C1A661]/25 bg-[#C1A661]/[0.06] hover:bg-[#C1A661]/[0.1] transition-colors"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C1A661]/85">
            Visit timeceptor.com for a detailed report →
          </span>
        </a>
      </motion.div>
      )}

      <div className="relative z-10 pb-3 pt-0 flex items-center justify-center opacity-15">
        <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-[#C1A661]">Timeceptor</span>
      </div>
    </div>
  );
}

/** 0=header, 1..4=SWOT tiles, 5=CTA → 6 total */
export const SWOT_RECORD_STEPS = 6;
export function swotRecordConfig() {
  return {
    total: 6,
    holdFrames(step: number): number {
      if (step === 0) return 6;    // header
      if (step <= 4) return 2;     // tile stagger 0.08s
      return 6;                    // CTA
    },
  };
}
