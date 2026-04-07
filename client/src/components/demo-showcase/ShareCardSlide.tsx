/**
 * ShareCardSlide — Animated 4-scene sequence showing a celebrity
 * downloading their Timecept card and sharing it to X.
 *
 * Scenes: Download → Draft post → Posted → Reactions go viral
 * Each scene auto-advances after SCENE_DURATION (2 s).
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DownloadScene } from './x-share/DownloadScene';
import { DraftScene } from './x-share/DraftScene';
import { PostScene } from './x-share/PostScene';
import { ReactScene } from './x-share/ReactScene';
import { SCENE_ORDER, SCENE_DURATION } from './x-share/types';
import type { SceneProps } from './x-share/types';
import type { SlideProps } from './types';

const CELEB_HANDLES: Record<string, string> = {
  elon:    '@elonmusk',
  oprah:   '@Oprah',
  ronaldo: '@Cristiano',
};

export function ShareCardSlide({ data }: SlideProps) {
  const { celeb, decision } = data;
  const [sceneIdx, setSceneIdx] = useState(0);

  // Reset scene index when slide mounts (re-entering the slide)
  useEffect(() => { setSceneIdx(0); }, []);

  // Auto-advance through 4 scenes
  useEffect(() => {
    if (sceneIdx >= SCENE_ORDER.length - 1) return; // stay on last scene
    const timer = setTimeout(() => setSceneIdx(prev => prev + 1), SCENE_DURATION);
    return () => clearTimeout(timer);
  }, [sceneIdx]);

  const scene = SCENE_ORDER[sceneIdx];
  const firstName = celeb.name.split(' ')[0];

  const sceneProps: SceneProps = {
    celebName: celeb.name,
    celebHandle: CELEB_HANDLES[celeb.id] ?? `@${firstName.toLowerCase()}`,
    celebEmoji: celeb.emoji,
    serviceLabel: celeb.serviceLabel,
    score: decision?.currentScore ?? 0,
    verdict: decision?.verdict ?? 'go',
    verdictLabel: decision?.verdictLabel ?? 'Check Now',
    horaRuler: decision?.currentHoraRuler ?? 'Sun',
    activity: decision?.currentActivity ?? 'Align with cosmic timing',
    nextBetter: decision?.nextBetter ?? null,
    todayWindows: decision?.todayWindows?.slice(0, 4).map(w => ({ hour: w.hour, score: w.score })) ?? [],
  };

  const renderScene = () => {
    switch (scene) {
      case 'download':  return <DownloadScene  key="dl" {...sceneProps} />;
      case 'draft':     return <DraftScene     key="dr" {...sceneProps} />;
      case 'posted':    return <PostScene      key="po" {...sceneProps} />;
      case 'reactions': return <ReactScene     key="re" {...sceneProps} />;
    }
  };

  return (
    <motion.div
      key="share"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center text-xl">
          📲
        </div>
        <div>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-gold">Timecept Card</h2>
          <p className="font-mono text-[11px] text-cream-dim/70 tracking-widest uppercase">
            {firstName} downloads &amp; shares to 𝕏
          </p>
        </div>
      </div>

      {/* Scene progress dots */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {SCENE_ORDER.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === sceneIdx ? 'bg-gold w-5' : i < sceneIdx ? 'bg-gold/50 w-1.5' : 'bg-white/15 w-1.5'
            }`}
          />
        ))}
      </div>

      {/* Scene content */}
      <div className="relative min-h-[280px]">
        <AnimatePresence mode="wait">
          {renderScene()}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
