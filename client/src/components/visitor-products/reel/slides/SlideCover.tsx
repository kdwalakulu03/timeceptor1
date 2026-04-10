import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Lock } from 'lucide-react';
import type { ChartData } from '../../../../lib/astrology';

const AVATAR_URL = '/ProfileUnavailable.jpg';

const SERVICES = [
  { label: 'Yoga',     icon: '🧘', id: 'yoga'    },
  { label: 'Fitness',  icon: '🏋️', id: 'health'  },
  { label: 'Business', icon: '💼', id: 'business' },
  { label: 'Creative', icon: '✍️', id: 'creative' },
  { label: 'Love',     icon: '♥',  id: 'love'    },
];
const FINAL_SERVICE = 1; // Fitness

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];
const SIGN_GLYPHS: Record<string, string> = {
  Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
  Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓',
};

function useTypewriter(text: string, startDelay = 0, speed = 60) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const id = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) { clearInterval(id); setDone(true); }
      }, speed);
      return () => clearInterval(id);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, startDelay, speed]);
  return { displayed, done };
}

function Cursor({ active }: { active: boolean }) {
  return (
    <motion.span
      className="inline-block w-[2px] h-[0.85em] bg-[#C1A661] ml-[2px] align-middle rounded-full"
      animate={{ opacity: active ? [1, 0, 1] : 0 }}
      transition={{ duration: 0.75, repeat: Infinity }}
    />
  );
}

function LocationPin({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          initial={{ y: -14, opacity: 0, scale: 1.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 16 }}
          className="inline-block mr-1"
        >
          📍
        </motion.span>
      )}
    </AnimatePresence>
  );
}

interface SlideCoverProps {
  name: string;
  dob: string;
  tob: string;
  locationName: string;
  chart: ChartData;
  onViewBlueprint?: (includeExclusives: boolean) => void;
  recordStep?: number;
  avatarUrl?: string;
}

type Phase = 'name' | 'fields' | 'service' | 'cta';

