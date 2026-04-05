
import { Planet } from './types';

export const PLANETS: Planet[] = [
  { 
    name: 'Sun',     
    symbol: '☀️', 
    type: 'power',   
    yoga: 'Dynamic yoga & Surya Namaskar',        
    desc: 'Solar energy peaks — ideal for dynamic morning flows and sun salutations. Your vitality is amplified.',
    color: '#c9a84c'
  },
  { 
    name: 'Moon',    
    symbol: '🌙', 
    type: 'gentle',  
    yoga: 'Yin, restorative & gentle flow',        
    desc: 'The Moon governs your body\'s fluid rhythms. Perfect for slow, restorative practice or bedtime stretching.',
    color: '#8ab4d4'
  },
  { 
    name: 'Mars',    
    symbol: '♂️', 
    type: 'power',   
    yoga: 'Power yoga, vinyasa & strength',        
    desc: 'Mars hora ignites physical fire. Harness this energy for challenging flows, inversions, and muscle building.',
    color: '#c45c5c'
  },
  { 
    name: 'Mercury', 
    symbol: '☿',  
    type: 'balance', 
    yoga: 'Balance poses & mindful flow',          
    desc: 'Mercury brings coordination and mental clarity. Excellent for precision poses, tree pose, and breathwork.',
    color: '#6dc89a'
  },
  { 
    name: 'Jupiter', 
    symbol: '♃',  
    type: 'balance', 
    yoga: 'Pranayama, meditation & heart yoga',    
    desc: 'The great benefic expands your breath and spirit. Ideal for pranayama, meditation, and heart-opening backbends.',
    color: '#e8c97a'
  },
  { 
    name: 'Venus',   
    symbol: '♀️', 
    type: 'gentle',  
    yoga: 'Slow flow, hip openers & heart poses',  
    desc: 'Venus brings grace and ease to the body. Beautiful for slow, aesthetic flows, hip openers, and floor poses.',
    color: '#f2ead8'
  },
  { 
    name: 'Saturn',  
    symbol: '♄',  
    type: 'avoid',   
    yoga: 'Rest, walk or skip practice',           
    desc: 'Saturn constricts energy — the body resists effort. Best to rest, take a gentle walk, or do simple stretching only.',
    color: '#4a4a4a'
  },
];

/**
 * Chaldean Order of Planets (Slowest to Fastest):
 * Saturn (6), Jupiter (4), Mars (2), Sun (0), Venus (5), Mercury (3), Moon (1)
 * 
 * The sequence of hours follows this order in reverse.
 */
export const CHALDEAN_HOUR_SEQUENCE = [6, 4, 2, 0, 5, 3, 1];

/**
 * Planetary Friendships (Vedic Astrology - Simplified)
 * Used to personalize the "Best" window based on birth day.
 */
export const PLANETARY_FRIENDS: Record<number, number[]> = {
  0: [1, 2, 4],    // Sun: Moon, Mars, Jupiter
  1: [0, 3],       // Moon: Sun, Mercury
  2: [0, 1, 4],    // Mars: Sun, Moon, Jupiter
  3: [0, 5],       // Mercury: Sun, Venus
  4: [0, 1, 2],    // Jupiter: Sun, Moon, Mars
  5: [3, 6],       // Venus: Mercury, Saturn
  6: [3, 5],       // Saturn: Mercury, Venus
};
