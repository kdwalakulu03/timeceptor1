/**
 * PredictionProduct — "What the Stars Say About You"
 * Generates personality insights from planet signs & houses in the birth chart.
 */
import React, { useMemo } from 'react';
import { getSign } from '../../lib/astrology';
import type { SubProductProps } from './types';

/* ── Sign-based personality blurbs ──────────────────────────────── */
const SIGN_TRAITS: Record<string, { trait: string; desc: string }> = {
  Aries:       { trait: 'Bold Pioneer',       desc: 'You lead with passion and courage, thriving on new beginnings and challenge.' },
  Taurus:      { trait: 'Steady Builder',      desc: 'You value stability, beauty, and material comfort — patient yet determined.' },
  Gemini:      { trait: 'Quick Intellect',     desc: 'Adaptable and communicative, you thrive on variety and intellectual stimulation.' },
  Cancer:      { trait: 'Nurturing Soul',      desc: 'Deeply intuitive and protective, you create emotional safety for those around you.' },
  Leo:         { trait: 'Radiant Leader',       desc: 'Confident and generous, you naturally command attention and inspire others.' },
  Virgo:       { trait: 'Detail Master',        desc: 'Analytical and service-oriented, you excel at refining and perfecting systems.' },
  Libra:       { trait: 'Harmony Seeker',       desc: 'Diplomatic and aesthetic, you balance opposing forces with grace and fairness.' },
  Scorpio:     { trait: 'Deep Transformer',     desc: 'Intensely perceptive, you see beyond surfaces and embrace profound change.' },
  Sagittarius: { trait: 'Truth Explorer',       desc: 'Optimistic and philosophical, you seek meaning through experience and wisdom.' },
  Capricorn:   { trait: 'Disciplined Achiever', desc: 'Ambitious and structured, you build lasting legacies through persistent effort.' },
  Aquarius:    { trait: 'Visionary Rebel',      desc: 'Independent and humanitarian, you innovate and challenge conventional thinking.' },
  Pisces:      { trait: 'Mystic Dreamer',       desc: 'Compassionate and imaginative, you connect with the unseen dimensions of life.' },
};

/* ── Planet-in-house interpretations (key highlights) ───────────── */
const PLANET_HOUSE_INSIGHT: Record<string, Record<number, string>> = {
  Sun: {
    1: 'Strong personality and self-confidence. Natural leader.',
    2: 'Wealth through personal efforts. Values self-worth.',
    3: 'Courageous communicator. Strong willpower in endeavors.',
    4: 'Deep connection to home and heritage. Inner strength.',
    5: 'Creative intelligence. Romance and children bring joy.',
    6: 'Overcomes enemies and obstacles. Service-oriented.',
    7: 'Partnerships define your identity. Strong spouse.',
    8: 'Interest in occult and transformation. Research-minded.',
    9: 'Fortunate through father/guru. Philosophical nature.',
    10: 'Career success and public recognition. Authority figure.',
    11: 'Gains through influential networks. Fulfillment of desires.',
    12: 'Spiritual seeker. May live abroad. Inner illumination.',
  },
  Moon: {
    1: 'Emotionally expressive. Public-facing personality.',
    2: 'Wealth through family. Nurturing speech.',
    3: 'Emotionally driven communication. Close to siblings.',
    4: 'Deep emotional roots. Comfort-seeking. Strong mother influence.',
    5: 'Intuitive intelligence. Emotional creativity.',
    6: 'Emotional challenges build resilience. Service through empathy.',
    7: 'Emotionally attuned partnerships. Caring spouse.',
    8: 'Emotional depth and psychic sensitivity. Transformative feelings.',
    9: 'Philosophical emotions. Travel brings peace.',
    10: 'Public emotional expression. Career in nurturing fields.',
    11: 'Emotional fulfillment through friendships and community.',
    12: 'Rich inner world. Dreams and meditation are powerful.',
  },
  Mars: {
    1: 'Dynamic energy and physical courage. Manglik effects possible.',
    4: 'Property and vehicle gains through effort. Domestic energy.',
    7: 'Passionate partnerships. Direct in relationships.',
    10: 'Career driven by action and ambition. Leadership in work.',
  },
  Jupiter: {
    1: 'Wisdom and optimism define you. Natural teacher.',
    5: 'Blessed with intelligent children. Strong in speculation.',
    9: 'Extremely fortunate. Drawn to higher learning and dharma.',
    10: 'Great career success. Respected in profession.',
  },
  Venus: {
    1: 'Attractive personality. Artistic and charming.',
    4: 'Luxury and comfort at home. Beautiful surroundings.',
    7: 'Blessed in partnerships and marriage. Harmonious relationships.',
    12: 'Spiritual love. Pleasure in solitude and meditation.',
  },
  Saturn: {
    1: 'Disciplined and serious. Life improves steadily with age.',
    7: 'Delayed but stable partnerships. Mature relationships.',
    10: 'Hard-won career success. Persistent and authoritative.',
    11: 'Gains through perseverance. Loyal and steady friendships.',
  },
  Mercury: {
    1: 'Witty and communicative. Quick learner.',
    3: 'Excellent communicator. Skilled writer or speaker.',
    5: 'Intellectual creativity. Good in speculation and games.',
    10: 'Career in communication, commerce, or analytics.',
  },
};

