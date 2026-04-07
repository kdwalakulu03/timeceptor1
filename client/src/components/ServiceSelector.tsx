import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICES } from '../services';
import { ServiceId } from '../types';
import { signInWithGoogle } from '../firebase';

/** Only yoga + meditation are free for anonymous users */
const FREE_SERVICES: ServiceId[] = ['yoga', 'meditation'];

interface ServiceSelectorProps {
  selected: ServiceId;
  onSelect: (id: ServiceId) => void;
  isAuthed?: boolean;
}

export function ServiceSelector({ selected, onSelect, isAuthed = true }: ServiceSelectorProps) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<{ id: ServiceId; anchorRef: HTMLElement } | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss tooltip after 3s
  useEffect(() => {
    if (tooltip) {
      tooltipTimer.current = setTimeout(() => setTooltip(null), 3000);
      return () => { if (tooltipTimer.current) clearTimeout(tooltipTimer.current); };
    }
  }, [tooltip]);

  // Position tooltip centered above anchor, clamped to viewport
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!tooltip?.anchorRef) return;
    const rect = tooltip.anchorRef.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const tipW = 260; // max-w-[260px]
    const pad = 12;
    let left = cx - tipW / 2;
    if (left < pad) left = pad;
    if (left + tipW > window.innerWidth - pad) left = window.innerWidth - pad - tipW;
    setTooltipStyle({ left, top: rect.top - 10, position: 'fixed' as const });
  }, [tooltip]);

  const handleClick = useCallback((serviceId: ServiceId, e: React.MouseEvent) => {
    if (isAuthed || FREE_SERVICES.includes(serviceId)) {
      onSelect(serviceId);
      setTooltip(null);
      return;
    }

    // Locked service — show tooltip
    setTooltip({ id: serviceId, anchorRef: e.currentTarget as HTMLElement });
  }, [isAuthed, onSelect]);

  const handleUnlock = useCallback(() => {
    setTooltip(null);
    if (isAuthed) {
      navigate('/checkout');
    } else {
      signInWithGoogle().catch(console.warn);
    }
  }, [isAuthed, navigate]);

  return (
    <div className="mb-8 relative">
      <label className="font-mono text-sm tracking-widest uppercase text-gold-light block mb-3">
        What are you timing?
      </label>
      <div className="flex flex-wrap gap-2">
        {SERVICES.map(service => {
          const isLocked = !isAuthed && !FREE_SERVICES.includes(service.id);

          return (
            <button
              key={service.id}
              onClick={(e) => handleClick(service.id, e)}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm border font-mono text-xs tracking-widest uppercase transition-all duration-200 relative ${
                selected === service.id && !isLocked
                  ? 'bg-gold text-space-bg border-gold font-bold'
                  : isLocked
                    ? 'bg-black/20 text-cream-dim/35 border-gold/10 cursor-pointer hover:border-gold/25'
                    : 'bg-black/30 text-cream-dim border-gold/20 hover:border-gold/50 hover:text-cream'
              }`}
            >
              <span className={isLocked ? 'opacity-50 grayscale' : ''}>{service.icon}</span>
              <span>{service.name}</span>
              {isLocked && <span className="text-[10px] ml-0.5 opacity-60">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Tooltip — positioned above the clicked button, clamped to viewport */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="z-[100] pointer-events-auto"
            style={{ ...tooltipStyle, transform: 'translateY(-100%)' }}
          >
            <div className="bg-space-card border border-gold/40 rounded-xl px-4 py-3 shadow-2xl w-[260px] text-center">
              <div className="font-mono text-[11px] text-cream font-bold mb-1.5">
                🔒 Sign in to unlock
              </div>
              <p className="text-[10px] text-cream-dim/65 leading-relaxed mb-2.5">
                Only <strong className="text-gold">Yoga</strong> & <strong className="text-gold">Meditation</strong> are free.
                Sign in to access all 8 categories.
              </p>
              <button
                onClick={handleUnlock}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gold text-space-bg font-bold text-[10px] tracking-widest uppercase rounded-full hover:shadow-[0_0_12px_rgba(212,168,75,0.5)] transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 11h8.533c.044.385.067.78.067 1.184 0 5.368-3.6 9.184-8.6 9.184-5.04 0-9-4.04-9-9s3.96-9 9-9c2.32 0 4.4.86 6.014 2.28l-2.6 2.6A5.25 5.25 0 0 0 12 6.75 5.25 5.25 0 0 0 6.75 12 5.25 5.25 0 0 0 12 17.25c2.64 0 4.58-1.585 5.084-3.75H12V11z"/>
                </svg>
                Sign In with Google
              </button>
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-space-card border-r border-b border-gold/40 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tagline + hint for anonymous */}
      {SERVICES.find(s => s.id === selected) && (
        <p className="font-mono text-xs text-cream-dim tracking-widest uppercase mt-2">
          {SERVICES.find(s => s.id === selected)?.tagline}
        </p>
      )}
      {!isAuthed && (
        <p className="font-mono text-[10px] text-cream-dim/40 mt-1.5">
          🧘 Yoga & 🕯️ Meditation are free — <button onClick={handleUnlock} className="text-gold/70 hover:text-gold underline underline-offset-2">sign in</button> to unlock all categories
        </p>
      )}
    </div>
  );
}
