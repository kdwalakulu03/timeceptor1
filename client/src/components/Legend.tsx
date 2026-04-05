import React from 'react';
import { PLANETS } from '../constants';

export function Legend() {
  return (
    <section className="py-20 border-t border-gold/10">
      <div className="text-center mb-16">
        <div className="font-mono text-sm tracking-widest uppercase text-gold font-bold mb-8">The Seven Planets</div>
        <h2 className="text-4xl font-display font-semibold tracking-wider mb-2 text-white">Each Hour Has a Ruler</h2>
        <p className="font-mono text-sm text-cream-dim tracking-widest uppercase">Know which energy governs your practice</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PLANETS.map((p) => (
          <div key={p.name} className="bg-black/50 border-2 border-gold/10 p-6 rounded-sm text-center hover:bg-gold/10 transition-colors">
            <div className="text-3xl mb-3">{p.symbol}</div>
            <div className="font-mono text-sm text-gold-light font-bold tracking-widest uppercase mb-2">{p.name}</div>
            <p className="text-sm text-cream font-medium leading-tight mb-4 h-10 flex items-center justify-center">{p.yoga}</p>
            <span className={`inline-block font-mono text-sm px-4 py-1.5 font-bold tracking-widest uppercase rounded-full
              ${p.type === 'power' ? 'bg-gold/30 text-gold-light' : 
                p.type === 'gentle' ? 'bg-amber-400/30 text-amber-100' : 
                p.type === 'avoid' ? 'bg-red-400/30 text-red-100' : 
                'bg-green-400/30 text-green-100'}`}
            >
              {p.type}
            </span>
          </div>
        ))}
        <div className="bg-black/50 border-2 border-gold/10 p-6 rounded-sm text-center hover:bg-gold/10 transition-colors">
          <div className="text-3xl mb-3">✦</div>
          <div className="font-mono text-sm text-gold-light font-bold tracking-widest uppercase mb-2">Your Chart</div>
          <p className="text-sm text-cream font-medium leading-tight mb-4 h-10 flex items-center justify-center">Personalized alignment</p>
          <span className="inline-block font-mono text-sm px-4 py-1.5 font-bold tracking-widest uppercase rounded-full bg-cream/30 text-white">
            Personal
          </span>
        </div>
      </div>
    </section>
  );
}
