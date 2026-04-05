import swisseph as swe
from datetime import datetime, timedelta
import pytz

class WeeklyPredictionService:
    def generate_weekly_predictions(self, chart_data: dict, week_start: datetime):
        """Generate weekly predictions based on transits."""
        predictions = []
        try:
            # Mock transit-based prediction (expand with pyswisseph later)
            week_end = week_start + timedelta(days=7)
            julian_day = swe.julday(week_start.year, week_start.month, week_start.day, week_start.hour)
            mars_pos = swe.calc_ut(julian_day, swe.MARS, swe.FLG_SIDEREAL)[0][0]
            mars_house = self._get_house(mars_pos, chart_data.get("cusps", [0]*12))
            
            predictions.append({
                "prediction_code": f"WEEKLY_MARS_{week_start.strftime('%Y%m%d')}",
                "prediction_type": "weekly",
                "text": f"Mars in {mars_house}th house this week enhances career drive",
                "confidence": 0.70,
                "week_start": week_start.strftime("%Y-%m-%d")
            })
            
            # Mock crypto/gold prediction
            predictions.append({
                "prediction_code": f"CRYPTO_VENUS_{week_start.strftime('%Y%m%d')}",
                "prediction_type": "crypto",
                "text": f"Venus trine Jupiter favors gold investments this week",
                "confidence": 0.65,
                "week_start": week_start.strftime("%Y-%m-%d")
            })
        except Exception as e:
            predictions.append({"error": str(e)})
        return predictions

    def _get_house(self, planet_pos: float, cusps: list) -> int:
        for i in range(12):
            cusp1 = cusps[i]
            cusp2 = cusps[(i + 1) % 12]
            if cusp2 <= cusp1:
                if planet_pos >= cusp1 or planet_pos < cusp2:
                    return i + 1
            else:
                if planet_pos >= cusp1 and planet_pos < cusp2:
                    return i + 1
        return 1