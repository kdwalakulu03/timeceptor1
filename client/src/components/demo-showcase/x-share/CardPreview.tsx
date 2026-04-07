/**
 * CardPreview — Mini CSS replica of the Timecept verdict card.
 * Used inside the X-share mock scenes.
 */
import React from 'react';

interface CardPreviewProps {
  score: number;
  verdictLabel: string;
  verdict: 'go' | 'caution' | 'wait';
  serviceLabel: string;
  className?: string;
}

export function CardPreview({ score, verdictLabel, verdict, serviceLabel, className = '' }: CardPreviewProps) {
  const verdictColor =
    verdict === 'go' ? 'text-emerald-400 border-emerald-400/60' :
    verdict === 'caution' ? 'text-amber-400 border-amber-400/60' :
    'text-red-400 border-red-400/60';

  return (
    <div className={`bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-lg border border-gold/30 p-3 ${className}`}>
      {/* Logo row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
          <span className="text-[8px] text-gold font-bold">T</span>
        </div>
        <span className="font-mono text-[9px] text-gold/70 tracking-widest uppercase">Timeceptor</span>
      </div>

      {/* Score + verdict */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold ${verdictColor}`}>
          {score}
        </div>
        <div>
          <div className={`text-xs font-bold ${verdictColor.split(' ')[0]}`}>{verdictLabel}</div>
          <div className="text-[9px] text-cream-dim/50">{serviceLabel}</div>
        </div>
      </div>
    </div>
  );
}
