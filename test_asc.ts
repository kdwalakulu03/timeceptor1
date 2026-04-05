import Astronomy from 'astronomy-engine';

function calculateLahiriAyanamsa(date: Date) {
  const time = Astronomy.MakeTime(date);
  const jd = time.date.getTime() / 86400000 + 2440587.5;
  const ayanamsa = 23.85 + (jd - 2444239.5) * (50.27 / 365.25 / 3600);
  return ayanamsa % 360;
}

function calcAsc(date: Date, lat: number, lon: number) {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lstHours = (gst + lon / 15.0 + 24) % 24;
  const lstRad = (lstHours * 15) * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const epsRad = 23.4392911 * Math.PI / 180;

  const y = Math.cos(lstRad);
  const x = -Math.sin(lstRad) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad);
  
  let tropicalAsc = Math.atan2(y, x) * 180 / Math.PI;
  if (tropicalAsc < 0) tropicalAsc += 360;
  
  const ayanamsa = calculateLahiriAyanamsa(date);
  let siderealAsc = (tropicalAsc - ayanamsa + 360) % 360;
  
  const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  const sign = SIGNS[Math.floor(siderealAsc / 30)];
  console.log(`Date: ${date.toISOString()}, Lat: ${lat}, Lon: ${lon}`);
  console.log(`Tropical Asc: ${tropicalAsc.toFixed(2)}`);
  console.log(`Ayanamsa: ${ayanamsa.toFixed(2)}`);
  console.log(`Sidereal Asc: ${siderealAsc.toFixed(2)} (${sign})`);
}

const d = new Date('1990-08-17T08:40:00+05:30');
calcAsc(d, 6.9271, 79.8612); // Colombo
calcAsc(d, 28.6139, 77.2090); // New Delhi
