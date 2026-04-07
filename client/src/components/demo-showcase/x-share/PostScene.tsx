/**
 * PostScene — The post appears on a mock X feed with branded card.
 * Shows: "✓ Posted to X" badge → full post with BrandedCard + empty action bar.
 */
import React from 'react';
import { motion } from 'motion/react';
import { BrandedCard } from './BrandedCard';
import type { SceneProps } from './types';

export function PostScene({
  celebName, celebHandle, celebEmoji,
  serviceLabel, score, verdict, verdictLabel,
  horaRuler, activity, nextBetter, todayWindows,
}: SceneProps) {
  return (
    <motion.div
      key="scene-posted"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="flex justify-center py-2"
    >
      <div className="w-full max-w-[380px]">
        {/* "Posted!" badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-center mb-3"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1d9bf0]/10 border border-[#1d9bf0]/20 text-[#1d9bf0] font-mono text-[10px] tracking-widest uppercase font-bold">
            ✓ Timecept Card posted to 𝕏
          </span>
        </motion.div>

        {/* Feed post */}
        <div className="bg-[#16181c] rounded-2xl border border-[#2f3336] overflow-hidden">
          <div className="p-4">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center text-base flex-shrink-0">
                {celebEmoji}
              </div>
              <div className="flex-1 min-w-0">
                {/* Name + handle + timestamp */}
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[#e7e9ea] text-sm font-bold">{celebName}</span>
                  <svg className="w-3.5 h-3.5 text-[#1d9bf0] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.09 4.59l-4.66-4.66 1.41-1.41 3.25 3.25 6.59-6.59 1.41 1.41-8 8z"/>
                  </svg>
                  <span className="text-[#71767b] text-sm">{celebHandle}</span>
                  <span className="text-[#71767b] text-sm">· Just now</span>
                </div>

                {/* Post text */}
                <p className="text-[#e7e9ea] text-sm leading-relaxed mb-3">
                  My Timecept Card says {score}/100 ✨ {verdictLabel} for {serviceLabel.toLowerCase()}.
                  <br />
                  Check yours free → timeceptor.com
                  <br />
                  <span className="text-[#1d9bf0]">#TimceptCard #cosmictiming</span>
                </p>

                {/* Branded card */}
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

                {/* Empty action bar */}
                <div className="flex items-center gap-6 mt-3 text-[#71767b] text-xs">
                  <span>💬</span>
                  <span>🔁</span>
                  <span>🤍</span>
                  <span>📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
