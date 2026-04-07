import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, ChevronLeft, ChevronRight, Sparkles, Bell, TrendingUp, AlertTriangle, CheckCircle2, User, MapPin, Calendar, Clock, Database, Cpu, Activity, Orbit, Globe2, Mail, Send, LayoutDashboard } from 'lucide-react';

/* ── CONSTANTS & DATA ─────────────────────────────────────────────────── */

const PHASES = [
  { label: 'DISCOVER', duration: 12 },
  { label: 'YOUR INFO', duration: 8 },
  { label: 'THE ASTROLOGY', duration: 10 },
  { label: 'THE MATH', duration: 10 },
  { label: 'RESULTS', duration: 12 },
  { label: 'ALERTS', duration: 8 }
];
const TOTAL_DUR = PHASES.reduce((acc, p) => acc + p.duration, 0);

const HOOKS = [
  { emoji: '🧘', text: 'Did your morning yoga leave you more tired than refreshed?' },
  { emoji: '📈', text: 'Made a business call at 2 PM and the deal slipped away?' },
  { emoji: '🧠', text: 'Tried to meditate but your mind kept racing?' },
  { emoji: '🎨', text: 'Sat down to create something but the flow just never came?' }
];

/* ── PROGRESS & CONTROLS ──────────────────────────────────────────────── */

