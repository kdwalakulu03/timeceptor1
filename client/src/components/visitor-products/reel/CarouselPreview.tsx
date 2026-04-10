import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface SlideConfig {
  id: string;
  label: string;
  component: React.ReactNode;
}

interface CarouselPreviewProps {
  slides: SlideConfig[];
  initialIndex?: number;
}

export function CarouselPreview({ slides, initialIndex = 0 }: CarouselPreviewProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStart = useRef<number | null>(null);

  const go = useCallback(
    (idx: number) => {
      if (idx === current || idx < 0 || idx >= slides.length) return;
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
    },
    [current, slides.length],
  );

  const prev = () => go(current - 1);
  const next = () => go(current + 1);

  // Keyboard nav when focused
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Slide label */}
      <div className="flex gap-1.5 items-center">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            className={`font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-1 rounded-full transition-all duration-300 ${
              i === current
                ? 'text-[#C1A661] border border-[#C1A661]/30 bg-[#C1A661]/10'
                : 'text-white/25 border border-white/[0.06] hover:text-white/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Phone shell */}
      <div className="relative flex flex-col items-center">
        {/* Outer phone bezel */}
        <div
          className="relative rounded-[36px] border-2 border-white/[0.12] shadow-[0_0_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden"
          style={{
            width: 'clamp(240px, 30vw, 340px)',
            aspectRatio: '9/19.5',
            background: '#0a0a0a',
          }}
        >
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 z-20 bg-[#030303]/80 backdrop-blur-sm">
            <span className="font-mono text-[9px] text-white/30">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            {/* Center: logo + branding */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <img src="/timeceptor-logo.png" alt="" className="h-12 w-auto object-contain" draggable={false} />
              <span className="font-mono text-[9px] text-white/30 whitespace-nowrap">Timeceptor by timecept.com <sup>TM</sup> &copy;</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-[2px] items-end">
                {[3,5,7,9].map(h => <div key={h} className="w-[2px] bg-white/30 rounded-full" style={{ height: h }} />)}
              </div>
              <div className="w-4 h-2.5 rounded-[2px] border border-white/30">
                <div className="w-[70%] h-full bg-white/30 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Slide content */}
          <div
            className="relative overflow-hidden h-full"
            onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              if (touchStart.current === null) return;
              const d = touchStart.current - e.changedTouches[0].clientX;
              if (Math.abs(d) > 40) d > 0 ? next() : prev();
              touchStart.current = null;
            }}
          >
            <AnimatePresence custom={direction} mode="popLayout" initial={false}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.6 }}
                className="absolute left-0 right-0 bottom-0" style={{ top: 35 }}
              >
                {slides[current].component}
              </motion.div>
            </AnimatePresence>

            {/* Large transparent watermark logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <img
                src="/timeceptor-logo.png"
                alt=""
                className="w-[60%] opacity-[0.04] select-none"
                draggable={false}
              />
            </div>
          </div>

          {/* Home bar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[90px] h-1 bg-white/20 rounded-full z-20" />
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="absolute left-[-44px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="absolute right-[-44px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-1.5 bg-[#C1A661]'
                : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Slide count */}
      <p className="font-mono text-[9px] text-white/20 uppercase tracking-[0.3em]">
        {current + 1} / {slides.length}
      </p>
    </div>
  );
}
