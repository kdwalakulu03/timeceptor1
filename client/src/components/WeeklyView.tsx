/**
 * WeeklyView — primary output of Timeceptor.
 *
 * v3 — Compact day cards with inline zoom-expander.
 * - Best score + time moved to LEFT (below date)
 * - Day rating scale: blame > meh > okay > nice > cheers
 * - Inline expander (tooltip-like popover) for detail view
 * - Readable font: Inter everywhere (no Cormorant Garamond)
 */
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ChevronDown, Zap, X } from 'lucide-react';
import { HourWindow, ActivityType } from '../types';

/** Firebase User-like shape (only what we need) */
interface FirebaseUserLike {
  uid: string;
  getIdToken: () => Promise<string>;
}

/* ── Colour tokens ─────────────────────────────────────────────────── */
const C = {
  border:     'rgba(244,161,29,0.08)',
  borderPeak: 'rgba(244,161,29,0.25)',
  gold:       '#F4A11D',
  goldDim:    'rgba(244,161,29,0.55)',
  emerald:    '#20C5A0',
  text:       '#E9E7F2',
  textDim:    'rgba(233,231,242,0.45)',
  textMid:    'rgba(233,231,242,0.70)',
  panelBg:    'rgba(16,16,32,0.92)',
} as const;

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  physical:     '#E07060',
  mental:       '#A99AF5',
  social:       '#20C5A0',
  creative:     '#F4A11D',
  rest:         '#7080A0',
  social_media: '#E8567F',
};

/* ── Rating scale ──────────────────────────────────────────────────── */
type DayRating = { label: string; emoji: string; color: string };

function getDayRating(avgScore: number): DayRating {
  if (avgScore >= 62) return { label: 'cheers', emoji: '🎉', color: '#F4A11D' };
  if (avgScore >= 50) return { label: 'nice',   emoji: '✨', color: '#20C5A0' };
  if (avgScore >= 38) return { label: 'okay',   emoji: '👌', color: 'rgba(233,231,242,0.70)' };
  if (avgScore >= 25) return { label: 'meh',    emoji: '😐', color: 'rgba(233,231,242,0.45)' };
  return                      { label: 'blame',  emoji: '💤', color: 'rgba(200,80,80,0.7)' };
}

const RATING_STEPS = ['blame', 'meh', 'okay', 'nice', 'cheers'];
const STEP_FILL = [
  'rgba(200,80,80,0.5)',
  'rgba(200,120,80,0.35)',
  'rgba(233,231,242,0.20)',
  'rgba(32,197,160,0.45)',
  'rgba(244,161,29,0.55)',
];

/* ── Helpers ───────────────────────────────────────────────────────── */
function scoreColor(s: number, mode: 'full' | 'dim' | 'past' = 'full'): string {
  // 'past' dims to 15%; 'dim' (locked) dims to 30%
  if (mode === 'past') {
    if (s >= 82) return 'rgba(244,161,29,0.15)';
    if (s >= 62) return 'rgba(32,197,160,0.15)';
    return 'rgba(100,110,165,0.12)';
  }
  const a = mode === 'dim' ? 0.30 : 1;
  if (s >= 82) return `rgba(244,161,29,${a})`;          // gold
  if (s >= 62) return `rgba(32,197,160,${a})`;          // emerald
  if (s >= 38) return `rgba(100,110,180,${a})`;         // medium indigo — clearly visible
  if (s >= 20) return `rgba(72,82,138,${a})`;           // dim indigo
  return `rgba(52,60,105,${a})`;                        // floor — always visible
}
function scoreH(s: number, max: number) { return Math.max(5, Math.round((s / 100) * max)); }
function fmt24(h: number) { return `${String(h).padStart(2, '0')}:00`; }
function fmtNow() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FONT = "'Inter', 'system-ui', sans-serif";

interface DayGroup {
  dayDate: Date; dayName: string; dateLabel: string;
  allWindows: HourWindow[]; peakScore: number; peakHour: number;
  avgScore: number; locked: boolean; isToday: boolean;
  startHour: number; endHour: number;
}

interface WeeklyViewProps {
  windows: HourWindow[];
  unlockedDays?: number;
  onUnlock?: () => void;
  user?: FirebaseUserLike | null;
  selectedService?: string;
}

