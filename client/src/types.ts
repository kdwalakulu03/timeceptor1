
export type PlanetType = 'power' | 'gentle' | 'balance' | 'avoid';

export type ActivityType = 'physical' | 'mental' | 'social' | 'creative' | 'rest' | 'social_media';

export interface HourWindow {
  date: Date;          // Start of the day (00:00:00)
  hour: number;        // Actual clock hour 0–23
  score: number;       // 0–100
  activity: ActivityType;
  horaRuler: string;   // "Mars", "Jupiter", etc.
  planets: string[];   // Contributing transit signals shown in tooltip
  isMorning: boolean;  // 4–9 AM band
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

export interface ServiceDefinition {
  id: ServiceId;
  name: string;
  icon: string;
  tagline: string;
}

export interface Planet {
  name: string;
  symbol: string;
  type: PlanetType;
  yoga: string;
  desc: string;
  color: string;
}

export interface PlanetaryHour {
  hour: number;
  planet: Planet;
}
