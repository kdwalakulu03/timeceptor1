/**
 * GoldenHoursSlide — Shows 7-day weekly grid + today's summary.
 * Includes sharable card preview.
 */
import React from 'react';
import { motion } from 'motion/react';
import { WeeklyView } from '../WeeklyView';
import { TodaySummary } from '../TodaySummary';
import type { SlideProps } from './types';

export function GoldenHoursSlide({ data }: SlideProps) {
  const { celeb, windows, todayWindows } = data;
  const firstName = celeb.name.split(' ')[0];

  return (
    <motion.div
      key="golden"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center text-xl">⏰</div>
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-gold">Golden Hours</h2>
          <p className="font-mono text-[11px] text-cream-dim/70 tracking-widest uppercase">
            {firstName}'s 7-day schedule · {celeb.serviceLabel}
          </p>
        </div>
      </div>

      {/* Today's summary */}
      {todayWindows.length > 0 && (
        <div className="mb-4">
          <TodaySummary windows={todayWindows} />
        </div>
      )}

      {/* Weekly grid */}
      {windows.length > 0 && (
        <WeeklyView
          windows={windows}
          unlockedDays={7}
          selectedService={celeb.service}
        />
      )}
    </motion.div>
  );
}
