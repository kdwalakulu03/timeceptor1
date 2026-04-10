/**
 * Timeceptor Scoring Engine — Vedic Astrology Deep Scoring
 * Ported from timeceptor app into the horoscope product.
 *
 * Signals layered (each adds to a 0–100 composite score):
 *  1. Hora ruler base          — Chaldean planetary hours (planet ↔ activity affinity)
 *  2. Planet dignity           — exalted / own / moolatrikona / debilitated status
 *  3. Nakshatra lord resonance — hora ruler's nakshatra lord alignment with activity
 *  4. Transit Moon aspects     — Moon conjunct/trine/sextile natal points (hourly)
 *  5. Transit Jupiter aspects  — Jupiter conjunct/trine natal Sun (daily)
 *  6. Day lord affinity        — planetary day ruler ↔ activity alignment
 *  7. Circadian bonus          — morning / evening awareness windows
 *  8. Bio-rhythmic cycle       — Pancha Pakshi overlay
 *  9. Green-guarantee          — best window always ≥ 62 so user always sees progress
 */

import * as Astronomy from 'astronomy-engine';
import { calculateChart, calculateLahiriAyanamsa, getSunrise, getSign } from './astrology';
import { PLANETS, CHALDEAN_HOUR_SEQUENCE } from './constants';
import type { ActivityType, HourWindow, ServiceId } from '../types';

// ─── Activity-specific hora scoring tables ──────────────────────────────────

type HoraEntry = { base: number; activity: ActivityType };

const HORA_YOGA: Record<string, HoraEntry> = {
  Mars:    { base: 52, activity: 'physical' },
  Sun:     { base: 48, activity: 'physical' },
  Jupiter: { base: 44, activity: 'mental'   },
  Moon:    { base: 38, activity: 'creative' },
  Venus:   { base: 36, activity: 'social'   },
  Mercury: { base: 32, activity: 'mental'   },
  Saturn:  { base: 12, activity: 'rest'     },
};

const HORA_MEDITATION: Record<string, HoraEntry> = {
  Jupiter: { base: 55, activity: 'mental'   },
  Moon:    { base: 50, activity: 'creative' },
  Saturn:  { base: 44, activity: 'mental'   },
  Venus:   { base: 40, activity: 'social'   },
  Sun:     { base: 36, activity: 'mental'   },
  Mercury: { base: 32, activity: 'mental'   },
  Mars:    { base: 18, activity: 'physical' },
};

const HORA_BUSINESS: Record<string, HoraEntry> = {
  Sun:     { base: 54, activity: 'mental'   },
  Jupiter: { base: 50, activity: 'mental'   },
  Mercury: { base: 48, activity: 'mental'   },
  Mars:    { base: 44, activity: 'physical' },
  Venus:   { base: 38, activity: 'social'   },
  Moon:    { base: 28, activity: 'social'   },
  Saturn:  { base: 20, activity: 'rest'     },
};

const HORA_CREATIVE: Record<string, HoraEntry> = {
  Venus:   { base: 55, activity: 'creative' },
  Moon:    { base: 50, activity: 'creative' },
  Mercury: { base: 46, activity: 'creative' },
  Jupiter: { base: 40, activity: 'mental'   },
  Sun:     { base: 36, activity: 'creative' },
  Mars:    { base: 30, activity: 'physical' },
  Saturn:  { base: 18, activity: 'rest'     },
};

const HORA_TRAVEL: Record<string, HoraEntry> = {
  Jupiter: { base: 55, activity: 'mental'   },
  Sun:     { base: 48, activity: 'physical' },
  Venus:   { base: 44, activity: 'social'   },
  Moon:    { base: 38, activity: 'social'   },
  Mercury: { base: 34, activity: 'mental'   },
  Mars:    { base: 28, activity: 'physical' },
  Saturn:  { base: 8,  activity: 'rest'     },
};

const HORA_LOVE: Record<string, HoraEntry> = {
  Venus:   { base: 55, activity: 'social'   },
  Moon:    { base: 50, activity: 'social'   },
  Jupiter: { base: 44, activity: 'social'   },
  Sun:     { base: 36, activity: 'social'   },
  Mercury: { base: 32, activity: 'social'   },
  Mars:    { base: 26, activity: 'physical' },
  Saturn:  { base: 14, activity: 'rest'     },
};

const HORA_HEALTH: Record<string, HoraEntry> = {
  Sun:     { base: 52, activity: 'physical' },
  Mars:    { base: 48, activity: 'physical' },
  Jupiter: { base: 42, activity: 'mental'   },
  Moon:    { base: 38, activity: 'creative' },
  Venus:   { base: 34, activity: 'social'   },
  Mercury: { base: 30, activity: 'mental'   },
  Saturn:  { base: 16, activity: 'rest'     },
};

