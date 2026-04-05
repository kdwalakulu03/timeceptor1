/**
 * NotificationCTA — prominent section that markets Telegram notifications
 * and collects emails. Positioned right after results so users convert
 * while they're most engaged.
 *
 * Frames Telegram as "Instant Alerts" — avoids the word "bot" entirely.
 * Email as a secondary/alternative for those who prefer it.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ── Golden-ratio derived spacing ──────────────────────────────────────── */
const PHI = 1.618;
const S = {
  xs:  Math.round(8),             // 8
  sm:  Math.round(8 * PHI),       // 13
  md:  Math.round(8 * PHI * PHI), // 21
  lg:  Math.round(8 * PHI ** 3),  // 34
  xl:  Math.round(8 * PHI ** 4),  // 55
} as const;

const C = {
  gold:       '#F4A11D',
  goldDim:    'rgba(244,161,29,0.55)',
  telegramBg: 'rgba(41,182,246,0.10)',
  telegramBorder: 'rgba(41,182,246,0.30)',
  telegram:   '#29B6F6',
  surface:    'rgba(255,255,255,0.035)',
  surfaceDark:'rgba(10,10,22,0.85)',
  border:     'rgba(255,255,255,0.08)',
  text:       '#E9E7F2',
  textDim:    'rgba(233,231,242,0.50)',
  textMid:    'rgba(233,231,242,0.70)',
  emerald:    '#20C5A0',
} as const;

/* ── Telegram icon (official shape, no "bot" connotation) ──────────────── */
function TelegramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" fill="#29B6F6"/>
      <path d="M17.3 7.7l-2.1 9.9c-.15.7-.55.87-1.12.54l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.14 5.72-5.17c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.2-.67-.66.14-.98l11.9-4.59c.55-.2 1.03.13.85.98z" fill="#fff"/>
    </svg>
  );
}

/* ── Bell icon ──────────────────────────────────────────────────────────── */
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

