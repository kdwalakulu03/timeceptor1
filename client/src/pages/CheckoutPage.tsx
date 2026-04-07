/**
 * CheckoutPage — /checkout
 *
 * Two-tier pricing: Silver (90 days) + Gold (1 year).
 * Shows what free users get vs what paid users unlock.
 * Handles Stripe checkout for both tiers.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle } from '../firebase';
import { Background } from '../components/Background';

/* ── Plan definitions ─────────────────────────────────────────────── */
const FREE_FEATURES = [
  { text: '3-day rolling forecast', detail: 'Updated every day you visit', green: true },
  { text: 'Visit daily = unlimited free days', detail: 'Results refresh with each visit', green: true },
  { text: 'Push / Telegram / Email alerts', detail: 'Set up once, never miss a peak', green: true },
  { text: 'Yoga & Meditation services', detail: '2 of 8 categories', green: false },
  { text: 'Basic SWOT analysis', detail: '7-day data only', green: false },
  { text: 'Share cosmic cards', detail: 'PNG export', green: false },
];

const SILVER_FEATURES = [
  { text: '90-day deep forecast', detail: '3 months of timing' },
  { text: 'All 8 service categories', detail: 'Business, Love, Health…' },
  { text: 'Pattern detection', detail: 'Weekly trends & cycles' },
  { text: 'Full SWOT analysis', detail: '90-day data depth' },
  { text: 'Life Blueprints', detail: 'Multi-phase life plans' },
  { text: 'Act or Wait? engine', detail: 'Decision timing optimizer' },
  { text: 'Push & Telegram alerts', detail: 'Never miss a peak' },
];

const GOLD_FEATURES = [
  { text: '1-year complete forecast', detail: '365 days of precision' },
  { text: 'All Silver features', detail: 'Everything included' },
  { text: 'Ultra-precise calculations', detail: 'Sub-hour accuracy' },
  { text: 'Longer foresight horizon', detail: 'See further ahead' },
  { text: 'No false positives', detail: 'Deeper data = better accuracy' },
  { text: 'Seasonal pattern analysis', detail: 'Quarter-by-quarter insights' },
  { text: 'Priority support', detail: 'Direct Telegram support' },
  { text: 'Early access to new features', detail: 'Beta features first' },
];

