/**
 * CardDisplay — Renders a canvas card to an <img> preview
 * with animated Share + Download buttons.
 *
 * Reuses cardRenderer share/download helpers.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  shareCanvasAsImage,
  downloadCanvasAsImage,
} from '../../lib/cardRenderer';

interface CardDisplayProps {
  /** Human label for the card (e.g. "Golden Hour Card") */
  title: string;
  /** Short description shown above the card */
  subtitle: string;
  /** Accent color class for the title */
  accentClass: string;
  /** A function that produces the canvas — called once on mount */
  renderCanvas: () => HTMLCanvasElement;
  /** Share metadata */
  shareTitle: string;
  shareText: string;
  filename: string;
}

export function CardDisplay({
  title, subtitle, accentClass,
  renderCanvas,
  shareTitle, shareText, filename,
}: CardDisplayProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shared, setShared] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const canvas = renderCanvas();
    canvasRef.current = canvas;
    setImgSrc(canvas.toDataURL('image/png'));
  }, [renderCanvas]);

  const handleShare = useCallback(async () => {
    if (!canvasRef.current) return;
    setShared(true);
    await shareCanvasAsImage(canvasRef.current, shareTitle, shareText, filename);
    setTimeout(() => setShared(false), 2000);
  }, [shareTitle, shareText, filename]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    setDownloaded(true);
    downloadCanvasAsImage(canvasRef.current, filename);
    setTimeout(() => setDownloaded(false), 2000);
  }, [filename]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border border-gold/20 rounded-xl overflow-hidden bg-white/[0.02]"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className={`font-mono text-xs tracking-widest uppercase font-bold mb-0.5 ${accentClass}`}>
          {title}
        </div>
        <p className="text-[11px] text-cream-dim/60">{subtitle}</p>
      </div>

      {/* Card preview image */}
      {imgSrc && (
        <div className="px-3 pb-2">
          <img
            src={imgSrc}
            alt={title}
            className="w-full rounded-lg border border-gold/10 shadow-lg"
            draggable={false}
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gold/10 border border-gold/25 rounded-lg font-mono text-xs text-gold tracking-widest uppercase hover:bg-gold/20 transition-all font-bold"
        >
          {shared ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5"
            >
              ✓ Shared
            </motion.span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg font-mono text-xs text-cream-dim tracking-widest uppercase hover:bg-white/[0.08] transition-all font-bold"
        >
          {downloaded ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 text-emerald-400"
            >
              ✓ Saved
            </motion.span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
