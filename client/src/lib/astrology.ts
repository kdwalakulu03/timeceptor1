import * as Astronomy from 'astronomy-engine';

export interface PlanetPosition {
  name: string;
  longitude: number; // Tropical
  siderealLongitude: number; // Sidereal (Lahiri)
  sign: string;
  house: number;
}

export interface ChartData {
  planets: Record<string, PlanetPosition>;
  ascendant: number;
  ayanamsa: number;
  cusps: number[];
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

/**
 * Calculates Lahiri Ayanamsa for a given Julian Day.
 * Formula based on standard Vedic astrology approximations.
 */
export function calculateLahiriAyanamsa(date: Date): number {
  const time = Astronomy.MakeTime(date);
  const jd = time.date.getTime() / 86400000 + 2440587.5;
  
  // Lahiri Ayanamsa formula (approximate but reliable for Vedic apps)
  // Value at J2000 was approx 23.85 degrees
  const ayanamsa = 23.85 + (jd - 2444239.5) * (50.27 / 365.25 / 3600);
  return ayanamsa % 360;
}

export function getSign(longitude: number): string {
  const index = Math.floor((longitude % 360) / 30);
  return SIGNS[index];
}

export function calculateChart(date: Date, latitude: number, longitude: number): ChartData {
  const time = Astronomy.MakeTime(date);
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const ayanamsa = calculateLahiriAyanamsa(date);
  
  const bodies = [
    Astronomy.Body.Sun, 
    Astronomy.Body.Moon, 
    Astronomy.Body.Mars, 
    Astronomy.Body.Mercury, 
    Astronomy.Body.Jupiter, 
    Astronomy.Body.Venus, 
    Astronomy.Body.Saturn
  ];
  
  const planets: Record<string, PlanetPosition> = {};
  
  bodies.forEach(body => {
    const equ = Astronomy.Equator(body, time, observer, true, true);
    const ecl = Astronomy.Ecliptic(equ.vec);
    const tropicalLong = ecl.elon;
    const siderealLong = (tropicalLong - ayanamsa + 360) % 360;
    
    planets[body.toLowerCase()] = {
      name: body,
      longitude: tropicalLong,
      siderealLongitude: siderealLong,
      sign: getSign(siderealLong),
      house: 0 // Will calculate after ascendant
    };
  });

  // Calculate Mean Rahu (North Node)
  // J2000.0 is Jan 1, 2000, 12:00 TT
  // JD for J2000.0 is 2451545.0
  const jd = time.date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;
  
  // Mean longitude of ascending node at J2000.0 is 125.04452 degrees
  // Daily motion is -0.0529537648 degrees
  let rahuTropicalLong = (125.04452 - 0.0529537648 * d) % 360;
  if (rahuTropicalLong < 0) rahuTropicalLong += 360;
  
  const rahuSiderealLong = (rahuTropicalLong - ayanamsa + 360) % 360;
  
  planets['rahu'] = {
    name: 'Rahu',
    longitude: rahuTropicalLong,
    siderealLongitude: rahuSiderealLong,
    sign: getSign(rahuSiderealLong),
    house: 0
  };
  
  // Ketu is exactly opposite to Rahu
  const ketuTropicalLong = (rahuTropicalLong + 180) % 360;
  const ketuSiderealLong = (rahuSiderealLong + 180) % 360;
  
  planets['ketu'] = {
    name: 'Ketu',
    longitude: ketuTropicalLong,
    siderealLongitude: ketuSiderealLong,
    sign: getSign(ketuSiderealLong),
    house: 0
  };

  // Calculate Ascendant (Lagna)
  // The ascendant is the point of the ecliptic rising on the eastern horizon.
  const gst = Astronomy.SiderealTime(time);
  const lstHours = (gst + longitude / 15.0 + 24) % 24;
  const lstRad = (lstHours * 15) * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;
  const epsRad = 23.4392911 * Math.PI / 180; // Obliquity of the ecliptic

  const y = Math.cos(lstRad);
  const x = -Math.sin(lstRad) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad);
  
  let tropicalAsc = Math.atan2(y, x) * 180 / Math.PI;
  if (tropicalAsc < 0) tropicalAsc += 360;
  
  const siderealAsc = (tropicalAsc - ayanamsa + 360) % 360;
  
  // Calculate Houses (Equal House System - common in Vedic)
  const cusps: number[] = [];
  for (let i = 0; i < 12; i++) {
    cusps.push((siderealAsc + i * 30) % 360);
  }
  
  // Assign houses to planets
  Object.values(planets).forEach(p => {
    const diff = (p.siderealLongitude - siderealAsc + 360) % 360;
    p.house = Math.floor(diff / 30) + 1;
  });
  
  return {
    planets,
    ascendant: siderealAsc,
    ayanamsa,
    cusps
  };
}

/**
 * Calculates the actual sunrise for a given location and date.
 */
export function getSunrise(date: Date, latitude: number, longitude: number): Date {
  const observer = new Astronomy.Observer(latitude, longitude, 0);
  const time = Astronomy.MakeTime(date);
  const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, time, 1);
  if (sunrise) return sunrise.date;
  
  const fallback = new Date(date);
  fallback.setHours(6, 0, 0, 0);
  return fallback;
}