type PlanTier = 'silver' | 'gold';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanTier | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [paidUntil, setPaidUntil] = useState<string | null>(null);

  useEffect(() => {
    return onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  // Check payment status
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
          setHasPaid(data.paid ?? false);
          if (data.paidUntil) setPaidUntil(data.paidUntil);
        }
      } catch { /* ignore */ }
    })();
  }, [user]);

  // Check URL for payment result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setHasPaid(true);
      window.history.replaceState({}, '', '/checkout');
    }
  }, []);

  const handleCheckout = useCallback(async (tier: PlanTier) => {
    if (!user) {
      // Sign in first, then come back
      try {
        await signInWithGoogle();
      } catch { return; }
      return; // onAuthChange will update state, user can click again
    }

    setCheckoutLoading(tier);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.alreadyPaid) {
        setHasPaid(true);
        if (data.paidUntil) setPaidUntil(data.paidUntil);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.warn('[checkout]', e);
    } finally {
      setCheckoutLoading(null);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-space-bg">
        <div className="w-10 h-10 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-3 md:px-12 border-b border-gold/10">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="" className="h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
          <span className="text-xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="font-mono text-xs text-cream-dim tracking-widest uppercase hover:text-gold transition-colors">
              ← Dashboard
            </Link>
          ) : (
            <Link to="/app" className="font-mono text-xs text-cream-dim tracking-widest uppercase hover:text-gold transition-colors">
              ← Calculator
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="font-display text-3xl sm:text-4xl text-cream font-bold mb-2">
            Unlock Your <span className="text-gold">Golden Hours</span>
          </h1>
          <p className="font-mono text-xs text-cream-dim/60 tracking-wider max-w-lg mx-auto">
            The longer the forecast, the more accurate the patterns.
          </p>
        </motion.div>

        {/* Why Longer = More Accurate — compact horizontal strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 border border-gold/15 rounded-xl p-4 bg-gold/[0.02]"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex items-center gap-2.5 justify-center">
              <span className="text-xl">7️⃣</span>
              <div className="text-left">
                <p className="font-mono text-[10px] text-cream-dim/50 tracking-widest uppercase leading-tight">7 Days · Free</p>
                <p className="text-[11px] text-cream-dim/60 leading-snug">Snapshot. Attempt to detect patterns.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 justify-center">
              <span className="text-xl">🪙</span>
              <div className="text-left">
                <p className="font-mono text-[10px] text-cream-dim/50 tracking-widest uppercase leading-tight">90 Days · Silver</p>
                <p className="text-[11px] text-cream-dim/60 leading-snug">Cycles emerge. Trends detected.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 justify-center">
              <span className="text-xl">✦</span>
              <div className="text-left">
                <p className="font-mono text-[10px] text-gold/60 tracking-widest uppercase leading-tight">365 Days · Gold</p>
                <p className="text-[11px] text-cream leading-snug">Max precision. Avoid false positives.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Already paid banner */}
        {hasPaid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-5 border-2 border-emerald-500/40 rounded-xl bg-emerald-500/[0.06] text-center"
          >
            <p className="font-display text-lg text-emerald-400 font-bold mb-1">✦ You have full access!</p>
            <p className="text-sm text-cream-dim/70">
              {paidUntil ? `Active until ${new Date(paidUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Enjoy your cosmic timing journey'}
            </p>
            <Link
              to="/dashboard"
              className="inline-block mt-3 px-6 py-2.5 bg-gold text-space-bg font-bold text-xs tracking-widest uppercase rounded-full hover:shadow-[0_0_15px_rgba(212,168,75,0.5)] transition-all"
            >
              Go to Dashboard →
            </Link>
          </motion.div>
        )}

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Free tier ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.02]"
          >
            <div className="h-1 bg-gradient-to-r from-white/10 to-white/5" />
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-2xl">🌙</span>
                <div>
                  <h3 className="font-display text-lg text-cream font-semibold">Free</h3>
                  <p className="font-mono text-[10px] text-cream-dim/50 tracking-widest uppercase">Explorer</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-cream-dim/70">$0</span>
                <span className="text-xs text-cream-dim/40 font-mono">forever</span>
              </div>

              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`text-sm mt-0.5 flex-shrink-0 ${f.green ? 'text-emerald-400' : 'text-cream-dim/40'}`}>
                      {f.green ? '●' : '○'}
                    </span>
                    <div>
                      <span className="text-sm text-cream-dim/70">{f.text}</span>
                      <span className="block text-[10px] text-cream-dim/35 font-mono">{f.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <Link
                  to="/app"
                  className="inline-block w-full py-3 border border-white/[0.12] rounded-full font-mono text-xs text-cream-dim/60 tracking-widest uppercase hover:border-gold/30 hover:text-cream-dim transition-all text-center"
                >
                  Current Plan
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ── Silver — 90 days ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-gold/20 rounded-2xl overflow-hidden bg-gold/[0.02]"
          >
            <div className="h-1 bg-gradient-to-r from-gray-400/40 to-gray-300/20" />
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-2xl">🪙</span>
                <div>
                  <h3 className="font-display text-lg text-cream font-semibold">Silver</h3>
                  <p className="font-mono text-[10px] text-cream-dim/50 tracking-widest uppercase">90-Day Access</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-cream">$9<span className="text-xl">.99</span></span>
                <span className="text-xs text-cream-dim/40 font-mono">one-time</span>
              </div>
              <p className="text-[10px] text-cream-dim/40 font-mono mb-6">≈ $0.11/day · No subscription</p>

              <ul className="space-y-3 mb-8">
                {SILVER_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-400 text-sm mt-0.5 flex-shrink-0">✦</span>
                    <div>
                      <span className="text-sm text-cream">{f.text}</span>
                      <span className="block text-[10px] text-cream-dim/50 font-mono">{f.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <button
                  onClick={() => handleCheckout('silver')}
                  disabled={checkoutLoading === 'silver' || hasPaid}
                  className="w-full py-3 bg-gradient-to-r from-gray-300 to-gray-400 text-space-bg font-bold text-xs tracking-widest uppercase rounded-full hover:shadow-[0_0_20px_rgba(180,180,190,0.3)] transition-all disabled:opacity-50"
                >
                  {checkoutLoading === 'silver' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-space-bg/40 border-t-space-bg rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : hasPaid ? 'Already Unlocked' : (
                    <>🔓 Unlock Silver</>
                  )}
                </button>
                {!user && !hasPaid && (
                  <p className="text-[10px] text-cream-dim/35 font-mono mt-2">Sign-in required at checkout</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Gold — 1 year ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="border-2 border-gold/40 rounded-2xl overflow-hidden bg-gold/[0.04] relative"
          >
            {/* Best value badge */}
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-1 bg-gold text-space-bg text-[9px] font-bold font-mono tracking-widest uppercase rounded-full shadow-lg shadow-gold/20">
                Best Value
              </span>
            </div>

            <div className="h-1.5 bg-gradient-to-r from-gold/70 to-amber-400/50" />
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-2xl">✦</span>
                <div>
                  <h3 className="font-display text-lg text-gold font-semibold">Gold</h3>
                  <p className="font-mono text-[10px] text-gold/60 tracking-widest uppercase">1-Year Access</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-gold">$77</span>
                <span className="text-xs text-gold/50 font-mono">one-time</span>
              </div>
              <p className="text-[10px] text-gold/40 font-mono mb-6">≈ $0.21/day · Save 48% vs Silver</p>

              <ul className="space-y-3 mb-8">
                {GOLD_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-gold text-sm mt-0.5 flex-shrink-0">✦</span>
                    <div>
                      <span className="text-sm text-cream">{f.text}</span>
                      <span className="block text-[10px] text-gold/40 font-mono">{f.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                <button
                  onClick={() => handleCheckout('gold')}
                  disabled={checkoutLoading === 'gold' || hasPaid}
                  className="w-full py-3.5 bg-gradient-to-r from-gold to-amber-500 text-space-bg font-bold text-sm tracking-widest uppercase rounded-full shadow-[0_4px_20px_rgba(212,168,75,0.4)] hover:shadow-[0_4px_30px_rgba(212,168,75,0.6)] transition-all disabled:opacity-50"
                >
                  {checkoutLoading === 'gold' ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-space-bg/40 border-t-space-bg rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : hasPaid ? 'Already Unlocked' : (
                    <>✦ Unlock Gold</>
                  )}
                </button>
                {!user && !hasPaid && (
                  <p className="text-[10px] text-gold/35 font-mono mt-2">Sign-in required at checkout</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Comparison note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-cream-dim/40 font-mono tracking-wider">
            One-time payments · No subscriptions · No auto-renewal · Secure Stripe checkout
          </p>
        </motion.div>
      </main>

      {/* Disclaimer */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <div className="border-t border-gold/10 pt-6">
          <p className="text-[10px] text-cream-dim/35 leading-relaxed text-center font-mono">
            <strong className="text-cream-dim/50">Disclaimer:</strong> Timeceptor calculates planetary timing using a mathematical algorithm based on the <em>Surya Siddhanta</em> system — an ancient Indian astronomical treatise. Results are computational outputs from planetary hour (Hora) positions, not personal advice. Please consider other practical factors — health, finances, relationships, professional guidance — when making life decisions. This tool is for informational and entertainment purposes.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <div className="flex items-center gap-4 font-mono text-xs text-cream-dim tracking-widest uppercase">
          <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
          <span className="opacity-50">·</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
