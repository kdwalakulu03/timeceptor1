/**
 * Decision Engine — core scoring utility.
 *
 * All computation is CLIENT-SIDE using the existing getWeeklyWindows() engine.
 * Zero backend calls, zero server CPU.
 *
 * Given a service + birth data:
 *   1. Compute the current hour's score
 *   2. Scan forward up to 48h to find the next better window
 *   3. Build a human-readable explanation
 */
import { getWeeklyWindows } from '../../../lib/scoring';
import type { HourWindow, ServiceId } from '../../../types';
import { SERVICES } from '../../../services';
import { PLANET_SERVICE_DATA } from '../../../services';

export interface DecisionResult {
  currentScore: number;
  currentHoraRuler: string;
  currentActivity: string;
  currentDesc: string;
  verdict: 'go' | 'wait' | 'caution';
  verdictLabel: string;
  verdictDetail: string;
  nextBetter: {
    date: Date;
    hour: number;
    score: number;
    horaRuler: string;
    hoursFromNow: number;
    label: string;      // "Tomorrow 7 PM", "Today 3 PM", etc.
  } | null;
  todayWindows: HourWindow[];  // Remaining windows today sorted by score
}

/**
 * Run the decision engine for a given moment.
 * Scans 3 days (72h) of windows, finds current score + next better time.
 */
export function computeDecision(
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number,
  service: ServiceId,
): DecisionResult {
  const now = new Date();
  const currentHour = now.getHours();

  // Compute 3 days of windows starting today
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const windows = getWeeklyWindows(birthDate, birthTime, lat, lng, startDate, service, 3);

  // Find current hour's window
  const todayStr = now.toDateString();
  const currentWindow = windows.find(w => {
    const wDate = new Date(w.date);
    return wDate.toDateString() === todayStr && w.hour === currentHour;
  }) ?? windows[0];

  // Get planet description for this hora ruler + service
  const svcData = PLANET_SERVICE_DATA[currentWindow.horaRuler]?.[service];
  const currentActivity = svcData?.activity ?? 'General activity';
  const currentDesc = svcData?.desc ?? '';

  // Determine verdict
  const score = currentWindow.score;
  let verdict: DecisionResult['verdict'];
  let verdictLabel: string;
  let verdictDetail: string;

  if (score >= 62) {
    verdict = 'go';
    verdictLabel = 'Go for it!';
    verdictDetail = `This is a golden window — planetary energy strongly supports ${SERVICES.find(s => s.id === service)?.name.toLowerCase() ?? 'this activity'} right now. Score: ${score}/100.`;
  } else if (score >= 40) {
    verdict = 'caution';
    verdictLabel = 'Acceptable, not ideal';
    verdictDetail = `Moderate planetary support. You can proceed, but a stronger window is coming. Score: ${score}/100.`;
  } else {
    verdict = 'wait';
    verdictLabel = 'Better to wait';
    verdictDetail = `Planetary energy is low for ${SERVICES.find(s => s.id === service)?.name.toLowerCase() ?? 'this activity'}. A much better window is available soon. Score: ${score}/100.`;
  }

  // Find next better window (score > current AND >= 55, scanning forward from now)
  const threshold = Math.max(score + 10, 55);
  let nextBetter: DecisionResult['nextBetter'] = null;

  for (const w of windows) {
    const wDate = new Date(w.date);
    wDate.setHours(w.hour);

    // Must be in the future
    if (wDate <= now) continue;
    if (w.score < threshold) continue;

    const hoursFromNow = Math.round((wDate.getTime() - now.getTime()) / 3600000);
    nextBetter = {
      date: wDate,
      hour: w.hour,
      score: w.score,
      horaRuler: w.horaRuler,
      hoursFromNow,
      label: formatFutureTime(wDate, now),
    };
    break;
  }

  // If no better window found with threshold, find the absolute best remaining
  if (!nextBetter) {
    const futureWindows = windows.filter(w => {
      const wDate = new Date(w.date);
      wDate.setHours(w.hour);
      return wDate > now;
    });
    if (futureWindows.length > 0) {
      const best = futureWindows.reduce((a, b) => a.score > b.score ? a : b);
      const bestDate = new Date(best.date);
      bestDate.setHours(best.hour);
      const hoursFromNow = Math.round((bestDate.getTime() - now.getTime()) / 3600000);
      nextBetter = {
        date: bestDate,
        hour: best.hour,
        score: best.score,
        horaRuler: best.horaRuler,
        hoursFromNow,
        label: formatFutureTime(bestDate, now),
      };
    }
  }

  // Today's remaining windows (future only), sorted by score desc
  const todayWindows = windows
    .filter(w => {
      const wDate = new Date(w.date);
      return wDate.toDateString() === todayStr && w.hour > currentHour;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    currentScore: score,
    currentHoraRuler: currentWindow.horaRuler,
    currentActivity,
    currentDesc,
    verdict,
    verdictLabel,
    verdictDetail,
    nextBetter,
    todayWindows,
  };
}

/** Format a future date relative to now: "Today 3 PM", "Tomorrow 7 PM", "Wed 9 AM" */
function formatFutureTime(future: Date, now: Date): string {
  const h = future.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const timeStr = `${h12} ${ampm}`;

  const todayStr = now.toDateString();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  if (future.toDateString() === todayStr) {
    return `Today ${timeStr}`;
  } else if (future.toDateString() === tomorrowDate.toDateString()) {
    return `Tomorrow ${timeStr}`;
  } else {
    const dayName = future.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} ${timeStr}`;
  }
}
