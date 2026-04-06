/**
 * Plan computation — finds the best daily windows for each phase of a Life Plan.
 *
 * All computation is client-side via getWeeklyWindows().
 */
import { getWeeklyWindows, getWeekStart } from '../../../lib/scoring';
import type { HourWindow } from '../../../types';
import type { LifePlan, PlanPhase } from '../data/plans';

export interface PhaseWindow {
  phase: PlanPhase;
  /** Best window today for this phase's service */
  bestWindow: HourWindow | null;
  /** Top-3 windows today (sorted desc by score) */
  topWindows: HourWindow[];
}

export interface PlanDayResult {
  date: string; // ISO yyyy-mm-dd
  phases: PhaseWindow[];
  /** Combined average score across phases (0-100) */
  avgScore: number;
}

/**
 * Compute a 7-day plan schedule.
 * Returns one PlanDayResult per day with the best windows for each phase.
 */
export function computePlanSchedule(
  plan: LifePlan,
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number,
): PlanDayResult[] {
  const days = 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: PlanDayResult[] = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const startDate = dateStr;

    const phaseResults: PhaseWindow[] = plan.phases.map((phase) => {
      const startDateObj = new Date(dateStr + 'T00:00:00');
      const windows = getWeeklyWindows(
        birthDate, birthTime, lat, lng, startDateObj, phase.service, 1,
      );

      // Filter to only windows on this specific date
      const dayWindows = windows.filter((w) => {
        return w.date.toISOString().split('T')[0] === dateStr;
      });

      // Sort by score descending
      const sorted = [...dayWindows].sort((a, b) => b.score - a.score);

      return {
        phase,
        bestWindow: sorted[0] ?? null,
        topWindows: sorted.slice(0, 3),
      };
    });

    const scores = phaseResults.filter(p => p.bestWindow).map(p => p.bestWindow!.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    results.push({ date: dateStr, phases: phaseResults, avgScore });
  }

  return results;
}

/**
 * Return today's optimal timeline for a plan — phases ordered by their best window time.
 */
export function getTodayTimeline(schedule: PlanDayResult[]): PhaseWindow[] {
  if (schedule.length === 0) return [];
  const today = schedule[0];
  return [...today.phases]
    .filter(p => p.bestWindow)
    .sort((a, b) => a.bestWindow!.hour - b.bestWindow!.hour);
}
