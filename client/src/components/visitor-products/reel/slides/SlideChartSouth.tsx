import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { NAKSHATRA_NAMES } from '../../../../lib/astrology';
import type { ChartData } from '../../../../lib/astrology';

const AVATAR_URL = '/ProfileUnavailable.jpg';

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];
const PLANET_SYMBOLS: Record<string,string> = {
  sun:'☉',moon:'☽',mars:'♂',mercury:'☿',jupiter:'♃',venus:'♀',saturn:'♄',rahu:'☊',ketu:'☋',
};
const PLANET_COLORS: Record<string,string> = {
  Sun:'#e8c97a',Moon:'#8ab4d4',Mars:'#e07070',Mercury:'#6dc89a',
  Jupiter:'#C1A661',Venus:'#f7c6d4',Saturn:'#9090b0',Rahu:'#a78bfa',Ketu:'#fb923c',
};
const DIGNITY: Record<string,{ exalted:string; own:string[]; debilitated:string }> = {
  Sun:     { exalted:'Aries',     own:['Leo'],                    debilitated:'Libra'      },
  Moon:    { exalted:'Taurus',    own:['Cancer'],                 debilitated:'Scorpio'    },
  Mars:    { exalted:'Capricorn', own:['Aries','Scorpio'],        debilitated:'Cancer'     },
  Mercury: { exalted:'Virgo',     own:['Gemini','Virgo'],         debilitated:'Pisces'     },
  Jupiter: { exalted:'Cancer',    own:['Sagittarius','Pisces'],   debilitated:'Capricorn'  },
  Venus:   { exalted:'Pisces',    own:['Taurus','Libra'],         debilitated:'Virgo'      },
  Saturn:  { exalted:'Libra',     own:['Capricorn','Aquarius'],   debilitated:'Aries'      },
};
type DignityStatus = 'Exalted'|'Own Sign'|'Neutral'|'Debilitated';
const DIGNITY_ORDER:Record<DignityStatus,number> = {Exalted:0,'Own Sign':1,Neutral:2,Debilitated:3};
const DIGNITY_COLOR:Record<DignityStatus,string> = {
  Exalted:'#34d399','Own Sign':'#60a5fa',Neutral:'rgba(255,255,255,0.28)',Debilitated:'#f87171',
};
function getStatus(planet:string, sign:string): DignityStatus {
  const d = DIGNITY[planet];
  if (!d) return 'Neutral';
  if (sign === d.exalted)    return 'Exalted';
  if (d.own.includes(sign))  return 'Own Sign';
  if (sign===d.debilitated)  return 'Debilitated';
  return 'Neutral';
}

// ─── South Indian chart: signs are FIXED in grid, planets assigned to their sign cell ──
// Standard layout (Pisces top-left, clockwise):
//   Row1: Pis Ari Tau Gem
//   Row2: Aqu  —   —  Can
//   Row3: Cap  —   —  Leo
//   Row4: Sag Sco Lib Vir
const SI_CELLS: { sign:string; col:number; row:number }[] = [
  {sign:'Pisces',      col:1,row:1},{sign:'Aries',      col:2,row:1},
  {sign:'Taurus',      col:3,row:1},{sign:'Gemini',     col:4,row:1},
  {sign:'Aquarius',    col:1,row:2},                                  {sign:'Cancer',     col:4,row:2},
  {sign:'Capricorn',   col:1,row:3},                                  {sign:'Leo',        col:4,row:3},
  {sign:'Sagittarius', col:1,row:4},{sign:'Scorpio',    col:2,row:4},
  {sign:'Libra',       col:3,row:4},{sign:'Virgo',      col:4,row:4},
];

