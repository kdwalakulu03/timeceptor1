/**
 * SwotMini — Compact 8-service SWOT overview (no card image).
 * Shown alongside the card preview to give immediate visual value.
 */
import React from 'react';
import { motion } from 'motion/react';
import type { SwotServiceSummary } from './types';

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

interface SwotMiniProps {
  services: SwotServiceSummary[];
}

export function SwotMini({ services }: SwotMiniProps) {
  if (services.length === 0) return null;

  const strengths = services.slice(0, 2);
  const weaknesses = services.slice(-2).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="border border-indigo-500/20 rounded-xl p-4 bg-indigo-500/[0.03]"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">✦</span>
        <span className="font-mono text-xs tracking-widest uppercase text-indigo-300 font-bold">Your Life Domains — 7-Day SWOT</span>
      </div>

      {/* 8-service mini bars */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4">
        {services.map((svc, idx) => (
          <div key={svc.id} className="flex items-center gap-2">
            <span className="text-sm flex-shrink-0">{svc.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[10px] text-cream-dim/70 truncate">{svc.name}</span>
                <span className={`font-mono text-[11px] font-bold tabular-nums ${scoreColor(svc.avgScore)}`}>{svc.avgScore}</span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1">
                <div className={`h-full rounded-full transition-all duration-700 ${scoreBg(svc.avgScore)}`} style={{ width: `${svc.avgScore}%` }} />
              </div>
            </div>
            {idx === 0 && <span className="text-[8px] font-mono font-bold text-emerald-400 tracking-widest">BEST</span>}
            {idx === services.length - 1 && <span className="text-[8px] font-mono font-bold text-red-400 tracking-widest">WEAK</span>}
          </div>
        ))}
      </div>

      {/* Strengths / Weaknesses row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-lg p-2.5">
          <div className="font-mono text-[9px] text-emerald-400 font-bold tracking-widest uppercase mb-1.5">Strengths</div>
          {strengths.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">{s.icon}</span>
              <span className="font-mono text-[10px] text-cream-dim flex-1">{s.name}</span>
              <span className={`font-mono text-[10px] font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}</span>
            </div>
          ))}
        </div>
        <div className="bg-red-500/[0.06] border border-red-500/15 rounded-lg p-2.5">
          <div className="font-mono text-[9px] text-red-400 font-bold tracking-widest uppercase mb-1.5">Weaknesses</div>
          {weaknesses.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">{s.icon}</span>
              <span className="font-mono text-[10px] text-cream-dim flex-1">{s.name}</span>
              <span className={`font-mono text-[10px] font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
