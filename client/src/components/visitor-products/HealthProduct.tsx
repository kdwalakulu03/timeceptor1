/**
 * HealthProduct — Health precautions based on planetary positions.
 * Maps weak houses/planets to health areas for Vedic medical astrology insights.
 */
import React, { useMemo } from 'react';
import type { SubProductProps } from './types';

/* ── House → body part & health domain mapping ─────────────────── */
const HOUSE_HEALTH: Record<number, { area: string; organs: string; icon: string }> = {
  1:  { area: 'General Vitality',       organs: 'Head, brain, face',                   icon: '🧠' },
  2:  { area: 'Throat & Speech',        organs: 'Throat, teeth, right eye',            icon: '👁️' },
  3:  { area: 'Arms & Nervous System',  organs: 'Shoulders, arms, ears, nervous system', icon: '💪' },
  4:  { area: 'Chest & Heart',          organs: 'Heart, lungs, chest, breast',         icon: '❤️' },
  5:  { area: 'Digestion & Mind',       organs: 'Stomach, upper belly, mental health', icon: '🧘' },
  6:  { area: 'Immune & Disease',       organs: 'Intestines, kidney, immune system',   icon: '🛡️' },
  7:  { area: 'Reproductive System',    organs: 'Lower abdomen, reproductive organs',  icon: '🌸' },
  8:  { area: 'Chronic Conditions',     organs: 'Chronic illness, excretory system',   icon: '⚕️' },
  9:  { area: 'Hips & Thighs',         organs: 'Hips, thighs, arteries',             icon: '🦵' },
  10: { area: 'Bones & Joints',         organs: 'Knees, bones, joints, spine',        icon: '🦴' },
  11: { area: 'Circulation',            organs: 'Calves, ankles, blood circulation',  icon: '🩸' },
  12: { area: 'Sleep & Feet',           organs: 'Feet, left eye, sleep quality',      icon: '🦶' },
};

/* ── Malefic planets that can cause health issues ──────────────── */
const MALEFICS = new Set(['Mars', 'Saturn', 'Rahu', 'Ketu', 'Sun']);

/* ── Planet-specific health tendencies ─────────────────────────── */
const PLANET_HEALTH: Record<string, { tendency: string; precaution: string }> = {
  Sun:     { tendency: 'Pitta (heat) dominance — prone to eye strain, headaches, and inflammation.',
             precaution: 'Avoid excessive sun exposure. Cool foods (coconut water, cucumbers). Regular eye check-ups.' },
  Moon:    { tendency: 'Kapha imbalance — water retention, emotional eating, hormonal cycles.',
             precaution: 'Stay hydrated mindfully. Moon-phase fasting can help. Prioritize sleep hygiene.' },
  Mars:    { tendency: 'Excess heat and aggression — inflammation, injuries, blood pressure.',
             precaution: 'Channel energy through exercise. Avoid spicy food excess. Monitor blood pressure.' },
  Mercury: { tendency: 'Nervous system sensitivity — anxiety, skin issues, speech disorders.',
             precaution: 'Practice deep breathing. Limit screen time. Green vegetables support Mercury.' },
  Jupiter: { tendency: 'Over-expansion — weight gain, liver issues, diabetes risk.',
             precaution: 'Moderate sweet/fatty foods. Turmeric and bitter greens support Jupiter health.' },
  Venus:   { tendency: 'Excess indulgence — kidney issues, reproductive health, sugar cravings.',
             precaution: 'Balance pleasure with discipline. Stay active. Monitor kidney health markers.' },
  Saturn:  { tendency: 'Slow metabolism — chronic pain, joint issues, depression risk.',
             precaution: 'Regular stretching and oil massage (Abhyanga). Warm foods. Mustard oil for joints.' },
  Rahu:    { tendency: 'Unusual or hard-to-diagnose conditions — allergies, toxin sensitivity.',
             precaution: 'Avoid processed foods. Detox periodically. Be cautious with new medications.' },
  Ketu:    { tendency: 'Mysterious ailments — viral infections, spiritual/psychosomatic issues.',
             precaution: 'Grounding practices (walking barefoot). Keep immune system strong. Meditation helps.' },
};

interface HealthArea {
  house: number;
  area: string;
  organs: string;
  icon: string;
  planet: string;
  isMalefic: boolean;
  tendency: string;
  precaution: string;
  severity: 'watch' | 'caution' | 'good';
}