const HORA_SOCIAL_MEDIA: Record<string, HoraEntry> = {
  Mercury: { base: 55, activity: 'social_media' },
  Venus:   { base: 50, activity: 'social_media' },
  Sun:     { base: 46, activity: 'social_media' },
  Jupiter: { base: 42, activity: 'social_media' },
  Moon:    { base: 38, activity: 'social_media' },
  Mars:    { base: 32, activity: 'social_media' },
  Saturn:  { base: 10, activity: 'social_media' },
};

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

// ─── Vedic Dignity Table ─────────────────────────────────────────────────────

interface DignityEntry {
  exalted: string;
  ownSigns: string[];
  moolatrikona: string;
  debilitated: string;
}

const DIGNITY_TABLE: Record<string, DignityEntry> = {
  Sun:     { exalted: 'Aries',     ownSigns: ['Leo'],                     moolatrikona: 'Leo',         debilitated: 'Libra'     },
  Moon:    { exalted: 'Taurus',    ownSigns: ['Cancer'],                  moolatrikona: 'Taurus',      debilitated: 'Scorpio'   },
  Mars:    { exalted: 'Capricorn', ownSigns: ['Aries', 'Scorpio'],       moolatrikona: 'Aries',       debilitated: 'Cancer'    },
  Mercury: { exalted: 'Virgo',     ownSigns: ['Gemini', 'Virgo'],        moolatrikona: 'Virgo',       debilitated: 'Pisces'    },
  Jupiter: { exalted: 'Cancer',    ownSigns: ['Sagittarius', 'Pisces'],  moolatrikona: 'Sagittarius', debilitated: 'Capricorn' },
  Venus:   { exalted: 'Pisces',    ownSigns: ['Taurus', 'Libra'],        moolatrikona: 'Libra',       debilitated: 'Virgo'     },
  Saturn:  { exalted: 'Libra',     ownSigns: ['Capricorn', 'Aquarius'],  moolatrikona: 'Aquarius',    debilitated: 'Aries'     },
};

function getDignityBoost(planet: string, transitSign: string): number {
  const d = DIGNITY_TABLE[planet];
  if (!d) return 0;
  if (transitSign === d.exalted)          return 10;
  if (d.ownSigns.includes(transitSign))  return 6;
  if (transitSign === d.moolatrikona)     return 5;
  if (transitSign === d.debilitated)      return -8;
  return 0;
}

// ─── Sign Lordship ───────────────────────────────────────────────────────────

const SIGN_LORD: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

// ─── Nakshatra System ────────────────────────────────────────────────────────

const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

function getNakshatraLord(siderealLong: number): string {
  const idx = Math.floor(((siderealLong % 360) + 360) % 360 / (360 / 27));
  return NAKSHATRA_LORDS[idx] ?? 'Mercury';
}

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

// ─── Planetary Friendships ───────────────────────────────────────────────────

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

// ─── Day Lord Affinity ───────────────────────────────────────────────────────

const DAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function getDayLordBonus(dayOfWeek: number, horaRuler: string): number {
  const dayLord = DAY_LORDS[dayOfWeek];
  if (dayLord === horaRuler)                                   return 4;
  if (PLANET_FRIENDS[dayLord]?.includes(horaRuler))           return 2;
  if (PLANET_ENEMIES[dayLord]?.includes(horaRuler))           return -2;
  return 0;
}

// ─── Service-specific Transit Targets ───────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function angularDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

function getSiderealLong(
  body: Astronomy.Body, date: Date, lat: number, lng: number, ayanamsa: number,
): number {
  const time = Astronomy.MakeTime(date);
  const observer = new Astronomy.Observer(lat, lng, 0);
  const equ = Astronomy.Equator(body, time, observer, true, true);
  const ecl = Astronomy.Ecliptic(equ.vec);
  return ((ecl.elon - ayanamsa) % 360 + 360) % 360;
}

// ─── Bio-rhythmic Cycle (Pancha Pakshi) ──────────────────────────────────────

type BioAct = 0 | 1 | 2 | 3 | 4;
const BIO_SCORES: Record<BioAct, number> = { 0: 12, 1: 6, 2: 20, 3: -6, 4: -14 };

function moonToBird(moonSidLng: number): number {
  const nak = Math.floor(((moonSidLng % 360) + 360) % 360 / (360 / 27)) % 27;
  if (nak < 5)  return 0;
  if (nak < 10) return 1;
  if (nak < 15) return 2;
  if (nak < 20) return 3;
  return 4;
}

