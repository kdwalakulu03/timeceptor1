/**
 * ReelPage.tsx — Cosmic Reel Studio
 *
 * Two modes:
 *   A) No birth data in URL → Showcase + 3-step intake:
 *        - Ambient auto-playing celebrity sample reels
 *        - Step 1: Enter your name + upload profile photo
 *        - Step 2: Select music track
 *        - Step 3: "Generate My Cosmic Reel" → /app?product=reel (birth form)
 *
 *   B) Birth data in URL → Full generation flow (render + download)
 *      Name, avatar, music arrive via URL params set by this page.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { calculateChart } from '../lib/astrology';
import type { ChartData } from '../lib/astrology';
import {
  fetchMusicTracks,
  fetchWorkerChart,
  uploadAvatar,
  submitRenderJob,
  pollJobStatus,
  downloadReel,
  canGenerateReel,
  recordReelGeneration,
  ReelRateLimitError,
  ReelServerBusyError,
} from '../lib/reelApi';
import type { MusicTrack, ReelBirth } from '../lib/reelApi';
import { Background } from '../components/Background';
import { CELEBRITIES } from '../data/celebrities';

/* ── Celebrity sample reels ───────────────────────────────────────────────── */

const SAMPLE_REELS = CELEBRITIES.map(c => ({
  id: c.id,
  name: c.name,
  emoji: c.emoji,
  tagline: c.tagline,
  src: `/reels/${c.id}.mp4`,
}));

/* ── Progress Steps (multi-step animation for generation) ─────────────────── */

interface ProgressStep {
  label: string;
  icon: string;
  detail: string;
  durationMs: number;
}

const PROGRESS_STEPS: ProgressStep[] = [
  { label: 'Connecting to cosmos…',        icon: '🌌', detail: 'Reaching the render engine',                              durationMs: 2000  },
  { label: 'Computing your Vedic chart…',  icon: '🧮', detail: 'Swiss Ephemeris + Lahiri ayanamsa on the server',          durationMs: 4000  },
  { label: 'Reading birth chart data…',    icon: '📜', detail: 'Parsing planetary positions and house cusps',              durationMs: 3000  },
  { label: 'Drawing the cover slide…',     icon: '🎨', detail: 'Rendering your name, rising sign & avatar',               durationMs: 5000  },
  { label: 'Rendering Western chart…',     icon: '🪐', detail: 'Plotting tropical zodiac wheel with all 9 planets',       durationMs: 5000  },
  { label: 'Rendering South Indian chart…',icon: '🔲', detail: 'Building the traditional 4×4 Rasi grid',                  durationMs: 5000  },
  { label: 'Rendering North Indian chart…',icon: '💎', detail: 'Drawing the diamond-style Kundli layout',                 durationMs: 5000  },
  { label: 'Calculating Dasha periods…',   icon: '📅', detail: 'Vimshottari Maha & Antar Dasha timeline',                 durationMs: 6000  },
  { label: 'Mapping golden hours…',        icon: '✨', detail: 'Computing your 7-day planetary hour windows',              durationMs: 6000  },
  { label: 'Generating SWOT analysis…',    icon: '⊞',  detail: 'Analysing strengths, weaknesses, opportunities, threats',  durationMs: 6000  },
  { label: 'Computing yogas…',             icon: '🔮', detail: 'Detecting Dhana, Raja and other planetary yogas',          durationMs: 5000  },
  { label: 'Encoding video…',             icon: '🎬', detail: 'FFmpeg H.264 encoding with music track',                   durationMs: 8000  },
  { label: 'Finalising your reel…',       icon: '✅', detail: 'Almost there — polishing the final MP4',                   durationMs: 5000  },
];

/* ── Shared Navbar ─────────────────────────────────────────────────────────── */

