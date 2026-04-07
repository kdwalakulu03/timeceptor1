/**
 * SwotPage — SWOT Analysis for paid users.
 *
 * Computes 90 days of windows across all services,
 * identifies Strengths, Weaknesses, Opportunities, Threats
 * plus deeper patterns: day-of-week, morning/evening, planetary dominance,
 * service synergy, and actionable scheduling advice.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { onAuthChange, signOutUser } from '../firebase';
import { Background } from '../components/Background';
import { HowItWorksModal } from '../components/HowItWorksModal';
import { getWeeklyWindows } from '../lib/scoring';
import { SERVICES } from '../services';
import type { HourWindow, ServiceId } from '../types';

/* ── Interfaces ────────────────────────────────────────────────────────── */

interface ServiceAnalysis {
  id: ServiceId;
  name: string;
  icon: string;
  avgScore: number;
  peakCount: number;
  weakCount: number;
  bestDay: string;
  bestHour: number;
  bestScore: number;
  trend: 'rising' | 'falling' | 'stable';
  // Extended pattern data
  dayOfWeekAvg: number[];        // [Mon..Sun] avg scores
  morningAvg: number;            // 4-9 AM avg
  eveningAvg: number;            // 18-22 avg
  dominantPlanet: string;        // most frequent hora ruler in peaks
  peakHourDistribution: number[]; // 24-bucket histogram of peak counts
}

interface SwotItem {
  title: string;
  detail: string;
  icon: string;
}

type TabId = 'overview' | 'swot' | 'patterns' | 'actions';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview',   icon: '◉' },
  { id: 'swot',     label: 'SWOT Matrix', icon: '⊞' },
  { id: 'patterns', label: 'Patterns',    icon: '◈' },
  { id: 'actions',  label: 'Action Plan', icon: '✦' },
];

/* ── Helpers ────────────────────────────────────────────────────────────── */

