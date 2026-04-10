import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { NAKSHATRA_NAMES } from '../../lib/astrology';
import type { ChartData } from '../../lib/astrology';

const AVATAR_URL = '/ronaldo.png';

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

type DignityStatus = 'Exalted' | 'Own Sign' | 'Neutral' | 'Debilitated';
const DIGNITY_ORDER:Record<DignityStatus,number> = { Exalted:0,'Own Sign':1,Neutral:2,Debilitated:3 };
const DIGNITY_COLOR:Record<DignityStatus,string> = {
  Exalted:'#34d399','Own Sign':'#60a5fa',Neutral:'rgba(255,255,255,0.28)',Debilitated:'#f87171',
};

function getStatus(planet:string, sign:string): DignityStatus {
  const d = DIGNITY[planet];
  if (!d) return 'Neutral';
  if (sign === d.exalted)     return 'Exalted';
  if (d.own.includes(sign))   return 'Own Sign';
  if (sign === d.debilitated) return 'Debilitated';
  return 'Neutral';
}

// ─── North Indian Diamond Chart ──────────────────────────────────────────────
// 3×3 grid (300×300 SVG). H1,4,7,10 = rectangular kendra boxes.
// The 4 corners each split by a diagonal (outer-corner → inner-corner = 45°).
// Houses go clockwise from H1 (top center):
//   H12/H11 share TL, H2/H3 share TR, H5/H6 share BR, H8/H9 share BL.
const NI_HOUSES: { num:number; pts:string; cx:number; cy:number }[] = [
  { num: 1,  pts:'100,0 200,0 200,100 100,100',       cx:150, cy:48  },
  { num: 2,  pts:'200,0 300,0 200,100',               cx:233, cy:33  },
  { num: 3,  pts:'300,0 300,100 200,100',             cx:267, cy:67  },
  { num: 4,  pts:'200,100 300,100 300,200 200,200',   cx:252, cy:150 },
  { num: 5,  pts:'200,200 300,200 300,300',           cx:267, cy:233 },
  { num: 6,  pts:'200,200 300,300 200,300',           cx:233, cy:267 },
  { num: 7,  pts:'100,200 200,200 200,300 100,300',   cx:150, cy:252 },
  { num: 8,  pts:'100,200 100,300 0,300',             cx:67,  cy:267 },
  { num: 9,  pts:'0,200 100,200 0,300',               cx:33,  cy:233 },
  { num:10,  pts:'0,100 100,100 100,200 0,200',       cx:48,  cy:150 },
  { num:11,  pts:'0,0 100,100 0,100',                 cx:33,  cy:67  },
  { num:12,  pts:'0,0 100,0 100,100',                 cx:67,  cy:33  },
];