function bioDayGroup(dow: number, isNight: boolean): string {
  if (isNight) {
    if (dow === 0 || dow === 2) return 'st';
    if (dow === 3) return 'w';
    if (dow === 4) return 'h';
    if (dow === 5) return 'f';
    return 'ms';
  }
  if (dow === 0 || dow === 2) return 'st';
  if (dow === 1 || dow === 3) return 'mw';
  if (dow === 4) return 'h';
  if (dow === 5) return 'f';
  return 's';
}

const BD: Record<string, BioAct[][]> = {
  st: [[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3]],
  mw: [[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2]],
  h:  [[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0],[2,3,4,0,1]],
  f:  [[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4],[1,2,3,4,0]],
  s:  [[1,2,3,4,0],[2,3,4,0,1],[3,4,0,1,2],[4,0,1,2,3],[0,1,2,3,4]],
};
const BN: Record<string, BioAct[][]> = {
  st: [[1,0,4,3,2],[4,3,2,1,0],[2,1,0,4,3],[0,4,3,2,1],[3,2,1,0,4]],
  w:  [[4,3,2,1,0],[2,1,0,4,3],[0,4,3,2,1],[3,2,1,0,4],[1,0,4,3,2]],
  h:  [[2,1,0,4,3],[0,4,3,2,1],[3,2,1,0,4],[1,0,4,3,2],[4,3,2,1,0]],
  f:  [[0,4,3,2,1],[3,2,1,0,4],[1,0,4,3,2],[4,3,2,1,0],[2,1,0,4,3]],
  ms: [[3,2,1,0,4],[1,0,4,3,2],[4,3,2,1,0],[2,1,0,4,3],[0,4,3,2,1]],
};

const BIO_SUB: Record<string, number[]> = {
  sd: [24,30,48,18,24],
  sn: [30,30,24,24,36],
  kd: [48,36,18,12,30],
  kn: [42,42,18,18,24],
};

const S_DEATH: number[][] = [[4,6],[0,5],[1],[2],[3]];
const S_RULE:  number[][] = [[0,2],[1,3],[4],[5],[6]];
const K_DEATH: number[][] = [[2],[1],[0],[4,6],[3,5]];
const K_RULE:  number[][] = [[5],[4],[3],[0,2],[1,6]];

function isShukla(dt: Date): boolean {
  const phase = Astronomy.MoonPhase(Astronomy.MakeTime(dt));
  return phase < 180;
}

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

  const group = bioDayGroup(dow, isNight);
  const seqTable = isNight ? BN[group] : BD[group];
  if (!seqTable) return 0;
  const primary = seqTable[bird]?.[yamam] as BioAct ?? 0;

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

  const deathDays = shukla ? S_DEATH[bird] : K_DEATH[bird];
  const ruleDays  = shukla ? S_RULE[bird]  : K_RULE[bird];
  let dayBonus = 0;
  if (ruleDays?.includes(dow))  dayBonus = 8;
  else if (deathDays?.includes(dow)) dayBonus = -10;

  return base + sub + dayBonus;
}

