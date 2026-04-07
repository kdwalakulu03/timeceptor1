/**
 * Types & timing constants for the X-share animation sequence.
 */

export type XShareScene = 'download' | 'draft' | 'posted' | 'reactions';

export const SCENE_ORDER: XShareScene[] = ['download', 'draft', 'posted', 'reactions'];
export const SCENE_DURATION = 2_500;  // 2.5 s per scene
export const TOTAL_SHARE_DURATION = SCENE_ORDER.length * SCENE_DURATION; // 10 s total

export interface SceneProps {
  celebName: string;
  celebHandle: string;
  celebEmoji: string;
  serviceLabel: string;
  score: number;
  verdict: 'go' | 'caution' | 'wait';
  verdictLabel: string;
  /* Extra fields for the branded card */
  horaRuler: string;
  activity: string;
  nextBetter?: {
    label: string;
    score: number;
    horaRuler: string;
    hoursFromNow: number;
  } | null;
  todayWindows?: { hour: number; score: number }[];
}
