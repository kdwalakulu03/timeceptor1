/**
 * DraftScene — Mock X compose dialog with branded card attached.
 * Shows: celeb drafting a post → "Post" button highlights.
 */
import React from 'react';
import { motion } from 'motion/react';
import { BrandedCard } from './BrandedCard';
import type { SceneProps } from './types';

export function DraftScene({
  celebName, celebHandle, celebEmoji,
  serviceLabel, score, verdict, verdictLabel,
  horaRuler, activity, nextBetter, todayWindows,
}: SceneProps) {
  return (
    <motion.div
      key="scene-draft"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="flex justify-center py-2"
    >
      <div className="w-full max-w-[380px] bg-[#16181c] rounded-2xl border border-[#2f3336] overflow-hidden shadow-2xl">
        {/* Compose header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2f3336]">
          <span className="text-[#1d9bf0] text-sm font-medium">Cancel</span>
          <motion.span
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1, scale: [1, 1.08, 1] }}
            transition={{ delay: 1.6, duration: 0.4 }}
            className="px-4 py-1.5 rounded-full bg-[#1d9bf0] text-white text-sm font-bold"
          >
            Post
          </motion.span>
        </div>

        {/* Compose body */}
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center text-base flex-shrink-0">
              {celebEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[#e7e9ea] text-sm font-bold truncate">{celebName}</span>
                <span className="text-[#71767b] text-sm truncate">{celebHandle}</span>
              </div>

              {/* "Typed" post text */}
              <motion.p
                className="text-[#e7e9ea] text-sm leading-relaxed mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                My Timecept Card says {score}/100 ✨ {verdictLabel} for {serviceLabel.toLowerCase()}.
                <br />
                Check yours free → timeceptor.com
                <br />
                <span className="text-[#1d9bf0]">#TimceptCard #cosmictiming</span>
              </motion.p>

              {/* Branded card attachment */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
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
                  className="text-[9px]"
                />
              </motion.div>

              {/* Compose toolbar icons */}
              <div className="flex gap-3 mt-3 text-[#1d9bf0] text-sm opacity-50">
                <span>🖼</span>
                <span>📊</span>
                <span>📍</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
