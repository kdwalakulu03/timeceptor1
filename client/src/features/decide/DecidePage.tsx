/**
 * DecidePage — "Should I do X now?" Decision Engine.
 *
 * Fully client-side computation. Zero backend calls.
 * Uses existing getWeeklyWindows() scoring engine.
 *
 * Flow: User picks a service → instant score + verdict + next better window.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signOutUser } from '../../firebase';
import { Background } from '../../components/Background';
import { HowItWorksModal } from '../../components/HowItWorksModal';
import { SERVICES } from '../../services';
import type { ServiceId } from '../../types';
import { computeDecision, DecisionResult } from './utils/engine';
import { ScoreDisplay } from './components/ScoreDisplay';

/* ── Quick-ask presets — common questions mapped to services ─────────── */
const QUICK_ASKS: { question: string; service: ServiceId; icon: string }[] = [
  { question: 'Post on social media now?',         service: 'social_media', icon: '📱' },
  { question: 'Start a workout?',                  service: 'yoga',         icon: '🧘' },
  { question: 'Make a business decision?',          service: 'business',     icon: '📈' },
  { question: 'Go on a date?',                      service: 'love',         icon: '💛' },
  { question: 'Start a creative project?',          service: 'creative',     icon: '🎨' },
  { question: 'Begin a journey?',                   service: 'travel',       icon: '✈️' },
  { question: 'Schedule a health appointment?',     service: 'health',       icon: '🌿' },
  { question: 'Meditate now?',                      service: 'meditation',   icon: '🕯️' },
];

