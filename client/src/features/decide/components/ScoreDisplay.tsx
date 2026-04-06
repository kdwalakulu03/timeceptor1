/**
 * ScoreDisplay — Shows the current hour's decision result.
 * Compact, visual, with verdict badge + next-best-window card.
 */
import React from 'react';
import { motion } from 'motion/react';
import type { DecisionResult } from '../utils/engine';

const VERDICT_STYLES = {
  go:      { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', label: '✓' },
  caution: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   glow: 'shadow-amber-500/20',   label: '⚠' },
  wait:    { bg: 'bg-red-500/10',      border: 'border-red-500/30',     text: 'text-red-400',     glow: 'shadow-red-500/20',     label: '✕' },
};

export function ScoreDisplay({ result, serviceName }: { result: DecisionResult; serviceName: string }) {
  const style = VERDICT_STYLES[result.verdict];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

      {/* Main verdict card */}
      <div className={`border-2 ${style.border} ${style.bg} rounded-xl p-6 sm:p-8 mb-6 ${style.glow} shadow-lg`}>
        {/* Score circle + verdict */}
        <div className="flex items-center gap-6 mb-5">
          <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 ${style.border} flex items-center justify-center`}>
            <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${style.text}`}>{result.currentScore}</span>
            <span className="absolute -bottom-1 text-[10px] font-mono text-cream-dim tracking-widest">/100</span>
          </div>
          <div className="flex-1">
            <div className={`text-2xl sm:text-3xl font-display font-semibold ${style.text} mb-1`}>
              {style.label} {result.verdictLabel}
            </div>
            <p className="text-sm text-cream-dim leading-relaxed">{result.verdictDetail}</p>
          </div>
        </div>

        {/* Current hora info */}
        <div className="border-t border-white/[0.06] pt-4 mt-4">
          <div className="font-mono text-[10px] tracking-widest uppercase text-gold/60 mb-2">Current Planetary Hour</div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-indigo-300">{result.currentHoraRuler}</span>
            <span className="text-xs text-cream-dim">—</span>
            <span className="text-xs text-cream-dim leading-relaxed">{result.currentActivity}</span>
          </div>
          {result.currentDesc && (
            <p className="text-xs text-cream-dim/60 leading-relaxed mt-2 max-w-xl">{result.currentDesc}</p>
          )}
        </div>
      </div>

      {/* Next better window */}
      {result.nextBetter && result.verdict !== 'go' && (
        <div className="border border-gold/20 rounded-xl p-5 bg-gold/[0.03] mb-6">
          <div className="font-mono text-[10px] tracking-widest uppercase text-gold/60 mb-3">Next Golden Window</div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">{result.nextBetter.label}</div>
              <div className="font-mono text-[10px] text-cream-dim mt-1">
                {result.nextBetter.hoursFromNow}h from now
              </div>
            </div>
            <div className="w-px h-12 bg-gold/20" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-400">{result.nextBetter.score}</span>
                <span className="text-xs text-cream-dim">/100</span>
              </div>
              <div className="font-mono text-[10px] text-indigo-300 mt-1">{result.nextBetter.horaRuler} hora</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's remaining windows */}
      {result.todayWindows.length > 0 && (
        <div className="border border-gold/10 rounded-xl p-5 bg-white/[0.01]">
          <div className="font-mono text-[10px] tracking-widest uppercase text-gold/60 mb-3">Today's Remaining Windows</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {result.todayWindows.map((w, i) => {
              const h = w.hour;
              const ampm = h >= 12 ? 'PM' : 'AM';
              const h12 = h % 12 || 12;
              const isGold = w.score >= 62;
              return (
                <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg ${isGold ? 'bg-emerald-500/[0.06] border border-emerald-500/15' : 'bg-white/[0.02]'}`}>
                  <span className={`text-lg font-bold tabular-nums ${isGold ? 'text-emerald-400' : w.score >= 40 ? 'text-gold' : 'text-cream-dim'}`}>
                    {w.score}
                  </span>
                  <div>
                    <div className="font-mono text-xs text-cream font-bold">{h12} {ampm}</div>
                    <div className="font-mono text-[9px] text-indigo-300/60">{w.horaRuler}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
