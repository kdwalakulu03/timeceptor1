/**
 * Shared types for the demo-showcase carousel.
 */
import type { HourWindow, ServiceId } from '../../types';
import type { DecisionResult } from '../../features/decide/utils/engine';
import type { CelebrityProfile } from '../../data/celebrities';

export interface ServiceSummary {
  id: ServiceId;
  name: string;
  icon: string;
  avgScore: number;
  peakCount: number;
  weakCount: number;
  bestDay: string;
  bestHour: number;
}

export interface SwotMatrix {
  strengths: ServiceSummary[];
  weaknesses: ServiceSummary[];
  opportunities: ServiceSummary[];
  threats: ServiceSummary[];
}

export interface DemoData {
  celeb: CelebrityProfile;
  windows: HourWindow[];
  todayWindows: HourWindow[];
  decision: DecisionResult | null;
  serviceSummaries: ServiceSummary[];
  swotMatrix: SwotMatrix | null;
}

export interface SlideProps {
  data: DemoData;
}

export const PRODUCT_TABS = [
  { id: 'golden' as const, label: 'Golden Hours', icon: '⏰', color: 'gold', borderClass: 'border-gold/30', bgClass: 'bg-gold/10', textClass: 'text-gold' },
  { id: 'swot' as const,   label: 'SWOT',         icon: '✦',  color: 'indigo', borderClass: 'border-indigo-500/30', bgClass: 'bg-indigo-500/10', textClass: 'text-indigo-300' },
  { id: 'decide' as const, label: 'Act or Wait',   icon: '🎯', color: 'emerald', borderClass: 'border-emerald-500/30', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  { id: 'plan' as const,   label: 'Life Plan',     icon: '📋', color: 'purple', borderClass: 'border-purple-500/30', bgClass: 'bg-purple-500/10', textClass: 'text-purple-300' },
] as const;

export type ProductTabId = typeof PRODUCT_TABS[number]['id'];
