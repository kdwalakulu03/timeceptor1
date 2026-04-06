/**
 * Timeceptor Scoring Engine v2 — Vedic Astrology Deep Scoring
 *
 * Signals layered (each adds to a 0–100 composite score):
 *
 *  1. Hora ruler base          — Chaldean planetary hours (planet ↔ activity affinity)
 *  2. Planet dignity           — exalted / own / moolatrikona / debilitated status of hora ruler
 *  3. Nakshatra lord resonance — hora ruler's nakshatra lord alignment with activity
 *  4. Transit Moon aspects     — Moon conjunct/trine/sextile natal points (hourly)
 *  5. Transit Jupiter aspects  — Jupiter conjunct/trine natal Sun (daily)
 *  6. Transit Sun sign         — current solar sign influence on activities
 *  7. Day lord affinity        — planetary day ruler ↔ activity alignment
 *  8. Circadian bonus          — morning / evening awareness windows
 *  9. Green-guarantee          — if no window reaches ≥62 in a week, the best
 *                                window is boosted to 65 so users always see progress
 *
 * All numbers are deterministic: same inputs → same outputs.
 */

import * as Astronomy from 'astronomy-engine';
import { calculateChart, calculateLahiriAyanamsa, getSunrise, getSign } from './astrology';
import { PLANETS, CHALDEAN_HOUR_SEQUENCE } from '../constants';
import { ActivityType, HourWindow, ServiceId } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// § 1. ACTIVITY-SPECIFIC HORA SCORING TABLES
// ═══════════════════════════════════════════════════════════════════════════════
// Each table maps hora ruler → { base score 0-55, primary activity label }.
// Derived from Vedic planetary significations matched to each life domain.
// Max base is 55 so that transit/dignity layers still have headroom to push
// top windows into gold/green territory.

type HoraEntry = { base: number; activity: ActivityType };

const HORA_YOGA: Record<string, HoraEntry> = {
  Mars:    { base: 52, activity: 'physical' },    // Commander of body — peak physical
  Sun:     { base: 48, activity: 'physical' },    // Vitality, will power
  Jupiter: { base: 44, activity: 'mental'   },    // Expansion, breath
  Moon:    { base: 38, activity: 'creative' },    // Fluidity, restorative
  Venus:   { base: 36, activity: 'social'   },    // Grace, aesthetics
  Mercury: { base: 32, activity: 'mental'   },    // Coordination, precision
  Saturn:  { base: 12, activity: 'rest'     },    // Constriction — rest
};

const HORA_MEDITATION: Record<string, HoraEntry> = {
  Jupiter: { base: 55, activity: 'mental'   },    // Great guru, spiritual expansion
  Moon:    { base: 50, activity: 'creative' },    // Inner awareness, nidra
  Saturn:  { base: 44, activity: 'mental'   },    // Vipassana discipline
  Venus:   { base: 40, activity: 'social'   },    // Metta/loving-kindness
  Sun:     { base: 36, activity: 'mental'   },    // Single-point focus
  Mercury: { base: 32, activity: 'mental'   },    // Mindfulness of thoughts
  Mars:    { base: 18, activity: 'physical' },    // Too agitated (breath of fire ok)
};

const HORA_BUSINESS: Record<string, HoraEntry> = {
  Sun:     { base: 54, activity: 'mental'   },    // Authority, leadership
  Jupiter: { base: 50, activity: 'mental'   },    // Expansion, fundraising
  Mercury: { base: 48, activity: 'mental'   },    // Contracts, negotiation
  Mars:    { base: 44, activity: 'physical' },    // Aggressive competitive action
  Venus:   { base: 38, activity: 'social'   },    // Partnerships, branding
  Moon:    { base: 28, activity: 'social'   },    // Public sentiment
  Saturn:  { base: 20, activity: 'rest'     },    // Admin/compliance only
};