function BirthChartSouth({ chart, rec }: { chart:ChartData; rec?:boolean }) {
  const ascSign = SIGNS[Math.floor(((chart.ascendant%360)+360)%360 / 30)];

  function cellPlanets(sign:string) {
    return Object.entries(chart.planets)
      .filter(([,p]) => p.sign === sign)
      .map(([key,p]) => ({
        key,
        sym:   PLANET_SYMBOLS[key] ?? '·',
        color: PLANET_COLORS[p.name as string] ?? '#fff',
        name:  p.name as string,
      }));
  }

  return (
    <div className="relative w-full h-full">
      {/* Double outer border */}
      <div className="absolute inset-0 rounded-xl border-[1.8px] border-[#C1A661]/50 pointer-events-none z-20" />
      <div className="absolute inset-[5px] rounded-lg border border-[#C1A661]/18 pointer-events-none z-20" />

      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-[1.5px] p-[1.5px]">
        {SI_CELLS.map(({ sign, col, row }) => {
          const planets = cellPlanets(sign);
          const isAsc   = sign === ascSign;
          return (
            <div
              key={sign}
              style={{ gridColumn:col, gridRow:row }}
              className={`relative flex flex-col rounded-[5px] overflow-hidden
                ${isAsc
                  ? 'bg-[#C1A661]/[0.11] border-[1.5px] border-[#C1A661]/55'
                  : 'bg-white/[0.025] border border-white/[0.10]'}`}
            >
              {/* Sign name — no glyph */}
              <div className="px-[5px] pt-[4px] flex items-center gap-[3px]">
                <span className={`font-mono text-[10px] uppercase font-bold leading-none tracking-wide
                  ${isAsc ? 'text-[#C1A661]' : 'text-white/45'}`}>
                  {sign.slice(0,3)}
                </span>
                {isAsc && (
                  <span className="font-mono text-[8px] text-[#C1A661] font-bold leading-none">↑</span>
                )}
              </div>
              {/* Planet symbols — big, colored, no background */}
              <div className="flex flex-wrap gap-0 px-[3px] pb-[3px] mt-auto leading-none">
                {planets.map(pl => (
                  <span
                    key={pl.key}
                    className="text-[19px] leading-none"
                    style={{ color: pl.color, filter:`drop-shadow(0 0 3px ${pl.color}55)` }}
                    title={pl.name}
                  >
                    {pl.sym}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Center 2×2: decorative rings + rising sign */}
        <div
          style={{gridColumn:'2/4', gridRow:'2/4'}}
          className="relative flex items-center justify-center rounded-md border border-white/[0.07] bg-[#030303]/80"
        >
          <div
            className={`absolute rounded-full border border-[#C1A661]/[0.22] ${rec ? '' : 'animate-[spin_120s_linear_infinite]'}`}
            style={{inset:'14%'}}
          />
          <div
            className={`absolute rounded-full border border-dashed border-white/[0.07] ${rec ? '' : 'animate-[spin_80s_linear_infinite_reverse]'}`}
            style={{inset:'26%'}}
          />
          <div
            className="relative z-10 flex flex-col items-center justify-center rounded-xl border border-[#C1A661]/[0.20] bg-[#030303]/90"
            style={{width:'61.8%', height:'61.8%'}}
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28 leading-none mb-[3px]">
              Rising
            </span>
            <span className="font-serif text-[14px] text-[#C1A661]/90 tracking-wide leading-none">
              {ascSign}
            </span>
            <span className="font-mono text-[8px] text-white/32 mt-[3px]">
              {((chart.ascendant%360+360)%360).toFixed(1)}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Planet Powers Row ────────────────────────────────────────────────────────
function PlanetRow({ planet, sign, status, deg, delay, rec }: {
  planet:string; sign:string; status:DignityStatus; deg:number; delay:number; rec?:boolean; key?:React.Key;
}) {
  const color   = DIGNITY_COLOR[status];
  const sym     = PLANET_SYMBOLS[planet.toLowerCase()] ?? '·';
  const pColor  = PLANET_COLORS[planet] ?? '#fff';
  const isPower = status === 'Exalted' || status === 'Own Sign';
  return (
    <motion.div
      initial={rec ? false : { opacity:0, x:-8 }}
      animate={{ opacity:1, x:0 }}
      transition={rec ? { duration:0 } : { delay, duration:0.35, ease:[0.22,1,0.36,1] }}
      className="flex items-center gap-2 py-[5px] border-b border-white/[0.05] last:border-0"
    >
      <div className="relative w-[7px] h-[7px] flex-shrink-0">
        {isPower && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background:color }}
            animate={{ scale:[1,2,1], opacity:[0.7,0,0.7] }}
            transition={{ duration:2.2, repeat:Infinity, delay:delay*0.3 }}
          />
        )}
        <div className="absolute inset-0 rounded-full" style={{ background:isPower?color:'rgba(255,255,255,0.08)' }} />
      </div>
      <span className="text-[15px] leading-none flex-shrink-0" style={{color:pColor}}>{sym}</span>
      <span className="font-serif text-[13px] text-white/80 w-[62px] flex-shrink-0">{planet}</span>
      <span className="font-mono text-[11px] text-white/38 flex-shrink-0">in {sign}</span>
      <span className="font-mono text-[10px] text-white/22 ml-auto flex-shrink-0">{deg.toFixed(1)}°</span>
      <span
        className="font-mono text-[9px] uppercase tracking-wide px-2 py-[2px] rounded-full border flex-shrink-0"
        style={{ color, borderColor:`${color}40`, background:`${color}10` }}
      >
        {status}
      </span>
    </motion.div>
  );
}

// ─── Slide ────────────────────────────────────────────────────────────────────
interface SlideChartSouthProps {
  name: string;
  chart: ChartData;
  dob: string;
  locationName: string;
  recordStep?: number;
  avatarUrl?: string;
}

export function SlideChartSouth({ name, chart, dob, locationName, recordStep, avatarUrl }: SlideChartSouthProps) {
  const ascSign = SIGNS[Math.floor(((chart.ascendant%360)+360)%360 / 30)];
  const moonLong = chart.planets['moon']?.siderealLongitude ?? 0;
  const nakshatraIdx = Math.floor((moonLong as number) / (360/27));
  const _nak = NAKSHATRA_NAMES[nakshatraIdx] ?? '—';

  type PlanetEntry = { key:string; name:string; sign:string; status:DignityStatus; deg:number; order:number; node?:string };
  const planetPowers = useMemo(():PlanetEntry[] => {
    const regular: PlanetEntry[] = Object.entries(chart.planets)
      .filter(([k]) => !['rahu','ketu'].includes(k))
      .map(([key,p]) => {
        const name   = p.name as string;
        const sign   = p.sign as string;
        const status = getStatus(name, sign);
        return { key, name, sign, status, deg:(p.siderealLongitude as number)%30, order:DIGNITY_ORDER[status] };
      })
      .sort((a,b) => a.order - b.order);
    const rahu = chart.planets['rahu'];
    const ketu = chart.planets['ketu'];
    if (rahu) regular.push({ key:'rahu', name:'Rahu', sign:rahu.sign as string, status:'Neutral', deg:(rahu.siderealLongitude as number)%30, order:4, node:'North Node ☊' });
    if (ketu) regular.push({ key:'ketu', name:'Ketu', sign:ketu.sign as string, status:'Neutral', deg:(ketu.siderealLongitude as number)%30, order:4, node:'South Node ☋' });
    return regular;
  }, [chart]);

  const rec = recordStep != null;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030303] overflow-hidden">
      {!rec && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[260px] h-[160px] rounded-full bg-[#C1A661]/[0.05] blur-[80px] pointer-events-none" />}

      {/* Header */}
      <div className="relative z-10 pt-2 px-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C1A661]/30 bg-[#111] flex-shrink-0">
          <img src={avatarUrl || AVATAR_URL} alt={name} className="w-full h-full object-contain object-top scale-110" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[14px] text-white/80 leading-none truncate">{name}</p>
          <p className="font-mono text-[9px] text-white/25 mt-0.5 truncate">{dob} · {locationName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-[9px] text-[#C1A661]/60 uppercase tracking-[0.25em] leading-none">Natal Chart</p>
          <p className="font-mono text-[8px] text-white/20 mt-0.5">Vedic · Sidereal</p>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={rec ? false : { opacity:0, scale:0.93 }}
        animate={{ opacity: !rec || recordStep! >= 1 ? 1 : 0, scale: !rec || recordStep! >= 1 ? 1 : 0.93 }}
        transition={rec ? { duration:0 } : { duration:0.7, ease:[0.22,1,0.36,1] }}
        className="relative z-10 px-4 w-full" style={{ height: 220 }}
      >
        <BirthChartSouth chart={chart} rec={rec} />
      </motion.div>

      {/* Planet Powers */}
      <div className="relative z-10 flex-1 px-4 mt-2 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px flex-1 bg-gradient-to-r from-[#C1A661]/25 to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C1A661]/50">Planet Powers</span>
          <div className="h-px flex-1 bg-gradient-to-l from-[#C1A661]/25 to-transparent" />
        </div>
        {planetPowers.map((p,i) => (
          rec && recordStep! < 2 + i ? null :
          <PlanetRow key={p.key} planet={p.node ?? p.name} sign={p.sign} status={p.status} deg={p.deg} delay={0.4+i*0.06} rec={rec} />
        ))}
      </div>

      <div className="relative z-10 pb-3 pt-1 flex items-center justify-center opacity-15">
        <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-[#C1A661]">Timeceptor</span>
      </div>
    </div>
  );
}

/** 0=header, 1=chart, 2..10=nine planet rows → 11 total */
export const CHART_SOUTH_RECORD_STEPS = 11;
export function chartSouthRecordConfig() {
  return {
    total: 11,
    holdFrames(step: number): number {
      if (step === 0) return 6;
      if (step === 1) return 10;   // chart scale-in 0.7s
      return 2;                    // planet stagger 0.06s
    },
  };
}