export function SlideCover({ name, dob, tob, locationName, chart, onViewBlueprint, recordStep, avatarUrl }: SlideCoverProps) {
  const [phase, setPhase]                   = useState<Phase>('name');
  const [serviceIdx, setServiceIdx]         = useState(0);
  const [serviceLocked, setServiceLocked]   = useState(false);
  const [exclusive, setExclusive]           = useState(false);
  const [exclusiveChips, setExclusiveChips] = useState(false);
  const [showCta, setShowCta]               = useState(false);
  const [ctaPressed, setCtaPressed]         = useState(false);

  const nameDur = name.length * 65 + 400;
  const locDur  = locationName.length * 42 + 500;

  const nameTyper = useTypewriter(name,         300,          65);
  const locTyper  = useTypewriter(locationName, nameDur + 600, 42);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fields'),  nameDur + 100);
    const t2 = setTimeout(() => setPhase('service'), nameDur + locDur + 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [nameDur, locDur]);

  // Cycle through services then lock on Fitness
  // Sequence: Yoga(0)→Fitness(1)→Business(2)→Creative(3)→Love(4)→Yoga(0)→Fitness(1) = STOP
  useEffect(() => {
    if (phase !== 'service' || serviceLocked) return;
    let count = 0;
    const id = setInterval(() => {
      count++;
      const next = count % SERVICES.length;
      setServiceIdx(next);
      // Lock on second time we land on FINAL_SERVICE (Fitness)
      if (next === FINAL_SERVICE && count > FINAL_SERVICE) {
        clearInterval(id);
        setServiceLocked(true);
      }
    }, 420);
    return () => clearInterval(id);
  }, [phase, serviceLocked]);

  // After service locks: phase→cta, then exclusive toggle flips ON, then CTA appears
  useEffect(() => {
    if (!serviceLocked) return;
    const t1 = setTimeout(() => setPhase('cta'),       400);
    const t2 = setTimeout(() => setExclusive(true),     900);
    const t3 = setTimeout(() => setExclusiveChips(true),1300);
    const t4 = setTimeout(() => setShowCta(true),       1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [serviceLocked]);

  const ascSign   = SIGNS[Math.floor((chart.ascendant % 360) / 30)];
  const maskedTob  = tob.replace(/\d/g, '•');

  const showFields  = phase !== 'name';
  const showService = phase === 'service' || phase === 'cta';

  /* ── recording-mode overrides ── */
  const rec = recordStep != null;
  const noAnim = { duration: 0 };

  // Dynamic step layout (typewriter char-by-char):
  // 0          → BG only
  // 1          → Avatar
  // 2..1+N     → Name typewriter (N = name.length)
  // 2+N        → Rising badge
  // 3+N        → Birth fields
  // 4+N..3+N+L → Location typewriter (L = locationName.length)
  // 4+N+L      → Service block
  // 5+N+L      → Service cycling
  // 6+N+L      → Service locked
  // 7+N+L      → Exclusive ON
  // 8+N+L      → Chips lit
  // 9+N+L      → CTA
  const N = name.length;
  const L = locationName.length;

  const nameChars   = rec ? Math.max(0, Math.min(N, recordStep! - 1)) : -1;
  const eName       = rec ? name.slice(0, nameChars) : nameTyper.displayed;
  const eNameDone   = rec ? recordStep! > 1 + N : nameTyper.done;
  const eBadge      = rec ? recordStep! >= 2 + N : true; // badge always visible in live mode after animation
  const eShowFields = rec ? recordStep! >= 3 + N : showFields;

  const locChars    = rec ? Math.max(0, Math.min(L, recordStep! - 3 - N)) : -1;
  const eLoc        = rec ? locationName.slice(0, locChars) : locTyper.displayed;
  const eLocDone    = rec ? recordStep! > 3 + N + L : locTyper.done;
  const eLocPin     = rec ? locChars > 0 : locTyper.displayed.length > 0;

  // Service cycling: step-by-step through each service chip, matching real 420ms interval
  // Cycle: Yoga(0)→Fitness(1)→Business(2)→Creative(3)→Love(4)→Yoga(0)→Fitness(1)=LOCK
  const svcStart = 4 + N + L;
  const CYCLE_SEQ = [0, 1, 2, 3, 4, 0, 1];
  const svcOff = rec ? Math.max(0, recordStep! - svcStart) : 0;

  const eShowService   = rec ? recordStep! >= svcStart : showService;
  const eServiceIdx    = rec
    ? (recordStep! >= svcStart ? (CYCLE_SEQ[Math.min(svcOff, 6)] ?? FINAL_SERVICE) : 0)
    : serviceIdx;
  const eServiceLocked = rec ? recordStep! >= svcStart + 6 : serviceLocked;
  const eExclusive     = rec ? recordStep! >= svcStart + 7 : exclusive;
  const eChipsLit      = rec ? recordStep! >= svcStart + 8 : exclusive;
  const eShowCta       = rec ? recordStep! >= svcStart + 9 : showCta;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030303] overflow-hidden select-none">

      {/* Glows — hidden in recording mode (blur causes distortion in html-to-image) */}
      {!rec && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[280px] h-[200px] rounded-full bg-[#C1A661]/[0.07] blur-[90px]" />
          <div className="absolute bottom-[8%] right-[-8%] w-[200px] h-[200px] rounded-full bg-[#3050DD]/[0.05] blur-[70px]" />
        </div>
      )}

      {/* Stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
        {[...Array(38)].map((_, i) => (
          <circle key={i}
            cx={`${(i * 137.508) % 100}%`} cy={`${(i * 97.318) % 100}%`}
            r={i % 6 === 0 ? 1.3 : 0.55}
            fill={i % 7 === 0 ? '#C1A661' : '#fff'}
            opacity={0.18 + (i % 4) * 0.14}
          />
        ))}
      </svg>

      {/* Top bar — Cosmic Blueprint centred */}
      <div className="relative z-10 pt-0 px-5 flex justify-center items-center">
        <span className="font-mono text-[12px] uppercase tracking-[0.32em] text-[#C1A661]/60">
          Cosmic Blueprint
        </span>
      </div>

      {/* Avatar */}
      <div className="relative z-10 flex justify-center mt-4 mb-1">
        {!rec && <div className="absolute w-[100px] h-[100px] rounded-full border border-[#C1A661]/[0.14] animate-[spin_20s_linear_infinite]" />}

        <motion.div
          initial={rec ? false : { scale: 0.55, opacity: 0 }}
          animate={{ scale: 1, opacity: !rec || recordStep! >= 1 ? 1 : 0 }}
          transition={rec ? noAnim : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`w-[90px] h-[90px] rounded-full overflow-hidden border-2 border-[#C1A661]/30 relative bg-[#111010] ${rec ? '' : 'shadow-[0_0_32px_rgba(193,166,97,0.16)]'}`}
        >
          <img src={avatarUrl || AVATAR_URL} alt={name} className="w-full h-full object-contain object-top scale-110" />
        </motion.div>

        {/* Rising sign badge */}
        <motion.div
          initial={rec ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: !rec || recordStep! >= 2 + N ? 1 : 0, scale: !rec || recordStep! >= 2 + N ? 1 : 0 }}
          transition={rec ? noAnim : { delay: 0.6, type: 'spring', stiffness: 280, damping: 16 }}
          className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-[3px] rounded-full border border-[#C1A661]/25 bg-[#030303]/95 whitespace-nowrap"
        >
          <span className="text-[#C1A661] text-[12px]">{SIGN_GLYPHS[ascSign]}</span>
          <span className="font-mono text-[9px] text-[#C1A661]/80 uppercase tracking-wider">{ascSign} Rising</span>
        </motion.div>
      </div>

      {/* Name */}
      <div className="relative z-10 text-center px-5 mt-3">
        <h1 className={`font-serif text-[24px] tracking-wide min-h-[2rem] leading-tight ${rec ? 'text-white' : 'text-white/88'}`}>
          {eName}
          <Cursor active={!eNameDone && !rec} />
        </h1>
      </div>

      {/* Birth fields */}
      <AnimatePresence>
        {eShowFields && (
          <motion.div
            initial={rec ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={rec ? noAnim : { duration: 0.4 }}
            className="relative z-10 mx-5 mt-3 rounded-2xl border border-white/[0.09] bg-white/[0.028] px-4 py-3 space-y-2.5"
          >
            {/* DOB */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#C1A661]/55 w-14 flex-shrink-0">DOB</span>
              <span className="font-mono text-[16px] text-white/82 font-medium">{dob}</span>
            </div>
            {/* Time — blurred */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#C1A661]/55 w-14 flex-shrink-0">Time</span>
              <span
                className={`font-mono text-[16px] tracking-[0.45em] text-white/55 ${rec ? '' : 'blur-[5px] hover:blur-none'} transition-[filter] duration-500 cursor-default`}
                title="Hover to reveal"
              >
                {maskedTob}
              </span>
              <Lock size={12} className="text-white/22 ml-1 flex-shrink-0" />
            </div>
            {/* Location — animated */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] uppercase tracking-widest text-[#C1A661]/55 w-14 flex-shrink-0">Place</span>
              <div className="flex items-center min-h-[1.4em]">
                <LocationPin visible={eLocPin} />
                <span className="font-mono text-[15px] text-white/78">
                  {eLoc}
                  {!eLocDone && eShowFields && !rec && <Cursor active />}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service selector + Exclusives + CTA — all in one block, visible from service phase */}
      <AnimatePresence>
        {eShowService && (
          <motion.div
            initial={rec ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={rec ? noAnim : { duration: 0.35 }}
            className="relative z-10 px-5 mt-3 space-y-3"
          >
            {/* Service chips */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C1A661]/45 mb-2">Select Practice</p>
              <div className="flex gap-1.5">
                {SERVICES.map((s, i) => {
                  const isActive = i === eServiceIdx;
                  return (
                    <motion.div
                      key={s.id}
                      animate={{
                        borderColor: isActive ? 'rgba(193,166,97,0.6)'  : 'rgba(255,255,255,0.07)',
                        background:  isActive ? 'rgba(193,166,97,0.12)' : 'rgba(255,255,255,0.02)',
                        scale:       isActive ? 1.08 : 1,
                      }}
                      transition={rec ? noAnim : { duration: 0.18 }}
                      className="flex-1 flex flex-col items-center py-2 rounded-2xl border cursor-pointer"
                    >
                      <span className="text-[17px] leading-none">{s.icon}</span>
                      <span
                        className="font-mono text-[10px] uppercase tracking-wide mt-1 font-medium"
                        style={{ color: isActive ? '#C1A661' : 'rgba(255,255,255,0.28)' }}
                      >
                        {s.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              <AnimatePresence>
                {eServiceLocked && (
                  <motion.p
                    initial={rec ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={rec ? noAnim : { duration: 0.3 }}
                    className="font-mono text-[11px] text-[#C1A661]/70 mt-2 text-center uppercase tracking-[0.22em] font-medium"
                  >
                    ▸ Optimised for {SERVICES[FINAL_SERVICE].label}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Exclusive toggle — always visible, auto-flips ON when service locks */}
            <button
              onClick={() => setExclusive(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border
                         transition-all duration-300 ${
                eExclusive
                  ? 'border-[#C1A661]/45 bg-[#C1A661]/[0.09]'
                  : 'border-white/[0.09] bg-white/[0.025]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={14} className={eExclusive ? 'text-[#C1A661]' : 'text-white/25'} />
                <span
                  className="font-mono text-[12px] uppercase tracking-wider font-medium"
                  style={{ color: eExclusive ? '#C1A661' : 'rgba(255,255,255,0.30)' }}
                >
                  Include Timeceptor Exclusives
                </span>
              </div>
              <div className={`relative w-9 h-[18px] rounded-full transition-colors duration-300 ${
                eExclusive ? 'bg-[#C1A661]/75' : 'bg-white/10'
              }`}>
                <motion.div
                  animate={{ x: eExclusive ? 19 : 2 }}
                  transition={rec ? noAnim : { type: 'spring', stiffness: 380, damping: 22 }}
                  className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-md"
                />
              </div>
            </button>

            {/* 4 exclusive feature chips — ALWAYS shown, dim until exclusive ON */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '✦', label: 'Golden Hour',    sub: '7-day window'   },
                { icon: '◈', label: 'SWOT Analysis',  sub: 'Cosmic DNA'     },
                { icon: '⏳', label: 'Wait or Do Now', sub: 'Timing engine'  },
                { icon: '🔮', label: 'Life Prediction',sub: 'Dasha forecast' },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  animate={{
                    borderColor: eChipsLit ? 'rgba(193,166,97,0.35)' : 'rgba(255,255,255,0.07)',
                    background:  eChipsLit ? 'rgba(193,166,97,0.08)' : 'rgba(255,255,255,0.02)',
                    scale:       eChipsLit ? 1 : 0.97,
                  }}
                  transition={rec ? noAnim : { delay: eChipsLit ? i * 0.08 : 0, duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border"
                >
                  <motion.span
                    animate={{ color: eChipsLit ? '#C1A661' : 'rgba(255,255,255,0.2)' }}
                    transition={rec ? noAnim : { duration: 0.3 }}
                    className="text-[15px] leading-none flex-shrink-0"
                  >
                    {f.icon}
                  </motion.span>
                  <div className="min-w-0">
                    <p
                      className="font-mono text-[11px] uppercase tracking-wide leading-none font-semibold truncate transition-colors duration-300"
                      style={{ color: eChipsLit ? 'rgba(193,166,97,0.9)' : 'rgba(255,255,255,0.22)' }}
                    >
                      {f.label}
                    </p>
                    <p
                      className="font-mono text-[9px] mt-1 transition-colors duration-300"
                      style={{ color: eChipsLit ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.15)' }}
                    >
                      {f.sub}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main CTA — appears after exclusive auto-activates */}
            <AnimatePresence>
              {eShowCta && (
                <motion.button
                  initial={rec ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={rec ? noAnim : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setCtaPressed(true); onViewBlueprint?.(exclusive); }}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                             font-mono text-[13px] uppercase tracking-[0.22em] font-bold
                             transition-all duration-300 ${
                    ctaPressed
                      ? 'bg-[#C1A661]/20 border border-[#C1A661]/30 text-[#C1A661]/60'
                      : `bg-[#C1A661] text-[#030303] ${rec ? '' : 'shadow-[0_0_32px_rgba(193,166,97,0.40)]'}`
                  }`}
                >
                  {ctaPressed ? 'Opening Blueprint…' : 'View My Cosmic Blueprint'}
                  {!ctaPressed && <ChevronRight size={16} />}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      <div className="relative z-10 pb-5 pt-3 flex items-center justify-center opacity-15 mt-auto">
        <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#C1A661]/60 mr-2" />
        <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#C1A661]">Timeceptor</span>
        <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#C1A661]/60 ml-2" />
      </div>

    </div>
  );
}

/** Recording-step config for ReelGenerator — timing derived from real animation values */
export function coverRecordConfig(nameLen: number, locLen: number) {
  // Steps: 0=BG, 1=avatar, 2..1+N=name, 2+N=badge, 3+N=fields,
  //        4+N..3+N+L=location, svc+0..5=cycling, svc+6=locked,
  //        svc+7=exclusive, svc+8=chips, svc+9=CTA
  const svc = 4 + nameLen + locLen;
  const total = svc + 10; // = 14 + nameLen + locLen
  return {
    total,
    holdFrames(step: number): number {
      // Name typewriter (speed 65ms → ~2 frames @24fps)
      if (step >= 2 && step <= 1 + nameLen) return 2;
      // Location typewriter (speed 42ms → ~1 frame, use 2)
      if (step >= 4 + nameLen && step <= 3 + nameLen + locLen) return 2;
      if (step === 0) return 4;                  // BG settle
      if (step === 1) return 17;                 // avatar scale-in 0.7s
      if (step === 2 + nameLen) return 7;         // badge spring ~0.3s
      if (step === 3 + nameLen) return 10;        // fields slide 0.4s
      // Service cycling (420ms each → 10 frames)
      if (step >= svc && step <= svc + 5) return 10;
      if (step === svc + 6) return 10;           // locked + "Optimised" 400ms
      if (step === svc + 7) return 12;           // exclusive toggle ON 500ms
      if (step === svc + 8) return 10;           // chips light up 400ms
      if (step === svc + 9) return 48;           // CTA appear — hold ~2s so viewers can read it
      return 6;
    },
  };
}
