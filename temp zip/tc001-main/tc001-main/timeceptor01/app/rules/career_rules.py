from enum import Enum

class PredictionType(Enum):
    MAJOR = "major"
    SUB = "sub"

class CareerRule:
    rule_id = "SATURN_10TH_CAREER"
    domain = "CAREER"
    prediction_type = PredictionType.MAJOR

    @staticmethod
    def evaluate(chart_data):
        saturn_house = chart_data.get("saturn_house")
        if saturn_house == 10:
            return {
                "prediction_code": "CAREER_ADVANCEMENT_2026",
                "text": "Career advancement likely",
                "confidence": 0.80,
                "sub": [
                    {"prediction_code": "PROMOTION_2026", "text": "Promotion by mid-2026", "confidence": 0.75},
                    {"prediction_code": "RESPONSIBILITIES", "text": "Increased responsibilities", "confidence": 0.72},
                    {"prediction_code": "FINANCIAL_GAIN", "text": "Financial gain", "confidence": 0.70},
                    {"prediction_code": "STABILITY", "text": "Stable job environment", "confidence": 0.68}
                ]
            }
        return None

class SaturnFourthHouseRule:
    rule_id = "SATURN_4TH_STABILITY"
    domain = "CAREER"
    prediction_type = PredictionType.MAJOR

    @staticmethod
    def evaluate(chart_data):
        saturn_house = chart_data.get("saturn_house")
        if saturn_house == 4:
            return {
                "prediction_code": "CAREER_STABILITY_2026",
                "text": "Career stability through home or property focus",
                "confidence": 0.76,
                "sub": [
                    {"prediction_code": "PROPERTY_INVESTMENT", "text": "Investment in property by 2026", "confidence": 0.71},
                    {"prediction_code": "WORK_FROM_HOME", "text": "Stable work-from-home opportunities", "confidence": 0.69},
                    {"prediction_code": "FAMILY_SUPPORT", "text": "Career support from family", "confidence": 0.67},
                    {"prediction_code": "LONG_TERM_ROLE", "text": "Long-term role security", "confidence": 0.65}
                ]
            }
        return None