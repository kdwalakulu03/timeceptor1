import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { NAKSHATRA_NAMES } from '../../../../lib/astrology';
import type { ChartData } from '../../../../lib/astrology';

const AVATAR_URL = '/ProfileUnavailable.jpg';

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];
const SIGN_GLYPHS: Record<string,string> = {
  Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
  Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓',
};
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

// ─── Western Wheel Chart (SVG) ───────────────────────────────────────────────
// Layout:
//   R_OUTER=138  outer circle + double border
//   R_SIGN =118  inner edge of sign ring (glyph sits in 118–138 band)
//   R_PLANET=92  planet symbols placed here
//   R_INNER=72   inner decorative circle
//
// Angle convention (matching Western chart paper):
//   ASC = 9-o'clock (left, SVG 180°)
//   Zodiac increases CCW on paper → svgAngle = 180 − (L − A) mod 360

function toSvgAngleDeg(L: number, ascLong: number): number {
  return ((180 - (L - ascLong)) % 360 + 360) % 360;
}
function polar(angleDeg: number, r: number, cx=150, cy=150) {
  const rad = angleDeg * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function BirthChartWestern({ chart }: { chart: ChartData }) {
  const CX = 150, CY = 150;
  const R_OUTER  = 137;
  const R_OUTER2 = 130; // inner line of double border
  const R_SIGN   = 113; // inner edge of sign ring
  const R_PLANET = 91;  // planet orbit
  const R_INNER  = 68;  // inner decorative ring
  const R_CORE   = 50;  // center label circle

  const ascLong = ((chart.ascendant % 360) + 360) % 360;
  const ascSign = SIGNS[Math.floor(ascLong / 30)];

  // 12 sign sector dividers — from R_INNER to R_OUTER
  const dividers = SIGNS.map((_, k) => {
    const angle = toSvgAngleDeg(k * 30, ascLong);
    const p1 = polar(angle, R_INNER, CX, CY);
    const p2 = polar(angle, R_OUTER, CX, CY);
    return { angle, p1, p2, key: k };
  });

  // Sign glyphs — midpoint of each sector
  const signLabels = SIGNS.map((sign, k) => {
    const midAngle = toSvgAngleDeg(k * 30 + 15, ascLong);
    const pos = polar(midAngle, (R_SIGN + R_OUTER2) / 2, CX, CY);
    const isAsc = sign === ascSign;
    return { sign, glyph: SIGN_GLYPHS[sign], pos, isAsc };
  });

  // Planets — place at their longitude on R_PLANET, spread clustered planets
  const rawPlanets = Object.entries(chart.planets).map(([key, p]) => {
    const L = ((p.siderealLongitude as number) % 360 + 360) % 360;
    const angle = toSvgAngleDeg(L, ascLong);
    const pos = polar(angle, R_PLANET, CX, CY);
    const sym = PLANET_SYMBOLS[key] ?? '·';
    const color = PLANET_COLORS[(p.name as string)] ?? '#fff';
    return { key, sym, color, pos, angle, name: p.name as string };
  });

  // Spread overlapping planets: sort by angle, push apart if < 14° apart
  const planets = [...rawPlanets].sort((a,b) => a.angle - b.angle);
  for (let i = 0; i < planets.length; i++) {
    const next = planets[(i+1) % planets.length];
    const diff = ((next.angle - planets[i].angle) + 360) % 360;
    if (diff < 14 && diff > 0) {
      const mid = planets[i].angle + diff / 2;
      planets[i].angle = mid - 7;
      next.angle = mid + 7;
      planets[i].pos = polar(planets[i].angle, R_PLANET, CX, CY);
      next.pos       = polar(next.angle,       R_PLANET, CX, CY);
    }
  }

  // ASC and DSC axis points
  const ascPt = polar(180, R_OUTER + 3, CX, CY);
  const dscPt = polar(0,   R_OUTER + 3, CX, CY);
  const mcPt  = polar(270, R_OUTER + 3, CX, CY);
  const icPt  = polar(90,  R_OUTER + 3, CX, CY);

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full" style={{ overflow:'visible' }}>
      {/* ── Outer decorative rings (double border) ── */}
      <circle cx={CX} cy={CY} r={R_OUTER}  fill="none" stroke="#C1A661" strokeWidth="1.6" strokeOpacity="0.42" />
      <circle cx={CX} cy={CY} r={R_OUTER2} fill="none" stroke="#C1A661" strokeWidth="0.7" strokeOpacity="0.18" />

      {/* Sign ring — no fill, backgroundless */}
      <circle cx={CX} cy={CY} r={R_SIGN}   fill="none" stroke="#C1A661" strokeWidth="1.2" strokeOpacity="0.30" />

      {/* Inner planet field */}
      <circle cx={CX} cy={CY} r={R_SIGN}   fill="rgba(3,3,3,0.7)" />
      <circle cx={CX} cy={CY} r={R_INNER}  fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.0" />

      {/* Core circle */}
      <circle cx={CX} cy={CY} r={R_CORE}
        fill="#030303"
        stroke="#C1A661" strokeWidth="0.6" strokeOpacity="0.22"
        strokeDasharray="3 4"
      />

      {/* Decorative inner spinning ring (dashed) */}
      <circle cx={CX} cy={CY} r={R_CORE - 8}
        fill="none" stroke="#C1A661" strokeWidth="0.4" strokeOpacity="0.10"
        strokeDasharray="1 5"
      />

      {/* ── 12 Sign sector dividers ── */}
      {dividers.map(({ p1, p2, key }) => (
        <line
          key={key}
          x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          stroke="#C1A661" strokeWidth="1.4" strokeOpacity="0.38"
        />
      ))}

      {/* ── Sign glyphs in outer ring ── */}
      {signLabels.map(({ sign, glyph, pos, isAsc }) => (
        <text
          key={sign}
          x={pos.x} y={pos.y + 4.5}
          textAnchor="middle"
          fontSize="12"
          fill={isAsc ? '#C1A661' : 'rgba(255,255,255,0.38)'}
          fillOpacity={isAsc ? 0.85 : 1}
          fontFamily="serif"
        >
          {glyph}
        </text>
      ))}

      {/* ── ASC / DSC / MC / IC axis lines ── */}
      {/* Horizontal ASC–DSC */}
      <line
        x1={polar(180, R_INNER, CX, CY).x} y1={polar(180, R_INNER, CX, CY).y}
        x2={polar(0,   R_INNER, CX, CY).x} y2={polar(0,   R_INNER, CX, CY).y}
        stroke="#C1A661" strokeWidth="1.2" strokeOpacity="0.30" strokeDasharray="4 3"
      />
      {/* Vertical MC–IC */}
      <line
        x1={polar(270, R_INNER, CX, CY).x} y1={polar(270, R_INNER, CX, CY).y}
        x2={polar(90,  R_INNER, CX, CY).x} y2={polar(90,  R_INNER, CX, CY).y}
        stroke="rgba(255,255,255,0.18)" strokeWidth="1.0" strokeDasharray="3 4"
      />

      {/* ASC marker (bold tick + label outside ring) */}
      <line
        x1={polar(180, R_OUTER, CX, CY).x}  y1={polar(180, R_OUTER, CX, CY).y}
        x2={polar(180, R_OUTER + 7, CX, CY).x} y2={polar(180, R_OUTER + 7, CX, CY).y}
        stroke="#C1A661" strokeWidth="2" strokeOpacity="0.8"
      />
      <text x={ascPt.x - 3} y={ascPt.y + 4} textAnchor="end"
        fontSize="7" fill="#C1A661" fillOpacity="0.75" fontFamily="monospace" fontWeight="bold">
        ASC
      </text>

      {/* DSC small tick */}
      <line
        x1={polar(0, R_OUTER, CX, CY).x}      y1={polar(0, R_OUTER, CX, CY).y}
        x2={polar(0, R_OUTER + 5, CX, CY).x}  y2={polar(0, R_OUTER + 5, CX, CY).y}
        stroke="rgba(255,255,255,0.2)" strokeWidth="1"
      />
      <text x={dscPt.x + 3} y={dscPt.y + 4} textAnchor="start"
        fontSize="7" fill="rgba(255,255,255,0.3)" fontFamily="monospace">
        DSC
      </text>

      {/* MC / IC labels */}
      <text x={mcPt.x} y={mcPt.y - 3} textAnchor="middle"
        fontSize="7" fill="rgba(255,255,255,0.20)" fontFamily="monospace">MC</text>
      <text x={icPt.x} y={icPt.y + 9} textAnchor="middle"
        fontSize="7" fill="rgba(255,255,255,0.20)" fontFamily="monospace">IC</text>

      {/* ── Planet symbols ── */}
      {planets.map(({ key, sym, color, pos }) => (
        <text
          key={key}
          x={pos.x} y={pos.y + 6}
          textAnchor="middle"
          fontSize="17"
          fill={color}
          fontFamily="serif"
          style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
        >
          {sym}
        </text>
      ))}

      {/* ── Center label ── */}
      <text x={CX} y={CY - 10} textAnchor="middle"
        fontSize="8" fill="rgba(255,255,255,0.28)" fontFamily="monospace" letterSpacing="2">
        RISING
      </text>
      <text x={CX} y={CY + 5} textAnchor="middle"
        fontSize="16" fill="#C1A661" fillOpacity="0.88" fontFamily="serif">
        {ascSign}
      </text>
      <text x={CX} y={CY + 18} textAnchor="middle"
        fontSize="9" fill="rgba(255,255,255,0.32)" fontFamily="monospace">
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
      {/* Pulse dot */}
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
      <span className="text-[14px] leading-none flex-shrink-0" style={{color:pColor}}>{sym}</span>
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
interface SlideChartProps {
  name: string;
  chart: ChartData;
  dob: string;
  locationName: string;
  recordStep?: number;
  avatarUrl?: string;
}

export function SlideChart({ name, chart, dob, locationName, recordStep, avatarUrl }: SlideChartProps) {
  const ascSign = SIGNS[Math.floor((chart.ascendant%360)/30)];
  const moonLong = chart.planets['moon']?.siderealLongitude??0;
  const nakshatraIdx = Math.floor(moonLong/(360/27));
  const nakshatra = NAKSHATRA_NAMES[nakshatraIdx]??'—';

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
    // Rahu (North Node) and Ketu (South Node) — always Neutral dignity, appended last
    const rahu = chart.planets['rahu'];
    const ketu = chart.planets['ketu'];
    if (rahu) regular.push({ key:'rahu', name:'Rahu', sign:rahu.sign, status:'Neutral', deg:rahu.siderealLongitude%30, order:4, node:'North Node ☊' });
    if (ketu) regular.push({ key:'ketu', name:'Ketu', sign:ketu.sign, status:'Neutral', deg:ketu.siderealLongitude%30, order:4, node:'South Node ☋' });
    return regular;
  }, [chart]);

  const rec = recordStep != null;
  // Step 0: header visible, Step 1: chart scale-in, Steps 2..2+planetCount-1: planet rows

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030303] overflow-hidden">
      {!rec && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[180px] rounded-full bg-[#C1A661]/[0.05] blur-[80px] pointer-events-none" />}

      {/* Header row: avatar + name + labels */}
      <div className="relative z-10 pt-2 px-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C1A661]/30 bg-[#111] flex-shrink-0">
          <img src={avatarUrl || AVATAR_URL} alt={name} className="w-full h-full object-contain object-top scale-110" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[14px] text-white/80 leading-none truncate">{name}</p>
          <p className="font-mono text-[9px] text-white/25 mt-0.5 truncate">{dob} · {locationName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-[9px] text-[#C1A661]/60 uppercase tracking-[0.25em] leading-none">Birth Chart</p>
          <p className="font-mono text-[8px] text-white/20 mt-0.5">Western · Tropical</p>
        </div>
      </div>

      {/* Chart */}
      <motion.div
        initial={rec ? false : { opacity:0, scale:0.93 }}
        animate={{ opacity: !rec || recordStep! >= 1 ? 1 : 0, scale: !rec || recordStep! >= 1 ? 1 : 0.93 }}
        transition={rec ? { duration:0 } : { duration:0.7, ease:[0.22,1,0.36,1] }}
        className="relative z-10 px-3 w-full" style={{ height: 220 }}
      >
        <BirthChartWestern chart={chart} />
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
export const CHART_RECORD_STEPS = 11;
export function chartRecordConfig() {
  return {
    total: CHART_RECORD_STEPS,
    holdFrames(step: number): number {
      if (step === 0) return 6;    // header settle
      if (step === 1) return 10;   // chart scale-in 0.7s, hold until first planet delay 0.4s
      return 2;                    // planet rows stagger 0.06s ≈ 2 frames
    },
  };
}
