import React from 'react';

export function HowItWorks() {
  return (
    <section className="py-20 text-center">
      <div className="font-mono text-sm tracking-widest uppercase text-gold font-bold mb-8">Ancient Wisdom</div>
      <h2 className="text-4xl font-display font-semibold tracking-wider mb-2">How Timecept Works</h2>
      <p className="font-mono text-sm text-cream-dim tracking-widest uppercase mb-16">Vedic planetary hours mapped to your body's rhythm</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        {[
          { step: '01', icon: '🪐', title: 'Your Birth Chart', desc: 'Your date and time of birth reveals your natal planetary signature — the cosmic blueprint you were born under.' },
          { step: '02', icon: '⏳', title: "Today's Hours", desc: 'Each hour of the day is ruled by a planet. These shift daily. We calculate which planet governs each hour right now.' },
          { step: '03', icon: '🧘', title: 'Your Window', desc: 'We match your natal chart with today\'s planetary hours to find when your body is most aligned for movement and breath.' }
        ].map((s) => (
          <div key={s.step} className="bg-space-card/80 border-2 border-gold/10 p-8 rounded-sm hover:border-gold/40 transition-colors group">
            <div className="font-mono text-sm text-gold font-bold tracking-widest uppercase mb-4">Step {s.step}</div>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">{s.icon}</div>
            <h3 className="text-xl font-display font-semibold mb-3 text-white">{s.title}</h3>
            <p className="text-base text-cream font-normal leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