interface Insight {
  planet: string;
  sign: string;
  house: number;
  trait: string;
  signDesc: string;
  houseInsight: string;
}

export function PredictionProduct({ birth, computed }: SubProductProps) {
  const { chart } = computed;
  const ascSign = getSign(chart.ascendant);
  const ascData = SIGN_TRAITS[ascSign];

  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];
    const importantPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

    importantPlanets.forEach(pName => {
      const pData = chart.planets[pName.toLowerCase()];
      if (!pData) return;

      const signInfo = SIGN_TRAITS[pData.sign] ?? { trait: 'Unique Energy', desc: 'A distinctive planetary influence on this area of life.' };
      const houseInfo = PLANET_HOUSE_INSIGHT[pName]?.[pData.house] ?? '';

      result.push({
        planet: pName,
        sign: pData.sign,
        house: pData.house,
        trait: signInfo.trait,
        signDesc: signInfo.desc,
        houseInsight: houseInfo,
      });
    });

    return result;
  }, [chart]);

  return (
    <div className="space-y-6">
      {/* Ascendant personality */}
      <div className="p-4 border border-gold/20 rounded-lg bg-gold/[0.04]">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⭐</span>
          <div>
            <h3 className="text-gold font-display font-semibold text-base">{ascSign} Rising — {ascData?.trait ?? 'Unique Soul'}</h3>
            <p className="text-cream-dim/70 text-sm mt-1">{ascData?.desc ?? 'Your ascendant shapes how the world sees you.'}</p>
          </div>
        </div>
      </div>

      {/* Planet insights */}
      <div>
        <h4 className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-3">
          Planetary Influences on Your Life
        </h4>
        <div className="space-y-3">
          {insights.map((ins) => (
            <div key={ins.planet} className="p-3 border border-white/[0.06] rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-cream font-semibold">{ins.planet} in {ins.sign}</span>
                <span className="font-mono text-[10px] text-cream-dim/40">House {ins.house}</span>
              </div>
              <p className="text-xs text-cream-dim/60">{ins.signDesc}</p>
              {ins.houseInsight && (
                <p className="text-xs text-gold/80 mt-1.5 pl-3 border-l-2 border-gold/20">{ins.houseInsight}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rahu/Ketu axis */}
      <div className="p-4 border border-white/[0.06] rounded-lg bg-white/[0.02]">
        <h4 className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-3">
          Karmic Axis (Rahu–Ketu)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span>🐍</span>
              <span className="text-sm text-cream font-semibold">Rahu</span>
            </div>
            <div className="text-xs text-cream-dim/60">
              {chart.planets['rahu']?.sign ?? '—'} · House {chart.planets['rahu']?.house ?? '—'}
            </div>
            <p className="text-[11px] text-cream-dim/50 mt-1">Your soul's desire and worldly ambitions in this life.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span>🌑</span>
              <span className="text-sm text-cream font-semibold">Ketu</span>
            </div>
            <div className="text-xs text-cream-dim/60">
              {chart.planets['ketu']?.sign ?? '—'} · House {chart.planets['ketu']?.house ?? '—'}
            </div>
            <p className="text-[11px] text-cream-dim/50 mt-1">Past-life mastery and spiritual detachment point.</p>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-cream-dim/40 font-mono pt-2 border-t border-white/[0.05]">
        Vedic personality analysis based on Sidereal positions · Lahiri Ayanamsa
      </div>
    </div>
  );
}
