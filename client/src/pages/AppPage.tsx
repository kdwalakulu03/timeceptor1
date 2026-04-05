/**
 * AppPage — The calculator page (refactored from App.tsx).
 * Birth details → planetary hour engine → weekly windows.
 * After calculation, users can navigate to /dashboard for daily use.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Hero } from '../components/Hero';
import { WeeklyView } from '../components/WeeklyView';
import { CosmicForm } from '../components/CosmicForm';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { Legend } from '../components/Legend';
import { NotificationCTA } from '../components/NotificationCTA';

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
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const ctaRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ctaDismissed && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [ctaDismissed]);

  // ── URL params for share links ──────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pDob = params.get('dob');
    const pTob = params.get('tob');
    const pUnknown = params.get('unknown');
    const pLat = params.get('lat');
    const pLng = params.get('lng');
    const pLoc = params.get('loc');
    const pService = params.get('service') as ServiceId | null;

    if (pDob) setDob(pDob);
    if (pTob) setTob(pTob);
    if (pUnknown === '1') setUnknownTime(true);
    if (pLat && pLng) { setCoords({ lat: parseFloat(pLat), lng: parseFloat(pLng) }); setCoordsResolved(true); }
    if (pLoc) setLocation(decodeURIComponent(pLoc));
    if (pService) setSelectedService(pService);
  }, []);

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

  // ── Core calculation ──────────────────────────────────────────────────────
  const calculateWindow = async () => {
    if (!dob) return;
    if (!user) {
      try { await signInWithGoogle(); } catch { return; }
    }

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

    const token = user ? await user.getIdToken() : null;
    const uid = user ? user.uid : `g_${dob}_${finalTob}_${coords.lat.toFixed(2)}_${coords.lng.toFixed(2)}`.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/windows/precalc', {
      method: 'POST', headers,
      body: JSON.stringify({ uid, birthDate: dob, birthTime: finalTob, lat: coords.lat, lng: coords.lng }),
    }).then(r => r.json()).then(d => {
      console.log(`[precalc] ${d.fromCache ? 'cache hit' : `stored ${d.stored} windows`}`);
    }).catch(e => console.warn('[precalc]', e));

    setTimeout(() => ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

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
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-5 md:px-12 md:py-8 border-b border-gold/10">
        <Link to="/" className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          {user && (
            <Link to="/dashboard" className="hidden sm:block font-mono text-xs text-cream-dim tracking-widest uppercase hover:text-gold transition-colors">
              Dashboard
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 border border-gold/20 rounded-sm px-2 sm:px-3 py-1.5 hover:border-gold/40 transition-colors"
              >
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                  : <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">{(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}</span>
                }
                <span className="hidden sm:block font-mono text-xs text-cream-dim tracking-widest truncate max-w-[120px]">
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
                    Dashboard
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
        <Hero />

        <div className="max-w-3xl mx-auto">
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
            />

            {/* CTA gate */}
            {weeklyWindows.length > 0 && !ctaDismissed && (
              <div ref={ctaRef} style={{ marginTop: 34 }}>
                <NotificationCTA botUsername={botUsername} uid={user?.uid ?? null} telegramLinked={telegramLinked} />
                <div style={{ textAlign: 'center', marginTop: 21 }}>
                  <button
                    onClick={() => setCtaDismissed(true)}
                    className="px-6 py-3 bg-gold text-space-bg font-bold uppercase tracking-widest text-sm rounded-full shadow-[0_0_15px_rgba(212,168,75,0.5)] hover:shadow-[0_0_30px_rgba(212,168,75,0.8)] transition-all animate-pulse cursor-pointer"
                  >
                    ✅ Your Results Are Ready — View Golden Hour
                  </button>
                </div>
              </div>
            )}

            {/* Weekly results */}
            {weeklyWindows.length > 0 && ctaDismissed && (
              <div ref={resultsRef}>
                <div style={{ marginTop: 21 }}>
                  <WeeklyView
                    windows={weeklyWindows} unlockedDays={3}
                    onUnlock={async () => {
                      let currentUser = user;
                      if (!currentUser) {
                        try { currentUser = await signInWithGoogle(); } catch { return; }
                      }
                      try {
                        const token = await currentUser.getIdToken();
                        const res = await fetch('/api/stripe/create-checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else if (data.alreadyPaid) {
                          navigate('/dashboard');
                        } else {
                          alert('Something went wrong — please try again.');
                        }
                      } catch (e) {
                        console.warn('[stripe]', e);
                        alert('Could not connect to payment server. Please try again later.');
                      }
                    }}
                    user={user} selectedService={selectedService}
                  />
                </div>

                {/* Go to dashboard prompt */}
                {user && (
                  <div className="mt-6 text-center">
                    <Link
                      to="/dashboard"
                      className="inline-block px-6 py-3 border border-gold/30 text-gold font-mono text-xs tracking-widest uppercase hover:bg-gold/10 transition-all rounded-sm"
                    >
                      Go to Dashboard →
                    </Link>
                  </div>
                )}

                <NotificationCTA botUsername={botUsername} uid={user?.uid ?? null} telegramLinked={telegramLinked} />
              </div>
            )}

            {/* Traditional method */}
            {results && (
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={() => setShowTraditional(v => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white/[0.025] border border-white/[0.07] rounded-lg cursor-pointer font-mono text-[11px] font-bold tracking-widest uppercase text-cream-dim/45"
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
          <a href="https://timecept.com" className="hover:text-gold transition-colors">timecept.com</a>
          <span className="hidden md:inline opacity-30">·</span>
          <span>Ancient timing · Modern life · © 2026</span>
        </div>
      </footer>
    </div>
  );
}