function normaliseBio(raw: number): number {
  return Math.round(((raw + 31) / 69) * 24 - 12);
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function getWeeklyWindows(
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number,
  startDate: Date,
  service: ServiceId = 'yoga',
  days: number = 7,
): HourWindow[] {
  const birthDateTime = new Date(`${birthDate}T${birthTime}`);
  const natalChart = calculateChart(birthDateTime, lat, lng);
  const ayanamsa = calculateLahiriAyanamsa(startDate);

  const natalLongs: Record<string, number> = {};
  for (const [key, p] of Object.entries(natalChart.planets)) {
    natalLongs[key] = p.siderealLongitude;
  }

  const horaTable = SERVICE_HORA_MAP[service] ?? HORA_DEFAULT;
  const targets = SERVICE_NATAL_TARGETS[service];
  const nkAffinity = NAKSHATRA_ACTIVITY_AFFINITY[service] ?? [];

  const natalMoonLong = natalLongs['moon'] ?? 0;
  const birthBird = moonToBird(natalMoonLong);
  let cachedShukla = isShukla(startDate);

  const tJupiter = getSiderealLong(Astronomy.Body.Jupiter, startDate, lat, lng, ayanamsa);
  const jupTargetLong = natalLongs[targets.primary] ?? 0;
  const jupOrb = angularDiff(tJupiter, jupTargetLong);
  const jupBoost =
    jupOrb < 5 ? 10 :
    jupOrb < 8 ? 6 :
    Math.abs(jupOrb - 120) < 5 ? 7 :
    Math.abs(jupOrb - 120) < 8 ? 4 : 0;

  const tSunLong = getSiderealLong(Astronomy.Body.Sun, startDate, lat, lng, ayanamsa);
  const transitSunSign = getSign(tSunLong);

  const windows: HourWindow[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayOffset);
    dayDate.setHours(0, 0, 0, 0);

    let sunrise: Date;
    try {
      sunrise = getSunrise(dayDate, lat, lng);
      if (sunrise.getHours() < 3 || sunrise.getHours() > 9) throw new Error('unreasonable');
    } catch {
      sunrise = new Date(dayDate);
      sunrise.setHours(5, 30, 0, 0);
    }

    const sunriseHour = sunrise.getHours();
    const sunsetHour = Math.min(sunriseHour + 12, 19);
    cachedShukla = isShukla(dayDate);
    const dayOfWeek = dayDate.getDay();
    const startPlanetIdx = CHALDEAN_HOUR_SEQUENCE.indexOf(dayOfWeek);

    for (let i = 0; i < 24; i++) {
      const actualHour = (sunriseHour + i) % 24;
      const planetIdx = CHALDEAN_HOUR_SEQUENCE[(startPlanetIdx + i) % 7];
      const horaRuler = PLANETS[planetIdx].name;
      const horaData = horaTable[horaRuler] ?? { base: 14, activity: 'rest' as ActivityType };

      let score = horaData.base;
      const signals: string[] = [];

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
        const nkLord = getNakshatraLord(horaLong);
        if (nkAffinity.includes(nkLord)) score += 3;
        const signLord = SIGN_LORD[transitSign];
        if (signLord && PLANET_FRIENDS[horaRuler]?.includes(signLord)) score += 2;
        else if (signLord && PLANET_ENEMIES[horaRuler]?.includes(signLord)) score -= 2;
      }

      const hourDate2 = new Date(dayDate);
      hourDate2.setHours(actualHour, 0, 0, 0);
      const tMoon = getSiderealLong(Astronomy.Body.Moon, hourDate2, lat, lng, ayanamsa);

      const primaryLong  = natalLongs[targets.primary]   ?? 0;
      const secondaryLong= natalLongs[targets.secondary] ?? 0;

      const moonPrimaryOrb   = angularDiff(tMoon, primaryLong);
      const moonSecondaryOrb = angularDiff(tMoon, secondaryLong);

      if (moonPrimaryOrb < 5) {
        score += Math.round(15 * (1 - moonPrimaryOrb / 5));
        signals.push(`Moon ☌ natal ${targets.primary}`);
      } else if (Math.abs(moonPrimaryOrb - 120) < 5) {
        score += Math.round(8 * (1 - Math.abs(moonPrimaryOrb - 120) / 5));
        signals.push(`Moon △ natal ${targets.primary}`);
      } else if (Math.abs(moonPrimaryOrb - 60) < 4) {
        score += Math.round(5 * (1 - Math.abs(moonPrimaryOrb - 60) / 4));
        signals.push(`Moon ⚹ natal ${targets.primary}`);
      }

      if (moonSecondaryOrb < 5) {
        score += Math.round(8 * (1 - moonSecondaryOrb / 5));
        signals.push(`Moon ☌ natal ${targets.secondary}`);
      } else if (Math.abs(moonSecondaryOrb - 120) < 5) {
        score += Math.round(5 * (1 - Math.abs(moonSecondaryOrb - 120) / 5));
        signals.push(`Moon △ natal ${targets.secondary}`);
      }

      if (jupBoost > 0) {
        score += jupBoost;
        signals.push(jupOrb < 8 ? `Jupiter ☌ natal ${targets.primary}` : `Jupiter △ natal ${targets.primary}`);
      }

      score += getDayLordBonus(dayOfWeek, horaRuler);

      if (service === 'social_media') {
        if ((actualHour >= 9 && actualHour <= 11) || (actualHour >= 18 && actualHour <= 21)) score += 4;
      } else if (service === 'love') {
        if (actualHour >= 18 && actualHour <= 22) score += 3;
      } else if (service === 'business') {
        if (actualHour >= 9 && actualHour <= 17) score += 3;
      } else {
        if (actualHour >= 5 && actualHour <= 8) score += 4;
      }

      const bioRaw = bioScore(birthBird, dayOfWeek, actualHour, 0, sunriseHour, sunsetHour, cachedShukla);
      score += normaliseBio(bioRaw);

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

  // Green-guarantee: always have at least one window ≥ 62
  const GREEN_THRESHOLD = 62;
  const maxScore = Math.max(...windows.map(w => w.score));
  if (maxScore < GREEN_THRESHOLD) {
    const bestIdx = windows.reduce((bi, w, i) => w.score > windows[bi].score ? i : bi, 0);
    const deficit = GREEN_THRESHOLD + 3 - windows[bestIdx].score;
    windows[bestIdx].score = GREEN_THRESHOLD + 3;
    windows[bestIdx].planets.push(`★ best this week (+${deficit})`);
  }

  return windows;
}

export function getWeekStart(): Date {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