export default function DecidePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hiwOpen, setHiwOpen] = useState(false);
  const [birthData, setBirthData] = useState<{
    birthDate: string; birthTime: string; lat: number; lng: number;
  } | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [computing, setComputing] = useState(false);

  // Auth gate
  useEffect(() => {
    return onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) navigate('/app', { replace: true });
    });
  }, [navigate]);

  // Fetch birth data from profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const profile = await res.json();
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
  }, [user]);

  // Compute decision when service is selected
  useEffect(() => {
    if (!selectedService || !birthData) return;
    setComputing(true);
    // Use setTimeout to avoid blocking the UI thread
    const timer = setTimeout(() => {
      try {
        const r = computeDecision(
          birthData.birthDate, birthData.birthTime,
          birthData.lat, birthData.lng,
          selectedService,
        );
        setResult(r);
      } catch (e) {
        console.warn('[decide] compute error:', e);
      } finally {
        setComputing(false);
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [selectedService, birthData]);

  const selectedServiceDef = useMemo(
    () => SERVICES.find(s => s.id === selectedService),
    [selectedService],
  );

  /* ── Verdict card renderer (canvas 600×340) ──────────────────────────── */
  const logoImg = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => { logoImg.current = img; };
  }, []);

  const renderVerdictCard = useCallback((r: DecisionResult, svcName: string): HTMLCanvasElement | null => {
    const W = 600, H = 340;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b0b24'); grad.addColorStop(1, '#07071a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Rounded border
    ctx.strokeStyle = 'rgba(244,161,29,0.35)'; ctx.lineWidth = 2;
    const rr = 16;
    ctx.beginPath();
    ctx.moveTo(rr + 6, 6); ctx.lineTo(W - rr - 6, 6); ctx.arcTo(W - 6, 6, W - 6, rr + 6, rr);
    ctx.lineTo(W - 6, H - rr - 6); ctx.arcTo(W - 6, H - 6, W - rr - 6, H - 6, rr);
    ctx.lineTo(rr + 6, H - 6); ctx.arcTo(6, H - 6, 6, H - rr - 6, rr);
    ctx.lineTo(6, rr + 6); ctx.arcTo(6, 6, rr + 6, 6, rr);
    ctx.stroke();

    // Logo watermark
    if (logoImg.current) {
      ctx.globalAlpha = 0.08;
      ctx.drawImage(logoImg.current, W - 120, 20, 100, 100);
      ctx.globalAlpha = 1;
    }

    // Score circle
    const cx = 70, cy = 70;
    const scoreClr = r.verdict === 'go' ? '#34d399' : r.verdict === 'caution' ? '#fbbf24' : '#f87171';
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.strokeStyle = scoreClr; ctx.lineWidth = 4; ctx.stroke();
    ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = scoreClr;
    ctx.fillText(String(r.currentScore), cx, cy + 10);
    ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.5)';
    ctx.fillText('/100', cx, cy + 24);

    // Verdict label
    ctx.textAlign = 'left'; ctx.font = 'bold 22px serif'; ctx.fillStyle = scoreClr;
    const verdictSymbol = r.verdict === 'go' ? '✓' : r.verdict === 'caution' ? '⚠' : '✕';
    ctx.fillText(`${verdictSymbol} ${r.verdictLabel}`, 130, 52);

    // Service name
    ctx.font = '14px monospace'; ctx.fillStyle = '#f0ecd8';
    ctx.fillText(svcName, 130, 76);

    // Hora ruler
    ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(165,180,252,0.9)';
    ctx.fillText(`${r.currentHoraRuler} hora`, 130, 96);

    // Divider
    ctx.strokeStyle = 'rgba(244,161,29,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, 120); ctx.lineTo(W - 28, 120); ctx.stroke();

    // Activity description
    ctx.textAlign = 'left'; ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText('RECOMMENDED ACTIVITY', 28, 144);
    ctx.font = '13px monospace'; ctx.fillStyle = '#f0ecd8';
    ctx.fillText(r.currentActivity, 28, 164);

    // Next better window
    if (r.nextBetter && r.verdict !== 'go') {
      ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
      ctx.fillText('NEXT GOLDEN WINDOW', 28, 198);
      ctx.font = '16px monospace'; ctx.fillStyle = '#F4A11D';
      ctx.fillText(r.nextBetter.label, 28, 220);
      ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.6)';
      ctx.fillText(`Score ${r.nextBetter.score}/100 · ${r.nextBetter.horaRuler} hora · ${r.nextBetter.hoursFromNow}h away`, 28, 240);
    } else if (r.verdict === 'go') {
      ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(52,211,153,0.7)';
      ctx.fillText('STATUS', 28, 198);
      ctx.font = '15px monospace'; ctx.fillStyle = '#34d399';
      ctx.fillText('Golden window active — go for it now!', 28, 220);
    }

    // Today's windows summary
    if (r.todayWindows.length > 0) {
      const winY = 264;
      ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
      ctx.fillText("TODAY'S TOP WINDOWS", 28, winY);
      ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.6)';
      const topStr = r.todayWindows.slice(0, 4).map(w => {
        const h = w.hour; const ap = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12;
        return `${h12}${ap}(${w.score})`;
      }).join('  ·  ');
      ctx.fillText(topStr, 28, winY + 18);
    }

    // Footer
    ctx.fillStyle = 'rgba(244,161,29,0.25)'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('timeceptor.com — powered by timecept.com™  ©', W / 2, H - 16);
    if (logoImg.current) { ctx.globalAlpha = 0.6; ctx.drawImage(logoImg.current, 16, H - 56, 44, 44); ctx.globalAlpha = 1; }

    return canvas;
  }, []);

  const downloadVerdictCard = useCallback(() => {
    if (!result || !selectedServiceDef) return;
    const canvas = renderVerdictCard(result, selectedServiceDef.name);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `timeceptor-decide-${selectedService}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [result, selectedServiceDef, selectedService, renderVerdictCard]);

  const shareVerdictCard = useCallback(async () => {
    if (!result || !selectedServiceDef) return;
    const canvas = renderVerdictCard(result, selectedServiceDef.name);
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'));
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'decide.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `Should I ${selectedServiceDef.name} now? — Timeceptor`,
          text: `${result.verdictLabel} — Score: ${result.currentScore}/100 (${result.currentHoraRuler} hora)`,
          files: [new File([blob], `timeceptor-decide-${selectedService}.png`, { type: 'image/png' })],
        });
      } else { downloadVerdictCard(); }
    } catch { downloadVerdictCard(); }
  }, [result, selectedServiceDef, selectedService, renderVerdictCard, downloadVerdictCard]);

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
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-1 md:px-12 md:py-3 border-b border-gold/10">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="" className="h-10 w-10 sm:h-20 sm:w-20 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
            <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] sm:text-[10px] tracking-widest text-cream-dim/50 hover:text-gold/70 transition-colors">by timecept.com</a>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/dashboard" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            My Cosmos
          </Link>
          <Link to="/plans" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            📋 Life Blueprints
          </Link>
          <Link to="/swot" className="hidden sm:flex items-center gap-2 font-mono text-sm text-gold tracking-widest uppercase border-2 border-gold/55 rounded-full px-5 py-2.5 hover:border-gold/90 hover:bg-gold/10 hover:text-gold-light transition-all">
            ✦ SWOT Analysis
          </Link>
          <div className="relative">
            <button onClick={() => setUserMenuOpen(o => !o)} className="flex items-center gap-2 rounded-full p-1 hover:bg-gold/5 transition-all">
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full ring-2 ring-gold/45 ring-offset-2 ring-offset-[#07071a]" />
                : <span className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/35 to-gold/10 ring-2 ring-gold/45 ring-offset-2 ring-offset-[#07071a] flex items-center justify-center text-gold text-base font-semibold font-display">
                    {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                  </span>}
              <span className="hidden sm:block font-mono text-sm text-cream-dim tracking-widest truncate max-w-[140px]">{user.displayName ?? user.email}</span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-space-card border border-gold/20 rounded-sm shadow-xl z-50">
                <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">My Cosmos</Link>
                <Link to="/plans" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">📋 Life Blueprints</Link>
                <Link to="/swot" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-gold hover:text-gold-light hover:bg-gold/5 transition-colors border-b border-gold/10">✦ SWOT Analysis</Link>
                <button onClick={() => { signOutUser(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-gold mb-2">🎯 Should I Do This Now?</h1>
          <p className="font-mono text-xs sm:text-sm text-cream-dim tracking-widest uppercase">
            Instant planetary timing check — pick an activity and get your answer
          </p>
        </motion.div>

        {!birthData ? (
          <div className="text-center py-16">
            <p className="text-cream-dim mb-4">Enter your birth details first to use the Decision Engine.</p>
            <Link to="/app" className="inline-block px-6 py-3 bg-gold text-space-bg font-mono text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all rounded-sm">
              Set Up My Chart
            </Link>
          </div>
        ) : (
          <>
            {/* Quick-ask cards */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
              <div className="font-mono text-[10px] tracking-widest uppercase text-gold/50 mb-3">Tap a question</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_ASKS.map((qa) => {
                  const isActive = selectedService === qa.service;
                  return (
                    <button
                      key={qa.service}
                      onClick={() => { setSelectedService(qa.service); setResult(null); }}
                      className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-gold/10 border-2 border-gold/50 shadow-lg shadow-gold/10'
                          : 'bg-white/[0.02] border border-gold/10 hover:border-gold/30 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-xl">{qa.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isActive ? 'text-gold' : 'text-cream'}`}>
                          {qa.question}
                        </div>
                        <div className="font-mono text-[9px] text-cream-dim/50 tracking-widest uppercase mt-0.5">
                          {SERVICES.find(s => s.id === qa.service)?.tagline}
                        </div>
                      </div>
                      {isActive && (
                        <svg className="w-5 h-5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Result */}
            {computing && (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-2 border-gold/40 border-t-gold rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gold font-mono text-xs tracking-widest uppercase">Checking planetary alignment…</p>
              </div>
            )}

            {result && !computing && selectedServiceDef && (
              <>
                <ScoreDisplay result={result} serviceName={selectedServiceDef.name} />
                {/* Download / Share buttons */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={shareVerdictCard} className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-indigo-400/30 text-indigo-300 font-mono text-xs tracking-widest uppercase hover:border-indigo-400/60 hover:bg-indigo-500/10 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Card
                  </button>
                  <button onClick={downloadVerdictCard} className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gold/30 text-gold font-mono text-xs tracking-widest uppercase hover:border-gold/60 hover:bg-gold/10 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                    </svg>
                    Download Card
                  </button>
                </motion.div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">Timeceptor</Link>
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
