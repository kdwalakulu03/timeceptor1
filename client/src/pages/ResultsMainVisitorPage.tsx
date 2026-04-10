/**
 * ResultsMainVisitorPage — Anonymous visitor results hub.
 *
 * Two product categories displayed as clickable cards:
 *   1. Timeceptor Products   — Golden Hours, SWOT Analysis, Photo Card
 *   2. Astro Products        — Horoscope Chart, Dasha, Predictions, Health, Remedies
 *
 * Each product opens in its own popup modal (ProductModal) so they can be
 * debugged, tested, and expanded independently.
 *
 * Birth data arrives via URL search params (set by /app form submission).
 * All computation happens client-side — no auth, no API calls.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { calculateChart, ChartData } from '../lib/astrology';
import { getWeeklyWindows } from '../lib/scoring';
import { SERVICES } from '../services';
import { HourWindow, ServiceId } from '../types';
import { PLANETS } from '../constants';
import { Background } from '../components/Background';
import {
  ProductModal,
  HoroscopeChartProduct,
  DashaProduct,
  PredictionProduct,
  HealthProduct,
  RemediesProduct,
  GoldenHourProduct,
  SwotProduct,
  PhotoCardProduct,
  ReelProduct,
} from '../components/visitor-products';
import type {
  BirthData,
  VisitorComputedData,
  ProductCardDef,
} from '../components/visitor-products';
import type { SwotServiceSummary, SwotMatrix } from '../components/free-cards/types';

/* ── Product card definitions ──────────────────────────────────── */

const TIMECEPTOR_PRODUCTS: ProductCardDef[] = [
  {
    id: 'golden-hour',
    title: 'Golden Hours',
    icon: '✨',
    description: 'Your best planetary hour windows for today — schedule tasks at peak energy.',
    category: 'timeceptor',
    freePromo: true,
  },
  {
    id: 'swot',
    title: 'SWOT Analysis',
    icon: '⊞',
    description: '8-service strength/weakness analysis with trends and morning vs evening performance.',
    category: 'timeceptor',
    freePromo: true,
  },
  {
    id: 'photo-card',
    title: 'Share Card',
    icon: '🎨',
    description: 'Generate a beautiful cosmic timing card — download or share on social media.',
    category: 'timeceptor',
    freePromo: true,
  },
];

const ASTRO_PRODUCTS: ProductCardDef[] = [
  {
    id: 'horoscope',
    title: 'Horoscope Chart',
    icon: '🪐',
    description: 'Your Vedic birth chart (Rasi) with all 9 planets, houses, and ascendant.',
    category: 'astro',
  },
  {
    id: 'dasha',
    title: 'Dasha Periods',
    icon: '📅',
    description: 'Vimshottari Maha & Antar Dasha — past, present, and future planetary periods.',
    category: 'astro',
  },
  {
    id: 'prediction',
    title: 'What Stars Say',
    icon: '⭐',
    description: 'Personality insights and life themes from your planetary positions.',
    category: 'astro',
  },
  {
    id: 'health',
    title: 'Health Precautions',
    icon: '🩺',
    description: 'Body area analysis with precautions based on planet-house placements.',
    category: 'astro',
  },
  {
    id: 'remedies',
    title: 'Remedies',
    icon: '🙏',
    description: 'Gemstones, mantras, colors, and practices for your challenging planetary placements.',
    category: 'astro',
  },
];

/* ── Component map (product id → React component) ─────────────── */
const PRODUCT_COMPONENTS: Record<string, React.ComponentType<{ birth: BirthData; computed: VisitorComputedData }>> = {
  'golden-hour': GoldenHourProduct,
  'swot':        SwotProduct,
  'photo-card':  PhotoCardProduct,
  'reel':        ReelProduct,
  'horoscope':   HoroscopeChartProduct,
  'dasha':       DashaProduct,
  'prediction':  PredictionProduct,
  'health':      HealthProduct,
  'remedies':    RemediesProduct,
};

const PRODUCT_TITLES: Record<string, { title: string; icon: string }> = {
  reel: { title: 'Generate Timecept Cosmic Reel', icon: '🎬' },
};
[...TIMECEPTOR_PRODUCTS, ...ASTRO_PRODUCTS].forEach(p => {
  PRODUCT_TITLES[p.id] = { title: p.title, icon: p.icon };
});

/* ── Main page ─────────────────────────────────────────────────── */

