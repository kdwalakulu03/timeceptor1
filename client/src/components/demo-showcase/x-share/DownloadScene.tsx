/**
 * DownloadScene — Card download progress animation.
 * Shows: Branded Timecept card → progress bar → ✓ Card ready
 */
import React from 'react';
import { motion } from 'motion/react';
import { BrandedCard } from './BrandedCard';
import type { SceneProps } from './types';

export function DownloadScene({
  score, verdict, verdictLabel, serviceLabel,
  horaRuler, activity, nextBetter, todayWindows,
}: SceneProps) {
  return (
    <motion.div
      key="scene-download"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-5 py-4"
    >
      {/* Card dropping in */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="w-64 sm:w-72"
      >
        <BrandedCard
          score={score}
          verdictLabel={verdictLabel}
          verdict={verdict}
          serviceName={serviceLabel}
          horaRuler={horaRuler}
          activity={activity}
          nextBetter={nextBetter}
          todayWindows={todayWindows}
        />
      </motion.div>

      {/* Download indicator */}
      <div className="w-52 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: 1, ease: 'linear' }}
            className="w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full"
          />
          <span className="font-mono text-[11px] text-gold tracking-widest uppercase font-medium">
            Downloading card…
          </span>
        </div>
        <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-gold rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* Checkmark */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.25, type: 'spring', stiffness: 400 }}
        className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs tracking-widest"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Card ready
      </motion.div>
    </motion.div>
  );
}
