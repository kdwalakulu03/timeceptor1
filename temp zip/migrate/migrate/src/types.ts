/** Shared runtime types for Timeceptor horoscope product */

export type ActivityType =
  | 'physical'
  | 'mental'
  | 'social'
  | 'creative'
  | 'rest'
  | 'social_media';

export interface HourWindow {
  date: Date;       // Start-of-day (00:00:00)
  hour: number;     // 0–23 clock hour
  score: number;    // 0–100
  activity: ActivityType;
  horaRuler: string; // "Mars", "Jupiter", etc.
  planets: string[]; // Contributing transit signals
  isMorning: boolean;
}

export type ServiceId =
  | 'yoga'
  | 'meditation'
  | 'business'
  | 'creative'
  | 'travel'
  | 'love'
  | 'health'
  | 'social_media';
