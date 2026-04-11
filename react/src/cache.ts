/** Simple in-memory + localStorage cache for geolocation and exchange rates. */

const GEO_CACHE_KEY = 'allratestoday_geo_currency';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const RATE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getCachedGeo(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry<string> = JSON.parse(raw);
    if (Date.now() - entry.timestamp < GEO_CACHE_TTL) {
      return entry.data;
    }
    localStorage.removeItem(GEO_CACHE_KEY);
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

export function setCachedGeo(currency: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const entry: CacheEntry<string> = { data: currency, timestamp: Date.now() };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore localStorage errors
  }
}

export function getCachedRate(key: string): number | null {
  const entry = memoryCache.get(key) as CacheEntry<number> | undefined;
  if (entry && Date.now() - entry.timestamp < RATE_CACHE_TTL) {
    return entry.data;
  }
  if (entry) memoryCache.delete(key);
  return null;
}

export function setCachedRate(key: string, rate: number): void {
  memoryCache.set(key, { data: rate, timestamp: Date.now() });
}
