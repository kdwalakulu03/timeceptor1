/**
 * SwotSlide — 8-service performance overview + SWOT matrix.
 */
import React from 'react';
import { motion } from 'motion/react';
import type { SlideProps } from './types';

function scoreColor(s: number): string {
  if (s >= 62) return 'text-emerald-400';
  if (s >= 45) return 'text-gold';
  if (s >= 30) return 'text-amber-400';
  return 'text-red-400';
}
function scoreBg(s: number): string {
  if (s >= 62) return 'bg-emerald-400';
  if (s >= 45) return 'bg-gold';
  if (s >= 30) return 'bg-amber-400';
  return 'bg-red-400';
}

export function SwotSlide({ data }: SlideProps) {
  const { celeb, serviceSummaries, swotMatrix } = data;
  const firstName = celeb.name.split(' ')[0];

  return (
    <motion.div
      key="swot"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-xl">✦</div>
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-indigo-300">SWOT Analysis</h2>
          <p className="font-mono text-[11px] text-cream-dim/70 tracking-widest uppercase">
            {firstName}'s 8 life domains · Strengths & weaknesses
          </p>
        </div>
      </div>

      {/* Service performance grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        {serviceSummaries.map((s, idx) => (
          <div key={s.id} className="border border-gold/10 rounded-lg p-3 sm:p-4 bg-white/[0.02] relative overflow-hidden">
            {idx === 0 && <div className="absolute top-0 right-0 bg-gold/15 text-gold text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-bl-lg tracking-widest">BEST</div>}
            {idx === serviceSummaries.length - 1 && <div className="absolute top-0 right-0 bg-red-500/15 text-red-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-bl-lg tracking-widest">WEAK</div>}
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="font-mono text-xs text-cream-dim tracking-wide mb-1.5">{s.name}</div>
            <div className={`text-2xl font-bold tabular-nums ${scoreColor(s.avgScore)}`}>{s.avgScore}</div>
            <div className="w-full bg-white/[0.05] rounded-full h-1.5 mt-2">
              <div className={`h-full rounded-full ${scoreBg(s.avgScore)}`} style={{ width: `${s.avgScore}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[10px] text-emerald-400/80 font-medium">{s.peakCount} peaks</span>
              <span className="font-mono text-[10px] text-red-400/80 font-medium">{s.weakCount} lows</span>
            </div>
          </div>
        ))}
      </div>

      {/* SWOT matrix */}
      {swotMatrix && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg p-3 sm:p-4">
            <div className="font-mono text-xs text-emerald-400 font-bold tracking-widest uppercase mb-2">Strengths</div>
            {swotMatrix.strengths.map(s => (
              <div key={s.id} className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs text-cream-dim flex-1">{s.name}</span>
                <span className={`font-mono text-xs font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}</span>
              </div>
            ))}
          </div>
          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-lg p-3 sm:p-4">
            <div className="font-mono text-xs text-red-400 font-bold tracking-widest uppercase mb-2">Weaknesses</div>
            {swotMatrix.weaknesses.map(s => (
              <div key={s.id} className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs text-cream-dim flex-1">{s.name}</span>
                <span className={`font-mono text-xs font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}</span>
              </div>
            ))}
          </div>
          <div className="bg-gold/[0.06] border border-gold/20 rounded-lg p-3 sm:p-4">
            <div className="font-mono text-xs text-gold font-bold tracking-widest uppercase mb-2">Opportunities</div>
            {swotMatrix.opportunities.map(s => (
              <div key={s.id} className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs text-cream-dim flex-1">{s.name}</span>
                <span className="font-mono text-[10px] text-emerald-400/80 font-medium">{s.peakCount} golden hrs</span>
              </div>
            ))}
          </div>
          <div className="bg-purple-500/[0.06] border border-purple-500/20 rounded-lg p-3 sm:p-4">
            <div className="font-mono text-xs text-purple-300 font-bold tracking-widest uppercase mb-2">Threats</div>
            {swotMatrix.threats.map(s => (
              <div key={s.id} className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs text-cream-dim flex-1">{s.name}</span>
                <span className="font-mono text-[10px] text-red-400/80 font-medium">{s.weakCount} low hrs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
