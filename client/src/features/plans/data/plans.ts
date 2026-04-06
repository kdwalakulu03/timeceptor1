/**
 * Life Plan definitions — bundled timing strategies.
 *
 * Each plan groups 2-4 services into a coherent life strategy
 * and provides a daily template with recommended sequencing.
 *
 * All computation is client-side via getWeeklyWindows().
 */
import type { ServiceId } from '../../../types';

export interface PlanPhase {
  /** Service to time */
  service: ServiceId;
  /** Human-readable label */
  label: string;
  /** Duration suggestion, e.g. "30 min" */
  duration: string;
  /** Short tip for this phase */
  tip: string;
}

export interface LifePlan {
  id: string;
  name: string;
  icon: string;
  subtitle: string;
  description: string;
  /** Gradient start/end for the card accent */
  accentFrom: string;
  accentTo: string;
  /** Ordered phases — the plan's daily pipeline */
  phases: PlanPhase[];
  /** Premium-only? (plan is free but only paid users get 90-day windows) */
  premium: boolean;
}

export const LIFE_PLANS: LifePlan[] = [
  {
    id: 'launch',
    name: 'Launch Plan',
    icon: '🚀',
    subtitle: 'Product & business launches',
    description:
      'Orchestrate a stellar launch by aligning your creative brainstorm, business decisions, and social-media blitz to the most powerful planetary hours of each day.',
    accentFrom: '#F4A11D',
    accentTo: '#FF6B35',
    phases: [
      {
        service: 'creative',
        label: 'Creative Session',
        duration: '45 min',
        tip: 'Brainstorm messaging, visuals, and brand voice during peak creative hours.',
      },
      {
        service: 'business',
        label: 'Strategy & Execution',
        duration: '60 min',
        tip: 'Make key launch decisions — pricing, partnerships, go/no-go calls.',
      },
      {
        service: 'social_media',
        label: 'Social Blitz',
        duration: '30 min',
        tip: 'Schedule posts, stories, and engagement campaigns at the optimal moment.',
      },
    ],
    premium: true,
  },
  {
    id: 'dating',
    name: 'Dating Plan',
    icon: '💛',
    subtitle: 'Connection & romance timing',
    description:
      'Maximize your charm and emotional connection by timing self-care, social outreach, and romantic encounters to Venus and Moon hours.',
    accentFrom: '#FF6B9D',
    accentTo: '#C850C0',
    phases: [
      {
        service: 'health',
        label: 'Self-Care Prep',
        duration: '30 min',
        tip: 'Grooming, outfit selection, and confidence-building during peak health hora.',
      },
      {
        service: 'social_media',
        label: 'Social Outreach',
        duration: '20 min',
        tip: 'Update profiles, send messages, and engage matches when Mercury aligns.',
      },
      {
        service: 'love',
        label: 'The Date',
        duration: '90 min',
        tip: 'Schedule the actual date during peak Venus/Moon windows for natural chemistry.',
      },
    ],
    premium: false,
  },
  {
    id: 'jobhunt',
    name: 'Job Hunt Plan',
    icon: '💼',
    subtitle: 'Career moves & interviews',
    description:
      'Align your resume polish, networking, and interviews to planetary windows that favor communication, authority, and decisive action.',
    accentFrom: '#20C5A0',
    accentTo: '#0EA5E9',
    phases: [
      {
        service: 'creative',
        label: 'Resume & Portfolio',
        duration: '45 min',
        tip: 'Polish your resume and portfolio during creative peaks for sharper storytelling.',
      },
      {
        service: 'business',
        label: 'Networking & Outreach',
        duration: '30 min',
        tip: 'Send applications, LinkedIn messages, and follow-ups when business hora peaks.',
      },
      {
        service: 'social_media',
        label: 'Public Branding',
        duration: '20 min',
        tip: 'Update LinkedIn, tweet insights, and build your professional presence.',
      },
    ],
    premium: true,
  },
  {
    id: 'fitness',
    name: 'Fitness Routine',
    icon: '🏋️',
    subtitle: 'Workout, recovery & nutrition',
    description:
      'Build a holistic fitness schedule by synchronizing intense workouts with Mars hours, yoga with Saturn/Sun, and recovery with Moon windows.',
    accentFrom: '#FF5757',
    accentTo: '#F4A11D',
    phases: [
      {
        service: 'yoga',
        label: 'Morning Flow',
        duration: '30 min',
        tip: 'Start with dynamic sun salutations during peak solar-yogic windows.',
      },
      {
        service: 'health',
        label: 'Main Workout',
        duration: '60 min',
        tip: 'Schedule HIIT / strength training during Mars or Sun hours for max intensity.',
      },
      {
        service: 'meditation',
        label: 'Cool-Down & Recovery',
        duration: '20 min',
        tip: 'Wind down with Yoga Nidra or guided meditation during Moon/Jupiter windows.',
      },
    ],
    premium: false,
  },
  {
    id: 'creator',
    name: 'Content Creator Plan',
    icon: '🎬',
    subtitle: 'Create, publish & grow',
    description:
      'Time your creative sessions, editing hours, and publishing moments to maximize both quality and engagement.',
    accentFrom: '#A855F7',
    accentTo: '#6366F1',
    phases: [
      {
        service: 'creative',
        label: 'Create & Record',
        duration: '60 min',
        tip: 'Shoot, write, or record during Mercury/Venus creative peaks.',
      },
      {
        service: 'business',
        label: 'Edit & Strategy',
        duration: '45 min',
        tip: 'Edit content and plan distribution during focused business windows.',
      },
      {
        service: 'social_media',
        label: 'Publish & Engage',
        duration: '30 min',
        tip: 'Push content live and engage followers during optimal social hours.',
      },
    ],
    premium: true,
  },
  {
    id: 'wellness',
    name: 'Holistic Wellness',
    icon: '🌸',
    subtitle: 'Mind, body & spirit reset',
    description:
      'A daily reset routine combining meditation, gentle yoga, and wellness practices timed to the most harmonious planetary windows.',
    accentFrom: '#34D399',
    accentTo: '#06B6D4',
    phases: [
      {
        service: 'meditation',
        label: 'Morning Meditation',
        duration: '20 min',
        tip: 'Start the day with mindfulness during Jupiter or Moon windows.',
      },
      {
        service: 'yoga',
        label: 'Yoga Practice',
        duration: '45 min',
        tip: 'Flow through asanas during your personal peak yogic hour.',
      },
      {
        service: 'health',
        label: 'Wellness Check-In',
        duration: '30 min',
        tip: 'Ayurvedic self-care, nutrition planning, or healing treatments.',
      },
    ],
    premium: false,
  },
];
