/**
 * DashboardPage — Returning users land here after auth.
 *
 * Shows: today's best windows, weekly overview, streak, push notification setup.
 * Reads stored windows from server (pre-calculated 90 days).
 * No re-entry of birth details needed — user profile has them.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signOutUser } from '../firebase';
import { Background } from '../components/Background';
import { WeeklyView } from '../components/WeeklyView';
import { ServiceSelector } from '../components/ServiceSelector';
import { TodaySummary } from '../components/TodaySummary';
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

  // Fetch access status
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/users/me/access', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAccessDays(data.daysLeft ?? 3);
          setHasPaid(data.paid ?? false);
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

  // Fetch saved windows from server
  const fetchWindows = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const res = await fetch(
        `/api/windows?uid=${user.uid}&startDate=${start.toISOString().slice(0, 10)}&endDate=${end.toISOString().slice(0, 10)}&service=${selectedService}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch windows');
      const data = await res.json();

      // Server tells us how many days are unlocked
      if (data.accessDays != null) setAccessDays(data.accessDays);
      if (data.hasPaid != null) setHasPaid(data.hasPaid);

      // Transform server rows to HourWindow[]
      const wins: HourWindow[] = (data.windows ?? data ?? []).map((w: any) => ({
        date: new Date(w.date + 'T00:00:00'),
        hour: w.hour,
        score: w.score,
        activity: w.activity,
        horaRuler: w.horaRuler ?? w.hora_ruler ?? '',
        planets: w.planets ?? [],
        isMorning: w.isMorning ?? w.is_morning ?? false,
      }));
      setWindows(wins);
    } catch (e) {
      console.warn('[dashboard] fetch windows:', e);
      // Falls back to local calculation if server windows unavailable
    }
  }, [user, selectedService]);

  useEffect(() => { fetchWindows(); }, [fetchWindows]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-space-bg">
        <div className="w-8 h-8 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
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
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-5 md:px-12 md:py-6 border-b border-gold/10">
        <Link to="/" className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
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
                <Link
                  to="/app"
                  onClick={() => setUserMenuOpen(false)}
                  className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10"
                >
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

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-xl sm:text-2xl font-display font-semibold mb-1">
            {getGreeting()}, {user.displayName?.split(' ')[0] ?? 'Explorer'}
          </h1>
          <p className="font-mono text-xs sm:text-sm text-cream-dim tracking-widest uppercase">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
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
              <p className="text-cream-dim mb-4 text-sm sm:text-base">No windows calculated yet.</p>
              <Link
                to="/app"
                className="inline-block px-6 py-3 bg-gold text-space-bg font-mono text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all rounded-sm"
              >
                Calculate My Windows
              </Link>
            </div>
          )}
        </motion.div>
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
