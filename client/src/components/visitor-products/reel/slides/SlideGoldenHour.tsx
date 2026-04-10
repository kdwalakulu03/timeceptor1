import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { getWeeklyWindows } from '../../../../lib/scoring';

const AVATAR_URL = '/ProfileUnavailable.jpg';
import type { HourWindow } from '../../../../types';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function scoreColor(s: number, dim = false): string {
  const a = dim ? 0.25 : 1;
  if (s >= 82) return `rgba(244,161,29,${a})`;
  if (s >= 62) return `rgba(32,197,160,${a})`;
  if (s >= 38) return `rgba(100,110,180,${a})`;
  return `rgba(65,72,120,${a})`;
}

/** Mini 24-bar chart — adapted from WeeklyView */
function MiniBar({ windows, dim }: { windows: HourWindow[]; dim: boolean }) {
  const slots = Array.from({ length: 24 }, (_, h) =>
    windows.find(w => w.hour === h) ?? { hour: h, score: 0 } as HourWindow,
  );
  const dayMax = Math.max(...slots.map(s => s.score), 1);

  // Percentile colour: top bar = gold, next 3 = emerald, rest indigo
  const sorted = [...slots].sort((a, b) => b.score - a.score);
  const rankMap = new Map(sorted.map((s, i) => [s.hour, i]));

  function barColor(hour: number): string {
    if (dim) return 'rgba(100,110,180,0.18)';
    const rank = rankMap.get(hour) ?? 99;
    if (rank === 0)   return 'rgba(244,161,29,1)';
    if (rank <= 3)    return 'rgba(32,197,160,0.9)';
    if (rank <= 12)   return 'rgba(100,115,200,0.8)';
    return 'rgba(65,72,120,0.6)';
  }

  return (
    <div className="flex items-end gap-[1px] h-7 flex-1">
      {slots.map((w, i) => {
        const norm = 0.15 + (w.score / dayMax) * 0.85;
        return (
          <div
            key={i}
            className="flex-1 rounded-[1px] transition-all duration-300"
            style={{
              height: `${norm * 100}%`,
              background: barColor(w.hour),
            }}
          />
        );
      })}
    </div>
  );
}

interface SlideGoldenHourProps {
  dob: string;   // "YYYY-MM-DD"
  tob: string;   // "HH:MM"
  lat: number;
  lng: number;
  name: string;
  /** How many days to unlock (rest are locked). Default = 5 */
  unlockedDays?: number;
  recordStep?: number;
  avatarUrl?: string;
}