function ReelNavbar({ rightLink }: { rightLink?: React.ReactNode }) {
  return (
    <nav className="relative z-10 flex justify-between items-center px-4 sm:px-6 py-1 md:px-12 md:py-3 border-b border-gold/10">
      <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
        <img src="/logo.png" alt="" className="h-10 w-10 sm:h-14 sm:w-14 object-contain drop-shadow-[0_0_20px_rgba(244,161,29,0.6)]" />
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl tracking-widest uppercase text-gold font-display font-semibold">Timeceptor</span>
          <span className="font-mono text-[10px] tracking-widest text-cream-dim/60">Cosmic Reel Studio</span>
        </div>
      </Link>
      {rightLink || (
        <Link to="/" className="font-mono text-xs text-cream-dim tracking-widest uppercase border border-gold/30 rounded-full px-4 py-2 hover:border-gold/60 hover:text-gold transition-all">← Home</Link>
      )}
    </nav>
  );
}

/* ── Shared Footer ─────────────────────────────────────────────────────────── */

function ReelFooter() {
  return (
    <footer className="relative z-10 border-t border-gold/10 px-4 sm:px-6 py-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
      <Link to="/" className="text-lg tracking-widest uppercase text-gold font-semibold hover:text-gold-light transition-colors">Timeceptor</Link>
      <div className="flex items-center gap-4 font-mono text-xs text-cream-dim tracking-widest uppercase">
        <a href="https://timecept.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">timecept.com</a>
        <span className="opacity-50">·</span>
        <span>© 2026</span>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SHOWCASE PAGE — 3-step intake + ambient sample reels
   ══════════════════════════════════════════════════════════════════════════ */

function ShowcasePage() {
  const navigate = useNavigate();

  /* ── Ambient sample reel auto-play ──────────────────────────── */
  const [activeIdx, setActiveIdx] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const iv = setInterval(() => setActiveIdx(i => (i + 1) % SAMPLE_REELS.length), 20000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIdx) { v.currentTime = 0; v.play().catch(() => {}); }
      else { v.pause(); }
    });
  }, [activeIdx]);

  const active = SAMPLE_REELS[activeIdx];

  /* ── User intake state ──────────────────────────────────────── */
  const [reelName, setReelName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedMusic, setSelectedMusic] = useState('timeceptor default');
  const [musicLoading, setMusicLoading] = useState(true);

  useEffect(() => {
    fetchMusicTracks()
      .then(data => { setMusicTracks(data.tracks); setSelectedMusic(data.default); })
      .catch(() => { setMusicTracks([{ id: 'timeceptor-default', name: 'Timeceptor Default', file: 'timeceptor default.mp3' }]); })
      .finally(() => setMusicLoading(false));
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { alert('Only PNG, JPG or WebP images allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setAvatarPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  /* ── Navigate to /app with reel context ─────────────────────── */
  const handleGenerateCTA = () => {
    // Store reel preferences in sessionStorage so generator page can pick them up
    sessionStorage.setItem('tc_reel_name', reelName || '');
    sessionStorage.setItem('tc_reel_music', selectedMusic);
    // avatarPreview is already base64 from the upload handler — use it directly
    if (avatarPreview) {
      sessionStorage.setItem('tc_reel_avatar', avatarPreview);
    } else {
      sessionStorage.removeItem('tc_reel_avatar');
    }
    navigate('/app?product=reel#form');
  };

  /* ── Music genre icons ──────────────────────────────────────── */
  const musicIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('ascend') || n.includes('rise')) return '🔥';
    if (n.includes('emerald') || n.includes('horizion')) return '🌿';
    if (n.includes('celestial') || n.includes('arcana')) return '🌌';
    if (n.includes('luminous') || n.includes('quiet')) return '🕊️';
    if (n.includes('instrumental')) return '🎹';
    return '🎵';
  };

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light overflow-hidden">
      <Background />
      <ReelNavbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="text-4xl mb-2 block">🎬</span>
          <h1 className="font-display text-2xl sm:text-4xl text-gold font-bold tracking-wide mb-3">
            Get Your Personal Cosmic Reel
          </h1>
          <p className="text-cream-dim/60 text-sm sm:text-base font-mono max-w-lg mx-auto">
            HD video with your Vedic charts, dashas, golden hours, yogas & music — free, no sign-up
          </p>
        </motion.div>

        {/* ── Two-column layout: left = sample reel, right = steps ── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT: Ambient sample reel player ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-shrink-0 lg:sticky lg:top-8"
          >
            <div className="text-center mb-3">
              <span className="font-mono text-[10px] text-cream-dim/40 tracking-widest uppercase">Sample reels — see what you'll get</span>
            </div>
            <div
              className="relative mx-auto"
              style={{
                width: 280,
                maxWidth: '75vw',
                borderRadius: '1.2rem',
                overflow: 'hidden',
                border: '2px solid rgba(244,161,29,0.4)',
                boxShadow: '0 0 25px rgba(244,161,29,0.25), 0 0 60px rgba(244,161,29,0.10)',
                animation: 'glow-video 4s ease-in-out infinite',
              }}
            >
              {SAMPLE_REELS.map((reel, i) => (
                <video
                  key={reel.id}
                  ref={el => { videoRefs.current[i] = el; }}
                  src={reel.src}
                  playsInline
                  muted
                  loop
                  preload="metadata"
                  className="w-full block"
                  style={{
                    aspectRatio: '9/19.5',
                    display: i === activeIdx ? 'block' : 'none',
                  }}
                />
              ))}
              {/* Name overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                <span className="text-gold font-display text-sm font-bold block">{active.emoji} {active.name}</span>
                <span className="text-cream-dim/50 font-mono text-[10px] block mt-0.5 leading-tight">{active.tagline}</span>
              </div>
            </div>
            {/* Selector dots */}
            <div className="flex justify-center gap-2 mt-3">
              {SAMPLE_REELS.map((reel, i) => (
                <button
                  key={reel.id}
                  onClick={() => setActiveIdx(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${
                    i === activeIdx
                      ? 'border-gold/50 bg-gold/[0.12] text-gold'
                      : 'border-white/[0.08] bg-white/[0.02] text-cream-dim/50 hover:border-gold/25'
                  }`}
                >
                  <span>{reel.emoji}</span>
                  <span className="hidden sm:inline font-display font-semibold">{reel.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: 3-step intake form ─────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* ═══ Step 1: Name + Photo ═══════════════════════════ */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold font-mono">1</span>
                <span className="font-mono text-xs text-cream-dim/60 tracking-widest uppercase">Your details</span>
              </div>

              <div className="rounded-xl border border-gold/15 bg-gold/[0.03] p-4 sm:p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-2">Display Name</label>
                  <input
                    type="text"
                    value={reelName}
                    onChange={e => setReelName(e.target.value)}
                    maxLength={30}
                    className="w-full px-3 py-2.5 rounded-lg border border-gold/20 bg-gold/[0.04] text-cream text-sm font-mono tracking-wide placeholder:text-cream-dim/30 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-all"
                    placeholder="Enter your name (shown on reel cover)"
                  />
                </div>

                {/* Avatar */}
                <div>
                  <label className="block font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-2">Profile Photo <span className="text-cream-dim/30">(optional)</span></label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/25 bg-[#111] flex-shrink-0 flex items-center justify-center">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-4 py-2 rounded-lg border border-gold/20 bg-gold/[0.04] text-cream-dim text-xs font-mono hover:border-gold/40 hover:text-cream transition-all"
                      >
                        {avatarPreview ? '✓ Change Photo' : 'Upload Photo'}
                      </button>
                      <span className="font-mono text-[9px] text-cream-dim/30">PNG, JPG or WebP · max 5 MB</span>
                    </div>
                    <input ref={avatarInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ═══ Step 2: Select Music ════════════════════════════ */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold font-mono">2</span>
                <span className="font-mono text-xs text-cream-dim/60 tracking-widest uppercase">Choose music</span>
              </div>

              <div className="rounded-xl border border-gold/15 bg-gold/[0.03] p-4 sm:p-5">
                {musicLoading ? (
                  <div className="text-cream-dim/40 text-xs font-mono animate-pulse py-4 text-center">Loading tracks…</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {musicTracks.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedMusic(t.name.toLowerCase())}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                          selectedMusic === t.name.toLowerCase()
                            ? 'border-gold/50 bg-gold/[0.12] shadow-[0_0_15px_rgba(244,161,29,0.1)]'
                            : 'border-white/[0.08] bg-white/[0.02] hover:border-gold/25'
                        }`}
                      >
                        <span className="text-lg">{musicIcon(t.name)}</span>
                        <span className={`text-sm font-mono tracking-wide ${selectedMusic === t.name.toLowerCase() ? 'text-gold font-semibold' : 'text-cream-dim/70'}`}>
                          {t.name}
                        </span>
                        {selectedMusic === t.name.toLowerCase() && (
                          <span className="ml-auto text-gold text-xs">✓</span>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedMusic('none')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                        selectedMusic === 'none'
                          ? 'border-gold/50 bg-gold/[0.12] shadow-[0_0_15px_rgba(244,161,29,0.1)]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-gold/25'
                      }`}
                    >
                      <span className="text-lg">🔇</span>
                      <span className={`text-sm font-mono tracking-wide ${selectedMusic === 'none' ? 'text-gold font-semibold' : 'text-cream-dim/70'}`}>No Music</span>
                      {selectedMusic === 'none' && <span className="ml-auto text-gold text-xs">✓</span>}
                    </button>
                  </div>
                )}
              </div>
            </motion.section>

            {/* ═══ Step 3: Generate CTA ════════════════════════════ */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold font-mono">3</span>
                <span className="font-mono text-xs text-cream-dim/60 tracking-widest uppercase">Enter birth details & generate</span>
              </div>

              <button
                onClick={handleGenerateCTA}
                className="group w-full p-5 sm:p-6 rounded-xl border-2 border-gold/40 bg-gradient-to-r from-gold/[0.12] to-gold/[0.04] hover:from-gold/[0.20] hover:border-gold/60 transition-all cursor-pointer"
                style={{ animation: 'glow-border 3s ease-in-out infinite' }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">🎬</span>
                  <div className="flex-1 text-left">
                    <span className="text-lg sm:text-xl text-gold font-display font-bold tracking-wide block">
                      Generate My Cosmic Reel
                    </span>
                    <span className="text-xs sm:text-sm text-cream-dim/50 font-mono block mt-1">
                      Enter your birth date, time & place → we'll render your personal reel
                    </span>
                  </div>
                  <span className="text-gold font-mono text-sm tracking-widest uppercase group-hover:translate-x-1 transition-transform">
                    Go →
                  </span>
                </div>
              </button>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                <span className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400 font-mono text-[10px] tracking-widest uppercase font-bold">✓ Free</span>
                <span className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400 font-mono text-[10px] tracking-widest uppercase font-bold">✓ No Sign-up</span>
                <span className="px-3 py-1 rounded-full border border-gold/30 bg-gold/[0.06] text-gold font-mono text-[10px] tracking-widest uppercase font-bold">~60s render</span>
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes glow-border {
          0%, 100% { border-color: rgba(244,161,29,0.4); box-shadow: 0 0 8px rgba(244,161,29,0.1); }
          50% { border-color: rgba(244,161,29,0.8); box-shadow: 0 0 25px rgba(244,161,29,0.3); }
        }
        @keyframes glow-video {
          0%, 100% { border-color: rgba(244,161,29,0.35); box-shadow: 0 0 20px rgba(244,161,29,0.15), 0 0 50px rgba(244,161,29,0.06); }
          50% { border-color: rgba(244,161,29,0.65); box-shadow: 0 0 35px rgba(244,161,29,0.30), 0 0 80px rgba(244,161,29,0.12); }
        }
      `}</style>

      <ReelFooter />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   BLURRED BACKGROUND PREVIEW (decorative during generation)
   ══════════════════════════════════════════════════════════════════════════ */

function BlurredPreview({ chart, name }: { chart: ChartData; name: string }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const slideLabels = ['Cover', 'Western Chart', 'South Indian', 'North Indian', 'Dasha', 'Golden Hours', 'SWOT'];
  const slideColors = ['#F4A11D', '#20C5A0', '#c45c5c', '#8ab4d4', '#e8c97a', '#6dc89a', '#f2ead8'];

  useEffect(() => {
    const iv = setInterval(() => setSlideIdx(i => (i + 1) % slideLabels.length), 4000);
    return () => clearInterval(iv);
  }, []);

  const planets = chart?.planets ? Object.values(chart.planets) : [];

  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(12px) brightness(0.3)', opacity: 0.5, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 300, height: 650, background: '#0a0a0a', borderRadius: 30, border: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48, transition: 'all 0.8s ease' }}>{['🌟', '🪐', '🔲', '💎', '📅', '✨', '⊞'][slideIdx]}</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: slideColors[slideIdx], transition: 'color 0.8s ease', textAlign: 'center' }}>{slideLabels[slideIdx]}</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{name}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {planets.slice(0, 7).map((_p, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: slideColors[i % slideColors.length], opacity: slideIdx === i ? 1 : 0.3, transition: 'opacity 0.6s ease' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   GENERATOR PAGE — birth data present, full generation flow
   ══════════════════════════════════════════════════════════════════════════ */

function GeneratorPage({ birthData, chart, search }: {
  birthData: { dob: string; tob: string; lat: number; lng: number; locationName: string };
  chart: ChartData;
  search: string;
}) {
  // Pick up reel preferences from sessionStorage (set by ShowcasePage)
  const [reelName, setReelName] = useState(() => sessionStorage.getItem('tc_reel_name') || `User.${Math.random().toString().slice(2, 8)}`);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarFileRef = useRef<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(() => sessionStorage.getItem('tc_reel_avatar') || '/ProfileUnavailable.png');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [selectedMusic, setSelectedMusic] = useState(() => sessionStorage.getItem('tc_reel_music') || 'timeceptor default');
  const [musicLoading, setMusicLoading] = useState(true);

  // Whether avatar has been restored from sessionStorage (or confirmed absent)
  const avatarReady = useRef(false);
  const hasAutoStarted = useRef(false);

  // Check if autostart is requested (coming from /app?product=reel)
  const shouldAutoStart = useMemo(() => {
    const p = new URLSearchParams(search);
    return p.get('autostart') === '1';
  }, [search]);

  // Restore avatar from sessionStorage base64
  useEffect(() => {
    const stored = sessionStorage.getItem('tc_reel_avatar');
    if (stored && stored.startsWith('data:')) {
      // Convert base64 to File so we can upload it
      fetch(stored).then(r => r.blob()).then(blob => {
        const file = new File([blob], 'avatar.jpg', { type: blob.type });
        avatarFileRef.current = file;
        setAvatarFile(file);
        avatarReady.current = true;
      }).catch(() => { avatarReady.current = true; });
    } else {
      avatarReady.current = true;
    }
  }, []);

  useEffect(() => {
    fetchMusicTracks()
      .then(data => { setMusicTracks(data.tracks); if (!sessionStorage.getItem('tc_reel_music')) setSelectedMusic(data.default); })
      .catch(() => { setMusicTracks([{ id: 'timeceptor-default', name: 'Timeceptor Default', file: 'timeceptor default.mp3' }]); })
      .finally(() => setMusicLoading(false));
  }, []);

  type Phase = 'idle' | 'uploading' | 'rendering' | 'downloading' | 'done' | 'error';
  const [phase, setPhase] = useState<Phase>(() => shouldAutoStart ? 'uploading' : 'idle');
  const [progressStep, setProgressStep] = useState(0);
  const [serverProgress, setServerProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_DISPLAY = 3;

  const { allowed: canGenerate, remaining: reelsRemaining } = canGenerateReel();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { alert('Only PNG, JPG or WebP images allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return; }
    avatarFileRef.current = file;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setAvatarPreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const startProgressAnimation = useCallback(() => {
    setProgressStep(0);
    let step = 0;
    function advanceStep() {
      step++;
      if (step < PROGRESS_STEPS.length) { setProgressStep(step); stepTimerRef.current = setTimeout(advanceStep, PROGRESS_STEPS[step].durationMs); }
    }
    stepTimerRef.current = setTimeout(advanceStep, PROGRESS_STEPS[0].durationMs);
  }, []);

  const stopProgressAnimation = useCallback(() => {
    if (stepTimerRef.current) { clearTimeout(stepTimerRef.current); stepTimerRef.current = null; }
  }, []);

  useEffect(() => {
    return () => {
      stopProgressAnimation();
      if (pollRef.current) clearInterval(pollRef.current);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl, stopProgressAnimation]);

  const handleGenerate = async () => {
    if (!canGenerate) { setErrorMsg(`Daily limit reached (${MAX_DISPLAY} reels/day). Come back tomorrow!`); setPhase('error'); return; }
    setPhase('uploading'); setErrorMsg(''); setServerProgress(0);

    try {
      let avatarPath: string | undefined;
      const fileToUpload = avatarFileRef.current;
      if (fileToUpload) {
        try { avatarPath = await uploadAvatar(fileToUpload); } catch (e) { console.warn('Avatar upload failed, proceeding without:', e); }
      }

      const bd = new Date(`${birthData.dob}T${birthData.tob}`);
      const dobDisplay = bd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const tobDisplay = bd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const tob = birthData.tob.length === 5 ? `${birthData.tob}:00` : birthData.tob;

      const birth: ReelBirth = {
        name: reelName || 'Cosmic Soul', dob: birthData.dob, tob,
        dobDisplay, tobDisplay, locationName: birthData.locationName,
        lat: birthData.lat, lng: birthData.lng, avatarPath,
      };

      const chartPayload = await fetchWorkerChart(birthData.dob, tob, birthData.lat, birthData.lng);

      setPhase('rendering');
      startProgressAnimation();

      const jobId = await submitRenderJob({ birth, chart: chartPayload, settings: { musicTrack: selectedMusic } });
      recordReelGeneration();

      pollRef.current = setInterval(async () => {
        try {
          const status = await pollJobStatus(jobId);
          setServerProgress(status.progress);
          if (status.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            stopProgressAnimation(); setPhase('downloading');
            const blob = await downloadReel(jobId);
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url); setPhase('done');
          } else if (status.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            stopProgressAnimation();
            setErrorMsg(status.error || 'Render failed on the server'); setPhase('error');
          }
        } catch { /* Network glitch — keep polling */ }
      }, 2000);
    } catch (e: any) {
      stopProgressAnimation();
      if (e instanceof ReelRateLimitError) setErrorMsg('Too many requests — please wait a minute and try again.');
      else if (e instanceof ReelServerBusyError) setErrorMsg('Server is busy rendering another video. Please wait ~60 seconds.');
      else setErrorMsg(e.message || 'Something went wrong');
      setPhase('error');
    }
  };

  // Auto-start rendering when arriving from /app with autostart=1
  useEffect(() => {
    if (!shouldAutoStart || hasAutoStarted.current) return;
    // Wait for avatar restoration (async base64→File conversion)
    const waitAndStart = () => {
      if (avatarReady.current) {
        hasAutoStarted.current = true;
        handleGenerate();
      } else {
        setTimeout(waitAndStart, 100);
      }
    };
    waitAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoStart]);

  const currentStep = PROGRESS_STEPS[Math.min(progressStep, PROGRESS_STEPS.length - 1)];
  const isGenerating = phase === 'uploading' || phase === 'rendering' || phase === 'downloading';
  const overallProgress = Math.max(Math.round((progressStep / PROGRESS_STEPS.length) * 100), serverProgress);

  return (
    <div className="relative min-h-screen selection:bg-gold/30 selection:text-gold-light overflow-hidden">
      <Background />
      {isGenerating && <BlurredPreview chart={chart} name={reelName || 'Cosmic Soul'} />}

      <ReelNavbar
        rightLink={
          <Link to={`/results-main-visitor${search}`} className="font-mono text-xs text-cream-dim tracking-widest uppercase border border-gold/30 rounded-full px-4 py-2 hover:border-gold/60 hover:text-gold transition-all">← Back to Results</Link>
        }
      />

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="text-4xl mb-2 block">🎬</span>
          <h1 className="font-display text-2xl sm:text-3xl text-gold font-bold tracking-wide mb-2">Cosmic Reel Generator</h1>
          <p className="text-cream-dim/60 text-sm font-mono">Your personalised vedic astrology video reel — with music</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gold/[0.06] border border-gold/20 rounded-full">
            <span className="text-xs">🎥</span>
            <span className="font-mono text-[10px] text-cream-dim/70 tracking-wider">{reelsRemaining} of {MAX_DISPLAY} free reels remaining today</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── Setup Panel ──────────────────────────────────────── */}
          {(phase === 'idle' || phase === 'error') && (
            <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <span className="text-sm">🌟</span>
                <span className="font-mono text-xs text-cream-dim/70 tracking-wider">{birthData.locationName} · {birthData.dob} · {birthData.tob}</span>
              </div>

              <div className="rounded-xl border border-gold/15 bg-gold/[0.03] p-4">
                <label className="block font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-2">Display Name</label>
                <input type="text" value={reelName} onChange={e => setReelName(e.target.value)} maxLength={30} className="w-full px-3 py-2 rounded-lg border border-gold/20 bg-gold/[0.04] text-cream text-sm font-mono tracking-wide placeholder:text-cream-dim/30 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-all" placeholder="Your name" />
              </div>

              <div className="rounded-xl border border-gold/15 bg-gold/[0.03] p-4">
                <label className="block font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-2">Profile Photo (optional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold/25 bg-[#111] flex-shrink-0">
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button type="button" onClick={() => avatarInputRef.current?.click()} className="px-4 py-2 rounded-lg border border-gold/20 bg-gold/[0.04] text-cream-dim text-xs font-mono hover:border-gold/40 hover:text-cream transition-all">Upload Photo</button>
                  <input ref={avatarInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleAvatarUpload} className="hidden" />
                  <span className="font-mono text-[9px] text-cream-dim/30">max 5 MB</span>
                </div>
              </div>

              <div className="rounded-xl border border-gold/15 bg-gold/[0.03] p-4">
                <label className="block font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-2">Background Music</label>
                {musicLoading ? (
                  <div className="text-cream-dim/40 text-xs font-mono animate-pulse">Loading tracks…</div>
                ) : (
                  <select value={selectedMusic} onChange={e => setSelectedMusic(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gold/20 bg-[#0d0d0d] text-cream text-sm font-mono tracking-wide focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23F4A11D' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36 }}>
                    {musicTracks.map(t => <option key={t.id} value={t.name.toLowerCase()}>🎵 {t.name}</option>)}
                    <option value="none">🔇 No Music</option>
                  </select>
                )}
              </div>

              {phase === 'error' && errorMsg && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-red-500/30 bg-red-500/[0.08] p-4 text-center">
                  <span className="text-red-400 text-sm font-mono">{errorMsg}</span>
                </motion.div>
              )}

              <button onClick={handleGenerate} disabled={!canGenerate} className={`w-full py-4 rounded-xl text-base font-display font-bold tracking-widest uppercase transition-all ${canGenerate ? 'bg-gradient-to-r from-gold/90 to-amber-500/90 text-[#0a0a0a] hover:shadow-[0_0_40px_rgba(244,161,29,0.5)] hover:scale-[1.02] active:scale-[0.98]' : 'bg-white/[0.05] text-cream-dim/30 cursor-not-allowed'}`}>
                {canGenerate ? '🎬 Generate Cosmic Reel' : '🔒 Daily Limit Reached'}
              </button>
              <p className="text-center font-mono text-[10px] text-cream-dim/30 tracking-wider">Takes ~60 seconds · HD MP4 with music · Free, no sign-up</p>
            </motion.div>
          )}

          {/* ── Rendering Progress ────────────────────────────────── */}
          {isGenerating && (
            <motion.div key="progress" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} className="space-y-6">
              <div className="rounded-xl border border-gold/20 bg-gold/[0.04] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-cream-dim/60 uppercase tracking-widest">Rendering…</span>
                  <span className="font-mono text-sm text-gold font-bold">{overallProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ type: 'spring', stiffness: 60, damping: 20 }} />
                </div>
              </div>
              <div className="rounded-xl border border-gold/20 bg-gold/[0.04] p-6 min-h-[160px] flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  <motion.div key={progressStep} initial={{ opacity: 0, y: 12, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="flex flex-col items-center gap-3">
                    <motion.span className="text-4xl" animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>{currentStep.icon}</motion.span>
                    <span className="text-gold font-display text-base font-semibold tracking-wide">{currentStep.label}</span>
                    <span className="text-cream-dim/50 font-mono text-[11px]">{currentStep.detail}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex justify-center gap-1.5 flex-wrap">
                {PROGRESS_STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i < progressStep ? 'bg-gold' : i === progressStep ? 'bg-gold animate-pulse scale-125' : 'bg-white/[0.1]'}`} />
                ))}
              </div>
              <p className="text-center font-mono text-[10px] text-cream-dim/30 tracking-wider">Your reel is being rendered on our servers — don't close this tab</p>
            </motion.div>
          )}

          {/* ── Done ──────────────────────────────────────────────── */}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-5 sm:p-8">
                <span className="text-4xl mb-3 block">✅</span>
                <h2 className="font-display text-xl text-emerald-400 font-bold mb-1">Your Cosmic Reel is Ready!</h2>
                <p className="text-cream-dim/50 text-xs font-mono mb-5">Preview below · Tap download to save</p>
                {downloadUrl && (
                  <div className="mb-5">
                    <div className="relative mx-auto rounded-xl overflow-hidden border-2 border-gold/30 shadow-[0_0_30px_rgba(244,161,29,0.15)]" style={{ maxWidth: 280 }}>
                      <video src={downloadUrl} controls playsInline autoPlay muted loop className="w-full block" style={{ aspectRatio: '9/19.5' }} />
                    </div>
                  </div>
                )}
                {downloadUrl && (
                  <a href={downloadUrl} download="timeceptor-cosmic-reel.mp4" className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold/90 to-amber-500/90 text-[#0a0a0a] text-base font-display font-bold tracking-widest uppercase rounded-xl hover:shadow-[0_0_40px_rgba(244,161,29,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 3v12m0 0l-4-4m4 4l4-4" /></svg>
                    Download Reel
                  </a>
                )}
                <p className="mt-3 text-cream-dim/30 text-[10px] font-mono">Video stays here until you leave this page</p>
              </div>
              <div className="sm:hidden rounded-xl border border-gold/15 bg-gold/[0.03] p-4">
                <p className="text-cream-dim/60 text-xs font-mono leading-relaxed">💡 <strong className="text-cream-dim/80">Tip:</strong> After downloading, open your gallery → share to Instagram/TikTok/WhatsApp</p>
              </div>
              <button onClick={() => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); setPhase('idle'); setDownloadUrl(null); setServerProgress(0); setProgressStep(0); }} className="w-full py-3 rounded-xl border border-gold/20 bg-gold/[0.05] text-gold text-sm font-mono tracking-widest uppercase hover:bg-gold/10 transition-all">🎬 Generate Another</button>
              <Link to={`/results-main-visitor${search}`} className="block w-full py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-cream-dim text-sm font-mono tracking-widest uppercase hover:border-gold/25 hover:text-cream transition-all text-center">← Back to Results</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ReelFooter />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT — route between showcase and generator
   ══════════════════════════════════════════════════════════════════════════ */

export default function ReelPage() {
  const { search } = useLocation();

  const birthData = useMemo(() => {
    const p = new URLSearchParams(search);
    const dob = p.get('dob');
    if (!dob) return null;
    return {
      dob,
      tob: p.get('tob') ?? '12:00',
      lat: parseFloat(p.get('lat') ?? '22.5726'),
      lng: parseFloat(p.get('lng') ?? '88.3639'),
      locationName: p.get('loc') ? decodeURIComponent(p.get('loc')!) : 'Unknown',
    };
  }, [search]);

  const chart = useMemo((): ChartData | null => {
    if (!birthData) return null;
    try {
      const bd = new Date(`${birthData.dob}T${birthData.tob}`);
      return calculateChart(bd, birthData.lat, birthData.lng);
    } catch { return null; }
  }, [birthData]);

  // No birth data → show showcase with intake steps
  if (!birthData || !chart) return <ShowcasePage />;

  // Birth data present → show generator
  return <GeneratorPage birthData={birthData} chart={chart} search={search} />;
}
