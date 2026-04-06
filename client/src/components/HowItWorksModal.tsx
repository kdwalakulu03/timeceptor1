/**
 * HowItWorksModal — Strategic algorithm explainer + timecept.com CTA.
 *
 * Framing: "proprietary temporal optimisation engine"
 * - Enough detail to build credibility
 * - Not enough to replicate or be dismissed as "just astro"
 * - References: Sūrya Siddhānta (astronomical treatise on positional astronomy)
 * - timecept.com as the research / company domain
 */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: '🧬',
    title: 'Personal Temporal Profile',
    body: 'Your birth date, time, and geographic coordinates create a unique temporal baseline — derived from Sūrya Siddhānta positional astronomy and multi-cycle phase analysis.',
  },
  {
    icon: '🌐',
    title: 'Real-Time Cycle Data',
    body: 'We compute hourly positional data — sunrise-anchored phase windows, cyclic transit alignments, and bio-rhythmic activity states — refreshed daily for your exact coordinates.',
  },
  {
    icon: '⚡',
    title: 'Multi-Layer Scoring',
    body: 'Each hour is scored 0–100 by layering your personal baseline, hour-ruler influence, transit harmonics, bio-rhythmic state, and a circadian prime coefficient. The result: a precise quality rating per activity per hour.',
  },
  {
    icon: '📊',
    title: '90-Day Forecast',
    body: 'Hourly scores are aggregated into per-service daily ratings — mental focus, physical energy, creativity, social magnetism, rest quality — giving you a full 90-day planning horizon.',
  },
];

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  /* Lock body scroll when open */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="hiw-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="hiw-panel"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gold/20 bg-gradient-to-b from-[#0c0e1a] to-[#080a14] shadow-2xl shadow-gold/10 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-cream-dim hover:text-white transition-colors text-lg"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/20 font-mono text-[10px] tracking-[0.25em] uppercase text-gold mb-3">
                    Timeceptor Engine
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-semibold text-cream leading-tight">
                    How It Works
                  </h2>
                  <p className="mt-2 text-sm text-cream-dim leading-relaxed max-w-sm mx-auto">
                    Your day, scored and optimised — powered by patterns in time.
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-5 mb-6">
                  {STEPS.map((step, i) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center text-lg">
                        {step.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-cream mb-0.5">{step.title}</h3>
                        <p className="text-xs text-cream-dim leading-relaxed">{step.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Heritage note — scholarly references, hard to dismiss */}
                <div className="rounded-lg bg-gold/5 border border-gold/10 px-4 py-3 mb-6">
                  <p className="text-[11px] text-cream-dim leading-relaxed">
                    <span className="text-gold font-semibold">Built on deep foundations.</span>{' '}
                    Timeceptor's engine is grounded in the <em>Sūrya Siddhānta</em> — a foundational
                    astronomical treatise on solar, lunar, and planetary motion dating back over
                    1,500 years. We've synthesised its positional models with proprietary
                    bio-rhythmic cycle analysis into a modern, repeatable scoring system.
                  </p>
                </div>

                {/* timecept.com CTA */}
                <div className="text-center space-y-3">
                  <a
                    href="https://timecept.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold/10 border border-gold/25 text-gold font-mono text-xs tracking-widest uppercase hover:bg-gold/20 hover:border-gold/40 transition-all"
                  >
                    Visit timecept.com
                    <span className="text-sm">→</span>
                  </a>
                  <p className="font-mono text-[10px] text-cream-dim/50 tracking-wider">
                    Timecept Labs · Temporal Intelligence Research
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
