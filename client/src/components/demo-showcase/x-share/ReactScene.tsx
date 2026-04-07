/**
 * ReactScene — The post goes viral with animated counts + floating reactions.
 * Shows: counters spring in · floating hearts/fire emojis rise up.
 */
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BrandedCard } from './BrandedCard';
import type { SceneProps } from './types';

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ReactScene({
  celebName, celebHandle, celebEmoji,
  serviceLabel, score, verdict, verdictLabel,
  horaRuler, activity, nextBetter, todayWindows,
}: SceneProps) {
  // Randomised floating emojis (computed once per mount)
  const floats = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      delay: Math.random() * 1.2,
      emoji: ['❤️', '🔥', '💯', '✨', '🙌', '⭐'][i % 6],
      size: 14 + Math.random() * 8,
    })),
  []);

  return (
    <motion.div
      key="scene-reactions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-center py-2 relative"
    >
      {/* Floating reactions overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {floats.map(f => (
          <motion.span
            key={f.id}
            className="absolute"
            style={{ left: `${f.x}%`, bottom: 0, fontSize: f.size }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -220, opacity: 0 }}
            transition={{ delay: f.delay, duration: 1.8, ease: 'easeOut' }}
          >
            {f.emoji}
          </motion.span>
        ))}
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        {/* Viral badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          className="text-center mb-3"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f91880]/10 border border-[#f91880]/20 text-[#f91880] font-mono text-[10px] tracking-widest uppercase font-bold">
            🔥 Timecept Card Going Viral
          </span>
        </motion.div>

        {/* Post card */}
        <div className="bg-[#16181c] rounded-2xl border border-[#2f3336] overflow-hidden">
          <div className="p-4">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center text-base flex-shrink-0">
                {celebEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[#e7e9ea] text-sm font-bold">{celebName}</span>
                  <svg className="w-3.5 h-3.5 text-[#1d9bf0] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.09 4.59l-4.66-4.66 1.41-1.41 3.25 3.25 6.59-6.59 1.41 1.41-8 8z"/>
                  </svg>
                  <span className="text-[#71767b] text-sm">{celebHandle}</span>
                  <span className="text-[#71767b] text-sm">· 2m</span>
                </div>

                <p className="text-[#e7e9ea] text-sm leading-relaxed mb-3">
                  My Timecept Card says {score}/100 ✨ {verdictLabel} for {serviceLabel.toLowerCase()}.
                  <br />
                  Check yours free → timeceptor.com
                  <br />
                  <span className="text-[#1d9bf0]">#TimceptCard #cosmictiming</span>
                </p>

                <BrandedCard
                  score={score}
                  verdictLabel={verdictLabel}
                  verdict={verdict}
                  serviceName={serviceLabel}
                  horaRuler={horaRuler}
                  activity={activity}
                  nextBetter={nextBetter}
                  todayWindows={todayWindows}
                  className="text-[9px]"
                />

                {/* Animated engagement counts */}
                <div className="flex items-center gap-5 mt-3 text-xs">
                  <motion.span
                    className="flex items-center gap-1 text-[#71767b]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    💬{' '}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
                    >
                      {fmtCount(56)}
                    </motion.span>
                  </motion.span>

                  <motion.span
                    className="flex items-center gap-1 text-[#00ba7c]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    🔁{' '}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: 'spring', stiffness: 400 }}
                    >
                      {fmtCount(234)}
                    </motion.span>
                  </motion.span>

                  <motion.span
                    className="flex items-center gap-1 text-[#f91880]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    ❤️{' '}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9, type: 'spring', stiffness: 400 }}
                    >
                      {fmtCount(847)}
                    </motion.span>
                  </motion.span>

                  <motion.span
                    className="flex items-center gap-1 text-[#71767b]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    📊{' '}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: 'spring', stiffness: 400 }}
                    >
                      {fmtCount(12400)}
                    </motion.span>
                  </motion.span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
