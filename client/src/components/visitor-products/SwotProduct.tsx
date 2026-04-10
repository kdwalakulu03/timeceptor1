/**
 * SwotProduct — Full SWOT analysis across 8 life services.
 * Reuses the SwotInsight component in a modal-friendly layout.
 * Includes download/share card button.
 */
import React, { useMemo, useState, useCallback } from 'react';
import type { SubProductProps } from './types';
import { SERVICES } from '../../services';
import { renderSwotCard, getCachedLogo, type SwotCardData } from '../../lib/cardRenderer';

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
  return t === 'rising' ? 'text-emerald-400' : t === 'falling' ? 'text-red-400' : 'text-cream-dim/60';
}

export function SwotProduct({ birth, computed }: SubProductProps) {
  const { swotServices, swotMatrix, weeklyWindows, selectedService } = computed;
  const sorted = useMemo(() => [...swotServices].sort((a, b) => b.avgScore - a.avgScore), [swotServices]);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateCard = useCallback(async () => {
    setGenerating(true);
    try {
      const topSvcs = sorted.slice(0, 3);
      const bottomSvcs = sorted.slice(-2);
      const rising = swotServices.filter(s => s.trend === 'rising');
      const falling = swotServices.filter(s => s.trend === 'falling');

      const todayStr = new Date().toDateString();
      const nowHour = new Date().getHours();
      const todayWindows = Array.from({ length: 24 }, (_, h) => {
        const win = weeklyWindows.find(w => w.date.toDateString() === todayStr && w.hour === h);
        return { hour: h, score: win?.score ?? 0 };
      });
      const topWin = weeklyWindows
        .filter(w => w.date.toDateString() === todayStr && w.hour >= nowHour)
        .sort((a, b) => b.score - a.score)[0];
      const svc = SERVICES.find(s => s.id === selectedService);
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
    } catch (e) { console.warn('[swot-card]', e); }
    finally { setGenerating(false); }
  }, [sorted, swotServices, weeklyWindows, selectedService]);

  const handleDownload = () => {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = 'timeceptor-swot-analysis.png';
    a.click();
  };

  const handleShare = async () => {
    if (!cardUrl) return;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], 'timeceptor-swot-analysis.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My SWOT Analysis — Timeceptor' });
      } else { handleDownload(); }
    } catch { handleDownload(); }
  };

  if (sorted.length < 4) {
    return <p className="text-cream-dim/60 text-sm text-center py-8">Not enough data to display SWOT analysis.</p>;
  }

  return (
    <div className="space-y-6">
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

      {/* Services overview */}
      <div>
        <h4 className="font-mono text-sm text-cream-dim/60 uppercase tracking-widest mb-3 font-medium">
          7-Day Service Performance (8 Life Domains)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sorted.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 border border-white/[0.06] rounded-lg bg-white/[0.02]">
              <span className="text-xl">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream font-semibold truncate">{s.name}</span>
                  <span className={`font-mono text-sm font-bold ${scoreColor(s.avgScore)}`}>{s.avgScore}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBg(s.avgScore)}`} style={{ width: `${s.avgScore}%` }} />
                  </div>
                  <span className={`text-[10px] font-semibold ${trendColor(s.trend)}`}>
                    {trendIcon(s.trend)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-cream-dim/40 font-mono">
                  <span>{s.peakCount} peaks</span>
                  <span>Best: {s.bestDay} @ {String(s.bestHour).padStart(2, '0')}:00</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SWOT Matrix */}
      {swotMatrix && (
        <div>
          <h4 className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-3">
            SWOT Matrix
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Strengths */}
            <div className="p-3 border border-emerald-400/20 rounded-lg bg-emerald-400/[0.04]">
              <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">
                ✦ Strengths
              </div>
              {swotMatrix.strengths.map((item, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="text-xs text-cream font-semibold">{item.title}</div>
                  <p className="text-[11px] text-cream-dim/50 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Weaknesses */}
            <div className="p-3 border border-red-400/20 rounded-lg bg-red-400/[0.04]">
              <div className="font-mono text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">
                ✦ Weaknesses
              </div>
              {swotMatrix.weaknesses.map((item, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="text-xs text-cream font-semibold">{item.title}</div>
                  <p className="text-[11px] text-cream-dim/50 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Opportunities */}
            <div className="p-3 border border-blue-400/20 rounded-lg bg-blue-400/[0.04]">
              <div className="font-mono text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-2">
                ✦ Opportunities
              </div>
              {swotMatrix.opportunities.map((item, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="text-xs text-cream font-semibold">{item.title}</div>
                  <p className="text-[11px] text-cream-dim/50 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Threats */}
            <div className="p-3 border border-amber-400/20 rounded-lg bg-amber-400/[0.04]">
              <div className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-bold mb-2">
                ✦ Threats
              </div>
              {swotMatrix.threats.map((item, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="text-xs text-cream font-semibold">{item.title}</div>
                  <p className="text-[11px] text-cream-dim/50 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Morning vs Evening */}
      <div>
        <h4 className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-3">
          Morning vs Evening Performance
        </h4>
        <div className="space-y-1.5">
          {sorted.slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-2.5 border border-white/[0.04] rounded-lg">
              <span>{s.icon}</span>
              <span className="text-xs text-cream min-w-[80px]">{s.name}</span>
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-cream-dim/40 min-w-[32px]">AM</span>
                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gold/70 rounded-full" style={{ width: `${s.morningAvg}%` }} />
                </div>
                <span className="text-[10px] text-cream-dim/50 font-mono min-w-[24px] text-right">{s.morningAvg}</span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-cream-dim/40 min-w-[32px]">PM</span>
                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400/70 rounded-full" style={{ width: `${s.eveningAvg}%` }} />
                </div>
                <span className="text-[10px] text-cream-dim/50 font-mono min-w-[24px] text-right">{s.eveningAvg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
              <img src={cardUrl} alt="SWOT Analysis Card" className="w-full" />
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

      <div className="text-center text-sm text-cream-dim/60 font-mono pt-2">
        SWOT analysis based on 7-day planetary hour scoring across 8 life domains
      </div>
    </div>
  );
}
