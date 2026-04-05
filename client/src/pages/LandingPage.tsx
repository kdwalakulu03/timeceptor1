/**
 * LandingPage — Animation-first landing.
 * The canvas explainer contains the rotating emotional hooks, services,
 * typing animation, results, and alerts — all inside 2D canvas.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Background } from '../components/Background';
import ModernExplainer from '../components/modern-explainer/ModernExplainer';

export default function LandingPage() {

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light">
      <Background />

      {/* Nav — minimal */}
      <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-4 md:px-12 md:py-5 border-b border-gold/10">
        <a href="/" className="text-lg sm:text-xl tracking-widest uppercase text-gold font-display font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </a>
        <Link
          to="/app"
          className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gold text-space-bg font-bold uppercase tracking-widest text-xs sm:text-sm rounded-full shadow-[0_0_15px_rgba(212,168,75,0.5)] hover:shadow-[0_0_30px_rgba(212,168,75,0.8)] transition-all animate-pulse"
        >
          Check Your Golden Hour
        </Link>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Section 1: Animation Explainer ──────────────────── */}
        <section className="pt-10 sm:pt-16 pb-12 sm:pb-20 relative">

          {/* Decorative background glows for modern web feel */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl h-64 bg-gold/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          {/* High-end modern heading */}
          <div className="text-center mb-10 sm:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5 backdrop-blur-md mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              <span className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-gold font-bold">
                Experience the magic
              </span>
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cream via-gold-light to-gold"
            >
              How Timeceptor Works
            </motion.h2>
          </div>

          {/* The Animation — the star of the page */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative group p-[2px] rounded-xl bg-gradient-to-b from-gold/30 via-gold/5 to-transparent shadow-2xl shadow-gold/5"
          >
            <div className="rounded-xl overflow-hidden bg-space-bg">
              <ModernExplainer />
            </div>
            
            {/* Edge highlights */}
            <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/5 group-hover:border-gold/20 transition-colors duration-500" />
          </motion.div>
        </section>

        {/* ── Section 2: One-line pitch + CTA ──────────────────── */}
        <section className="py-8 sm:py-12 text-center border-t border-gold/10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-5xl font-display font-semibold leading-tight mb-3 sm:mb-4"
          >
            Your best hour,{' '}
            <em className="text-gold-light not-italic">calculated.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm sm:text-base text-cream-dim max-w-lg mx-auto mb-6 sm:mb-8 leading-relaxed"
          >
            We match your birth chart to today's planetary hours — yoga, gym, business, 
            creativity, love — each gets its own optimal window.
          </motion.p>

          {/* Service pills — compact */}
          <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8">
            {['🧘 Yoga', '🏋️ Gym', '🕯️ Meditation', '📈 Business', '🎨 Creative', '💛 Love', '🌿 Health', '📱 Social'].map(s => (
              <span key={s} className="px-3 py-1.5 rounded-sm border border-gold/15 bg-gold/5 font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim">
                {s}
              </span>
            ))}
          </div>

          <Link
            to="/app"
            className="inline-block px-8 sm:px-12 py-4 sm:py-5 bg-gold text-space-bg font-mono text-sm font-bold tracking-widest uppercase hover:bg-gold-light transition-all shadow-lg shadow-gold/20 rounded-sm"
          >
            ✦ Reveal My Cosmic Window — Free
          </Link>
          <p className="mt-3 font-mono text-[10px] sm:text-xs text-cream-dim/50 tracking-wider">
            No card · 3-day full access · Personalized to your birth chart
          </p>
        </section>

        {/* ── Section 3: Social proof — compact ─────────────────── */}
        <section className="py-8 sm:py-12 border-t border-gold/10">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto text-center">
            {[
              { num: '7', label: 'Vedic Planets' },
              { num: '168', label: 'Hours / Week' },
              { num: '90', label: 'Days Ahead' },
            ].map(s => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="py-4 sm:py-6"
              >
                <div className="text-2xl sm:text-3xl font-display font-semibold text-gold mb-1">{s.num}</div>
                <div className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-cream-dim">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <a href="/" className="text-sm tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">
          Timeceptor
        </a>
        <span className="font-mono text-[10px] sm:text-xs text-cream-dim tracking-widest uppercase">
          Ancient timing · Modern life · © 2026
        </span>
      </footer>
    </div>
  );
}
