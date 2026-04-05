class HouseParivartanaYogaRule:
    def __init__(self):
        # Ascendant to house-lord mapping
        self.ascendant_lord_map = {
            "Aries": {1: ("Mars", "Aries"), 2: ("Venus", "Taurus"), 3: ("Mercury", "Gemini"), 4: ("Moon", "Cancer"), 5: ("Sun", "Leo"), 6: ("Mercury", "Virgo"), 7: ("Venus", "Libra"), 8: ("Mars", "Scorpio"), 9: ("Jupiter", "Sagittarius"), 10: ("Saturn", "Capricorn"), 11: ("Saturn", "Aquarius"), 12: ("Jupiter", "Pisces")},
            "Taurus": {1: ("Venus", "Taurus"), 2: ("Mercury", "Gemini"), 3: ("Moon", "Cancer"), 4: ("Sun", "Leo"), 5: ("Mercury", "Virgo"), 6: ("Venus", "Libra"), 7: ("Mars", "Scorpio"), 8: ("Jupiter", "Sagittarius"), 9: ("Saturn", "Capricorn"), 10: ("Saturn", "Aquarius"), 11: ("Jupiter", "Pisces"), 12: ("Mars", "Aries")},
            "Gemini": {1: ("Mercury", "Gemini"), 2: ("Moon", "Cancer"), 3: ("Sun", "Leo"), 4: ("Mercury", "Virgo"), 5: ("Venus", "Libra"), 6: ("Mars", "Scorpio"), 7: ("Jupiter", "Sagittarius"), 8: ("Saturn", "Capricorn"), 9: ("Saturn", "Aquarius"), 10: ("Jupiter", "Pisces"), 11: ("Mars", "Aries"), 12: ("Venus", "Taurus")},
            "Cancer": {1: ("Moon", "Cancer"), 2: ("Sun", "Leo"), 3: ("Mercury", "Virgo"), 4: ("Venus", "Libra"), 5: ("Mars", "Scorpio"), 6: ("Jupiter", "Sagittarius"), 7: ("Saturn", "Capricorn"), 8: ("Saturn", "Aquarius"), 9: ("Jupiter", "Pisces"), 10: ("Mars", "Aries"), 11: ("Venus", "Taurus"), 12: ("Mercury", "Gemini")},
            "Leo": {1: ("Sun", "Leo"), 2: ("Mercury", "Virgo"), 3: ("Venus", "Libra"), 4: ("Mars", "Scorpio"), 5: ("Jupiter", "Sagittarius"), 6: ("Saturn", "Capricorn"), 7: ("Saturn", "Aquarius"), 8: ("Jupiter", "Pisces"), 9: ("Mars", "Aries"), 10: ("Venus", "Taurus"), 11: ("Mercury", "Gemini"), 12: ("Moon", "Cancer")},
            "Virgo": {1: ("Mercury", "Virgo"), 2: ("Venus", "Libra"), 3: ("Mars", "Scorpio"), 4: ("Jupiter", "Sagittarius"), 5: ("Saturn", "Capricorn"), 6: ("Saturn", "Aquarius"), 7: ("Jupiter", "Pisces"), 8: ("Mars", "Aries"), 9: ("Venus", "Taurus"), 10: ("Mercury", "Gemini"), 11: ("Moon", "Cancer"), 12: ("Sun", "Leo")},
            "Libra": {1: ("Venus", "Libra"), 2: ("Mars", "Scorpio"), 3: ("Jupiter", "Sagittarius"), 4: ("Saturn", "Capricorn"), 5: ("Saturn", "Aquarius"), 6: ("Jupiter", "Pisces"), 7: ("Mars", "Aries"), 8: ("Venus", "Taurus"), 9: ("Mercury", "Gemini"), 10: ("Moon", "Cancer"), 11: ("Sun", "Leo"), 12: ("Mercury", "Virgo")},
            "Scorpio": {1: ("Mars", "Scorpio"), 2: ("Jupiter", "Sagittarius"), 3: ("Saturn", "Capricorn"), 4: ("Saturn", "Aquarius"), 5: ("Jupiter", "Pisces"), 6: ("Mars", "Aries"), 7: ("Venus", "Taurus"), 8: ("Mercury", "Gemini"), 9: ("Moon", "Cancer"), 10: ("Sun", "Leo"), 11: ("Mercury", "Virgo"), 12: ("Venus", "Libra")},
            "Sagittarius": {1: ("Jupiter", "Sagittarius"), 2: ("Saturn", "Capricorn"), 3: ("Saturn", "Aquarius"), 4: ("Jupiter", "Pisces"), 5: ("Mars", "Aries"), 6: ("Venus", "Taurus"), 7: ("Mercury", "Gemini"), 8: ("Moon", "Cancer"), 9: ("Sun", "Leo"), 10: ("Mercury", "Virgo"), 11: ("Venus", "Libra"), 12: ("Mars", "Scorpio")},
            "Capricorn": {1: ("Saturn", "Capricorn"), 2: ("Saturn", "Aquarius"), 3: ("Jupiter", "Pisces"), 4: ("Mars", "Aries"), 5: ("Venus", "Taurus"), 6: ("Mercury", "Gemini"), 7: ("Moon", "Cancer"), 8: ("Sun", "Leo"), 9: ("Mercury", "Virgo"), 10: ("Venus", "Libra"), 11: ("Mars", "Scorpio"), 12: ("Jupiter", "Sagittarius")},
            "Aquarius": {1: ("Saturn", "Aquarius"), 2: ("Jupiter", "Pisces"), 3: ("Mars", "Aries"), 4: ("Venus", "Taurus"), 5: ("Mercury", "Gemini"), 6: ("Moon", "Cancer"), 7: ("Sun", "Leo"), 8: ("Mercury", "Virgo"), 9: ("Venus", "Libra"), 10: ("Mars", "Scorpio"), 11: ("Jupiter", "Sagittarius"), 12: ("Saturn", "Capricorn")},
            "Pisces": {1: ("Jupiter", "Pisces"), 2: ("Mars", "Aries"), 3: ("Venus", "Taurus"), 4: ("Mercury", "Gemini"), 5: ("Moon", "Cancer"), 6: ("Sun", "Leo"), 7: ("Mercury", "Virgo"), 8: ("Venus", "Libra"), 9: ("Mars", "Scorpio"), 10: ("Jupiter", "Sagittarius"), 11: ("Saturn", "Capricorn"), 12: ("Saturn", "Aquarius")}
        }
        # Generic house-pair prediction matrix
        self.prediction_matrix = {
            (1, 2): {"code": "1ST_2ND", "text": "Self and wealth intertwined. Gains through personal effort, family, or speech. Strong identity tied to financial success.", "confidence": 0.74},
            (1, 3): {"code": "1ST_3RD", "text": "Self and courage linked. Success through personal enterprise, communication, or siblings. Bold and dynamic personality.", "confidence": 0.73},
            (1, 4): {"code": "1ST_4TH", "text": "Self and home connected. Strong focus on domestic happiness, property, or mother. Identity tied to roots.", "confidence": 0.74},
            (1, 5): {"code": "1ST_5TH", "text": "Self and creativity blended. Gains through intelligence, children, or speculation. Charismatic and creative identity.", "confidence": 0.76},
            (1, 6): {"code": "1ST_6TH", "text": "Self and conflicts linked. Overcomes enemies or health issues through personal effort. Success in service-oriented roles.", "confidence": 0.68},
            (1, 7): {"code": "1ST_7TH", "text": "Self and partnerships intertwined. Strong marriage or business success enhances identity. Public-oriented life.", "confidence": 0.76},
            (1, 8): {"code": "1ST_8TH", "text": "Self and transformation connected. Interest in occult or research shapes identity. May face sudden changes or gains.", "confidence": 0.70},
            (1, 9): {"code": "1ST_9TH", "text": "Self and fortune linked. Wise and philosophical identity, success through higher learning or travel.", "confidence": 0.78},
            (1, 10): {"code": "1ST_10TH", "text": "Self and career intertwined. Leadership and ambition drive public success. Strong professional identity.", "confidence": 0.80},
            (1, 11): {"code": "1ST_11TH", "text": "Self and gains connected. Fulfills desires through social networks and personal effort. Influential and successful.", "confidence": 0.77},
            (1, 12): {"code": "1ST_12TH", "text": "Self and spirituality linked. Drawn to foreign lands or spiritual pursuits. May face isolation or expenses.", "confidence": 0.70},
            (2, 3): {"code": "2ND_3RD", "text": "Wealth and courage blended. Gains through communication, siblings, or personal effort. Strong financial initiative.", "confidence": 0.73},
            (2, 4): {"code": "2ND_4TH", "text": "Wealth and home connected. Gains through property, vehicles, or family. Comfortable and prosperous domestic life.", "confidence": 0.74},
            (2, 5): {"code": "2ND_5TH", "text": "Wealth and creativity intertwined. Gains through speculation, children, or intelligence. Prosperous and creative.", "confidence": 0.76},
            (2, 6): {"code": "2ND_6TH", "text": "Wealth and conflicts linked. Financial struggles or gains through service, law, or medicine. Challenges with money.", "confidence": 0.68},
            (2, 7): {"code": "2ND_7TH", "text": "Wealth and partnerships blended. Gains through spouse or business. Prosperous marriage or trade.", "confidence": 0.75},
            (2, 8): {"code": "2ND_8TH", "text": "Wealth and transformation connected. Unearned gains through inheritance or sudden losses. Financial ups and downs.", "confidence": 0.70},
            (2, 9): {"code": "2ND_9TH", "text": "Wealth and fortune intertwined. Gains through higher learning, father, or foreign connections. Lucky financially.", "confidence": 0.77},
            (2, 10): {"code": "2ND_10TH", "text": "Wealth and career linked. Professional success drives financial gains. Strong status in finance or management.", "confidence": 0.76},
            (2, 11): {"code": "2ND_11TH", "text": "Wealth and gains blended (Dhana Yoga). Immense prosperity through social networks or ventures. Fulfills financial desires.", "confidence": 0.80},
            (2, 12): {"code": "2ND_12TH", "text": "Wealth and losses connected. Financial expenses or gains from foreign lands. Challenges in saving.", "confidence": 0.68},
            (3, 4): {"code": "3RD_4TH", "text": "Courage and home linked. Builds property through effort. Strong sibling or mother influence in domestic life.", "confidence": 0.73},
            (3, 5): {"code": "3RD_5TH", "text": "Courage and creativity intertwined. Success in creative arts, writing, or speculation through effort.", "confidence": 0.74},
            (3, 6): {"code": "3RD_6TH", "text": "Courage and conflicts blended. Overcomes enemies through bold action. Success in competitive fields.", "confidence": 0.70},
            (3, 7): {"code": "3RD_7TH", "text": "Courage and partnerships connected. Business success through communication or travel. Assertive in relationships.", "confidence": 0.74},
            (3, 8): {"code": "3RD_8TH", "text": "Courage and transformation linked. Faces sudden challenges or gains through research or communication.", "confidence": 0.68},
            (3, 9): {"code": "3RD_9TH", "text": "Courage and fortune intertwined. Gains through travel, higher learning, or bold actions. Philosophical initiative.", "confidence": 0.75},
            (3, 10): {"code": "3RD_10TH", "text": "Courage and career blended. Success in media, marketing, or entrepreneurship through daring efforts.", "confidence": 0.76},
            (3, 11): {"code": "3RD_11TH", "text": "Courage and gains connected. Fulfills desires through enterprise, siblings, or social networks.", "confidence": 0.75},
            (3, 12): {"code": "3RD_12TH", "text": "Courage and losses linked. Expenses on travel or siblings. Spiritual strength through solitary efforts.", "confidence": 0.68},
            (4, 5): {"code": "4TH_5TH", "text": "Home and creativity intertwined. Gains from children, education, or property. Happy and creative domestic life.", "confidence": 0.75},
            (4, 6): {"code": "4TH_6TH", "text": "Home and conflicts connected. Disputes over property or mother’s health. Success in service away from home.", "confidence": 0.68},
            (4, 7): {"code": "4TH_7TH", "text": "Home and partnerships blended. Gains property through marriage or business. Stable and happy domestic life.", "confidence": 0.75},
            (4, 8): {"code": "4TH_8TH", "text": "Home and transformation linked. Inheritance or sudden changes in domestic life. Hidden family issues.", "confidence": 0.70},
            (4, 9): {"code": "4TH_9TH", "text": "Home and fortune intertwined. Gains property through father or higher learning. Righteous domestic life.", "confidence": 0.76},
            (4, 10): {"code": "4TH_10TH", "text": "Home and career connected. Success in real estate, agriculture, or public service. Comfort from profession.", "confidence": 0.76},
            (4, 11): {"code": "4TH_11TH", "text": "Home and gains blended. Gains property through social networks. Fulfills domestic desires.", "confidence": 0.75},
            (4, 12): {"code": "4TH_12TH", "text": "Home and losses linked. Loss of property or detachment from homeland. Distant mother relationship.", "confidence": 0.68},
            (5, 6): {"code": "5TH_6TH", "text": "Creativity and conflicts connected. Challenges with children or education. Success in competitive fields.", "confidence": 0.68},
            (5, 7): {"code": "5TH_7TH", "text": "Creativity and partnerships intertwined. Romantic or business success through intelligence and creativity.", "confidence": 0.76},
            (5, 8): {"code": "5TH_8TH", "text": "Creativity and transformation linked. Sudden gains or challenges with children. Research-oriented intellect.", "confidence": 0.70},
            (5, 9): {"code": "5TH_9TH", "text": "Creativity and fortune blended (Raja Yoga). Wise children and success in teaching or speculation.", "confidence": 0.78},
            (5, 10): {"code": "5TH_10TH", "text": "Creativity and career intertwined. Success in entertainment, politics, or creative professions.", "confidence": 0.77},
            (5, 11): {"code": "5TH_11TH", "text": "Creativity and gains connected. Wealth through children, speculation, or creative ventures.", "confidence": 0.77},
            (5, 12): {"code": "5TH_12TH", "text": "Creativity and spirituality linked. Losses in speculation or spiritual creativity. Foreign education.", "confidence": 0.68},
            (6, 7): {"code": "6TH_7TH", "text": "Conflicts and partnerships connected. Disputes in marriage or business. Success in legal partnerships.", "confidence": 0.68},
            (6, 8): {"code": "6TH_8TH", "text": "Conflicts and transformation blended (Viparita Raja Yoga). Overcomes enemies for unearned gains.", "confidence": 0.72},
            (6, 9): {"code": "6TH_9TH", "text": "Conflicts and fortune linked. Success in law or service after overcoming obstacles.", "confidence": 0.70},
            (6, 10): {"code": "6TH_10TH", "text": "Conflicts and career connected. Success in service-oriented fields like law or medicine.", "confidence": 0.72},
            (6, 11): {"code": "6TH_11TH", "text": "Conflicts and gains linked. Gains through overcoming enemies or service. Challenging social circle.", "confidence": 0.70},
            (6, 12): {"code": "6TH_12TH", "text": "Conflicts and losses blended (Viparita Raja Yoga). Success through overcoming hidden enemies.", "confidence": 0.72},
            (7, 8): {"code": "7TH_8TH", "text": "Partnerships and transformation connected. Marriage or business faces sudden changes or secrets.", "confidence": 0.70},
            (7, 9): {"code": "7TH_9TH", "text": "Partnerships and fortune intertwined. Lucky marriage or business with wise, righteous partner.", "confidence": 0.78},
            (7, 10): {"code": "7TH_10TH", "text": "Partnerships and career blended. Success through business or marriage enhances public status.", "confidence": 0.77},
            (7, 11): {"code": "7TH_11TH", "text": "Partnerships and gains connected. Wealth and desires fulfilled through spouse or business.", "confidence": 0.76},
            (7, 12): {"code": "7TH_12TH", "text": "Partnerships and spirituality linked. Foreign or private relationships. Potential for separation.", "confidence": 0.68},
            (8, 9): {"code": "8TH_9TH", "text": "Transformation and fortune connected. Gains through inheritance or occult wisdom. Challenges with father.", "confidence": 0.70},
            (8, 10): {"code": "8TH_10TH", "text": "Transformation and career linked. Success in research, psychology, or transformative fields.", "confidence": 0.72},
            (8, 11): {"code": "8TH_11TH", "text": "Transformation and gains connected. Unearned wealth or sudden losses through social networks.", "confidence": 0.70},
            (8, 12): {"code": "8TH_12TH", "text": "Transformation and spirituality blended (Viparita Raja Yoga). Spiritual growth through hidden gains.", "confidence": 0.72},
            (9, 10): {"code": "9TH_10TH", "text": "Fortune and career intertwined (Raja Yoga). Success in teaching, law, or high-status roles.", "confidence": 0.80},
            (9, 11): {"code": "9TH_11TH", "text": "Fortune and gains blended. Wealth and desires fulfilled through higher learning or father.", "confidence": 0.78},
            (9, 12): {"code": "9TH_12TH", "text": "Fortune and spirituality connected. Gains through foreign travel or spiritual pursuits.", "confidence": 0.70},
            (10, 11): {"code": "10TH_11TH", "text": "Career and gains intertwined. Professional success leads to wealth and fulfilled desires.", "confidence": 0.79},
            (10, 12): {"code": "10TH_12TH", "text": "Career and spirituality linked. Success in foreign lands or spiritual institutions. Possible setbacks.", "confidence": 0.68},
            (11, 12): {"code": "11TH_12TH", "text": "Gains and losses connected. Wealth from foreign sources, but expenses may challenge fulfillment.", "confidence": 0.70}
        }

    def evaluate(self, profile_id, planets_data, ascendant_sign):
        """Evaluate house Parivartana Yoga for predictions based on ascendant."""
        import logging
        logger = logging.getLogger(__name__)
        try:
            predictions = []
            if ascendant_sign not in self.ascendant_lord_map:
                logger.error(f"Invalid ascendant sign: {ascendant_sign}")
                return predictions

            # Get house lords for the ascendant
            lord_map = self.ascendant_lord_map[ascendant_sign]
            # Create a planet-to-sign mapping from planets_data
            planet_signs = {planet["planet_name"]: planet["sign"] for planet in planets_data}

            # Check for Parivartana Yoga (exchange of signs between house lords)
            for house1 in range(1, 13):
                for house2 in range(house1 + 1, 13):
                    # Skip invalid pairs (same lord)
                    lord1, sign1 = lord_map[house1]
                    lord2, sign2 = lord_map[house2]
                    if lord1 == lord2:
                        continue
                    # Check if lords are in each other's signs
                    if (planet_signs.get(lord1) == sign2 and planet_signs.get(lord2) == sign1):
                        pair = tuple(sorted([house1, house2]))
                        if pair in self.prediction_matrix:
                            prediction = self.prediction_matrix[pair]
                            predictions.append({
                                "prediction_code": f"{ascendant_sign.upper()}_{prediction['code']}",
                                "text": prediction["text"],
                                "confidence": prediction["confidence"],
                                "source_rule": "HOUSE_PARIVARTANA_YOGA",
                                "profile_id": profile_id
                            })
                            logger.debug(f"Generated prediction: {prediction['code']} for {ascendant_sign} houses {house1}-{house2}")
            
            logger.info(f"Generated {len(predictions)} Parivartana Yoga predictions for profile {profile_id}, ascendant {ascendant_sign}")
            return predictions
        except Exception as e:
            logger.error(f"Error evaluating house Parivartana Yoga rule: {e}")
            raise