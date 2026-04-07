/**
 * LandingPage — Proof-first. Celebrity Vedic hook at top.
 *
 * Flow: Hero ("This was written in their charts at birth.") →
 *       Celebrity proof cards with Vedic tags (THE HOOK) →
 *       "What's written in yours?" CTA →
 *       Four services (what you get) →
 *       How it works (for skeptics) →
 *       Final CTA + stats → Footer
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Background } from '../components/Background';
import ModernExplainer from '../components/modern-explainer/ModernExplainer';
import { HowItWorksModal } from '../components/HowItWorksModal';
import { CELEBRITIES, CelebrityProfile } from '../data/celebrities';
import { getWeeklyWindows } from '../lib/scoring';
import { computeDecision, DecisionResult } from '../features/decide/utils/engine';
import type { HourWindow, ServiceId } from '../types';

/* ── Vedic insight tags — the psychological hook ─────────────────────── */
const CELEB_VEDIC_TAGS: Record<string, { tag: string; color: string }[]> = {
  oprah: [
    { tag: '☽ Moon debilitated — childhood darkness was real.', color: 'text-indigo-300' },
    { tag: '♄ Saturn exalted — built a billion-dollar empire from it anyway.', color: 'text-emerald-400' },
  ],
  ronaldo: [
    { tag: '♃ Born from poverty. Jupiter debilitated, then cancelled.', color: 'text-amber-300' },
    { tag: 'Neecha Bhanga Raja Yoga forged a king.', color: 'text-gold' },
    { tag: '♀ Venus exalted — obsessive perfection in every touch.', color: 'text-pink-300' },
  ],
  elon: [
    { tag: '⚔️ Mars exalted — wired to build, break and dominate.', color: 'text-red-400' },
  ],
};

/* ── Display order: Oprah → Ronaldo → Elon (recognition → story → punchline) */
const CELEB_ORDER = ['oprah', 'ronaldo', 'elon'];

/* ── Celebrity result — pre-computed on page load (all client-side) ───── */
interface CelebResult {
  celeb: CelebrityProfile;
  topWindow: HourWindow | null;
  decision: DecisionResult | null;
}

function computeCelebResult(celeb: CelebrityProfile): CelebResult {
  try {
    const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
    const wins = getWeeklyWindows(celeb.birthDate, celeb.birthTime, celeb.lat, celeb.lng, weekStart, celeb.service, 3);
    const todayStr = new Date().toDateString();
    const now = new Date().getHours();
    const todayWins = wins.filter(w => new Date(w.date).toDateString() === todayStr && w.hour >= now).sort((a, b) => b.score - a.score);
    const decision = computeDecision(celeb.birthDate, celeb.birthTime, celeb.lat, celeb.lng, celeb.service);
    return { celeb, topWindow: todayWins[0] || null, decision };
  } catch { return { celeb, topWindow: null, decision: null }; }
}

