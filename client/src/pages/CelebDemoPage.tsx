/**
 * CelebDemoPage — Full product showcase for a celebrity.
 *
 * Uses the DemoShowcase carousel to auto-play through 4 products.
 * Zero interaction required — the page IS the demo.
 * Wikipedia link for birth data verification = trust builder.
 * CTA: "What's written in yours? → Find Out Free"
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Background } from '../components/Background';
import { getWeeklyWindows } from '../lib/scoring';
import { computeDecision, type DecisionResult } from '../features/decide/utils/engine';
import { SERVICES } from '../services';
import { getCelebrity, CELEBRITIES } from '../data/celebrities';
import { DemoShowcase, type DemoData, type ServiceSummary, type SwotMatrix } from '../components/demo-showcase';
import type { HourWindow } from '../types';

/* ── Vedic insight tags (same as landing page) ───────────────────────── */
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

/* ── Wikipedia links for birth data verification ─────────────────────── */
const CELEB_WIKI: Record<string, string> = {
  oprah:   'https://en.wikipedia.org/wiki/Oprah_Winfrey',
  ronaldo: 'https://en.wikipedia.org/wiki/Cristiano_Ronaldo',
  elon:    'https://en.wikipedia.org/wiki/Elon_Musk',
};

/* ── Component ────────────────────────────────────────────────────────── */
export default function CelebDemoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const celeb = getCelebrity(id ?? '');

  const [windows, setWindows] = useState<HourWindow[]>([]);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [serviceSummaries, setServiceSummaries] = useState<ServiceSummary[]>([]);
  const [computing, setComputing] = useState(true);

  // Redirect if invalid celeb
  useEffect(() => {
    if (!celeb) navigate('/', { replace: true });
  }, [celeb, navigate]);

  // Compute all data on mount
  useEffect(() => {
    if (!celeb) return;
    setComputing(true);

    const timer = setTimeout(() => {
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);

      // 1. Golden Hours — 7 days for the celeb's primary service
      try {
        const wins = getWeeklyWindows(
          celeb.birthDate, celeb.birthTime,
          celeb.lat, celeb.lng,
          weekStart, celeb.service, 7,
        );
        setWindows(wins);
      } catch (e) { console.warn('[demo] windows:', e); }

      // 2. Act or Wait — current verdict
      try {
        const d = computeDecision(
          celeb.birthDate, celeb.birthTime,
          celeb.lat, celeb.lng,
          celeb.service,
        );
        setDecision(d);
      } catch (e) { console.warn('[demo] decision:', e); }

      // 3. SWOT — summary across all 8 services (7 days for demo)
      try {
        const summaries: ServiceSummary[] = SERVICES.map(svc => {
          const wins = getWeeklyWindows(
            celeb.birthDate, celeb.birthTime,
            celeb.lat, celeb.lng,
            weekStart, svc.id, 7,
          );
          const scores = wins.map(w => w.score);
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          const peaks = wins.filter(w => w.score >= 62).length;
          const weaks = wins.filter(w => w.score < 30).length;
          const best = wins.reduce((a, b) => a.score > b.score ? a : b);
          const bestDate = new Date(best.date);
          const bestDay = bestDate.toLocaleDateString('en-US', { weekday: 'short' });
          return {
            id: svc.id, name: svc.name, icon: svc.icon,
            avgScore: avg, peakCount: peaks, weakCount: weaks,
            bestDay, bestHour: best.hour,
          };
        });
        setServiceSummaries(summaries.sort((a, b) => b.avgScore - a.avgScore));
      } catch (e) { console.warn('[demo] swot:', e); }

      setComputing(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [celeb]);

  // Today's windows for TodaySummary
  const todayWindows = useMemo(() => {
    const todayStr = new Date().toDateString();
    return windows.filter(w => new Date(w.date).toDateString() === todayStr);
  }, [windows]);

  // SWOT matrix items
  const swotMatrix = useMemo(() => {
    if (serviceSummaries.length === 0) return null;
    const sorted = [...serviceSummaries];
    const strengths = sorted.slice(0, 2);
    const weaknesses = sorted.slice(-2).reverse();
    // Opportunities: services with most peaks
    const byPeaks = [...serviceSummaries].sort((a, b) => b.peakCount - a.peakCount);
    const opportunities = byPeaks.slice(0, 2);
    // Threats: services with most weak hours
    const byWeaks = [...serviceSummaries].sort((a, b) => b.weakCount - a.weakCount);
    const threats = byWeaks.slice(0, 2);
    return { strengths, weaknesses, opportunities, threats };
  }, [serviceSummaries]);

  // Other celebs for navigation
  const otherCelebs = CELEBRITIES.filter(c => c.id !== id);

  if (!celeb) return null;

  const tags = CELEB_VEDIC_TAGS[celeb.id] ?? [];
  const wikiUrl = CELEB_WIKI[celeb.id] ?? '#';

  // Build data bundle for the carousel
  const demoData: DemoData = { celeb, windows, todayWindows, decision, serviceSummaries, swotMatrix };

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-1 md:px-12 md:py-3 border-b border-gold/10">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="" className="h-10 w-10 sm:h-20 sm:w-20 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
            <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] sm:text-xs tracking-widest text-cream-dim/60 hover:text-gold/70 transition-colors font-medium">by timecept.com</a>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/" className="hidden sm:flex items-center gap-2 font-mono text-xs text-cream-dim tracking-widest uppercase border border-gold/25 rounded-full px-4 py-2 hover:border-gold/50 hover:text-gold transition-all">
            ← Home
          </Link>
          <Link to="/app" className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gold text-space-bg font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-full shadow-[0_0_18px_rgba(212,168,75,0.55)] hover:shadow-[0_0_32px_rgba(212,168,75,0.85)] hover:scale-105 transition-all">
            Get Mine Free
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Celebrity Identity + Vedic Tags ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-10"
        >
          <div className="flex items-start gap-4 sm:gap-5 mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/40 flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
              {celeb.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-cream mb-1">
                {celeb.name}
              </h1>
              <p className="font-mono text-xs text-cream-dim/60 tracking-widest mb-1">
                {celeb.location} · Born {new Date(celeb.birthDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm text-cream-dim/70 mb-3">{celeb.tagline}</p>
              <a
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] text-cream-dim/60 tracking-widest uppercase hover:text-gold/70 transition-colors font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Verify birth data on Wikipedia
              </a>
            </div>
          </div>

          {/* Vedic insight tags */}
          {tags.length > 0 && (
            <div className="border-l-2 border-gold/25 pl-4 py-2 space-y-1.5 bg-gold/[0.02] rounded-r-lg">
              <div className="font-mono text-[10px] text-gold/70 tracking-widest uppercase mb-1 font-medium">Vedic birth chart insights</div>
              {tags.map((t, i) => (
                <p key={i} className={`text-sm leading-snug font-mono ${t.color}`}>{t.tag}</p>
              ))}
            </div>
          )}
        </motion.div>

        {/* Demo context banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 border border-gold/20 rounded-xl bg-gold/[0.03] text-center"
        >
          <p className="font-mono text-xs text-gold tracking-widest uppercase font-bold mb-1">
            Live Demo — This is what {celeb.name.split(' ')[0]} would see
          </p>
          <p className="text-xs text-cream-dim/60">
            All results below are computed in real-time from {celeb.name.split(' ')[0]}'s actual birth data. No cache, no tricks.
          </p>
        </motion.div>

        {computing ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-2 border-gold/40 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="font-mono text-sm text-gold tracking-widest uppercase mb-2">Computing {celeb.name.split(' ')[0]}'s cosmic data…</p>
            <p className="text-xs text-cream-dim/50">Analyzing planetary hours across 7 days × 8 services</p>
          </div>
        ) : (
          <>
            {/* ── Product Carousel ──────────────────────────────── */}
            <DemoShowcase data={demoData} />

            {/* ══════════════════════════════════════════════════════
                CTA: "What's written in yours?"
                ══════════════════════════════════════════════════════ */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="py-10 sm:py-14 text-center border-t border-gold/10"
            >
              <p className="text-lg sm:text-2xl font-display text-cream-dim mb-2">
                What's written in <em className="text-gold not-italic">yours?</em>
              </p>
              <p className="text-sm text-cream-dim/50 mb-6 font-mono tracking-widest">
                Just your birth date, time and city. That's all.
              </p>
              <Link
                to="/app"
                className="inline-block px-10 sm:px-16 py-4 sm:py-5 bg-gold text-space-bg font-mono text-sm sm:text-base font-bold tracking-widest uppercase hover:bg-gold-light transition-all shadow-[0_0_40px_rgba(212,168,75,0.4)] hover:shadow-[0_0_60px_rgba(212,168,75,0.7)] rounded-full"
              >
                ✦ View Your Story in 2 Mins Free
              </Link>
              <p className="mt-3 font-mono text-[10px] text-cream-dim/40 tracking-wider">
                No card · Takes 2 minutes · Results in seconds
              </p>
            </motion.section>

            {/* Other celebs */}
            {otherCelebs.length > 0 && (
              <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="pb-8 border-t border-gold/10 pt-8"
              >
                <div className="font-mono text-[10px] text-cream-dim/40 tracking-widest uppercase mb-4 text-center">See how Timeceptor works for others</div>
                <div className="flex justify-center gap-3 sm:gap-4">
                  {otherCelebs.map(c => (
                    <Link
                      key={c.id}
                      to={`/demo/${c.id}`}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gold/20 rounded-xl bg-white/[0.02] hover:bg-gold/[0.05] hover:border-gold/35 transition-all"
                    >
                      <span className="text-xl">{c.emoji}</span>
                      <div>
                        <div className="font-mono text-xs text-cream font-medium">{c.name}</div>
                        <div className="font-mono text-[8px] text-cream-dim/40 tracking-widest uppercase">{c.serviceLabel}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}
          </>
        )}
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <Link to="/" className="text-sm tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">Timeceptor</Link>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 font-mono text-[10px] sm:text-xs text-cream-dim tracking-widest uppercase">
          <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
          <span className="hidden sm:inline opacity-30">·</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