/* ── 24-hour bar chart ─────────────────────────────────────────────── */
function DayBars({ windows, height, dim, nowHour, isToday }: {
  windows: HourWindow[]; height: number; dim: boolean; nowHour: number; isToday: boolean;
}) {
  const slots: HourWindow[] = Array.from({ length: 24 }, (_, h) =>
    windows.find(w => w.hour === h) ?? {
      date: windows[0]?.date ?? new Date(), hour: h,
      score: 0, activity: 'rest' as ActivityType,
      horaRuler: '', planets: [], isMorning: false,
    }
  );

  // Normalize bar heights relative to the day's max — always shows a visible wave.
  // Mini charts get a taller floor so the middle never looks empty.
  const dayMax = Math.max(...slots.map(s => s.score), 1);
  const MIN_H_RATIO = height <= 32 ? 0.42 : 0.22;
  function barH(score: number): number {
    const norm = MIN_H_RATIO + ((score / dayMax) * (1 - MIN_H_RATIO));
    return Math.round(norm * height);
  }

  // Percentile-based color: rank each hour within the day so the chart always
  // looks alive — top 1 gold, next 3 emerald, next 9 indigo, rest dim.
  const sorted = [...slots].sort((a, b) => b.score - a.score);
  const rankByHour = new Map(sorted.map((slot, idx) => [slot.hour, idx]));
  function rankColor(hour: number, mode: 'full' | 'dim' | 'past'): string {
    if (mode === 'past') return 'rgba(100,110,165,0.12)';
    if (mode === 'dim')  return 'rgba(100,110,180,0.22)';
    const rank = rankByHour.get(hour) ?? 99;
    if (rank === 0)       return 'rgba(244,161,29,1)';    // gold — peak
    if (rank <= 3)        return 'rgba(32,197,160,1)';    // emerald — top 4
    if (rank <= 12)       return 'rgba(100,115,200,1)';   // indigo — mid hours
    return 'rgba(65,72,120,0.85)';                         // dim indigo — quiet hours
  }

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'visible' }}>
      {/* NOW badge */}
      {isToday && (
        <div style={{
          position: 'absolute', bottom: '100%',
          left: `${((nowHour + 0.5) / 24) * 100}%`,
          transform: 'translateX(-50%)',
          fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
          fontFamily: FONT, color: C.gold,
          background: 'rgba(244,161,29,0.12)',
          border: '1px solid rgba(244,161,29,0.20)',
          padding: '1px 6px', borderRadius: 4, marginBottom: 2,
          pointerEvents: 'none', zIndex: 2, whiteSpace: 'nowrap',
        }}>NOW · {fmtNow()}</div>
      )}

      <div style={{ position: 'relative', height, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height }}>
          {slots.map((w, i) => {
            const past = isToday && i < nowHour;
            const isNow = isToday && i === nowHour;
            return (
              <div key={i}
                title={`${String(i).padStart(2, '0')}:00 · ${w.horaRuler || '—'} · ${w.score}`}
                style={{
                  flex: 1,
                  height,
                  borderRadius: 1.5,
                  transition: 'height 0.35s ease',
                  position: 'relative',
                  background: dim ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.045)',
                  overflow: 'hidden',
                  boxShadow: isNow ? '0 0 6px 1px rgba(244,161,29,0.18)' : 'none',
                  outline: isNow ? '1px solid rgba(244,161,29,0.25)' : 'none',
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: barH(w.score),
                  background: rankColor(w.hour, dim ? 'dim' : past ? 'past' : 'full'),
                  borderRadius: 1.5,
                  transition: 'height 0.35s ease',
                }} />
              </div>
            );
          })}
        </div>

        {/* Dawn / dusk dividers */}
        <div style={{ position: 'absolute', top: 0, left: `${(6 / 24) * 100}%`, width: 1, height, background: 'rgba(244,161,29,0.25)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: `${(18 / 24) * 100}%`, width: 1, height, background: 'rgba(139,180,248,0.25)', pointerEvents: 'none' }} />

        {/* Current-hour needle */}
        {isToday && (
          <div style={{
            position: 'absolute', top: 0,
            left: `${((nowHour + 0.5) / 24) * 100}%`,
            width: 2, height,
            background: C.gold,
            boxShadow: '0 0 8px 2px rgba(244,161,29,0.30)',
            borderRadius: 2, pointerEvents: 'none', zIndex: 2,
          }} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: FONT, color: C.textDim, marginTop: 3, fontWeight: 500 }}>
        <span>00</span>
        <span style={{ color: 'rgba(244,161,29,0.60)' }}>06</span>
        <span>12</span>
        <span style={{ color: 'rgba(139,180,248,0.60)' }}>18</span>
        <span>23</span>
      </div>
    </div>
  );
}

