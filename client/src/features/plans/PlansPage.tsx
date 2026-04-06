/**
 * PlansPage — Life Plans feature page.
 *
 * Pick a pre-built life plan (Launch, Dating, Job Hunt, etc.)
 * and get a 7-day timeline with optimal windows for each phase.
 *
 * Fully client-side — zero backend calls for computation.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signOutUser } from '../../firebase';
import { Background } from '../../components/Background';
import { HowItWorksModal } from '../../components/HowItWorksModal';
import { LIFE_PLANS } from './data/plans';
import { SERVICES } from '../../services';
import { PlanCard } from './components/PlanCard';
import { PlanSchedule } from './components/PlanSchedule';
import { computePlanSchedule, PlanDayResult } from './utils/compute';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PlansPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hiwOpen, setHiwOpen] = useState(false);
  const [birthData, setBirthData] = useState<{
    birthDate: string; birthTime: string; lat: number; lng: number;
  } | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<PlanDayResult[] | null>(null);
  const [computing, setComputing] = useState(false);

  // Auth gate
  useEffect(() => {
    return onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) navigate('/app', { replace: true });
    });
  }, [navigate]);

  // Fetch birth data + access
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const [profileRes, accessRes] = await Promise.all([
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/users/me/access', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
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
        if (accessRes.ok) {
          const data = await accessRes.json();
          setHasPaid(data.paid ?? false);
        }
      } catch { /* ignore */ }
    })();
  }, [user]);

  const selectedPlan = useMemo(
    () => LIFE_PLANS.find(p => p.id === selectedPlanId) ?? null,
    [selectedPlanId],
  );

  // Gate premium plans
  const handleSelectPlan = useCallback((id: string) => {
    const plan = LIFE_PLANS.find(p => p.id === id);
    if (plan?.premium && !hasPaid) return; // blocked
    setSelectedPlanId(id);
  }, [hasPaid]);

  /* ── Plan card renderer (canvas 600×360) ─────────────────────────────── */
  const logoImg = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => { logoImg.current = img; };
  }, []);

  const renderPlanCard = useCallback((): HTMLCanvasElement | null => {
    if (!selectedPlan || !schedule || schedule.length === 0) return null;
    const W = 600, H = 400;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b0b24'); grad.addColorStop(1, '#07071a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Accent bar
    const acGrad = ctx.createLinearGradient(0, 0, W, 0);
    acGrad.addColorStop(0, selectedPlan.accentFrom); acGrad.addColorStop(1, selectedPlan.accentTo);
    ctx.fillStyle = acGrad; ctx.fillRect(0, 0, W, 4);

    // Rounded border
    ctx.strokeStyle = 'rgba(244,161,29,0.30)'; ctx.lineWidth = 2;
    const rr = 16;
    ctx.beginPath();
    ctx.moveTo(rr + 4, 4); ctx.lineTo(W - rr - 4, 4); ctx.arcTo(W - 4, 4, W - 4, rr + 4, rr);
    ctx.lineTo(W - 4, H - rr - 4); ctx.arcTo(W - 4, H - 4, W - rr - 4, H - 4, rr);
    ctx.lineTo(rr + 4, H - 4); ctx.arcTo(4, H - 4, 4, H - rr - 4, rr);
    ctx.lineTo(4, rr + 4); ctx.arcTo(4, 4, rr + 4, 4, rr);
    ctx.stroke();

    // Logo watermark
    if (logoImg.current) { ctx.globalAlpha = 0.07; ctx.drawImage(logoImg.current, W - 110, 16, 90, 90); ctx.globalAlpha = 1; }

    // Plan name + icon
    ctx.font = '32px serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#F4A11D';
    ctx.fillText(selectedPlan.icon, 28, 44);
    ctx.font = 'bold 20px serif'; ctx.fillStyle = '#f0ecd8';
    ctx.fillText(selectedPlan.name, 72, 42);
    ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.5)';
    ctx.fillText(selectedPlan.subtitle, 72, 60);

    // Avg score badge
    const avgScore = schedule[0]?.avgScore ?? 0;
    const scoreClr = avgScore >= 62 ? '#34d399' : avgScore >= 45 ? '#F4A11D' : '#fbbf24';
    ctx.font = 'bold 28px monospace'; ctx.textAlign = 'right'; ctx.fillStyle = scoreClr;
    ctx.fillText(String(avgScore), W - 28, 44);
    ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.4)';
    ctx.fillText('TODAY AVG', W - 28, 58);

    // Divider
    ctx.strokeStyle = 'rgba(244,161,29,0.15)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, 74); ctx.lineTo(W - 28, 74); ctx.stroke();

    // Today's phases
    ctx.textAlign = 'left'; ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText("TODAY'S OPTIMAL TIMELINE", 28, 96);

    let py = 114;
    const todayPhases = schedule[0]?.phases || [];
    todayPhases.forEach((pw, i) => {
      const svc = SERVICES.find(s => s.id === pw.phase.service);
      ctx.font = '14px serif'; ctx.fillStyle = '#f0ecd8';
      ctx.fillText(`${svc?.icon || '⏰'}  ${pw.phase.label}`, 28, py);
      if (pw.bestWindow) {
        const h = pw.bestWindow.hour; const ap = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12;
        const pScoreClr = pw.bestWindow.score >= 62 ? '#34d399' : pw.bestWindow.score >= 45 ? '#F4A11D' : '#fbbf24';
        ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.55)';
        ctx.fillText(`${h12} ${ap} · ${pw.bestWindow.horaRuler} hora · ${pw.phase.duration}`, 56, py + 16);
        ctx.font = 'bold 14px monospace'; ctx.textAlign = 'right'; ctx.fillStyle = pScoreClr;
        ctx.fillText(String(pw.bestWindow.score), W - 28, py);
        ctx.textAlign = 'left';
      }
      py += 42;
    });

    // 7-day overview mini row
    py = Math.max(py + 8, 280);
    ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText('7-DAY OUTLOOK', 28, py);
    py += 18;
    const dayW = (W - 56) / 7;
    schedule.forEach((day, di) => {
      const x = 28 + di * dayW;
      const isToday = di === 0;
      const d = new Date(day.date + 'T12:00:00');
      const dayLabel = isToday ? 'Today' : DAY_NAMES[(d.getDay() + 6) % 7];
      ctx.font = '9px monospace'; ctx.fillStyle = isToday ? '#F4A11D' : 'rgba(240,236,216,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText(dayLabel, x + dayW / 2, py);
      const sClr = day.avgScore >= 62 ? '#34d399' : day.avgScore >= 45 ? '#F4A11D' : day.avgScore >= 30 ? '#fbbf24' : '#f87171';
      ctx.font = 'bold 13px monospace'; ctx.fillStyle = sClr;
      ctx.fillText(String(day.avgScore), x + dayW / 2, py + 16);
    });

    // Footer
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(244,161,29,0.25)'; ctx.font = '10px monospace';
    ctx.fillText('timeceptor.com — powered by timecept.com™  ©', W / 2, H - 16);
    if (logoImg.current) { ctx.globalAlpha = 0.6; ctx.drawImage(logoImg.current, 16, H - 56, 44, 44); ctx.globalAlpha = 1; }

    return canvas;
  }, [selectedPlan, schedule]);

  const downloadPlanCard = useCallback(() => {
    const canvas = renderPlanCard();
    if (!canvas || !selectedPlan) return;
    const link = document.createElement('a');
    link.download = `timeceptor-plan-${selectedPlan.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [renderPlanCard, selectedPlan]);

  const sharePlanCard = useCallback(async () => {
    const canvas = renderPlanCard();
    if (!canvas || !selectedPlan) return;
    try {
      const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'));
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'plan.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `My ${selectedPlan.name} — Timeceptor`,
          text: `${selectedPlan.name}: Today's score ${schedule?.[0]?.avgScore ?? 0}/100`,
          files: [new File([blob], `timeceptor-plan-${selectedPlan.id}.png`, { type: 'image/png' })],
        });
      } else { downloadPlanCard(); }
    } catch { downloadPlanCard(); }
  }, [renderPlanCard, selectedPlan, schedule, downloadPlanCard]);

  // Compute schedule when plan selected
  useEffect(() => {
    if (!selectedPlan || !birthData) return;
    setComputing(true);
    setSchedule(null);
    const timer = setTimeout(() => {
      try {
        const result = computePlanSchedule(
          selectedPlan,
          birthData.birthDate, birthData.birthTime,
          birthData.lat, birthData.lng,
        );
        setSchedule(result);
      } catch (e) {
        console.warn('[plans] compute error:', e);
      } finally {
        setComputing(false);
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [selectedPlan, birthData]);

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
          <Link to="/decide" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            🎯 Act or Wait?
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
                <Link to="/decide" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">🎯 Act or Wait?</Link>
                <Link to="/swot" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-gold hover:text-gold-light hover:bg-gold/5 transition-colors border-b border-gold/10">✦ SWOT Analysis</Link>
                <button onClick={() => { signOutUser(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-gold mb-2">📋 Life Plans</h1>
          <p className="font-mono text-xs sm:text-sm text-cream-dim tracking-widest uppercase">
            Pre-built timing strategies for life's big moves — pick a plan, get your 7-day schedule
          </p>
        </motion.div>

        {!birthData ? (
          <div className="text-center py-16">
            <p className="text-cream-dim mb-4">Enter your birth details first to generate a plan.</p>
            <Link to="/app" className="inline-block px-6 py-3 bg-gold text-space-bg font-mono text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all rounded-sm">
              Set Up My Chart
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
            {/* Plan selector */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="font-mono text-[10px] tracking-widest uppercase text-gold/50 mb-3">Choose a plan</div>
              <div className="space-y-2">
                {LIFE_PLANS.map((plan) => (
                  <div key={plan.id} className="relative">
                    <PlanCard
                      plan={plan}
                      isSelected={selectedPlanId === plan.id}
                      onSelect={handleSelectPlan}
                      locked={plan.premium && !hasPaid}
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Schedule display */}
            <div className="min-w-0">
              {!selectedPlanId && (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-cream-dim font-mono text-xs tracking-widest uppercase">
                    Select a plan to see your personalized schedule
                  </p>
                </div>
              )}

              {computing && (
                <div className="text-center py-16">
                  <div className="w-10 h-10 border-2 border-gold/40 border-t-gold rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gold font-mono text-xs tracking-widest uppercase">Computing your optimal schedule…</p>
                </div>
              )}

              {selectedPlan && schedule && !computing && (
                <>
                  <div className="mb-4 p-4 bg-white/[0.02] border border-gold/10 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{selectedPlan.icon}</span>
                      <div className="flex-1">
                        <h2 className="text-lg font-display font-semibold text-gold">{selectedPlan.name}</h2>
                        <p className="font-mono text-[10px] tracking-widest uppercase text-cream-dim/60">{selectedPlan.subtitle}</p>
                      </div>
                      {/* Download / Share */}
                      <div className="flex items-center gap-1">
                        <button onClick={sharePlanCard} title="Share plan card"
                          className="p-2 rounded-lg text-indigo-300/60 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <button onClick={downloadPlanCard} title="Download plan card"
                          className="p-2 rounded-lg text-gold/40 hover:text-gold hover:bg-gold/10 transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-cream-dim/70 leading-relaxed">{selectedPlan.description}</p>
                  </div>
                  <PlanSchedule plan={selectedPlan} schedule={schedule} />
                </>
              )}
            </div>
          </div>
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
