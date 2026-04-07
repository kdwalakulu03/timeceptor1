/**
 * DemoShowcase — Auto-playing carousel of 4 product slides + viral share animation.
 *
 * Features:
 *  - 4 product tiles visible at the top (always above fold)
 *  - 5th "Timecept Card" slide plays after the 4 products (no tab — visual only)
 *  - 3 s per product slide, 8 s for the share animation
 *  - Manual click overrides auto-play and resumes timer
 *  - AnimatePresence slide transitions
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { GoldenHoursSlide } from './GoldenHoursSlide';
import { SwotSlide } from './SwotSlide';
import { ActOrWaitSlide } from './ActOrWaitSlide';
import { LifePlanSlide } from './LifePlanSlide';
import { ShareCardSlide } from './ShareCardSlide';
import { PRODUCT_TABS, type ProductTabId, type DemoData } from './types';
import { TOTAL_SHARE_DURATION } from './x-share/types';

const SLIDE_DURATION = 3_000; // 3 s per product slide

type SlideId = ProductTabId | 'share';
const SLIDE_SEQ: SlideId[] = ['golden', 'swot', 'decide', 'plan', 'share'];

function slideDuration(id: SlideId): number {
  return id === 'share' ? TOTAL_SHARE_DURATION : SLIDE_DURATION;
}

export function DemoShowcase({ data }: { data: DemoData }) {
  const [activeSlide, setActiveSlide] = useState<SlideId>('golden');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef  = useRef(Date.now());
  const slideRef  = useRef<SlideId>('golden');

  // Keep ref in sync so the interval closure reads correct duration
  useEffect(() => { slideRef.current = activeSlide; }, [activeSlide]);

  const activeTabIdx = PRODUCT_TABS.findIndex(t => t.id === activeSlide);
  const isShareSlide = activeSlide === 'share';

  /* ── Timer ───────────────────────────────────────────── */
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    startRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const dur = slideDuration(slideRef.current);
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / dur, 1);
      setProgress(p);

      if (p >= 1) {
        setActiveSlide(prev => {
          const cur = SLIDE_SEQ.indexOf(prev);
          return SLIDE_SEQ[(cur + 1) % SLIDE_SEQ.length];
        });
        startRef.current = Date.now();
        setProgress(0);
      }
    }, 50);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (!isPaused) startTimer();
    return () => stopTimer();
  }, [isPaused, startTimer, stopTimer]);

  useEffect(() => {
    if (isPaused) stopTimer();
  }, [isPaused, stopTimer]);

  const handleTabClick = useCallback((tabId: ProductTabId) => {
    setActiveSlide(tabId);
    setIsPaused(false);
    startRef.current = Date.now();
    setProgress(0);
  }, []);

  const togglePause = useCallback(() => setIsPaused(p => !p), []);

  /* ── Render active slide ─────────────────────────────── */
  const renderSlide = () => {
    switch (activeSlide) {
      case 'golden': return <GoldenHoursSlide data={data} />;
      case 'swot':   return <SwotSlide data={data} />;
      case 'decide': return <ActOrWaitSlide data={data} />;
      case 'plan':   return <LifePlanSlide data={data} />;
      case 'share':  return <ShareCardSlide data={data} />;
    }
  };

  return (
    <div className="w-full">
      {/* ── Product Tiles — always visible, above fold ──────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 overflow-x-auto">
        {/* Play / Pause */}
        <button
          onClick={togglePause}
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold/25 flex items-center justify-center text-cream-dim hover:text-gold hover:border-gold/50 transition-all"
          title={isPaused ? 'Resume auto-play' : 'Pause auto-play'}
        >
          {isPaused
            ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
        </button>

        {PRODUCT_TABS.map((tab, idx) => {
          const isActive = tab.id === activeSlide;
          const isPast  = isShareSlide || idx < activeTabIdx;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex-1 min-w-0 p-2.5 sm:p-3 rounded-xl border-2 transition-all overflow-hidden ${
                isActive
                  ? `${tab.borderClass} ${tab.bgClass} shadow-lg`
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-gold/20 hover:bg-white/[0.04]'
              }`}
            >
              {/* Active progress bar */}
              {isActive && !isPaused && (
                <div
                  className="absolute bottom-0 left-0 h-[3px] rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${progress * 100}%`,
                    background: tab.color === 'gold' ? '#F4A11D'
                      : tab.color === 'indigo' ? '#818cf8'
                      : tab.color === 'emerald' ? '#34d399' : '#a78bfa',
                  }}
                />
              )}

              {/* Completed indicator */}
              {isPast && !isActive && (
                <div className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-gold/30" />
              )}

              <div className="flex flex-col items-center gap-1">
                <span className="text-lg sm:text-xl leading-none">{tab.icon}</span>
                <span className={`font-mono text-[9px] sm:text-[10px] tracking-widest uppercase font-bold leading-tight ${
                  isActive ? tab.textClass : 'text-cream-dim/60'
                }`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Share-slide indicator (no tab — just label + progress) */}
      {isShareSlide && (
        <div className="flex items-center justify-center gap-3 mb-3 mt-1">
          <span className="font-mono text-[10px] text-gold/70 tracking-widest uppercase font-medium">✦ Timecept Card — Share to 𝕏</span>
          <div className="w-20 bg-white/[0.08] rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gold/60 rounded-full transition-all duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}

      {/* ── Slide content ──────────────────────────────────── */}
      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {renderSlide()}
        </AnimatePresence>
      </div>
    </div>
  );
}
