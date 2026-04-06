/**
 * SwotPage — SWOT Analysis for paid users.
 *
 * Computes 90 days of windows across all services,
 * identifies Strengths, Weaknesses, Opportunities, Threats
 * based on planetary timing patterns.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signOutUser } from '../firebase';
import { Background } from '../components/Background';
import { getWeeklyWindows } from '../lib/scoring';
import { SERVICES } from '../services';
import type { HourWindow, ServiceId } from '../types';

interface ServiceAnalysis {
  id: ServiceId;
  name: string;
  icon: string;
  avgScore: number;
  peakCount: number;   // hours above 62
  weakCount: number;    // hours below 30
  bestDay: string;
  bestHour: number;
  bestScore: number;
  trend: 'rising' | 'falling' | 'stable';
}

interface SwotItem {
  title: string;
  detail: string;
  icon: string;
}

export default function SwotPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [birthData, setBirthData] = useState<{
    birthDate: string; birthTime: string; lat: number; lng: number;
  } | null>(null);
  const [serviceData, setServiceData] = useState<ServiceAnalysis[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Auth gate
  useEffect(() => {
    return onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        navigate('/app', { replace: true });
      }
    });
  }, [navigate]);

  // Fetch profile + access
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const [accessRes, profileRes] = await Promise.all([
          fetch('/api/users/me/access', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (accessRes.ok) {
          const data = await accessRes.json();
          setHasPaid(data.paid ?? false);
          if (!data.paid) {
            navigate('/dashboard', { replace: true });
            return;
          }
        }
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.birthDate && profile.birthTime && profile.lat != null) {
            setBirthData({
              birthDate: profile.birthDate,
              birthTime: profile.birthTime,
              lat: profile.lat,
              lng: profile.lng,
            });
          }
        }
      } catch { /* ignore */ }
    })();
  }, [user, navigate]);

  // Compute SWOT data across all services (heavy — runs once)
  useEffect(() => {
    if (!birthData || !hasPaid) return;
    setComputing(true);

    // Use setTimeout to not block the main thread
    setTimeout(() => {
      try {
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);

        const analyses: ServiceAnalysis[] = SERVICES.map(svc => {
          const wins = getWeeklyWindows(
            birthData.birthDate, birthData.birthTime,
            birthData.lat, birthData.lng,
            weekStart, svc.id, 90,
          );

          const scores = wins.map(w => w.score);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const peaks = wins.filter(w => w.score >= 62);
          const weaks = wins.filter(w => w.score < 30);

          // Best single window
          const best = wins.reduce((a, b) => a.score > b.score ? a : b);
          const bestDate = new Date(best.date);
          const bestDay = bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          // Trend: compare first 30 days avg vs last 30 days avg
          const first30 = wins.filter((_, i) => Math.floor(i / 24) < 30);
          const last30 = wins.filter((_, i) => Math.floor(i / 24) >= 60);
          const avgFirst = first30.reduce((a, w) => a + w.score, 0) / (first30.length || 1);
          const avgLast = last30.reduce((a, w) => a + w.score, 0) / (last30.length || 1);
          const diff = avgLast - avgFirst;
          const trend = diff > 2 ? 'rising' : diff < -2 ? 'falling' : 'stable';

          return {
            id: svc.id, name: svc.name, icon: svc.icon,
            avgScore: Math.round(avg),
            peakCount: peaks.length,
            weakCount: weaks.length,
            bestDay, bestHour: best.hour, bestScore: best.score,
            trend,
          };
        });

        setServiceData(analyses);
      } catch (e) {
        console.warn('[swot] compute error:', e);
      } finally {
        setComputing(false);
      }
    }, 50);
  }, [birthData, hasPaid]);

  // Derive SWOT matrix from service data
  const swot = useMemo(() => {
    if (serviceData.length === 0) return null;

    const sorted = [...serviceData].sort((a, b) => b.avgScore - a.avgScore);
    const topServices = sorted.slice(0, 3);
    const bottomServices = sorted.slice(-2);
    const risingServices = serviceData.filter(s => s.trend === 'rising');
    const fallingServices = serviceData.filter(s => s.trend === 'falling');
    const peakRich = [...serviceData].sort((a, b) => b.peakCount - a.peakCount).slice(0, 2);

    const strengths: SwotItem[] = topServices.map(s => ({
      title: `${s.icon} ${s.name} — Strong alignment`,
      detail: `Average score ${s.avgScore}/100 with ${s.peakCount} peak hours over 90 days. Your planetary configuration naturally supports this activity.`,
      icon: s.icon,
    }));

    const weaknesses: SwotItem[] = bottomServices.map(s => ({
      title: `${s.icon} ${s.name} — Needs careful timing`,
      detail: `Average score ${s.avgScore}/100 with ${s.weakCount} low-energy hours. Plan around peak windows only and avoid forcing this activity during weak periods.`,
      icon: s.icon,
    }));

    const opportunities: SwotItem[] = [
      ...risingServices.slice(0, 2).map(s => ({
        title: `${s.icon} ${s.name} — Rising energy trend`,
        detail: `Planetary transits are strengthening for ${s.name.toLowerCase()} over the next 90 days. Consider increasing focus here.`,
        icon: s.icon,
      })),
      ...peakRich.map(s => ({
        title: `${s.icon} ${s.name} — ${s.peakCount} golden windows`,
        detail: `You have ${s.peakCount} peak windows (score 62+). Best opportunity: ${s.bestDay} at ${String(s.bestHour).padStart(2, '0')}:00 (score ${s.bestScore}).`,
        icon: s.icon,
      })),
    ].slice(0, 3);

    const threats: SwotItem[] = [
      ...fallingServices.slice(0, 2).map(s => ({
        title: `${s.icon} ${s.name} — Declining energy`,
        detail: `Transit energy is weakening for ${s.name.toLowerCase()}. Schedule critical ${s.name.toLowerCase()} activities in the first 30 days while conditions are still supportive.`,
        icon: s.icon,
      })),
      ...bottomServices.filter(s => s.weakCount > 500).map(s => ({
        title: `${s.icon} ${s.name} — Many low-energy hours`,
        detail: `${s.weakCount} hours score below 30. Forcing this activity at wrong times could feel draining. Stick strictly to your golden windows.`,
        icon: s.icon,
      })),
    ].slice(0, 3);

    // Ensure at least some items
    if (opportunities.length === 0) {
      opportunities.push({
        title: '✦ All services stable',
        detail: 'Your 90-day outlook is steady across all services. Use your strongest areas consistently.',
        icon: '✦',
      });
    }
    if (threats.length === 0) {
      threats.push({
        title: '✦ No significant threats',
        detail: 'No services show declining trends. Maintain your current timing practices.',
        icon: '✦',
      });
    }

    return { strengths, weaknesses, opportunities, threats };
  }, [serviceData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-space-bg gap-4">
        <div className="w-10 h-10 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
        <p className="font-mono text-xs text-cream-dim tracking-widest uppercase animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-5 md:px-12 md:py-6 border-b border-gold/10">
        <Link to="/" className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/dashboard" className="font-mono text-xs text-cream-dim tracking-widest uppercase hover:text-gold transition-colors hidden sm:block">
            Dashboard
          </Link>
          <Link to="/app" className="font-mono text-xs text-cream-dim tracking-widest uppercase hover:text-gold transition-colors hidden sm:block">
            Calculator
          </Link>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 border border-gold/20 rounded-sm px-3 py-1.5 hover:border-gold/40 transition-colors"
            >
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                : <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </span>
              }
              <span className="hidden sm:block font-mono text-xs text-cream-dim tracking-widest truncate max-w-[120px]">
                {user.displayName ?? user.email}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-space-card border border-gold/20 rounded-sm shadow-xl z-50">
                <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                  className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">
                  Dashboard
                </Link>
                <Link to="/app" onClick={() => setUserMenuOpen(false)}
                  className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">
                  Calculator
                </Link>
                <button
                  onClick={() => { signOutUser(); setUserMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-gold mb-2">
            ✦ SWOT Analysis
          </h1>
          <p className="font-mono text-xs sm:text-sm text-cream-dim tracking-widest uppercase">
            90-day planetary timing intelligence across all life domains
          </p>
        </motion.div>

        {computing ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-2 border-gold/40 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gold font-mono text-sm tracking-widest uppercase mb-2">
              Computing SWOT Analysis
            </p>
            <p className="text-cream-dim text-xs">
              Analyzing 90 days × 8 services × 24 hours = 17,280 planetary windows…
            </p>
          </div>
        ) : !birthData ? (
          <div className="text-center py-16">
            <p className="text-cream-dim mb-4">Enter your birth details first to generate your SWOT analysis.</p>
            <Link to="/app" className="inline-block px-6 py-3 bg-gold text-space-bg font-mono text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all rounded-sm">
              Set Up My Chart
            </Link>
          </div>
        ) : swot ? (
          <>
            {/* Service overview grid */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-10">
              <h2 className="font-mono text-xs tracking-widest uppercase text-gold/60 mb-4">Service Performance Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {serviceData.sort((a, b) => b.avgScore - a.avgScore).map(s => (
                  <div key={s.id} className="border border-gold/10 rounded-lg p-4 bg-white/[0.02]">
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="font-mono text-xs text-cream-dim tracking-wide mb-1">{s.name}</div>
                    <div className="text-2xl font-bold text-gold">{s.avgScore}</div>
                    <div className="font-mono text-[10px] text-cream-dim tracking-wide mt-1">
                      {s.peakCount} peaks · {s.trend === 'rising' ? '↑ rising' : s.trend === 'falling' ? '↓ falling' : '→ stable'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* SWOT Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {/* Strengths */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="border border-emerald-500/20 rounded-lg p-5 bg-emerald-500/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-emerald-400 text-lg font-bold">S</span>
                  <span className="font-mono text-xs tracking-widest uppercase text-emerald-400 font-bold">Strengths</span>
                </div>
                <div className="space-y-4">
                  {swot.strengths.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-xs font-bold text-emerald-300 mb-1">{item.title}</div>
                      <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Weaknesses */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="border border-red-500/20 rounded-lg p-5 bg-red-500/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-red-400 text-lg font-bold">W</span>
                  <span className="font-mono text-xs tracking-widest uppercase text-red-400 font-bold">Weaknesses</span>
                </div>
                <div className="space-y-4">
                  {swot.weaknesses.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-xs font-bold text-red-300 mb-1">{item.title}</div>
                      <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Opportunities */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="border border-gold/20 rounded-lg p-5 bg-gold/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gold text-lg font-bold">O</span>
                  <span className="font-mono text-xs tracking-widest uppercase text-gold font-bold">Opportunities</span>
                </div>
                <div className="space-y-4">
                  {swot.opportunities.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-xs font-bold text-gold/80 mb-1">{item.title}</div>
                      <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Threats */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="border border-purple-500/20 rounded-lg p-5 bg-purple-500/[0.03]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-purple-400 text-lg font-bold">T</span>
                  <span className="font-mono text-xs tracking-widest uppercase text-purple-400 font-bold">Threats</span>
                </div>
                <div className="space-y-4">
                  {swot.threats.map((item, i) => (
                    <div key={i}>
                      <div className="font-mono text-xs font-bold text-purple-300 mb-1">{item.title}</div>
                      <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Key insights */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="border border-gold/10 rounded-lg p-6 bg-white/[0.01] mb-8">
              <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">Key Insights</h3>
              <div className="space-y-3 text-sm text-cream-dim leading-relaxed">
                {serviceData.length > 0 && (() => {
                  const best = serviceData.reduce((a, b) => a.avgScore > b.avgScore ? a : b);
                  const worst = serviceData.reduce((a, b) => a.avgScore < b.avgScore ? a : b);
                  const totalPeaks = serviceData.reduce((a, s) => a + s.peakCount, 0);
                  return (
                    <>
                      <p>
                        <strong className="text-gold">{best.icon} {best.name}</strong> is your strongest domain with an average score of <strong className="text-emerald-400">{best.avgScore}</strong>/100
                        and <strong className="text-emerald-400">{best.peakCount}</strong> peak windows.
                        Prioritise this activity for maximum planetary support.
                      </p>
                      <p>
                        <strong className="text-red-300">{worst.icon} {worst.name}</strong> scores lowest at <strong className="text-red-300">{worst.avgScore}</strong>/100.
                        This doesn't mean avoid it — it means timing is crucial. Only engage during your specific golden windows.
                      </p>
                      <p>
                        Across all 8 services, you have <strong className="text-gold">{totalPeaks.toLocaleString()}</strong> peak opportunities
                        in the next 90 days. That's roughly <strong className="text-gold">{Math.round(totalPeaks / 90)}</strong> golden windows per day.
                      </p>
                    </>
                  );
                })()}
              </div>
            </motion.div>

            {/* Back to dashboard */}
            <div className="text-center">
              <Link to="/dashboard"
                className="inline-block px-6 py-3 border border-gold/30 text-gold font-mono text-xs tracking-widest uppercase hover:bg-gold/10 transition-all rounded-sm">
                ← Back to Dashboard
              </Link>
            </div>
          </>
        ) : null}
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <span className="font-mono text-xs text-cream-dim tracking-widest uppercase">
          Ancient timing · Modern life · © 2026
        </span>
      </footer>
    </div>
  );
}
