import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CosmicGlobe } from './CosmicGlobe';

const CATEGORIES = [
  {
    topic: 'Yoga · Correct Timing · Your Birth Chart',
    title: 'Your morning yoga',
    subtitle: 'hour, calculated.',
    desc: 'Each morning belongs to a planet. We find the one aligned with your birth chart — so your practice lands deeper, not just earlier.'
  },
  {
    topic: 'Deep Work · Focus · Productivity',
    title: 'Your perfect focus',
    subtitle: 'window, revealed.',
    desc: 'Stop fighting friction. We align your hardest tasks with your highest cognitive periods, creating effortless flow states.'
  },
  {
    topic: 'Rest · Recovery · Wellness',
    title: 'Your true downtime',
    subtitle: 'scheduled softly.',
    desc: 'Rest is only effective when your system is ready for it. Discover the exact hour your body naturally wants to recharge.'
  },
  {
    topic: 'Creativity · Inspiration · Art',
    title: 'Your creative spark',
    subtitle: 'ignited, precisely.',
    desc: 'Never stare at a blank page again. Catch the planetary wave that amplifies your imagination and lateral thinking.'
  }
];

export function Hero() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % CATEGORIES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="pt-4 pb-2 overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left min-h-[220px] relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col h-full justify-center"
            >
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6 font-mono text-[10px] sm:text-xs tracking-widest uppercase text-gold-light">
                <div className="w-6 sm:w-10 h-px bg-gold-dim hidden sm:block" />
                {CATEGORIES[idx].topic}
                <div className="w-6 sm:w-10 h-px bg-gold-dim lg:hidden hidden sm:block" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold leading-tight mb-4">
                {CATEGORIES[idx].title}<br />
                <em className="italic text-gold-light not-italic">{CATEGORIES[idx].subtitle}</em>
              </h1>

              <p className="text-base sm:text-lg md:text-xl font-normal text-cream leading-relaxed max-w-lg mx-auto lg:mx-0">
                {CATEGORIES[idx].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Content - Globe */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex-1 w-full max-w-[340px] flex justify-center items-center"
        >
          <CosmicGlobe />
        </motion.div>
      </div>
    </section>
  );
}
