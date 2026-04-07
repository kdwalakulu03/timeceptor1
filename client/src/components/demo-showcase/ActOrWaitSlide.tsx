/**
 * ActOrWaitSlide — Live verdict + today's windows + sharable card.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { SERVICES } from '../../services';
import {
  renderVerdictCard, shareCanvasAsImage, downloadCanvasAsImage,
  preloadLogo, getCachedLogo,
  type VerdictCardData,
} from '../../lib/cardRenderer';
import type { SlideProps } from './types';

function fmtHour(h: number): string { return `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`; }

export function ActOrWaitSlide({ data }: SlideProps) {
  const { celeb, decision } = data;
  const firstName = celeb.name.split(' ')[0];

  useEffect(() => { preloadLogo(); }, []);

  const handleShare = useCallback(async () => {
    if (!decision) return;
    const svc = SERVICES.find(s => s.id === celeb.service);
    const vd: VerdictCardData = {
      currentScore: decision.currentScore,
      currentHoraRuler: decision.currentHoraRuler,
      currentActivity: decision.currentActivity,
      verdictLabel: decision.verdictLabel,
      verdict: decision.verdict,
      nextBetter: decision.nextBetter,
      todayWindows: decision.todayWindows.slice(0, 4).map(w => ({ hour: w.hour, score: w.score })),
      serviceName: svc?.name ?? celeb.serviceLabel,
    };
    const canvas = renderVerdictCard(vd, getCachedLogo());
    await shareCanvasAsImage(
      canvas,
      `Should ${firstName} act now? — Timeceptor`,
      `${decision.verdictLabel} — Score: ${decision.currentScore}/100`,
      `timeceptor-${celeb.id}-verdict.png`,
    );
  }, [decision, celeb]);

  const handleDownload = useCallback(() => {
    if (!decision) return;
    const svc = SERVICES.find(s => s.id === celeb.service);
    const vd: VerdictCardData = {
      currentScore: decision.currentScore,
      currentHoraRuler: decision.currentHoraRuler,
      currentActivity: decision.currentActivity,
      verdictLabel: decision.verdictLabel,
      verdict: decision.verdict,
      nextBetter: decision.nextBetter,
      todayWindows: decision.todayWindows.slice(0, 4).map(w => ({ hour: w.hour, score: w.score })),
      serviceName: svc?.name ?? celeb.serviceLabel,
    };
    const canvas = renderVerdictCard(vd, getCachedLogo());
    downloadCanvasAsImage(canvas, `timeceptor-${celeb.id}-verdict.png`);
  }, [decision, celeb]);

  if (!decision) return <p className="text-cream-dim/50 text-center py-8">No decision data available</p>;

  return (
    <motion.div
      key="decide"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-xl">🎯</div>
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-emerald-400">Act or Wait?</h2>
          <p className="font-mono text-[11px] text-cream-dim/70 tracking-widest uppercase">
            Should {firstName} do {celeb.serviceLabel.toLowerCase()} right now?
          </p>
        </div>
      </div>

      {/* Verdict card */}
      <div className={`border-2 rounded-xl p-5 sm:p-6 mb-4 ${
        decision.verdict === 'go' ? 'border-emerald-500/30 bg-emerald-500/[0.04]' :
        decision.verdict === 'caution' ? 'border-amber-500/30 bg-amber-500/[0.04]' :
        'border-red-500/30 bg-red-500/[0.04]'
      }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-full border-3 flex items-center justify-center text-2xl font-bold ${
            decision.verdict === 'go' ? 'border-emerald-400/60 text-emerald-400' :
            decision.verdict === 'caution' ? 'border-amber-400/60 text-amber-400' :
            'border-red-400/60 text-red-400'
          }`}>
            {decision.currentScore}
          </div>
          <div>
            <div className={`text-xl font-bold ${
              decision.verdict === 'go' ? 'text-emerald-400' :
              decision.verdict === 'caution' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {decision.verdict === 'go' ? '✓' : decision.verdict === 'caution' ? '⚠' : '✕'} {decision.verdictLabel}
            </div>
            <div className="font-mono text-xs text-cream-dim/60 mt-0.5">
              {decision.currentHoraRuler} hora · {celeb.serviceLabel}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="font-mono text-[11px] text-gold/70 tracking-widest uppercase mb-1 font-medium">Recommended Activity</div>
          <p className="text-sm text-cream">{decision.currentActivity}</p>
        </div>

        {decision.nextBetter && decision.verdict !== 'go' && (
          <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-4">
            <div className="font-mono text-[11px] text-gold/70 tracking-widest uppercase mb-1 font-medium">Next Golden Window</div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gold">{decision.nextBetter.label}</span>
              <span className="font-mono text-xs text-cream-dim/60">
                Score {decision.nextBetter.score}/100 · {decision.nextBetter.horaRuler} hora · {decision.nextBetter.hoursFromNow}h away
              </span>
            </div>
          </div>
        )}

        {decision.verdict === 'go' && (
          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 mb-4">
            <p className="font-mono text-xs text-emerald-400">Golden window active — this is {firstName}'s best time right now!</p>
          </div>
        )}

        {/* Today's top windows */}
        {decision.todayWindows.length > 0 && (
          <div>
            <div className="font-mono text-[11px] text-gold/70 tracking-widest uppercase mb-2 font-medium">Today's top windows</div>
            <div className="flex flex-wrap gap-2">
              {decision.todayWindows.slice(0, 6).map((w, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className={`font-mono text-xs font-bold ${w.score >= 62 ? 'text-emerald-400' : w.score >= 45 ? 'text-gold' : 'text-cream-dim/60'}`}>
                    {fmtHour(w.hour)}
                  </span>
                  <span className="font-mono text-[10px] text-cream-dim/50 ml-1.5">({w.score})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share / Download — the viral card */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-emerald-400/30 text-emerald-300 font-mono text-xs tracking-widest uppercase hover:border-emerald-400/60 hover:bg-emerald-500/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Share {firstName}'s Card
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gold/30 text-gold font-mono text-xs tracking-widest uppercase hover:border-gold/60 hover:bg-gold/10 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
          Download Card
        </button>
      </div>
    </motion.div>
  );
}