const HORA_CREATIVE: Record<string, HoraEntry> = {
  Venus:   { base: 55, activity: 'creative' },   // Aesthetics, beauty, art
  Moon:    { base: 50, activity: 'creative' },    // Imagination, emotion
  Mercury: { base: 46, activity: 'creative' },    // Writing, design, code
  Jupiter: { base: 40, activity: 'mental'   },    // Visionary, storytelling
  Sun:     { base: 36, activity: 'creative' },    // Bold self-expression
  Mars:    { base: 30, activity: 'physical' },    // Rapid prototyping, breaking blocks
  Saturn:  { base: 18, activity: 'rest'     },    // Editing/revision only
};

const HORA_TRAVEL: Record<string, HoraEntry> = {
  Jupiter: { base: 55, activity: 'mental'   },   // Long-distance, pilgrimage
  Sun:     { base: 48, activity: 'physical' },    // Authoritative departures
  Venus:   { base: 44, activity: 'social'   },    // Leisure, cultural tourism
  Moon:    { base: 38, activity: 'social'   },    // Short/intuitive trips
  Mercury: { base: 34, activity: 'mental'   },    // Local/communication travel
  Mars:    { base: 28, activity: 'physical' },    // Adventure, trekking
  Saturn:  { base: 8,  activity: 'rest'     },    // Delays & obstacles — avoid
};

const HORA_LOVE: Record<string, HoraEntry> = {
  Venus:   { base: 55, activity: 'social'   },   // Romance, beauty, pleasure
  Moon:    { base: 50, activity: 'social'   },    // Emotional bonding, intimacy
  Jupiter: { base: 44, activity: 'social'   },    // Commitment, deepening bond
  Sun:     { base: 36, activity: 'social'   },    // Bold declarations
  Mercury: { base: 32, activity: 'social'   },    // Deep conversation
  Mars:    { base: 26, activity: 'physical' },    // Passion (but also conflict)
  Saturn:  { base: 14, activity: 'rest'     },    // Cold — practical care only
};

const HORA_HEALTH: Record<string, HoraEntry> = {
  Sun:     { base: 52, activity: 'physical' },    // Vitality, immunity
  Mars:    { base: 48, activity: 'physical' },    // HIIT, detox, strength
  Jupiter: { base: 42, activity: 'mental'   },    // Ayurvedic, holistic
  Moon:    { base: 38, activity: 'creative' },    // Hydration, lymph, rest
  Venus:   { base: 34, activity: 'social'   },    // Beauty treatments
  Mercury: { base: 30, activity: 'mental'   },    // Mental wellness, breathwork
  Saturn:  { base: 16, activity: 'rest'     },    // Bone care, rest
};

const HORA_SOCIAL_MEDIA: Record<string, HoraEntry> = {
  Mercury: { base: 55, activity: 'social_media' },  // THE communication planet — trends, wit
  Venus:   { base: 50, activity: 'social_media' },  // Aesthetic, lifestyle, visual content
  Sun:     { base: 46, activity: 'social_media' },  // Authority posts, announcements
  Jupiter: { base: 42, activity: 'social_media' },  // Thought leadership, growth
  Moon:    { base: 38, activity: 'social_media' },  // Emotional, relatable content
  Mars:    { base: 32, activity: 'social_media' },  // Provocative, viral, hot takes
  Saturn:  { base: 10, activity: 'social_media' },  // Evergreen/long-form only
};

// Fallback (original behaviour) for yoga or unknown
const HORA_DEFAULT = HORA_YOGA;

