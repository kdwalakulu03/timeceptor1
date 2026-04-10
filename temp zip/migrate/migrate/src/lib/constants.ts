/** Planet constants — ported from Timeceptor (Chaldean hora system) */

export type PlanetType = 'power' | 'gentle' | 'balance' | 'avoid';

export interface Planet {
  name: string;
  symbol: string;
  type: PlanetType;
  yoga: string;
  desc: string;
  color: string;
}

export const PLANETS: Planet[] = [
  {
    name: 'Sun', symbol: '☉', type: 'power',
    yoga: 'Dynamic yoga & Surya Namaskar',
    desc: 'Solar energy peaks — vitality, will-power, leadership.',
    color: '#c9a84c',
  },
  {
    name: 'Moon', symbol: '☽', type: 'gentle',
    yoga: 'Yin, restorative & gentle flow',
    desc: 'Fluid rhythms — intuition, emotion, inner tides.',
    color: '#8ab4d4',
  },
  {
    name: 'Mars', symbol: '♂', type: 'power',
    yoga: 'Power yoga, vinyasa & strength',
    desc: 'Physical fire — drive, courage, decisive action.',
    color: '#c45c5c',
  },
  {
    name: 'Mercury', symbol: '☿', type: 'balance',
    yoga: 'Balance poses & mindful flow',
    desc: 'Coordination & clarity — precision, communication.',
    color: '#6dc89a',
  },
  {
    name: 'Jupiter', symbol: '♃', type: 'balance',
    yoga: 'Pranayama, meditation & heart yoga',
    desc: 'Great benefic — expansion, wisdom, abundance.',
    color: '#e8c97a',
  },
  {
    name: 'Venus', symbol: '♀', type: 'gentle',
    yoga: 'Slow flow, hip openers & heart poses',
    desc: 'Grace & beauty — creativity, love, aesthetics.',
    color: '#f2ead8',
  },
  {
    name: 'Saturn', symbol: '♄', type: 'avoid',
    yoga: 'Rest, walk or skip practice',
    desc: 'Constriction — rest, discipline, karmic work.',
    color: '#4a4a4a',
  },
];

/**
 * Chaldean planetary hour sequence — indices into PLANETS array.
 * Slowest → Fastest: Saturn(6), Jupiter(4), Mars(2), Sun(0), Venus(5), Mercury(3), Moon(1)
 */
export const CHALDEAN_HOUR_SEQUENCE = [6, 4, 2, 0, 5, 3, 1];
