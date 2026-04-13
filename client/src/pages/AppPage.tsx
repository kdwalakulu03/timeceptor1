/**
 * AppPage — The calculator page.
 * Birth details → planetary hour engine → weekly windows.
 *
 * Supports:
 *   - Anonymous 1-day results (no sign-in required)
 *   - Celebrity demo mode (?demo=elon)
 *   - Product-intent routing (?product=swot|decide|plans)
 *   - Free sharable Golden Hour + Act-or-Wait cards
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, signOutUser } from '../firebase';
import { PLANETS, CHALDEAN_HOUR_SEQUENCE, PLANETARY_FRIENDS } from '../constants';
import { Planet, PlanetaryHour, ServiceId } from '../types';
import { calculateChart, getSunrise, ChartData } from '../lib/astrology';
import { getWeeklyWindows } from '../lib/scoring';
import { geocodeCity } from '../lib/geocoding';
import { HourWindow } from '../types';
import { Background } from '../components/Background';
import { HowItWorksModal } from '../components/HowItWorksModal';
import { CosmicForm } from '../components/CosmicForm';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { Legend } from '../components/Legend';
import { NotificationCTA } from '../components/NotificationCTA';
import { TodaySummary } from '../components/TodaySummary';
import { getCelebrity, CelebrityProfile } from '../data/celebrities';
import { computeDecision, DecisionResult } from '../features/decide/utils/engine';
import { SERVICES, PLANET_SERVICE_DATA } from '../services';
import {
  preloadLogo,
} from '../lib/cardRenderer';
import { FreeCards, type FreeCardsData, type SwotServiceSummary, type SwotMatrix } from '../components/free-cards';

const DEFAULT_COORDS = { lat: 22.5726, lng: 88.3639 };

export default function AppPage() {
  const navigate = useNavigate();

  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [unknownTime, setUnknownTime] = useState(false);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [coordsResolved, setCoordsResolved] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [hiwOpen, setHiwOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceId>('yoga');

  const [chart, setChart] = useState<ChartData | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [allHours, setAllHours] = useState<PlanetaryHour[]>([]);
  const [results, setResults] = useState<{
    best: PlanetaryHour | null;
    second: PlanetaryHour | null;
    avoid: PlanetaryHour | null;
    birthPlanet: Planet | null;
  } | null>(null);

  const [weeklyWindows, setWeeklyWindows] = useState<HourWindow[]>([]);

  // ── Demo mode + product intent ───────────────────────────────────────
  const [demoMode, setDemoMode] = useState<CelebrityProfile | null>(null);
  const [productIntent, setProductIntent] = useState<string | null>(null);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);

  // ── SWOT (8-service analysis — free for everyone) ──────────────────────
  const [swotServices, setSwotServices] = useState<SwotServiceSummary[]>([]);
  const [swotMatrix, setSwotMatrix] = useState<SwotMatrix | null>(null);

  // ── Visitor flow: extras + gate ────────────────────────────────────────
  const [extras, setExtras] = useState({ goldenHour: false, swot: false, photoCard: false });
  const [visitorEmail, setVisitorEmail] = useState('');
  const [mathA] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [mathB] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [mathAnswer, setMathAnswer] = useState('');
  const [gateError, setGateError] = useState('');

  // Preload logo for card rendering
  useEffect(() => { preloadLogo(); }, []);

  // Scroll to hash anchor (e.g. /app#form)
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
    }
  }, [hash]);

  // ── Firebase Auth ──────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  useEffect(() => {
    return onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setUserMenuOpen(false);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({}),
          });
          const profile = await res.json();
          if (profile.telegramChatId) setTelegramLinked(true);

          // Paid user with birth data on file → send straight to dashboard
          // (skip if URL has ?dob= share-link params)
          const hasShareParams = new URLSearchParams(window.location.search).has('dob');
          if (!hasShareParams && profile.birthDate && profile.paidUntil) {
            const isPaid = new Date(profile.paidUntil).getTime() > Date.now();
            if (isPaid) {
              navigate('/dashboard', { replace: true });
              return;
            }
          }
        } catch (e) { console.warn('[users/sync]', e); }
        try {
          const r = await fetch('/api/telegram/info');
          const d = await r.json();
          if (d.username) setBotUsername(d.username);
        } catch { /* bot not configured */ }
      }
    });
  }, []);

  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [showTraditional, setShowTraditional] = useState(false);
  const [navigatingToDash, setNavigatingToDash] = useState(false);
  const ctaRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // ── URL params for share links + demo mode + product intent ─────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pDob = params.get('dob');
    const pTob = params.get('tob');
    const pUnknown = params.get('unknown');
    const pLat = params.get('lat');
    const pLng = params.get('lng');
    const pLoc = params.get('loc');
    const pService = params.get('service') as ServiceId | null;
    const pDemo = params.get('demo');
    const pProduct = params.get('product');

    if (pDob) setDob(pDob);
    if (pTob) setTob(pTob);
    if (pUnknown === '1') setUnknownTime(true);
    if (pLat && pLng) { setCoords({ lat: parseFloat(pLat), lng: parseFloat(pLng) }); setCoordsResolved(true); }
    if (pLoc) setLocation(decodeURIComponent(pLoc));
    if (pService) setSelectedService(pService);
    if (pProduct) setProductIntent(pProduct);

    // Celebrity demo mode — auto-fill and auto-compute
    if (pDemo) {
      const celeb = getCelebrity(pDemo);
      if (celeb) {
        setDemoMode(celeb);
        setDob(celeb.birthDate);
        setTob(celeb.birthTime);
        setCoords({ lat: celeb.lat, lng: celeb.lng });
        setCoordsResolved(true);
        setLocation(celeb.location);
      }
    }
  }, []);

  // Auto-calculate for demo mode once celeb data is loaded
  useEffect(() => {
    if (demoMode && dob && coordsResolved) {
      // Small delay for UI to render
      const t = setTimeout(() => calculateWindow(), 300);
      return () => clearTimeout(t);
    }
  }, [demoMode, dob, coordsResolved]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-compute when service changes ─────────────────────────────────────
  useEffect(() => {
    if (!dob || !chart) return;
    const finalTob = unknownTime ? '12:00' : (tob || '12:00');
    try {
      const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
      const wins = getWeeklyWindows(dob, finalTob, coords.lat, coords.lng, weekStart, selectedService);
      setWeeklyWindows(wins);
    } catch (e) { console.warn('[weekly re-score]', e); }
  }, [selectedService]);

  const handleGeocode = async (cityQuery: string) => {
    if (!cityQuery.trim()) return;
    setGeocodeStatus('loading');
    const result = await geocodeCity(cityQuery);
    if (result) { setCoords({ lat: result.lat, lng: result.lng }); setLocation(result.displayName); setCoordsResolved(true); setGeocodeStatus('found'); }
    else setGeocodeStatus('error');
  };

  const handleSelectLocation = (lat: number, lng: number, name: string) => {
    setCoords({ lat, lng }); setLocation(name); setCoordsResolved(true); setGeocodeStatus('found');
  };

  const handleBrowserGeolocate = () => {
    if (!navigator.geolocation) { setGeocodeStatus('error'); return; }
    setGeocodeStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude }); setCoordsResolved(true);
        const result = await geocodeCity(`${latitude},${longitude}`);
        if (result) setLocation(result.displayName);
        setGeocodeStatus('found');
      },
      () => setGeocodeStatus('error')
    );
  };

  const getShareUrl = (): string => {
    const params = new URLSearchParams();
    if (dob) params.set('dob', dob);
    if (tob && !unknownTime) params.set('tob', tob);
    if (unknownTime) params.set('unknown', '1');
    if (coordsResolved) { params.set('lat', coords.lat.toFixed(4)); params.set('lng', coords.lng.toFixed(4)); }
    if (location) params.set('loc', encodeURIComponent(location.split(',')[0].trim()));
    params.set('service', selectedService);
    return `${window.location.origin}/app?${params.toString()}`;
  };

  // ── Core calculation — NO AUTH REQUIRED for 1-day results ─────────────
  const calculateWindow = async () => {
    if (!dob) return;

    // ── Anonymous visitor flow: validate gate then redirect ──────────
    if (!user) {
      // Gate: require email OR correct math answer
      const hasEmail = visitorEmail.trim().length > 0 && visitorEmail.includes('@');
      const hasMath = parseInt(mathAnswer, 10) === mathA + mathB;
      if (!hasEmail && !hasMath) {
        setGateError('Enter your email or solve the math challenge to continue');
        return;
      }
      setGateError('');

      // Optionally save visitor email
      if (hasEmail) {
        fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: visitorEmail, service: selectedService }),
        }).catch(() => {});
      }

      // Navigate to results page with birth data as URL params
      const finalTob = unknownTime ? '12:00' : (tob || '12:00');
      const params = new URLSearchParams();
      params.set('dob', dob);
      params.set('tob', finalTob);
      params.set('lat', coords.lat.toFixed(4));
      params.set('lng', coords.lng.toFixed(4));
      if (location) params.set('loc', encodeURIComponent(location.split(',')[0].trim()));
      params.set('service', selectedService);

      // Reel product intent → go straight to reel studio (autostart rendering)
      if (productIntent === 'reel') {
        params.set('autostart', '1');
        navigate(`/reel?${params.toString()}`);
      } else {
        navigate(`/results-main-visitor?${params.toString()}`);
      }
      return;
    }

    // Auth is NOT required — anonymous users get 1-day free results

    const finalTob = unknownTime ? '12:00' : (tob || '12:00');
    const birthDateTime = new Date(`${dob}T${finalTob}`);
    const natalChart = calculateChart(birthDateTime, coords.lat, coords.lng);
    setChart(natalChart);

    const birthDayOfWeek = birthDateTime.getDay();
    const birthPlanet = PLANETS[birthDayOfWeek];
    const now = new Date();
    const todayDayOfWeek = now.getDay();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);

    let sunrise: Date;
    try {
      sunrise = getSunrise(startOfDay, coords.lat, coords.lng);
      const sh = sunrise.getHours();
      if (sh < 4 || sh > 8) throw new Error('Unreasonable sunrise');
    } catch { sunrise = new Date(startOfDay); sunrise.setHours(5, 30, 0, 0); }

    const sunriseHour = sunrise.getHours();
    const hoursToday: PlanetaryHour[] = [];
    const startPlanetIdx = CHALDEAN_HOUR_SEQUENCE.indexOf(todayDayOfWeek);
    for (let i = 0; i < 24; i++) {
      const actualHour = (sunriseHour + i) % 24;
      const planetIdx = CHALDEAN_HOUR_SEQUENCE[(startPlanetIdx + i) % 7];
      hoursToday.push({ hour: actualHour, planet: PLANETS[planetIdx] });
    }
    setAllHours(hoursToday);

    const currentHour = now.getHours();
    const morningHours = hoursToday.filter(h => h.hour >= 4 && h.hour <= 9 && h.hour >= currentHour);
    const remainingMorning = morningHours.sort((a, b) => a.hour - b.hour);
    const remainingAny = hoursToday.filter(h => h.hour >= currentHour).sort((a, b) => a.hour - b.hour);
    const remaining = remainingMorning.length > 0 ? remainingMorning : remainingAny;

    const friends = PLANETARY_FRIENDS[birthDayOfWeek] || [];
    const bestHours = remaining.filter(h => PLANETS.indexOf(h.planet) === birthDayOfWeek || friends.includes(PLANETS.indexOf(h.planet)));
    const neutralHours = remaining.filter(h => !bestHours.includes(h) && h.planet.type !== 'avoid');
    const avoidHours = remaining.filter(h => h.planet.type === 'avoid');

    const best = bestHours[0] || neutralHours[0] || null;
    const second = (bestHours[1] || (neutralHours[0] === best ? neutralHours[1] : neutralHours[0])) || null;
    const avoid = avoidHours[0] || null;
    setResults({ best, second, avoid, birthPlanet });

    try {
      const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
      const wins = getWeeklyWindows(dob, finalTob, coords.lat, coords.lng, weekStart, selectedService);
      setWeeklyWindows(wins);
    } catch (e) { console.warn('[weekly scoring]', e); }

    // Compute act-or-wait decision for the free verdict card
    try {
      const decision = computeDecision(dob, finalTob, coords.lat, coords.lng, selectedService);
      setDecisionResult(decision);
    } catch (e) { console.warn('[decision]', e); }

    // Compute 8-service SWOT for free cards (client-side, zero API cost)
    // Rich data: avg, peaks, lows, trend, bestDay/Hour/Score, morningAvg, eveningAvg, dominantPlanet
    try {
      const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
      const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const summaries: SwotServiceSummary[] = SERVICES.map(svc => {
        const svcWins = getWeeklyWindows(dob, finalTob, coords.lat, coords.lng, weekStart, svc.id, 7);
        const scores = svcWins.map(w => w.score);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
        const peaks = svcWins.filter(w => w.score >= 62);
        const weaks = svcWins.filter(w => w.score < 30);

        // Best window
        const best = svcWins.reduce((a, b) => a.score > b.score ? a : b, svcWins[0]);
        const bestDate = new Date(best.date);
        const bestDay = bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Trend (first half vs second half of 7 days)
        const halfIdx = Math.floor(svcWins.length / 2);
        const firstHalf = svcWins.slice(0, halfIdx);
        const secondHalf = svcWins.slice(halfIdx);
        const avgFirst = firstHalf.reduce((a, w) => a + w.score, 0) / (firstHalf.length || 1);
        const avgSecond = secondHalf.reduce((a, w) => a + w.score, 0) / (secondHalf.length || 1);
        const trendDiff = avgSecond - avgFirst;
        const trend = trendDiff > 2 ? 'rising' as const : trendDiff < -2 ? 'falling' as const : 'stable' as const;

        // Morning vs evening avg
        const morningWins = svcWins.filter(w => w.hour >= 4 && w.hour < 10);
        const eveningWins = svcWins.filter(w => w.hour >= 18 && w.hour < 23);
        const morningAvg = morningWins.length ? Math.round(morningWins.reduce((a, w) => a + w.score, 0) / morningWins.length) : 0;
        const eveningAvg = eveningWins.length ? Math.round(eveningWins.reduce((a, w) => a + w.score, 0) / eveningWins.length) : 0;

        // Dominant planet in peaks
        const planetCounts: Record<string, number> = {};
        peaks.forEach(w => { planetCounts[w.horaRuler] = (planetCounts[w.horaRuler] || 0) + 1; });
        const dominantPlanet = Object.entries(planetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

        return {
          id: svc.id, name: svc.name, icon: svc.icon,
          avgScore: avg,
          peakCount: peaks.length,
          weakCount: weaks.length,
          bestDay, bestHour: best.hour, bestScore: best.score,
          trend, morningAvg, eveningAvg, dominantPlanet,
        };
      });

      const sorted = summaries.sort((a, b) => b.avgScore - a.avgScore);
      setSwotServices(sorted);

      // Pre-compute SWOT matrix with prose insights
      const topServices = sorted.slice(0, 3);
      const bottomServices = sorted.slice(-2);
      const risingServices = sorted.filter(s => s.trend === 'rising');
      const fallingServices = sorted.filter(s => s.trend === 'falling');

      const matrixData: import('../components/free-cards/types').SwotMatrix = {
        strengths: topServices.map(s => ({
          title: `${s.icon} ${s.name} — Strong alignment`,
          detail: `Average score ${s.avgScore}/100 with ${s.peakCount} peak hours this week. Your planetary configuration naturally supports this.`,
          icon: s.icon,
        })),
        weaknesses: bottomServices.map(s => ({
          title: `${s.icon} ${s.name} — Needs careful timing`,
          detail: `Average score ${s.avgScore}/100 with ${s.weakCount} low-energy hours. Only engage during peak windows.`,
          icon: s.icon,
        })),
        opportunities: risingServices.length > 0
          ? risingServices.slice(0, 2).map(s => ({
              title: `${s.icon} ${s.name} — Rising energy`,
              detail: `Energy is strengthening for ${s.name.toLowerCase()}. Best window: ${s.bestDay} at ${String(s.bestHour).padStart(2, '0')}:00 (score ${s.bestScore}).`,
              icon: s.icon,
            }))
          : [{ title: '✦ All services stable', detail: 'Your 7-day outlook is steady across all domains.', icon: '✦' }],
        threats: fallingServices.length > 0
          ? fallingServices.slice(0, 2).map(s => ({
              title: `${s.icon} ${s.name} — Declining energy`,
              detail: `Timing energy is weakening for ${s.name.toLowerCase()}. Act sooner rather than later.`,
              icon: s.icon,
            }))
          : [{ title: '✦ No significant threats', detail: 'No services show declining trends this week.', icon: '✦' }],
      };
      setSwotMatrix(matrixData);
    } catch (e) { console.warn('[swot]', e); }

    // Server-side calls only for authenticated users
    if (user) {
      const token = await user.getIdToken();
      const uid = user.uid;
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      fetch('/api/windows/precalc', {
        method: 'POST', headers,
        body: JSON.stringify({ uid, birthDate: dob, birthTime: finalTob, lat: coords.lat, lng: coords.lng }),
      }).then(r => r.json()).then(d => {
        console.log(`[precalc] ${d.fromCache ? 'cache hit' : `stored ${d.stored} windows`}`);
      }).catch(e => console.warn('[precalc]', e));

      // Persist birth data to user profile (so dashboard can auto-load next time)
      fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          birthDate: dob, birthTime: finalTob,
          lat: coords.lat, lng: coords.lng,
          locationName: location,
        }),
      }).catch(() => {});
    }

    setTimeout(() => ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // Navigate to dashboard after ensuring birth data is saved
  const goToDashboard = async () => {
    setNavigatingToDash(true);
    try {
      if (user) {
        const token = await user.getIdToken();
        await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            birthDate: dob, birthTime: unknownTime ? '12:00' : (tob || '12:00'),
            lat: coords.lat, lng: coords.lng,
            locationName: location,
          }),
        }).catch(() => {});
      }
      // Product-intent routing: after auth, go to the intended product
      if (productIntent === 'swot')   { navigate('/swot');   return; }
      if (productIntent === 'decide')  { navigate('/decide');  return; }
      if (productIntent === 'plans')   { navigate('/plans');   return; }
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  // ── Free card handlers are now inside FreeCards component ──────────────

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, service: selectedService }) });
      if (res.ok || res.status === 409) setSubscribed(true);
    } catch { setSubscribed(true); }
  };

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* Navigation — mobile-friendly */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-1 md:px-12 md:py-3 border-b border-gold/10">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="" className="h-10 w-10 sm:h-20 sm:w-20 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
            <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] sm:text-xs tracking-widest text-cream-dim/60 hover:text-gold/70 transition-colors font-medium">by timecept.com</a>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
            <Link to="/dashboard" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
              My Cosmos
            </Link>
            <Link to="/decide" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
              🎯 Act or Wait?
            </Link>
            <Link to="/plans" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
              📋 Life Blueprints
            </Link>
            </>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-gold/5 transition-all"
              >
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full ring-2 ring-gold/45 ring-offset-2 ring-offset-[#07071a]" />
                  : <span className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/35 to-gold/10 ring-2 ring-gold/45 ring-offset-2 ring-offset-[#07071a] flex items-center justify-center text-gold text-base font-semibold font-display">{(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}</span>
                }
                <span className="hidden sm:block font-mono text-sm text-cream-dim tracking-widest truncate max-w-[140px]">
                  {user.displayName ?? user.email}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-space-card border border-gold/20 rounded-sm shadow-xl z-50">
                  <Link
                    to="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10"
                  >
                    My Cosmos
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
                  {botUsername && (
                    <a
                      href={`https://t.me/${botUsername}?start=${user.uid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.1.154.234.17.332.015.098.034.322.019.496z"/>
                      </svg>
                      {telegramLinked ? '✓ Telegram' : 'Link Telegram'}
                    </a>
                  )}
                  <button
                    onClick={() => { signOutUser(); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle().catch(console.warn)}
              className="flex items-center gap-2 border-2 border-gold rounded-full px-5 sm:px-6 py-2.5 font-bold text-sm tracking-widest uppercase text-gold hover:bg-gold/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 11h8.533c.044.385.067.78.067 1.184 0 5.368-3.6 9.184-8.6 9.184-5.04 0-9-4.04-9-9s3.96-9 9-9c2.32 0 4.4.86 6.014 2.28l-2.6 2.6A5.25 5.25 0 0 0 12 6.75 5.25 5.25 0 0 0 6.75 12 5.25 5.25 0 0 0 12 17.25c2.64 0 4.58-1.585 5.084-3.75H12V11z"/>
              </svg>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-16 md:pb-24">
        {/* Demo mode banner */}
        {demoMode && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mb-4 p-4 border-2 border-gold/30 rounded-xl bg-gold/[0.06] text-center"
          >
            <p className="text-sm text-gold font-display font-semibold">
              {demoMode.emoji} You're viewing {demoMode.name}'s cosmic chart
            </p>
            <p className="text-xs text-cream-dim mt-1">
              {demoMode.tagline}
            </p>
            <p className="text-xs text-cream-dim/60 mt-2">
              Want your own? <button onClick={() => { setDemoMode(null); setDob(''); setTob(''); setLocation(''); setCoordsResolved(false); setWeeklyWindows([]); setResults(null); setDecisionResult(null); }} className="text-gold underline underline-offset-2">Enter your birth details below ↓</button>
            </p>
          </motion.div>
        )}

        {/* Inline hero — value proposition for anonymous visitors */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="max-w-3xl mx-auto text-center pt-6 sm:pt-10 pb-6 sm:pb-8 px-2"
        >
          {/* Trust badges — BIG and prominent */}
          <div className="flex flex-wrap justify-center gap-3 mb-5">
            <span className="px-4 py-2 border-2 border-emerald-400/40 rounded-full bg-emerald-400/[0.06] text-emerald-400 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase">
              ✓ No Sign-in
            </span>
            <span className="px-4 py-2 border-2 border-emerald-400/40 rounded-full bg-emerald-400/[0.06] text-emerald-400 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase">
              ✓ No Credit Card
            </span>
            <span className="px-4 py-2 border-2 border-gold/40 rounded-full bg-gold/[0.06] text-gold font-mono text-xs sm:text-sm font-bold tracking-widest uppercase">
              ⚡ Instant Results
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-gold font-bold tracking-wider leading-tight mb-4">
            {productIntent === 'reel'
              ? <>Enter Your <span className="underline decoration-gold/40 underline-offset-4">Birth Details</span></>
              : <>Your <span className="underline decoration-gold/40 underline-offset-4">Personal</span> Vedic Profile</>}
          </h1>

          {productIntent === 'reel' ? (
            <>
              <p className="text-cream/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-3">
                🎬 We need your <em>exact</em> birth date, time & location to render your personalised
                <span className="text-gold"> Cosmic Reel</span> — an HD video with your Vedic charts, dashas & more.
              </p>
              <p className="text-cream-dim/70 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-4">
                Fill in the form below and hit <strong className="text-gold">Generate</strong> — your reel will be ready in ~60 seconds.
              </p>
            </>
          ) : (
            <>
              <p className="text-cream/80 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-3">
                Generic "12-sign" horoscopes are one-size-fits-all — they ignore your <em>exact</em> birth
                time, coordinates, and planetary houses. That's why they feel vague.
              </p>
              <p className="text-cream-dim/70 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-4">
                Enter <strong className="text-gold">your</strong> birth details below to get a precise chart with
                <span className="text-gold"> golden hours</span>, <span className="text-gold">SWOT analysis</span>,
                <span className="text-gold"> dasha periods</span>, <span className="text-gold">predictions</span>,
                <span className="text-gold"> health precautions</span>, <span className="text-gold">remedies</span> & more —
                all calculated for <em>you</em>, not your zodiac sign.
              </p>
            </>
          )}
        </motion.section>

        <div id="form" className="max-w-3xl mx-auto scroll-mt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative bg-transparent border-2 border-gold/30 rounded-sm p-5 sm:p-8 md:p-12 backdrop-blur-xl mb-12 sm:mb-20"
          >
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-white/[0.12] hidden sm:block" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/[0.12] hidden sm:block" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/[0.12] hidden sm:block" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-white/[0.12] hidden sm:block" />

            <CosmicForm
              dob={dob} setDob={setDob}
              tob={tob} setTob={setTob}
              unknownTime={unknownTime} setUnknownTime={setUnknownTime}
              location={location} setLocation={setLocation}
              selectedService={selectedService} setSelectedService={setSelectedService}
              geocodeStatus={geocodeStatus}
              onGeocode={handleGeocode}
              onBrowserGeolocate={handleBrowserGeolocate}
              onSelectLocation={handleSelectLocation}
              calculateWindow={calculateWindow}
              isAuthed={!!user}
              hideSubmit={!user}
              hideServiceSelector={!user}
            />

            {/* ── Anonymous visitor gate: extras + email/math + big CTA ── */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mt-6 space-y-5"
              >
                {/* Astro products — always included, shown as on */}
                <div>
                  <p className="font-mono text-sm tracking-widest uppercase text-cream/60 mb-3 font-medium">
                    Included in your report:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {[
                      { icon: '🪐', label: 'Horoscope Chart' },
                      { icon: '📅', label: 'Dasha Periods' },
                      { icon: '⭐', label: 'Predictions' },
                      { icon: '🩺', label: 'Health' },
                      { icon: '🙏', label: 'Remedies' },
                    ].map(item => (
                      <span
                        key={item.label}
                        className="px-3 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] text-sm text-cream-dim/70 flex items-center gap-1.5"
                      >
                        <span>{item.icon}</span> {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Timeceptor exclusive — slide-switch toggles, OFF by default, blinking */}
                <div>
                  <p className="font-mono text-sm tracking-widest uppercase text-gold/80 mb-3 font-semibold">
                    ⏰ Timeceptor Exclusive — toggle to add:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: 'goldenHour' as const, label: 'Golden Hours', icon: '✨' },
                      { key: 'swot' as const, label: 'SWOT Analysis', icon: '⊞' },
                      { key: 'photoCard' as const, label: 'Share Card', icon: '🎨' },
                    ].map(opt => (
                      <motion.button
                        key={opt.key}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExtras(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                        className={`relative flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full border-2 text-sm font-semibold cursor-pointer transition-all duration-300 ${
                          extras[opt.key]
                            ? 'border-gold/60 bg-gold/[0.12] text-gold shadow-[0_0_18px_rgba(244,161,29,0.2)]'
                            : 'border-white/[0.15] bg-white/[0.03] text-cream-dim/60 hover:border-gold/30'
                        }`}
                      >
                        {/* iOS-style slide switch */}
                        <span className={`relative inline-flex w-10 h-[22px] rounded-full transition-colors duration-300 ${
                          extras[opt.key] ? 'bg-gold' : 'bg-white/[0.12]'
                        }`}>
                          <motion.span
                            animate={{ x: extras[opt.key] ? 18 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`absolute top-[3px] w-4 h-4 rounded-full shadow ${
                              extras[opt.key] ? 'bg-space-bg' : 'bg-cream-dim/50'
                            }`}
                          />
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span>{opt.icon}</span> {opt.label}
                        </span>
                        {/* Blinking dot to attract attention when OFF */}
                        {!extras[opt.key] && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(244,161,29,0.6)]" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Email or math gate */}
                <div className="p-5 border-2 border-gold/20 rounded-lg bg-gold/[0.03] space-y-4">
                  <p className="font-mono text-sm tracking-widest uppercase text-cream/70 font-semibold">🤖 Verify you're human — choose one:</p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Email option */}
                    <div className="flex-1">
                      <label className="block text-sm font-mono tracking-widest uppercase text-cream-dim/70 mb-2 font-medium">Email (optional)</label>
                      <input
                        type="email"
                        value={visitorEmail}
                        onChange={e => { setVisitorEmail(e.target.value); setGateError(''); }}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 bg-white/[0.05] border-2 border-white/[0.12] rounded-lg text-base text-cream placeholder:text-cream-dim/30 focus:border-gold/50 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex items-end pb-3">
                      <span className="text-cream-dim/50 text-sm font-bold font-mono">OR</span>
                    </div>

                    {/* Math challenge */}
                    <div className="flex-1">
                      <label className="block text-sm font-mono tracking-widest uppercase text-cream-dim/70 mb-2 font-medium">What is {mathA} + {mathB}?</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mathAnswer}
                        onChange={e => { setMathAnswer(e.target.value); setGateError(''); }}
                        placeholder="?"
                        className="w-full px-4 py-3 bg-white/[0.05] border-2 border-white/[0.12] rounded-lg text-base text-cream placeholder:text-cream-dim/30 focus:border-gold/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {gateError && (
                    <p className="text-sm text-red-400 font-mono font-semibold">{gateError}</p>
                  )}
                </div>

                {/* Big CTA button */}
                <button
                  onClick={calculateWindow}
                  disabled={!dob}
                  className="w-full py-5 bg-gold text-space-bg font-bold uppercase tracking-widest text-base rounded-full shadow-[0_0_25px_rgba(244,161,29,0.5)] hover:shadow-[0_0_50px_rgba(244,161,29,0.8)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {productIntent === 'reel' ? '🎬 Generate My Cosmic Reel — Free' : '✦ Reveal My Cosmic Profile — Free'}
                </button>

                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <span className="px-4 py-2 border-2 border-emerald-400/30 rounded-full bg-emerald-400/[0.05] text-emerald-400 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase">
                    ✓ 100% Free
                  </span>
                  <span className="px-4 py-2 border-2 border-emerald-400/30 rounded-full bg-emerald-400/[0.05] text-emerald-400 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase">
                    ✓ No Sign-in
                  </span>
                  <span className="px-4 py-2 border-2 border-emerald-400/30 rounded-full bg-emerald-400/[0.05] text-emerald-400 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase">
                    ✓ No Credit Card
                  </span>
                  <span className="px-4 py-2 border-2 border-gold/30 rounded-full bg-gold/[0.05] text-gold font-mono text-xs sm:text-sm font-bold tracking-widest uppercase">
                    ⚡ Instant Results
                  </span>
                </div>
              </motion.div>
            )}

            {/* ── After calculation: results + free cards + auth prompt ─── */}
            {weeklyWindows.length > 0 && (
              <div ref={ctaRef} style={{ marginTop: 34 }}>
                {/* Today's top windows — visible to everyone, no auth */}
                <div className="mb-6">
                  <TodaySummary windows={weeklyWindows} />
                </div>

                {/* Free Timecept Cards — Golden Hour + SWOT Analysis */}
                {(() => {
                  const todayStr = new Date().toDateString();
                  const now = new Date().getHours();
                  const topWin = weeklyWindows
                    .filter(w => new Date(w.date).toDateString() === todayStr && w.hour >= now)
                    .sort((a, b) => b.score - a.score)[0] ?? null;

                  const svc = SERVICES.find(s => s.id === selectedService);
                  const svcData = topWin ? (PLANET_SERVICE_DATA[topWin.horaRuler]?.[selectedService]) : null;

                  // Count golden hours remaining today (score >= 80)
                  const remainingGoldenHours = weeklyWindows
                    .filter(w => new Date(w.date).toDateString() === todayStr && w.hour >= now && w.score >= 80)
                    .length;

                  // Build today's 24-hour window slots
                  const todayWindows = Array.from({ length: 24 }, (_, h) => {
                    const win = weeklyWindows.find(w =>
                      new Date(w.date).toDateString() === todayStr && w.hour === h
                    );
                    return {
                      hour: h,
                      score: win?.score ?? 0,
                      horaRuler: win?.horaRuler ?? '',
                      activity: win?.activity ?? 'rest',
                    };
                  });

                  const freeData: FreeCardsData = {
                    goldenHour: topWin ? {
                      score: topWin.score,
                      hour: topWin.hour,
                      horaRuler: topWin.horaRuler,
                      serviceName: svc?.name ?? 'Activity',
                      serviceIcon: svc?.icon ?? '⏰',
                      activity: svcData?.activity ?? 'Best activity',
                    } : null,
                    todayWindows,
                    swotServices,
                    swotMatrix: swotMatrix ?? undefined,
                    userName: demoMode ? demoMode.name : user?.displayName ?? undefined,
                    selectedService,
                    isAuthed: !!user,
                    remainingGoldenHours,
                  };

                  return <FreeCards data={freeData} />;
                })()}

                {/* Auth prompt — sign in to save + unlock more */}
                {!user && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 border-2 border-gold/30 rounded-xl bg-gold/[0.04] text-center">
                    <p className="font-display font-semibold text-gold mb-1">Save your chart & unlock 3 free days</p>
                    <p className="text-xs text-cream-dim mb-4">Sign in to access your dashboard, weekly view, Act or Wait?, Life Plans & more</p>
                    <button
                      onClick={() => signInWithGoogle().catch(console.warn)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-space-bg font-bold uppercase tracking-widest text-sm rounded-full shadow-[0_0_15px_rgba(212,168,75,0.5)] hover:shadow-[0_0_30px_rgba(212,168,75,0.8)] transition-all"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 11h8.533c.044.385.067.78.067 1.184 0 5.368-3.6 9.184-8.6 9.184-5.04 0-9-4.04-9-9s3.96-9 9-9c2.32 0 4.4.86 6.014 2.28l-2.6 2.6A5.25 5.25 0 0 0 12 6.75 5.25 5.25 0 0 0 6.75 12 5.25 5.25 0 0 0 12 17.25c2.64 0 4.58-1.585 5.084-3.75H12V11z"/></svg>
                      Sign In with Google
                    </button>
                  </motion.div>
                )}

                {/* Authenticated: show notification CTA + dashboard button */}
                {user && (
                  <>
                    <NotificationCTA botUsername={botUsername} uid={user.uid} telegramLinked={telegramLinked} />
                    <div style={{ textAlign: 'center', marginTop: 21 }}>
                      <button
                        onClick={goToDashboard}
                        disabled={navigatingToDash}
                        className="px-8 py-4 bg-gold text-space-bg font-bold uppercase tracking-widest text-sm rounded-full shadow-[0_0_15px_rgba(212,168,75,0.5)] hover:shadow-[0_0_30px_rgba(212,168,75,0.8)] transition-all cursor-pointer disabled:opacity-60"
                      >
                        {navigatingToDash ? (
                          <span className="flex items-center gap-3">
                            <span className="w-4 h-4 border-2 border-space-bg/40 border-t-space-bg rounded-full animate-spin" />
                            Loading Your Dashboard…
                          </span>
                        ) : (
                          '✦ View My Golden Hours'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Traditional method */}
            {results && (
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={() => setShowTraditional(v => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.025] border border-white/[0.07] rounded-lg cursor-pointer font-mono text-xs font-bold tracking-widest uppercase text-cream-dim/60"
                >
                  <span>Traditional Method (Chaldean Hora)</span>
                  <span className="text-sm">{showTraditional ? '↑' : '↓'}</span>
                </button>
                {showTraditional && (
                  <ResultsDisplay
                    results={results} chart={chart} allHours={allHours}
                    showChart={showChart} setShowChart={setShowChart}
                    subscribed={subscribed} email={email} setEmail={setEmail}
                    handleSubscribe={handleSubscribe} resultsRef={resultsRef}
                    selectedService={selectedService} getShareUrl={getShareUrl}
                  />
                )}
              </div>
            )}
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Legend />
        </div>
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-8 md:px-12 md:py-12 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
        <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 font-mono text-xs sm:text-sm text-cream-dim tracking-widest uppercase">
          <button onClick={() => setHiwOpen(true)} className="hover:text-gold transition-colors">⚙️ How It Works</button>
          <span className="hidden md:inline opacity-50">·</span>
          <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
          <span className="hidden md:inline opacity-50">·</span>
          <span>© 2026</span>
        </div>
      </footer>

      <HowItWorksModal open={hiwOpen} onClose={() => setHiwOpen(false)} />
    </div>
  );
}
