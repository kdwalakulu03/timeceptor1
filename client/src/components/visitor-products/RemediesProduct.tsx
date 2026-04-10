/**
 * RemediesProduct — Vedic remedies based on weak/afflicted planets.
 * Suggests gemstones, mantras, colors, and practices for each planet.
 */
import React, { useMemo } from 'react';
import type { SubProductProps } from './types';

/* ── Planet remedies database ──────────────────────────────────── */
interface PlanetRemedy {
  gemstone: string;
  gemEmoji: string;
  mantra: string;
  mantraCount: number;
  color: string;
  colorHex: string;
  day: string;
  deity: string;
  food: string;
  practice: string;
}

const PLANET_REMEDIES: Record<string, PlanetRemedy> = {
  Sun: {
    gemstone: 'Ruby',
    gemEmoji: '🔴',
    mantra: 'Om Suryaya Namaha',
    mantraCount: 108,
    color: 'Red / Copper',
    colorHex: '#c45c5c',
    day: 'Sunday',
    deity: 'Lord Surya',
    food: 'Wheat, jaggery, saffron',
    practice: 'Offer water to the rising Sun. Wake before sunrise. Practice Surya Namaskar.',
  },
  Moon: {
    gemstone: 'Pearl',
    gemEmoji: '⚪',
    mantra: 'Om Chandraya Namaha',
    mantraCount: 108,
    color: 'White / Silver',
    colorHex: '#8ab4d4',
    day: 'Monday',
    deity: 'Lord Shiva',
    food: 'Rice, milk, white foods',
    practice: 'Fasting on Mondays. Drink water in a silver vessel. Moon-gazing meditation.',
  },
  Mars: {
    gemstone: 'Red Coral',
    gemEmoji: '🔶',
    mantra: 'Om Mangalaya Namaha',
    mantraCount: 108,
    color: 'Red / Scarlet',
    colorHex: '#c45c5c',
    day: 'Tuesday',
    deity: 'Lord Hanuman',
    food: 'Red lentils, jaggery',
    practice: 'Recite Hanuman Chalisa. Physical exercise on Tuesdays. Donate red items.',
  },
  Mercury: {
    gemstone: 'Emerald',
    gemEmoji: '💚',
    mantra: 'Om Budhaya Namaha',
    mantraCount: 108,
    color: 'Green',
    colorHex: '#20C5A0',
    day: 'Wednesday',
    deity: 'Lord Vishnu',
    food: 'Green moong, green vegetables',
    practice: 'Study and learn on Wednesdays. Wear green. Practice journaling and communication.',
  },
  Jupiter: {
    gemstone: 'Yellow Sapphire',
    gemEmoji: '💛',
    mantra: 'Om Gurave Namaha',
    mantraCount: 108,
    color: 'Yellow / Gold',
    colorHex: '#F4A11D',
    day: 'Thursday',
    deity: 'Lord Brihaspati',
    food: 'Chickpeas, turmeric, bananas',
    practice: 'Wear yellow on Thursdays. Respect teachers and elders. Study scriptures.',
  },
  Venus: {
    gemstone: 'Diamond / White Sapphire',
    gemEmoji: '💎',
    mantra: 'Om Shukraya Namaha',
    mantraCount: 108,
    color: 'White / Pastel',
    colorHex: '#d4a8ff',
    day: 'Friday',
    deity: 'Goddess Lakshmi',
    food: 'Ghee, sugar, white rice',
    practice: 'Practice art or music on Fridays. Wear white/light colors. Donate to women.',
  },
  Saturn: {
    gemstone: 'Blue Sapphire',
    gemEmoji: '💙',
    mantra: 'Om Shanaischaraya Namaha',
    mantraCount: 108,
    color: 'Black / Navy Blue',
    colorHex: '#4a5590',
    day: 'Saturday',
    deity: 'Lord Shani',
    food: 'Sesame (til), mustard oil',
    practice: 'Serve the elderly and disabled. Oil massage on Saturdays. Practice patience.',
  },
  Rahu: {
    gemstone: 'Hessonite (Gomed)',
    gemEmoji: '🟤',
    mantra: 'Om Rahuve Namaha',
    mantraCount: 108,
    color: 'Smoky / Grey',
    colorHex: '#7080A0',
    day: 'Saturday',
    deity: 'Goddess Durga',
    food: 'Coconut, black sesame',
    practice: 'Chant Durga mantras. Avoid intoxicants. Grounding and earthing practices.',
  },
  Ketu: {
    gemstone: "Cat's Eye (Lehsunia)",
    gemEmoji: '🟢',
    mantra: 'Om Ketave Namaha',
    mantraCount: 108,
    color: 'Grey / Earth tones',
    colorHex: '#7080A0',
    day: 'Tuesday',
    deity: 'Lord Ganesha',
    food: 'Sesame, bananas',
    practice: 'Chant Ganesha mantras. Practice meditation and detachment. Pilgrimages help.',
  },
};

