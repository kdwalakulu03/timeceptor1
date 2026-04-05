class RuleEngine:
    def generate_predictions(self, chart_data: dict):
        """Generate predictions based on chart data."""
        predictions = []
        try:
            saturn_house = chart_data.get("saturn_house")
            if saturn_house == 7:
                predictions.append({
                    "prediction_code": "CAREER_STABILITY_2026",
                    "text": "Career stability through home or property focus",
                    "confidence": 0.76,
                    "sub": [
                        {"prediction_code": "PROPERTY_INVESTMENT", "text": "Investment in property by 2026", "confidence": 0.71},
                        {"prediction_code": "WORK_FROM_HOME", "text": "Stable work-from-home opportunities", "confidence": 0.69},
                        {"prediction_code": "FAMILY_SUPPORT", "text": "Career support from family", "confidence": 0.67},
                        {"prediction_code": "LONG_TERM_ROLE", "text": "Long-term role security", "confidence": 0.65}
                    ]
                })
            jupiter_house = chart_data.get("jupiter_house")
            if jupiter_house == 1:
                predictions.append({
                    "prediction_code": "MARRIAGE_POTENTIAL_2026",
                    "text": "Strong potential for marriage or partnership",
                    "confidence": 0.82,
                    "sub": [
                        {"prediction_code": "MEET_PARTNER_2026", "text": "Meeting a significant partner by mid-2026", "confidence": 0.77},
                        {"prediction_code": "COMMITMENT", "text": "Increased commitment in relationships", "confidence": 0.74},
                        {"prediction_code": "HARMONY", "text": "Harmonious partnerships", "confidence": 0.71},
                        {"prediction_code": "SUPPORT", "text": "Supportive relationship environment", "confidence": 0.69}
                    ]
                })
        except Exception as e:
            predictions.append({"error": str(e)})
        return predictions