/**
 * GoldenHourProduct — 7-day golden hour weekly view for visitors.
 *
 * Reuses the same WeeklyView component from the dashboard —
 * 5 days unlocked, last 2 locked/blurred, identical layout.
 * Service selector lets visitors switch between 8 life domains.
 * Includes download/share card button.
 */
import React, { useMemo, useState, useCallback } from 'react';
import type { SubProductProps } from './types';
import { SERVICES, PLANET_SERVICE_DATA } from '../../services';
import { WeeklyView } from '../WeeklyView';
import { getWeeklyWindows } from '../../lib/scoring';
import { renderSwotCard, getCachedLogo, type SwotCardData } from '../../lib/cardRenderer';
import type { ServiceId } from '../../types';

const UNLOCKED_DAYS = 5;

/* ── Main component ────────────────────────────────────────────── */
export function GoldenHourProduct({ birth, computed }: SubProductProps) {
  const [activeService, setActiveService] = useState<ServiceId>(computed.selectedService);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Compute 7 days of windows for the active service
  const weeklyWindows = useMemo(() => {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    return getWeeklyWindows(
      birth.dob, birth.tob,
      birth.lat, birth.lng,
      weekStart, activeService, 7
    );
  }, [birth, activeService]);

  // Card generator using same renderer as PhotoCard
  const generateCard = useCallback(async () => {
    setGenerating(true);
    try {
      const sorted = [...computed.swotServices].sort((a, b) => b.avgScore - a.avgScore);
      const topSvcs = sorted.slice(0, 3);
      const bottomSvcs = sorted.slice(-2);
      const rising = computed.swotServices.filter(s => s.trend === 'rising');
      const falling = computed.swotServices.filter(s => s.trend === 'falling');

      const todayStr = new Date().toDateString();
      const nowHour = new Date().getHours();
      const todayWindows = Array.from({ length: 24 }, (_, h) => {
        const win = weeklyWindows.find(w => w.date.toDateString() === todayStr && w.hour === h);
        return { hour: h, score: win?.score ?? 0 };
      });
      const topWin = weeklyWindows
        .filter(w => w.date.toDateString() === todayStr && w.hour >= nowHour)
        .sort((a, b) => b.score - a.score)[0];
      const svc = SERVICES.find(s => s.id === activeService);
      const remaining = weeklyWindows
        .filter(w => w.date.toDateString() === todayStr && w.hour >= nowHour && w.score >= 80).length;

      const cardData: SwotCardData = {
        services: sorted.map(s => ({ name: s.name, icon: s.icon, avgScore: s.avgScore })),
        strengths: topSvcs.map(s => ({ title: `${s.icon} ${s.name} — Strong`, detail: `Score ${s.avgScore}/100` })),
        weaknesses: bottomSvcs.map(s => ({ title: `${s.icon} ${s.name} — Weak`, detail: `Score ${s.avgScore}/100` })),
        opportunities: rising.length > 0
          ? rising.slice(0, 2).map(s => ({ title: `${s.icon} ${s.name} — Rising`, detail: `Best: ${s.bestDay}` }))
          : [{ title: '✦ Stable', detail: 'All steady.' }],
        threats: falling.length > 0
          ? falling.slice(0, 2).map(s => ({ title: `${s.icon} ${s.name} — Declining`, detail: 'Act sooner.' }))
          : [{ title: '✦ No threats', detail: 'Nothing declining.' }],
        todayWindows,
        goldenHour: topWin ? {
          score: topWin.score, hour: topWin.hour, horaRuler: topWin.horaRuler,
          serviceName: svc?.name ?? 'Activity', serviceIcon: svc?.icon ?? '⏰',
        } : undefined,
        remainingGoldenHours: remaining,
      };
      const canvas = renderSwotCard(cardData, getCachedLogo());
      setCardUrl(canvas.toDataURL('image/png'));
    } catch (e) { console.warn('[golden-card]', e); }
    finally { setGenerating(false); }
  }, [computed, weeklyWindows, activeService]);

  const handleDownload = () => {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = `timeceptor-golden-hours-${activeService}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!cardUrl) return;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], 'timeceptor-golden-hours.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Golden Hours — Timeceptor' });
      } else { handleDownload(); }
    } catch { handleDownload(); }
  };

  return (
    <div className="space-y-5">
      {/* Top action bar — share/download pinned to the right */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={cardUrl ? handleDownload : generateCard}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/30 text-gold font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gold/20 hover:border-gold/50 transition-all cursor-pointer disabled:opacity-50"
        >
          {generating ? (
            <span className="w-3.5 h-3.5 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
          ) : (
            <>{cardUrl ? '⬇️' : '🎨'}</>  
          )}
          {cardUrl ? 'Download' : 'Get Card'}
        </button>
        {cardUrl && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 border border-gold/40 text-gold font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gold/10 transition-all cursor-pointer"
          >
            📤 Share
          </button>
        )}
      </div>

      {/* Service selector tabs */}
      <div>
        <p className="font-mono text-sm tracking-widest uppercase text-cream-dim/60 mb-3 font-medium">
          Select a life domain:
        </p>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveService(s.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                activeService === s.id
                  ? 'bg-gold/15 border-2 border-gold/50 text-gold shadow-[0_0_12px_rgba(244,161,29,0.15)]'
                  : 'bg-white/[0.03] border border-white/[0.1] text-cream-dim/60 hover:border-white/[0.2] hover:text-cream-dim/80'
              }`}
            >
              {s.icon} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reuse the exact same WeeklyView from the dashboard */}
      <WeeklyView
        windows={weeklyWindows}
        unlockedDays={UNLOCKED_DAYS}
        selectedService={activeService}
      />

      {/* Download / Share card */}
      <div className="border-t border-white/[0.06] pt-5 mt-4">
        {!cardUrl ? (
          <button
            onClick={generateCard}
            disabled={generating}
            className="w-full py-3 bg-gold/10 border-2 border-gold/30 text-gold font-bold uppercase tracking-widest text-sm rounded-full hover:bg-gold/20 hover:border-gold/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
                Generating…
              </span>
            ) : '🎨 Download / Share Timeceptor Card'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="border border-gold/20 rounded-lg overflow-hidden max-w-md mx-auto">
              <img src={cardUrl} alt="Golden Hours Card" className="w-full" />
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={handleDownload} className="px-6 py-2.5 bg-gold text-space-bg font-bold uppercase tracking-widest text-xs rounded-full hover:shadow-[0_0_20px_rgba(244,161,29,0.5)] transition-all cursor-pointer">
                ⬇️ Download
              </button>
              <button onClick={handleShare} className="px-6 py-2.5 border-2 border-gold text-gold font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gold/10 transition-all cursor-pointer">
                📤 Share
              </button>
              <button onClick={generateCard} className="px-6 py-2.5 border border-white/10 text-cream-dim/60 font-mono uppercase tracking-widest text-xs rounded-full hover:border-gold/30 hover:text-gold transition-all cursor-pointer">
                🔄
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