export function HealthProduct({ birth, computed }: SubProductProps) {
  const { chart } = computed;

  const healthAreas = useMemo((): HealthArea[] => {
    const areas: HealthArea[] = [];

    // Check houses 6 (disease), 8 (chronic), 12 (hospitalization) + any malefic-occupied house
    Object.values(chart.planets).forEach(p => {
      const houseInfo = HOUSE_HEALTH[p.house];
      if (!houseInfo) return;

      const isMalefic = MALEFICS.has(p.name);
      const pHealth = PLANET_HEALTH[p.name];
      if (!pHealth) return;

      // Severity: malefic in 6/8/12 = caution, malefic elsewhere = watch, benefic = good
      const dusthana = [6, 8, 12].includes(p.house);
      const severity: 'watch' | 'caution' | 'good' =
        isMalefic && dusthana ? 'caution' :
        isMalefic ? 'watch' : 'good';

      areas.push({
        house: p.house,
        area: houseInfo.area,
        organs: houseInfo.organs,
        icon: houseInfo.icon,
        planet: p.name,
        isMalefic,
        tendency: pHealth.tendency,
        precaution: pHealth.precaution,
        severity,
      });
    });

    // Sort: caution first, then watch, then good
    const order = { caution: 0, watch: 1, good: 2 };
    return areas.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [chart]);

  const cautionCount = healthAreas.filter(a => a.severity === 'caution').length;
  const watchCount = healthAreas.filter(a => a.severity === 'watch').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 border border-red-400/20 rounded-lg bg-red-400/[0.04] text-center">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-red-400 font-display font-bold text-lg">{cautionCount}</div>
          <div className="font-mono text-[9px] text-cream-dim/40 uppercase tracking-widest">Caution Areas</div>
        </div>
        <div className="p-3 border border-amber-400/20 rounded-lg bg-amber-400/[0.04] text-center">
          <div className="text-2xl mb-1">👁️</div>
          <div className="text-amber-400 font-display font-bold text-lg">{watchCount}</div>
          <div className="font-mono text-[9px] text-cream-dim/40 uppercase tracking-widest">Watch Areas</div>
        </div>
        <div className="p-3 border border-emerald-400/20 rounded-lg bg-emerald-400/[0.04] text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-emerald-400 font-display font-bold text-lg">{healthAreas.length - cautionCount - watchCount}</div>
          <div className="font-mono text-[9px] text-cream-dim/40 uppercase tracking-widest">Good Areas</div>
        </div>
      </div>

      {/* Health areas */}
      <div>
        <h4 className="font-mono text-[10px] text-cream-dim/50 uppercase tracking-widest mb-3">
          Body Area Analysis by Planetary Position
        </h4>
        <div className="space-y-2">
          {healthAreas.map((area, i) => (
            <div
              key={`${area.planet}-${area.house}-${i}`}
              className={`p-3 border rounded-lg transition-colors ${
                area.severity === 'caution'
                  ? 'border-red-400/25 bg-red-400/[0.04]'
                  : area.severity === 'watch'
                    ? 'border-amber-400/20 bg-amber-400/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{area.icon}</span>
                  <span className="text-sm text-cream font-semibold">{area.area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cream-dim/50">{area.planet} · H{area.house}</span>
                  <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                    area.severity === 'caution'
                      ? 'bg-red-400/15 text-red-400 border-red-400/30'
                      : area.severity === 'watch'
                        ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                        : 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30'
                  }`}>
                    {area.severity}
                  </span>
                </div>
              </div>
              <p className="text-xs text-cream-dim/50 mb-1">{area.organs}</p>
              <p className="text-xs text-cream-dim/60">{area.tendency}</p>
              <div className="mt-2 p-2 bg-white/[0.02] rounded border border-white/[0.04]">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] mt-0.5">💊</span>
                  <p className="text-[11px] text-gold/80">{area.precaution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border border-white/[0.06] rounded-lg bg-white/[0.02] text-center">
        <p className="text-[10px] text-cream-dim/40 font-mono">
          ⚕️ This is Vedic medical astrology guidance, not a medical diagnosis.
          Always consult healthcare professionals for medical decisions.
        </p>
      </div>
    </div>
  );
}
