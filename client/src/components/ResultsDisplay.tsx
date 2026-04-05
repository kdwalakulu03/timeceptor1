import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldAlert, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { PlanetaryHour, Planet, ServiceId } from '../types';
import { ChartData } from '../lib/astrology';
import { PLANET_SERVICE_DATA } from '../services';
import { SouthIndianChart } from './SouthIndianChart';
import { DaySchedule } from './DaySchedule';
import { ShareButton } from './ShareButton';

interface ResultsDisplayProps {
  results: {
    best: PlanetaryHour | null;
    second: PlanetaryHour | null;
    avoid: PlanetaryHour | null;
    birthPlanet: Planet | null;
  } | null;
  chart: ChartData | null;
  allHours: PlanetaryHour[];
  showChart: boolean;
  setShowChart: (show: boolean) => void;
  subscribed: boolean;
  email: string;
  setEmail: (email: string) => void;
  handleSubscribe: (e: React.FormEvent) => void;
  resultsRef: React.RefObject<HTMLDivElement>;
  selectedService: ServiceId;
  getShareUrl: () => string;
}

export function ResultsDisplay({
  results, chart, allHours, showChart, setShowChart,
  subscribed, email, setEmail, handleSubscribe, resultsRef,
  selectedService, getShareUrl,
}: ResultsDisplayProps) {
  const [showSchedule, setShowSchedule] = React.useState(false);

  const fmt = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  };

  const serviceDesc = (planet: Planet | null | undefined) => {
    if (!planet) return '';
    return PLANET_SERVICE_DATA[planet.name]?.[selectedService]?.desc ?? planet.desc;
  };

  const serviceActivity = (planet: Planet | null | undefined) => {
    if (!planet) return '';
    return PLANET_SERVICE_DATA[planet.name]?.[selectedService]?.activity ?? planet.yoga;
  };

  return (
    <AnimatePresence>
      {results && (
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-12 pt-12 border-t border-gold/15 scroll-mt-8"
        >
          {/* Header */}
          <div className="font-mono text-sm tracking-widest uppercase text-gold-light text-center mb-8">
            ✦ Your Morning Practice Window ✦
          </div>

          {/* Morning context line */}
          {results.best && (
            <div className="text-center mb-6">
              {results.best.hour >= 4 && results.best.hour <= 9 ? (
                <p className="text-cream-dim text-sm font-mono tracking-wider">
                  Morning window active · {results.best.planet.name} hora rules the hour
                </p>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-gold/20 bg-gold/5">
                  <span className="text-gold text-xs font-mono tracking-widest uppercase">Morning passed</span>
                  <span className="text-cream-dim text-xs">· Showing next best window for today</span>
                </div>
              )}
            </div>
          )}

          {/* Natal lord */}
          {results.birthPlanet && (
            <div className="text-center mb-8">
              <div className="font-mono text-sm tracking-widest uppercase text-cream-dim mb-1">Your Natal Lord</div>
              <div className="text-gold-light text-base font-medium italic">
                Born on a {results.birthPlanet.name} day — {results.birthPlanet.symbol}
              </div>
            </div>
          )}

          {/* Best window */}
          <div className="bg-gold/10 border-2 border-gold/30 rounded-sm p-8 mb-6 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-mono text-sm tracking-widest uppercase text-gold-light font-bold">
                  Best Practice Window
                </div>
                {results.best && results.best.hour >= 4 && results.best.hour <= 9 && (
                  <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    🌅 Morning
                  </span>
                )}
              </div>
              <div className="text-4xl md:text-5xl font-display font-semibold tracking-wide mb-4 text-white">
                {results.best
                  ? `${fmt(results.best.hour)} — ${fmt(results.best.hour + 1)}`
                  : 'Tomorrow morning'}
              </div>
              <p className="text-cream text-lg font-medium leading-relaxed">
                {results.best
                  ? serviceDesc(results.best.planet)
                  : "No optimal windows remain today. Plan for tomorrow's sunrise hour."}
              </p>
            </div>
            <div className="absolute top-6 right-8 w-12 h-12 rounded-full border border-gold-dim flex items-center justify-center text-2xl bg-gold/10 group-hover:scale-110 transition-transform">
              {results.best?.planet.symbol || '✦'}
            </div>
          </div>

          {/* Second best + Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-black/50 border-2 border-gold/20 p-6 rounded-sm">
              <div className="font-mono text-sm tracking-widest uppercase text-gold-light font-bold mb-2 flex items-center gap-2">
                <Sparkles size={14} /> Second Best
              </div>
              <div className="text-3xl font-semibold mb-2 text-white">
                {results.second ? `${fmt(results.second.hour)} — ${fmt(results.second.hour + 1)}` : '—'}
              </div>
              <div className="text-base text-cream uppercase tracking-wider font-medium">
                {results.second
                  ? `${results.second.planet.symbol} ${results.second.planet.name} · ${serviceActivity(results.second.planet)}`
                  : 'All hours favourable'}
              </div>
            </div>
            <div className="bg-black/50 border-2 border-gold/20 p-6 rounded-sm">
              <div className="font-mono text-sm tracking-widest uppercase text-red-300 font-bold mb-2 flex items-center gap-2">
                <ShieldAlert size={14} /> Avoid
              </div>
              <div className="text-3xl font-semibold mb-2 text-white">
                {results.avoid ? `${fmt(results.avoid.hour)} — ${fmt(results.avoid.hour + 1)}` : 'None today'}
              </div>
              <div className="text-base text-cream uppercase tracking-wider font-medium">
                {results.avoid
                  ? `${results.avoid.planet.symbol} ${results.avoid.planet.name} · Rest instead`
                  : 'Favourable energy throughout'}
              </div>
            </div>
          </div>

          {/* Share + Day Schedule toggle row */}
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <ShareButton getShareUrl={getShareUrl} />
            {allHours.length > 0 && (
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="flex items-center gap-2 px-4 py-2 border border-gold/20 text-gold-light font-mono text-xs tracking-widest uppercase hover:bg-gold/10 transition-colors rounded-sm"
              >
                <Calendar size={12} />
                {showSchedule ? 'Hide' : 'Full Day Schedule'}
                {showSchedule ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          {/* Full Day Schedule */}
          <AnimatePresence>
            {showSchedule && allHours.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="border border-gold/10 bg-black/30 rounded-sm p-4">
                  <DaySchedule
                    hours={allHours}
                    best={results.best}
                    avoid={results.avoid}
                    selectedService={selectedService}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Natal Chart Toggle */}
          {chart && (
            <div className="mb-10">
              <button
                onClick={() => setShowChart(!showChart)}
                className="w-full flex items-center justify-between p-4 border border-gold/10 bg-gold/5 rounded-sm text-gold font-mono text-sm tracking-widest uppercase hover:bg-gold/10 transition-colors"
              >
                <span>Natal Chart (Sidereal Lahiri)</span>
                {showChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence>
                {showChart && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 pb-2">
                      <SouthIndianChart chart={chart} />
                      <div className="mt-6 text-sm text-cream-dim text-center uppercase tracking-widest font-medium">
                        Ayanamsa: {chart.ayanamsa.toFixed(4)}° (Lahiri)
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Email Subscription */}
          <div className="pt-8 border-t border-gold/10">
            <div className="text-center mb-6">
              <h3 className="text-xl font-medium mb-1">Receive your daily cosmic window</h3>
              <p className="font-mono text-sm text-cream-dim tracking-widest uppercase">Free · Sent every morning before sunrise</p>
            </div>
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-black/80 border-2 border-gold/20 rounded-sm p-4 text-white font-medium outline-none focus:border-gold-dim transition-all text-base"
                  required
                  aria-label="Email address for daily cosmic window"
                />
                <button
                  type="submit"
                  className="bg-gold text-space-bg px-6 py-4 font-mono text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
                >
                  Notify Me
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-4 font-mono text-sm text-gold-light font-bold tracking-widest uppercase"
              >
                ✦ &nbsp; You're on the list. Tomorrow's window arrives at dawn. &nbsp; ✦
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
