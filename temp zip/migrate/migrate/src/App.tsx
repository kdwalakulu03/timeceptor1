import React, { useState, useEffect } from 'react';
import { calculateChart } from './lib/astrology';
import type { PlanetPosition } from './lib/astrology';
import { CarouselPreview }     from './components/CarouselPreview';
import { ReelGenerator }       from './components/ReelGenerator';
import type { ReelSlide }      from './components/ReelGenerator';
import { SlideCover, coverRecordConfig }          from './components/slides/SlideCover';
import { SlideChart, chartRecordConfig }          from './components/slides/SlideChart';
import { SlideChartSouth, chartSouthRecordConfig } from './components/slides/SlideChartSouth';
import { SlideChartEastern, chartEasternRecordConfig } from './components/slides/SlideChartEastern';
import { SlideDasha, dashaRecordConfig }           from './components/slides/SlideDasha';
import { SlideGoldenHour, goldenRecordConfig }     from './components/slides/SlideGoldenHour';
import { SlideSWOT, swotRecordConfig }             from './components/slides/SlideSWOT';

// ─── Birth data (replace with form inputs later) ────────────────────────────
const BIRTH = {
  name:         'Cristiano Ronaldo',
  dob:          '1985-02-05',   // YYYY-MM-DD  (for scoring engine)
  tob:          '06:00:00',     // HH:MM:SS
  dobDisplay:   'Feb 5, 1985',  // human-readable
  tobDisplay:   '06:00 AM',
  locationName: 'Madeira, Portugal',
  lat:          32.6669,
  lng:          -16.9241,
};

const SIGN_MEANINGS: Record<string, string> = {
  Aries:'The trailblazer — raw fire, primal instinct.', Taurus:'The stabiliser — beauty & enduring will.',
  Gemini:'The connector — duality, quick mind.', Cancer:'The nurturer — deep feeling & memory.',
  Leo:'The sovereign — radiant self-expression.', Virgo:'The analyst — precision & service.',
  Libra:'The diplomat — balance & aesthetic grace.', Scorpio:'The alchemist — depth & transformation.',
  Sagittarius:'The philosopher — vision & far horizons.', Capricorn:'The architect — ambition & time.',
  Aquarius:'The visionary — collective & innovation.', Pisces:'The mystic — dreams & dissolution.',
};

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