export function SlideGoldenHour({
  dob, tob, lat, lng, name, unlockedDays = 5, recordStep, avatarUrl,
}: SlideGoldenHourProps) {
  const windows = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return getWeeklyWindows(dob, tob, lat, lng, start, 'yoga', 7);
  }, [dob, tob, lat, lng]);

  // Group by day
  const days = useMemo(() => {
    const map = new Map<string, HourWindow[]>();
    windows.forEach(w => {
      const key = w.date.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    });
    return Array.from(map.entries()).map(([, wins]) => wins).slice(0, 7);
  }, [windows]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowHour = new Date().getHours();

  const rec = recordStep != null;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#030303] overflow-hidden">
      {/* Glow */}
      {!rec && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[260px] h-[160px] rounded-full bg-[#F4A11D]/[0.05] blur-[70px] pointer-events-none" />}

      {/* Header */}
      <div className="relative z-10 pt-5 px-5 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#C1A661]/80 mb-1">
          Golden Hours
        </p>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[18px] text-white/85">1 Week Forecast</h2>
          <div className="flex items-center gap-2">
            <p className="font-serif text-[12px] text-white/70 leading-none truncate max-w-[100px]">{name}</p>
            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#C1A661]/30 bg-[#111] flex-shrink-0">
              <img src={avatarUrl || AVATAR_URL} alt={name} className="w-full h-full object-contain object-top scale-110" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Today at a Glance ── */}
      {days[0] && (!rec || recordStep! >= 1) && (() => {
        const todayWins = days[0];
        const sorted    = [...todayWins].sort((a, b) => b.score - a.score);
        const best      = sorted[0];
        const second    = sorted[1];
        const worst     = sorted[sorted.length - 1];
        const fmt = (h: number) => `${String(h).padStart(2,'0')}:00`;
        return (
          <motion.div
            initial={rec ? false : { opacity:0, y:6 }}
            animate={{ opacity:1, y:0 }}
            transition={rec ? { duration:0 } : { duration:0.5, ease:[0.22,1,0.36,1] }}
            className="relative z-10 mx-4 mb-3 rounded-xl border border-[#F4A11D]/20 bg-[#F4A11D]/[0.04] px-3 py-2.5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#F4A11D]/80 mb-2">Today's Key Times</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label:'Best',    hour:best,   color:'#F4A11D',   icon:'⚡' },
                { label:'2nd Best',hour:second, color:'#20c5a0',   icon:'✦' },
                { label:'Avoid',   hour:worst,  color:'#f87171',   icon:'⚠' },
              ].map(({ label, hour, color, icon }) => (
                <div key={label} className="flex flex-col items-center rounded-lg py-2 px-1"
                  style={{ background:`${color}0d`, border:`1px solid ${color}25` }}>
                  <span className="text-[13px] mb-0.5">{icon}</span>
                  <p className="font-mono text-[10px] uppercase tracking-wide leading-none mb-1" style={{ color:`${color}dd` }}>{label}</p>
                  <p className="font-serif text-[15px] leading-none" style={{ color }}>{fmt(hour.hour)}</p>
                  <p className="font-mono text-[11px] mt-0.5" style={{ color:`${color}99` }}>{hour.score}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Day rows */}
      <div className="relative z-10 flex-1 px-4 pb-4 flex flex-col gap-2 overflow-hidden">
        {days.map((dayWindows, idx) => {
          const dayDate = dayWindows[0].date;
          const isToday = dayDate.toDateString() === today.toDateString();
          const isLocked = idx >= unlockedDays;
          const peakScore = Math.max(...dayWindows.map(w => w.score));
          const peakHour = dayWindows.find(w => w.score === peakScore)?.hour ?? 0;

          const dayName = DAY_SHORT[dayDate.getDay()];
          const dateLabel = `${MON_SHORT[dayDate.getMonth()]} ${dayDate.getDate()}`;

          return (
            rec && recordStep! < 2 + idx ? null :
            <motion.div
              key={idx}
              initial={rec ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={rec ? { duration: 0 } : { delay: idx * 0.06, duration: 0.45 }}
              className={`relative flex items-center gap-3 rounded-xl border px-3 py-2.5 overflow-hidden ${
                isToday
                  ? 'border-[#F4A11D]/25 bg-[#F4A11D]/[0.04]'
                  : isLocked
                    ? 'border-white/[0.05] bg-white/[0.01]'
                    : 'border-white/[0.07] bg-white/[0.02]'
              }`}
            >
              {/* Locked blur overlay */}
              {isLocked && (
                <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-xl ${rec ? 'bg-[#030303]/85' : 'backdrop-blur-[3px] bg-[#030303]/50'}`}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C1A661]/20 bg-[#030303]/60">
                    <Lock size={9} className="text-[#C1A661]/60" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C1A661]/60">
                      Unlock
                    </span>
                  </div>
                </div>
              )}

              {/* Date column */}
              <div className="w-10 flex-shrink-0">
                <p className={`font-mono text-[10px] uppercase tracking-wider ${isToday ? 'text-[#F4A11D]' : 'text-white/55'}`}>
                  {dayName}
                </p>
                <p className={`font-mono text-[10px] ${isToday ? 'text-[#F4A11D]/80' : 'text-white/50'}`}>
                  {dateLabel.split(' ')[1]}
                </p>
              </div>

              {/* Bars */}
              <MiniBar windows={dayWindows} dim={isLocked} />

              {/* Peak score */}
              <div className="w-14 flex-shrink-0 text-right">
                <p
                  className="font-mono text-sm font-bold leading-none"
                  style={{ color: isLocked ? 'rgba(255,255,255,0.15)' : scoreColor(peakScore) }}
                >
                  {peakScore}
                </p>
                <p className="font-mono text-[10px] text-white/50 mt-0.5">
                  {String(peakHour).padStart(2, '0')}:00
                </p>
              </div>

              {/* Today needle */}
              {isToday && !isLocked && (
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#F4A11D] shadow-[0_0_6px_2px_rgba(244,161,29,0.4)] pointer-events-none"
                  style={{ left: `${52 + ((nowHour + 0.5) / 24) * 100 * 0.5}px` }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Unlock CTA */}
      <div className="relative z-10 px-5 pb-6 pt-1">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-[#C1A661]/15 bg-[#C1A661]/[0.04]">
          <div className="flex items-center gap-2">
            <Lock size={11} className="text-[#C1A661]/70" />
            <span className="font-mono text-[11px] text-white/60 uppercase tracking-widest">
              Last 2 days locked
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#C1A661]/90 uppercase tracking-wider">
            visit timeceptor.com →
          </span>
        </div>
      </div>
    </div>
  );
}

/** 0=header, 1=today card, 2..8=day rows (7 days) → 9 total */
export const GOLDEN_RECORD_STEPS = 9;
export function goldenRecordConfig() {
  return {
    total: 9,
    holdFrames(step: number): number {
      if (step === 0) return 6;
      if (step === 1) return 12;   // today card 0.5s
      return 2;                    // day rows stagger 0.06s
    },
  };
}
