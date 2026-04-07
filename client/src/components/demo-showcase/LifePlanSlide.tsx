/**
 * LifePlanSlide — Today's phased plan from top windows.
 */
import React from 'react';
import { motion } from 'motion/react';
import { PLANET_SERVICE_DATA } from '../../services';
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
function fmtHour(h: number): string { return `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`; }

export function LifePlanSlide({ data }: SlideProps) {
  const { celeb, windows } = data;
  const firstName = celeb.name.split(' ')[0];

  const todayStr = new Date().toDateString();
  const todayWins = windows
    .filter(w => new Date(w.date).toDateString() === todayStr)
    .sort((a, b) => a.hour - b.hour);

  const morningWins = todayWins.filter(w => w.hour >= 5 && w.hour < 12).sort((a, b) => b.score - a.score);
  const afternoonWins = todayWins.filter(w => w.hour >= 12 && w.hour < 17).sort((a, b) => b.score - a.score);
  const eveningWins = todayWins.filter(w => w.hour >= 17 && w.hour < 22).sort((a, b) => b.score - a.score);

  const phases = [
    { label: 'Morning Focus', icon: '🌅', window: morningWins[0], desc: 'Peak mental clarity and energy' },
    { label: 'Midday Execution', icon: '⚡', window: afternoonWins[0], desc: 'Action and implementation' },
    { label: 'Evening Integration', icon: '🌙', window: eveningWins[0], desc: 'Review, reflect and restore' },
  ].filter(p => p.window);

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-xl">📋</div>
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-purple-300">Life Blueprint</h2>
          <p className="font-mono text-[11px] text-cream-dim/70 tracking-widest uppercase">
            {firstName}'s optimal day planner
          </p>
        </div>
      </div>

      <div className="border border-purple-500/20 rounded-xl p-5 sm:p-6 bg-purple-500/[0.02]">
        <div className="font-mono text-[11px] text-purple-300/70 tracking-widest uppercase mb-4 font-medium">
          Today's Optimal Schedule for {firstName}
        </div>

        <div className="space-y-3">
          {phases.map((phase, i) => {
            const w = phase.window!;
            const svcData = PLANET_SERVICE_DATA[w.horaRuler]?.[celeb.service];
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="text-xl mt-0.5">{phase.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-cream font-bold">{phase.label}</span>
                    <span className={`font-mono text-[11px] font-bold ${scoreColor(w.score)}`}>{fmtHour(w.hour)} · Score {w.score}</span>
                  </div>
                  <p className="text-xs text-cream-dim/70 mb-1">{phase.desc}</p>
                  {svcData && (
                    <p className="text-xs text-cream-dim/80 italic">
                      "{svcData.activity}" — {w.horaRuler} hora
                    </p>
                  )}
                </div>
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${scoreBg(w.score)}`} />
              </div>
            );
          })}
        </div>

        {phases.length === 0 && (
          <p className="text-cream-dim/50 text-center py-8 text-sm">No windows for today yet — try refreshing tomorrow.</p>
        )}
      </div>
    </motion.div>
  );
}