const MALEFICS = new Set(['Mars', 'Saturn', 'Rahu', 'Ketu']);

export function RemediesProduct({ birth, computed }: SubProductProps) {
  const { chart } = computed;

  // Most important remedies: for weak or malefic-placed planets
  const remedyPlanets = useMemo(() => {
    const results: { name: string; sign: string; house: number; remedy: PlanetRemedy; priority: 'high' | 'medium' | 'low' }[] = [];

    Object.values(chart.planets).forEach(p => {
      const remedy = PLANET_REMEDIES[p.name];
      if (!remedy) return;

      const dusthana = [6, 8, 12].includes(p.house);
      const isMalefic = MALEFICS.has(p.name);
      const priority: 'high' | 'medium' | 'low' =
        isMalefic && dusthana ? 'high' :
        isMalefic || dusthana ? 'medium' : 'low';

      results.push({ name: p.name, sign: p.sign, house: p.house, remedy, priority });
    });

    const order = { high: 0, medium: 1, low: 2 };
    return results.sort((a, b) => order[a.priority] - order[b.priority]);
  }, [chart]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-cream-dim/60">
        Vedic remedies to strengthen weak planets and mitigate challenging placements in your chart.
        Higher priority items address planets in difficult houses (6th, 8th, 12th).
      </p>

      <div className="space-y-3">
        {remedyPlanets.map((rp) => (
          <div
            key={rp.name}
            className={`p-4 border rounded-lg ${
              rp.priority === 'high'
                ? 'border-red-400/20 bg-red-400/[0.03]'
                : rp.priority === 'medium'
                  ? 'border-amber-400/15 bg-amber-400/[0.02]'
                  : 'border-white/[0.06] bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{rp.remedy.gemEmoji}</span>
                <span className="text-sm text-cream font-semibold">{rp.name}</span>
                <span className="text-xs text-cream-dim/40">in {rp.sign} · House {rp.house}</span>
              </div>
              <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                rp.priority === 'high'
                  ? 'bg-red-400/15 text-red-400 border-red-400/30'
                  : rp.priority === 'medium'
                    ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                    : 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
              }`}>
                {rp.priority}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-cream-dim/30 mt-0.5">💎</span>
                <div>
                  <div className="text-cream-dim/40 font-mono text-[9px] uppercase">Gemstone</div>
                  <div className="text-cream-dim">{rp.remedy.gemstone}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cream-dim/30 mt-0.5">📿</span>
                <div>
                  <div className="text-cream-dim/40 font-mono text-[9px] uppercase">Mantra</div>
                  <div className="text-cream-dim font-mono text-[11px]">{rp.remedy.mantra}</div>
                  <div className="text-cream-dim/30 text-[10px]">×{rp.remedy.mantraCount}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cream-dim/30 mt-0.5">🎨</span>
                <div>
                  <div className="text-cream-dim/40 font-mono text-[9px] uppercase">Color</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: rp.remedy.colorHex }} />
                    <span className="text-cream-dim">{rp.remedy.color}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cream-dim/30 mt-0.5">📅</span>
                <div>
                  <div className="text-cream-dim/40 font-mono text-[9px] uppercase">Day & Food</div>
                  <div className="text-cream-dim">{rp.remedy.day}</div>
                  <div className="text-cream-dim/50 text-[10px]">{rp.remedy.food}</div>
                </div>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-white/[0.02] rounded border border-white/[0.04]">
              <div className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5">🙏</span>
                <div>
                  <div className="text-cream-dim/40 font-mono text-[9px] uppercase mb-0.5">Practice</div>
                  <p className="text-[11px] text-gold/80">{rp.remedy.practice}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border border-white/[0.06] rounded-lg bg-white/[0.02] text-center">
        <p className="text-[10px] text-cream-dim/40 font-mono">
          🙏 These are traditional Vedic Jyotish remedies. Consult a qualified astrologer for personalized guidance.
        </p>
      </div>
    </div>
  );
}
