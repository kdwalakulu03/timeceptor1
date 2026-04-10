/**
 * PhotoCardProduct — Downloadable & shareable Timecept photo card.
 * Uses the canvas card renderer to generate a PNG image.
 */
import React, { useCallback, useState } from 'react';
import {
  renderSwotCard,
  getCachedLogo,
  type SwotCardData,
} from '../../lib/cardRenderer';
import { SERVICES } from '../../services';
import type { SubProductProps } from './types';

export function PhotoCardProduct({ birth, computed }: SubProductProps) {
  const { swotServices, weeklyWindows, selectedService } = computed;
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const todayStr = new Date().toDateString();
  const nowHour = new Date().getHours();

  const generateCard = useCallback(async () => {
    setGenerating(true);
    try {
      const sorted = [...swotServices].sort((a, b) => b.avgScore - a.avgScore);

      const topServices = sorted.slice(0, 3);
      const bottomServices = sorted.slice(-2);
      const risingServices = swotServices.filter(s => s.trend === 'rising');
      const fallingServices = swotServices.filter(s => s.trend === 'falling');

      const strengths = topServices.map(s => ({
        title: `${s.icon} ${s.name} — Strong alignment`,
        detail: `Score ${s.avgScore}/100 with ${s.peakCount} peak hours this week.`,
      }));
      const weaknesses = bottomServices.map(s => ({
        title: `${s.icon} ${s.name} — Needs careful timing`,
        detail: `Score ${s.avgScore}/100 with ${s.weakCount} low hours.`,
      }));
      const opportunities = risingServices.length > 0
        ? risingServices.slice(0, 2).map(s => ({
            title: `${s.icon} ${s.name} — Rising energy`,
            detail: `Trend is strengthening. Consider increasing focus here.`,
          }))
        : [{ title: '✦ All services stable', detail: 'Steady energy across all domains.' }];
      const threats = fallingServices.length > 0
        ? fallingServices.slice(0, 2).map(s => ({
            title: `${s.icon} ${s.name} — Declining energy`,
            detail: `Act sooner rather than later for this domain.`,
          }))
        : [{ title: '✦ No significant threats', detail: 'No services declining this week.' }];

      // Today windows
      const todayWindows = Array.from({ length: 24 }, (_, h) => {
        const win = weeklyWindows.find(w =>
          w.date.toDateString() === todayStr && w.hour === h
        );
        return { hour: h, score: win?.score ?? 0 };
      });

      // Golden hour
      const topWin = weeklyWindows
        .filter(w => w.date.toDateString() === todayStr && w.hour >= nowHour)
        .sort((a, b) => b.score - a.score)[0];

      const svc = SERVICES.find(s => s.id === selectedService);
      const remainingGolden = weeklyWindows
        .filter(w => w.date.toDateString() === todayStr && w.hour >= nowHour && w.score >= 80)
        .length;

      const cardData: SwotCardData = {
        services: sorted.map(s => ({ name: s.name, icon: s.icon, avgScore: s.avgScore })),
        strengths,
        weaknesses,
        opportunities,
        threats,
        todayWindows,
        goldenHour: topWin ? {
          score: topWin.score,
          hour: topWin.hour,
          horaRuler: topWin.horaRuler,
          serviceName: svc?.name ?? 'Activity',
          serviceIcon: svc?.icon ?? '⏰',
        } : undefined,
        remainingGoldenHours: remainingGolden,
      };

      const canvas = renderSwotCard(cardData, getCachedLogo());
      const url = canvas.toDataURL('image/png');
      setCardUrl(url);
    } catch (e) {
      console.warn('[photo-card]', e);
    } finally {
      setGenerating(false);
    }
  }, [swotServices, weeklyWindows, selectedService, todayStr, nowHour]);

  const handleDownload = () => {
    if (!cardUrl) return;
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = 'timeceptor-cosmic-card.png';
    a.click();
  };

  const handleShare = async () => {
    if (!cardUrl) return;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], 'timeceptor-cosmic-card.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Cosmic Timing — Timeceptor' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-cream-dim/70 mb-4">
          Generate a beautiful shareable card with your cosmic timing data.
          Perfect for social media, stories, or sending to friends.
        </p>

        {!cardUrl ? (
          <button
            onClick={generateCard}
            disabled={generating}
            className="px-8 py-3 bg-gold text-space-bg font-bold uppercase tracking-widest text-sm rounded-full shadow-[0_0_15px_rgba(244,161,29,0.4)] hover:shadow-[0_0_30px_rgba(244,161,29,0.7)] transition-all disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-space-bg/40 border-t-space-bg rounded-full animate-spin" />
                Generating…
              </span>
            ) : (
              '🎨 Generate Card'
            )}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="border border-gold/20 rounded-lg overflow-hidden max-w-md mx-auto">
              <img src={cardUrl} alt="Your Cosmic Timing Card" className="w-full" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 bg-gold text-space-bg font-bold uppercase tracking-widest text-xs rounded-full hover:shadow-[0_0_20px_rgba(244,161,29,0.5)] transition-all"
              >
                ⬇️ Download
              </button>
              <button
                onClick={handleShare}
                className="px-6 py-2.5 border-2 border-gold text-gold font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gold/10 transition-all"
              >
                📤 Share
              </button>
              <button
                onClick={generateCard}
                className="px-6 py-2.5 border border-white/10 text-cream-dim/60 font-mono uppercase tracking-widest text-xs rounded-full hover:border-gold/30 hover:text-gold transition-all"
              >
                🔄 Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-cream-dim/40 font-mono pt-2 border-t border-white/[0.05]">
        Card includes your SWOT analysis + 24-hour energy map · Share on Instagram, X, WhatsApp
      </div>
    </div>
  );
}