function ProgressBar({ phase, progress, setPhase, togglePause, isPaused }: any) {
  return (
    <div className="absolute top-0 left-0 w-full z-20 px-4 sm:px-8 pt-4 sm:pt-6 pb-4 bg-gradient-to-b from-space-bg via-space-bg/80 to-transparent">
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <button onClick={togglePause} className="text-cream-dim hover:text-gold transition-colors mr-2">
          {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
        </button>

        {PHASES.map((p, i) => {
          const isActive = i === phase;
          const isPast = i < phase;
          let w = '0%';
          if (isPast) w = '100%';
          if (isActive) w = `${Math.min(100, Math.max(0, progress * 100))}%`;

          return (
            <div
              key={p.label}
              onClick={() => setPhase(i)}
              className="flex-1 group cursor-pointer"
            >
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1 relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gold rounded-full transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(212,168,75,0.6)]"
                  style={{ width: w }}
                />
              </div>
              <div className={`mt-2 text-[10px] font-mono tracking-widest font-bold uppercase transition-colors hidden sm:block ${isActive ? 'text-gold' : 'text-cream-dim/50 group-hover:text-cream-dim'}`}>
                {p.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── SLIDE 1: HOOKS ─────────────────────────────────────────────────── */

function SlideOneHooks({ progress }: { progress: number }) {
  const hookIdx = Math.floor(progress * 4 * Math.max(0, 0.9999));
  const hook = HOOKS[Math.min(hookIdx, HOOKS.length - 1)];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-12">
      <motion.div 
        key="sub"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-mono text-xs sm:text-sm tracking-widest uppercase text-gold font-bold mb-8 flex items-center gap-2"
      >
        <Sparkles size={16} /> Generic timings don't work
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={hookIdx}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="text-5xl sm:text-7xl mb-6">{hook.emoji}</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold text-cream leading-tight shadow-gold/20 drop-shadow-lg">
            {hook.text.split(" ").map((word, i) => (
              <motion.span 
                key={`${hookIdx}-${i}`} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="inline-block mr-2 sm:mr-3"
              >
                {word}
              </motion.span>
            ))}
          </h2>
        </motion.div>
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-cream-dim/60 font-body text-base sm:text-lg text-center max-w-lg"
      >
        Your body isn't a clock. It's an energetic system governed by planetary hours. We just need to find them.
      </motion.p>
    </div>
  );
}

/* ── SLIDE 2: INPUT ────────────────────────────────────────────── */

function SlideTwoInput({ progress }: { progress: number }) {
  const typeText = (text: string, start: number, end: number) => {
    if (progress < start) return "";
    if (progress > end) return text;
    const p = (progress - start) / (end - start);
    return text.slice(0, Math.floor(p * text.length));
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center p-6 lg:p-12">
      <motion.h3 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="font-mono text-sm tracking-widest uppercase text-gold font-bold mb-8"
      >
        Step 1: Your Context
      </motion.h3>

      <div className="flex flex-col md:flex-row w-full max-w-4xl gap-6">
        {/* Left: Category Selection */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
          <h4 className="text-cream font-bold mb-4 flex items-center gap-2"><User size={18} className="text-gold"/> Select Your Focus</h4>
          <div className="grid grid-cols-2 gap-3">
            {['Business Call', 'Gym Session', 'Deep Work', 'Meditation'].map((cat, i) => (
              <motion.div 
                key={cat}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i*0.1 }}
                className={`p-3 rounded-lg border text-sm flex items-center justify-between
                  ${progress > 0.2 && i === 1 ? 'bg-gold/20 border-gold/50 text-gold' : 'border-white/10 text-cream-dim'}`}
              >
                <span>{cat}</span>
                {progress > 0.2 && i === 1 && <CheckCircle2 size={16} />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: DoB Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-center"
        >
          <h4 className="text-cream font-bold mb-4 flex items-center gap-2"><Calendar size={18} className="text-gold"/> Birth Details</h4>
          
          <div className="space-y-4">
            <div className="bg-space-bg border border-white/10 rounded-lg p-3 flex items-center gap-3">
              <MapPin size={16} className="text-cream-dim shrink-0" />
              <span className="text-cream font-mono">
                {typeText("Sydney, Australia", 0.35, 0.55)}
                {progress >= 0.30 && progress < 0.65 && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1.5 h-4 bg-gold inline-block ml-1 align-middle" />}
              </span>
            </div>
            
            <div className="bg-space-bg border border-white/10 rounded-lg p-3 flex items-center gap-3">
              <Clock size={16} className="text-cream-dim shrink-0" />
              <span className="text-cream font-mono">
                {typeText("14:30 PM", 0.65, 0.85)}
                {progress >= 0.60 && progress < 0.95 && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1.5 h-4 bg-gold inline-block ml-1 align-middle" />}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── SLIDE 3: SCIENCE (Astrology) ────────────────────────────────────── */

// Pre-computed deterministic "random" bar heights for each scan step (no Math.random in render)
const SCAN_FRAMES_TOP = (() => {
  const frames: number[][] = [];
  let seed = 42;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed % 100); };
  for (let f = 0; f < 20; f++) {
    const row: number[] = [];
    for (let i = 0; i < 12; i++) row.push(15 + (rand() % 65));
    frames.push(row);
  }
  return frames;
})();
const SCAN_FRAMES_BTM = (() => {
  const frames: number[][] = [];
  let seed = 137;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed % 100); };
  for (let f = 0; f < 20; f++) {
    const row: number[] = [];
    for (let i = 0; i < 12; i++) row.push(15 + (rand() % 65));
    frames.push(row);
  }
  return frames;
})();

// The target waveform shape: top wave and its inverse counterpart
const WAVE_SHAPE = [25, 45, 70, 90, 95, 80, 50, 30, 60, 85, 75, 40];
const WAVE_INVERSE = WAVE_SHAPE.map(v => 100 - v);

function SlideThreeScience({ progress }: { progress: number }) {
  const isTuning = progress < 0.55;
  const isConverging = progress >= 0.55 && progress < 0.75;
  const isMatched = progress >= 0.75;

  // During tuning, cycle through pre-computed scan frames
  const frameIdx = Math.floor(progress * 40) % SCAN_FRAMES_TOP.length;
  
  // Convergence: blend from random toward the match shape
  const blendFactor = isConverging ? (progress - 0.55) / 0.2 : isMatched ? 1 : 0;

  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center p-4 sm:p-6 text-center overflow-hidden">
      <motion.h3 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="font-mono text-xs sm:text-sm tracking-widest uppercase text-gold font-bold mb-3 sm:mb-5 z-10"
      >
        Step 2: Frequency Tuning
      </motion.h3>
      
      <p className="text-cream-dim max-w-lg mx-auto mb-6 sm:mb-8 z-10 text-[11px] sm:text-sm">
        We scan transit frequencies against your natal blueprint — when the wave and its inverse perfectly compensate, resonance is found.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr] gap-4 sm:gap-6 w-full max-w-4xl items-center">
        
        {/* LEFT: 2D Orbit (restored) */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto flex items-center justify-center">
          <motion.div className="absolute z-10 text-gold">
            <Globe2 size={28} strokeWidth={1} />
          </motion.div>
          <motion.div 
            animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border border-white/10 border-dashed"
          >
            <div className="absolute -top-2 left-1/2 -ml-2 text-gold"><Orbit size={12} /></div>
            <div className="absolute bottom-3 right-1 text-cream-dim text-[10px]">☽</div>
          </motion.div>
          <motion.div 
            animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-gold/20"
          >
            <div className="absolute top-1/4 -right-1 text-white/50 text-[10px]">♃</div>
            <div className="absolute bottom-1 left-1/4 text-white/50 text-[10px]">☿</div>
          </motion.div>
          <div className="absolute -bottom-5 text-[9px] font-mono text-cream-dim/40 tracking-widest">NATAL</div>
        </div>

        {/* MIDDLE: Mirrored Radio Waveforms */}
        <div className="flex flex-col items-center justify-center relative overflow-hidden" style={{ height: '11rem' }}>
          <div className="absolute top-2 left-0 right-0 w-full">
            {/* Top wave label and border */}
            <div className="text-[9px] font-mono text-cream-dim/50 tracking-widest mb-1 text-center">SIGNAL</div>
            <div className="w-full h-[1px] bg-white/10" />

            {/* Shared overlay area: Container for both wave shapes */}
            <div className="relative h-16 sm:h-20 w-full mt-[1px]">
              
              {/* TOP BARS (fixed): Flat at top, bars hang down */}
              <div className="absolute inset-0 flex items-start justify-center gap-[2px] sm:gap-1 px-1">
                {WAVE_SHAPE.map((val, i) => (
                  <motion.div 
                    key={`top-${i}`}
                    animate={{ 
                      height: `${val}%`,
                      backgroundColor: isMatched ? '#D4A84B' : 'rgba(147,197,153,0.5)',
                      boxShadow: isMatched ? '0 0 6px rgba(212,168,75,0.4)' : 'none'
                    }}
                    transition={{ duration: 0.4 }}
                    className="w-2 sm:w-3 rounded-b-full"
                  />
                ))}
              </div>

              {/* BOTTOM BARS (moves up): Flat at bottom, bars point up */}
              <motion.div 
                className="absolute inset-0 flex items-end justify-center gap-[2px] sm:gap-1 px-1"
                animate={{ y: isMatched ? '0rem' : isConverging ? `${(1 - blendFactor) * 5}rem` : '5rem' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const scanVal = SCAN_FRAMES_BTM[frameIdx][i];
                  const matchVal = WAVE_INVERSE[i];
                  const val = isTuning ? scanVal : Math.round(scanVal * (1 - blendFactor) + matchVal * blendFactor);

                  return (
                    <motion.div 
                      key={`btm-${i}`}
                      animate={{ 
                        height: `${val}%`,
                        backgroundColor: isMatched ? '#D4A84B' : 'rgba(255,255,255,0.15)',
                        boxShadow: isMatched ? '0 0 6px rgba(212,168,75,0.4)' : 'none'
                      }}
                      transition={{ duration: isTuning ? 0.08 : 0.4 }}
                      className="w-2 sm:w-3 rounded-t-full"
                    />
                  );
                })}
              </motion.div>
            </div>
            
            {/* Bottom wave border and label (moves up attached to the bottom bars) */}
            <motion.div
               animate={{ y: isMatched ? '0rem' : isConverging ? `${(1 - blendFactor) * 5}rem` : '5rem' }}
               transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="w-full h-[1px] bg-white/10" />
              <div className="text-[9px] font-mono text-cream-dim/50 tracking-widest mt-1 text-center">INVERSE</div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT: Keyhole Match (restored) */}
        <div className="flex flex-col items-center justify-center relative mx-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 border border-white/10 rounded-full flex items-center justify-center relative overflow-hidden bg-space-card/50">
            {/* Glow ring */}
            <motion.div 
               animate={{ borderColor: isMatched ? 'rgba(212,168,75,0.8)' : 'rgba(255,255,255,0.08)', boxShadow: isMatched ? '0 0 24px rgba(212,168,75,0.5)' : 'none' }}
               className="absolute inset-0 border-2 rounded-full transition-all duration-500"
            />
            {/* Rotating shapes testing → lock open */}
            <motion.div 
               animate={isMatched ? { rotate: 0, scale: 1.2 } : { rotate: progress * 1200 }}
               transition={isMatched ? { type: "spring", bounce: 0.6 } : { duration: 0.1, ease: 'linear' }}
               className={`flex items-center justify-center transition-colors duration-300 ${isMatched ? 'text-gold' : 'text-cream-dim/30'}`}
            >
               {isMatched ? <CheckCircle2 size={32} /> : <div className="w-7 h-7 border-[3px] border-current transform rotate-45" />}
            </motion.div>
          </div>
          <div className="mt-3 text-[9px] sm:text-[10px] font-mono tracking-widest text-center">
            {isMatched 
              ? <span className="text-gold">UNLOCKED</span> 
              : <span className="text-white/30">TESTING...</span>}
          </div>
        </div>

      </div>

      {/* Status */}
      <div className="mt-5 sm:mt-6 text-[10px] sm:text-xs font-mono tracking-widest flex items-center gap-2">
        {isMatched ? (
          <span className="text-gold flex items-center gap-2">
            <CheckCircle2 size={14} /> COUNTERPART FOUND — RESONANCE ACQUIRED
          </span>
        ) : isConverging ? (
          <span className="text-cream-dim/60 flex items-center gap-2">
            <Orbit className="animate-spin" size={14} /> CONVERGING...
          </span>
        ) : (
          <span className="text-white/30 flex items-center gap-2">
            <Activity size={14} /> SCANNING TRANSIT FREQUENCIES...
          </span>
        )}
      </div>
    </div>
  );
}

/* ── SLIDE 4: THE MATH (Scoring) ────────────────────────────────────── */

function SlideFourMath({ progress }: { progress: number }) {
  const isScoring = progress > 0.3;
  const isDone = progress > 0.6;
  return (
    <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
      <motion.h3 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="font-mono text-sm tracking-widest uppercase text-gold font-bold mb-10 text-center"
      >
        Step 3: Algorithmic Scoring
      </motion.h3>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full max-w-3xl justify-center relative">
        
        {/* Data Input Box */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-space-card/80 w-full sm:w-48 p-5 rounded-xl border border-white/10 backdrop-blur-md flex flex-col items-center"
        >
          <Database size={32} className="text-cream-dim mb-3"/>
          <div className="text-xs font-mono text-cream mt-1 text-center">Transit Data<br/>+ Natal Chart</div>
        </motion.div>

        {/* Arrow / Flow */}
        <div className="hidden sm:flex flex-col items-center opacity-50">
          <motion.div 
            animate={{ x: isScoring ? 10 : 0, opacity: isScoring ? 1 : 0.5 }}
            className="text-gold font-bold"
          >→</motion.div>
        </div>

        {/* Compute Engine */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className={`bg-space-card/80 w-full sm:w-56 p-6 rounded-xl border backdrop-blur-md relative overflow-hidden flex flex-col items-center transition-colors duration-500
            ${isScoring ? 'border-gold shadow-[0_0_20px_rgba(212,168,75,0.2)]' : 'border-white/10'}`}
        >
          <Cpu size={40} className={`transition-colors duration-500 ${isScoring ? 'text-gold' : 'text-cream-dim'}`} />
          <div className="text-sm font-bold text-cream mt-4">Timeceptor Engine</div>
          <div className="text-xs text-cream-dim mt-1 text-center">Applying 40+ Rules</div>
          
          <motion.div className="absolute inset-0 bg-gold/10" animate={{ opacity: isScoring ? 0.5 : 0 }} />
        </motion.div>

        {/* Arrow / Flow */}
        <div className="hidden sm:flex flex-col items-center opacity-50">
          <motion.div 
            animate={{ x: isScoring ? 10 : 0, opacity: isScoring ? 1 : 0.5 }}
            className="text-gold font-bold"
          >→</motion.div>
        </div>

        {/* Score Output */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: isDone ? 1 : 0.3, x: 0 }} transition={{ delay: 0.4 }}
          className="bg-space-card/80 w-full sm:w-48 p-5 rounded-xl border border-white/10 backdrop-blur-md flex flex-col items-center relative overflow-hidden"
        >
          <Activity size={32} className={`transition-colors duration-500 ${isDone ? 'text-gold' : 'text-cream-dim'}`} />
          <div className="text-2xl font-mono text-cream font-bold mt-2 relative h-8 w-full flex justify-center items-center">
            <motion.span animate={{ opacity: isDone ? 1 : 0 }} className="absolute">94/100</motion.span>
            <motion.span animate={{ opacity: isDone ? 0 : 1 }} className="absolute">--</motion.span>
          </div>
          <div className="text-[10px] font-mono text-gold mt-1 uppercase">Peak Hour Identified</div>
        </motion.div>

      </div>
    </div>
  );
}


/* ── SLIDE 5: RESULTS (Bento Box) ────────────────────────────────────── */

function SlideFiveResults({ progress }: { progress: number }) {
  // Fake bar chart data
  const bars = [20, 30, 15, 35, 25, 10, 65, 95, 45, 60, 40, 30, 15, 10, 20, 35, 40, 30, 25, 15];
  const tmrwBars = [30, 20, 10, 35, 65, 30, 20, 15, 40, 45, 90, 40, 60, 40, 20, 10, 30, 40, 35, 25];
  
  return (
    <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 lg:p-14">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Left Col: Badges */}
        <div className="flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-gold/10 border border-gold/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 text-7xl opacity-20">☀️</div>
            <div className="text-[10px] sm:text-xs font-mono text-gold font-bold tracking-widest mb-1 flex items-center gap-2">
              <TrendingUp size={14} /> PEAK WINDOW
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-cream mt-1">06:00 AM</div>
            <div className="text-xs sm:text-sm text-cream-dim mt-1">Mars Hora · Score 95</div>
            <div className="hidden sm:block mt-3 text-[10px] font-mono bg-gold/20 text-gold-light inline-block px-2 py-1 rounded-sm">
              PERFECT FOR: GYM
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden"
          >
            <div className="text-[10px] sm:text-xs font-mono text-blue-300 font-bold tracking-widest mb-1 flex items-center gap-2">
              <Sparkles size={14} /> 2ND BEST
            </div>
            <div className="text-xl sm:text-2xl font-display font-bold text-cream mt-1">19:30 PM</div>
            <div className="text-[10px] sm:text-xs text-cream-dim mt-1">Venus Hora · Score 88</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 text-7xl opacity-10">🌑</div>
            <div className="text-[10px] sm:text-xs font-mono text-red-400 font-bold tracking-widest mb-1 flex items-center gap-2">
              <AlertTriangle size={14} /> AVOID
            </div>
            <div className="text-xl sm:text-2xl font-display font-bold text-cream mt-1">14:00 PM</div>
            <div className="text-[10px] sm:text-xs text-cream-dim mt-1">Saturn Hora · Score 12</div>
          </motion.div>
        </div>

        {/* Right Col: Chart */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-[#0d0d16] border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col justify-end relative flex-1 h-48 md:h-auto"
          >
            <div className="absolute top-5 left-5 text-xs sm:text-sm font-bold font-mono tracking-widest text-cream-dim">TODAY'S MAP</div>
            <div className="absolute top-5 right-5 text-[10px] sm:text-xs text-white/30 font-mono tracking-widest">MON MAR 14</div>
            
            <div className="flex items-end justify-between h-28 sm:h-32 gap-1 sm:gap-2 mt-auto border-b border-white/10 pb-2 relative z-10">
              {bars.map((val, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: "0%" }}
                  animate={{ height: `${val}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + (i * 0.03), type: "spring" }}
                  className={`w-full rounded-sm ${val > 80 ? 'bg-gold shadow-[0_0_12px_rgba(212,168,75,0.6)]' : val > 50 ? 'bg-[#20C5A0]' : 'bg-white/10'}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-mono text-cream-dim/50">
              <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="bg-[#0d0d16] border border-white/5 rounded-xl p-4 flex flex-col justify-end relative h-20 sm:h-24"
          >
            <div className="absolute top-3 left-4 text-[10px] font-bold font-mono tracking-widest text-white/40">TOMORROW</div>
            
            <div className="flex items-end justify-between h-8 sm:h-10 gap-1 sm:gap-1.5 mt-auto border-b border-white/5 pb-1 relative z-10">
              {tmrwBars.map((val, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: "0%" }}
                  animate={{ height: `${val}%` }}
                  transition={{ duration: 0.8, delay: 0.7 + (i * 0.03), type: "spring" }}
                  className={`w-full rounded-sm ${val > 80 ? 'bg-gold/60' : val > 50 ? 'bg-[#20C5A0]/60' : 'bg-white/5'}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

/* ── SLIDE 6: ALERTS ─────────────────────────────────────────────────── */

function SlideSixAlerts() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl w-full">
        
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gold/20 text-gold rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Bell className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-semibold text-cream mb-3">
          Never miss your peak.
        </h2>
        <p className="text-cream-dim text-sm sm:text-lg mb-6 sm:mb-10 max-w-2xl mx-auto">
          Get notified before your personalized window opens, or simply log in to check your daily forecast anytime.
        </p>

        {/* Alerting methods grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 justify-center items-stretch w-full mx-auto mt-4 sm:mt-8">
          {/* Telegram Alert */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="bg-[#1c1c28] border border-[#2AABEE]/20 rounded-2xl p-4 sm:p-5 w-full shadow-2xl flex flex-col gap-3 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Send size={80} />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2AABEE] rounded-full flex items-center justify-center shrink-0 text-white shadow-lg shadow-[#2AABEE]/30">
                <Send size={16} className="translate-x-[-1px] translate-y-[1px] sm:w-[18px] sm:h-[18px]" />
              </div>
              <div>
                <span className="font-bold text-cream text-sm sm:text-base block">Telegram Bot</span>
                <span className="text-cream-dim text-[10px] sm:text-xs">Instant Push</span>
              </div>
            </div>
            
            <div className="bg-space-bg/50 rounded-xl p-2.5 sm:p-3 text-cream-dim text-[10px] sm:text-xs leading-snug font-mono border border-white/5 relative z-10 mt-auto">
              <div className="text-white/80 mb-1">🔥 High-energy window starting!</div>
              <div className="text-white/60 mb-1">🕐 06:00 UTC — Mars hora</div>
              <div className="text-white/60 mb-1">📊 Score: 95/100</div>
              <div className="text-gold/80">🎯 Best for: Deep Work</div>
            </div>
          </motion.div>

          {/* Email Alert */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="bg-[#1c1c28] border border-gold/20 rounded-2xl p-4 sm:p-5 w-full shadow-2xl flex flex-col gap-3 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Mail size={80} />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gold rounded-full flex items-center justify-center shrink-0 text-space-bg shadow-lg shadow-gold/30">
                <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div>
                <span className="font-bold text-cream text-sm sm:text-base block">Daily Email</span>
                <span className="text-cream-dim text-[10px] sm:text-xs">Morning Summary</span>
              </div>
            </div>
            
            <div className="bg-space-bg/50 rounded-xl p-2.5 sm:p-3 text-cream-dim text-[10px] sm:text-xs leading-snug font-mono border border-white/5 relative z-10 mt-auto">
              <div className="text-white/80 mb-2 font-sans border-b border-white/10 pb-1.5 sm:pb-2">Subject: Daily Report</div>
              <div className="text-white/60 mb-1 mt-1">Tomorrow's peak times:</div>
              <div className="text-gold flex items-center gap-2"><div className="w-1 h-1 bg-gold rounded-full"></div> 06:00 AM (Score 95)</div>
              <div className="text-[#20C5A0] flex items-center gap-2 mt-1"><div className="w-1 h-1 bg-[#20C5A0] rounded-full"></div> 19:30 PM (Score 88)</div>
            </div>
          </motion.div>

          {/* Web Dashboard */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="bg-[#1c1c28] border border-[#20C5A0]/20 rounded-2xl p-4 sm:p-5 w-full shadow-2xl flex flex-col gap-3 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <LayoutDashboard size={80} />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#20C5A0] rounded-full flex items-center justify-center shrink-0 text-space-bg shadow-lg shadow-[#20C5A0]/30">
                <LayoutDashboard size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div>
                <span className="font-bold text-cream text-sm sm:text-base block">Web App</span>
                <span className="text-cream-dim text-[10px] sm:text-xs">Live Dashboard</span>
              </div>
            </div>
            
            <div className="bg-space-bg/50 rounded-xl p-2.5 sm:p-3 text-cream-dim text-[10px] sm:text-xs leading-snug font-mono border border-white/5 relative z-10 mt-auto flex flex-col gap-2">
              <div className="flex justify-between items-center bg-white/5 rounded px-2 py-1">
                <span className="text-white/60 font-sans">Current Energy</span>
                <span className="text-[#20C5A0] font-bold">82%</span>
              </div>
              <div className="flex items-end gap-1 h-8 mt-1 border-b border-white/10 pb-1">
                <div className="w-full bg-white/20 h-[30%]"></div>
                <div className="w-full bg-[#20C5A0] h-[82%]"></div>
                <div className="w-full bg-white/20 h-[40%]"></div>
                <div className="w-full bg-white/20 h-[50%]"></div>
                <div className="w-full bg-gold h-[95%]"></div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="mt-8 sm:mt-12"
        >
          <a
            href="/app"
            className="inline-block px-6 py-3 sm:px-8 sm:py-4 bg-gold text-space-bg font-bold uppercase tracking-widest text-xs sm:text-sm rounded-full shadow-[0_0_15px_rgba(212,168,75,0.5)] hover:shadow-[0_0_30px_rgba(212,168,75,0.8)] transition-all animate-pulse"
          >
            Check Your Golden Hour
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── MAIN COMPONENT ──────────────────────────────────────────────────── */

export default function ModernExplainer() {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 1 for the current phase
  const [isPaused, setIsPaused] = useState(false);
  const reqRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const progressRef = useRef(0);
  const lastRenderRef = useRef(0);
  const phaseRef = useRef(0);

  // Keep phaseRef in sync
  phaseRef.current = phase;

  useEffect(() => {
    // Reset progress when phase changes manually
    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = undefined;
    lastRenderRef.current = 0;
  }, [phase]);

  useEffect(() => {
    if (isPaused) {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      return;
    }

    lastTimeRef.current = undefined;
    lastRenderRef.current = 0;

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      let dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Cap dt to prevent huge jumps after tab switch, GC pause, etc.
      if (dt > 0.1) dt = 0.016;

      const next = progressRef.current + dt / PHASES[phaseRef.current].duration;

      if (next >= 1.0) {
        progressRef.current = 0;
        setProgress(0);
        setPhase((p) => (p + 1) % PHASES.length);
        return; // stop loop — the phase useEffect will restart it
      }

      progressRef.current = next;

      // Throttle React re-renders to ~20fps (every 50ms) instead of ~60fps
      if (time - lastRenderRef.current > 50) {
        lastRenderRef.current = time;
        setProgress(next);
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [phase, isPaused]);

  return (
    <div 
      className="relative w-full aspect-[3/4] sm:aspect-video bg-[#030308] border border-white/10 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl group selection:bg-gold/30 cursor-pointer"
      onClick={() => setIsPaused(!isPaused)}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Progress Bars (Story style) */}
      <ProgressBar 
        phase={phase} 
        progress={progress} 
        setPhase={setPhase} 
        togglePause={(e: any) => { e.stopPropagation(); setIsPaused(!isPaused); }} 
        isPaused={isPaused} 
      />

      {/* Slide Content */}
      <div className="absolute inset-0 pt-16">
        <AnimatePresence mode="wait">
          {phase === 0 && <motion.div key="p0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0"><SlideOneHooks progress={progress} /></motion.div>}
          {phase === 1 && <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0"><SlideTwoInput progress={progress} /></motion.div>}
          {phase === 2 && <motion.div key="p2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0"><SlideThreeScience progress={progress} /></motion.div>}
          {phase === 3 && <motion.div key="p3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0"><SlideFourMath progress={progress} /></motion.div>}
          {phase === 4 && <motion.div key="p4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0"><SlideFiveResults progress={progress} /></motion.div>}
          {phase === 5 && <motion.div key="p5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0"><SlideSixAlerts /></motion.div>}
        </AnimatePresence>
      </div>

      {/* Manual nav arrows */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-24 flex items-center justify-start px-2 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); setPhase(p => (p - 1 + PHASES.length) % PHASES.length); }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-gold/20 hover:text-gold hover:border-gold/50 transition-all hover:scale-110"
        >
          <ChevronLeft />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 w-16 md:w-24 flex items-center justify-end px-2 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); setPhase(p => (p + 1) % PHASES.length); }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-gold/20 hover:text-gold hover:border-gold/50 transition-all hover:scale-110"
        >
          <ChevronRight />
        </button>
      </div>

    </div>
  );
}
