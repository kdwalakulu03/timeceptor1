/**
 * PlanSchedule — renders the 7-day plan schedule with phase timelines.
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SERVICES } from '../../../services';
import type { LifePlan } from '../data/plans';
import type { PlanDayResult, PhaseWindow } from '../utils/compute';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-400';
  if (s >= 50) return 'text-gold';
  if (s >= 25) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(s: number) {
  if (s >= 75) return 'bg-emerald-500/15 border-emerald-500/30';
  if (s >= 50) return 'bg-gold/15 border-gold/30';
  if (s >= 25) return 'bg-amber-500/15 border-amber-500/30';
  return 'bg-red-500/15 border-red-500/30';
}

function formatHour(hw: { date: Date; hour: number }) {
  const h = hw.hour;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

interface Props {
  plan: LifePlan;
  schedule: PlanDayResult[];
}

export function PlanSchedule({ plan, schedule }: Props) {
  const [expandedDay, setExpandedDay] = useState(0); // Default: today expanded

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Today's Timeline — special highlight */}
      <div className="bg-white/[0.02] border border-gold/15 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gold/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gold">☀️ Today's Optimal Timeline</h3>
          <span className={`text-lg font-bold ${scoreColor(schedule[0]?.avgScore ?? 0)}`}>
            {schedule[0]?.avgScore ?? 0}
          </span>
        </div>
        <div className="p-4 space-y-3">
          {schedule[0]?.phases.map((pw, i) => {
            const svc = SERVICES.find(s => s.id === pw.phase.service);
            return (
              <div key={pw.phase.service} className="flex items-start gap-3">
                {/* Timeline connector */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${plan.accentFrom}22, ${plan.accentTo}22)`,
                      border: `1px solid ${plan.accentFrom}44`,
                    }}
                  >
                    {svc?.icon || '⏰'}
                  </div>
                  {i < schedule[0].phases.length - 1 && (
                    <div className="w-px h-6 bg-gold/15 mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-cream">{pw.phase.label}</span>
                    {pw.bestWindow && (
                      <span className={`font-mono text-xs font-bold ${scoreColor(pw.bestWindow.score)}`}>
                        {pw.bestWindow.score}
                      </span>
                    )}
                  </div>
                  {pw.bestWindow ? (
                    <div className="font-mono text-[10px] text-cream-dim/60 tracking-wider mt-0.5">
                      Best at <span className="text-cream-dim">{formatHour(pw.bestWindow)}</span>
                      {' '} · {pw.bestWindow.horaRuler} hora · {pw.phase.duration}
                    </div>
                  ) : (
                    <div className="font-mono text-[10px] text-cream-dim/40 tracking-wider mt-0.5">
                      No strong window today
                    </div>
                  )}
                  <p className="text-[11px] text-cream-dim/50 mt-1 leading-relaxed">{pw.phase.tip}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-day overview */}
      <div>
        <h3 className="font-mono text-[10px] tracking-widest uppercase text-gold/50 mb-3">7-Day Overview</h3>
        <div className="space-y-2">
          {schedule.map((day, di) => {
            const isExpanded = expandedDay === di;
            const isToday = di === 0;
            return (
              <div
                key={day.date}
                className={`border rounded-xl overflow-hidden transition-all ${
                  isExpanded ? 'border-gold/25 bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.01]'
                }`}
              >
                <button
                  onClick={() => setExpandedDay(isExpanded ? -1 : di)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="font-mono text-xs text-cream-dim/70 w-16 text-left">
                    {isToday ? <span className="text-gold">Today</span> : formatDate(day.date)}
                  </div>

                  {/* Mini score bar */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${day.avgScore}%`,
                          background: `linear-gradient(90deg, ${plan.accentFrom}, ${plan.accentTo})`,
                        }}
                      />
                    </div>
                    <span className={`font-mono text-xs font-bold w-8 text-right ${scoreColor(day.avgScore)}`}>
                      {day.avgScore}
                    </span>
                  </div>

                  {/* Phase icons */}
                  <div className="hidden sm:flex gap-1">
                    {day.phases.map(pw => {
                      const svc = SERVICES.find(s => s.id === pw.phase.service);
                      return (
                        <span
                          key={pw.phase.service}
                          className="text-xs"
                          title={`${pw.phase.label}: ${pw.bestWindow?.score ?? '–'}`}
                        >
                          {svc?.icon}
                        </span>
                      );
                    })}
                  </div>

                  <svg
                    className={`w-4 h-4 text-cream-dim/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gold/10">
                    {day.phases.map(pw => {
                      const svc = SERVICES.find(s => s.id === pw.phase.service);
                      return (
                        <div key={pw.phase.service} className="flex items-center gap-3 py-2">
                          <span className="text-lg">{svc?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-cream">{pw.phase.label}</div>
                            {pw.bestWindow ? (
                              <div className="font-mono text-[10px] text-cream-dim/60 tracking-wider">
                                {formatHour(pw.bestWindow)} · {pw.bestWindow.horaRuler} · {pw.phase.duration}
                              </div>
                            ) : (
                              <div className="font-mono text-[10px] text-cream-dim/40 tracking-wider">
                                No strong window
                              </div>
                            )}
                          </div>
                          {pw.bestWindow && (
                            <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${scoreBg(pw.bestWindow.score)} ${scoreColor(pw.bestWindow.score)}`}>
                              {pw.bestWindow.score}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
