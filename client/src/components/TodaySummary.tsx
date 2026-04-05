/**
 * TodaySummary — compact "best windows for today" strip.
 * Design: No background fills on cards. Clean borders only.
 */

import React from 'react';
import { motion } from 'motion/react';
import { HourWindow, ActivityType } from '../types';

const C = {
  gold:    '#F4A11D',
  emerald: '#20C5A0',
  text:    '#E9E7F2',
  textDim: 'rgba(233,231,242,0.50)',
  border:  'rgba(255,255,255,0.08)',
} as const;

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  physical:     '#E07060',
  mental:       '#A99AF5',
  social:       '#20C5A0',
  creative:     '#F4A11D',
  rest:         '#7080A0',
  social_media: '#E8567F',
};

function fmt(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function scoreBar(score: number) {
  const pct   = `${score}%`;
  const color = score >= 82 ? C.gold : score >= 62 ? C.emerald : 'rgba(255,255,255,0.12)';
  return (
    <div style={{ marginTop: 8, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: pct, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

interface TodaySummaryProps {
  windows: HourWindow[];
}

export function TodaySummary({ windows }: TodaySummaryProps) {
  const todayStr = new Date().toDateString();
  const nowHour  = new Date().getHours();

  const todayAll = windows
    .filter(w => w.date.toDateString() === todayStr)
    .sort((a, b) => a.hour - b.hour);

  if (todayAll.length === 0) return null;

  const morningUpcoming = todayAll.filter(w => w.isMorning && w.hour >= nowHour);
  const remaining = todayAll.filter(w => w.hour >= nowHour);
  const pool      = remaining.length >= 3 ? remaining : todayAll;
  const top3      = [...pool].sort((a, b) => b.score - a.score).slice(0, 3);

  const morningPassed = morningUpcoming.length === 0;

  const todayDate = todayAll[0].date;
  const dayNames  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monNames  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateLabel = `${dayNames[todayDate.getDay()]} \u00b7 ${monNames[todayDate.getMonth()]} ${todayDate.getDate()}`;

  const labels = ['Peak', '2nd', '3rd'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ marginTop: 34, fontFamily: "'Inter', 'system-ui', sans-serif" }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
        <div style={{ fontFamily: "'Inter', 'system-ui', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold }}>
          Today's Optimal Windows
        </div>
        <div style={{ fontSize: 12, color: C.textDim, letterSpacing: '0.08em' }}>
          {dateLabel}
        </div>
      </div>

      {/* Passed-morning notice */}
      {morningPassed && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 13px', borderRadius: 20,
          border: `1px solid ${C.border}`,
          fontSize: 11, color: C.textDim, letterSpacing: '0.06em', marginBottom: 13,
        }}>
          <span style={{ color: C.gold }}>☀ Morning passed</span>
          <span>· best remaining windows</span>
        </div>
      )}

      {/* Top 3 cards — no background, border only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {top3.map((w, i) => {
          const actColor = ACTIVITY_COLOR[w.activity];
          const isPeak   = i === 0;
          const isMorn   = w.isMorning;
          return (
            <div key={i} style={{
              border: `1px solid ${isPeak ? 'rgba(244,161,29,0.22)' : C.border}`,
              borderRadius: 10,
              padding: '14px 14px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: isPeak ? C.gold : C.textDim }}>
                  {labels[i]}
                </span>
                {isMorn && (
                  <span style={{ fontSize: 9, color: C.emerald, letterSpacing: '0.1em', textTransform: 'uppercase' }}>☀ dawn</span>
                )}
              </div>
              <div style={{ fontFamily: "'Inter', 'system-ui', sans-serif", fontSize: 24, fontWeight: 700, color: isPeak ? C.gold : C.text, lineHeight: 1 }}>
                {fmt(w.hour)}
              </div>
              {scoreBar(w.score)}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: actColor }}>
                  {w.activity}
                </span>
                <span style={{ fontSize: 11, color: C.textDim }}>{w.horaRuler} · <span style={{ color: C.gold, fontWeight: 600 }}>{w.score}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
