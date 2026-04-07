/**
 * Shared types for the free-cards section on /app.
 */
import type { ServiceId } from '../../types';

export interface SwotServiceSummary {
  id: ServiceId;
  name: string;
  icon: string;
  avgScore: number;
  peakCount: number;
  weakCount: number;
  /** Best day label  e.g. "Apr 8" */
  bestDay: string;
  /** Best hour 0-23 */
  bestHour: number;
  /** Best score in the 7-day window */
  bestScore: number;
  /** rising | falling | stable */
  trend: 'rising' | 'falling' | 'stable';
  /** Dominant hora ruler in peak windows */
  dominantPlanet: string;
  /** Average score during morning hours 4-9 AM */
  morningAvg: number;
  /** Average score during evening hours 18-22 */
  eveningAvg: number;
}

export interface SwotItem {
  title: string;
  detail: string;
  icon: string;
}

export interface SwotMatrix {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
}

export interface TodayWindowSlot {
  hour: number;
  score: number;
  horaRuler: string;
  activity: string;
}

export interface FreeCardsData {
  /** Top golden hour window for today */
  goldenHour: {
    score: number;
    hour: number;
    horaRuler: string;
    serviceName: string;
    serviceIcon: string;
    activity: string;
  } | null;
  /** Full 24-hour windows for today (for the day chart) */
  todayWindows: TodayWindowSlot[];
  /** 8-service SWOT summaries sorted best→worst */
  swotServices: SwotServiceSummary[];
  /** Pre-computed SWOT matrix with prose insights */
  swotMatrix: SwotMatrix | null;
  /** User display name (optional) */
  userName?: string;
  /** Selected service id */
  selectedService: ServiceId;
  /** Is user authenticated? */
  isAuthed?: boolean;
  /** Total remaining golden hours today (for teaser) */
  remainingGoldenHours?: number;
}
