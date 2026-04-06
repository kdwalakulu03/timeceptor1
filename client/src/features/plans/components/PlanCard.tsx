/**
 * PlanCard — displays a Life Plan summary card for selection.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import type { LifePlan } from '../data/plans';

interface Props {
  plan: LifePlan;
  isSelected: boolean;
  onSelect: (id: string) => void;
  locked?: boolean;
  key?: string;
}

export function PlanCard({ plan, isSelected, onSelect, locked }: Props) {
  return (
    <button
      onClick={() => locked ? undefined : onSelect(plan.id)}
      className={`group relative w-full text-left rounded-xl overflow-hidden transition-all duration-200 ${
        locked
          ? 'ring-1 ring-white/[0.04] opacity-70 cursor-not-allowed'
          : isSelected
          ? 'ring-2 ring-gold/60 shadow-lg shadow-gold/10'
          : 'ring-1 ring-white/[0.06] hover:ring-gold/30'
      }`}
    >
      {/* Gradient accent top bar */}
      <div
        className="h-1.5"
        style={{
          background: locked
            ? 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))'
            : `linear-gradient(90deg, ${plan.accentFrom}, ${plan.accentTo})`,
        }}
      />

      <div className={`p-4 ${locked ? 'bg-white/[0.01]' : isSelected ? 'bg-gold/[0.06]' : 'bg-white/[0.02] group-hover:bg-white/[0.04]'}`}>
        <div className="flex items-start gap-3">
          <span className={`text-2xl mt-0.5 ${locked ? 'grayscale opacity-50' : ''}`}>{plan.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${locked ? 'text-cream-dim/50' : isSelected ? 'text-gold' : 'text-cream'}`}>
              {plan.name}
            </h3>
            <p className="font-mono text-[10px] tracking-widest uppercase text-cream-dim/60 mt-0.5">
              {plan.subtitle}
            </p>
          </div>
          {locked ? (
            <span className="flex items-center gap-1 text-[9px] font-mono tracking-widest uppercase text-gold/60 bg-gold/[0.08] border border-gold/15 rounded-full px-2.5 py-1 flex-shrink-0">
              🔒 PRO
            </span>
          ) : isSelected ? (
            <svg className="w-5 h-5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : null}
        </div>

        {/* Phase pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {plan.phases.map((phase) => (
            <span
              key={phase.service}
              className={`inline-block text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border ${
                locked ? 'bg-white/[0.02] text-cream-dim/40 border-white/[0.03]' : 'bg-white/[0.04] text-cream-dim/70 border-white/[0.06]'
              }`}
            >
              {phase.label}
            </span>
          ))}
        </div>

        {locked && (
          <div className="mt-2 text-[10px] font-mono text-gold/50 tracking-wider">
            Unlock with <span className="text-gold">$0.99</span> — <Link to="/dashboard" className="underline hover:text-gold transition-colors" onClick={e => e.stopPropagation()}>upgrade</Link>
          </div>
        )}
      </div>
    </button>
  );
}