/* ── Rating bar widget (interactive) ────────────────────────────────── */
const STEP_EMOJI = ['💤', '😐', '👌', '✨', '🎉'];
const STEP_LABEL = ['blame', 'meh', 'okay', 'nice', 'cheers'];
const STEP_COLOR_TEXT = [
  'rgba(200,80,80,0.7)',
  'rgba(233,231,242,0.45)',
  'rgba(233,231,242,0.70)',
  '#20C5A0',
  '#F4A11D',
];

function RatingBar({ rating, userRating, onRate }: {
  rating: DayRating;
  userRating: number | null;   // 1-5 or null
  onRate?: (value: number) => void;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  // active = user-submitted rating if exists, else auto-calculated
  const activeIdx = userRating !== null ? userRating - 1 : RATING_STEPS.indexOf(rating.label);
  const isUserRated = userRating !== null;
  const displayIdx = hoverIdx !== null ? hoverIdx : activeIdx;
  const interactive = !!onRate;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 10px', borderRadius: 6,
      background: isUserRated ? 'rgba(244,161,29,0.04)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isUserRated ? 'rgba(244,161,29,0.15)' : 'rgba(244,161,29,0.06)'}`,
    }}>
      <span style={{ fontSize: 10, color: C.textDim, fontFamily: FONT, flexShrink: 0 }}>
        {isUserRated ? 'Rated' : 'Rate'}
      </span>
      <div style={{ display: 'flex', gap: 2, flex: 1 }}
        onMouseLeave={() => interactive && setHoverIdx(null)}>
        {RATING_STEPS.map((lvl, i) => (
          <div
            key={lvl}
            onMouseEnter={() => interactive && setHoverIdx(i)}
            onClick={(e) => {
              e.stopPropagation();
              onRate?.(i + 1);
            }}
            title={interactive ? `${STEP_LABEL[i]} (${i + 1}/5)` : undefined}
            style={{
              flex: 1, height: interactive ? 10 : 4, borderRadius: 2,
              background: i <= displayIdx ? STEP_FILL[i] : 'rgba(255,255,255,0.05)',
              transition: 'background 0.2s, height 0.2s',
              cursor: interactive ? 'pointer' : 'default',
              position: 'relative',
            }}
          />
        ))}
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: STEP_COLOR_TEXT[displayIdx] ?? rating.color,
        fontFamily: FONT, flexShrink: 0,
      }}>
        {STEP_EMOJI[displayIdx]} {STEP_LABEL[displayIdx]}
      </span>
    </div>
  );
}

