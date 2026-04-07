/**
 * SwotInsight — Rich SWOT analysis section for anonymous /app users.
 *
 * Mirrors the paid SwotPage experience (Overview + SWOT Matrix + Action Plan preview)
 * but using 7-day data. Designed to enchant users into signing in.
 *
 * Shows:
 *   1. Overview — 8 service cards with score, trend, peaks
 *   2. SWOT Matrix — 2×2 quadrant with prose insights
 *   3. Action Preview — Yoga & Health specific scheduling tips
 *   4. Locked Teaser — Blurred patterns section + sign-in CTA
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SwotServiceSummary, SwotMatrix, TodayWindowSlot } from './types';

/* ── helpers ─────────────────────────────────────────────────────── */

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

function trendIcon(t: string): string {
  return t === 'rising' ? '↑' : t === 'falling' ? '↓' : '→';
}

function trendColor(t: string): string {
  return t === 'rising' ? 'text-emerald-400' : t === 'falling' ? 'text-red-400' : 'text-cream-dim/60';
}

type InsightTab = 'overview' | 'swot' | 'actions';

const TABS: { id: InsightTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview',   icon: '◉' },
  { id: 'swot',     label: 'SWOT Matrix', icon: '⊞' },
  { id: 'actions',  label: 'Action Plan', icon: '✦' },
];

/** Only yoga + meditation are free for anonymous users */
const FREE_IDS = new Set(['yoga', 'meditation']);

interface SwotInsightProps {
  services: SwotServiceSummary[];
  matrix: SwotMatrix | null;
  onSignIn?: () => void;
  isAuthed?: boolean;
  todayWindows?: TodayWindowSlot[];
  goldenHour?: { score: number; hour: number; horaRuler: string; serviceName: string; serviceIcon: string; activity: string } | null;
}