function scoreColor(s: number): string {
  if (s >= 62) return 'text-emerald-400';
  if (s >= 45) return 'text-gold';
  if (s >= 30) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(s: number): string {
  if (s >= 62) return 'bg-emerald-400';
  if (s >= 45) return 'bg-gold';
  if (s >= 30) return 'bg-amber-400';
  return 'bg-red-400';
}

function trendIcon(t: string): string {
  return t === 'rising' ? '↑' : t === 'falling' ? '↓' : '→';
}

function trendColor(t: string): string {
  return t === 'rising' ? 'text-emerald-400' : t === 'falling' ? 'text-red-400' : 'text-cream-dim';
}

/* ── Component ──────────────────────────────────────────────────────────── */

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
  const [hiwOpen, setHiwOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sampleCardUrl, setSampleCardUrl] = useState<string | null>(null);
  const [sampleService, setSampleService] = useState<ServiceAnalysis | null>(null);

  // Auth gate
  useEffect(() => {
    return onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) navigate('/app', { replace: true });
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
          // No redirect — non-paid users see soft paywall preview
        }
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.birthDate && profile.birthTime && profile.lat != null) {
            setBirthData({ birthDate: profile.birthDate, birthTime: profile.birthTime, lat: profile.lat, lng: profile.lng });
          }
        }
      } catch { /* ignore */ }
    })();
  }, [user, navigate]);

  // Unlock handler — navigate to /checkout page
  const handleUnlock = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  // Check URL for payment result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setHasPaid(true);
      window.history.replaceState({}, '', '/swot');
    }
  }, []);

  // Compute SWOT data across all services (heavy — runs once)
  // Paid users: 90 days. Free users: 7 days (preview mode).
  const computeDays = hasPaid ? 90 : 7;
  useEffect(() => {
    if (!birthData) return;
    setComputing(true);

    setTimeout(() => {
      try {
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);

        const analyses: ServiceAnalysis[] = SERVICES.map(svc => {
          const wins = getWeeklyWindows(
            birthData.birthDate, birthData.birthTime,
            birthData.lat, birthData.lng,
            weekStart, svc.id, computeDays,
          );

          const scores = wins.map(w => w.score);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const peaks = wins.filter(w => w.score >= 62);
          const weaks = wins.filter(w => w.score < 30);

          const best = wins.reduce((a, b) => a.score > b.score ? a : b);
          const bestDate = new Date(best.date);
          const bestDay = bestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          // Trend
          const first30 = wins.filter((_, i) => Math.floor(i / 24) < 30);
          const last30 = wins.filter((_, i) => Math.floor(i / 24) >= 60);
          const avgFirst = first30.reduce((a, w) => a + w.score, 0) / (first30.length || 1);
          const avgLast = last30.reduce((a, w) => a + w.score, 0) / (last30.length || 1);
          const diff = avgLast - avgFirst;
          const trend = diff > 2 ? 'rising' as const : diff < -2 ? 'falling' as const : 'stable' as const;

          // Day-of-week averages (0=Mon..6=Sun)
          const dayBuckets: number[][] = [[], [], [], [], [], [], []];
          wins.forEach(w => {
            const d = new Date(w.date);
            d.setHours(w.hour);
            const dow = (d.getDay() + 6) % 7; // Mon=0
            dayBuckets[dow].push(w.score);
          });
          const dayOfWeekAvg = dayBuckets.map(b => b.length ? Math.round(b.reduce((a, v) => a + v, 0) / b.length) : 0);

          // Morning vs evening
          const morningWins = wins.filter(w => w.hour >= 4 && w.hour < 10);
          const eveningWins = wins.filter(w => w.hour >= 18 && w.hour < 23);
          const morningAvg = morningWins.length ? Math.round(morningWins.reduce((a, w) => a + w.score, 0) / morningWins.length) : 0;
          const eveningAvg = eveningWins.length ? Math.round(eveningWins.reduce((a, w) => a + w.score, 0) / eveningWins.length) : 0;

          // Dominant planet in peaks
          const planetCounts: Record<string, number> = {};
          peaks.forEach(w => { planetCounts[w.horaRuler] = (planetCounts[w.horaRuler] || 0) + 1; });
          const dominantPlanet = Object.entries(planetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

          // Hourly peak distribution
          const peakHourDistribution = Array(24).fill(0);
          peaks.forEach(w => { peakHourDistribution[w.hour]++; });

          return {
            id: svc.id, name: svc.name, icon: svc.icon,
            avgScore: Math.round(avg), peakCount: peaks.length, weakCount: weaks.length,
            bestDay, bestHour: best.hour, bestScore: best.score, trend,
            dayOfWeekAvg, morningAvg, eveningAvg, dominantPlanet, peakHourDistribution,
          };
        });

        setServiceData(analyses);
      } catch (e) { console.warn('[swot] compute error:', e); }
      finally { setComputing(false); }
    }, 50);
  }, [birthData, hasPaid]);

  // Derive SWOT matrix
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
    if (opportunities.length === 0) opportunities.push({ title: '✦ All services stable', detail: 'Your 90-day outlook is steady across all services.', icon: '✦' });

    const threats: SwotItem[] = [
      ...fallingServices.slice(0, 2).map(s => ({
        title: `${s.icon} ${s.name} — Declining energy`,
        detail: `Transit energy is weakening for ${s.name.toLowerCase()}. Schedule critical activities in the first 30 days while conditions are still supportive.`,
        icon: s.icon,
      })),
      ...bottomServices.filter(s => s.weakCount > 500).map(s => ({
        title: `${s.icon} ${s.name} — Many low-energy hours`,
        detail: `${s.weakCount} hours score below 30. Stick strictly to your golden windows.`,
        icon: s.icon,
      })),
    ].slice(0, 3);
    if (threats.length === 0) threats.push({ title: '✦ No significant threats', detail: 'No services show declining trends. Maintain your current practices.', icon: '✦' });

    return { strengths, weaknesses, opportunities, threats };
  }, [serviceData]);

  // Derived deep patterns
  const patterns = useMemo(() => {
    if (serviceData.length === 0) return null;

    // Global best day of week
    const globalDayAvg = DAY_NAMES.map((_, i) => {
      const total = serviceData.reduce((a, s) => a + s.dayOfWeekAvg[i], 0);
      return Math.round(total / serviceData.length);
    });
    const bestDayIdx = globalDayAvg.indexOf(Math.max(...globalDayAvg));
    const worstDayIdx = globalDayAvg.indexOf(Math.min(...globalDayAvg));

    // Morning vs evening person
    const globalMorning = Math.round(serviceData.reduce((a, s) => a + s.morningAvg, 0) / serviceData.length);
    const globalEvening = Math.round(serviceData.reduce((a, s) => a + s.eveningAvg, 0) / serviceData.length);
    const chronotype = globalMorning > globalEvening + 3 ? 'morning' : globalEvening > globalMorning + 3 ? 'evening' : 'balanced';

    // Planetary dominance across all services
    const planetFreq: Record<string, number> = {};
    serviceData.forEach(s => { planetFreq[s.dominantPlanet] = (planetFreq[s.dominantPlanet] || 0) + 1; });
    const dominantPlanetGlobal = Object.entries(planetFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    // Service synergy: pairs that share the same best day
    const synergies: { a: ServiceAnalysis; b: ServiceAnalysis; day: string }[] = [];
    for (let i = 0; i < serviceData.length; i++) {
      for (let j = i + 1; j < serviceData.length; j++) {
        const aBest = serviceData[i].dayOfWeekAvg.indexOf(Math.max(...serviceData[i].dayOfWeekAvg));
        const bBest = serviceData[j].dayOfWeekAvg.indexOf(Math.max(...serviceData[j].dayOfWeekAvg));
        if (aBest === bBest) {
          synergies.push({ a: serviceData[i], b: serviceData[j], day: DAY_NAMES[aBest] });
        }
      }
    }

    // Peak hour hotspot (most peak windows across all services)
    const globalPeakHours = Array(24).fill(0);
    serviceData.forEach(s => s.peakHourDistribution.forEach((v, h) => { globalPeakHours[h] += v; }));
    const peakHotspot = globalPeakHours.indexOf(Math.max(...globalPeakHours));

    return {
      globalDayAvg, bestDayIdx, worstDayIdx,
      globalMorning, globalEvening, chronotype,
      dominantPlanetGlobal, synergies: synergies.slice(0, 4),
      peakHotspot, globalPeakHours,
    };
  }, [serviceData]);

  /* ── Branded timing-card renderer (per service) ────────────────────── */
  const logoImg = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = '/logo.png';
    img.onload = () => { logoImg.current = img; };
  }, []);

  const renderTimingCard = useCallback((s: ServiceAnalysis): HTMLCanvasElement | null => {
    if (!patterns) return null;
    const W = 600, H = 360;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0b0b24'); grad.addColorStop(1, '#07071a');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // Gold border
    ctx.strokeStyle = 'rgba(244,161,29,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    const r = 16; // radius
    ctx.moveTo(r + 6, 6); ctx.lineTo(W - r - 6, 6); ctx.arcTo(W - 6, 6, W - 6, r + 6, r);
    ctx.lineTo(W - 6, H - r - 6); ctx.arcTo(W - 6, H - 6, W - r - 6, H - 6, r);
    ctx.lineTo(r + 6, H - 6); ctx.arcTo(6, H - 6, 6, H - r - 6, r);
    ctx.lineTo(6, r + 6); ctx.arcTo(6, 6, r + 6, 6, r);
    ctx.stroke();

    // Logo watermark (top-right, faint)
    if (logoImg.current) {
      ctx.globalAlpha = 0.08;
      ctx.drawImage(logoImg.current, W - 120, 20, 100, 100);
      ctx.globalAlpha = 1;
    }

    // Service icon + name
    ctx.font = '40px serif'; ctx.textAlign = 'left';
    ctx.fillStyle = '#F4A11D'; ctx.fillText(s.icon, 28, 56);
    ctx.font = 'bold 22px serif';
    ctx.fillStyle = '#f0ecd8'; ctx.fillText(s.name, 78, 52);

    // Score badge
    const scoreClr = s.avgScore >= 62 ? '#34d399' : s.avgScore >= 45 ? '#F4A11D' : s.avgScore >= 30 ? '#fbbf24' : '#f87171';
    ctx.font = 'bold 36px monospace'; ctx.textAlign = 'right';
    ctx.fillStyle = scoreClr; ctx.fillText(String(s.avgScore), W - 30, 52);
    ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.5)';
    ctx.fillText('/ 100  AVG', W - 30, 68);

    // Divider
    ctx.strokeStyle = 'rgba(244,161,29,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(28, 80); ctx.lineTo(W - 28, 80); ctx.stroke();

    // Timing details
    ctx.textAlign = 'left'; ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText('BEST TIMING', 28, 104);

    const bestDow = s.dayOfWeekAvg.indexOf(Math.max(...s.dayOfWeekAvg));
    const peakH = s.peakHourDistribution.indexOf(Math.max(...s.peakHourDistribution));

    ctx.font = '15px monospace'; ctx.fillStyle = '#f0ecd8';
    ctx.fillText(`${DAY_NAMES[bestDow]}s at ${String(peakH).padStart(2, '0')}:00`, 28, 124);
    ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.55)';
    ctx.fillText(`Peak window: ${s.bestDay} at ${String(s.bestHour).padStart(2, '0')}:00 (score ${s.bestScore})`, 28, 144);

    // Peaks + trend (capped at 280px to avoid chart overlap)
    ctx.fillStyle = 'rgba(244,161,29,0.7)'; ctx.font = 'bold 11px monospace';
    ctx.fillText('90-DAY OUTLOOK', 28, 174);
    ctx.font = '13px monospace'; ctx.fillStyle = '#f0ecd8';
    const arrow = s.trend === 'rising' ? '↑' : s.trend === 'falling' ? '↓' : '→';
    const tClr = s.trend === 'rising' ? '#34d399' : s.trend === 'falling' ? '#f87171' : '#f0ecd8';
    ctx.save(); ctx.beginPath(); ctx.rect(28, 180, 280, 40); ctx.clip();
    ctx.fillText(`${s.peakCount} peaks · ${s.weakCount} low hrs`, 28, 194);
    ctx.fillStyle = tClr;
    ctx.fillText(`Trend: ${arrow} ${s.trend}`, 28, 214);
    ctx.restore();

    // Mini peak-hour bar chart
    ctx.fillStyle = 'rgba(244,161,29,0.7)'; ctx.font = 'bold 11px monospace';  ctx.textAlign = 'left';
    ctx.fillText('PEAK HOURS', 320, 104);
    const maxPeak = Math.max(...s.peakHourDistribution, 1);
    const barAreaX = 320, barAreaY = 115, barAreaW = 250, barAreaH = 50;
    for (let h = 0; h < 24; h++) {
      const bw = barAreaW / 24 - 1;
      const bh = (s.peakHourDistribution[h] / maxPeak) * barAreaH;
      const bx = barAreaX + h * (barAreaW / 24);
      ctx.fillStyle = h === peakH ? '#F4A11D' : 'rgba(244,161,29,0.25)';
      ctx.fillRect(bx, barAreaY + barAreaH - bh, bw, bh);
    }
    ctx.font = '8px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.35)'; ctx.textAlign = 'center';
    [0, 6, 12, 18].forEach(h => {
      ctx.fillText(String(h).padStart(2, '0'), barAreaX + h * (barAreaW / 24) + (barAreaW / 48), barAreaY + barAreaH + 10);
    });

    // Planet
    ctx.textAlign = 'left'; ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText('RULING PLANET', 320, 194);
    ctx.font = '14px monospace'; ctx.fillStyle = '#a5b4fc';
    ctx.fillText(s.dominantPlanet, 320, 214);

    // Strategy summary
    ctx.textAlign = 'left'; ctx.font = 'bold 11px monospace'; ctx.fillStyle = 'rgba(244,161,29,0.7)';
    ctx.fillText('STRATEGY', 28, 244);
    const strategy = s.avgScore >= 50 && s.trend === 'rising'
      ? `Power zone & rising — invest more time here, planetary winds at your back.`
      : s.avgScore >= 50
      ? `Strong foundation. ${s.trend === 'falling' ? 'Front-load key activities in the next 30 days.' : 'Maintain your current rhythm.'}`
      : s.trend === 'rising'
      ? `Currently challenging but improving. Build habits during peak windows.`
      : `Strict timing needed — only engage during your ${s.peakCount} golden windows.`;
    ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(240,236,216,0.7)';
    // Word-wrap strategy into 2 lines
    const words = strategy.split(' ');
    let line = '', ly = 262;
    words.forEach(word => {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > W - 56) { ctx.fillText(line.trim(), 28, ly); line = word + ' '; ly += 18; }
      else { line = test; }
    });
    if (line.trim()) ctx.fillText(line.trim(), 28, ly);

    // Footer branding
    ctx.fillStyle = 'rgba(244,161,29,0.35)'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('timeceptor.com — powered by timecept.com™  ©', W / 2, H - 16);

    // Logo (bottom-left, clear)
    if (logoImg.current) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(logoImg.current, 16, H - 56, 44, 44);
      ctx.globalAlpha = 1;
    }

    return canvas;
  }, [patterns]);

  const downloadCard = useCallback((s: ServiceAnalysis) => {
    const canvas = renderTimingCard(s);
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `timeceptor-${s.id}-timing.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [renderTimingCard]);

  const shareCard = useCallback(async (s: ServiceAnalysis) => {
    const canvas = renderTimingCard(s);
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/png'));
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'timing.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `My ${s.name} Timing — Timeceptor`,
          text: `Best time for ${s.name}: ${DAY_NAMES[s.dayOfWeekAvg.indexOf(Math.max(...s.dayOfWeekAvg))]}s. Score: ${s.avgScore}/100`,
          files: [new File([blob], `timeceptor-${s.id}-timing.png`, { type: 'image/png' })],
        });
      } else {
        // Fallback: just download
        downloadCard(s);
      }
    } catch { downloadCard(s); }
  }, [renderTimingCard, downloadCard]);

  // Auto-popup sample timing card when analysis completes (shows the viral card)
  useEffect(() => {
    if (serviceData.length === 0 || !renderTimingCard) return;
    const best = [...serviceData].sort((a, b) => b.avgScore - a.avgScore)[0];
    if (!best) return;
    const t = setTimeout(() => {
      const canvas = renderTimingCard(best);
      if (canvas) {
        setSampleCardUrl(canvas.toDataURL('image/png'));
        setSampleService(best);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [serviceData, renderTimingCard]);

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
            <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] sm:text-xs tracking-widest text-cream-dim/60 hover:text-gold/70 transition-colors font-medium">by timecept.com</a>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/dashboard" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            My Cosmos
          </Link>
          <Link to="/decide" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            🎯 Act or Wait?
          </Link>
          <Link to="/plans" className="hidden sm:flex items-center gap-2 font-mono text-sm text-cream-dim tracking-widest uppercase border-2 border-gold/35 rounded-full px-5 py-2.5 hover:border-gold/70 hover:text-gold hover:bg-gold/5 transition-all">
            📋 Life Blueprints
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
              <div className="absolute right-0 top-full mt-2 w-44 bg-space-card border border-gold/20 rounded-sm shadow-xl z-50">
                <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">My Cosmos</Link>
                <Link to="/app" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">⏰ Golden Hour</Link>
                <Link to="/decide" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">🎯 Act or Wait?</Link>
                <Link to="/plans" onClick={() => setUserMenuOpen(false)} className="block w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors border-b border-gold/10">📋 Life Blueprints</Link>
                <button onClick={() => { signOutUser(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-3 font-mono text-xs tracking-widest uppercase text-cream-dim hover:text-gold hover:bg-gold/5 transition-colors">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-gold mb-2">✦ SWOT Analysis</h1>
              <p className="font-mono text-xs sm:text-sm text-cream-dim tracking-widest uppercase">
                90-day planetary timing intelligence across all life domains
              </p>
            </div>
          </div>
        </motion.div>

        {computing ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-2 border-gold/40 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gold font-mono text-sm tracking-widest uppercase mb-2">Computing SWOT Analysis</p>
            <p className="text-cream-dim text-xs">Analyzing 90 days × 8 services × 24 hours = 17,280 planetary windows…</p>
          </div>
        ) : !birthData ? (
          <div className="text-center py-16">
            <p className="text-cream-dim mb-4">Enter your birth details first to generate your SWOT analysis.</p>
            <Link to="/app" className="inline-block px-6 py-3 bg-gold text-space-bg font-mono text-xs font-bold tracking-widest uppercase hover:bg-gold-light transition-all rounded-sm">Set Up My Chart</Link>
          </div>
        ) : swot && patterns ? (
          <div className="relative">
            {/* Soft paywall overlay for non-paid users */}
            {!hasPaid && (
              <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 mb-6">
                <div className="bg-gradient-to-b from-space-bg via-space-bg/95 to-transparent p-6 sm:p-8 text-center rounded-b-xl border-b border-gold/20">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full mb-4">
                    <span className="font-mono text-[10px] text-gold tracking-widest uppercase font-bold">7-Day Preview</span>
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-gold mb-2">Unlock Your Full SWOT Analysis</h3>
                  <p className="text-sm text-cream-dim mb-5 max-w-lg mx-auto">You're viewing a 7-day preview. Unlock up to 365 days of deep analysis across all 8 life domains.</p>
                  <button
                    onClick={handleUnlock}
                    className="px-8 py-3.5 bg-gold text-space-bg font-bold uppercase tracking-widest text-sm rounded-full shadow-[0_0_20px_rgba(212,168,75,0.5)] hover:shadow-[0_0_35px_rgba(212,168,75,0.8)] transition-all"
                  >
                    🔓 Unlock Now
                  </button>
                  <p className="font-mono text-[10px] text-cream-dim/60 mt-2 tracking-widest">One-time payment · No subscription · All products</p>
                </div>
              </div>
            )}
            {/* Tab bar */}
            <div className="flex gap-1 mb-8 border-b border-gold/10 overflow-x-auto">
              {TABS.map(tab => (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 font-mono text-xs tracking-widest uppercase whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-gold text-gold bg-gold/5'
                      : tab.id === 'actions' && activeTab !== 'actions'
                      ? 'border-gold/40 text-gold bg-gold/[0.07] tab-glow rounded-t-lg'
                      : 'border-transparent text-cream-dim hover:text-gold/70 hover:border-gold/30'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Service performance cards */}
                <h2 className="font-mono text-xs tracking-widest uppercase text-gold/60 mb-4">Service Performance Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {[...serviceData].sort((a, b) => b.avgScore - a.avgScore).map((s, idx) => (
                    <div key={s.id} className="border border-gold/10 rounded-lg p-4 bg-white/[0.02] relative overflow-hidden group hover:border-gold/25 transition-colors">
                      {idx === 0 && <div className="absolute top-0 right-0 bg-gold/15 text-gold text-[10px] font-mono font-bold px-2 py-0.5 rounded-bl-lg tracking-widest">BEST</div>}
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className="font-mono text-xs text-cream-dim tracking-wide mb-2">{s.name}</div>
                      <div className={`text-3xl font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}</div>
                      {/* Score bar */}
                      <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBg(s.avgScore)} transition-all`} style={{ width: `${s.avgScore}%`, opacity: 0.7 }} />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="font-mono text-xs text-cream-dim">{s.peakCount} peaks</span>
                        <span className={`font-mono text-xs font-bold ${trendColor(s.trend)}`}>{trendIcon(s.trend)} {s.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <div className="border border-gold/10 rounded-lg p-4 bg-white/[0.02] text-center">
                    <div className="text-2xl font-bold text-gold">{DAY_NAMES[patterns.bestDayIdx]}</div>
                    <div className="font-mono text-xs text-cream-dim tracking-widest mt-1 font-medium">BEST DAY</div>
                  </div>
                  <div className="border border-gold/10 rounded-lg p-4 bg-white/[0.02] text-center">
                    <div className="text-2xl font-bold text-indigo-300">{String(patterns.peakHotspot).padStart(2, '0')}:00</div>
                    <div className="font-mono text-xs text-cream-dim tracking-widest mt-1 font-medium">PEAK HOUR</div>
                  </div>
                  <div className="border border-gold/10 rounded-lg p-4 bg-white/[0.02] text-center">
                    <div className="text-2xl font-bold text-amber-300 capitalize">{patterns.chronotype}</div>
                    <div className="font-mono text-xs text-cream-dim tracking-widest mt-1 font-medium">CHRONOTYPE</div>
                  </div>
                  <div className="border border-gold/10 rounded-lg p-4 bg-white/[0.02] text-center">
                    <div className="text-2xl font-bold text-emerald-400">{patterns.dominantPlanetGlobal}</div>
                    <div className="font-mono text-xs text-cream-dim tracking-widest mt-1 font-medium">RULING PLANET</div>
                  </div>
                </div>

                {/* Key insights — rich */}
                <div className="border border-gold/10 rounded-lg p-6 bg-white/[0.01]">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">Key Insights</h3>
                  <div className="space-y-3 text-sm text-cream-dim leading-relaxed">
                    {(() => {
                      const best = serviceData.reduce((a, b) => a.avgScore > b.avgScore ? a : b);
                      const worst = serviceData.reduce((a, b) => a.avgScore < b.avgScore ? a : b);
                      const totalPeaks = serviceData.reduce((a, s) => a + s.peakCount, 0);
                      return (
                        <>
                          <p><strong className="text-gold">{best.icon} {best.name}</strong> is your strongest domain at <strong className="text-emerald-400">{best.avgScore}</strong>/100 with <strong className="text-emerald-400">{best.peakCount}</strong> peak windows. Prioritise this for maximum planetary support.</p>
                          <p><strong className="text-red-300">{worst.icon} {worst.name}</strong> scores lowest at <strong className="text-red-300">{worst.avgScore}</strong>/100. Timing is crucial — only engage during golden windows.</p>
                          <p>You have <strong className="text-gold">{totalPeaks.toLocaleString()}</strong> peak opportunities across 90 days — roughly <strong className="text-gold">{Math.round(totalPeaks / 90)}</strong> golden windows per day.</p>
                          <p>Your planetary energy peaks on <strong className="text-gold">{DAY_NAMES[patterns.bestDayIdx]}s</strong> and dips on <strong className="text-red-300">{DAY_NAMES[patterns.worstDayIdx]}s</strong>. Plan your most important activities accordingly.</p>
                          {patterns.chronotype !== 'balanced' && (
                            <p>You're a <strong className={patterns.chronotype === 'morning' ? 'text-amber-300' : 'text-indigo-300'}>{patterns.chronotype} person</strong> by planetary alignment — {patterns.chronotype === 'morning' ? 'schedule demanding activities before noon' : 'evenings carry your strongest energy'}.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ SWOT MATRIX TAB ═══ */}
            {activeTab === 'swot' && (
              <motion.div key="swot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {/* Strengths */}
                  <div className="border-2 border-emerald-500/20 rounded-lg p-5 bg-emerald-500/[0.03]">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg font-bold">S</span>
                      <span className="font-mono text-sm tracking-widest uppercase text-emerald-400 font-bold">Strengths</span>
                    </div>
                    <div className="space-y-4">{swot.strengths.map((item, i) => (
                      <div key={i} className="pl-3 border-l-2 border-emerald-500/30">
                        <div className="font-mono text-xs font-bold text-emerald-300 mb-1">{item.title}</div>
                        <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                      </div>
                    ))}</div>
                  </div>

                  {/* Weaknesses */}
                  <div className="border-2 border-red-500/20 rounded-lg p-5 bg-red-500/[0.03]">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 text-lg font-bold">W</span>
                      <span className="font-mono text-sm tracking-widest uppercase text-red-400 font-bold">Weaknesses</span>
                    </div>
                    <div className="space-y-4">{swot.weaknesses.map((item, i) => (
                      <div key={i} className="pl-3 border-l-2 border-red-500/30">
                        <div className="font-mono text-xs font-bold text-red-300 mb-1">{item.title}</div>
                        <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                      </div>
                    ))}</div>
                  </div>

                  {/* Opportunities */}
                  <div className="border-2 border-gold/20 rounded-lg p-5 bg-gold/[0.03]">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold text-lg font-bold">O</span>
                      <span className="font-mono text-sm tracking-widest uppercase text-gold font-bold">Opportunities</span>
                    </div>
                    <div className="space-y-4">{swot.opportunities.map((item, i) => (
                      <div key={i} className="pl-3 border-l-2 border-gold/30">
                        <div className="font-mono text-xs font-bold text-gold/80 mb-1">{item.title}</div>
                        <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                      </div>
                    ))}</div>
                  </div>

                  {/* Threats */}
                  <div className="border-2 border-purple-500/20 rounded-lg p-5 bg-purple-500/[0.03]">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-lg font-bold">T</span>
                      <span className="font-mono text-sm tracking-widest uppercase text-purple-400 font-bold">Threats</span>
                    </div>
                    <div className="space-y-4">{swot.threats.map((item, i) => (
                      <div key={i} className="pl-3 border-l-2 border-purple-500/30">
                        <div className="font-mono text-xs font-bold text-purple-300 mb-1">{item.title}</div>
                        <p className="text-xs text-cream-dim leading-relaxed">{item.detail}</p>
                      </div>
                    ))}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ PATTERNS TAB ═══ */}
            {activeTab === 'patterns' && (
              <motion.div key="patterns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* Day-of-week heatmap */}
                <div className="border border-gold/10 rounded-lg p-3 sm:p-5 bg-white/[0.01] mb-6">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">Weekly Energy Rhythm</h3>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                    {DAY_NAMES.map((day, i) => (
                      <div key={day} className="text-center">
                        <div className="font-mono text-xs text-cream-dim tracking-widest mb-2">{day}</div>
                        <div className={`mx-auto w-9 h-9 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-sm sm:text-lg font-bold ${
                          i === patterns.bestDayIdx ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40' :
                          i === patterns.worstDayIdx ? 'bg-red-500/15 text-red-400' :
                          'bg-white/[0.04] text-cream-dim'
                        }`}>
                          {patterns.globalDayAvg[i]}
                        </div>
                        {i === patterns.bestDayIdx && <div className="font-mono text-[10px] text-emerald-400 mt-1 font-bold">BEST</div>}
                        {i === patterns.worstDayIdx && <div className="font-mono text-[10px] text-red-400 mt-1 font-bold">WEAKEST</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Morning vs Evening */}
                <div className="border border-gold/10 rounded-lg p-5 bg-white/[0.01] mb-6">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">Chronotype — Morning vs Evening</h3>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-xs text-amber-300">☀ Morning (4–9 AM)</span>
                        <span className={`font-mono text-sm font-bold ${patterns.globalMorning > patterns.globalEvening ? 'text-emerald-400' : 'text-cream-dim'}`}>{patterns.globalMorning}</span>
                      </div>
                      <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${patterns.globalMorning}%` }} />
                      </div>
                    </div>
                    <div className="hidden sm:block text-gold/40 font-mono text-xs">vs</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-xs text-indigo-300">☽ Evening (6–10 PM)</span>
                        <span className={`font-mono text-sm font-bold ${patterns.globalEvening > patterns.globalMorning ? 'text-emerald-400' : 'text-cream-dim'}`}>{patterns.globalEvening}</span>
                      </div>
                      <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-400/60" style={{ width: `${patterns.globalEvening}%` }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-cream-dim leading-relaxed mt-2">
                    {patterns.chronotype === 'morning'
                      ? 'Your planetary alignment favours the morning hours. Schedule demanding or important activities before noon for best results.'
                      : patterns.chronotype === 'evening'
                      ? 'Your energy builds through the day. Evenings carry stronger planetary support — plan key activities for late afternoon and evening.'
                      : 'Your energy is balanced between morning and evening. You have flexibility to schedule important activities at either time.'}
                  </p>
                </div>

                {/* Per-service best day + hour */}
                <div className="border border-gold/10 rounded-lg p-5 bg-white/[0.01] mb-6">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">Service-Specific Timing</h3>
                  <div className="space-y-3">
                    {[...serviceData].sort((a, b) => b.avgScore - a.avgScore).map(s => {
                      const bestDow = s.dayOfWeekAvg.indexOf(Math.max(...s.dayOfWeekAvg));
                      const peakH = s.peakHourDistribution.indexOf(Math.max(...s.peakHourDistribution));
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                          <span className="text-xl w-8 text-center">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs font-bold text-cream tracking-wide">{s.name}</div>
                            <div className="font-mono text-xs text-cream-dim">
                              Best on <strong className="text-gold">{DAY_NAMES[bestDow]}s</strong> around <strong className="text-gold">{String(peakH).padStart(2, '0')}:00</strong> · Dominated by <strong className="text-indigo-300">{s.dominantPlanet}</strong>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${scoreColor(s.avgScore)} tabular-nums`}>{s.avgScore}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Synergy pairs */}
                {patterns.synergies.length > 0 && (
                  <div className="border border-gold/10 rounded-lg p-5 bg-white/[0.01] mb-6">
                    <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">Service Synergies</h3>
                    <p className="text-xs text-cream-dim mb-4">These service pairs share peak energy on the same day — combining them amplifies results.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {patterns.synergies.map((syn, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gold/10 bg-gold/[0.02]">
                          <span className="text-lg">{syn.a.icon}</span>
                          <span className="text-gold/40">+</span>
                          <span className="text-lg">{syn.b.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs text-cream-dim">{syn.a.name} + {syn.b.name}</div>
                            <div className="font-mono text-xs text-gold">Peak on {syn.day}s</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Peak hour distribution */}
                <div className="border border-gold/10 rounded-lg p-5 bg-white/[0.01]">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">24-Hour Peak Distribution</h3>
                  <div className="flex items-end gap-[2px] h-20">
                    {patterns.globalPeakHours.map((count, h) => {
                      const max = Math.max(...patterns.globalPeakHours, 1);
                      const heightPct = (count / max) * 100;
                      return (
                        <div key={h} className="flex-1 flex flex-col items-center justify-end">
                          <div className={`w-full rounded-t-sm transition-all ${h === patterns.peakHotspot ? 'bg-gold' : 'bg-gold/30'}`}
                            style={{ height: `${heightPct}%`, minHeight: count > 0 ? 2 : 0 }} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-[2px] mt-1">
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="flex-1 text-center font-mono text-[9px] text-cream-dim/65">
                        {h % 6 === 0 ? String(h).padStart(2, '0') : ''}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ ACTION PLAN TAB ═══ */}
            {activeTab === 'actions' && (
              <motion.div key="actions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="border border-gold/10 rounded-lg p-6 bg-white/[0.01] mb-6">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-2 font-bold">Your Personalised Action Plan</h3>
                  <p className="text-xs text-cream-dim mb-6">Based on your 90-day planetary analysis, here's how to optimise each life domain.</p>

                  <div className="space-y-5">
                    {[...serviceData].sort((a, b) => b.avgScore - a.avgScore).map(s => {
                      const bestDow = s.dayOfWeekAvg.indexOf(Math.max(...s.dayOfWeekAvg));
                      const peakH = s.peakHourDistribution.indexOf(Math.max(...s.peakHourDistribution));
                      const isStrong = s.avgScore >= 50;
                      const isRising = s.trend === 'rising';
                      return (
                        <div key={s.id} className="border border-gold/10 rounded-lg p-4 bg-white/[0.015]">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{s.icon}</span>
                            <div className="flex-1">
                              <div className="font-mono text-sm font-bold text-cream tracking-wide">{s.name}</div>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}/100</span>
                                <span className={`font-mono text-xs ${trendColor(s.trend)}`}>{trendIcon(s.trend)} {s.trend}</span>
                              </div>
                            </div>
                            {/* Timing card share/download */}
                            <div className="flex items-center gap-1">
                              <button onClick={() => shareCard(s)} title="Share timing card"
                                className="p-2 rounded-lg text-indigo-300/60 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                              </button>
                              <button onClick={() => downloadCard(s)} title="Download timing card"
                                className="p-2 rounded-lg text-gold dl-bounce hover:text-gold-light hover:bg-gold/10 transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs text-cream-dim leading-relaxed">
                            <p>
                              <strong className="text-gold">Schedule:</strong> Best on <strong className="text-gold">{DAY_NAMES[bestDow]}s</strong> around <strong className="text-gold">{String(peakH).padStart(2, '0')}:00</strong>.
                              {s.bestScore >= 70 && ` Your absolute best window (score ${s.bestScore}) is on ${s.bestDay} at ${String(s.bestHour).padStart(2, '0')}:00.`}
                            </p>
                            <p>
                              <strong className="text-gold">Strategy:</strong>{' '}
                              {isStrong && isRising
                                ? `This is your power zone and getting stronger. Invest more time here — the planetary winds are at your back.`
                                : isStrong && !isRising
                                ? `Strong foundation but energy is ${s.trend === 'falling' ? 'declining — front-load important activities in the next 30 days' : 'stable — maintain your current rhythm'}.`
                                : !isStrong && isRising
                                ? `Currently challenging but improving. Start building habits during peak windows — momentum will grow.`
                                : `This requires disciplined timing. Only engage during your golden windows (${s.peakCount} available). Avoid off-peak hours.`}
                            </p>
                            <p>
                              <strong className="text-gold">Planet:</strong> Your {s.name.toLowerCase()} energy is dominated by <strong className="text-indigo-300">{s.dominantPlanet}</strong>.
                              {s.dominantPlanet === 'Jupiter' ? ' Jupiter expands and blesses — lean into this generously.' :
                               s.dominantPlanet === 'Venus' ? ' Venus brings beauty and harmony — focus on aesthetics and connection.' :
                               s.dominantPlanet === 'Mars' ? ' Mars brings action and intensity — channel it into decisive moves.' :
                               s.dominantPlanet === 'Mercury' ? ' Mercury sharpens intellect — use this for precision and communication.' :
                               s.dominantPlanet === 'Sun' ? ' The Sun illuminates authority — lead boldly during these hours.' :
                               s.dominantPlanet === 'Moon' ? ' The Moon deepens intuition — trust your instincts during these windows.' :
                               s.dominantPlanet === 'Saturn' ? ' Saturn demands discipline — structured, patient effort will pay off.' :
                               ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weekly template */}
                <div className="border border-gold/10 rounded-lg p-6 bg-white/[0.01] mb-6">
                  <h3 className="font-mono text-xs tracking-widest uppercase text-gold mb-4 font-bold">Ideal Weekly Template</h3>
                  <div className="space-y-2">
                    {DAY_NAMES.map((day, i) => {
                      const bestForDay = [...serviceData].sort((a, b) => b.dayOfWeekAvg[i] - a.dayOfWeekAvg[i]).slice(0, 3);
                      return (
                        <div key={day} className={`flex items-center gap-3 p-3 rounded-lg ${
                          i === patterns.bestDayIdx ? 'bg-emerald-500/[0.06] border border-emerald-500/20' : 'bg-white/[0.02]'
                        }`}>
                          <div className={`font-mono text-sm font-bold w-10 ${i === patterns.bestDayIdx ? 'text-emerald-400' : 'text-cream-dim'}`}>{day}</div>
                          <div className={`font-mono text-sm font-bold w-8 text-center ${scoreColor(patterns.globalDayAvg[i])}`}>{patterns.globalDayAvg[i]}</div>
                          <div className="flex-1 flex gap-2 flex-wrap">
                            {bestForDay.map(s => (
                              <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] text-xs font-mono text-cream-dim">
                                {s.icon} {s.name} <span className={scoreColor(s.dayOfWeekAvg[i])}>{s.dayOfWeekAvg[i]}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Back to dashboard */}
                <div className="text-center">
                  <Link to="/dashboard" className="inline-block px-6 py-3 border border-gold/30 text-gold font-mono text-xs tracking-widest uppercase hover:bg-gold/10 transition-all rounded-sm">
                    ← Back to Dashboard
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        ) : null}
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">Timeceptor</Link>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 font-mono text-xs text-cream-dim tracking-widest uppercase">
          <button onClick={() => setHiwOpen(true)} className="hover:text-gold transition-colors">⚙️ How It Works</button>
          <span className="hidden md:inline opacity-50">·</span>
          <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
          <span className="hidden md:inline opacity-50">·</span>
          <span>© 2026</span>
        </div>
      </footer>

      <HowItWorksModal open={hiwOpen} onClose={() => setHiwOpen(false)} />

      {/* Sample timing card auto-popup */}
      {sampleCardUrl && sampleService && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => { setSampleCardUrl(null); setSampleService(null); }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="relative max-w-xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/15 border border-gold/25 font-mono text-[10px] tracking-widest uppercase text-gold">
                ✦ Your top service — shareable timing card
              </span>
            </div>
            <img src={sampleCardUrl} alt={`${sampleService.name} timing card`} className="w-full rounded-xl shadow-2xl shadow-gold/20 border border-gold/20" />
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => shareCard(sampleService)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-mono text-xs tracking-widest uppercase hover:bg-indigo-500/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={() => downloadCard(sampleService)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/15 border border-gold/35 text-gold font-mono text-xs tracking-widest uppercase hover:bg-gold/25 transition-all animate-pulse"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                </svg>
                Download
              </button>
              <button
                onClick={() => { setSampleCardUrl(null); setSampleService(null); setActiveTab('actions'); }}
                className="px-5 py-2.5 rounded-full border border-gold/20 text-cream-dim font-mono text-xs tracking-widest uppercase hover:text-gold hover:border-gold/40 transition-all"
              >
                View Action Plan →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
