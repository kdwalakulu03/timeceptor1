import swisseph as swe
import pytz
from datetime import datetime
import logging
import math

# Configure logging for debugging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PlanetCalculator:
    def __init__(self, override_timezone=0):
        # Timezone override switch: 1 = use Asia/Colombo, 0 = use user-provided timezone
        self.override_timezone = override_timezone
        # Set Lahiri ayanamsa for Vedic astrology
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        # Define planets and names
        self.planets = [
            (swe.SUN, "Sun"), (swe.MOON, "Moon"), (swe.MARS, "Mars"),
            (swe.MERCURY, "Mercury"), (swe.JUPITER, "Jupiter"), (swe.VENUS, "Venus"),
            (swe.SATURN, "Saturn"), (swe.URANUS, "Uranus"), (swe.NEPTUNE, "Neptune"),
            (swe.PLUTO, "Pluto"), (swe.TRUE_NODE, "Rahu"), (None, "Ketu")
        ]
        self.signs = [
            "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        ]
        self.lordship_map = {
            "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
            "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
            "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
        }
        self.dignity_map = {
            "Sun": {"exalted": "Aries", "own": ["Leo"], "moolatrikona": ("Leo", 0, 20), "debilitated": "Libra", "peak_exalted_degree": 10},
            "Moon": {"exalted": "Taurus", "own": ["Cancer"], "moolatrikona": ("Taurus", 4, 20), "debilitated": "Scorpio", "peak_exalted_degree": 3},
            "Mars": {"exalted": "Capricorn", "own": ["Aries", "Scorpio"], "moolatrikona": ("Aries", 0, 12), "debilitated": "Cancer", "peak_exalted_degree": 28},
            "Mercury": {"exalted": "Virgo", "own": ["Gemini", "Virgo"], "moolatrikona": ("Virgo", 16, 20), "debilitated": "Pisces", "peak_exalted_degree": 15},
            "Jupiter": {"exalted": "Cancer", "own": ["Sagittarius", "Pisces"], "moolatrikona": ("Sagittarius", 0, 10), "debilitated": "Capricorn", "peak_exalted_degree": 5},
            "Venus": {"exalted": "Pisces", "own": ["Taurus", "Libra"], "moolatrikona": ("Libra", 0, 15), "debilitated": "Virgo", "peak_exalted_degree": 27},
            "Saturn": {"exalted": "Libra", "own": ["Capricorn", "Aquarius"], "moolatrikona": ("Aquarius", 0, 20), "debilitated": "Aries", "peak_exalted_degree": 20},
            "Rahu": {"exalted": "Taurus", "own": ["Virgo"], "moolatrikona": (None, None, None), "debilitated": "Scorpio", "peak_exalted_degree": None},
            "Ketu": {"exalted": "Scorpio", "own": ["Pisces"], "moolatrikona": (None, None, None), "debilitated": "Taurus", "peak_exalted_degree": None}
        }
        self.nakshatra_lord_map = {
            "Ashwini": "Ketu", "Bharani": "Venus", "Krittika": "Sun", "Rohini": "Moon",
            "Mrigashira": "Mars", "Ardra": "Rahu", "Punarvasu": "Jupiter", "Pushya": "Saturn",
            "Ashlesha": "Mercury", "Magha": "Ketu", "Purva Phalguni": "Venus", "Uttara Phalguni": "Sun",
            "Hasta": "Moon", "Chitra": "Mars", "Swati": "Rahu", "Vishakha": "Jupiter",
            "Anuradha": "Saturn", "Jyeshta": "Mercury", "Mula": "Ketu", "Purva Ashadha": "Venus",
            "Uttara Ashadha": "Sun", "Shravana": "Moon", "Dhanishta": "Mars", "Shatabhisha": "Rahu",
            "Purva Bhadrapada": "Jupiter", "Uttara Bhadrapada": "Saturn", "Revati": "Mercury"
        }

    def _to_ut(self, local_time, user_timezone='Asia/Colombo'):
        """Convert local time to UT, with optional Colombo override."""
        try:
            if self.override_timezone == 1:
                tz = pytz.timezone('Asia/Colombo')
                logger.debug(f"Timezone override enabled, using Asia/Colombo")
            else:
                tz = pytz.timezone(user_timezone)
                logger.debug(f"Using user-provided timezone: {user_timezone}")

            if local_time.tzinfo is None:
                local_time = tz.localize(local_time)
            ut_time = local_time.astimezone(pytz.UTC)
            logger.debug(f"Converted {local_time} to UT: {ut_time}")
            return ut_time
        except Exception as e:
            logger.error(f"Error converting to UT: {e}")
            raise

    def calculate_longitude(self, planet_id, julian_day, planet_name, rahu_longitude=None):
        """Calculate planet's longitude."""
        try:
            if planet_name == "Ketu":
                if rahu_longitude is None:
                    raise ValueError("Rahu longitude required for Ketu calculation")
                ketu_longitude = (rahu_longitude + 180) % 360
                logger.debug(f"Longitude for Ketu: {ketu_longitude}")
                return ketu_longitude
            pos = swe.calc_ut(julian_day, planet_id, swe.FLG_SIDEREAL)[0][0]
            logger.debug(f"Longitude for {planet_name}: {pos}")
            return pos
        except Exception as e:
            logger.error(f"Error calculating longitude for {planet_name}: {e}")
            raise

    def calculate_sign(self, longitude):
        """Calculate zodiac sign from longitude."""
        try:
            sign_index = int(longitude // 30)
            sign = self.signs[sign_index]
            logger.debug(f"Sign for longitude {longitude}: {sign}")
            return sign
        except Exception as e:
            logger.error(f"Error calculating sign for longitude {longitude}: {e}")
            raise

    def calculate_house(self, longitude, cusps):
        """Calculate house from longitude and cusps."""
        try:
            for i in range(12):
                cusp1 = cusps[i]
                cusp2 = cusps[(i + 1) % 12]
                if cusp2 <= cusp1:
                    if longitude >= cusp1 or longitude < cusp2:
                        house = i + 1
                        break
                else:
                    if longitude >= cusp1 and longitude < cusp2:
                        house = i + 1
                        break
            else:
                house = 1
            logger.debug(f"House for longitude {longitude}: {house}")
            return house
        except Exception as e:
            logger.error(f"Error calculating house for longitude {longitude}: {e}")
            raise

    def calculate_nakshatra(self, longitude):
        """Calculate nakshatra from longitude."""
        try:
            nakshatra_span = 13.333  # Each nakshatra = 13.333°
            nakshatra_index = int(longitude // nakshatra_span)
            nakshatra_names = [
                "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
                "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
                "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshta",
                "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
                "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
            ]
            nakshatra = nakshatra_names[nakshatra_index % 27]
            logger.debug(f"Nakshatra for longitude {longitude}: {nakshatra}")
            return nakshatra
        except Exception as e:
            logger.error(f"Error calculating nakshatra for longitude {longitude}: {e}")
            raise

    def calculate_nakshatra_pada(self, longitude):
        """Calculate nakshatra pada (1–4)."""
        try:
            nakshatra_span = 13.333  # Each nakshatra = 13.333°
            pada_span = nakshatra_span / 4  # Each pada = 3.333°
            nakshatra_start = (longitude // nakshatra_span) * nakshatra_span
            pada = int((longitude - nakshatra_start) // pada_span) + 1
            logger.debug(f"Pada for longitude {longitude}: {pada}")
            return pada
        except Exception as e:
            logger.error(f"Error calculating nakshatra pada for longitude {longitude}: {e}")
            raise

    def calculate_pada_lord(self, longitude):
        """Calculate nakshatra pada lord."""
        try:
            pada_span = 360 / 108  # Each pada = 3.333°
            pada_number = int(longitude // pada_span) + 1  # 1 to 108
            sign_index = (pada_number - 1) % 12  # Maps to signs 0–11
            sign = self.signs[sign_index]
            pada_lord = self.lordship_map.get(sign, "")
            logger.debug(f"Pada lord for longitude {longitude} (pada {pada_number}, sign {sign}): {pada_lord}")
            return pada_lord
        except Exception as e:
            logger.error(f"Error calculating pada lord for longitude {longitude}: {e}")
            raise

    def calculate_retrograde(self, planet_id, julian_day, planet_name):
        """Calculate if planet is retrograde."""
        try:
            if planet_name in ["Rahu", "Ketu"]:
                logger.debug(f"Retrograde for {planet_name}: True")
                return True
            speed = swe.calc_ut(julian_day, planet_id, swe.FLG_SIDEREAL)[0][3]
            retrograde = speed < 0
            logger.debug(f"Retrograde for {planet_name}: {retrograde}")
            return retrograde
        except Exception as e:
            logger.error(f"Error calculating retrograde for {planet_name}: {e}")
            raise

    def calculate_combust(self, planet_longitude, sun_longitude, planet_name):
        """Calculate if planet is combust (within 8° of Sun)."""
        try:
            if planet_name in ["Sun", "Rahu", "Ketu"]:
                logger.debug(f"Combust for {planet_name}: False")
                return False
            combust = abs(planet_longitude - sun_longitude) < 8
            logger.debug(f"Combust for {planet_name}: {combust}")
            return combust
        except Exception as e:
            logger.error(f"Error calculating combust for {planet_name}: {e}")
            raise

    def calculate_lordship(self, planet_name, sign):
        """Calculate the signs ruled by the planet."""
        try:
            # Map planets to their ruled signs
            planet_lordship_map = {
                "Sun": ["Leo"],
                "Moon": ["Cancer"],
                "Mars": ["Aries", "Scorpio"],
                "Mercury": ["Gemini", "Virgo"],
                "Jupiter": ["Sagittarius", "Pisces"],
                "Venus": ["Taurus", "Libra"],
                "Saturn": ["Capricorn", "Aquarius"],
                "Rahu": [],
                "Ketu": [],
                "Uranus": [],
                "Neptune": [],
                "Pluto": []
            }
            ruled_signs = planet_lordship_map.get(planet_name, [])
            lordship = ",".join(ruled_signs) if ruled_signs else ""
            logger.debug(f"Lordship for planet {planet_name} in sign {sign}: {lordship}")
            return lordship
        except Exception as e:
            logger.error(f"Error calculating lordship for planet {planet_name}: {e}")
            raise

    def calculate_house_lordship(self, planet_name, cusps):
        """Calculate house lordship based on ascendant."""
        try:
            ascendant_sign = self.calculate_sign(cusps[0])
            ascendant_index = self.signs.index(ascendant_sign)
            house_signs = [self.signs[(ascendant_index + i) % 12] for i in range(12)]
            ruled_signs = [s for s, r in self.lordship_map.items() if r == planet_name]
            house_lordship = []
            for i, sign in enumerate(house_signs):
                if sign in ruled_signs:
                    house_num = i + 1
                    if house_num == 1:
                        suffix = "st"
                    elif house_num == 2:
                        suffix = "nd"
                    elif house_num == 3:
                        suffix = "rd"
                    else:
                        suffix = "th"
                    house_lordship.append(f"{house_num}{suffix}")
            house_lordship = ",".join(house_lordship) if house_lordship else ""
            logger.debug(f"House lordship for {planet_name}: {house_lordship}")
            return house_lordship
        except Exception as e:
            logger.error(f"Error calculating house lordship for {planet_name}: {e}")
            raise

    def calculate_sign_dignity(self, planet_name, sign, longitude):
        """Calculate sign dignity (exalted, own, moolatrikona, debilitated, neutral)."""
        try:
            dignity_info = self.dignity_map.get(planet_name, {})
            degree = longitude % 30
            # Check exalted
            if sign == dignity_info.get("exalted"):
                proximity = 1 - min(abs(degree - (dignity_info.get("peak_exalted_degree", 0) or 0)) / 30, 1)
                logger.debug(f"Dignity for {planet_name} in {sign}: exalted (proximity {proximity:.2f})")
                return "exalted"
            # Check own sign
            if sign in dignity_info.get("own", []):
                logger.debug(f"Dignity for {planet_name} in {sign}: own")
                return "own"
            # Check moolatrikona
            moolatrikona = dignity_info.get("moolatrikona", (None, None, None))
            if sign == moolatrikona[0] and moolatrikona[1] <= degree <= moolatrikona[2]:
                logger.debug(f"Dignity for {planet_name} in {sign}: moolatrikona")
                return "moolatrikona"
            # Check debilitated
            if sign == dignity_info.get("debilitated"):
                logger.debug(f"Dignity for {planet_name} in {sign}: debilitated")
                return "debilitated"
            # Default to neutral
            logger.debug(f"Dignity for {planet_name} in {sign}: neutral")
            return "neutral"
        except Exception as e:
            logger.error(f"Error calculating sign dignity for {planet_name}: {e}")
            raise

    def calculate_nakshatra_lord(self, nakshatra):
        """Calculate nakshatra lord."""
        try:
            lord = self.nakshatra_lord_map.get(nakshatra, "")
            logger.debug(f"Nakshatra lord for {nakshatra}: {lord}")
            return lord
        except Exception as e:
            logger.error(f"Error calculating nakshatra lord for {nakshatra}: {e}")
            raise

    def calculate_all(self, birth_data):
        """Calculate all attributes for all planets."""
        try:
            # Convert birth time to UT
            dt_str = f"{birth_data['birth_date']} {birth_data.get('birth_time', '00:00')}"
            dt_obj = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
            user_timezone = birth_data.get('timezone', 'Asia/Colombo')
            ut_time = self._to_ut(dt_obj, user_timezone)
            julian_day = swe.julday(ut_time.year, ut_time.month, ut_time.day, ut_time.hour + ut_time.minute / 60.0)
            logger.debug(f"Julian day: {julian_day}")

            # Calculate house cusps
            cusps, _ = swe.houses_ex(julian_day, birth_data.get('latitude', 6.0535), birth_data.get('longitude', 80.2200), b'P', swe.FLG_SIDEREAL)
            logger.debug(f"House cusps: {cusps}")

            entities = {}
            sun_longitude = None
            rahu_longitude = None
            for planet_id, planet_name in self.planets:
                # Calculate longitude
                longitude = self.calculate_longitude(planet_id, julian_day, planet_name, rahu_longitude)
                if planet_name == "Sun":
                    sun_longitude = longitude
                if planet_name == "Rahu":
                    rahu_longitude = longitude

                # Skip Ketu until Rahu is calculated
                if planet_name == "Ketu" and rahu_longitude is None:
                    continue

                # Calculate other attributes
                sign = self.calculate_sign(longitude)
                house = self.calculate_house(longitude, cusps)
                nakshatra = self.calculate_nakshatra(longitude)
                nakshatra_pada = self.calculate_nakshatra_pada(longitude)
                pada_lord = self.calculate_pada_lord(longitude)
                retrograde = self.calculate_retrograde(planet_id, julian_day, planet_name)
                combust = self.calculate_combust(longitude, sun_longitude, planet_name) if sun_longitude is not None else False
                lordship = self.calculate_lordship(planet_name, sign)
                house_lordship = self.calculate_house_lordship(planet_name, cusps)
                sign_dignity = self.calculate_sign_dignity(planet_name, sign, longitude)
                nakshatra_lord = self.calculate_nakshatra_lord(nakshatra)

                entities[planet_name.lower()] = {
                    "planet_name": planet_name,
                    "longitude": longitude,
                    "sign": sign,
                    "house": house,
                    "nakshatra": nakshatra,
                    "nakshatra_pada": nakshatra_pada,
                    "pada_lord": pada_lord,
                    "retrograde": retrograde,
                    "combust": combust,
                    "lordship": lordship,
                    "house_lordship": house_lordship,
                    "sign_dignity": sign_dignity,
                    "nakshatra_lord": nakshatra_lord
                }

            logger.info(f"Calculated entities for profile: {entities}")
            return entities
        except Exception as e:
            logger.error(f"Error in calculate_all: {e}")
            raise