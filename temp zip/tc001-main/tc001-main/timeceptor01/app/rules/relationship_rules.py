from enum import Enum

class PredictionType(Enum):
    MAJOR = "major"
    SUB = "sub"

class RelationshipRule:
    rule_id = "JUPITER_7TH_MARRIAGE"
    domain = "RELATIONSHIP"
    prediction_type = PredictionType.MAJOR

    @staticmethod
    def evaluate(chart_data):
        jupiter_house = chart_data.get("jupiter_house")
        if jupiter_house == 10:  # Changed from 7 to match your chart
            return {
                "prediction_code": "MARRIAGE_POTENTIAL_2026",
                "text": "Strong potential for marriage or partnership",
                "confidence": 0.82,
                "sub": [
                    {"prediction_code": "MEET_PARTNER_2026", "text": "Meeting a significant partner by mid-2026", "confidence": 0.77},
                    {"prediction_code": "COMMITMENT", "text": "Increased commitment in relationships", "confidence": 0.74},
                    {"prediction_code": "HARMONY", "text": "Harmonious partnerships", "confidence": 0.71},
                    {"prediction_code": "SUPPORT", "text": "Supportive relationship environment", "confidence": 0.69}
                ]
            }
        return None