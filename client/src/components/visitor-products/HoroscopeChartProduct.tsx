/**
 * HoroscopeChartProduct — Vedic birth chart (Rasi) display.
 * Renders the South Indian chart with planet placements.
 */
import React from 'react';
import { SouthIndianChart } from '../SouthIndianChart';
import { getSign } from '../../lib/astrology';
import type { SubProductProps } from './types';

export function HoroscopeChartProduct({ birth, computed }: SubProductProps) {
  const { chart } = computed;
  const ascSign = getSign(chart.ascendant);

  // Sort planets by house for the table
  const planetList = Object.values(chart.planets).sort((a, b) => a.house - b.house);

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div>
        <h3 className="font-display text-gold text-sm font-semibold tracking-widest uppercase mb-4">
          Your Vedic Birth Chart (Rasi)
        </h3>
        <SouthIndianChart chart={chart} />
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 border border-gold/15 rounded-lg bg-white/[0.02]">
          <div className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-1">Ascendant (Lagna)</div>
          <div className="text-gold font-display font-semibold">{ascSign}</div>
          <div className="text-cream-dim/60 text-xs mt-0.5">{chart.ascendant.toFixed(2)}°</div>
        </div>
        <div className="p-3 border border-gold/15 rounded-lg bg-white/[0.02]">
          <div className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-1">Ayanamsa (Lahiri)</div>
          <div className="text-gold font-display font-semibold">{chart.ayanamsa.toFixed(4)}°</div>
        </div>
      </div>

      {/* Planet table */}
      <div>
        <h4 className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-3">Planet Positions</h4>
        <div className="border border-gold/15 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gold/[0.06] border-b border-gold/10">
                <th className="px-3 py-2 text-left font-mono text-cream-dim/60 uppercase tracking-widest">Planet</th>
                <th className="px-3 py-2 text-left font-mono text-cream-dim/60 uppercase tracking-widest">Sign</th>
                <th className="px-3 py-2 text-center font-mono text-cream-dim/60 uppercase tracking-widest">House</th>
                <th className="px-3 py-2 text-right font-mono text-cream-dim/60 uppercase tracking-widest">Degree</th>
              </tr>
            </thead>
            <tbody>
              {planetList.map((p) => (
                <tr key={p.name} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2 text-cream font-semibold">{p.name}</td>
                  <td className="px-3 py-2 text-cream-dim">{p.sign}</td>
                  <td className="px-3 py-2 text-center text-gold">{p.house}</td>
                  <td className="px-3 py-2 text-right text-cream-dim/70 font-mono">{p.siderealLongitude.toFixed(2)}°</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Birth info footer */}
      <div className="text-center text-[10px] text-cream-dim/40 font-mono pt-2 border-t border-white/[0.05]">
        Born {birth.dob} at {birth.tob} · {birth.locationName} ({birth.lat.toFixed(2)}°, {birth.lng.toFixed(2)}°)
      </div>
    </div>
  );
}
