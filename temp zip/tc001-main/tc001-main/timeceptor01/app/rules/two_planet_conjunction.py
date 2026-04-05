class TwoPlanetConjunctionRule:
    def __init__(self):
        # Dictionary of conjunction predictions for planet pairs in the same sign
        self.conjunction_matrix = {
            ("Sun", "Moon"): {"code": "SUN_MOON_CONJ", "text": "Emotionally expressive leadership: Combines authoritative presence with emotional sensitivity. Can be charismatic but moody, with a strong need for public recognition and emotional connection. Success in nurturing or public-facing roles.", "confidence": 0.75},
            ("Sun", "Mars"): {"code": "SUN_MARS_CONJ", "text": "Dynamic and assertive leadership: Blends strong ego with aggressive energy. Highly ambitious, courageous, and competitive, but prone to conflicts and impulsiveness. Thrives in leadership, military, or high-energy fields.", "confidence": 0.76},
            ("Sun", "Mercury"): {"code": "SUN_MERCURY_CONJ", "text": "Intellectual authority: Merges leadership with sharp intellect. Brilliant communicators and strategists, often excelling in writing, teaching, or public speaking. Can be ego-driven in ideas, needing to balance pride with logic.", "confidence": 0.78},
            ("Sun", "Jupiter"): {"code": "SUN_JUPITER_CONJ", "text": "Fortunate and wise leadership: Combines authority with optimism and wisdom. Charismatic, generous, and respected, often succeeding in teaching, philosophy, or high-status roles. May be overly confident or extravagant.", "confidence": 0.80},
            ("Sun", "Venus"): {"code": "SUN_VENUS_CONJ", "text": "Charismatic and artistic presence: Fuses leadership with charm and creativity. Attractive, sociable, and artistic, excelling in arts, diplomacy, or luxury fields. May struggle with balancing ego and relationships.", "confidence": 0.76},
            ("Sun", "Saturn"): {"code": "SUN_SATURN_CONJ", "text": "Disciplined authority: Blends leadership with responsibility and hard work. Serious, ambitious, and persistent, building success slowly. Can face self-doubt or restrictions, needing patience to achieve recognition.", "confidence": 0.72},
            ("Sun", "Rahu"): {"code": "SUN_RAHU_CONJ", "text": "Ambitious and unconventional fame: Merges ego with obsessive ambition. Charismatic and driven, often achieving fame through unconventional means. Can face sudden ups and downs or identity crises.", "confidence": 0.74},
            ("Sun", "Ketu"): {"code": "SUN_KETU_CONJ", "text": "Spiritual and detached leadership: Combines authority with spiritual detachment. May feel disconnected from worldly success, drawn to mysticism or service. Can struggle with ego dissolution but gain profound insight.", "confidence": 0.70},
            ("Sun", "Uranus"): {"code": "SUN_URANUS_CONJ", "text": "Rebellious leadership: Fuses authority with innovation and rebellion. Highly original, independent, and visionary, often leading change. Prone to sudden shifts in identity or public image.", "confidence": 0.74},
            ("Sun", "Neptune"): {"code": "SUN_NEPTUNE_CONJ", "text": "Idealistic and visionary presence: Blends leadership with compassion and imagination. Charismatic, artistic, and spiritual, but may face illusions or identity confusion. Excels in creative or humanitarian roles.", "confidence": 0.72},
            ("Sun", "Pluto"): {"code": "SUN_PLUTO_CONJ", "text": "Transformative power: Merges authority with intense transformation. Magnetic, secretive, and driven, often wielding significant influence. Can face power struggles or profound personal rebirths.", "confidence": 0.76},
            ("Moon", "Mars"): {"code": "MOON_MARS_CONJ", "text": "Emotional intensity: Combines sensitive emotions with aggressive energy. Passionate, impulsive, and protective, but prone to mood swings and conflicts. Success in dynamic, nurturing roles.", "confidence": 0.72},
            ("Moon", "Mercury"): {"code": "MOON_MERCURY_CONJ", "text": "Emotionally intelligent communicator: Blends emotional sensitivity with sharp intellect. Intuitive, talkative, and adaptable, excelling in writing, counseling, or media. Can be overly sensitive to criticism.", "confidence": 0.76},
            ("Moon", "Jupiter"): {"code": "MOON_JUPITER_CONJ", "text": "Emotionally fortunate: Merges nurturing emotions with optimism and wisdom. Generous, empathetic, and lucky, often succeeding in teaching or caregiving. May be overly indulgent or idealistic.", "confidence": 0.78},
            ("Moon", "Venus"): {"code": "MOON_VENUS_CONJ", "text": "Emotionally charming: Combines emotional depth with beauty and charm. Loving, artistic, and sociable, excelling in arts, relationships, or hospitality. Seeks emotional and aesthetic harmony.", "confidence": 0.76},
            ("Moon", "Saturn"): {"code": "MOON_SATURN_CONJ", "text": "Emotionally disciplined: Blends sensitivity with responsibility. Reserved, serious, and duty-bound, often facing emotional hardships. Builds emotional stability through discipline.", "confidence": 0.70},
            ("Moon", "Rahu"): {"code": "MOON_RAHU_CONJ", "text": "Emotionally obsessive: Merges emotions with intense ambition. Highly intuitive but prone to anxiety or obsession. Can achieve success in unconventional or foreign fields, but faces emotional turbulence.", "confidence": 0.72},
            ("Moon", "Ketu"): {"code": "MOON_KETU_CONJ", "text": "Emotionally detached: Combines sensitivity with spiritual detachment. Psychic, introspective, and drawn to mysticism, but may feel emotionally isolated. Seeks inner peace over external validation.", "confidence": 0.70},
            ("Moon", "Uranus"): {"code": "MOON_URANUS_CONJ", "text": "Emotionally unpredictable: Blends emotions with rebellion and innovation. Highly intuitive but prone to sudden mood swings. Seeks freedom in emotional expression, often unconventional.", "confidence": 0.72},
            ("Moon", "Neptune"): {"code": "MOON_NEPTUNE_CONJ", "text": "Emotionally dreamy: Merges sensitivity with idealism and intuition. Highly compassionate and artistic, but prone to escapism or illusion. Excels in creative or spiritual pursuits.", "confidence": 0.74},
            ("Moon", "Pluto"): {"code": "MOON_PLUTO_CONJ", "text": "Emotionally transformative: Combines deep emotions with intense transformation. Powerful, secretive, and prone to emotional crises. Can excel in psychology or healing, but faces intense inner struggles.", "confidence": 0.74},
            ("Mars", "Mercury"): {"code": "MARS_MERCURY_CONJ", "text": "Aggressive communicator: Blends energy with intellect. Sharp-witted, argumentative, and strategic, excelling in debates or technical fields. Can be impulsive in speech, needing to temper aggression.", "confidence": 0.74},
            ("Mars", "Jupiter"): {"code": "MARS_JUPITER_CONJ", "text": "Courageous wisdom: Combines aggressive energy with optimism and philosophy. Bold, enthusiastic, and righteous, excelling in teaching, law, or exploration. May be overzealous or reckless.", "confidence": 0.78},
            ("Mars", "Venus"): {"code": "MARS_VENUS_CONJ", "text": "Passionate charm: Merges aggressive energy with beauty and charm. Intense, passionate, and romantic, excelling in arts or relationships. Can face conflicts in love due to impulsiveness.", "confidence": 0.74},
            ("Mars", "Saturn"): {"code": "MARS_SATURN_CONJ", "text": "Disciplined energy: Blends aggression with restraint. Hard-working, persistent, and strategic, but prone to frustration or delays. Success in engineering, military, or structured fields.", "confidence": 0.72},
            ("Mars", "Rahu"): {"code": "MARS_RAHU_CONJ", "text": "Explosive ambition: Combines aggressive energy with obsession. Highly driven and risk-taking, often succeeding in unconventional fields. Prone to sudden conflicts or accidents.", "confidence": 0.74},
            ("Mars", "Ketu"): {"code": "MARS_KETU_CONJ", "text": "Spiritual warrior: Merges aggression with detachment. Courageous but undirected, drawn to spiritual or mystical pursuits. Can face sudden losses or act impulsively without purpose.", "confidence": 0.70},
            ("Mars", "Uranus"): {"code": "MARS_URANUS_CONJ", "text": "Rebellious energy: Blends aggression with innovation. Explosive, unpredictable, and visionary, excelling in technology or revolutionary fields. Prone to sudden conflicts or accidents.", "confidence": 0.74},
            ("Mars", "Neptune"): {"code": "MARS_NEPTUNE_CONJ", "text": "Inspired action: Combines energy with idealism. Passionate but undirected, drawn to artistic or spiritual causes. Can be prone to confusion or misdirected aggression.", "confidence": 0.70},
            ("Mars", "Pluto"): {"code": "MARS_PLUTO_CONJ", "text": "Transformative force: Merges aggression with intense power. Ruthlessly driven and transformative, excelling in high-stakes fields like surgery or strategy. Prone to power struggles or crises.", "confidence": 0.76},
            ("Mercury", "Jupiter"): {"code": "MERCURY_JUPITER_CONJ", "text": "Wise intellect: Blends sharp intellect with philosophy and optimism. Brilliant, articulate, and learned, excelling in teaching, writing, or law. May be overly verbose or idealistic.", "confidence": 0.80},
            ("Mercury", "Venus"): {"code": "MERCURY_VENUS_CONJ", "text": "Artistic intellect: Combines intellect with charm and creativity. Eloquent, diplomatic, and artistic, excelling in writing, arts, or diplomacy. Seeks harmony in communication.", "confidence": 0.76},
            ("Mercury", "Saturn"): {"code": "MERCURY_SATURN_CONJ", "text": "Disciplined intellect: Merges sharp mind with structure and discipline. Methodical, serious, and analytical, excelling in science or research. Can face communication delays or self-doubt.", "confidence": 0.72},
            ("Mercury", "Rahu"): {"code": "MERCURY_RAHU_CONJ", "text": "Cunning ambition: Blends intellect with obsessive drive. Brilliant but manipulative, excelling in media, technology, or foreign trade. Prone to deception or overthinking.", "confidence": 0.74},
            ("Mercury", "Ketu"): {"code": "MERCURY_KETU_CONJ", "text": "Spiritual intellect: Combines intellect with detachment. Intuitive and insightful, drawn to mystical or abstract thinking. Can struggle with clarity or focus in communication.", "confidence": 0.70},
            ("Mercury", "Uranus"): {"code": "MERCURY_URANUS_CONJ", "text": "Innovative intellect: Merges sharp mind with rebellion and originality. Genius-level ideas, excelling in technology or science. Prone to erratic or disruptive communication.", "confidence": 0.74},
            ("Mercury", "Neptune"): {"code": "MERCURY_NEPTUNE_CONJ", "text": "Imaginative intellect: Blends intellect with intuition and creativity. Poetic, visionary, and artistic, but prone to confusion or miscommunication. Excels in writing or spiritual communication.", "confidence": 0.72},
            ("Mercury", "Pluto"): {"code": "MERCURY_PLUTO_CONJ", "text": "Penetrating intellect: Combines sharp mind with transformative power. Deeply analytical and persuasive, excelling in research or psychology. Can be obsessive or secretive in communication.", "confidence": 0.74},
            ("Jupiter", "Venus"): {"code": "JUPITER_VENUS_CONJ", "text": "Fortunate harmony: Blends wisdom with beauty and charm. Generous, artistic, and lucky, excelling in arts, teaching, or luxury fields. May be indulgent or overly idealistic.", "confidence": 0.78},
            ("Jupiter", "Saturn"): {"code": "JUPITER_SATURN_CONJ", "text": "Balanced wisdom: Merges optimism with discipline. Practical, responsible, and wise, building success through structure and ethics. Can face delays or conflicts between growth and restraint.", "confidence": 0.74},
            ("Jupiter", "Rahu"): {"code": "JUPITER_RAHU_CONJ", "text": "Ambitious wisdom: Combines philosophy with obsessive drive. Charismatic and visionary, often succeeding in foreign or unconventional fields. Prone to overambition or scandal.", "confidence": 0.76},
            ("Jupiter", "Ketu"): {"code": "JUPITER_KETU_CONJ", "text": "Spiritual wisdom: Blends philosophy with detachment. Highly spiritual and intuitive, drawn to mysticism or teaching. May lack worldly ambition but gains profound insight.", "confidence": 0.74},
            ("Jupiter", "Uranus"): {"code": "JUPITER_URANUS_CONJ", "text": "Innovative philosophy: Merges wisdom with rebellion and originality. Visionary and progressive, excelling in education or social reform. Prone to sudden shifts in beliefs.", "confidence": 0.76},
            ("Jupiter", "Neptune"): {"code": "JUPITER_NEPTUNE_CONJ", "text": "Mystical wisdom: Combines philosophy with idealism and intuition. Highly spiritual and compassionate, excelling in arts or spiritual leadership. Prone to illusion or over-idealism.", "confidence": 0.74},
            ("Jupiter", "Pluto"): {"code": "JUPITER_PLUTO_CONJ", "text": "Transformative wisdom: Blends philosophy with intense power. Charismatic and influential, often transforming beliefs or institutions. Can be prone to fanaticism or power struggles.", "confidence": 0.76},
            ("Venus", "Saturn"): {"code": "VENUS_SATURN_CONJ", "text": "Disciplined charm: Merges beauty with responsibility. Reserved, loyal, and practical in relationships, building stable bonds through effort. Can face delays or hardships in love.", "confidence": 0.72},
            ("Venus", "Rahu"): {"code": "VENUS_RAHU_CONJ", "text": "Obsessive romance: Combines charm with intense ambition. Passionate and unconventional in love, often attracted to foreign or taboo partners. Prone to excess or scandal in relationships.", "confidence": 0.74},
            ("Venus", "Ketu"): {"code": "VENUS_KETU_CONJ", "text": "Spiritual love: Blends charm with detachment. Seeks spiritual or platonic connections, often detached from physical pleasure. Can face romantic disillusionment but gains inner beauty.", "confidence": 0.70},
            ("Venus", "Uranus"): {"code": "VENUS_URANUS_CONJ", "text": "Unconventional romance: Merges charm with rebellion. Seeks freedom and excitement in relationships, often attracted to unique partners. Prone to sudden romantic changes.", "confidence": 0.74},
            ("Venus", "Neptune"): {"code": "VENUS_NEPTUNE_CONJ", "text": "Idealistic romance: Combines charm with dreamy idealism. Highly romantic and artistic, seeking soulmate connections. Prone to illusion or disappointment in love.", "confidence": 0.74},
            ("Venus", "Pluto"): {"code": "VENUS_PLUTO_CONJ", "text": "Transformative romance: Blends charm with intense power. Passionate and magnetic in love, often facing transformative relationships. Can be prone to obsession or control.", "confidence": 0.76},
            ("Saturn", "Rahu"): {"code": "SATURN_RAHU_CONJ", "text": "Ambitious discipline: Combines restraint with obsessive drive. Hard-working and strategic, often succeeding in unconventional fields. Can face karmic challenges or sudden obstacles.", "confidence": 0.74},
            ("Saturn", "Ketu"): {"code": "SATURN_KETU_CONJ", "text": "Spiritual discipline: Blends responsibility with detachment. Ascetic, disciplined, and drawn to spiritual liberation. May face isolation or struggle with worldly duties.", "confidence": 0.72},
            ("Saturn", "Uranus"): {"code": "SATURN_URANUS_CONJ", "text": "Structured rebellion: Merges discipline with innovation. Practical yet visionary, building revolutionary structures. Can face tension between tradition and change.", "confidence": 0.74},
            ("Saturn", "Neptune"): {"code": "SATURN_NEPTUNE_CONJ", "text": "Structured idealism: Combines discipline with compassion. Practical yet spiritual, working towards humanitarian or artistic goals. Can face confusion or delays in ideals.", "confidence": 0.72},
            ("Saturn", "Pluto"): {"code": "SATURN_PLUTO_CONJ", "text": "Transformative discipline: Blends restraint with intense power. Ruthlessly disciplined and strategic, building lasting structures. Can face power struggles or heavy responsibilities.", "confidence": 0.76},
            ("Rahu", "Ketu"): {"code": "RAHU_KETU_CONJ", "text": "Karmic polarity: Combines obsession with detachment. Intense inner conflict between worldly ambition and spiritual liberation. Can lead to profound spiritual growth or confusion.", "confidence": 0.70},
            ("Rahu", "Uranus"): {"code": "RAHU_URANUS_CONJ", "text": "Unconventional ambition: Merges obsession with rebellion. Highly driven and innovative, excelling in technology or radical fields. Prone to sudden upheavals or notoriety.", "confidence": 0.76},
            ("Rahu", "Neptune"): {"code": "RAHU_NEPTUNE_CONJ", "text": "Obsessive idealism: Combines ambition with dreamy intuition. Charismatic and visionary, drawn to spiritual or artistic pursuits. Prone to illusion or deception in ambitions.", "confidence": 0.72},
            ("Rahu", "Pluto"): {"code": "RAHU_PLUTO_CONJ", "text": "Obsessive power: Blends intense ambition with transformative force. Ruthlessly driven, often achieving great power or wealth. Prone to extreme crises or scandals.", "confidence": 0.76},
            ("Ketu", "Uranus"): {"code": "KETU_URANUS_CONJ", "text": "Spiritual rebellion: Combines detachment with innovation. Seeks freedom through spiritual or unconventional paths. Can be erratic or disconnected from worldly goals.", "confidence": 0.72},
            ("Ketu", "Neptune"): {"code": "KETU_NEPTUNE_CONJ", "text": "Mystical detachment: Blends spiritual detachment with intuition. Highly psychic and drawn to mysticism, but prone to escapism or confusion. A natural visionary or healer.", "confidence": 0.74},
            ("Ketu", "Pluto"): {"code": "KETU_PLUTO_CONJ", "text": "Transformative spirituality: Combines detachment with intense transformation. Seeks liberation through profound inner change. Can face karmic crises or deep spiritual insights.", "confidence": 0.74},
            ("Uranus", "Neptune"): {"code": "URANUS_NEPTUNE_CONJ", "text": "Visionary rebellion: Blends innovation with idealism. Revolutionary and compassionate, drawn to social reform or spiritual innovation. Prone to confusion or erratic ideals.", "confidence": 0.74},
            ("Uranus", "Pluto"): {"code": "URANUS_PLUTO_CONJ", "text": "Revolutionary power: Combines rebellion with transformative force. A powerful catalyst for change, excelling in radical or transformative fields. Prone to extreme upheaval.", "confidence": 0.76},
            ("Neptune", "Pluto"): {"code": "NEPTUNE_PLUTO_CONJ", "text": "Mystical transformation: Blends idealism with intense power. Profoundly spiritual and transformative, drawn to deep healing or mysticism. Can face illusion or power struggles.", "confidence": 0.76}
        }

    def evaluate(self, profile_id, planets_data):
        """Evaluate two-planet conjunctions in the same sign for predictions."""
        import logging
        logger = logging.getLogger(__name__)
        try:
            predictions = []
            # Create a dictionary to group planets by sign
            sign_groups = {}
            for planet in planets_data:
                planet_name = planet.get("planet_name")
                sign = planet.get("sign")
                if sign not in sign_groups:
                    sign_groups[sign] = []
                sign_groups[sign].append(planet_name)

            # Check for conjunctions (two planets in the same sign)
            for sign, planets in sign_groups.items():
                if len(planets) >= 2:
                    # Generate all possible pairs
                    for i in range(len(planets)):
                        for j in range(i + 1, len(planets)):
                            planet_pair = tuple(sorted([planets[i], planets[j]]))
                            if planet_pair in self.conjunction_matrix:
                                prediction = self.conjunction_matrix[planet_pair]
                                predictions.append({
                                    "prediction_code": prediction["code"],
                                    "text": prediction["text"],
                                    "confidence": prediction["confidence"],
                                    "source_rule": "TWO_PLANET_CONJUNCTION",
                                    "profile_id": profile_id
                                })
                                logger.debug(f"Generated prediction: {prediction['code']} for {planet_pair} in sign {sign}")
            logger.info(f"Generated {len(predictions)} two-planet conjunction predictions for profile {profile_id}")
            return predictions
        except Exception as e:
            logger.error(f"Error evaluating two-planet conjunction rule: {e}")
            raise