/* ── Check icon ─────────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

interface NotificationCTAProps {
  botUsername: string | null;
  uid: string | null;
  telegramLinked: boolean;
}

export function NotificationCTA({ botUsername, uid, telegramLinked }: NotificationCTAProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSending(true);
    try {
      await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, uid: uid ?? 'anonymous' }),
      });
      setEmailSent(true);
    } catch {
      setEmailSent(true); // offline fallback
    }
    setSending(false);
  };

  const handlePush = async () => {
    if (!uid || !pushSupported) return;
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = (window as any).__VAPID_PUBLIC_KEY__ || '';
      if (!vapidKey) throw new Error('VAPID key not loaded');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, subscription: sub.toJSON() }),
      });
      setPushEnabled(true);
    } catch (e) {
      console.warn('[push] subscribe failed:', e);
    }
    setPushBusy(false);
  };

  const features = [
    'Alert before your peak window',
    'Daily morning briefing',
    'Free, no spam — unsubscribe anytime',
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        marginTop: S.lg,
        padding: `${S.lg}px ${S.md}px`,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        fontFamily: "'Inter', 'system-ui', sans-serif",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: S.md }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: S.sm,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: C.gold,
        }}>
          <BellIcon />
          Never miss your peak window
        </div>
        <p style={{
          fontSize: 14, color: C.textMid, lineHeight: 1.6,
          maxWidth: 420, margin: '0 auto',
        }}>
          Get a free instant alert on your phone minutes before each optimal window opens — so you never have to check manually.
        </p>
      </div>

      {/* ── Feature checklist ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: `${S.xs}px ${S.md}px`, marginBottom: S.md,
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: C.textDim,
          }}>
            <span style={{ color: C.emerald, flexShrink: 0 }}><CheckIcon /></span>
            {f}
          </div>
        ))}
      </div>

      {/* ── Three-column: Push + Telegram + Email ──────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: S.sm,
      }}>
        {/* Push Notification card — PRIMARY */}
        <div style={{
          border: `1px solid rgba(244,161,29,0.30)`,
          borderRadius: 12,
          padding: `${S.md}px ${S.sm}px`,
          textAlign: 'center',
          background: 'rgba(244,161,29,0.04)',
        }}>
          <div style={{ marginBottom: S.xs }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.text,
            marginBottom: 4,
          }}>
            Push Alerts
          </div>
          <div style={{
            fontSize: 11, color: C.textDim, marginBottom: 2,
            lineHeight: 1.5,
          }}>
            Instant alerts on your phone<br/>— no app install needed
          </div>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.gold, letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: S.sm,
          }}>
            ★ Recommended
          </div>

          {pushEnabled ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 24,
              background: 'rgba(32,197,160,0.12)',
              border: '1px solid rgba(32,197,160,0.30)',
              fontSize: 12, fontWeight: 600, color: C.emerald,
              letterSpacing: '0.06em',
            }}>
              <CheckIcon /> Push active
            </div>
          ) : pushSupported && uid ? (
            <button
              onClick={handlePush}
              disabled={pushBusy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 24,
                background: C.gold,
                color: '#0a0a16', fontWeight: 700, fontSize: 13,
                border: 'none', cursor: 'pointer',
                letterSpacing: '0.04em',
                opacity: pushBusy ? 0.6 : 1,
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 2px 12px rgba(244,161,29,0.25)',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                (e.target as HTMLElement).style.boxShadow = '0 4px 20px rgba(244,161,29,0.35)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.transform = 'translateY(0)';
                (e.target as HTMLElement).style.boxShadow = '0 2px 12px rgba(244,161,29,0.25)';
              }}
            >
              <BellIcon />
              {pushBusy ? 'Enabling...' : 'Enable Push'}
            </button>
          ) : !pushSupported ? (
            <div style={{ fontSize: 11, color: C.textDim, fontStyle: 'italic' }}>
              Not supported on this browser
            </div>
          ) : (
            <div style={{ fontSize: 11, color: C.textDim, fontStyle: 'italic' }}>
              Sign in to enable
            </div>
          )}
        </div>

        {/* Telegram card */}
        <div style={{
          border: `1px solid ${C.telegramBorder}`,
          borderRadius: 12,
          padding: `${S.md}px ${S.sm}px`,
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: S.xs }}>
            <TelegramIcon size={28} />
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.text,
            marginBottom: 4,
          }}>
            Instant Alerts
          </div>
          <div style={{
            fontSize: 11, color: C.textDim, marginBottom: S.sm,
            lineHeight: 1.5,
          }}>
            Get notified right on your phone,<br />seconds before your best hour
          </div>

          {telegramLinked ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 24,
              background: 'rgba(32,197,160,0.12)',
              border: '1px solid rgba(32,197,160,0.30)',
              fontSize: 12, fontWeight: 600, color: C.emerald,
              letterSpacing: '0.06em',
            }}>
              <CheckIcon /> Alerts active
            </div>
          ) : botUsername && uid ? (
            <a
              href={`https://t.me/${botUsername}?start=${uid}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 24,
                background: '#29B6F6',
                color: '#fff', fontWeight: 600, fontSize: 13,
                textDecoration: 'none',
                letterSpacing: '0.04em',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 2px 12px rgba(41,182,246,0.25)',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                (e.target as HTMLElement).style.boxShadow = '0 4px 20px rgba(41,182,246,0.35)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.transform = 'translateY(0)';
                (e.target as HTMLElement).style.boxShadow = '0 2px 12px rgba(41,182,246,0.25)';
              }}
            >
              <TelegramIcon size={18} />
              Enable Alerts
            </a>
          ) : (
            <div style={{
              fontSize: 11, color: C.textDim, fontStyle: 'italic',
            }}>
              Sign in to enable alerts
            </div>
          )}
        </div>

        {/* Email card */}
        <div style={{
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: `${S.md}px ${S.sm}px`,
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: S.xs }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.goldDim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <polyline points="22,7 12,13 2,7"/>
            </svg>
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.text,
            marginBottom: 4,
          }}>
            Morning Briefing
          </div>
          <div style={{
            fontSize: 11, color: C.textDim, marginBottom: S.sm,
            lineHeight: 1.5,
          }}>
            Daily email with your<br />top windows for the day
          </div>

          <AnimatePresence mode="wait">
            {emailSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 24,
                  background: 'rgba(32,197,160,0.12)',
                  border: '1px solid rgba(32,197,160,0.30)',
                  fontSize: 12, fontWeight: 600, color: C.emerald,
                }}
              >
                <CheckIcon /> You're on the list
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleEmail}
                style={{ display: 'flex', gap: 6, maxWidth: 280, margin: '0 auto' }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: 1, minWidth: 0,
                    padding: '9px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                    fontSize: 13, outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(244,161,29,0.40)'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border}
                />
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '9px 16px',
                    background: C.gold,
                    color: '#0a0a16',
                    border: 'none', borderRadius: 8,
                    fontWeight: 700, fontSize: 12,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    opacity: sending ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {sending ? '...' : 'Go'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Responsive override for mobile ────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          section > div:last-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </motion.section>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}
