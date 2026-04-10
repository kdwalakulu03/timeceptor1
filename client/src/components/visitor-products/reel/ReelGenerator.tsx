import React, { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { toPng } from 'html-to-image';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { Download, Loader2, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ReelSlide {
  id: string;
  label: string;
  totalSteps: number;
  holdFrames: (step: number) => number;
  render: (step: number) => React.ReactNode;
}

interface ReelGeneratorProps {
  slides: ReelSlide[];
  autoStart?: boolean;
  onClose?: () => void;
}

// ─── Captured frame ───────────────────────────────────────────────────────────
interface CapturedStep {
  slideIdx: number;
  step: number;
  img: HTMLImageElement;
  hold: number; // how many output frames to hold this image
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PHONE_W = 340;
const PHONE_ASPECT = 9 / 19.5;
const PHONE_H = Math.round(PHONE_W / PHONE_ASPECT);

const OUT_W = 720;
const OUT_H = Math.round(OUT_W / PHONE_ASPECT);
const FPS = 24;
const LAST_STEP_HOLD = 18;
const CROSS_FADE_FRAMES = 8;
const FRAME_DUR_US = Math.round(1_000_000 / FPS); // ~41667 microseconds
const LOGO_URL = '/timeceptor-logo.png';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`Timeout ${ms}ms`)), ms),
    ),
  ]);
}

// ─── Sub-components ───────────────────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: PHONE_W,
        height: PHONE_H,
        background: '#0a0a0a',
        borderRadius: 36,
        border: '2px solid rgba(255,255,255,0.12)',
        boxShadow: '0 0 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Status bar */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 42, zIndex: 20,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
        }}
      >
        {/* Time */}
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
        {/* Center: logo + branding */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/timeceptor-logo.png" alt="" style={{ height: 38, objectFit: 'contain', opacity: 0.85 }} />
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
            Timeceptor by timecept.com &#x2122; &#169;
          </span>
        </div>
        {/* Battery + signal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
            {[3,5,7,9].map(v => <div key={v} style={{ width: 2, height: v, background: 'rgba(255,255,255,0.35)', borderRadius: 999 }} />)}
          </div>
          <div style={{ width: 18, height: 10, borderRadius: 2, border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'stretch', padding: 1 }}>
            <div style={{ width: '70%', background: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
          </div>
        </div>
      </div>

      {/* Slide content — starts below status bar with gap */}
      <div style={{ position: 'absolute', top: 44, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        {children}
      </div>

      {/* Large transparent watermark logo */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
        <img src="/timeceptor-logo.png" alt="" style={{ width: '60%', opacity: 0.04, userSelect: 'none' }} draggable={false} />
      </div>

      {/* Home bar */}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 90, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999, zIndex: 20 }} />
    </div>
  );
}

function SlideDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-2 mt-5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-1.5 bg-[#C1A661]'
              : i < current
                ? 'w-1.5 h-1.5 bg-[#C1A661]/40'
                : 'w-1.5 h-1.5 bg-white/20'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReelGenerator({ slides, autoStart, onClose }: ReelGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'encoding'>('idle');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const captureRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => () => { abortRef.current = true; }, []);

  const totalSteps = slides.reduce((s, sl) => s + sl.totalSteps, 0);

  // Auto-start generation if prop is set
  const didAutoStart = useRef(false);
  useEffect(() => {
    if (autoStart && !didAutoStart.current && slides.length > 0) {
      didAutoStart.current = true;
      // Small delay so the DOM is ready for capture
      const t = setTimeout(() => handleDownload(), 300);
      return () => clearTimeout(t);
    }
  }, [autoStart, slides.length]); // handleDownload is stable via useCallback

  const handleDownload = useCallback(async () => {
    abortRef.current = false;
    flushSync(() => {
      setStatus('capturing');
      setCurrentSlide(0);
      setCurrentStep(0);
      setProgress(0);
      setStatusText('Starting…');
    });

    await raf(); await raf(); await raf();
    console.log('[Reel] Start — slides:', slides.length, 'totalSteps:', totalSteps);

    // Preload logo for watermark
    let logoImg: HTMLImageElement | null = null;
    try {
      logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = LOGO_URL;
      });
    } catch {
      console.warn('[Reel] Logo load failed, continuing without');
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1: Fast capture — toPng each step, NO hold waits
    // ═══════════════════════════════════════════════════════════════════
    const captured: CapturedStep[] = [];
    let stepsDone = 0;

    for (let si = 0; si < slides.length; si++) {
      if (abortRef.current) break;
      const slide = slides[si];

      for (let step = 0; step < slide.totalSteps; step++) {
        if (abortRef.current) break;

        flushSync(() => {
          setCurrentSlide(si);
          setCurrentStep(step);
          setStatusText(`Capturing ${slide.label} ${step + 1}/${slide.totalSteps}`);
        });

        await raf(); await raf();

        const zone = captureRef.current;
        if (!zone) { stepsDone++; continue; }

        let img: HTMLImageElement | null = null;
        try {
          const dataUrl = await withTimeout(
            toPng(zone, {
              width: PHONE_W,
              height: PHONE_H,
              canvasWidth: OUT_W,
              canvasHeight: OUT_H,
              backgroundColor: '#0a0a0a',
              skipFonts: true,
              cacheBust: false,
              includeQueryParams: true,
              pixelRatio: 2,
            }),
            8000,
          );
          img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = dataUrl;
          });
        } catch (e) {
          console.warn('[Reel] toPng fail at', si, step, e);
        }

        if (img) {
          const hold =
            step === slide.totalSteps - 1
              ? slide.holdFrames(step) + LAST_STEP_HOLD
              : slide.holdFrames(step);
          captured.push({ slideIdx: si, step, img, hold });
        } else if (captured.length > 0) {
          // Reuse last good frame
          const last = captured[captured.length - 1];
          captured.push({ ...last, slideIdx: si, step });
        }

        stepsDone++;
        flushSync(() =>
          setProgress(Math.round((stepsDone / totalSteps) * 50)),
        );
      }
    }

    console.log('[Reel] Phase 1 done — captured', captured.length, 'frames');
    if (captured.length === 0 || abortRef.current) {
      flushSync(() => { setStatus('idle'); setProgress(0); });
      return;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: Encode — draw frames with explicit timestamps (instant)
    // ═══════════════════════════════════════════════════════════════════
    flushSync(() => {
      setStatus('encoding');
      setStatusText('Encoding…');
      setProgress(50);
    });

    const outCanvas = document.createElement('canvas');
    outCanvas.width = OUT_W;
    outCanvas.height = OUT_H;
    const ctx = outCanvas.getContext('2d')!;

    // Try WebCodecs → MP4, fall back to MediaRecorder → WebM
    const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
    let blob: Blob;

    if (hasWebCodecs) {
      console.log('[Reel] Using WebCodecs + mp4-muxer');
      try {
        blob = await encodeMP4(captured, outCanvas, ctx, logoImg, (p) => {
          flushSync(() => setProgress(50 + Math.round(p * 50)));
        });
      } catch (e) {
        console.warn('[Reel] WebCodecs failed, falling back to WebM:', e);
        blob = await encodeWebM(captured, outCanvas, ctx, logoImg, (p) => {
          flushSync(() => setProgress(50 + Math.round(p * 50)));
        });
      }
    } else {
      console.log('[Reel] No WebCodecs, using MediaRecorder');
      blob = await encodeWebM(captured, outCanvas, ctx, logoImg, (p) => {
        flushSync(() => setProgress(50 + Math.round(p * 50)));
      });
    }

    console.log('[Reel] Done! Blob:', blob.size, 'bytes, type:', blob.type);

    if (blob.size > 1000) {
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `horoscope-reel-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } else {
      console.error('[Reel] Blob too small:', blob.size);
    }

    flushSync(() => { setStatus('idle'); setProgress(0); });
    onClose?.();
  }, [slides, totalSteps, onClose]);

  const stopEarly = useCallback(() => {
    abortRef.current = true;
    onClose?.();
  }, [onClose]);

  const isWorking = status !== 'idle';

  return (
    <>
      {isWorking && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center"
          style={{ background: '#030303', zIndex: 2147483640 }}
        >
          <button
            onClick={stopEarly}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white transition"
            style={{ zIndex: 2147483641 }}
          >
            <X size={16} />
          </button>

          {/* ── Top section: Branding + Progress ── */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: '#C1A661', letterSpacing: '0.08em', fontWeight: 600, margin: 0 }}>
              ✨ Timeceptor is generating your reel
            </h2>

            {/* Large progress bar */}
            <div className="w-72 sm:w-80 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C1A661, #E8D48B)', boxShadow: '0 0 10px rgba(193,166,97,0.35)' }}
              />
            </div>
            <span className="font-mono text-xs text-white/50 tracking-widest">
              {progress}% · {status === 'capturing' ? slides[currentSlide]?.label ?? '' : 'Encoding'}
            </span>
          </div>

          {status === 'capturing' && (
            <div style={{ position: 'relative', width: PHONE_W, height: PHONE_H }}>
              {/* Capture zone — visible for toPng */}
              <div ref={captureRef} style={{ width: PHONE_W, height: PHONE_H }}>
                <PhoneFrame>
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {slides[currentSlide]?.render(currentStep)}
                  </div>
                </PhoneFrame>
              </div>
              {/* Light blur overlay (~30%) on top of capture zone */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', backdropFilter: 'blur(2px) brightness(0.85)', WebkitBackdropFilter: 'blur(2px) brightness(0.85)', borderRadius: 24 }} />
            </div>
          )}

          {status === 'encoding' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Dual ring spinner */}
              <div style={{ position: 'relative', width: 64, height: 64 }}>
                <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(193,166,97,0.15)', borderTopColor: '#C1A661', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 6, border: '2px solid rgba(193,166,97,0.1)', borderBottomColor: 'rgba(193,166,97,0.6)', borderRadius: '50%', animation: 'spin 1.4s linear infinite reverse' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                </div>
              </div>
              <p className="font-mono text-xs text-white/60">
                Encoding video — almost done…
              </p>
            </div>
          )}

          {status === 'capturing' && (
            <SlideDots total={slides.length} current={currentSlide} />
          )}

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {/* ── Bottom: branding + cancel ── */}
          <div className="flex flex-col items-center gap-2 mt-5">
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: 'rgba(193,166,97,0.45)', letterSpacing: '0.12em', margin: 0 }}>
              Made with love by timecept.com
            </p>
            <button
              onClick={stopEarly}
              className="font-mono text-[9px] text-red-400/70 hover:text-red-400 uppercase tracking-widest mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!autoStart && (
        <button
          onClick={handleDownload}
          disabled={isWorking}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#C1A661]/25 bg-[#C1A661]/[0.06] hover:bg-[#C1A661]/[0.12] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWorking ? (
            <Loader2 className="w-4 h-4 text-[#C1A661] animate-spin" />
          ) : (
            <Download className="w-4 h-4 text-[#C1A661]" />
          )}
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#C1A661]/80">
            {isWorking ? `${progress}%` : 'Download Reel'}
          </span>
        </button>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WebCodecs + mp4-muxer encoder (instant — not real-time)
// ═══════════════════════════════════════════════════════════════════════════════
async function encodeMP4(
  frames: CapturedStep[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  onProgress: (frac: number) => void,
): Promise<Blob> {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: OUT_W, height: OUT_H },
    fastStart: 'in-memory',
  });

  // Try codecs from most to least capable
  const codecs = ['avc1.42001f', 'avc1.420028', 'avc1.4d001f'];
  let pickedCodec = codecs[0];
  for (const c of codecs) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: c, width: OUT_W, height: OUT_H, bitrate: 4_000_000, framerate: FPS,
      });
      if (support.supported) { pickedCodec = c; break; }
    } catch { /* try next */ }
  }
  console.log('[Reel] Using codec:', pickedCodec);

  let encError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encError = new Error(e.message); },
  });

  encoder.configure({
    codec: pickedCodec,
    width: OUT_W,
    height: OUT_H,
    bitrate: 4_000_000,
    framerate: FPS,
    hardwareAcceleration: 'prefer-software',
  });

  // Build timeline: expand hold frames + cross-fades
  let timestamp = 0;
  let totalOutputFrames = 0;

  // Count total for progress
  for (let i = 0; i < frames.length; i++) {
    totalOutputFrames += frames[i].hold;
    if (i > 0 && frames[i].slideIdx !== frames[i - 1].slideIdx) {
      totalOutputFrames += CROSS_FADE_FRAMES;
    }
  }

  let encodedFrames = 0;

  function encodeCanvas(isKey: boolean) {
    if (encError) throw encError;
    const vf = new VideoFrame(canvas, { timestamp, duration: FRAME_DUR_US });
    encoder.encode(vf, { keyFrame: isKey });
    vf.close();
    timestamp += FRAME_DUR_US;
    encodedFrames++;
    if (encodedFrames % 20 === 0) {
      onProgress(encodedFrames / totalOutputFrames);
    }
  }

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];

    // Cross-fade at slide boundaries
    if (i > 0 && f.slideIdx !== frames[i - 1].slideIdx) {
      const prevImg = frames[i - 1].img;
      for (let t = 0; t < CROSS_FADE_FRAMES; t++) {
        ctx.globalAlpha = 1;
        ctx.drawImage(prevImg, 0, 0, OUT_W, OUT_H);
        ctx.globalAlpha = (t + 1) / CROSS_FADE_FRAMES;
        ctx.drawImage(f.img, 0, 0, OUT_W, OUT_H);
        ctx.globalAlpha = 1;
        encodeCanvas(false);
      }
    }

    // Draw this frame and hold
    ctx.globalAlpha = 1;
    ctx.drawImage(f.img, 0, 0, OUT_W, OUT_H);
    for (let h = 0; h < f.hold; h++) {
      encodeCanvas(h === 0 && (encodedFrames % (FPS * 2) === 0));
    }

    // Yield every 30 frames to prevent UI freeze
    if (i % 30 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  await encoder.flush();
  encoder.close();
  muxer.finalize();

  onProgress(1);
  return new Blob([target.buffer], { type: 'video/mp4' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MediaRecorder fallback (real-time — slower but universal)
// ═══════════════════════════════════════════════════════════════════════════════
async function encodeWebM(
  frames: CapturedStep[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  onProgress: (frac: number) => void,
): Promise<Blob> {
  const stream = canvas.captureStream(FPS);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 4_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(200);

  const frameMs = 1000 / FPS;
  let totalHold = 0;
  for (const f of frames) totalHold += f.hold;
  // Add cross-fade frames
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].slideIdx !== frames[i - 1].slideIdx) totalHold += CROSS_FADE_FRAMES;
  }

  let done = 0;

  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];

    // Cross-fade
    if (i > 0 && f.slideIdx !== frames[i - 1].slideIdx) {
      const prevImg = frames[i - 1].img;
      for (let t = 0; t < CROSS_FADE_FRAMES; t++) {
        ctx.globalAlpha = 1;
        ctx.drawImage(prevImg, 0, 0, OUT_W, OUT_H);
        ctx.globalAlpha = (t + 1) / CROSS_FADE_FRAMES;
        ctx.drawImage(f.img, 0, 0, OUT_W, OUT_H);
        ctx.globalAlpha = 1;
        await new Promise((r) => setTimeout(r, frameMs));
        done++;
        onProgress(done / totalHold);
      }
    }

    ctx.globalAlpha = 1;
    ctx.drawImage(f.img, 0, 0, OUT_W, OUT_H);
    for (let h = 0; h < f.hold; h++) {
      await new Promise((r) => setTimeout(r, frameMs));
      done++;
      if (done % 10 === 0) onProgress(done / totalHold);
    }
  }

  await new Promise((r) => setTimeout(r, 500));
  recorder.stop();
  await new Promise<void>((r) => { recorder.onstop = () => r(); });

  return new Blob(chunks, { type: mime });
}
