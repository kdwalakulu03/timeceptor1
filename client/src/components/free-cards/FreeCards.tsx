/**
 * FreeCards — Rich free-card section on /app for all users (including anonymous).
 *
 * Shows:
 *   1. SwotInsight — full overview/matrix/action-plan (the enchanter)
 *   2. Canvas card previews — Golden Hour + SWOT for download/share
 *   3. Login prompt baked into everything
 *
 * Goal: make anonymous users feel they got real value *and* crave more.
 */
import React, { useCallback } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../../firebase';
import {
  renderSwotCard,
  getCachedLogo,
  type SwotCardData,
} from '../../lib/cardRenderer';
import { CardDisplay } from './CardDisplay';
import { SwotInsight } from './SwotInsight';
import type { FreeCardsData } from './types';

interface FreeCardsProps {
  data: FreeCardsData;
}

export function FreeCards({ data }: FreeCardsProps) {
  const { goldenHour, swotServices, swotMatrix, userName, isAuthed, remainingGoldenHours, todayWindows } = data;

  const handleSignIn = useCallback(() => {
    signInWithGoogle().catch(console.warn);
  }, []);

  // Canvas: Combined SWOT + Golden Hour card
  const renderCombinedCard = useCallback(() => {
    const sorted = [...swotServices].sort((a, b) => b.avgScore - a.avgScore);

    // Build prose for SWOT quadrants
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

    const yogaSvc = swotServices.find(s => s.id === 'yoga');
    const healthSvc = swotServices.find(s => s.id === 'health');

    const yogaAction = yogaSvc
      ? `Best on ${yogaSvc.bestDay} at ${String(yogaSvc.bestHour).padStart(2, '0')}:00. ${yogaSvc.avgScore >= 50 ? 'Strong alignment — increase intensity.' : `Only ${yogaSvc.peakCount} peak windows — time sessions carefully.`}`
      : undefined;

    const healthAction = healthSvc
      ? `Best on ${healthSvc.bestDay} at ${String(healthSvc.bestHour).padStart(2, '0')}:00. ${healthSvc.avgScore >= 50 ? 'Vitality is strong — great time for new health goals.' : `Schedule wellness activities during your ${healthSvc.peakCount} peak windows.`}`
      : undefined;

    // Build Key Insights data
    const FREE_IDS = new Set(['yoga', 'meditation']);
    const freeOnly = swotServices.filter(s => FREE_IDS.has(s.id));
    const visSorted = isAuthed ? sorted : sorted.filter(s => FREE_IDS.has(s.id));
    const best = visSorted[0];
    const worst = visSorted[visSorted.length - 1];
    const mornAvg = freeOnly.reduce((a, s) => a + (s.morningAvg ?? 0), 0) / (freeOnly.length || 1);
    const eveAvg = freeOnly.reduce((a, s) => a + (s.eveningAvg ?? 0), 0) / (freeOnly.length || 1);
    const chronoLabel = mornAvg > eveAvg + 3 ? 'mornings' : eveAvg > mornAvg + 3 ? 'evenings' : 'any time of day';
    const totalPeaks = freeOnly.reduce((a, s) => a + s.peakCount, 0);
    const lockedServices = sorted.filter(s => !FREE_IDS.has(s.id));

    const cardData: SwotCardData = {
      services: sorted.map(s => ({ name: s.name, icon: s.icon, avgScore: s.avgScore })),
      strengths,
      weaknesses,
      opportunities,
      threats,
      userName,
      yogaAction,
      healthAction,
      todayWindows: todayWindows.map(w => ({ hour: w.hour, score: w.score })),
      goldenHour: goldenHour ?? undefined,
      remainingGoldenHours,
      insights: best && worst ? {
        bestName: best.name,
        bestIcon: best.icon,
        bestScore: best.avgScore,
        bestTrend: best.trend,
        worstName: worst.name,
        worstIcon: worst.icon,
        worstPeakCount: worst.peakCount,
        worstTrend: worst.trend,
        chronoLabel,
        totalPeaks,
        lockedNames: isAuthed ? [] : lockedServices.map(s => `${s.icon} ${s.name}`),
      } : undefined,
    };
    return renderSwotCard(cardData, getCachedLogo());
  }, [swotServices, userName, todayWindows, goldenHour, remainingGoldenHours]);

  const hasGolden = !!goldenHour;
  const hasSwot = swotServices.length >= 4;

  if (!hasGolden && !hasSwot) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
    >
      {/* ── Rich SWOT Insight (the showstopper) ── */}
      {hasSwot && (
        <div className="mb-5">
          <SwotInsight
            services={swotServices}
            matrix={swotMatrix}
            onSignIn={handleSignIn}
            isAuthed={isAuthed}
            todayWindows={todayWindows}
            goldenHour={goldenHour}
          />
        </div>
      )}

      {/* ── Shareable Card Previews ── */}
      <div className="flex items-center gap-3 mb-3">
        <img src="/logo.png" alt="" className="w-6 h-6 object-contain opacity-80" />
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-gold font-bold">
            Your Shareable Timecept Cards
          </div>
          <p className="text-[10px] text-cream-dim/45">Download & share on social media — show the world your cosmic timing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        {hasSwot && (
          <CardDisplay
            title="Your Cosmic Timing Card"
            subtitle="SWOT analysis + today's 24-hour energy map"
            accentClass="text-gold"
            renderCanvas={renderCombinedCard}
            shareTitle="My Cosmic Timing — Timeceptor"
            shareText={`Strongest: ${swotServices[0]?.name} (${swotServices[0]?.avgScore})${goldenHour ? ` · Golden hour at ${goldenHour.hour % 12 || 12}${goldenHour.hour >= 12 ? 'PM' : 'AM'}` : ''}`}
            filename="timeceptor-cosmic-timing.png"
          />
        )}
      </div>

      {/* ── Extra sign-in nudge below cards (only for anonymous) ── */}
      {!isAuthed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-3"
        >
          <p className="text-[10px] text-cream-dim/40 mb-2">
            These cards use 7-day basic data — patterns may not be fully accurate.
          </p>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full font-mono text-[10px] text-gold tracking-widest font-bold hover:bg-gold/20 transition-all"
          >
            🔓 Sign in for 90-day deep analysis & personalised strategies
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