/* ── 24-hour day bar chart (reuses pattern from WeeklyView) ── */
function TodayChart({ windows, goldenHour }: {
  windows: TodayWindowSlot[];
  goldenHour?: SwotInsightProps['goldenHour'];
}) {
  const nowHour = new Date().getHours();
  const dayMax = Math.max(...windows.map(w => w.score), 1);

  // Rank-based coloring like WeeklyView
  const sorted = [...windows].sort((a, b) => b.score - a.score);
  const rankByHour = new Map(sorted.map((slot, idx) => [slot.hour, idx]));

  function barColor(hour: number, isPast: boolean): string {
    if (isPast) return 'rgba(100,110,165,0.12)';
    const rank = rankByHour.get(hour) ?? 99;
    if (rank === 0) return 'rgba(244,161,29,1)';      // gold — peak
    if (rank <= 3) return 'rgba(32,197,160,1)';        // emerald — top 4
    if (rank <= 12) return 'rgba(100,115,200,1)';      // indigo — mid
    return 'rgba(65,72,120,0.85)';                      // dim
  }

  const peak = goldenHour;

  return (
    <div className="mb-4">
      {/* Golden hour highlight */}
      {peak && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{peak.serviceIcon}</span>
            <div className="min-w-0">
              <div className="font-mono text-[10px] text-gold tracking-widest uppercase font-bold">
                Golden Hour · {peak.serviceName}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gold leading-none">
                  {String(peak.hour).padStart(2, '0')}:00
                </span>
                <span className="text-xs text-cream-dim/50">{peak.horaRuler} hora</span>
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${peak.score >= 62 ? 'text-emerald-400' : peak.score >= 45 ? 'text-gold' : 'text-amber-400'}`}>
            {peak.score}
            <span className="text-[10px] text-cream-dim/40 font-normal">/100</span>
          </div>
        </div>
      )}

      {/* 24-hour bar chart */}
      <div className="relative px-1">
        {/* NOW badge */}
        <div
          className="absolute -top-4 z-10 pointer-events-none"
          style={{ left: `${((nowHour + 0.5) / 24) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span className="px-1.5 py-0.5 bg-gold/15 border border-gold/25 rounded text-gold font-mono text-[8px] font-bold tracking-wider">
            NOW
          </span>
        </div>

        <div className="relative h-10 bg-white/[0.03] rounded">
          <div className="flex items-end gap-[1.5px] h-full">
            {windows.map((w, i) => {
              const isPast = i < nowHour;
              const isNow = i === nowHour;
              const h = Math.max(4, Math.round((w.score / Math.max(dayMax, 1)) * 40));
              return (
                <div
                  key={i}
                  className="flex-1 relative rounded-[1.5px] overflow-hidden"
                  style={{ height: 40 }}
                  title={`${String(i).padStart(2, '0')}:00 · ${w.horaRuler || '—'} · ${w.score}`}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-[1.5px] transition-all duration-300"
                    style={{
                      height: h,
                      background: barColor(i, isPast),
                      boxShadow: isNow ? '0 0 6px 1px rgba(244,161,29,0.25)' : 'none',
                    }}
                  />
                  {isNow && (
                    <div className="absolute inset-0 border border-gold/30 rounded-[1.5px]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Dawn / dusk dividers */}
          <div className="absolute top-0 h-full w-px bg-gold/25 pointer-events-none" style={{ left: `${(6 / 24) * 100}%` }} />
          <div className="absolute top-0 h-full w-px bg-blue-400/25 pointer-events-none" style={{ left: `${(18 / 24) * 100}%` }} />

          {/* Current-hour needle */}
          <div
            className="absolute top-0 h-full w-0.5 bg-gold rounded pointer-events-none z-10"
            style={{
              left: `${((nowHour + 0.5) / 24) * 100}%`,
              boxShadow: '0 0 8px 2px rgba(244,161,29,0.30)',
            }}
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-1 font-mono text-[9px] text-cream-dim/35">
          <span>00</span>
          <span className="text-gold/50">06</span>
          <span>12</span>
          <span className="text-blue-400/50">18</span>
          <span>23</span>
        </div>
      </div>

      {/* Activity recommendation */}
      {peak && (
        <div className="mt-2.5 px-1">
          <p className="text-[11px] text-cream-dim/60 leading-relaxed">
            <strong className="text-gold/80">Recommended:</strong> {peak.activity}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────────────── */

export function SwotInsight({ services, matrix, onSignIn, isAuthed = false, todayWindows, goldenHour }: SwotInsightProps) {
  const [tab, setTab] = useState<InsightTab>('overview');
  const [lockTip, setLockTip] = useState<string | null>(null);

  // Auto-dismiss lock tooltip
  React.useEffect(() => {
    if (lockTip) {
      const t = setTimeout(() => setLockTip(null), 2500);
      return () => clearTimeout(t);
    }
  }, [lockTip]);

  if (services.length === 0) return null;

  const sorted = [...services].sort((a, b) => b.avgScore - a.avgScore);
  const yogaSvc = services.find(s => s.id === 'yoga');
  const meditSvc = services.find(s => s.id === 'meditation');
  const healthSvc = services.find(s => s.id === 'health');

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="border border-indigo-500/25 rounded-xl bg-indigo-500/[0.02] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">✦</span>
            <span className="font-mono text-xs tracking-widest uppercase text-indigo-300 font-bold">
              Your Cosmic SWOT Analysis
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full">
            <span className="font-mono text-[9px] text-amber-400 tracking-widest uppercase font-bold">7-Day Preview</span>
          </span>
        </div>
        <p className="text-[11px] text-cream-dim/50 leading-relaxed">
          Planetary timing intelligence across 8 life domains — based on your birth chart
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 px-4 border-b border-indigo-500/15 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap transition-all border-b-2 ${
              tab === t.id
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-cream-dim/50 hover:text-cream-dim/80 hover:border-indigo-500/20'
            }`}
          >
            <span className="text-xs">{t.icon}</span>
            {t.label}
          </button>
        ))}
        {/* Locked "Patterns" tab */}
        <button
          onClick={onSignIn}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap border-b-2 border-transparent text-cream-dim/30 hover:text-gold/60 transition-all cursor-pointer"
        >
          <span className="text-xs">🔒</span>
          Patterns
        </button>
      </div>

      <div className="px-5 py-4">
        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Lock tooltip */}
            <AnimatePresence>
              {lockTip && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mb-2.5 flex items-center gap-2 px-3 py-2 bg-gold/10 border border-gold/30 rounded-lg"
                >
                  <span className="text-sm">🔒</span>
                  <span className="text-[11px] text-cream-dim/80 flex-1">
                    <strong className="text-gold">{lockTip}</strong> requires sign-in. Only Yoga & Meditation are free.
                  </span>
                  <button
                    onClick={onSignIn}
                    className="px-2.5 py-1 bg-gold text-space-bg text-[10px] font-bold tracking-widest uppercase rounded-full whitespace-nowrap"
                  >
                    Sign In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 24-hour day chart with golden hour highlight */}
            {todayWindows && todayWindows.length > 0 && (
              <TodayChart windows={todayWindows} goldenHour={goldenHour} />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              {sorted.map((s, idx) => {
                const isLocked = !isAuthed && !FREE_IDS.has(s.id);

                return (
                <div
                  key={s.id}
                  onClick={() => isLocked && setLockTip(s.name)}
                  className={`border rounded-lg p-3 bg-white/[0.02] relative overflow-hidden transition-colors ${
                    isLocked ? 'border-white/[0.06] cursor-pointer' :
                    idx === 0 ? 'border-emerald-500/25' : idx >= sorted.length - 2 ? 'border-red-500/15' : 'border-gold/10'
                  }`}
                >
                  {/* Lock overlay for non-free services */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-space-bg/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-1">
                      <span className="text-lg opacity-60">🔒</span>
                      <span className="font-mono text-[8px] text-gold/70 tracking-widest uppercase">Sign in</span>
                    </div>
                  )}
                  {idx === 0 && !isLocked && (
                    <div className="absolute top-0 right-0 bg-emerald-500/15 text-emerald-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-bl-lg tracking-widest">
                      BEST
                    </div>
                  )}
                  {idx === sorted.length - 1 && !isLocked && (
                    <div className="absolute top-0 right-0 bg-red-500/15 text-red-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-bl-lg tracking-widest">
                      WEAK
                    </div>
                  )}
                  <div className={`text-lg mb-1 ${isLocked ? 'opacity-30 grayscale' : ''}`}>{s.icon}</div>
                  <div className="font-mono text-[10px] text-cream-dim/70 mb-1.5 truncate">{s.name}</div>
                  <div className={`text-xl font-bold mb-1 ${isLocked ? 'text-cream-dim/20' : scoreColor(s.avgScore)}`}>
                    {isLocked ? '—' : s.avgScore}
                  </div>
                  {!isLocked && (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`font-mono text-[10px] font-bold ${trendColor(s.trend)}`}>
                          {trendIcon(s.trend)} {s.trend}
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-1 mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${scoreBg(s.avgScore)}`}
                          style={{ width: `${s.avgScore}%` }}
                        />
                      </div>
                      <div className="font-mono text-[9px] text-cream-dim/40">
                        {s.peakCount} peaks · {s.weakCount} lows
                      </div>
                    </>
                  )}
                </div>
                );
              })}
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(() => {
                const visibleSorted = isAuthed ? sorted : sorted.filter(s => FREE_IDS.has(s.id));
                const best = visibleSorted[0] ?? sorted[0];
                const visibleServices = isAuthed ? services : services.filter(s => FREE_IDS.has(s.id));
                const chronoMorning = visibleServices.reduce((a, s) => a + s.morningAvg, 0) / (visibleServices.length || 1);
                const chronoEvening = visibleServices.reduce((a, s) => a + s.eveningAvg, 0) / (visibleServices.length || 1);
                const chronotype = chronoMorning > chronoEvening + 3 ? '🌅 Morning Person' : chronoEvening > chronoMorning + 3 ? '🌙 Night Owl' : '⚖️ Balanced';

                // Most common dominant planet
                const planetFreq: Record<string, number> = {};
                visibleServices.forEach(s => { planetFreq[s.dominantPlanet] = (planetFreq[s.dominantPlanet] || 0) + 1; });
                const topPlanet = Object.entries(planetFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

                return [
                  { label: 'Strongest', value: `${best.icon} ${best.name}`, color: 'text-emerald-400' },
                  { label: 'Best Window', value: `${best.bestDay} ${String(best.bestHour).padStart(2, '0')}:00`, color: 'text-gold' },
                  { label: 'Chronotype', value: chronotype, color: 'text-indigo-300' },
                  { label: 'Ruling Planet', value: topPlanet, color: 'text-indigo-300' },
                ].map(stat => (
                  <div key={stat.label} className="border border-gold/10 rounded-lg p-2.5 bg-white/[0.01]">
                    <div className="font-mono text-[8px] text-cream-dim/40 tracking-widest uppercase mb-0.5">{stat.label}</div>
                    <div className={`font-mono text-[11px] font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ));
              })()}
            </div>

            {/* Key Insights — rich dynamic insights for free services + tease locked ones */}
            {(() => {
              const vis = isAuthed ? sorted : sorted.filter(s => FREE_IDS.has(s.id));
              const best = vis[0];
              const worst = vis[vis.length - 1];
              if (!best || !worst) return null;

              // Chronotype for free services
              const freeServices = isAuthed ? services : services.filter(s => FREE_IDS.has(s.id));
              const mornAvg = freeServices.reduce((a, s) => a + s.morningAvg, 0) / (freeServices.length || 1);
              const eveAvg = freeServices.reduce((a, s) => a + s.eveningAvg, 0) / (freeServices.length || 1);
              const chronoLabel = mornAvg > eveAvg + 3 ? 'mornings' : eveAvg > mornAvg + 3 ? 'evenings' : 'any time of day';

              // Total peaks across free services
              const totalPeaks = freeServices.reduce((a, s) => a + s.peakCount, 0);

              // Locked categories for anonymous
              const lockedServices = sorted.filter(s => !FREE_IDS.has(s.id));

              return (
                <div className="border border-gold/10 rounded-lg p-3.5 bg-white/[0.015] mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">💡</span>
                    <div className="font-mono text-[9px] text-gold tracking-widest uppercase font-bold">Key Insights</div>
                  </div>
                  <div className="text-[11px] text-cream-dim/70 leading-relaxed space-y-2">
                    {/* Strongest service */}
                    <p>
                      Your strongest alignment is <strong className="text-emerald-400">{best.icon} {best.name}</strong> (score {best.avgScore})
                      {best.trend === 'rising' ? ' and it\'s getting stronger — lean in!' : best.trend === 'falling' ? ', though energy is shifting. Act soon.' : ', with steady energy this week.'}
                    </p>

                    {/* Weakest service */}
                    {best !== worst && (
                      <p>
                        <strong className="text-red-400">{worst.icon} {worst.name}</strong> needs careful timing — only <strong className="text-amber-400">{worst.peakCount} golden windows</strong> available.
                        {worst.trend === 'rising' ? ' But it\'s improving!' : ''}
                      </p>
                    )}

                    {/* Golden hour reference */}
                    {goldenHour && (
                      <p>
                        ✨ Your <strong className="text-gold">golden hour</strong> today is at{' '}
                        <strong className="text-gold">{String(goldenHour.hour).padStart(2, '0')}:00</strong> for{' '}
                        <strong className="text-gold">{goldenHour.serviceIcon} {goldenHour.serviceName}</strong>
                        {goldenHour.score >= 62 ? ' — excellent alignment!' : goldenHour.score >= 45 ? ' — good window.' : ' — use it wisely.'}
                      </p>
                    )}

                    {/* Chronotype + total peaks */}
                    <p>
                      Based on your chart, you perform best during <strong className="text-indigo-300">{chronoLabel}</strong>.
                      You have <strong className="text-emerald-400">{totalPeaks} peak windows</strong> across your free categories this week.
                    </p>

                    {/* Locked categories teaser */}
                    {!isAuthed && lockedServices.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gold/10">
                        <p className="text-gold/70 mb-1.5">
                          🔒 <strong>{lockedServices.length} more categories</strong> are calculated but locked:
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {lockedServices.map(s => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full text-[10px] text-cream-dim/50"
                            >
                              <span className="opacity-50">{s.icon}</span> {s.name}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={onSignIn}
                          className="text-[11px] text-gold font-bold hover:text-gold-light underline underline-offset-2 transition-colors"
                        >
                          Sign in to see insights across all 8 life domains →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ═══ SWOT MATRIX ═══ */}
        {tab === 'swot' && matrix && (
          <motion.div key="swot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Strengths */}
              <div className="border border-emerald-500/20 rounded-lg p-4 bg-emerald-500/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">💪</span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Strengths</span>
                </div>
                <div className="space-y-2.5">
                  {matrix.strengths.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-[11px] text-cream font-bold mb-0.5">{item.title}</div>
                      <p className="text-[10px] text-cream-dim/60 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="border border-red-500/20 rounded-lg p-4 bg-red-500/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">⚡</span>
                  <span className="font-mono text-[10px] text-red-400 font-bold tracking-widest uppercase">Weaknesses</span>
                </div>
                <div className="space-y-2.5">
                  {matrix.weaknesses.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-[11px] text-cream font-bold mb-0.5">{item.title}</div>
                      <p className="text-[10px] text-cream-dim/60 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunities */}
              <div className="border border-blue-500/20 rounded-lg p-4 bg-blue-500/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">🚀</span>
                  <span className="font-mono text-[10px] text-blue-400 font-bold tracking-widest uppercase">Opportunities</span>
                </div>
                <div className="space-y-2.5">
                  {matrix.opportunities.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-[11px] text-cream font-bold mb-0.5">{item.title}</div>
                      <p className="text-[10px] text-cream-dim/60 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threats */}
              <div className="border border-amber-500/20 rounded-lg p-4 bg-amber-500/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">⚠️</span>
                  <span className="font-mono text-[10px] text-amber-400 font-bold tracking-widest uppercase">Threats</span>
                </div>
                <div className="space-y-2.5">
                  {matrix.threats.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-[11px] text-cream font-bold mb-0.5">{item.title}</div>
                      <p className="text-[10px] text-cream-dim/60 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ ACTION PLAN PREVIEW ═══ */}
        {tab === 'actions' && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Yoga action card */}
            {yogaSvc && (
              <div className="border border-gold/15 rounded-lg p-4 bg-white/[0.015] mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{yogaSvc.icon}</span>
                  <div className="flex-1">
                    <div className="font-mono text-xs font-bold text-cream">{yogaSvc.name}</div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold ${scoreColor(yogaSvc.avgScore)}`}>{yogaSvc.avgScore}/100</span>
                      <span className={`font-mono text-[10px] ${trendColor(yogaSvc.trend)}`}>{trendIcon(yogaSvc.trend)} {yogaSvc.trend}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px] text-cream-dim/70 leading-relaxed">
                  <p>
                    <strong className="text-gold">Schedule:</strong> Peak window on <strong className="text-gold">{yogaSvc.bestDay}</strong> at{' '}
                    <strong className="text-gold">{String(yogaSvc.bestHour).padStart(2, '0')}:00</strong>
                    {yogaSvc.bestScore >= 70 && <span className="text-emerald-400"> (score {yogaSvc.bestScore} — excellent!)</span>}
                  </p>
                  <p>
                    <strong className="text-gold">Strategy:</strong>{' '}
                    {yogaSvc.avgScore >= 50 && yogaSvc.trend === 'rising'
                      ? 'Power zone & rising — your body-mind alignment is strengthening. Increase session intensity.'
                      : yogaSvc.avgScore >= 50
                      ? `Strong foundation. ${yogaSvc.trend === 'falling' ? 'Front-load deep practice sessions this week.' : 'Maintain your rhythm.'}`
                      : yogaSvc.trend === 'rising'
                      ? 'Currently challenging but improving. Start with gentle sessions during peak windows.'
                      : `Strict timing needed — practice only during your ${yogaSvc.peakCount} golden windows for best results.`}
                  </p>
                  <p>
                    <strong className="text-gold">Planet:</strong> Dominated by <strong className="text-indigo-300">{yogaSvc.dominantPlanet}</strong>.
                    {yogaSvc.morningAvg > yogaSvc.eveningAvg + 3 ? ' Morning sessions are cosmically favoured.' : yogaSvc.eveningAvg > yogaSvc.morningAvg + 3 ? ' Evening sessions work better for you.' : ' Both morning and evening work well.'}
                  </p>
                </div>
              </div>
            )}

            {/* Health action card — only for signed-in users */}
            {healthSvc && isAuthed && (
              <div className="border border-gold/15 rounded-lg p-4 bg-white/[0.015] mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{healthSvc.icon}</span>
                  <div className="flex-1">
                    <div className="font-mono text-xs font-bold text-cream">{healthSvc.name}</div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold ${scoreColor(healthSvc.avgScore)}`}>{healthSvc.avgScore}/100</span>
                      <span className={`font-mono text-[10px] ${trendColor(healthSvc.trend)}`}>{trendIcon(healthSvc.trend)} {healthSvc.trend}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px] text-cream-dim/70 leading-relaxed">
                  <p>
                    <strong className="text-gold">Schedule:</strong> Best on <strong className="text-gold">{healthSvc.bestDay}</strong> at{' '}
                    <strong className="text-gold">{String(healthSvc.bestHour).padStart(2, '0')}:00</strong>
                    {healthSvc.bestScore >= 70 && <span className="text-emerald-400"> (score {healthSvc.bestScore})</span>}
                  </p>
                  <p>
                    <strong className="text-gold">Strategy:</strong>{' '}
                    {healthSvc.avgScore >= 50 && healthSvc.trend === 'rising'
                      ? 'Your vitality is surging — perfect time to start new health routines or fitness goals.'
                      : healthSvc.avgScore >= 50
                      ? `Solid health alignment. ${healthSvc.trend === 'falling' ? 'Prioritise rest and recovery now.' : 'Keep your wellness practices consistent.'}`
                      : healthSvc.trend === 'rising'
                      ? 'Health energy is building. Start gentle — the momentum will carry you forward.'
                      : `Be extra mindful with health decisions. Schedule check-ups and wellness activities during your ${healthSvc.peakCount} peak windows.`}
                  </p>
                  <p>
                    <strong className="text-gold">Planet:</strong> Governed by <strong className="text-indigo-300">{healthSvc.dominantPlanet}</strong>.
                    {healthSvc.dominantPlanet === 'Sun' ? ' Solar energy boosts vitality — early hours are powerful.' :
                     healthSvc.dominantPlanet === 'Moon' ? ' Lunar influence — hydration, rest, and emotional balance are key.' :
                     healthSvc.dominantPlanet === 'Mars' ? ' Mars drives physical energy — channel into exercise during peak hours.' :
                     ' Align health activities with your planetary windows for best results.'}
                  </p>
                </div>
              </div>
            )}

            {/* Meditation action card (free for anon) */}
            {meditSvc && (
              <div className="border border-gold/15 rounded-lg p-4 bg-white/[0.015] mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{meditSvc.icon}</span>
                  <div className="flex-1">
                    <div className="font-mono text-xs font-bold text-cream">{meditSvc.name}</div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold ${scoreColor(meditSvc.avgScore)}`}>{meditSvc.avgScore}/100</span>
                      <span className={`font-mono text-[10px] ${trendColor(meditSvc.trend)}`}>{trendIcon(meditSvc.trend)} {meditSvc.trend}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-[11px] text-cream-dim/70 leading-relaxed">
                  <p>
                    <strong className="text-gold">Schedule:</strong> Peak window on <strong className="text-gold">{meditSvc.bestDay}</strong> at{' '}
                    <strong className="text-gold">{String(meditSvc.bestHour).padStart(2, '0')}:00</strong>
                    {meditSvc.bestScore >= 70 && <span className="text-emerald-400"> (score {meditSvc.bestScore} — excellent!)</span>}
                  </p>
                  <p>
                    <strong className="text-gold">Strategy:</strong>{' '}
                    {meditSvc.avgScore >= 50 && meditSvc.trend === 'rising'
                      ? 'Deep stillness is amplified — extend your sessions and explore advanced techniques.'
                      : meditSvc.avgScore >= 50
                      ? `Solid meditation alignment. ${meditSvc.trend === 'falling' ? 'Anchor practice to peak windows before energy shifts.' : 'Maintain your rhythm and depth.'}`
                      : meditSvc.trend === 'rising'
                      ? 'Inner stillness is building. Start with short focused sessions — the momentum will deepen.'
                      : `Careful timing needed — meditate only during your ${meditSvc.peakCount} golden windows for best inner clarity.`}
                  </p>
                  <p>
                    <strong className="text-gold">Planet:</strong> Dominated by <strong className="text-indigo-300">{meditSvc.dominantPlanet}</strong>.
                    {meditSvc.morningAvg > meditSvc.eveningAvg + 3 ? ' Morning sessions are cosmically favoured for deeper states.' : meditSvc.eveningAvg > meditSvc.morningAvg + 3 ? ' Evening meditation resonates more strongly for you.' : ' Both morning and evening sessions work well.'}
                  </p>
                </div>
              </div>
            )}

            {/* Remaining services — ALL LOCKED for anonymous */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-bg/60 to-space-bg z-10 flex items-end justify-center pb-4">
                <button
                  onClick={onSignIn}
                  className="px-5 py-2.5 bg-gold/15 border border-gold/40 rounded-full font-mono text-[10px] text-gold tracking-widest uppercase font-bold hover:bg-gold/25 transition-all animate-pulse"
                >
                  🔓 Sign in to unlock all 8 action plans + weekly template
                </button>
              </div>
              <div className="blur-[3px] opacity-40 pointer-events-none">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {sorted.filter(s => !FREE_IDS.has(s.id)).slice(0, 6).map(s => (
                    <div key={s.id} className="border border-gold/10 rounded-lg p-2.5 bg-white/[0.01]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm opacity-50">{s.icon}</span>
                        <span className="font-mono text-[10px] text-cream-dim/40 truncate flex-1">{s.name}</span>
                        <span className="text-[10px] opacity-40">🔒</span>
                      </div>
                      <p className="text-[9px] text-cream-dim/25 mt-1">Full action plan available</p>
                    </div>
                  ))}
                </div>
                <div className="border border-gold/10 rounded-lg p-3 bg-white/[0.01]">
                  <div className="font-mono text-[9px] text-gold/40 tracking-widest uppercase">Ideal Weekly Template</div>
                  <div className="h-16 flex items-center justify-center text-cream-dim/20 text-[10px]">Mon–Sun schedule…</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom: 7-day limitation notice + locked categories */}
      <div className="px-5 pb-4 space-y-3">
        <div className="border border-amber-500/20 rounded-lg p-3 bg-amber-500/[0.03] flex items-start gap-2.5">
          <span className="text-sm mt-0.5">⏳</span>
          <div>
            <div className="font-mono text-[10px] text-amber-400 font-bold tracking-widest uppercase mb-0.5">7-Day Basic Analysis</div>
            <p className="text-[10px] text-cream-dim/55 leading-relaxed">
              This analysis uses only 7 days of planetary data — patterns need at least 30–90 days to become accurate.
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <button onClick={onSignIn} className="text-[10px] text-gold font-bold hover:text-gold-light underline underline-offset-2">
                Sign in
              </button>
              <span className="text-[10px] text-cream-dim/45">for deeper pattern matching, trend detection, and personalised strategies across all categories.</span>
            </div>
          </div>
        </div>

        {/* What you're missing — anonymous only */}
        {!isAuthed && (
          <div className="border border-indigo-500/15 rounded-lg p-3 bg-indigo-500/[0.02]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🔓</span>
              <div className="font-mono text-[9px] text-indigo-300 font-bold tracking-widest uppercase">What You Get With Sign-In</div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-cream-dim/60">
              {[
                { icon: '📊', text: '90-day deep analysis' },
                { icon: '🎯', text: 'All 8 life domains' },
                { icon: '📈', text: 'Trend & pattern detection' },
                { icon: '📋', text: 'Personalised action plans' },
                { icon: '🔔', text: 'Daily golden hour alerts' },
                { icon: '📅', text: 'Weekly scheduling template' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-1.5">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onSignIn}
              className="mt-2.5 w-full px-4 py-2 bg-gold/10 border border-gold/30 rounded-full font-mono text-[10px] text-gold tracking-widest uppercase font-bold hover:bg-gold/20 transition-all text-center"
            >
              🔓 Sign in free — unlock everything
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
