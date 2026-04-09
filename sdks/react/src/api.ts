/** API functions for geolocation and exchange rates. */

import { getCachedGeo, setCachedGeo, getCachedRate, setCachedRate } from './cache';
import type { GeoResponse } from './types';

const DEFAULT_GEO_ENDPOINT = 'https://ipapi.co/json/';
const ALLRATESTODAY_BASE = 'https://allratestoday.com';

/**
 * Detect the user's local currency via IP geolocation.
 * Uses ipapi.co (free, no API key, HTTPS).
 * Results are cached in localStorage for 24 hours.
 */
export async function detectCurrency(geoEndpoint?: string): Promise<string> {
  // Check cache first
  const cached = getCachedGeo();
  if (cached) return cached;

  const url = geoEndpoint || DEFAULT_GEO_ENDPOINT;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geolocation request failed: HTTP ${response.status}`);
  }

  const data: GeoResponse = await response.json();
  if (!data.currency) {
    throw new Error('Geolocation response did not include a currency code');
  }

  const currency = data.currency.toUpperCase();
  setCachedGeo(currency);
  return currency;
}

/**
 * Fetch the exchange rate from AllRatesToday API.
 * Results are cached in memory for 1 hour.
 */
export async function fetchRate(
  apiKey: string,
  from: string,
  to: string,
): Promise<number> {
  if (!apiKey) {
    throw new Error(
      'API key is missing. Get your free key at allratestoday.com/register'
    );
  }

  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();

  if (fromUpper === toUpper) return 1;

  // Check cache
  const cacheKey = `${fromUpper}_${toUpper}`;
  const cached = getCachedRate(cacheKey);
  if (cached !== null) return cached;

  const url = `${ALLRATESTODAY_BASE}/api/v1/rates?source=${fromUpper}&target=${toUpper}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg = (body as Record<string, string>).error || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const rateData = Array.isArray(data) ? data[0] : data;
  const rate = rateData?.rate;

  if (typeof rate !== 'number') {
    throw new Error('Invalid rate response from AllRatesToday API');
  }

  setCachedRate(cacheKey, rate);
  return rate;
}
