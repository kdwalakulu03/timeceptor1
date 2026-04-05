import React from 'react';
import { ChartData, getSign } from '../lib/astrology';

interface SouthIndianChartProps {
  chart: ChartData;
}

const SOUTH_INDIAN_GRID = [
  ["Pisces", "Aries", "Taurus", "Gemini"],
  ["Aquarius", null, null, "Cancer"],
  ["Capricorn", null, null, "Leo"],
  ["Sagittarius", "Scorpio", "Libra", "Virgo"]
];

export function SouthIndianChart({ chart }: SouthIndianChartProps) {
  const ascendantSign = getSign(chart.ascendant);

  const getEntitiesForSign = (sign: string) => {
    const entities: { name: string; isAscendant?: boolean }[] = [];
    
    if (ascendantSign === sign) {
      entities.push({ name: "As", isAscendant: true });
    }
    
    Object.values(chart.planets).forEach(p => {
      if (p.sign === sign) {
        // Use 2-letter abbreviations for planets
        const abbr = p.name.substring(0, 2);
        entities.push({ name: abbr });
      }
    });
    
    return entities;
  };

  return (
    <div className="w-full max-w-md mx-auto aspect-square border-2 border-gold/40 grid grid-cols-4 grid-rows-4 bg-space-card/50">
      {SOUTH_INDIAN_GRID.map((row, rowIndex) => (
        row.map((sign, colIndex) => {
          if (!sign) {
            // Center empty cells
            if (rowIndex === 1 && colIndex === 1) {
              return (
                <div key={`empty-${rowIndex}-${colIndex}`} className="col-span-2 row-span-2 flex items-center justify-center border border-gold/20 p-4">
                  <div className="text-center">
                    <div className="font-display text-gold font-semibold tracking-widest uppercase text-xl mb-1">Rasi</div>
                    <div className="font-mono text-[10px] text-cream-dim uppercase tracking-widest">South Indian</div>
                  </div>
                </div>
              );
            }
            if (rowIndex === 1 && colIndex === 2) return null; // Handled by col-span-2
            if (rowIndex === 2 && colIndex === 1) return null; // Handled by row-span-2
            if (rowIndex === 2 && colIndex === 2) return null; // Handled by col-span-2 row-span-2
            return null;
          }

          const entities = getEntitiesForSign(sign);

          return (
            <div 
              key={sign} 
              className="border border-gold/20 p-1 md:p-2 flex flex-col relative group hover:bg-gold/5 transition-colors"
            >
              <div className="text-[9px] md:text-[10px] text-cream-dim/60 uppercase tracking-wider font-mono absolute top-1 left-1 md:top-2 md:left-2">
                {sign.substring(0, 3)}
              </div>
              
              <div className="flex-1 flex flex-wrap content-center justify-center gap-1 md:gap-2 mt-3">
                {entities.map((entity, i) => (
                  <span 
                    key={i} 
                    className={`font-mono text-xs md:text-sm font-bold ${entity.isAscendant ? 'text-gold-light underline decoration-gold/50 underline-offset-2' : 'text-cream'}`}
                  >
                    {entity.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })
      ))}
    </div>
  );
}