export default function App() {
  const [chart, setChart] = useState<ReturnType<typeof calculateChart> | null>(null);

  useEffect(() => {
    const date = new Date(`${BIRTH.dob}T${BIRTH.tob}Z`);
    setChart(calculateChart(date, BIRTH.lat, BIRTH.lng));
  }, []);

  if (!chart) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#C1A661]/60 animate-pulse">
          Aligning the stars…
        </p>
      </div>
    );
  }

  const ascSign = SIGNS[Math.floor((chart.ascendant % 360) / 30)];

  const slides = [
    {
      id: 'cover',
      label: 'Cover',
      component: (
        <SlideCover
          name={BIRTH.name}
          dob={BIRTH.dobDisplay}
          tob={BIRTH.tobDisplay}
          locationName={BIRTH.locationName}
          chart={chart}
        />
      ),
    },
    {
      id: 'chart-west',
      label: 'Western',
      component: (
        <SlideChart
          name={BIRTH.name}
          chart={chart}
          dob={BIRTH.dobDisplay}
          locationName={BIRTH.locationName}
        />
      ),
    },
    {
      id: 'chart-south',
      label: 'S. Indian',
      component: (
        <SlideChartSouth
          name={BIRTH.name}
          chart={chart}
          dob={BIRTH.dobDisplay}
          locationName={BIRTH.locationName}
        />
      ),
    },
    {
      id: 'chart-north',
      label: 'N. Indian',
      component: (
        <SlideChartEastern
          name={BIRTH.name}
          chart={chart}
          dob={BIRTH.dobDisplay}
          locationName={BIRTH.locationName}
        />
      ),
    },
    {
      id: 'dasha',
      label: 'Dasha',
      component: (
        <SlideDasha
          name={BIRTH.name}
          chart={chart}
          dob={BIRTH.dob}
          tob={BIRTH.tob}
        />
      ),
    },
    {
      id: 'golden',
      label: 'Golden Hours',
      component: (
        <SlideGoldenHour
          dob={BIRTH.dob}
          tob={BIRTH.tob}
          lat={BIRTH.lat}
          lng={BIRTH.lng}
          name={BIRTH.name}
          unlockedDays={5}
        />
      ),
    },
    {
      id: 'swot',
      label: 'SWOT',
      component: (
        <SlideSWOT
          chart={chart}
          dob={BIRTH.dob}
          tob={BIRTH.tob}
          name={BIRTH.name}
        />
      ),
    },
  ];

  // ── Reel recording slides (with step-controlled rendering) ──
  const coverCfg   = coverRecordConfig(BIRTH.name.length, BIRTH.locationName.length);
  const chartCfg   = chartRecordConfig();
  const southCfg   = chartSouthRecordConfig();
  const eastCfg    = chartEasternRecordConfig();
  // Dasha timeline count: approximate — hero + 7 visible items
  const dashaCfg   = dashaRecordConfig(7);
  const goldenCfg  = goldenRecordConfig();
  const swotCfg    = swotRecordConfig();

  const reelSlides: ReelSlide[] = [
    {
      id: 'cover', label: 'Cover',
      totalSteps: coverCfg.total,
      holdFrames: coverCfg.holdFrames,
      render: (step) => (
        <SlideCover
          name={BIRTH.name} dob={BIRTH.dobDisplay} tob={BIRTH.tobDisplay}
          locationName={BIRTH.locationName} chart={chart} recordStep={step}
        />
      ),
    },
    {
      id: 'chart-west', label: 'Western',
      totalSteps: chartCfg.total,
      holdFrames: chartCfg.holdFrames,
      render: (step) => (
        <SlideChart
          name={BIRTH.name} chart={chart} dob={BIRTH.dobDisplay}
          locationName={BIRTH.locationName} recordStep={step}
        />
      ),
    },
    {
      id: 'chart-south', label: 'S. Indian',
      totalSteps: southCfg.total,
      holdFrames: southCfg.holdFrames,
      render: (step) => (
        <SlideChartSouth
          name={BIRTH.name} chart={chart} dob={BIRTH.dobDisplay}
          locationName={BIRTH.locationName} recordStep={step}
        />
      ),
    },
    {
      id: 'chart-north', label: 'N. Indian',
      totalSteps: eastCfg.total,
      holdFrames: eastCfg.holdFrames,
      render: (step) => (
        <SlideChartEastern
          name={BIRTH.name} chart={chart} dob={BIRTH.dobDisplay}
          locationName={BIRTH.locationName} recordStep={step}
        />
      ),
    },
    {
      id: 'dasha', label: 'Dasha',
      totalSteps: dashaCfg.total,
      holdFrames: dashaCfg.holdFrames,
      render: (step) => (
        <SlideDasha
          name={BIRTH.name} chart={chart} dob={BIRTH.dob} tob={BIRTH.tob}
          recordStep={step}
        />
      ),
    },
    {
      id: 'golden', label: 'Golden Hours',
      totalSteps: goldenCfg.total,
      holdFrames: goldenCfg.holdFrames,
      render: (step) => (
        <SlideGoldenHour
          dob={BIRTH.dob} tob={BIRTH.tob} lat={BIRTH.lat} lng={BIRTH.lng}
          name={BIRTH.name} unlockedDays={5} recordStep={step}
        />
      ),
    },
    {
      id: 'swot', label: 'SWOT',
      totalSteps: swotCfg.total,
      holdFrames: swotCfg.holdFrames,
      render: (step) => (
        <SlideSWOT
          chart={chart} dob={BIRTH.dob} tob={BIRTH.tob} name={BIRTH.name}
          recordStep={step}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative">
      {/* Background watermark — very transparent logo centred */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
        <img
          src="/timeceptor-logo.png"
          alt=""
          className="w-[55%] max-w-[700px] opacity-[0.025] select-none"
          draggable={false}
        />
      </div>

      {/* Top-left logo — small, opaque */}
      <div className="fixed top-5 left-6 z-50 flex items-center gap-2.5 pointer-events-none select-none">
        <img
          src="/timeceptor-logo.png"
          alt="Timeceptor"
          className="w-8 h-8 object-contain"
          draggable={false}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#C1A661]/50">
          Timeceptor
        </span>
      </div>

      {/* Global glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[60%] bg-white/[0.015] blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[45%] h-[55%] bg-[#C1A661]/[0.025] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-16 px-6 sm:px-10 xl:px-16 py-16 items-center">

        {/* ── LEFT: editorial bio ─────────────────────────────────────────── */}
        <div className="space-y-10 order-2 xl:order-1">
          {/* Title */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#C1A661]/60 mb-4">
              Hidden Cosmic Blueprint
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl xl:text-7xl leading-[0.92] tracking-tight">
              {ascSign}<br />
              <span className="text-white/20 italic text-4xl sm:text-5xl xl:text-6xl">Rising</span>
            </h1>
          </div>

          {/* Meaning */}
          <p className="font-serif text-base sm:text-lg text-white/35 leading-relaxed max-w-md">
            {SIGN_MEANINGS[ascSign]}
          </p>

          <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />

          {/* Birth details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            {[
              { label: 'Date of Birth',  value: BIRTH.dobDisplay },
              { label: 'Time of Birth',  value: BIRTH.tobDisplay },
              { label: 'Location',       value: BIRTH.locationName },
              { label: 'Coordinates',    value: `${BIRTH.lat}°N, ${BIRTH.lng}°E` },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/20">{label}</p>
                <p className="font-mono text-xs text-white/70 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Planet summary row */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(chart.planets) as [string, PlanetPosition][]).map(([key, p]) => (
              <span
                key={key}
                className="font-mono text-[9px] uppercase tracking-wider text-white/30 border border-white/[0.06] rounded-full px-2 py-1"
                title={`${p.name} in ${p.sign}, House ${p.house}`}
              >
                {p.name.slice(0, 3)} {p.sign.slice(0, 3)}
              </span>
            ))}
          </div>

          {/* Slide list hint */}
          <div className="pt-2">
            <p className="font-mono text-[9px] text-white/20 uppercase tracking-[0.3em] mb-3">
              What's inside
            </p>
            <div className="space-y-2">
              {[
                { icon: '♾', title: 'Birth Chart',      desc: 'South Indian sidereal chart with all 9 planets' },
                { icon: '⏳', title: 'Planetary Epochs',  desc: 'Active Vimshottari Dasha + sub-periods' },
                { icon: '✦', title: '7-Day Golden Hours', desc: 'Best hourly windows — last 2 days locked' },
                { icon: '◈', title: 'Cosmic SWOT',        desc: 'Strengths, weaknesses & opportunities from natal chart' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="text-[#C1A661]/50 text-sm mt-0.5 w-4 flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-mono text-[10px] text-white/55 uppercase tracking-wider">{title}</p>
                    <p className="font-mono text-[9px] text-white/25 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: phone carousel ────────────────────────────────────────── */}
        <div className="flex justify-center xl:justify-end order-1 xl:order-2">
          <CarouselPreview slides={slides} />
        </div>

      </div>

      {/* ── Download Reel button — fixed bottom-left ──────────────────────── */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        <ReelGenerator slides={reelSlides} />
      </div>

    </div>
  );
}
