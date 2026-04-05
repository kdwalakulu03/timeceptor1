class PlanetSittingRule:
    def __init__(self):
        # 12x12 prediction matrix for planet placements
        self.prediction_matrix = {
            "Sun": {
                "1st": {"code": "SUN_1ST", "text": "Strong & Authoritative: A natural leader with a strong ego and vitality. Can be proud or self-centered. Commands respect and has a powerful presence.", "confidence": 0.80},
                "2nd": {"code": "SUN_2ND", "text": "Gains through Authority: Wealth and status tied to government or leadership. Proud of family lineage. Speech is authoritative but can be harsh.", "confidence": 0.74},
                "3rd": {"code": "SUN_3RD", "text": "Courageous & Authoritative: A powerful communicator and a leader among siblings or peers. Strong willpower and success through personal effort and writing.", "confidence": 0.72},
                "4th": {"code": "SUN_4TH", "text": "Leadership at Home: Takes a leading role in domestic affairs. Pride in home and heritage. May gain property or vehicles. Can indicate conflicts at home due to ego.", "confidence": 0.73},
                "5th": {"code": "SUN_5TH", "text": "Creative & Theatrical: A natural leader in creative fields, romance, and with children. Can be proud of their intelligence. Good for politics and performance.", "confidence": 0.76},
                "6th": {"code": "SUN_6TH", "text": "Victory over Enemies: A strong leader in service-oriented roles. Can overcome enemies and obstacles. Good for a career in law or medicine, but can affect health.", "confidence": 0.68},
                "7th": {"code": "SUN_7TH", "text": "Dominant Partner: Seeks a powerful, authoritative partner. Relationships are central to life but can involve ego clashes. Good for public life and business.", "confidence": 0.74},
                "8th": {"code": "SUN_8TH", "text": "Hidden Power: Interest in research, psychology, occult, or inheritance. May have a crisis of identity leading to transformation. Can affect longevity or father's health.", "confidence": 0.68},
                "9th": {"code": "SUN_9TH", "text": "Fortunate & Righteous: A natural leader with high morals. Respected, follows a path of dharma. Good relationship with father. Success in higher education.", "confidence": 0.78},
                "10th": {"code": "SUN_10TH", "text": "Powerful Career: A natural leader with high status and public recognition. A career in government, leadership, or as a public figure is likely. Ambitious and driven.", "confidence": 0.82},
                "11th": {"code": "SUN_11TH", "text": "Gains from Authority: Gains wealth and fulfills desires through government, father, or leadership positions. Has powerful and influential friends.", "confidence": 0.76},
                "12th": {"code": "SUN_12TH", "text": "Leadership in Isolation: A career in foreign lands, hospitals, or spiritual institutions. May face a loss of ego leading to spiritual growth. Father may be distant.", "confidence": 0.68}
            },
            "Moon": {
                "1st": {"code": "MOON_1ST", "text": "Emotional & Sensitive: Personality is driven by feelings. Nurturing, changeable moods. Public-oriented and seeks emotional connection.", "confidence": 0.76},
                "2nd": {"code": "MOON_2ND", "text": "Fluctuating Finances: Emotional state is tied to financial security. Gains through public, liquids, or nurturing professions. A pleasant and persuasive speaker.", "confidence": 0.73},
                "3rd": {"code": "MOON_3RD", "text": "Emotional Communication: Communication is driven by feelings. Enjoys short trips and has a nurturing bond with siblings. Mind is active and curious.", "confidence": 0.72},
                "4th": {"code": "MOON_4TH", "text": "Needs a Secure Home: Emotional well-being is tied to home and mother. A nurturing home life is essential. Can be a homebody. Prone to emotional fluctuations.", "confidence": 0.75},
                "5th": {"code": "MOON_5TH", "text": "Emotional Creativity: Creativity and romance are driven by emotions. A nurturing and caring parent. Finds joy in children and creative expression.", "confidence": 0.74},
                "6th": {"code": "MOON_6TH", "text": "Emotional Work Life: Mind is focused on daily work, health, and service. Can be a worrier. Finds emotional fulfillment through helping others.", "confidence": 0.68},
                "7th": {"code": "MOON_7TH", "text": "Nurturing Partner: Seeks an emotional and supportive partner. Marriage is key to emotional well-being. Partner may be a public figure.", "confidence": 0.74},
                "8th": {"code": "MOON_8TH", "text": "Emotional Turmoil: A deep, intuitive, and psychic mind. Prone to anxiety and emotional secrets. May gain from partner's resources or inheritance.", "confidence": 0.68},
                "9th": {"code": "MOON_9TH", "text": "Emotional Connection to Beliefs: A nurturing and philosophical nature. Finds emotional comfort in travel, religion, or higher learning.", "confidence": 0.76},
                "10th": {"code": "MOON_10TH", "text": "Public-Facing Career: Career is tied to the public, emotions, and nurturing. Success in fields like hospitality, nursing, or public service. Reputation fluctuates.", "confidence": 0.77},
                "11th": {"code": "MOON_11TH", "text": "Gains from the Public: Income from public-facing roles. A wide social network. Emotional fulfillment through friendships and achieving goals.", "confidence": 0.75},
                "12th": {"code": "MOON_12TH", "text": "Emotional Isolation: A sensitive mind prone to solitude and escapism. Finds comfort in dreams, meditation, or foreign lands. Can indicate psychic ability.", "confidence": 0.68}
            },
            "Mars": {
                "1st": {"code": "MARS_1ST", "text": "Assertive & Energetic: Courageous, impulsive, and competitive. A dynamic personality that acts first. Prone to conflict but also a powerful initiator.", "confidence": 0.76},
                "2nd": {"code": "MARS_2ND", "text": "Aggressive Finances: Spends energy on accumulating wealth. Can be impulsive with money, leading to both gains and losses. Argumentative speech.", "confidence": 0.70},
                "3rd": {"code": "MARS_3RD", "text": "Powerful Initiative: Extremely courageous and competitive. A go-getter who succeeds through bold action. Excels in sports, marketing, or hands-on skills.", "confidence": 0.78},
                "4th": {"code": "MARS_4TH", "text": "Domestic Action: Puts energy into home and property. Can indicate conflicts or arguments within the family. Protects the home fiercely. Prone to accidents with vehicles.", "confidence": 0.70},
                "5th": {"code": "MARS_5TH", "text": "Competitive Creativity: Passionate and competitive in romance, sports, and creative pursuits. Can be impulsive in love affairs and investments.", "confidence": 0.74},
                "6th": {"code": "MARS_6TH", "text": "Fights Hard: A powerful competitor who actively works to defeat enemies and obstacles. Can lead to success in law or military, but also injuries or disputes.", "confidence": 0.72},
                "7th": {"code": "MARS_7TH", "text": "Argumentative Partner: Relationships can be passionate but also full of conflict. A competitive partner. Success in business partnerships requires managing disputes.", "confidence": 0.68},
                "8th": {"code": "MARS_8TH", "text": "Sudden Energy/Accidents: Prone to sudden events, accidents, or surgery. Energy is directed towards research or uncovering secrets. A powerful but volatile placement.", "confidence": 0.68},
                "9th": {"code": "MARS_9TH", "text": "Courageous Beliefs: Actively pursues philosophy, religion, and higher knowledge. A warrior for their beliefs. May have conflicts with teachers or father.", "confidence": 0.74},
                "10th": {"code": "MARS_10TH", "text": "Ambitious Career: A powerful drive for success in career. A competitive and energetic approach to work. Success in military, surgery, engineering, or sports.", "confidence": 0.78},
                "11th": {"code": "MARS_11TH", "text": "Gains through Action: Fulfills desires through courage, enterprise, and taking initiative. Friends are energetic and competitive.", "confidence": 0.75},
                "12th": {"code": "MARS_12TH", "text": "Hidden Energy: Energy can be wasted or directed towards secret enemies. Prone to frustration or hospitalization. Courage is applied to spiritual battles.", "confidence": 0.68}
            },
            "Mercury": {
                "1st": {"code": "MERCURY_1ST", "text": "Intelligent & Communicative: A witty, curious, and talkative nature. Youthful appearance. Identifies strongly with their intellect and ideas.", "confidence": 0.76},
                "2nd": {"code": "MERCURY_2ND", "text": "Financial Skill: Earns through communication, trade, or intellect. A skilled negotiator and financial planner. Family life is filled with communication.", "confidence": 0.74},
                "3rd": {"code": "MERCURY_3RD", "text": "Skilled Communicator: A master of language, writing, and media. A quick learner with many hobbies. Excellent in business and negotiations.", "confidence": 0.78},
                "4th": {"code": "MERCURY_4TH", "text": "Happy & Intellectual Home: Home life is full of learning and communication. Enjoys intellectual discussions with family. May work from home or in real estate.", "confidence": 0.74},
                "5th": {"code": "MERCURY_5TH", "text": "Intellectual Creativity: A skilled writer, strategist, or speculator. Enjoys puzzles, games, and intellectual hobbies. A witty and playful romantic partner.", "confidence": 0.76},
                "6th": {"code": "MERCURY_6TH", "text": "Analytical Problem-Solver: Uses intellect to solve problems and manage conflicts. A skilled debater or critic. Career in health, law, or service.", "confidence": 0.70},
                "7th": {"code": "MERCURY_7TH", "text": "Communicative Partner: Seeks an intelligent, youthful, and talkative partner. Good communication is key to relationships. Success in business contracts.", "confidence": 0.74},
                "8th": {"code": "MERCURY_8TH", "text": "Investigative Mind: A natural researcher, detective, or psychologist. Communication is about hidden matters. May uncover family secrets.", "confidence": 0.68},
                "9th": {"code": "MERCURY_9TH", "text": "Educated Mind: Success in higher learning, publishing, or teaching. Home may be a center for learning. An intellectual approach to philosophy.", "confidence": 0.76},
                "10th": {"code": "MERCURY_10TH", "text": "Career in Communication: A career in writing, media, marketing, technology, or business. A skilled public speaker and strategist.", "confidence": 0.78},
                "11th": {"code": "MERCURY_11TH", "text": "Gains through Intellect: Fulfills desires through communication, business, and networking. Has many intelligent and influential friends.", "confidence": 0.76},
                "12th": {"code": "MERCURY_12TH", "text": "Research & Foreign Lands: Intellect is focused on research, hidden matters, or foreign languages. May have secret communications or travel for learning.", "confidence": 0.68}
            },
            "Jupiter": {
                "1st": {"code": "JUPITER_1ST", "text": "Optimistic & Wise: A generous, philosophical, and fortunate individual. Often respected as a teacher or guide. Has a positive and expansive outlook on life.", "confidence": 0.80},
                "2nd": {"code": "JUPITER_2ND", "text": "Fortunate with Wealth: Attracts financial abundance. Gains through teaching, advising, or righteous means. A wise and truthful speaker. From a respected family.", "confidence": 0.76},
                "3rd": {"code": "JUPITER_3RD", "text": "Wise Communication: A gifted teacher, writer, or advisor. Communication is philosophical and inspiring. Good relationship with siblings. Enjoys learning.", "confidence": 0.74},
                "4th": {"code": "JUPITER_4TH", "text": "Happy & Expansive Home: A large, comfortable home. Happiness from mother and family. Gains through property and education. A very fortunate placement.", "confidence": 0.76},
                "5th": {"code": "JUPITER_5TH", "text": "Wise & Fortunate Children: Highly intelligent and creative. Blessed with good children and luck in speculation. A gifted teacher or advisor.", "confidence": 0.78},
                "6th": {"code": "JUPITER_6TH", "text": "Wise in Conflict: Overcomes challenges through wisdom and ethics. Success in teaching law or health. Children may face some difficulties.", "confidence": 0.70},
                "7th": {"code": "JUPITER_7TH", "text": "Wise & Fortunate Partner: A blessed and happy marriage to a respectable, philosophical partner. Success in business partnerships.", "confidence": 0.76},
                "8th": {"code": "JUPITER_8TH", "text": "Gains from Partner's Wealth: Potential for unearned wealth through partner or inheritance. Intelligence is applied to occult or research fields.", "confidence": 0.68},
                "9th": {"code": "JUPITER_9TH", "text": "Highly Fortunate & Wise: Extremely intelligent and creative. A respected teacher, guide, or philosopher. Blessed with good fortune and wise children.", "confidence": 0.82},
                "10th": {"code": "JUPITER_10TH", "text": "Intelligent Career: A career as a respected advisor, minister, teacher, or in government. Uses intelligence and creativity to achieve high status.", "confidence": 0.80},
                "11th": {"code": "JUPITER_11TH", "text": "Fortunate Gains: An extremely lucky placement. Gains through creativity, speculation, and children. Friends are wise and helpful. Desires are easily fulfilled.", "confidence": 0.78},
                "12th": {"code": "JUPITER_12TH", "text": "Spiritual Intelligence: Wisdom gained through meditation, dreams, and spiritual pursuits. Children may be born or live in foreign lands.", "confidence": 0.68}
            },
            "Venus": {
                "1st": {"code": "VENUS_1ST", "text": "Charming & Artistic: A very attractive, graceful, and sociable personality. Loves pleasure, beauty, and harmony. Relationships are central to their identity.", "confidence": 0.76},
                "2nd": {"code": "VENUS_2ND", "text": "Wealth & Luxury: Enjoys the finer things in life. Gains through arts, beauty, or partner. Speech is sweet and diplomatic. A prosperous family life.", "confidence": 0.74},
                "3rd": {"code": "VENUS_3RD", "text": "Artistic Communication: A charming and diplomatic communicator. Success in arts, music, fashion, or design. Enjoys pleasant journeys and good sibling relations.", "confidence": 0.72},
                "4th": {"code": "VENUS_4TH", "text": "Beautiful & Harmonious Home: A beautifully decorated home filled with art and luxury. Enjoys entertaining at home. Happiness from vehicles and family.", "confidence": 0.75},
                "5th": {"code": "VENUS_5TH", "text": "Artistic & Romantic: Very creative and successful in the arts. A charming and passionate romantic partner. Enjoys fine arts, music, and theatre.", "confidence": 0.76},
                "6th": {"code": "VENUS_6TH", "text": "Harmony in Service: Finds pleasure in creating a harmonious work environment. Good relationships with co-workers. Success in design, HR, or wellness fields.", "confidence": 0.70},
                "7th": {"code": "VENUS_7TH", "text": "Charming & Beautiful Partner: A loving, artistic, and harmonious partnership. A happy and luxurious married life. Partner is often attractive and sociable.", "confidence": 0.78},
                "8th": {"code": "VENUS_8TH", "text": "Secret Affairs/Wealth: Can gain wealth through partner or secret means. May have hidden relationships or a taste for taboo pleasures. Intense romantic life.", "confidence": 0.68},
                "9th": {"code": "VENUS_9TH", "text": "Loves Higher Learning: Finds pleasure in travel, philosophy, and different cultures. A fortunate relationship with father. May marry someone from a different culture.", "confidence": 0.76},
                "10th": {"code": "VENUS_10TH", "text": "Career in Arts/Finance: A successful career in creative arts, fashion, beauty, luxury goods, or finance. A diplomatic and well-liked public figure.", "confidence": 0.78},
                "11th": {"code": "VENUS_11TH", "text": "Gains through Relationships/Arts: Fulfills desires through social grace, arts, and partnerships. A large network of female or artistic friends. Enjoys luxury.", "confidence": 0.76},
                "12th": {"code": "VENUS_12TH", "text": "Pleasure in Seclusion: Finds joy in fantasy, art, and isolated pleasures. Can indicate secret love affairs or spending on luxury for hidden reasons.", "confidence": 0.68}
            },
            "Saturn": {
                "1st": {"code": "SATURN_1ST", "text": "Serious & Disciplined: A mature, responsible, and cautious personality. May have faced early life hardships. Builds success slowly through hard work and perseverance.", "confidence": 0.74},
                "2nd": {"code": "SATURN_2ND", "text": "Financial Discipline: Wealth comes late or through hard work and discipline. Frugal and cautious with money. May have a simple or difficult early family life.", "confidence": 0.70},
                "3rd": {"code": "SATURN_3RD", "text": "Disciplined Effort: Success comes through slow, persistent effort. Communication can be serious or restricted. May have a difficult relationship with siblings.", "confidence": 0.68},
                "4th": {"code": "SATURN_4TH", "text": "Burdens at Home: Domestic life can feel restrictive or full of responsibility. May feel emotionally distant from family. Home life improves with age and discipline.", "confidence": 0.68},
                "5th": {"code": "SATURN_5TH", "text": "Creative Blocks: Delays or difficulties with children, romance, or creativity. A serious approach to creative pursuits. Success comes through discipline.", "confidence": 0.65},
                "6th": {"code": "SATURN_6TH", "text": "Struggles & Discipline: Overcomes enemies and health issues through slow, persistent effort. A strong work ethic. Career in service can be laborious.", "confidence": 0.72},
                "7th": {"code": "SATURN_7TH", "text": "Serious & Mature Partner: Marriage may be delayed or to an older, more responsible partner. Partnership requires hard work and discipline but can be very stable.", "confidence": 0.74},
                "8th": {"code": "SATURN_8TH", "text": "Chronic Issues/Longevity: A long life but can indicate chronic health issues or facing major obstacles. Gains from discipline in research or occult fields.", "confidence": 0.70},
                "9th": {"code": "SATURN_9TH", "text": "Conservative Beliefs: A serious and disciplined approach to religion and philosophy. May face obstacles or delays in higher education. Father can be strict.", "confidence": 0.70},
                "10th": {"code": "SATURN_10TH", "text": "Hard-Working Career: Success in career comes late but is very stable. A career requiring discipline, patience, and hard work, like in engineering or agriculture.", "confidence": 0.78},
                "11th": {"code": "SATURN_11TH", "text": "Slow but Steady Gains: Gains come slowly and through hard work. Friends are older or serious. A stable and reliable income in later life.", "confidence": 0.74},
                "12th": {"code": "SATURN_12TH", "text": "Karmic Burdens: A disciplined approach to spirituality and letting go. May feel isolated or face limitations. A path towards moksha through great effort.", "confidence": 0.68}
            },
            "Rahu": {
                "1st": {"code": "RAHU_1ST", "text": "Unconventional & Ambitious: An obsessive focus on self-identity. May feel like an outsider. Can bring sudden fame or notoriety. A charismatic but potentially unsettling presence.", "confidence": 0.76},
                "2nd": {"code": "RAHU_2ND", "text": "Obsessed with Wealth: An insatiable desire for wealth and possessions. Can lead to sudden, unconventional gains or equally sudden losses. May earn through foreign or illicit means.", "confidence": 0.70},
                "3rd": {"code": "RAHU_3RD", "text": "Ambitious Efforts: Obsessive drive in communication, marketing, or media. Can achieve great success through bold, unconventional self-promotion and risk-taking.", "confidence": 0.74},
                "4th": {"code": "RAHU_4TH", "text": "Obsession with Home: An intense desire for domestic security or property. Can lead to unusual home life or power struggles within the family. Foreign residence possible.", "confidence": 0.70},
                "5th": {"code": "RAHU_5TH", "text": "Obsessive Creativity/Romance: Intense and unconventional romantic affairs or creative pursuits. Can indicate a powerful desire for fame or risky speculation.", "confidence": 0.72},
                "6th": {"code": "RAHU_6TH", "text": "Unconventional Conflicts: Faces strange health issues or unusual enemies. An obsessive focus on work or conflict. Can succeed in technology or foreign service.", "confidence": 0.72},
                "7th": {"code": "RAHU_7TH", "text": "Obsessive Partnerships: Intense, transformative, and potentially karmic relationships. May attract unconventional or foreign partners. Power struggles are common.", "confidence": 0.70},
                "8th": {"code": "RAHU_8TH", "text": "Sudden, Transformative Events: Life is marked by sudden upheavals. An obsessive interest in the occult, secrets, and power. Can bring sudden wealth or crises.", "confidence": 0.68},
                "9th": {"code": "RAHU_9TH", "text": "Unconventional Beliefs: Obsessed with foreign cultures, unusual philosophies, or a rebellious guru. Can bring great fortune through unconventional means.", "confidence": 0.74},
                "10th": {"code": "RAHU_10TH", "text": "Career of Extremes: A meteoric rise in career, often through unconventional or political means. Can bring great fame and power, but also sudden downfalls or scandals.", "confidence": 0.76},
                "11th": {"code": "RAHU_11TH", "text": "Sudden & Large Gains: Achieves desires through unconventional, risky, or foreign means. A large network of powerful or unusual friends. Can bring immense wealth.", "confidence": 0.78},
                "12th": {"code": "RAHU_12TH", "text": "Foreign Connections & Secrets: An obsessive interest in foreign lands, secrets, or the subconscious mind. Can lead to success abroad or downfall through hidden enemies.", "confidence": 0.68}
            },
            "Ketu": {
                "1st": {"code": "KETU_1ST", "text": "Detached & Intuitive: A spiritual or mystical personality. May feel a sense of detachment from the self or body. Possesses deep intuition but can be shy or reclusive.", "confidence": 0.74},
                "2nd": {"code": "KETU_2ND", "text": "Detached from Wealth: Lack of focus on material possessions. Can indicate sudden financial losses or earning through spiritual/research fields. Speech may be cryptic.", "confidence": 0.68},
                "3rd": {"code": "KETU_3RD", "text": "Apathetic Efforts: Lack of motivation or interest in personal enterprise or sibling relationships. May have unusual skills or communicate in a detached, spiritual way.", "confidence": 0.68},
                "4th": {"code": "KETU_4TH", "text": "Detached from Home: A sense of not belonging or disinterest in domestic matters. May feel like a stranger in their own home. Mother's health can be a concern.", "confidence": 0.68},
                "5th": {"code": "KETU_5TH", "text": "Detached from Creativity: Lack of interest in romance, children, or creative expression. May have spiritual children or use creativity for mystical pursuits. Past-life creative skills.", "confidence": 0.68},
                "6th": {"code": "KETU_6TH", "text": "Detached from Conflict: A tendency to ignore or spiritualize conflicts and health issues. Can lead to unexpected problems if not managed. Apathy towards daily work.", "confidence": 0.68},
                "7th": {"code": "KETU_7TH", "text": "Detached Partnerships: A spiritual or detached view of relationships. Partner may be mystical or reclusive. A sense of karmic distance in partnerships.", "confidence": 0.68},
                "8th": {"code": "KETU_8TH", "text": "Spiritual Transformation: A deep interest in the afterlife, past lives, and mystical experiences. Detached from the fear of death. A powerful psychic or spiritual healer.", "confidence": 0.72},
                "9th": {"code": "KETU_9TH", "text": "Detached from Dogma: A spiritual, non-dogmatic approach to belief. May question teachers and traditions. Finds wisdom through intuition rather than books.", "confidence": 0.74},
                "10th": {"code": "KETU_10TH", "text": "Detached from Career: Lack of ambition for worldly status. May work in spiritual, research, or secluded fields. The career path can be unusual and non-linear.", "confidence": 0.70},
                "11th": {"code": "KETU_11TH", "text": "Gains through Spirituality: Detachment from material gains can paradoxically bring them. May have few friends but they are spiritual. Desires are minimal or mystical.", "confidence": 0.70},
                "12th": {"code": "KETU_12TH", "text": "Ultimate Liberation (Moksha): The most powerful placement for spiritual detachment. An intuitive, ascetic nature. A natural renunciate with a deep connection to past lives.", "confidence": 0.76}
            },
            "Uranus": {
                "1st": {"code": "URANUS_1ST", "text": "Individualistic & Eccentric: A highly independent, unique, and rebellious personality. Prone to sudden changes in self-expression. Seen as a true original or an outsider.", "confidence": 0.76},
                "2nd": {"code": "URANUS_2ND", "text": "Unusual Finances: Income can be erratic or come from unconventional sources like technology or invention. Sudden financial ups and downs. Values freedom over security.", "confidence": 0.70},
                "3rd": {"code": "URANUS_3RD", "text": "Innovative Communication: Ideas are original, rebellious, or scientific. A revolutionary thinker. May have sudden breakthroughs in communication or learning.", "confidence": 0.74},
                "4th": {"code": "URANUS_4TH", "text": "Unstable Home Life: Sudden and unexpected changes in the home or family. May move frequently or have an unconventional family structure. A desire for freedom from roots.", "confidence": 0.70},
                "5th": {"code": "URANUS_5TH", "text": "Original & Rebellious Creativity: Creative expression is unique, innovative, or shocking. Sudden and unexpected romantic affairs. Inventions and new ideas flourish.", "confidence": 0.74},
                "6th": {"code": "URANUS_6TH", "text": "Sudden Health Issues/Work Changes: Unexpected disruptions in work or health. May work in a high-tech or revolutionary field. A need for freedom in the daily routine.", "confidence": 0.70},
                "7th": {"code": "URANUS_7TH", "text": "Unconventional Partnerships: Sudden, unexpected marriages or breakups. Attracted to unique, independent, or rebellious partners. A need for freedom within relationships.", "confidence": 0.72},
                "8th": {"code": "URANUS_8TH", "text": "Sudden Revelations: Unexpected breakthroughs in research or psychology. May uncover secrets suddenly. A life of surprising transformations and reinventions.", "confidence": 0.68},
                "9th": {"code": "URANUS_9TH", "text": "Sudden Changes in Belief: Worldview can change suddenly and unexpectedly. May travel to unusual places or adopt revolutionary philosophies.", "confidence": 0.74},
                "10th": {"code": "URANUS_10TH", "text": "Unconventional Career: A career in technology, science, invention, or social reform. Prone to sudden changes in profession. Needs freedom and innovation at work.", "confidence": 0.76},
                "11th": {"code": "URANUS_11TH", "text": "Gains from Innovation: Income from technology, social networks, or unconventional groups. Friends are eccentric or humanitarians. Sudden fulfillment of goals.", "confidence": 0.76},
                "12th": {"code": "URANUS_12TH", "text": "Sudden Loss or Enlightenment: Unexpected expenses or losses. May work with secret technology or in isolated institutions. A sudden flash of spiritual enlightenment.", "confidence": 0.68}
            },
            "Neptune": {
                "1st": {"code": "NEPTUNE_1ST", "text": "Dreamy & Idealistic: A sensitive, compassionate, and artistic soul. Boundaries can be blurry. May seem mysterious or have a chameleon-like personality.", "confidence": 0.74},
                "2nd": {"code": "NEPTUNE_2ND", "text": "Financial Illusion: Can indicate confusion or deception around finances. May earn through artistic or spiritual means, but prone to financial idealism or scams.", "confidence": 0.68},
                "3rd": {"code": "NEPTUNE_3RD", "text": "Imaginative Communication: A poetic, intuitive, and artistic communicator. Can be prone to fantasy or misunderstanding. Communication is gentle and compassionate.", "confidence": 0.72},
                "4th": {"code": "NEPTUNE_4TH", "text": "Idealistic Home Life: The home can be a place of fantasy, retreat, or confusion. May be prone to deception regarding property. A desire for a spiritual sanctuary.", "confidence": 0.70},
                "5th": {"code": "NEPTUNE_5TH", "text": "Imaginative & Dreamy Creativity: A highly imaginative artist, musician, or poet. Romance is idealistic and may involve illusion. Prone to escapism through hobbies.", "confidence": 0.74},
                "6th": {"code": "NEPTUNE_6TH", "text": "Confusing Health/Work: Vague health issues that are hard to diagnose. Deception or illusion in the workplace. Prone to escapism from daily responsibilities.", "confidence": 0.68},
                "7th": {"code": "NEPTUNE_7TH", "text": "Idealistic Partnerships: A tendency to idealize partners, leading to illusion or disappointment. Seeks a soulmate connection. Partner may be artistic or spiritual.", "confidence": 0.72},
                "8th": {"code": "NEPTUNE_8TH", "text": "Mystical Experiences: A highly intuitive and psychic placement. Prone to strange dreams or illusions. Can be a gifted channel or medium, but must guard against deception.", "confidence": 0.70},
                "9th": {"code": "NEPTUNE_9TH", "text": "Spiritual & Idealistic Beliefs: A mystical and compassionate worldview. Prone to devotion but also illusion in spiritual matters. Seeks a universal truth.", "confidence": 0.74},
                "10th": {"code": "NEPTUNE_10TH", "text": "Idealistic Career: A career in arts, healing, or humanitarian work. May face illusion or confusion in professional life. Seeks a career with spiritual meaning.", "confidence": 0.76},
                "11th": {"code": "NEPTUNE_11TH", "text": "Gains through Imagination: Income from arts, film, or spiritual pursuits. Friendships can be idealistic or illusory. Must be wary of deception in financial dealings.", "confidence": 0.74},
                "12th": {"code": "NEPTUNE_12TH", "text": "Vivid Dreams & Imagination: A highly imaginative and psychic mind. Escapist tendencies. Can be a visionary artist or a spiritual channel, but must guard against self-deception.", "confidence": 0.76}
            },
            "Pluto": {
                "1st": {"code": "PLUTO_1ST", "text": "Intense & Magnetic: A powerful, magnetic, and secretive personality. Possesses deep inner strength and a desire to transform the self. May have trust issues.", "confidence": 0.76},
                "2nd": {"code": "PLUTO_2ND", "text": "Financial Power: A deep, transformative relationship with wealth. Can attract immense resources or face total loss. May earn through research, psychology, or inheritance.", "confidence": 0.70},
                "3rd": {"code": "PLUTO_3RD", "text": "Intense Communication: A powerful and persuasive communicator. May use words to control or transform. Interest in investigative journalism or deep research.", "confidence": 0.74},
                "4th": {"code": "PLUTO_4TH", "text": "Transformative Home Life: The home is a place of intense psychological dramas and power struggles. Deep secrets within the family. Home life goes through profound changes.", "confidence": 0.70},
                "5th": {"code": "PLUTO_5TH", "text": "Intense Creativity & Romance: Romance is transformative and involves power dynamics. Creative expression is deep and probing. Can be obsessive about hobbies or children.", "confidence": 0.74},
                "6th": {"code": "PLUTO_6TH", "text": "Transformative Crises: Health crises or conflicts lead to profound personal transformation. A powerful healer or psychologist. Can be obsessed with work or health.", "confidence": 0.72},
                "7th": {"code": "PLUTO_7TH", "text": "Intense & Powerful Partnerships: Relationships are a primary area of transformation. Power dynamics are central. Attracted to mysterious or controlling partners.", "confidence": 0.72},
                "8th": {"code": "PLUTO_8TH", "text": "Ultimate Transformation: A life of profound, constant death and rebirth. A master of power, secrets, and regeneration. A powerful psychologist, surgeon, or leader.", "confidence": 0.76},
                "9th": {"code": "PLUTO_9TH", "text": "Transformative Beliefs: Philosophy and beliefs are a source of deep personal power and transformation. Can become an obsessive preacher or a powerful spiritual guide.", "confidence": 0.74},
                "10th": {"code": "PLUTO_10TH", "text": "Powerful & Influential Career: A career involving power, control, and transformation. Success in psychology, surgery, mining, or as a powerful CEO or politician.", "confidence": 0.78},
                "11th": {"code": "PLUTO_11TH", "text": "Gains through Power: Acquires wealth and influence through powerful networks and transformative ventures. Friends are powerful and secretive. Intense focus on goals.", "confidence": 0.76},
                "12th": {"code": "PLUTO_12TH", "text": "Transformative Endings: A focus on research, psychology, and the subconscious. Can become a powerful force working behind the scenes. A life of profound spiritual regeneration.", "confidence": 0.70}
            }
        }

    def evaluate(self, profile_id, planets_data):
        """Evaluate planet placements in houses for predictions."""
        import logging
        logger = logging.getLogger(__name__)
        try:
            predictions = []
            # Iterate through planets to check placement
            for planet in planets_data:
                planet_name = planet.get("planet_name")
                if planet_name not in self.prediction_matrix:
                    continue
                house = str(planet.get("house")) + "th"
                prediction = self.prediction_matrix[planet_name].get(house)
                if prediction:
                    predictions.append({
                        "prediction_code": prediction["code"],
                        "text": prediction["text"],
                        "confidence": prediction["confidence"],
                        "source_rule": "PLANET_SITTING",
                        "profile_id": profile_id
                    })
                    logger.debug(f"Generated prediction: {prediction['code']} for {planet_name} in {house}")
            logger.info(f"Generated {len(predictions)} planet sitting predictions for profile {profile_id}")
            return predictions
        except Exception as e:
            logger.error(f"Error evaluating planet sitting rule: {e}")
            raise