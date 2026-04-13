/**
 * reelApi.ts — Direct client for the Timeceptor Reel Docker Worker.
 *
 * Calls reel.timeceptor.com directly — does NOT go through the Node/Express
 * backend that handles Stripe/DB/auth. This is a fully separate worker.
 *
 * Endpoints used:
 *   GET  /api/music         → list available music tracks
 *   POST /api/upload-avatar → upload user photo, returns { avatarPath }
 *   POST /api/render        → async job submission, returns { jobId }
 *   GET  /api/render/:id/status   → poll progress
 *   GET  /api/render/:id/download → download completed MP4
 */

const REEL_BASE =
  import.meta.env.VITE_REEL_API_URL ?? 'https://reel.timeceptor.com';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface MusicTrack {
  id: string;
  name: string;
  file: string;
}

export interface ReelBirth {
  name: string;
  dob: string;          // "1985-02-05"
  tob: string;          // "06:00:00"
  dobDisplay: string;   // "Feb 5, 1985"
  tobDisplay: string;   // "06:00 AM"
  locationName: string;
  lat: number;
  lng: number;
  avatarPath?: string;  // server-side path from /api/upload-avatar
}

export interface ReelPlanet {
  name: string;
  longitude: number;
  siderealLongitude: number;
  tropicalLongitude?: number;
  sign: string;
  house: number;
}

export interface ReelChart {
  planets: Record<string, ReelPlanet>;
  ascendant: number;
  ayanamsa: number;
  cusps: number[];
}

export interface RenderSettings {
  width?: number;       // default 720
  height?: number;      // default 1560
  fps?: number;         // default 24
  musicTrack?: string;  // track name or "none"
}

export interface RenderRequest {
  birth: ReelBirth;
  chart: ReelChart;
  settings?: RenderSettings;
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;     // 0–100
  error?: string | null;
}

/* ── Errors ─────────────────────────────────────────────────────────────────── */

export class ReelRateLimitError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ReelRateLimitError';
  }
}

export class ReelServerBusyError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ReelServerBusyError';
  }
}

/* ── API Functions ──────────────────────────────────────────────────────────── */

/**
 * Ask the worker to compute the Vedic chart from birth data.
 * This avoids format mismatches between frontend (tropical=longitude)
 * and worker (sidereal=longitude). The worker returns the exact shape
 * its renderer expects.
 */
export async function fetchWorkerChart(
  dob: string,
  tob: string,
  lat: number,
  lng: number,
): Promise<ReelChart> {
  const res = await fetch(`${REEL_BASE}/api/chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dob, tob, lat, lng }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Chart computation failed');
  }
  return res.json();
}

/** List available music tracks from the reel worker. */
export async function fetchMusicTracks(): Promise<{
  tracks: MusicTrack[];
  default: string;
}> {
  const res = await fetch(`${REEL_BASE}/api/music`);
  if (!res.ok) throw new Error('Failed to fetch music tracks');
  return res.json();
}

/** Upload an avatar image (File) and return the server-side path. */
export async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${REEL_BASE}/api/upload-avatar`, {
    method: 'POST',
    body: form,
  });
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new ReelRateLimitError(body.detail || 'Too many requests');
  }
  if (!res.ok) throw new Error('Avatar upload failed');
  const data = await res.json();
  return data.avatarPath;
}

/** Submit an async render job. Returns jobId for polling. */
export async function submitRenderJob(req: RenderRequest): Promise<string> {
  const res = await fetch(`${REEL_BASE}/api/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new ReelRateLimitError(body.detail || 'Too many requests');
  }
  if (res.status === 503) {
    const body = await res.json().catch(() => ({}));
    throw new ReelServerBusyError(
      body.detail || 'Server busy — please wait ~60s',
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Render submission failed');
  }
  const data = await res.json();
  return data.jobId;
}

/** Poll render job status. */
export async function pollJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${REEL_BASE}/api/render/${jobId}/status`);
  if (!res.ok) throw new Error('Failed to poll job status');
  return res.json();
}

/** Download the completed MP4 as a Blob. */
export async function downloadReel(jobId: string): Promise<Blob> {
  const res = await fetch(`${REEL_BASE}/api/render/${jobId}/download`);
  if (!res.ok) throw new Error('Download failed');
  return res.blob();
}

/* ── Frontend Rate Limiting (localStorage) ─────────────────────────────────── */

const RL_KEY = 'tc_reel_rl';
const MAX_REELS_PER_DAY = 3;

interface RateLimitEntry {
  date: string; // YYYY-MM-DD
  count: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLocalRL(): RateLimitEntry {
  try {
    const raw = localStorage.getItem(RL_KEY);
    if (raw) {
      const entry: RateLimitEntry = JSON.parse(raw);
      if (entry.date === todayStr()) return entry;
    }
  } catch { /* noop */ }
  return { date: todayStr(), count: 0 };
}

/** Check if the user can generate another reel today. */
export function canGenerateReel(): { allowed: boolean; remaining: number } {
  const entry = getLocalRL();
  const remaining = Math.max(0, MAX_REELS_PER_DAY - entry.count);
  return { allowed: remaining > 0, remaining };
}

/** Increment the local reel counter (call after successful submit). */
export function recordReelGeneration(): void {
  const entry = getLocalRL();
  entry.count += 1;
  localStorage.setItem(RL_KEY, JSON.stringify(entry));
}