function BirthChartNorthIndian({ chart }: { chart:ChartData }) {
  const ascLong = ((chart.ascendant % 360) + 360) % 360;
  const ascIdx  = Math.floor(ascLong / 30);

  // group planets by house number
  const byHouse: Record<number,{key:string;sym:string;color:string}[]> = {};
  for (let h=1; h<=12; h++) byHouse[h] = [];
  Object.entries(chart.planets).forEach(([key, p]) => {
    const h = p.house as number;
    if (h >= 1 && h <= 12) {
      byHouse[h].push({
        key,
        sym: PLANET_SYMBOLS[key] ?? '·',
        color: PLANET_COLORS[p.name as string] ?? '#fff',
      });
    }
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      {/* Double outer rect border */}
      <rect x="1" y="1" width="298" height="298"
        fill="none" stroke="#C1A661" strokeWidth="1.8" strokeOpacity="0.45" />
      <rect x="5" y="5" width="290" height="290"
        fill="none" stroke="#C1A661" strokeWidth="0.7" strokeOpacity="0.15" />

      {/* House polygons */}
      {NI_HOUSES.map(({ num, pts, cx, cy }) => {
        const isAsc  = num === 1;
        const sign   = SIGNS[(ascIdx + num - 1) % 12];
        const abbr   = sign.slice(0,3).toUpperCase();
        const planets = byHouse[num] ?? [];
        const totalLines = 1 + (planets.length > 0 ? 1 : 0);
        const baseY = cy - (totalLines - 1) * 7;

        return (
          <g key={num}>
            <polygon
              points={pts}
              fill={isAsc ? 'rgba(193,166,97,0.09)' : 'rgba(255,255,255,0.015)'}
              stroke="#C1A661"
              strokeWidth={isAsc ? '1.4' : '0.9'}
              strokeOpacity={isAsc ? '0.55' : '0.28'}
            />
            {/* House number — tiny, at centroid top */}
            <text
              x={cx} y={baseY - 4}
              textAnchor="middle" fontSize="7"
              fill="rgba(255,255,255,0.22)" fontFamily="monospace"
            >{num}</text>
            {/* Sign abbrev */}
            <text
              x={cx} y={baseY + 5}
              textAnchor="middle" fontSize="9"
              fill={isAsc ? '#C1A661' : 'rgba(255,255,255,0.42)'}
              fontFamily="monospace"
              fontWeight={isAsc ? '700' : '400'}
            >{abbr}{isAsc ? '↑' : ''}</text>
            {/* Planet symbols — bigger, colored */}
            {planets.map((pl, i) => {
              // spread multiple planets horizontally around cx
              const spacing = 16;
              const startX  = cx - ((planets.length - 1) * spacing) / 2;
              return (
                <text
                  key={pl.key}
                  x={startX + i * spacing} y={baseY + 22}
                  textAnchor="middle" fontSize="17"
                  fill={pl.color} fontFamily="serif"
                  style={{ filter:`drop-shadow(0 0 3px ${pl.color}66)` }}
                >{pl.sym}</text>
              );
            })}
          </g>
        );
      })}

      {/* Center decorative block: 100×100 at (100,100) */}
      <rect x="100" y="100" width="100" height="100"
        fill="rgba(3,3,3,0.88)"
        stroke="#C1A661" strokeWidth="0.6" strokeOpacity="0.18"
      />
      {/* Spinning inner rings */}
      <circle cx="150" cy="150" r="37"
        fill="none" stroke="#C1A661" strokeWidth="0.7" strokeOpacity="0.18" />
      <circle cx="150" cy="150" r="25"
        fill="none" stroke="#C1A661" strokeWidth="0.4" strokeOpacity="0.10"
        strokeDasharray="2 4" />
      {/* Center label */}
      <text x="150" y="144" textAnchor="middle"
        fontSize="7.5" fill="rgba(255,255,255,0.28)" fontFamily="monospace" letterSpacing="1.5">
        RISING
      </text>
      <text x="150" y="158" textAnchor="middle"
        fontSize="15" fill="#C1A661" fillOpacity="0.88" fontFamily="serif">
        {SIGNS[ascIdx]}
      </text>
      <text x="150" y="170" textAnchor="middle"
        fontSize="8.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">
        {ascLong.toFixed(1)}°
      </text>
    </svg>
  );
}

// ─── Planet Power Row ─────────────────────────────────────────────────────────
function PlanetRow({ planet,sign,status,deg,delay,rec }:{
  planet:string;sign:string;status:DignityStatus;deg:number;delay:number;rec?:boolean;key?:React.Key;
}) {
  const color  = DIGNITY_COLOR[status];
  const sym    = PLANET_SYMBOLS[planet.toLowerCase()]??'·';
  const pColor = PLANET_COLORS[planet]??'#fff';
  const isPower= status==='Exalted'||status==='Own Sign';
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
interface SlideChartEasternProps {
  name: string;
  chart: ChartData;
  dob: string;
  locationName: string;
  recordStep?: number;
}

export function SlideChartEastern({ name, chart, dob, locationName, recordStep }: SlideChartEasternProps) {
  const ascSign = SIGNS[Math.floor((chart.ascendant%360)/30)];
  const moonLong = chart.planets['moon']?.siderealLongitude??0;
  const nakshatraIdx = Math.floor(moonLong/(360/27));
  const _nakshatra = NAKSHATRA_NAMES[nakshatraIdx]??'—';

  type PlanetEntry = { key:string; name:string; sign:string; status:DignityStatus; deg:number; order:number; node?:string };
  const planetPowers = useMemo(():PlanetEntry[] => {
    const regular: PlanetEntry[] = Object.entries(chart.planets)
      .filter(([k]) => !['rahu','ketu'].includes(k))
      .map(([key,p]) => {
        const name   = (p.name as string);
        const sign   = (p.sign as string);
        const status = getStatus(name, sign);
        return { key, name, sign, status, deg:(p.siderealLongitude as number)%30, order:DIGNITY_ORDER[status] };
      })
      .sort((a,b) => a.order - b.order);
    const rahu = chart.planets['rahu'];
    const ketu = chart.planets['ketu'];
    if (rahu) regular.push({ key:'rahu', name:'Rahu', sign:rahu.sign, status:'Neutral', deg:(rahu.siderealLongitude as number)%30, order:4, node:'North Node ☊' });
    if (ketu) regular.push({ key:'ketu', name:'Ketu', sign:ketu.sign, status:'Neutral', deg:(ketu.siderealLongitude as number)%30, order:4, node:'South Node ☋' });
    return regular;
  }, [chart]);

  const rec = recordStep != null;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030303] overflow-hidden">
      {!rec && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[180px] rounded-full bg-[#C1A661]/[0.05] blur-[80px] pointer-events-none" />}

      {/* Header */}
      <div className="relative z-10 pt-2 px-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C1A661]/30 bg-[#111] flex-shrink-0">
          <img src={AVATAR_URL} alt={name} className="w-full h-full object-contain object-top scale-110" />
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
        className="relative z-10 px-4 mx-auto aspect-square" style={{ maxWidth: 260 }}
      >
        <BirthChartNorthIndian chart={chart} />
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
export const CHART_EASTERN_RECORD_STEPS = 11;
export function chartEasternRecordConfig() {
  return {
    total: 11,
    holdFrames(step: number): number {
      if (step === 0) return 6;
      if (step === 1) return 10;   // chart scale-in 0.7s
      return 2;                    // planet stagger 0.06s
    },
  };
}
