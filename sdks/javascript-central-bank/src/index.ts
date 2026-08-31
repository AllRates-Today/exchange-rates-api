/**
 * Official central-bank and tax-authority exchange rates, from AllRatesToday.
 *
 * Unlike a market rate, these are the rates a named institution published:
 * fixed once published, carrying the publisher's own date. They are what tax
 * returns, customs valuations and statutory accounting require.
 *
 * The latest published table of any source is available without an API key.
 */

const DEFAULT_BASE_URL = 'https://allratestoday.com';
const DEFAULT_TIMEOUT = 10_000;

export interface CentralBankRatesOptions {
  /** Optional API key. Free tier at https://allratestoday.com/register */
  apiKey?: string;
  /** API base URL. Defaults to https://allratestoday.com */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 10000. */
  timeout?: number;
}

/** One row of a published table. */
export interface PublishedRate {
  base: string;
  quote: string;
  type: string;
  value: number;
}

/** A source's full published table. */
export interface PublishedTable {
  bank: string;
  rate_date: string;
  rates: PublishedRate[];
  attribution?: { source: string; url: string; terms: string };
}

/** One pair from a published table. */
export interface PublishedPair {
  bank: string;
  rate_date: string;
  source: string;
  target: string;
  rate: number;
  rate_type: string;
  /** True when the institution did not publish this pair directly. */
  derived?: boolean;
  method?: string;
  attribution?: { source: string; url: string; terms: string };
}

export type DateLike = string | Date;

export class CentralBankError extends Error {
  /** HTTP status code, when the failure came back from the server. */
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CentralBankError';
    this.status = status;
  }
}

/**
 * Thrown for a lookup that is only served to authenticated callers. Carries the
 * sign-up instructions so the message is actionable rather than a bare 401, and
 * is thrown before any request goes out.
 */
export class NeedsApiKeyError extends CentralBankError {
  constructor(what: string) {
    super(
      `${what} requires an AllRatesToday API key. The free tier covers it — ` +
        'register at https://allratestoday.com/register (no card), then pass ' +
        '{ apiKey } when constructing the client. Without a key this client can ' +
        'still return the latest published table for any source.',
    );
    this.name = 'NeedsApiKeyError';
  }
}

/**
 * Official published exchange rates from 100+ central banks and tax authorities.
 *
 * Works without an API key: {@link CentralBankRates.latest} reads the open,
 * edge-cached endpoint serving each source's most recent published table.
 * Historical dates, series, publication calendars and cross-source comparison
 * are metered and need a key.
 *
 * ```ts
 * const cb = new CentralBankRates();               // no key needed
 * const pair = await cb.latest('ecb', { source: 'USD', target: 'EUR' });
 * console.log(pair.rate, 'published', pair.rate_date);
 * ```
 */
export class CentralBankRates {
  private apiKey?: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: CentralBankRatesOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /** True when no API key is configured, so only open endpoints are reachable. */
  get keyless(): boolean {
    return !this.apiKey;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private async request<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err) {
      throw new CentralBankError(
        `Connection error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }));
      throw new CentralBankError((body as any).error || `HTTP ${response.status}`, response.status);
    }

    return response.json() as Promise<T>;
  }

  private formatDate(d: DateLike): string {
    return d instanceof Date ? d.toISOString().split('T')[0] : d;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Newest published table for one source, or one pair from it. No API key needed.
   *
   * `rate_date` is the publisher's own date and may be earlier than today: most
   * sources publish on business days only. Record the date that comes back, not
   * the date you asked for — that is the audit trail.
   *
   * ```ts
   * await cb.latest('ecb');                                  // full table
   * await cb.latest('boj', { source: 'USD', target: 'JPY' }); // one pair
   * ```
   */
  async latest(bank: string, pair?: { source?: string; target?: string }): Promise<PublishedTable | PublishedPair> {
    return this.request(`/api/open/central-bank/${encodeURIComponent(bank.toLowerCase())}`, {
      source: pair?.source?.toUpperCase(),
      target: pair?.target?.toUpperCase(),
    });
  }

  /**
   * Every covered institution, with its code, home currency and coverage window.
   * The `code` is what every other method takes as `bank`.
   */
  async sources(): Promise<{ banks: Array<Record<string, unknown>>; disclaimer: string }> {
    if (this.keyless) throw new NeedsApiKeyError('Listing sources with coverage dates');
    return this.request('/api/v1/central-banks');
  }

  /**
   * The table in force on a given date. Weekends and holidays roll back to the
   * last date the institution actually published; the returned `rate_date` says
   * which.
   */
  async forDate(
    bank: string,
    on: DateLike,
    pair?: { source?: string; target?: string },
  ): Promise<PublishedTable | PublishedPair> {
    if (this.keyless) throw new NeedsApiKeyError(`The ${bank} table for a specific date`);
    return this.request(
      `/api/v1/central-bank/${encodeURIComponent(bank.toLowerCase())}/${this.formatDate(on)}`,
      { source: pair?.source?.toUpperCase(), target: pair?.target?.toUpperCase() },
    );
  }

  /**
   * Date-by-date official series for one pair from one institution.
   *
   * Volume-billed: one call per currency per month of data returned. Request the
   * window you need rather than a year to be safe.
   */
  async history(
    bank: string,
    options: { symbol?: string; source?: string; target?: string; from?: DateLike; to?: DateLike } = {},
  ): Promise<Record<string, unknown>> {
    if (this.keyless) throw new NeedsApiKeyError('Historical series');
    return this.request(`/api/v1/central-bank/${encodeURIComponent(bank.toLowerCase())}/history`, {
      symbol: options.symbol?.toUpperCase(),
      source: options.source?.toUpperCase(),
      target: options.target?.toUpperCase(),
      from: options.from ? this.formatDate(options.from) : undefined,
      to: options.to ? this.formatDate(options.to) : undefined,
    });
  }

  /**
   * Which dates an institution actually published on (no rate values), so a gap
   * in a reconciliation reads as a publication holiday rather than missing data.
   */
  async availability(
    bank: string,
    options: { year?: number; from?: DateLike; to?: DateLike } = {},
  ): Promise<Record<string, unknown>> {
    if (this.keyless) throw new NeedsApiKeyError('Publication calendars');
    return this.request(`/api/v1/central-bank/${encodeURIComponent(bank.toLowerCase())}/availability`, {
      year: options.year ? String(options.year) : undefined,
      from: options.from ? this.formatDate(options.from) : undefined,
      to: options.to ? this.formatDate(options.to) : undefined,
    });
  }

  /**
   * One currency pair as published by every institution that covers it, with
   * spread statistics — how much "the" exchange rate depends on who published it.
   */
  async compare(source: string, target: string): Promise<Record<string, unknown>> {
    if (this.keyless) throw new NeedsApiKeyError('Cross-source comparison');
    return this.request('/api/v1/central-banks/rates', {
      source: source.toUpperCase(),
      target: target.toUpperCase(),
    });
  }
}

export default CentralBankRates;
