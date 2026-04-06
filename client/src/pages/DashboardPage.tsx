/**
 * DashboardPage — Returning users land here after auth.
 *
 * Shows: today's best windows, weekly overview, streak, push notification setup.
 * Reads stored windows from server (pre-calculated 90 days).
 * No re-entry of birth details needed — user profile has them.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signOutUser } from '../firebase';
import { Background } from '../components/Background';
import { HowItWorksModal } from '../components/HowItWorksModal';
import { WeeklyView } from '../components/WeeklyView';
import { ServiceSelector } from '../components/ServiceSelector';
import { TodaySummary } from '../components/TodaySummary';
import { getWeeklyWindows } from '../lib/scoring';
import type { HourWindow, ServiceId } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceId>('yoga');
  const [windows, setWindows] = useState<HourWindow[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [accessDays, setAccessDays] = useState(3);
  const [hasPaid, setHasPaid] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hiwOpen, setHiwOpen] = useState(false);
  const [birthData, setBirthData] = useState<{
    birthDate: string; birthTime: string; lat: number; lng: number; locationName: string;
  } | null>(null);

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

  // Check push support
  useEffect(() => {
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  // Fetch profile (birth data + access status) in one shot
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        // Access info
        const accessRes = await fetch('/api/users/me/access', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (accessRes.ok) {
          const data = await accessRes.json();
          setAccessDays(data.daysLeft ?? 3);
          setHasPaid(data.paid ?? false);
        }
        // Birth data from profile
        const profileRes = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.birthDate && profile.birthTime && profile.lat != null) {
            setBirthData({
              birthDate: profile.birthDate,
              birthTime: profile.birthTime,
              lat: profile.lat,
              lng: profile.lng,
              locationName: profile.locationName ?? '',
            });
            // Trigger server-side precalc in background (for push notifications)
            fetch('/api/users/setup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                birthDate: profile.birthDate,
                birthTime: profile.birthTime,
                lat: profile.lat,
                lng: profile.lng,
                locationName: profile.locationName ?? '',
              }),
            }).catch(() => {}); // fire-and-forget
          }
        }
      } catch { /* ignore */ }
    })();
  }, [user]);

  // Check URL for payment result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setHasPaid(true);
      setAccessDays(90);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Stripe checkout handler — "Unlock Your Golden Hours"
  const handleUnlock = useCallback(async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.alreadyPaid) {
        setHasPaid(true);
        setAccessDays(90);
        return;
      }
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert('Something went wrong — please try again.');
      }
    } catch (e) {
      console.warn('[stripe]', e);
      alert('Could not connect to payment server. Please try again later.');
    } finally {
      setCheckoutLoading(false);
    }
  }, [user]);

  // Compute windows client-side when birth data or service selection changes
  // Paid users get 90 days, free users get 7 days
  const computeDays = hasPaid ? 90 : 7;
  useEffect(() => {
    if (!birthData) return;
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    try {
      const wins = getWeeklyWindows(
        birthData.birthDate,
        birthData.birthTime,
        birthData.lat,
        birthData.lng,
        weekStart,
        selectedService,
        computeDays,
      );
      setWindows(wins);
    } catch (e) {
      console.warn('[dashboard] compute windows:', e);
    }
  }, [birthData, selectedService, computeDays]);

  // Enable push notifications
  const enablePush = async () => {
    if (!user || !pushSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          (window as any).__VAPID_PUBLIC_KEY__ || ''
        ),
      });
      const token = await user.getIdToken();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setPushEnabled(true);
    } catch (e) {
      console.warn('[push] subscribe failed:', e);
    }
  };

  // Full-screen loading: auth check or fetching birth data
  const isDataLoading = loading || (user && !birthData && windows.length === 0);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-space-bg gap-4">
        <div className="w-10 h-10 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
        <p className="font-mono text-xs text-cream-dim tracking-widest uppercase animate-pulse">
          Loading your cosmic data…
        </p>
      </div>
    );
  }

  if (!user) return null;

  const todayWindows = windows.filter(w => {
    const d = new Date(w.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const bestToday = todayWindows.length > 0
    ? todayWindows.reduce((a, b) => a.score > b.score ? a : b)
    : null;

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-1 md:px-12 md:py-3 border-b border-gold/10">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="" className="h-10 w-10 sm:h-20 sm:w-20 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
            <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] sm:text-[10px] tracking-widest text-cream-dim/50 hover:text-gold/70 transition-colors">by timecept.com</a>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {hasPaid && (
            <Link to="/swot" className="hidden sm:flex items-center gap-2 font-mono text-sm text-gold tracking-widest uppercase border-2 border-gold/55 rounded-full px-5 py-2.5 hover:border-gold/90 hover:bg-gold/10 hover:text-gold-light transition-all">
              ✦ SWOT Analysis
            </Link>
          )}
          <Link to="/decide" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            🎯 Act or Wait?
          </Link>
          <Link to="/plans" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            📋 Life Blueprints
          </Link>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 rounded-full p-1 hover:bg-gold/5 transition-all"
            >
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full ring-2 ring-gold/45 ring-offset-2 ring-offset-[#07071a]" />
                : <span className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/35 to-gold/10 ring-2 ring-gold/45 ring-offset-2 ring-offset-[#07071a] flex items-center justify-center text-gold text-base font-semibold font-display">
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </span>
              }
              <span className="hidden sm:block font-mono text-sm text-cream-dim tracking-widest truncate max-w-[140px]">
                {user.displayName ?? user.email}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-space-card border border-gold/20 rounded-sm shadow-xl z-50">
                {hasPaid && (
                  <Link
                    to="/swot"
                    onClick={() => setUserMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-gold hover:text-gold-light hover:bg-gold/5 transition-colors border-b border-gold/10"
                  >
                    ✦ SWOT Analysis
                  </Link>
                )}
                <Link
                  to="/app"
                  onClick={() => setUserMenuOpen(false)}
                  className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10"
                >
                  ⏰ Golden Hour
                </Link>
                <Link
                  to="/decide"
                  onClick={() => setUserMenuOpen(false)}
                  className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10"
                >
                  🎯 Act or Wait?
                </Link>
                <Link
                  to="/plans"
                  onClick={() => setUserMenuOpen(false)}
                  className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10"
                >
                  📋 Life Blueprints
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

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">
              {getGreeting()}, {user.displayName?.split(' ')[0] ?? 'Explorer'}
            </h1>
            <p className="font-mono text-xs sm:text-sm text-cream-dim tracking-widest uppercase">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {birthData && (
            <div className="text-left sm:text-right shrink-0">
              <p className="font-mono text-xs text-cream-dim tracking-wide">
                Your Birthday = {(() => { const [y,m,d] = birthData.birthDate.split('-'); return new Date(Number(y), Number(m)-1, Number(d)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }); })()}
              </p>
              {birthData.locationName && (
                <p className="font-mono text-xs text-cream-dim tracking-wide mt-0.5">
                  Location = {birthData.locationName}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Push notification banner */}
        {pushSupported && !pushEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 sm:p-5 border border-gold/20 rounded-sm bg-gold/5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
          >
            <div className="flex-1">
              <div className="font-mono text-xs tracking-widest uppercase text-gold font-bold mb-1">
                🔔 Enable Push Notifications
              </div>
              <p className="text-xs sm:text-sm text-cream-dim leading-relaxed">
                Get alerted before your peak windows — right on your phone, no app needed.
              </p>
            </div>
            <button
              onClick={enablePush}
              className="px-5 py-2.5 bg-gold text-space-bg font-mono text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all rounded-sm whitespace-nowrap"
            >
              Enable
            </button>
          </motion.div>
        )}

        {pushEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-3 border border-emerald-500/20 rounded-sm bg-emerald-500/5 text-center"
          >
            <span className="font-mono text-xs tracking-widest uppercase text-emerald-400">✓ Push notifications active</span>
          </motion.div>
        )}

        {/* Today's summary */}
        {bestToday && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 sm:mb-8"
          >
            <TodaySummary windows={todayWindows} />
          </motion.div>
        )}

        {/* SWOT Analysis CTA for non-paid users */}
        {!hasPaid && windows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-6"
          >
            <button
              onClick={() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full p-5 border-2 border-indigo-500/30 rounded-lg bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12] hover:border-indigo-500/50 transition-all text-left flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                ✦
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm tracking-widest uppercase text-indigo-300 font-bold mb-1">
                  SWOT Analysis About You
                </div>
                <p className="text-xs text-cream-dim leading-relaxed">
                  Discover your Strengths, Weaknesses, Opportunities & Threats across 90 days × 8 life domains
                </p>
              </div>
              <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* Service selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6 sm:mb-8"
        >
          <ServiceSelector selected={selectedService} onSelect={setSelectedService} />
        </motion.div>

        {/* Weekly view */}
        <motion.div
          id="results-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {windows.length > 0 ? (
            <WeeklyView
              windows={windows}
              unlockedDays={hasPaid ? 90 : accessDays}
              onUnlock={handleUnlock}
              user={user}
              selectedService={selectedService}
            />
          ) : (
            <div className="text-center py-12 sm:py-16">
              <p className="text-cream-dim mb-4 text-sm sm:text-base">
                {hasPaid
                  ? 'Enter your birth details once to unlock your personal cosmic windows.'
                  : 'No windows calculated yet.'}
              </p>
              <Link
                to="/app"
                className="inline-block px-6 py-3 bg-gold text-space-bg font-mono text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all rounded-sm"
              >
                {hasPaid ? '✦ Set Up My Chart' : 'Calculate My Windows'}
              </Link>
            </div>
          )}
        </motion.div>

        {/* Premium status badge for paid users */}
        {hasPaid && windows.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-gold/20 rounded-full bg-gold/5">
              <span className="text-gold text-xs">✦</span>
              <span className="font-mono text-xs text-gold tracking-widest uppercase font-semibold">
                Full Access · {accessDays} days remaining
              </span>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 font-mono text-xs text-cream-dim tracking-widest uppercase">
          <button onClick={() => setHiwOpen(true)} className="hover:text-gold transition-colors">⚙️ How It Works</button>
          <span className="hidden md:inline opacity-30">·</span>
          <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
          <span className="hidden md:inline opacity-30">·</span>
          <span>© 2026</span>
        </div>
      </footer>

      <HowItWorksModal open={hiwOpen} onClose={() => setHiwOpen(false)} />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
