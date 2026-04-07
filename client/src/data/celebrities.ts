/**
 * Celebrity demo profiles for product showcase.
 * Birth data sourced from publicly available records (approximate where exact time unknown).
 * These let visitors explore real computed results without signing up.
 */

export interface CelebrityProfile {
  id: string;
  name: string;
  initials: string;
  birthDate: string;   // YYYY-MM-DD
  birthTime: string;   // HH:MM
  lat: number;
  lng: number;
  location: string;
  tagline: string;
  emoji: string;
  service: import('../types').ServiceId;   // which service to showcase
  serviceLabel: string;                     // display label (e.g. "Business")
}

export const CELEBRITIES: CelebrityProfile[] = [
  {
    id: 'elon',
    name: 'Elon Musk',
    initials: 'EM',
    birthDate: '1971-06-28',
    birthTime: '07:30',
    lat: -25.7479,
    lng: 28.2293,
    location: 'Pretoria, Gauteng, South Africa',
    tagline: 'The engine mapped his best hours for strategy, execution & big calls',
    emoji: '🚀',
    service: 'business',
    serviceLabel: 'Business',
  },
  {
    id: 'oprah',
    name: 'Oprah Winfrey',
    initials: 'OW',
    birthDate: '1954-01-29',
    birthTime: '12:00',
    lat: 33.0576,
    lng: -89.5885,
    location: 'Kosciusko, Mississippi, USA',
    tagline: 'Her meditation & wellness windows — calculated from the planets',
    emoji: '🌟',
    service: 'meditation',
    serviceLabel: 'Meditation & Wellness',
  },
  {
    id: 'ronaldo',
    name: 'Cristiano Ronaldo',
    initials: 'CR',
    birthDate: '1985-02-05',
    birthTime: '05:25',
    lat: 32.6669,
    lng: -16.9241,
    location: 'Funchal, Madeira, Portugal',
    tagline: 'His peak training hours — synced to planetary rhythm',
    emoji: '⚽',
    service: 'health',
    serviceLabel: 'Fitness & Health',
  },
];

export function getCelebrity(id: string): CelebrityProfile | undefined {
  return CELEBRITIES.find(c => c.id === id);
}