export default function ResultsMainVisitorPage() {
  const { search } = useLocation();

  // Parse birth data from URL params
  const birthData = useMemo((): BirthData | null => {
    const p = new URLSearchParams(search);
    const dob = p.get('dob');
    if (!dob) return null;
    return {
      dob,
      tob: p.get('tob') ?? '12:00',
      lat: parseFloat(p.get('lat') ?? '22.5726'),
      lng: parseFloat(p.get('lng') ?? '88.3639'),
      locationName: p.get('loc') ? decodeURIComponent(p.get('loc')!) : 'Unknown',
    };
  }, [search]);

  const selectedService = useMemo((): ServiceId => {
    const p = new URLSearchParams(search);
    return (p.get('service') as ServiceId) ?? 'yoga';
  }, [search]);

  // Compute chart + windows
  const computed = useMemo((): VisitorComputedData | null => {
    if (!birthData) return null;
    try {
      const birthDateTime = new Date(`${birthData.dob}T${birthData.tob}`);
      const chart = calculateChart(birthDateTime, birthData.lat, birthData.lng);

      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      const weeklyWindows = getWeeklyWindows(
        birthData.dob, birthData.tob,
        birthData.lat, birthData.lng,
        weekStart, selectedService
      );

      // Compute SWOT
      const summaries: SwotServiceSummary[] = SERVICES.map(svc => {
        const svcWins = getWeeklyWindows(birthData.dob, birthData.tob, birthData.lat, birthData.lng, weekStart, svc.id, 7);
        const scores = svcWins.map(w => w.score);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
        const peaks = svcWins.filter(w => w.score >= 62);
        const weaks = svcWins.filter(w => w.score < 30);
        const best = svcWins.reduce((a, b) => a.score > b.score ? a : b, svcWins[0]);
        const bestDate = new Date(best.date);
        const bestDay = bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const halfIdx = Math.floor(svcWins.length / 2);
        const avgFirst = svcWins.slice(0, halfIdx).reduce((a, w) => a + w.score, 0) / (halfIdx || 1);
        const avgSecond = svcWins.slice(halfIdx).reduce((a, w) => a + w.score, 0) / ((svcWins.length - halfIdx) || 1);
        const trendDiff = avgSecond - avgFirst;
        const trend = trendDiff > 2 ? 'rising' as const : trendDiff < -2 ? 'falling' as const : 'stable' as const;

        const morningWins = svcWins.filter(w => w.hour >= 4 && w.hour < 10);
        const eveningWins = svcWins.filter(w => w.hour >= 18 && w.hour < 23);
        const morningAvg = morningWins.length ? Math.round(morningWins.reduce((a, w) => a + w.score, 0) / morningWins.length) : 0;
        const eveningAvg = eveningWins.length ? Math.round(eveningWins.reduce((a, w) => a + w.score, 0) / eveningWins.length) : 0;

        const planetCounts: Record<string, number> = {};
        peaks.forEach(w => { planetCounts[w.horaRuler] = (planetCounts[w.horaRuler] || 0) + 1; });
        const dominantPlanet = Object.entries(planetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

        return {
          id: svc.id, name: svc.name, icon: svc.icon,
          avgScore: avg, peakCount: peaks.length, weakCount: weaks.length,
          bestDay, bestHour: best.hour, bestScore: best.score,
          trend, morningAvg, eveningAvg, dominantPlanet,
        };
      }).sort((a, b) => b.avgScore - a.avgScore);

      // SWOT matrix
      const topSvcs = summaries.slice(0, 3);
      const bottomSvcs = summaries.slice(-2);
      const rising = summaries.filter(s => s.trend === 'rising');
      const falling = summaries.filter(s => s.trend === 'falling');
      const swotMatrix: SwotMatrix = {
        strengths: topSvcs.map(s => ({ title: `${s.icon} ${s.name} — Strong alignment`, detail: `Score ${s.avgScore}/100 with ${s.peakCount} peaks.`, icon: s.icon })),
        weaknesses: bottomSvcs.map(s => ({ title: `${s.icon} ${s.name} — Needs timing`, detail: `Score ${s.avgScore}/100 with ${s.weakCount} lows.`, icon: s.icon })),
        opportunities: rising.length > 0
          ? rising.slice(0, 2).map(s => ({ title: `${s.icon} ${s.name} — Rising`, detail: `Best: ${s.bestDay} at ${String(s.bestHour).padStart(2, '0')}:00.`, icon: s.icon }))
          : [{ title: '✦ Stable', detail: 'All services steady.', icon: '✦' }],
        threats: falling.length > 0
          ? falling.slice(0, 2).map(s => ({ title: `${s.icon} ${s.name} — Declining`, detail: 'Act sooner for this domain.', icon: s.icon }))
          : [{ title: '✦ No threats', detail: 'Nothing declining.', icon: '✦' }],
      };

      const birthDayOfWeek = birthDateTime.getDay();
      const birthPlanetName = PLANETS[birthDayOfWeek]?.name ?? 'Sun';

      return {
        chart,
        weeklyWindows,
        selectedService,
        swotServices: summaries,
        swotMatrix,
        birthPlanetName,
      };
    } catch (e) {
      console.warn('[ResultsMainVisitorPage] compute error:', e);
      return null;
    }
  }, [birthData, selectedService]);

  // Active popup product id
  const [activeProduct, setActiveProduct] = useState<string | null>(null);

  // Editable name for the reel — default random user ID
  const [reelName, setReelName] = useState(() => `User.${Math.random().toString().slice(2, 8)}`);

  // User-uploaded avatar for the reel — default placeholder
  const [reelAvatar, setReelAvatar] = useState<string>('/ProfileUnavailable.jpg');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Only PNG or JPG images allowed.');
      return;
    }
    // Validate size (max 1 MB)
    if (file.size > 1024 * 1024) {
      alert('Image must be under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setReelAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Auto-scroll to reel CTA when the page loads
  const reelCtaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      reelCtaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Missing birth data fallback
  if (!birthData || !computed) {
    return (
      <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
        <Background />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <span className="text-5xl mb-4">🌌</span>
          <h1 className="font-display text-2xl text-gold font-semibold mb-2">No Birth Data Found</h1>
          <p className="text-cream-dim/70 text-sm mb-6 max-w-md">
            Enter your birth details first so we can calculate your cosmic profile.
          </p>
          <Link
            to="/app#form"
            className="px-8 py-3 bg-gold text-space-bg font-bold uppercase tracking-widest text-sm rounded-full hover:shadow-[0_0_30px_rgba(244,161,29,0.6)] transition-all"
          >
            ← Enter Birth Details
          </Link>
        </div>
      </div>
    );
  }

  const ActiveComponent = activeProduct ? PRODUCT_COMPONENTS[activeProduct] : null;
  const activeInfo = activeProduct ? PRODUCT_TITLES[activeProduct] : null;

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-1 md:px-12 md:py-3 border-b border-gold/10">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="" className="h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
            <span className="font-mono text-[10px] tracking-widest text-cream-dim/60">Your Cosmic Results</span>
          </div>
        </Link>
        <Link
          to="/app#form"
          className="font-mono text-xs text-cream-dim tracking-widest uppercase border border-gold/30 rounded-full px-4 py-2 hover:border-gold/60 hover:text-gold transition-all"
        >
          ← Edit Details
        </Link>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {/* Birth summary badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/[0.06] border border-gold/20 rounded-full">
            <span className="text-sm">🌟</span>
            <span className="font-mono text-xs text-cream-dim tracking-wider">
              {birthData.locationName} · {birthData.dob} · {birthData.tob}
            </span>
          </div>
        </motion.div>

        {/* ── 🎬 Cosmic Reel — Two-button CTA ───────────────────── */}
        <motion.div
          ref={reelCtaRef}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 200, damping: 20 }}
          className="mb-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h3 className="text-base sm:text-lg text-gold font-display font-bold tracking-wide">
                Cosmic Reel — Free
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">No Sign-up</span>
                <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">No Card</span>
              </div>
            </div>
          </div>

          {/* Two buttons side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ⚡ Quick Generate — zero friction */}
            <button
              onClick={() => setActiveProduct('reel')}
              className="group relative text-left p-4 sm:p-5 rounded-xl border-2 border-gold/30 bg-gradient-to-br from-gold/[0.10] to-gold/[0.03] hover:border-gold/60 hover:from-gold/[0.18] transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/[0.06] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <div className="relative z-10 flex flex-col items-center text-center gap-2">
                <span className="text-3xl">⚡</span>
                <span className="text-sm text-gold font-display font-bold tracking-wide">Quick Generate</span>
                <span className="text-[10px] text-cream-dim/50 font-mono">One tap · instant reel</span>
              </div>
            </button>

            {/* ✏️ Personalize — name + photo, then generate */}
            <div className="relative rounded-xl border-2 border-white/[0.08] bg-white/[0.02] hover:border-gold/25 transition-all overflow-hidden">
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex flex-col items-center text-center gap-1">
                  <span className="text-3xl">✏️</span>
                  <span className="text-sm text-cream font-display font-bold tracking-wide">Personalize & Generate</span>
                </div>

                {/* Name */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="font-mono text-[9px] text-cream-dim/50 uppercase tracking-widest w-12 flex-shrink-0">Name</span>
                  <input
                    type="text"
                    value={reelName}
                    onChange={e => setReelName(e.target.value)}
                    maxLength={30}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-gold/20 bg-gold/[0.04] text-cream text-xs font-mono tracking-wide placeholder:text-cream-dim/30 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-all"
                    placeholder="Your name"
                  />
                </div>

                {/* Photo */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="font-mono text-[9px] text-cream-dim/50 uppercase tracking-widest w-12 flex-shrink-0">Photo</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/25 bg-[#111] flex-shrink-0">
                      <img src={reelAvatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg border border-gold/20 bg-gold/[0.04] text-cream-dim text-[10px] font-mono hover:border-gold/40 hover:text-cream transition-all"
                    >
                      Upload
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <span className="font-mono text-[8px] text-cream-dim/30 hidden sm:inline">1:1 · max 1 MB</span>
                  </div>
                </div>

                {/* Generate button */}
                <button
                  onClick={() => setActiveProduct('reel')}
                  className="w-full mt-1 py-2 rounded-lg bg-gold/15 border border-gold/30 text-gold text-xs font-mono tracking-widest uppercase hover:bg-gold/25 hover:border-gold/50 transition-all"
                >
                  Generate →
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Category 1: Timeceptor Products ─────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-lg">⏰</div>
            <div>
              <h2 className="font-display text-lg text-gold font-semibold">Timeceptor — Timing Intelligence</h2>
              <p className="font-mono text-[10px] text-cream-dim/50 tracking-widest uppercase">Schedule your life with planetary precision</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIMECEPTOR_PRODUCTS.map((prod, i) => (
              <motion.button
                key={prod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                onClick={() => setActiveProduct(prod.id)}
                className="group relative text-left p-4 border border-gold/20 rounded-lg bg-gold/[0.03] hover:bg-gold/[0.08] hover:border-gold/40 transition-all cursor-pointer"
              >
                {prod.freePromo && (
                  <span className="absolute -top-2 -right-2 text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold shadow-sm">
                    free
                  </span>
                )}
                <div className="text-2xl mb-2">{prod.icon}</div>
                <h3 className="text-sm text-cream font-semibold group-hover:text-gold transition-colors mb-1">{prod.title}</h3>
                <p className="text-[11px] text-cream-dim/50 leading-relaxed">{prod.description}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-gold/60 font-mono tracking-widest uppercase group-hover:text-gold transition-colors">
                  <span>View →</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── Category 2: Astro Products ──────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg">🔮</div>
            <div>
              <h2 className="font-display text-lg text-cream font-semibold">Vedic Astrology — Your Cosmic Blueprint</h2>
              <p className="font-mono text-[10px] text-cream-dim/50 tracking-widest uppercase">Charts, periods, predictions & remedies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ASTRO_PRODUCTS.map((prod, i) => (
              <motion.button
                key={prod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                onClick={() => setActiveProduct(prod.id)}
                className="group text-left p-4 border border-white/[0.08] rounded-lg bg-white/[0.02] hover:bg-white/[0.05] hover:border-gold/25 transition-all cursor-pointer"
              >
                <div className="text-2xl mb-2">{prod.icon}</div>
                <h3 className="text-sm text-cream font-semibold group-hover:text-gold transition-colors mb-1">{prod.title}</h3>
                <p className="text-[11px] text-cream-dim/50 leading-relaxed">{prod.description}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-cream-dim/30 font-mono tracking-widest uppercase group-hover:text-gold transition-colors">
                  <span>View →</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── Sign-in suggestion (non-intrusive) ────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-6 border-t border-white/[0.05]"
        >
          <p className="text-xs text-cream-dim/40 mb-3">Want to save your results and unlock 90-day forecasts?</p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gold/25 text-gold font-mono text-[10px] tracking-widest uppercase rounded-full hover:bg-gold/10 hover:border-gold/40 transition-all"
          >
            🔓 Sign in (optional)
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <div className="flex items-center gap-4 font-mono text-xs text-cream-dim tracking-widest uppercase">
          <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
          <span className="opacity-50">·</span>
          <span>© 2026</span>
        </div>
      </footer>

      {/* ── Product popup modals ──────────────────────────────────── */}
      {activeProduct === 'reel' && birthData && computed && (
        <ReelProduct birth={birthData} computed={computed} onClose={() => setActiveProduct(null)} reelName={reelName} reelAvatar={reelAvatar} />
      )}
      {ActiveComponent && activeInfo && activeProduct !== 'reel' && (
        <ProductModal
          open={!!activeProduct}
          onClose={() => setActiveProduct(null)}
          title={activeInfo.title}
          icon={activeInfo.icon}
        >
          <ActiveComponent birth={birthData} computed={computed} />
        </ProductModal>
      )}
    </div>
  );
}