const SERVICE_HORA_MAP: Record<ServiceId, Record<string, HoraEntry>> = {
  yoga:         HORA_YOGA,
  meditation:   HORA_MEDITATION,
  business:     HORA_BUSINESS,
  creative:     HORA_CREATIVE,
  travel:       HORA_TRAVEL,
  love:         HORA_LOVE,
  health:       HORA_HEALTH,
  social_media: HORA_SOCIAL_MEDIA,
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 2. VEDIC DIGNITY TABLE (from elder project — planet_calculator.py)
// ═══════════════════════════════════════════════════════════════════════════════
// Dignity of the hora ruler in the TRANSIT sign (where it sits right now).
// Exalted rulers are significantly more powerful; debilitated ones weakened.

interface DignityEntry {
  exalted: string;           // Sign where planet is strongest
  ownSigns: string[];        // Signs the planet rules
  moolatrikona: string;      // Sign of moolatrikona
  debilitated: string;       // Sign where planet is weakest
}

const DIGNITY_TABLE: Record<string, DignityEntry> = {
  Sun:     { exalted: 'Aries',     ownSigns: ['Leo'],                      moolatrikona: 'Leo',         debilitated: 'Libra'     },
  Moon:    { exalted: 'Taurus',    ownSigns: ['Cancer'],                   moolatrikona: 'Taurus',      debilitated: 'Scorpio'   },
  Mars:    { exalted: 'Capricorn', ownSigns: ['Aries', 'Scorpio'],        moolatrikona: 'Aries',       debilitated: 'Cancer'    },
  Mercury: { exalted: 'Virgo',     ownSigns: ['Gemini', 'Virgo'],         moolatrikona: 'Virgo',       debilitated: 'Pisces'    },
  Jupiter: { exalted: 'Cancer',    ownSigns: ['Sagittarius', 'Pisces'],   moolatrikona: 'Sagittarius', debilitated: 'Capricorn' },
  Venus:   { exalted: 'Pisces',    ownSigns: ['Taurus', 'Libra'],         moolatrikona: 'Libra',       debilitated: 'Virgo'     },
  Saturn:  { exalted: 'Libra',     ownSigns: ['Capricorn', 'Aquarius'],   moolatrikona: 'Aquarius',    debilitated: 'Aries'     },
};

function getDignityBoost(planet: string, transitSign: string): number {
  const d = DIGNITY_TABLE[planet];
  if (!d) return 0;
  if (transitSign === d.exalted)                return 10;  // Exalted — strong boost
  if (d.ownSigns.includes(transitSign))         return 6;   // Own sign — good boost
  if (transitSign === d.moolatrikona)            return 5;   // Moolatrikona
  if (transitSign === d.debilitated)             return -8;  // Debilitated — penalty
  return 0; // Neutral
}

// ═══════════════════════════════════════════════════════════════════════════════
// § 3. SIGN LORDSHIP (from elder project)
// ═══════════════════════════════════════════════════════════════════════════════
const SIGN_LORD: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 4. NAKSHATRA SYSTEM (from elder project — 27 nakshatras)
// ═══════════════════════════════════════════════════════════════════════════════
const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

function getNakshatraLord(siderealLong: number): string {
  const idx = Math.floor(((siderealLong % 360) + 360) % 360 / (360 / 27));
  return NAKSHATRA_LORDS[idx] ?? 'Mercury';
}

// Nakshatra lord affinity boost — if the nakshatra lord of the transit Moon
// matches a "positive" planet for the chosen activity
const NAKSHATRA_ACTIVITY_AFFINITY: Record<ServiceId, string[]> = {
  yoga:         ['Mars', 'Sun', 'Jupiter'],
  meditation:   ['Jupiter', 'Moon', 'Saturn', 'Ketu'],
  business:     ['Sun', 'Mercury', 'Jupiter'],
  creative:     ['Venus', 'Moon', 'Mercury'],
  travel:       ['Jupiter', 'Venus', 'Moon'],
  love:         ['Venus', 'Moon', 'Jupiter'],
  health:       ['Sun', 'Mars', 'Jupiter'],
  social_media: ['Mercury', 'Venus', 'Sun', 'Jupiter'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 5. PLANETARY FRIENDSHIPS — full Vedic naisargika maitri (natural)
// ═══════════════════════════════════════════════════════════════════════════════
// From elder project dignity/relationship rules.
const PLANET_FRIENDS: Record<string, string[]> = {
  Sun:     ['Moon', 'Mars', 'Jupiter'],
  Moon:    ['Sun', 'Mercury'],
  Mars:    ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus:   ['Mercury', 'Saturn'],
  Saturn:  ['Mercury', 'Venus'],
};
const PLANET_ENEMIES: Record<string, string[]> = {
  Sun:     ['Venus', 'Saturn'],
  Moon:    ['Rahu', 'Ketu'],
  Mars:    ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus:   ['Sun', 'Moon'],
  Saturn:  ['Sun', 'Moon', 'Mars'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 6. DAY LORD AFFINITY
// ═══════════════════════════════════════════════════════════════════════════════
// When the day lord (e.g. Tuesday=Mars) is friendly to the hora ruler, small bonus.
const DAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function getDayLordBonus(dayOfWeek: number, horaRuler: string): number {
  const dayLord = DAY_LORDS[dayOfWeek];
  if (dayLord === horaRuler) return 4;  // Same planet rules the day AND hour
  if (PLANET_FRIENDS[dayLord]?.includes(horaRuler)) return 2; // Friendly
  if (PLANET_ENEMIES[dayLord]?.includes(horaRuler)) return -2; // Hostile
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// § 7. SERVICE-SPECIFIC TRANSIT TARGETS
// ═══════════════════════════════════════════════════════════════════════════════
// Which natal planet the transit Moon should aspect for maximum boost per service
type NatalTarget = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn';

const SERVICE_NATAL_TARGETS: Record<ServiceId, { primary: NatalTarget; secondary: NatalTarget }> = {
  yoga:         { primary: 'mars',    secondary: 'sun'     },
  meditation:   { primary: 'jupiter', secondary: 'moon'    },
  business:     { primary: 'sun',     secondary: 'mercury' },
  creative:     { primary: 'venus',   secondary: 'moon'    },
  travel:       { primary: 'jupiter', secondary: 'venus'   },
  love:         { primary: 'venus',   secondary: 'moon'    },
  health:       { primary: 'sun',     secondary: 'mars'    },
  social_media: { primary: 'mercury', secondary: 'venus'   },
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 8. HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function angularDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

function getSiderealLong(body: Astronomy.Body, date: Date, lat: number, lng: number, ayanamsa: number): number {
  const time = Astronomy.MakeTime(date);
  const observer = new Astronomy.Observer(lat, lng, 0);
  const equ = Astronomy.Equator(body, time, observer, true, true);
  const ecl = Astronomy.Ecliptic(equ.vec);
  return ((ecl.elon - ayanamsa) % 360 + 360) % 360;
}

// ═══════════════════════════════════════════════════════════════════════════════
// § 8b. BIO-RHYTHMIC CYCLE LAYER (proprietary overlay)
// ═══════════════════════════════════════════════════════════════════════════════
// 5 cycle states (0-4): Eat=0(active), Walk=1(moderate), Rule=2(peak),
//                        Sleep=3(dormant), Dead=4(powerless)
// Determined by: birth nakshatra → cycle bird (0-4),
//   day-of-week grouping, yamam (1 of 5 per half-day), lunar phase.
// Score contribution normalised to ±12 pts on the 0-100 scale.

type BioAct = 0|1|2|3|4;
const BIO_SCORES: Record<BioAct, number> = { 0:12, 1:6, 2:20, 3:-6, 4:-14 };

// Birth Moon nakshatra → cycle bird index (0=V,1=O,2=C,3=R,4=P)
function moonToBird(moonSidLng: number): number {
  const nak = Math.floor(((moonSidLng % 360) + 360) % 360 / (360 / 27)) % 27;
  if (nak < 5) return 0;
  if (nak < 10) return 1;
  if (nak < 15) return 2;
  if (nak < 20) return 3;
  return 4;
}

// Day-of-week grouping (JS getDay: 0=Sun)
function bioDayGroup(dow: number, isNight: boolean): string {
  if (isNight) {
    if (dow === 0 || dow === 2) return 'st';  // Sun,Tue
    if (dow === 3) return 'w';                 // Wed
    if (dow === 4) return 'h';                 // Thu
    if (dow === 5) return 'f';                 // Fri
    return 'ms';                               // Mon,Sat
  }
  if (dow === 0 || dow === 2) return 'st';     // Sun,Tue
  if (dow === 1 || dow === 3) return 'mw';     // Mon,Wed
  if (dow === 4) return 'h';                   // Thu
  if (dow === 5) return 'f';                   // Fri
  return 's';                                  // Sat
}

// Yamam sequences: key = dayGroup, value = [bird0_seq, bird1_seq, ..., bird4_seq]
// Each bird_seq = [yamam1_act, ..., yamam5_act]
// Day sequences
const BD: Record<string, BioAct[][]> = {
  st: [[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3]],
  mw: [[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2]],
  h:  [[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1]],
  f:  [[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0]],
  s:  [[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4]],
};
// Night sequences
const BN: Record<string, BioAct[][]> = {
  st: [[1,0,4,3,2],[4,3,2,1,0],[2,1,0,4,3],[0,4,3,2,1],[3,2,1,0,4]],
  w:  [[4,3,2,1,0],[2,1,0,4,3],[0,4,3,2,1],[3,2,1,0,4],[1,0,4,3,2]],
  h:  [[2,1,0,4,3],[0,4,3,2,1],[3,2,1,0,4],[1,0,4,3,2],[4,3,2,1,0]],
  f:  [[0,4,3,2,1],[3,2,1,0,4],[1,0,4,3,2],[4,3,2,1,0],[2,1,0,4,3]],
  ms: [[3,2,1,0,4],[1,0,4,3,2],[4,3,2,1,0],[2,1,0,4,3],[0,4,3,2,1]],
};

// Sub-period durations per lunar phase (minutes within 144-min yamam)
// Index = BioAct (0=Eat..4=Dead)
const BIO_SUB: Record<string, number[]> = {
  sd: [24,30,48,18,24], // Shukla day
  sn: [30,30,24,24,36], // Shukla night
  kd: [48,36,18,12,30], // Krishna day
  kn: [42,42,18,18,24], // Krishna night
};

// Death / Ruling day tables: bird → JS weekdays (0=Sun)
// Shukla Paksha (waxing)
const S_DEATH: number[][] = [[4,6],[0,5],[1],[2],[3]];       // V,O,C,R,P
const S_RULE:  number[][] = [[0,2],[1,3],[4],[5],[6]];
// Krishna Paksha (waning)
const K_DEATH: number[][] = [[2],[1],[0],[4,6],[3,5]];
const K_RULE:  number[][] = [[5],[4],[3],[0,2],[1,6]];

// Simplified lunar phase (Shukla = waxing)
function isShukla(dt: Date): boolean {
  const phase = Astronomy.MoonPhase(Astronomy.MakeTime(dt));
  return phase < 180; // 0=new→180=full = waxing
}

/**
 * Compute bio-rhythmic cycle score for a given bird + datetime.
 * Returns a value in range ~ -31 to +38, to be normalised.
 */
function bioScore(
  bird: number, dow: number, hour: number, minute: number,
  sunriseH: number, sunsetH: number, shukla: boolean,
): number {
  const totalMin = hour * 60 + minute;
  const srMin = sunriseH * 60;
  const ssMin = sunsetH * 60;
  const dayLen = ssMin - srMin;
  const nightLen = 1440 - dayLen;
  const dayYamam = dayLen / 5;
  const nightYamam = nightLen / 5;

  let yamam: number;
  let isNight: boolean;
  let minuteInYamam: number;

  if (totalMin >= srMin && totalMin < ssMin) {
    isNight = false;
    const elapsed = totalMin - srMin;
    yamam = Math.min(Math.floor(elapsed / dayYamam), 4);
    minuteInYamam = Math.floor(elapsed - yamam * dayYamam);
  } else if (totalMin >= ssMin) {
    isNight = true;
    const elapsed = totalMin - ssMin;
    yamam = Math.min(Math.floor(elapsed / nightYamam), 4);
    minuteInYamam = Math.floor(elapsed - yamam * nightYamam);
  } else {
    isNight = true;
    const elapsed = totalMin + (1440 - ssMin);
    yamam = Math.min(Math.floor(elapsed / nightYamam), 4);
    minuteInYamam = Math.floor(elapsed - yamam * nightYamam);
  }
  minuteInYamam = Math.max(0, Math.min(minuteInYamam, 143));

  // Primary activity for this yamam
  const group = bioDayGroup(dow, isNight);
  const seqTable = isNight ? BN[group] : BD[group];
  if (!seqTable) return 0;
  const primary = seqTable[bird]?.[yamam] as BioAct ?? 0;

  // Sub-period activity
  const subKey = (shukla ? 's' : 'k') + (isNight ? 'n' : 'd');
  const subDur = BIO_SUB[subKey];
  const subOrder: BioAct[] = [];
  for (let i = 0; i < 5; i++) subOrder.push(((primary + i) % 5) as BioAct);

  let elapsed2 = 0;
  let subAct: BioAct = subOrder[4];
  for (const act of subOrder) {
    const d = subDur[act];
    if (elapsed2 + d > minuteInYamam) { subAct = act; break; }
    elapsed2 += d;
  }

  const base = BIO_SCORES[primary];
  const sub = Math.round(BIO_SCORES[subAct] * 0.5);

  // Death/Ruling day bonus
  const deathDays = shukla ? S_DEATH[bird] : K_DEATH[bird];
  const ruleDays = shukla ? S_RULE[bird] : K_RULE[bird];
  let dayBonus = 0;
  if (ruleDays?.includes(dow)) dayBonus = 8;
  else if (deathDays?.includes(dow)) dayBonus = -10;

  return base + sub + dayBonus;
}

/** Normalise raw bio score (-31..+38) → (-12..+12) */
function normaliseBio(raw: number): number {
  return Math.round(((raw + 31) / 69) * 24 - 12);
}

// ═══════════════════════════════════════════════════════════════════════════════
// § 9. MAIN EXPORT — getWeeklyWindows
// ═══════════════════════════════════════════════════════════════════════════════

export function getWeeklyWindows(
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number,
  startDate: Date,
  service: ServiceId = 'yoga',
  days: number = 7,
): HourWindow[] {

  // ── Natal chart — computed once ────────────────────────────────────────
  const birthDateTime = new Date(`${birthDate}T${birthTime}`);
  const natalChart = calculateChart(birthDateTime, lat, lng);
  const ayanamsa = calculateLahiriAyanamsa(startDate);

  // Collect all natal planet longitudes for aspect checks
  const natalLongs: Record<string, number> = {};
  for (const [key, p] of Object.entries(natalChart.planets)) {
    natalLongs[key] = p.siderealLongitude;
  }

  // ── Service-specific hora table ────────────────────────────────────────
  const horaTable = SERVICE_HORA_MAP[service] ?? HORA_DEFAULT;
  const targets = SERVICE_NATAL_TARGETS[service];
  const nkAffinity = NAKSHATRA_ACTIVITY_AFFINITY[service] ?? [];

  // ── Bio-rhythmic cycle: birth bird from Moon nakshatra ─────────────────
  const natalMoonLong = natalLongs['moon'] ?? 0;
  const birthBird = moonToBird(natalMoonLong);
  // Lunar phase (recomputed per day in the loop)
  let cachedShukla = isShukla(startDate);

  // ── Jupiter transit (slow — compute once for the week) ─────────────────
  const tJupiter = getSiderealLong(Astronomy.Body.Jupiter, startDate, lat, lng, ayanamsa);
  const jupTargetLong = natalLongs[targets.primary] ?? 0;
  const jupOrb = angularDiff(tJupiter, jupTargetLong);
  // Conjunction (0°) or trine (120°) within 8° orb
  const jupBoost =
    jupOrb < 5 ? 10 :
    jupOrb < 8 ? 6 :
    Math.abs(jupOrb - 120) < 5 ? 7 :
    Math.abs(jupOrb - 120) < 8 ? 4 :
    0;

  // ── Transit Sun sign (changes ~once/month — compute once) ──────────────
  const tSunLong = getSiderealLong(Astronomy.Body.Sun, startDate, lat, lng, ayanamsa);
  const transitSunSign = getSign(tSunLong);

  const windows: HourWindow[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayOffset);
    dayDate.setHours(0, 0, 0, 0);

    // ── Sunrise ────────────────────────────────────────────────────────
    let sunrise: Date;
    try {
      sunrise = getSunrise(dayDate, lat, lng);
      if (sunrise.getHours() < 3 || sunrise.getHours() > 9) throw new Error('unreasonable');
    } catch {
      sunrise = new Date(dayDate);
      sunrise.setHours(5, 30, 0, 0);
    }

    const sunriseHour = sunrise.getHours();
    const sunsetHour = Math.min(sunriseHour + 12, 19); // approximate sunset
    cachedShukla = isShukla(dayDate); // refresh lunar phase per day
    const dayOfWeek = dayDate.getDay();
    const startPlanetIdx = CHALDEAN_HOUR_SEQUENCE.indexOf(dayOfWeek);

    for (let i = 0; i < 24; i++) {
      const actualHour = (sunriseHour + i) % 24;
      const planetIdx = CHALDEAN_HOUR_SEQUENCE[(startPlanetIdx + i) % 7];
      const horaRuler = PLANETS[planetIdx].name;
      const horaData = horaTable[horaRuler] ?? { base: 14, activity: 'rest' as ActivityType };

      // ── 1. Hora base score (service-specific) ───────────────────────
      let score = horaData.base;
      const signals: string[] = [];

      // ── 2. Dignity of hora ruler in current transit sign ────────────
      // Where is this planet RIGHT NOW in the zodiac?
      const bodyMap: Record<string, Astronomy.Body> = {
        Sun: Astronomy.Body.Sun, Moon: Astronomy.Body.Moon,
        Mars: Astronomy.Body.Mars, Mercury: Astronomy.Body.Mercury,
        Jupiter: Astronomy.Body.Jupiter, Venus: Astronomy.Body.Venus,
        Saturn: Astronomy.Body.Saturn,
      };
      const horaBody = bodyMap[horaRuler];
      if (horaBody) {
        const hourDate = new Date(dayDate);
        hourDate.setHours(actualHour, 0, 0, 0);
        const horaLong = getSiderealLong(horaBody, hourDate, lat, lng, ayanamsa);
        const transitSign = getSign(horaLong);
        const dignityPts = getDignityBoost(horaRuler, transitSign);
        if (dignityPts !== 0) {
          score += dignityPts;
          if (dignityPts >= 8) signals.push(`${horaRuler} exalted`);
          else if (dignityPts >= 5) signals.push(`${horaRuler} own sign`);
          else if (dignityPts < -5) signals.push(`${horaRuler} debilitated`);
        }

        // ── 3. Nakshatra lord resonance ─────────────────────────────
        const nkLord = getNakshatraLord(horaLong);
        if (nkAffinity.includes(nkLord)) {
          score += 3;
          // subtle — don't add to signals unless debug
        }

        // ── Sign lord friendship with hora ruler ────────────────────
        const signLord = SIGN_LORD[transitSign];
        if (signLord && PLANET_FRIENDS[horaRuler]?.includes(signLord)) {
          score += 2;
        } else if (signLord && PLANET_ENEMIES[horaRuler]?.includes(signLord)) {
          score -= 2;
        }
      }

      // ── 4. Transit Moon aspects (per-hour — Moon moves ~0.54°/hr) ──
      const hourDate2 = new Date(dayDate);
      hourDate2.setHours(actualHour, 0, 0, 0);
      const tMoon = getSiderealLong(Astronomy.Body.Moon, hourDate2, lat, lng, ayanamsa);

      // Check Moon aspects to primary & secondary natal targets
      const primaryLong = natalLongs[targets.primary] ?? 0;
      const secondaryLong = natalLongs[targets.secondary] ?? 0;

      const moonPrimaryOrb = angularDiff(tMoon, primaryLong);
      const moonSecondaryOrb = angularDiff(tMoon, secondaryLong);

      // Conjunction (0°)
      if (moonPrimaryOrb < 5) {
        const strength = Math.round(15 * (1 - moonPrimaryOrb / 5));
        score += strength;
        signals.push(`Moon ☌ natal ${targets.primary}`);
      } else if (Math.abs(moonPrimaryOrb - 120) < 5) {
        // Trine (120°)
        score += Math.round(8 * (1 - Math.abs(moonPrimaryOrb - 120) / 5));
        signals.push(`Moon △ natal ${targets.primary}`);
      } else if (Math.abs(moonPrimaryOrb - 60) < 4) {
        // Sextile (60°)
        score += Math.round(5 * (1 - Math.abs(moonPrimaryOrb - 60) / 4));
        signals.push(`Moon ⚹ natal ${targets.primary}`);
      }

      // Secondary target (smaller bonus)
      if (moonSecondaryOrb < 5) {
        score += Math.round(8 * (1 - moonSecondaryOrb / 5));
        signals.push(`Moon ☌ natal ${targets.secondary}`);
      } else if (Math.abs(moonSecondaryOrb - 120) < 5) {
        score += Math.round(5 * (1 - Math.abs(moonSecondaryOrb - 120) / 5));
        signals.push(`Moon △ natal ${targets.secondary}`);
      }

      // ── 5. Jupiter weekly boost ─────────────────────────────────────
      if (jupBoost > 0) {
        score += jupBoost;
        if (jupOrb < 8) signals.push(`Jupiter ☌ natal ${targets.primary}`);
        else signals.push(`Jupiter △ natal ${targets.primary}`);
      }

      // ── 6. Day lord affinity ────────────────────────────────────────
      score += getDayLordBonus(dayOfWeek, horaRuler);

      // ── 7. Circadian bonus ──────────────────────────────────────────
      // Yoga/health/meditation prefer early morning; social_media prefers
      // late morning 9-11 AM (peak engagement) + evening 6-9 PM
      if (service === 'social_media') {
        if ((actualHour >= 9 && actualHour <= 11) || (actualHour >= 18 && actualHour <= 21)) {
          score += 4;
        }
      } else if (service === 'love') {
        if (actualHour >= 18 && actualHour <= 22) score += 3; // Evening romance
      } else if (service === 'business') {
        if (actualHour >= 9 && actualHour <= 17) score += 3; // Business hours
      } else {
        if (actualHour >= 5 && actualHour <= 8) score += 4; // Dawn
      }

      // ── 8b. Bio-rhythmic cycle (Pancha Pakshi overlay) ────────────
      const bioRaw = bioScore(birthBird, dayOfWeek, actualHour, 0,
        sunriseHour, sunsetHour, cachedShukla);
      score += normaliseBio(bioRaw);

      // Clamp
      score = Math.max(0, Math.min(100, score));

      windows.push({
        date: new Date(dayDate),
        hour: actualHour,
        score,
        activity: horaData.activity,
        horaRuler,
        planets: signals,
        isMorning: actualHour >= 4 && actualHour <= 9,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // § 10. GREEN-GUARANTEE — adaptive weekly normalisation
  // ═══════════════════════════════════════════════════════════════════════════
  // "Green" threshold = 62.  If no window in the whole week reaches it,
  // we find the single best window and boost it to 65 — making it green.
  // This means the user always has at least one highlighted "best" window.
  // We do NOT just colour the highest arbitrarily — we actually boost the
  // score, which is a valid "adjusted weight" approach (the window is the
  // RELATIVE best given transit conditions, even if absolute transits are weak).

  const GREEN_THRESHOLD = 62;
  const maxScore = Math.max(...windows.map(w => w.score));

  if (maxScore < GREEN_THRESHOLD) {
    // Find the single best window (earliest if tied)
    const bestIdx = windows.reduce((bi, w, i) =>
      w.score > windows[bi].score ? i : bi, 0);

    // Boost to just above green threshold
    const deficit = GREEN_THRESHOLD + 3 - windows[bestIdx].score;
    windows[bestIdx].score = GREEN_THRESHOLD + 3; // 65
    windows[bestIdx].planets.push(`★ best this week (+${deficit})`);
  }

  return windows;
}

/**
 * Get the start of the current week (Monday 00:00:00).
 */
export function getWeekStart(): Date {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
