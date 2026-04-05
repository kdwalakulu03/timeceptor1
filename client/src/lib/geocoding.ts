/**
 * Geocoding via Nominatim (OpenStreetMap) — free, no API key required.
 * Policy: 1 req/sec, must send User-Agent. Rate limiting handled by the
 * server proxy at /api/geocode which forwards to Nominatim.
 */

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;  // "City, State, Country"
  shortName: string;    // "City, Country" — for dropdown display
}

// Build a Nominatim URL (dev hits directly, prod hits our server proxy)
function buildUrl(q: string, limit = 1): string {
  const isDev = import.meta.env.DEV;
  const encoded = encodeURIComponent(q.trim());
  return isDev
    ? `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=${limit}&addressdetails=1`
    : `/api/geocode?q=${encoded}&limit=${limit}`;
}

function parseResult(r: Record<string, unknown>): GeoResult {
  const parts = (r.display_name as string).split(',').map((p: string) => p.trim());
  const addr = r.address as Record<string, string> | undefined;
  const city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? parts[0];
  const country = addr?.country ?? parts[parts.length - 1];

  return {
    lat: parseFloat(r.lat as string),
    lng: parseFloat(r.lon as string),
    displayName: parts.slice(0, 3).join(', '),
    shortName: [city, country].filter(Boolean).join(', '),
  };
}

async function nominatimFetch(q: string, limit: number): Promise<GeoResult[]> {
  const url = buildUrl(q, limit);
  const isDev = import.meta.env.DEV;
  const res = await fetch(url, {
    headers: isDev ? { 'User-Agent': 'Timeceptor/1.0 (timeceptor.com)' } : {},
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const data = await res.json() as Record<string, unknown>[];
  if (!Array.isArray(data)) return [];
  return data.map(parseResult);
}

/**
 * Geocode a single city name or "lat,lng" string → exact coordinates.
 */
export async function geocodeCity(query: string): Promise<GeoResult | null> {
  try {
    const results = await nominatimFetch(query, 1);
    return results[0] ?? null;
  } catch (err) {
    console.error('[geocodeCity]', err);
    return null;
  }
}

/**
 * Get up to `limit` autocomplete suggestions for a partial city query.
 * Debounce calls in the component — Nominatim is 1 req/sec.
 */
export async function geocodeSuggest(query: string, limit = 5): Promise<GeoResult[]> {
  if (query.trim().length < 2) return [];
  try {
    return await nominatimFetch(query, limit);
  } catch (err) {
    console.error('[geocodeSuggest]', err);
    return [];
  }
}
