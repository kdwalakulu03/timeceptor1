import React from 'react';
import { motion } from 'motion/react';
import { PlanetaryHour, ServiceId } from '../types';
import { PLANET_SERVICE_DATA } from '../services';

interface DayScheduleProps {
  hours: PlanetaryHour[];
  best: PlanetaryHour | null;
  avoid: PlanetaryHour | null;
  selectedService: ServiceId;
}

export function DaySchedule({ hours, best, avoid, selectedService }: DayScheduleProps) {
  const now = new Date();
  const currentHour = now.getHours();

  const fmt = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  };

  return (
    <div className="mt-3">
      <div className="space-y-1 max-h-[480px] overflow-y-auto scrollbar-hide pr-1">
        {hours.map((h, i) => {
          const isCurrent = h.hour === currentHour;
          const isBest = best && h.hour === best.hour;
          const isAvoid = avoid && h.hour === avoid.hour;
          const isPast = h.hour < currentHour;
          const serviceData = PLANET_SERVICE_DATA[h.planet.name]?.[selectedService];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.015 }}
              className={`flex items-center gap-3 p-2.5 rounded-sm border transition-all ${
                isCurrent
                  ? 'border-gold/60 bg-gold/10'
                  : isBest
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : isAvoid
                  ? 'border-red-400/30 bg-red-400/5'
                  : isPast
                  ? 'border-transparent opacity-35'
                  : 'border-gold/10 hover:border-gold/20'
              }`}
            >
              {/* Time */}
              <div className={`font-mono text-xs w-16 shrink-0 ${isCurrent ? 'text-gold' : 'text-cream-dim'}`}>
                {fmt(h.hour)}
              </div>

              {/* Planet symbol */}
              <div className="text-base w-7 text-center shrink-0">{h.planet.symbol}</div>

              {/* Planet name + activity */}
              <div className="flex-1 min-w-0">
                <div className={`font-mono text-xs uppercase tracking-wider ${isCurrent ? 'text-gold' : 'text-cream-dim'}`}>
                  {h.planet.name}
                </div>
                {serviceData && !isPast && (
                  <div className="text-[11px] text-cream-dim/70 mt-0.5 truncate">{serviceData.activity}</div>
                )}
              </div>

              {/* Badges */}
              <div className="flex gap-1 shrink-0">
                {isCurrent && (
                  <span className="font-mono text-[10px] text-gold tracking-widest uppercase bg-gold/20 px-1.5 py-0.5 rounded-sm">
                    Now
                  </span>
                )}
                {isBest && (
                  <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                    Best
                  </span>
                )}
                {isAvoid && (
                  <span className="font-mono text-[10px] text-red-400 tracking-widest uppercase bg-red-500/10 px-1.5 py-0.5 rounded-sm">
                    Avoid
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
