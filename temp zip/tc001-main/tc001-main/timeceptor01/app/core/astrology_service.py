import swisseph as swe
from datetime import datetime
import pytz

class AstrologyService:
    def __init__(self):
        swe.set_sid_mode(swe.SIDM_LAHIRI)  # Lahiri Ayanamsa

    def calculate_chart(self, birth_data: dict):
        try:
            dt_str = f"{birth_data['dob']} {birth_data.get('time', '00:00')}"
            dt_obj = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            sri_lanka_tz = pytz.timezone('Asia/Colombo')
            dt_obj = sri_lanka_tz.localize(dt_obj)
            dt_utc = dt_obj.astimezone(pytz.UTC)
            julian_day = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute/60.0)
            swe.set_topo(birth_data.get("longitude", 80.2200), birth_data.get("latitude", 6.0535), 0)
            saturn_pos_data = swe.calc_ut(julian_day, swe.SATURN, swe.FLG_SIDEREAL)
            jupiter_pos_data = swe.calc_ut(julian_day, swe.JUPITER, swe.FLG_SIDEREAL)
            saturn_longitude = saturn_pos_data[0][0]
            jupiter_longitude = jupiter_pos_data[0][0]
            cusps, ascmc = swe.houses_ex(julian_day, birth_data.get("latitude", 6.0535), birth_data.get("longitude", 80.2200), b'P', swe.FLG_SIDEREAL)
            saturn_house = 1
            jupiter_house = 1
            for i in range(12):
                cusp1 = cusps[i]
                cusp2 = cusps[(i + 1) % 12]
                if cusp2 <= cusp1:
                    if saturn_longitude >= cusp1 or saturn_longitude < cusp2:
                        saturn_house = i + 1
                    if jupiter_longitude >= cusp1 or jupiter_longitude < cusp2:
                        jupiter_house = i + 1
                else:
                    if saturn_longitude >= cusp1 and saturn_longitude < cusp2:
                        saturn_house = i + 1
                    if jupiter_longitude >= cusp1 and jupiter_longitude < cusp2:
                        jupiter_house = i + 1
            return {
                "status": "chart calculation successful",
                "saturn_house": saturn_house,
                "jupiter_house": jupiter_house,
                "calculated_julian_day": julian_day,
                "cusps": cusps
            }
        except Exception as e:
            return {"status": "chart calculation failed", "error": str(e)}