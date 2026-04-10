/**
 * ReelProduct — Reel preview + download for the visitor results page.
 *
 * Shows a phone-frame carousel preview of all slides (Cover, Charts, Dasha,
 * Golden Hours, SWOT) plus a "Download Reel" button that captures each slide
 * step-by-step and encodes an MP4/WebM video.
 *
 * For now uses default Ronaldo birth data — will be replaced with the
 * current visitor's birth data later.
 */
import React, { useMemo } from 'react';
import { calculateChart } from '../../../lib/astrology';
import type { ChartData } from '../../../lib/astrology';
import { ReelGenerator } from './ReelGenerator';
import type { ReelSlide } from './ReelGenerator';
import { SlideCover, coverRecordConfig } from './slides/SlideCover';
import { SlideChart, chartRecordConfig } from './slides/SlideChart';
import { SlideChartSouth, chartSouthRecordConfig } from './slides/SlideChartSouth';
import { SlideChartEastern, chartEasternRecordConfig } from './slides/SlideChartEastern';
import { SlideDasha, dashaRecordConfig } from './slides/SlideDasha';
import { SlideGoldenHour, goldenRecordConfig } from './slides/SlideGoldenHour';
import { SlideSWOT, swotRecordConfig } from './slides/SlideSWOT';
import type { SubProductProps } from '../types';

// ── Default birth data — used as fallback ──────────────────────────
const DEFAULT_BIRTH = {
  name:         'Cosmic Soul',
  dob:          '1985-02-05',
  tob:          '06:00:00',
  dobDisplay:   'Feb 5, 1985',
  tobDisplay:   '06:00 AM',
  locationName: 'Unknown',
  lat:          32.6669,
  lng:          -16.9241,
};

export function ReelProduct({ birth, computed, onClose, reelName, reelAvatar }: SubProductProps & { onClose?: () => void; reelName?: string; reelAvatar?: string }) {
  // Use the visitor's chart if available, otherwise fall back to default
  const { chart, birthInfo } = useMemo(() => {
    const displayName = reelName || 'Cosmic Soul';
    if (computed?.chart) {
      // Format display strings from visitor birth data
      const bd = new Date(`${birth.dob}T${birth.tob}`);
      const dobDisplay = bd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const tobDisplay = bd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return {
        chart: computed.chart,
        birthInfo: {
          name: displayName,
          dob: birth.dob,
          tob: birth.tob.length === 5 ? `${birth.tob}:00` : birth.tob,
          dobDisplay,
          tobDisplay,
          locationName: birth.locationName,
          lat: birth.lat,
          lng: birth.lng,
        },
      };
    }
    // Fallback
    const date = new Date(`${DEFAULT_BIRTH.dob}T${DEFAULT_BIRTH.tob}Z`);
    return {
      chart: calculateChart(date, DEFAULT_BIRTH.lat, DEFAULT_BIRTH.lng),
      birthInfo: { ...DEFAULT_BIRTH, name: displayName },
    };
  }, [birth, computed, reelName]);

  const B = birthInfo;

  // ── Reel recording slides (step-controlled for capture) ────────
  const reelSlides: ReelSlide[] = useMemo(() => {
    const coverCfg  = coverRecordConfig(B.name.length, B.locationName.length);
    const chartCfg  = chartRecordConfig();
    const southCfg  = chartSouthRecordConfig();
    const eastCfg   = chartEasternRecordConfig();
    const dashaCfg  = dashaRecordConfig(7);
    const goldenCfg = goldenRecordConfig();
    const swotCfg   = swotRecordConfig();

    return [
      {
        id: 'cover', label: 'Cover',
        totalSteps: coverCfg.total,
        holdFrames: coverCfg.holdFrames,
        render: (step: number) => (
          <SlideCover
            name={B.name} dob={B.dobDisplay} tob={B.tobDisplay}
            locationName={B.locationName} chart={chart} recordStep={step}
            avatarUrl={reelAvatar}
          />
        ),
      },
      {
        id: 'chart-west', label: 'Western',
        totalSteps: chartCfg.total,
        holdFrames: chartCfg.holdFrames,
        render: (step: number) => (
          <SlideChart
            name={B.name} chart={chart} dob={B.dobDisplay}
            locationName={B.locationName} recordStep={step}
            avatarUrl={reelAvatar}
          />
        ),
      },
      {
        id: 'chart-south', label: 'S. Indian',
        totalSteps: southCfg.total,
        holdFrames: southCfg.holdFrames,
        render: (step: number) => (
          <SlideChartSouth
            name={B.name} chart={chart} dob={B.dobDisplay}
            locationName={B.locationName} recordStep={step}
            avatarUrl={reelAvatar}
          />
        ),
      },
      {
        id: 'chart-north', label: 'N. Indian',
        totalSteps: eastCfg.total,
        holdFrames: eastCfg.holdFrames,
        render: (step: number) => (
          <SlideChartEastern
            name={B.name} chart={chart} dob={B.dobDisplay}
            locationName={B.locationName} recordStep={step}
            avatarUrl={reelAvatar}
          />
        ),
      },
      {
        id: 'dasha', label: 'Dasha',
        totalSteps: dashaCfg.total,
        holdFrames: dashaCfg.holdFrames,
        render: (step: number) => (
          <SlideDasha
            name={B.name} chart={chart} dob={B.dob} tob={B.tob}
            recordStep={step} avatarUrl={reelAvatar}
          />
        ),
      },
      {
        id: 'golden', label: 'Golden Hours',
        totalSteps: goldenCfg.total,
        holdFrames: goldenCfg.holdFrames,
        render: (step: number) => (
          <SlideGoldenHour
            dob={B.dob} tob={B.tob} lat={B.lat} lng={B.lng}
            name={B.name} unlockedDays={5} recordStep={step}
            avatarUrl={reelAvatar}
          />
        ),
      },
      {
        id: 'swot', label: 'SWOT',
        totalSteps: swotCfg.total,
        holdFrames: swotCfg.holdFrames,
        render: (step: number) => (
          <SlideSWOT
            chart={chart} dob={B.dob} tob={B.tob} name={B.name}
            recordStep={step} avatarUrl={reelAvatar}
          />
        ),
      },
    ];
  }, [chart, B, reelAvatar]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <ReelGenerator slides={reelSlides} autoStart onClose={onClose} />
    </div>
  );
}