function fmtHour(h: number): string { return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`; }
function scoreColorClass(s: number): string {
  if (s >= 62) return 'text-emerald-400'; if (s >= 45) return 'text-gold';
  if (s >= 30) return 'text-amber-400'; return 'text-red-400';
}

/* ── Component ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [hiwOpen, setHiwOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [celebResults, setCelebResults] = useState<CelebResult[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      // Compute in display order
      const ordered = CELEB_ORDER
        .map(id => CELEBRITIES.find(c => c.id === id)!)
        .filter(Boolean);
      setCelebResults(ordered.map(c => computeCelebResult(c)));
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-1 md:px-12 md:py-3 border-b border-gold/10">
        <a href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="" className="h-10 w-10 sm:h-20 sm:w-20 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
            <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] sm:text-xs tracking-widest text-cream-dim/60 hover:text-gold/70 transition-colors font-medium">by timecept.com</a>
          </div>
        </a>
        <button onClick={() => setMobileMenuOpen(o => !o)} className="sm:hidden px-3 py-2 border border-gold/30 rounded-lg text-gold">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <Link to="/app" className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gold text-space-bg font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-full shadow-[0_0_18px_rgba(212,168,75,0.55)] hover:shadow-[0_0_32px_rgba(212,168,75,0.85)] hover:scale-105 transition-all animate-pulse">⏰ Golden Hours</Link>
          <Link to="/app?product=swot" className="px-3 py-2 sm:px-5 sm:py-2.5 bg-indigo-500 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-full shadow-[0_0_14px_rgba(99,102,241,0.4)] hover:shadow-[0_0_28px_rgba(99,102,241,0.65)] hover:scale-105 transition-all">✦ SWOT</Link>
          <Link to="/decide" className="px-3 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-full shadow-[0_0_14px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_rgba(16,185,129,0.65)] hover:scale-105 transition-all">🎯 Act or Wait?</Link>
          <Link to="/plans" className="px-3 py-2 sm:px-5 sm:py-2.5 bg-purple-600 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-full shadow-[0_0_14px_rgba(147,51,234,0.4)] hover:shadow-[0_0_28px_rgba(147,51,234,0.65)] hover:scale-105 transition-all">📋 Life Plans</Link>
        </div>
      </nav>

      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="sm:hidden relative z-20 mx-4 mt-2 p-3 bg-space-card border border-gold/20 rounded-lg flex flex-col gap-2">
          <Link to="/app" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 bg-gold/10 border border-gold/30 rounded-lg text-gold font-mono text-xs tracking-widest uppercase font-bold">⏰ Golden Hours — Free</Link>
          <Link to="/app?product=swot" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 font-mono text-xs tracking-widest uppercase font-bold">✦ SWOT Analysis</Link>
          <Link to="/decide" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-mono text-xs tracking-widest uppercase font-bold">🎯 Act or Wait? — Free</Link>
          <Link to="/plans" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-300 font-mono text-xs tracking-widest uppercase font-bold">📋 Life Blueprints</Link>
        </motion.div>
      )}

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* ══════════════════════════════════════════════════════════
            Section 1: HERO — 2 lines, maximum intrigue
            ══════════════════════════════════════════════════════════ */}
        <section className="pt-12 sm:pt-20 pb-6 sm:pb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5 backdrop-blur-md mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
            </span>
            <span className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-gold font-bold">Live engine · Real birth data · Computed now</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-display font-semibold leading-tight mb-4"
          >
            This was written in their{' '}
            <em className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-amber-300 not-italic">charts at birth.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-base sm:text-xl text-cream-dim/70 max-w-xl mx-auto"
          >
            Sūrya Siddhānta insight, decrypted by the Timeceptor engine.
          </motion.p>
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 2: CELEBRITY PROOF — THE HOOK (Vedic tags visible)
            ══════════════════════════════════════════════════════════ */}
        <section className="pb-10 sm:pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {celebResults.length > 0 ? celebResults.map((cr, idx) => {
              const tags = CELEB_VEDIC_TAGS[cr.celeb.id] ?? [];
              return (
                <motion.div
                  key={cr.celeb.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 + idx * 0.14 }}
                  className="border border-gold/25 rounded-xl p-5 sm:p-6 bg-white/[0.02] hover:bg-white/[0.05] hover:border-gold/45 transition-all flex flex-col"
                >
                  {/* Identity row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/40 flex items-center justify-center text-2xl flex-shrink-0">
                      {cr.celeb.emoji}
                    </div>
                    <div>
                      <div className="font-display font-semibold text-cream">{cr.celeb.name}</div>
                      <div className="font-mono text-[10px] text-cream-dim/60 tracking-widest font-medium">{cr.celeb.location.split(',')[0]}</div>
                    </div>
                  </div>

                  {/* ★ VEDIC INSIGHT TAGS — The entire hook ★ */}
                  <div className="space-y-1.5 border-l-2 border-gold/25 pl-3 mb-4">
                    {tags.map((t, i) => (
                      <p key={i} className={`text-[11px] sm:text-xs leading-snug font-mono ${t.color}`}>{t.tag}</p>
                    ))}
                  </div>

                  {/* Live computed result */}
                  {cr.topWindow && (
                    <div className="bg-black/25 rounded-lg p-3 border border-white/5 mb-4">
                      <div className="font-mono text-[10px] text-gold/70 tracking-widest uppercase mb-1.5 font-medium">
                        {cr.celeb.name.split(' ')[0]}'s best hour today
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-xl font-bold tabular-nums ${scoreColorClass(cr.topWindow.score)}`}>
                          {fmtHour(cr.topWindow.hour)}
                        </div>
                        <div className="flex-1">
                          <div className={`font-mono text-xs font-bold ${scoreColorClass(cr.topWindow.score)}`}>
                            Score {cr.topWindow.score}
                          </div>
                          <div className="font-mono text-[10px] text-cream-dim/65 capitalize font-medium">
                            {cr.topWindow.horaRuler} hora · {cr.celeb.serviceLabel}
                          </div>
                        </div>
                        {cr.decision && (
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            cr.decision.verdict === 'go' ? 'border-emerald-400/50 text-emerald-400' :
                            cr.decision.verdict === 'caution' ? 'border-amber-400/50 text-amber-400' :
                            'border-red-400/50 text-red-400'
                          }`}>
                            {cr.decision.currentScore}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA — see full product demo for this celeb */}
                  <div className="mt-auto flex gap-2">
                    <Link
                      to={`/demo/${cr.celeb.id}`}
                      className="flex-1 block text-center px-4 py-2.5 border border-gold/25 text-gold font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-gold/10 hover:border-gold/40 transition-all"
                    >
                      See {cr.celeb.name.split(' ')[0]}'s Results →
                    </Link>
                  </div>
                </motion.div>
              );
            }) : [0, 1, 2].map(i => (
              <div key={i} className="border border-gold/10 rounded-xl p-5 sm:p-6 bg-white/[0.01] animate-pulse">
                <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-gold/10" /><div className="flex-1"><div className="h-3 bg-gold/10 rounded w-24 mb-2" /><div className="h-2 bg-gold/5 rounded w-16" /></div></div>
                <div className="h-16 bg-gold/5 rounded mb-4" />
                <div className="h-16 bg-gold/5 rounded mb-4" />
                <div className="h-10 bg-gold/5 rounded" />
              </div>
            ))}
          </div>

          {/* ★ Peak curiosity CTA — "What's written in yours?" ★ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10 sm:mt-14"
          >
            <p className="text-lg sm:text-2xl font-display text-cream-dim mb-2">
              What's written in <em className="text-gold not-italic">yours?</em>
            </p>
            <p className="text-sm text-cream-dim/70 mb-6 font-mono tracking-widest">Just your birth date, time and city. That's all.</p>
            <Link
              to="/app"
              className="inline-block px-10 sm:px-16 py-4 sm:py-5 bg-gold text-space-bg font-mono text-sm sm:text-base font-bold tracking-widest uppercase hover:bg-gold-light transition-all shadow-[0_0_40px_rgba(212,168,75,0.4)] hover:shadow-[0_0_60px_rgba(212,168,75,0.7)] rounded-full"
            >
              ✦ View Your Story in 2 Mins Free
            </Link>
            <p className="mt-3 font-mono text-[10px] sm:text-xs text-cream-dim/60 tracking-wider font-medium">No card · Takes 2 minutes · Results in seconds</p>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 3: FOUR SERVICES — What you get
            ══════════════════════════════════════════════════════════ */}
        <section className="py-10 sm:py-16 border-t border-gold/10">
          <div className="text-center mb-8 sm:mb-12">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl sm:text-4xl font-display font-semibold mb-3">
              What You'll Get
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-sm text-cream-dim max-w-lg mx-auto">
              Four powerful tools — calculated from your birth chart.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Golden Hours */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group border-2 border-gold/30 rounded-xl p-5 sm:p-6 bg-gold/[0.03] hover:bg-gold/[0.07] hover:border-gold/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div><span className="text-2xl">⏰</span><h3 className="text-lg sm:text-xl font-display font-semibold text-gold mt-1">Golden Hours</h3><p className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim/70 mt-1 font-medium">3-day free · 90 days paid</p></div>
                <span className="px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full font-mono text-[10px] text-emerald-400 tracking-widest uppercase font-bold">free</span>
              </div>
              <p className="text-sm text-cream-dim leading-relaxed mb-4">Your personal hourly schedule — scored 0-100 for yoga, business, love, health & 4 more. See which hours are golden, which to avoid.</p>
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-4">
                <div className="font-mono text-[10px] text-gold/70 tracking-widest uppercase mb-2 font-medium">Sample: Today's Hours</div>
                <div className="flex gap-1 items-end h-10">
                  {[32,45,58,72,85,67,44,38,62,78,55,40].map((v,i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height:`${v}%`, background: v>=62?'#34d399':v>=45?'#F4A11D':'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1"><span className="font-mono text-[10px] text-cream-dim/50 font-medium">6AM</span><span className="font-mono text-[10px] text-cream-dim/50 font-medium">6PM</span></div>
              </div>
              <Link to="/app" className="block text-center px-4 py-2.5 bg-gold/10 border border-gold/30 rounded-lg font-mono text-xs tracking-widest uppercase text-gold hover:bg-gold/20 hover:border-gold/50 transition-all font-bold">Find My Golden Hours →</Link>
            </motion.div>

            {/* SWOT */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="group border-2 border-indigo-500/30 rounded-xl p-5 sm:p-6 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.07] hover:border-indigo-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div><span className="text-2xl">✦</span><h3 className="text-lg sm:text-xl font-display font-semibold text-indigo-300 mt-1">SWOT Analysis</h3><p className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim/70 mt-1 font-medium">90-day deep scan · Pro</p></div>
                <span className="px-2 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-full font-mono text-[10px] text-indigo-300 tracking-widest uppercase font-bold">pro</span>
              </div>
              <p className="text-sm text-cream-dim leading-relaxed mb-4">Strengths, Weaknesses, Opportunities & Threats across 8 life domains. Know your cosmic advantages — and blind spots.</p>
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-4">
                <div className="font-mono text-[10px] text-indigo-400/70 tracking-widest uppercase mb-2 font-medium">Sample Matrix</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2"><div className="font-mono text-[10px] text-emerald-400 font-bold mb-0.5">STRENGTHS</div><div className="text-[10px] sm:text-xs text-cream-dim/70">Business · Creative peak</div></div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-2"><div className="font-mono text-[10px] text-red-400 font-bold mb-0.5">WEAKNESSES</div><div className="text-[10px] sm:text-xs text-cream-dim/70">Love · Evenings low</div></div>
                  <div className="bg-gold/10 border border-gold/20 rounded p-2"><div className="font-mono text-[10px] text-gold font-bold mb-0.5">OPPORTUNITIES</div><div className="text-[10px] sm:text-xs text-cream-dim/70">Wed mornings peak</div></div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2"><div className="font-mono text-[10px] text-purple-300 font-bold mb-0.5">THREATS</div><div className="text-[10px] sm:text-xs text-cream-dim/70">Saturn Fri evenings</div></div>
                </div>
              </div>
              <Link to="/app?product=swot" className="block text-center px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg font-mono text-xs tracking-widest uppercase text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all font-bold">Get My SWOT Analysis →</Link>
            </motion.div>

            {/* Act or Wait */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="group border-2 border-emerald-500/30 rounded-xl p-5 sm:p-6 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.07] hover:border-emerald-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div><span className="text-2xl">🎯</span><h3 className="text-lg sm:text-xl font-display font-semibold text-emerald-400 mt-1">Act or Wait?</h3><p className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim/70 mt-1 font-medium">Free for all users</p></div>
                <span className="px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full font-mono text-[10px] text-emerald-400 tracking-widest uppercase font-bold">free</span>
              </div>
              <p className="text-sm text-cream-dim leading-relaxed mb-4">Should you post that reel now? Start a workout? Make a business call? Instant answer with your next golden window.</p>
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-4">
                <div className="font-mono text-[10px] text-emerald-400/70 tracking-widest uppercase mb-2 font-medium">Sample Verdict</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400/50 flex items-center justify-center"><span className="text-xl font-bold text-emerald-400">78</span></div>
                  <div><div className="text-sm font-bold text-emerald-400">✓ Go for it!</div><div className="text-xs text-cream-dim/70 font-medium">Business · Jupiter hora</div></div>
                </div>
              </div>
              <Link to="/decide" className="block text-center px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-mono text-xs tracking-widest uppercase text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all font-bold">Should I Act Now? →</Link>
            </motion.div>

            {/* Life Blueprints */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="group border-2 border-purple-500/30 rounded-xl p-5 sm:p-6 bg-purple-500/[0.03] hover:bg-purple-500/[0.07] hover:border-purple-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div><span className="text-2xl">📋</span><h3 className="text-lg sm:text-xl font-display font-semibold text-purple-300 mt-1">Life Blueprints</h3><p className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim/70 mt-1 font-medium">3 free · 3 pro plans</p></div>
                <span className="px-2 py-1 bg-purple-500/15 border border-purple-500/30 rounded-full font-mono text-[10px] text-purple-300 tracking-widest uppercase font-bold">free+pro</span>
              </div>
              <p className="text-sm text-cream-dim leading-relaxed mb-4">Multi-phase daily plans — Launch Day, Dating, Fitness, Content Creator & more. Each phase timed to your strongest hour.</p>
              <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-4">
                <div className="font-mono text-[10px] text-purple-300/70 tracking-widest uppercase mb-2 font-medium">Sample: Launch Plan</div>
                <div className="space-y-1.5">
                  {[{phase:'Creative Session',time:'7 AM',score:82},{phase:'Strategy & Execution',time:'11 AM',score:74},{phase:'Social Blitz',time:'4 PM',score:68}].map((p,i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:p.score>=62?'#34d399':'#F4A11D'}} />
                      <span className="text-xs text-cream-dim/80 flex-1">{p.phase}</span>
                      <span className="font-mono text-[10px] text-cream-dim/65 font-medium">{p.time}</span>
                      <span className={`font-mono text-[10px] font-bold ${p.score>=62?'text-emerald-400':'text-gold'}`}>{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/plans" className="block text-center px-4 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-lg font-mono text-xs tracking-widest uppercase text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all font-bold">Build My Life Plan →</Link>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 4: HOW IT WORKS — for the skeptics
            ══════════════════════════════════════════════════════════ */}
        <section className="py-10 sm:py-16 border-t border-gold/10">
          <div className="text-center mb-10 sm:mb-12">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5 backdrop-blur-md mb-6">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim font-bold">For the skeptics</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl sm:text-5xl md:text-6xl font-display font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cream via-gold-light to-gold">
              How Timeceptor Works
            </motion.h2>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative group p-[2px] rounded-xl bg-gradient-to-b from-gold/30 via-gold/5 to-transparent shadow-2xl shadow-gold/5">
            <div className="rounded-xl overflow-hidden bg-space-bg"><ModernExplainer /></div>
            <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/5 group-hover:border-gold/20 transition-colors duration-500" />
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 5: FINAL CTA + service tags + stats
            ══════════════════════════════════════════════════════════ */}
        <section className="py-8 sm:py-12 text-center border-t border-gold/10">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl sm:text-3xl md:text-5xl font-display font-semibold leading-tight mb-3 sm:mb-4">
            Your best hour, <em className="text-gold-light not-italic">calculated.</em>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-sm sm:text-base text-cream-dim max-w-lg mx-auto mb-6 sm:mb-8 leading-relaxed">
            Yoga, gym, business, creativity, love — each gets its own optimal window, scored and timed.
          </motion.p>
          <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8">
            {['🧘 Yoga','🏋️ Gym','🕯️ Meditation','📈 Business','🎨 Creative','💛 Love','🌿 Health','📱 Social'].map(s => (
              <span key={s} className="px-3 py-1.5 rounded-sm border border-gold/15 bg-gold/5 font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim">{s}</span>
            ))}
          </div>
          <div className="max-w-md mx-auto mb-6">
            <Link to="/app" className="block text-center px-8 py-4 bg-gold text-space-bg font-bold uppercase tracking-widest text-sm rounded-full shadow-[0_0_20px_rgba(212,168,75,0.5)] hover:shadow-[0_0_40px_rgba(212,168,75,0.8)] hover:scale-105 transition-all">
              ✦ Get Mine Free
            </Link>
          </div>
          <p className="font-mono text-[10px] sm:text-xs text-cream-dim/70 tracking-wider mb-8 font-medium">No card required · Enter birth details · Results in seconds</p>

          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto border-t border-gold/10 pt-8">
            {[{num:'7',label:'Vedic Planets'},{num:'168',label:'Hours / Week'},{num:'90',label:'Days Ahead'}].map(s => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="py-4 sm:py-6">
                <div className="text-2xl sm:text-3xl font-display font-semibold text-gold mb-1">{s.num}</div>
                <div className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <a href="/" className="text-sm tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">Timeceptor</a>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 font-mono text-[10px] sm:text-xs text-cream-dim tracking-widest uppercase">
            <button onClick={() => setHiwOpen(true)} className="hover:text-gold transition-colors">⚙️ How It Works</button>
            <span className="hidden sm:inline opacity-50">·</span>
            <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
            <span className="hidden sm:inline opacity-50">·</span>
            <span>© 2026</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5 mt-4 pt-4 border-t border-gold/5">
          <a href="https://www.facebook.com/timceptor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-cream-dim/60 tracking-widest hover:text-gold transition-colors">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
          <a href="https://www.instagram.com/timceptor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-cream-dim/60 tracking-widest hover:text-gold transition-colors">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Instagram
          </a>
          <a href="mailto:hello@timecept.com" className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-cream-dim/60 tracking-widest hover:text-gold transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            hello@timecept.com
          </a>
        </div>
      </footer>

      <HowItWorksModal open={hiwOpen} onClose={() => setHiwOpen(false)} />
    </div>
  );
}