/* ── Zoom-in expander (inline popover panel) ───────────────────────── */
function DayExpander({ day, nowHour, onClose, userRating, onRate }: {
  day: DayGroup; nowHour: number; onClose: () => void;
  userRating: number | null; onRate?: (v: number) => void;
}) {
  const top6 = [...day.allWindows].sort((a, b) => b.score - a.score).slice(0, 6);
  const rating = getDayRating(day.avgScore);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        padding: '10px 14px 16px',
        borderTop: `1px solid ${C.border}`,
        background: C.panelBg,
        fontFamily: FONT,
      }}>
        {/* Header row with close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.gold }}>
            {day.isToday ? "Today's Detail" : `${day.dayName} ${day.dateLabel}`}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: C.textDim, display: 'flex', alignItems: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Enlarged bar chart */}
        <DayBars windows={day.allWindows} height={72} dim={false} nowHour={nowHour} isToday={day.isToday} />

        {/* Day rating bar — interactive */}
        <div style={{ marginTop: 10, marginBottom: 10 }}>
          <RatingBar rating={rating} userRating={userRating} onRate={onRate} />
        </div>

        {/* Top windows — pill chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {top6.map((w, i) => {
            const actColor = ACTIVITY_COLOR[w.activity];
            const peak = i === 0;
            const past = day.isToday && w.hour < nowHour;
            const isNow = day.isToday && w.hour === nowHour;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 9px', borderRadius: 14,
                border: `1px solid ${peak ? C.borderPeak : C.border}`,
                opacity: past ? 0.3 : 1,
                transition: 'opacity 0.3s',
                fontFamily: FONT,
              }}>
                {peak && <Zap size={9} color={C.gold} />}
                {isNow && (
                  <span style={{ fontSize: 7, fontWeight: 700, color: C.gold, letterSpacing: '0.06em', background: 'rgba(244,161,29,0.12)', padding: '1px 4px', borderRadius: 3 }}>NOW</span>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: peak ? C.gold : C.text }}>
                  {fmt24(w.hour)}
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: actColor }}>
                  {w.activity === 'social_media' ? 'social' : w.activity}
                </span>
                <span style={{ fontSize: 10, color: C.textDim }}>{w.horaRuler}</span>
                <span style={{ fontSize: 11, color: C.gold, fontWeight: 700 }}>{w.score}</span>
                {/* Extra transit tag */}
                {w.planets.length > 0 && (
                  <span style={{
                    fontSize: 8, color: C.emerald, fontWeight: 500,
                    background: 'rgba(32,197,160,0.08)',
                    padding: '1px 5px', borderRadius: 3, maxWidth: 90,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {w.planets[0]}
                  </span>
                )}
                {w.isMorning && !past && <span style={{ fontSize: 9 }}>☀</span>}
              </div>
            );
          })}
        </div>

        {/* Transit signals summary */}
        {(() => {
          const allSignals = day.allWindows.flatMap(w => w.planets).filter(Boolean);
          const unique = [...new Set(allSignals)].slice(0, 5);
          if (unique.length === 0) return null;
          return (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontSize: 9, color: C.textDim, fontFamily: FONT, alignSelf: 'center', marginRight: 2 }}>Transits</span>
              {unique.map((s, i) => (
                <span key={i} style={{
                  fontSize: 9, color: C.textMid, fontFamily: FONT,
                  background: 'rgba(255,255,255,0.04)',
                  padding: '2px 7px', borderRadius: 3,
                  border: `1px solid ${C.border}`,
                }}>
                  {s}
                </span>
              ))}
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}

/* ── Main component ────────────────────────────────────────────────── */
export function WeeklyView({ windows, unlockedDays = 3, onUnlock, user, selectedService = 'yoga' }: WeeklyViewProps) {
  const now = new Date();
  const todayStr = now.toDateString();
  const nowHour = now.getHours();

  /* ── User ratings state (dateKey → value 1-5) ── */
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  const dayGroups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, HourWindow[]>();
    for (const w of windows) {
      const k = w.date.toDateString();
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(w);
    }
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    let unlocked = 0;
    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .filter(([dateStr]) => { const d = new Date(dateStr); d.setHours(0, 0, 0, 0); return d >= todayStart; })
      .map(([dateStr, wins]) => {
        const d = new Date(dateStr);
        const sorted = [...wins].sort((a, b) => a.hour - b.hour);
        const peak = sorted.reduce<HourWindow | null>((b, w) => (!b || w.score > b.score) ? w : b, null);
        const avg = sorted.length > 0 ? Math.round(sorted.reduce((s, w) => s + w.score, 0) / sorted.length) : 0;
        const locked = unlocked >= unlockedDays;
        if (!locked) unlocked++;
        const activeWindows = sorted.filter(w => w.score >= 20);
        const startHour = activeWindows.length > 0 ? activeWindows[0].hour : 6;
        const endHour = activeWindows.length > 0 ? activeWindows[activeWindows.length - 1].hour : 22;
        return {
          dayDate: d, dayName: DAY_SHORT[d.getDay()],
          dateLabel: `${MON_SHORT[d.getMonth()]} ${d.getDate()}`,
          allWindows: sorted, peakScore: peak?.score ?? 0, peakHour: peak?.hour ?? 0,
          avgScore: avg, locked, isToday: dateStr === todayStr,
          startHour, endHour,
        };
      });
  }, [windows, unlockedDays, todayStr]);

  const todayIdx = dayGroups.findIndex(d => d.isToday);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(todayIdx >= 0 ? todayIdx : null);
  const toggleExpand = (i: number) => setExpandedIdx(p => p === i ? null : i);

  /* ── Fetch existing user ratings for this week ── */
  useEffect(() => {
    if (!user) return;
    const dates = dayGroups.map(d => {
      const dd = d.dayDate;
      return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
    }).join(',');
    if (!dates) return;

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/day-ratings/week?dates=${dates}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        // data is Record<date, DayRatingEntry> or Record<date, { userRating }>
        const map: Record<string, number> = {};
        for (const [date, entry] of Object.entries(data)) {
          const e = entry as { userRating?: number; user_rating?: number };
          const v = e.userRating ?? e.user_rating;
          if (typeof v === 'number') map[date] = v;
        }
        setUserRatings(prev => ({ ...prev, ...map }));
      } catch { /* silently ignore */ }
    })();
  }, [user, dayGroups]);

  /* ── Submit rating to server ── */
  const submitRating = useCallback(async (day: DayGroup, value: number) => {
    const dd = day.dayDate;
    const dateStr = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;

    // Optimistic update
    setUserRatings(prev => ({ ...prev, [dateStr]: value }));

    if (!user) return;
    try {
      const token = await user.getIdToken();
      const predictionGrid = day.allWindows.map(w => ({
        hour: w.hour, score: w.score, activity: w.activity,
        horaRuler: w.horaRuler, planets: w.planets,
      }));
      await fetch('/api/day-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: dateStr,
          service: selectedService,
          predictedAvg: day.avgScore,
          predictedPeak: day.peakScore,
          userRating: value,
          predictionGrid,
        }),
      });
    } catch { /* rating already applied optimistically */ }
  }, [user, selectedService]);

  /* Top-3 for header strip */
  const top3 = useMemo(() =>
    dayGroups.filter(d => !d.locked).flatMap(d => d.allWindows)
      .sort((a, b) => b.score - a.score).slice(0, 3),
    [dayGroups]);

  const rankLabel = ['Peak this week', '2nd best', '3rd best'];

  return (
    <div style={{ fontFamily: FONT, color: C.text }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold }}>
          This Week
        </div>
        <div style={{ fontSize: 10, color: C.textDim }}>☀ dawn · 🌙 dusk</div>
      </div>

      {/* Top-3 strip */}
      {top3.length > 0 && (
        <div style={{ display: 'flex', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 12 }}>
          {top3.map((w, i) => {
            const actColor = ACTIVITY_COLOR[w.activity];
            const past = w.date.toDateString() === todayStr && w.hour < nowHour;
            return (
              <div key={i} style={{
                flex: 1, padding: '10px 12px',
                borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                opacity: past ? 0.3 : 1, transition: 'opacity 0.3s',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.gold, opacity: 0.60, marginBottom: 3 }}>{rankLabel[i]}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 2 }}>{fmt24(w.hour)}</div>
                <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>{DAY_SHORT[w.date.getDay()]} · {w.horaRuler} · <span style={{ color: C.gold, fontWeight: 700 }}>{w.score}</span></div>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: actColor }}>{w.activity === 'social_media' ? 'social' : w.activity}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Unlocked day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {dayGroups.map((day, idx) => {
          if (day.locked) return null;
          const isExpanded = expandedIdx === idx;
          const autoRating = getDayRating(day.avgScore);
          const dd = day.dayDate;
          const dateKey = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
          const savedRating = userRatings[dateKey] ?? null;
          const displayRating = savedRating !== null
            ? { label: STEP_LABEL[savedRating - 1], emoji: STEP_EMOJI[savedRating - 1], color: STEP_COLOR_TEXT[savedRating - 1] }
            : autoRating;

          return (
            <div key={idx} style={{
              border: `1px solid ${day.isToday ? C.borderPeak : C.border}`,
              borderRadius: 10, overflow: 'hidden', position: 'relative',
            }}>
              <div
                onClick={() => toggleExpand(idx)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '74px 1fr 56px 18px',
                  alignItems: 'center',
                  gap: 10, padding: '10px 14px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: day.isToday ? C.gold : C.textMid, lineHeight: 1.2,
                  }}>
                    {day.isToday ? '● Today' : day.dayName}
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.3 }}>
                    {day.dateLabel}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: C.gold, lineHeight: 1 }}>
                      {day.peakScore}
                    </span>
                    <span style={{ fontSize: 9, color: C.textDim }}>{fmt24(day.peakHour)}</span>
                  </div>
                  <div style={{ fontSize: 8, color: C.textDim, marginTop: 2, letterSpacing: '0.02em' }}>
                    {String(day.startHour).padStart(2,'0')}–{String(day.endHour).padStart(2,'0')}
                  </div>
                </div>
                <DayBars windows={day.allWindows} height={26} dim={false} nowHour={nowHour} isToday={day.isToday} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, lineHeight: 1 }}>{displayRating.emoji}</div>
                  <div style={{
                    fontSize: 9, fontWeight: 600, color: displayRating.color,
                    letterSpacing: '0.04em', marginTop: 2,
                  }}>
                    {displayRating.label}
                  </div>
                  {savedRating !== null && (
                    <div style={{ fontSize: 7, color: C.textDim, marginTop: 1 }}>✓ rated</div>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronDown size={14} color={C.textDim} />
                </motion.div>
              </div>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <DayExpander
                    day={day}
                    nowHour={nowHour}
                    onClose={() => setExpandedIdx(null)}
                    userRating={savedRating}
                    onRate={(v) => submitRating(day, v)}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Locked day rows — full width with CTA strip above */}
      {unlockedDays < 90 && (
        <div style={{ marginTop: 5, fontFamily: FONT }}>

          {/* Two CTA flexboxes above locked area */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {/* CTA 1: Free rolling */}
            <div style={{
              flex: 1,
              border: `1px solid rgba(32,197,160,0.20)`,
              borderRadius: 10,
              padding: '10px 14px',
              background: 'rgba(32,197,160,0.04)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🌟</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.emerald, letterSpacing: '0.03em' }}>
                  3-Day Rolling Preview Unlocked
                </div>
                <div style={{ fontSize: 10, color: C.textMid, marginTop: 2 }}>
                  Visit again tomorrow — enjoy fresh results for free.
                </div>
              </div>
            </div>
            {/* CTA 2: Unlock */}
            <div
              onClick={onUnlock}
              style={{
                flex: 1,
                border: `1px solid ${C.borderPeak}`,
                borderRadius: 10,
                padding: '10px 14px',
                background: 'linear-gradient(135deg, rgba(244,161,29,0.06) 0%, rgba(244,161,29,0.02) 100%)',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}>
              <Lock size={18} color={C.gold} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, letterSpacing: '0.03em' }}>
                  Unlock Your Golden Hours
                </div>
                <div style={{ fontSize: 10, color: C.textMid, marginTop: 2 }}>
                  Up to 90 days of precise timing.
                </div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 16, color: C.gold }}>→</span>
            </div>
          </div>

          {/* Full-width locked day rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {dayGroups.map((day, idx) => {
              if (!day.locked) return null;
              const autoRating = getDayRating(day.avgScore);
              const dd = day.dayDate;
              const dateKey = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
              const savedRating = userRatings[dateKey] ?? null;
              const displayRating = savedRating !== null
                ? { label: STEP_LABEL[savedRating - 1], emoji: STEP_EMOJI[savedRating - 1], color: STEP_COLOR_TEXT[savedRating - 1] }
                : autoRating;

              return (
                <div key={idx} style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: 10, overflow: 'hidden', position: 'relative',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '74px 1fr 56px 18px',
                    alignItems: 'center',
                    gap: 10, padding: '10px 14px',
                    cursor: 'default', userSelect: 'none',
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: C.textMid, lineHeight: 1.2,
                      }}>
                        {day.dayName}
                      </div>
                      <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.3 }}>
                        {day.dateLabel}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: C.textDim, lineHeight: 1 }}>
                          {day.peakScore}
                        </span>
                        <span style={{ fontSize: 9, color: C.textDim }}>{fmt24(day.peakHour)}</span>
                      </div>
                      <div style={{ fontSize: 8, color: C.textDim, marginTop: 2, letterSpacing: '0.02em' }}>
                        {String(day.startHour).padStart(2,'0')}–{String(day.endHour).padStart(2,'0')}
                      </div>
                    </div>
                    <DayBars windows={day.allWindows} height={26} dim={true} nowHour={nowHour} isToday={false} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, lineHeight: 1 }}>{displayRating.emoji}</div>
                      <div style={{
                        fontSize: 9, fontWeight: 600, color: displayRating.color,
                        letterSpacing: '0.04em', marginTop: 2,
                      }}>
                        {displayRating.label}
                      </div>
                    </div>
                    <span />
                  </div>
                  {/* Lock overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(6,6,15,0.50)',
                    backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
                    display: 'flex', alignItems: 'center',
                    paddingLeft: 18,
                    zIndex: 3, cursor: 'pointer',
                  }} onClick={onUnlock}>
                    <Lock size={28} color={C.goldDim} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status footer */}
      <div style={{ marginTop: 12, fontSize: 10, color: C.textDim, textAlign: 'center', lineHeight: 1.6 }}>
        {unlockedDays >= 90
          ? '✦ Full 90-day access active'
          : `Free preview · ${unlockedDays} days unlocked`
        }
      </div>
    </div>
  );
}
