const DEFAULT_BASE_URL = 'https://allratestoday.com';
const DEFAULT_TIMEOUT = 10000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AllRatesTodayOptions {
  /** API key. Register for free at https://allratestoday.com/register */
  apiKey?: string;
  /** API base URL. Default: `https://allratestoday.com` */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: `10000` */
  timeout?: number;
}

export interface RequestOptions {
  /** Override the API key for this request only. */
  apiKey?: string;
}

export interface RateResponse {
  from: { currency: string; amount: number };
  to: { currency: string; amount: number };
  rate: number;
  source: string;
}

export interface AuthRateResponse {
  rate: number;
  source: string;
  target: string;
  time: string;
}

export interface LatestOptions extends RequestOptions {
  /** Base currency code. Default: `USD` */
  base?: string;
  /** Array of target currency codes. If omitted, returns all available. */
  symbols?: string[];
}

export interface LatestResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface ForDateOptions extends RequestOptions {
  /** Base currency code. Default: `USD` */
  base?: string;
  /** Array of target currency codes. */
  symbols?: string[];
}

export interface ForDateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface ConvertOptions extends RequestOptions {
  /** Historical date for conversion (YYYY-MM-DD or Date object). */
  date?: string | Date;
}

export interface ConvertResponse {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  date?: string;
}

export interface TimeSeriesOptions extends RequestOptions {
  /** Base currency code. Default: `USD` */
  base?: string;
  /** Array of target currency codes. */
  symbols?: string[];
}

export interface TimeSeriesResponse {
  base: string;
  startDate: string;
  endDate: string;
  rates: Record<string, Record<string, number>>;
}

export interface HistoricalRateResponse {
  source: string;
  target: string;
  period: string;
  current: { rate: number; time: string };
  rates: Array<{ rate: number; time: string }>;
}

export interface SymbolsResponse {
  symbols: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export interface OfficialRateOptions extends RequestOptions {
  /** Base currency of the pair, e.g. `USD`. Give together with `target` to narrow to one pair. */
  source?: string;
  /** Quote currency of the pair, e.g. `EUR`. Give together with `source` to narrow to one pair. */
  target?: string;
}

export interface OfficialRateEntry {
  base: string;
  quote: string;
  /** Rate type as the institution labels it, e.g. `reference`, `buy`, `sell`, `mid`. */
  type: string;
  value: number;
}

export interface OfficialRateAttribution {
  source: string;
  url: string;
  terms: string;
}

export interface OfficialRatesResponse {
  /** Source code, e.g. `ecb`, `fed`, `hmrc`. */
  bank: string;
  /** Publication date of the table (YYYY-MM-DD) — cite this, not today's date. */
  rate_date: string;
  /** Full published table. Present when no pair was requested. */
  rates?: OfficialRateEntry[];
  /** Pair fields. Present when `source` and `target` were given. */
  source?: string;
  target?: string;
  rate?: number;
  rate_type?: string;
  /** True when the pair was cross-computed inside the bank's own table rather than published directly. */
  derived?: boolean;
  method?: 'published' | 'inverse';
  /** True when the institution is behind its own publication schedule. */
  stale?: boolean;
  attribution: OfficialRateAttribution;
  free_key: string;
}

export interface OfficialSource {
  /** Pass this as `bank` to `officialRates()`. */
  code: string;
  name: string;
  /** Latest publication date, or null if never ingested. */
  latest: string | null;
  stale?: boolean;
  [extra: string]: unknown;
}

export interface OfficialSourcesResponse {
  sources: OfficialSource[];
  stale_count: number;
  checked_at: string;
  docs: string;
  free_key: string;
}

export class AllRatesTodayError extends Error {
  /** HTTP status code (when available). */
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AllRatesTodayError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class AllRatesToday {
  private apiKey?: string;
  private baseUrl: string;
  private timeout: number;

  /**
   * Create an AllRatesToday client.
   *
   * ```ts
   * const client = new AllRatesToday({ apiKey: 'art_live_...' });
   * ```
   *
   * @param options - Configuration. Get a free API key at https://allratestoday.com/register
   */
  constructor(options: AllRatesTodayOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private resolveKey(override?: string): string {
    const key = override || this.apiKey;
    if (!key) {
      throw new AllRatesTodayError(
        'API key is required. Register for free at https://allratestoday.com/register'
      );
    }
    return key;
  }

  private async request<T>(
    path: string,
    params: Record<string, string> = {},
    keyOverride?: string,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {};
    const apiKey = keyOverride || this.apiKey;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new AllRatesTodayError(
        (error as any).error || `HTTP ${response.status}`,
        response.status,
      );
    }

    return response.json() as Promise<T>;
  }

  private formatDate(date: string | Date): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  /**
   * The history endpoint serves fixed windows ending today (7d, 30d, 1y) and
   * one target per call, so pick the smallest window that reaches `start`.
   */
  private windowFor(start: string): '7d' | '30d' | '1y' {
    const today = new Date().toISOString().split('T')[0];
    const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
    if (Number.isNaN(days)) throw new AllRatesTodayError(`Invalid date: ${start}. Use YYYY-MM-DD.`);
    if (days < 0) throw new AllRatesTodayError(`Date ${start} is in the future.`);
    if (days <= 6) return '7d';
    if (days <= 29) return '30d';
    if (days <= 364) return '1y';
    throw new AllRatesTodayError(`Historical market rates cover the last 365 days; ${start} is older.`);
  }

  private requireSymbols(symbols: string[] | undefined, method: string): string[] {
    if (!symbols?.length) {
      throw new AllRatesTodayError(`${method}() needs symbols, e.g. { symbols: ['EUR'] }.`);
    }
    return symbols;
  }

  private async historyPoints(
    source: string,
    target: string,
    period: string,
    key: string,
  ): Promise<Array<{ date: string; rate: number; timestamp: number }>> {
    const raw = await this.request<{ data?: Array<{ date: string; rate: number; timestamp: number }> }>(
      '/api/historical-rates',
      { source, target, period },
      key,
    );
    return (raw.data ?? []).slice().sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Rate on `date`, or the closest earlier point (the 1y window is weekly). */
  private async rateOn(source: string, target: string, date: string, key: string): Promise<number | undefined> {
    let rate: number | undefined;
    for (const p of await this.historyPoints(source, target, this.windowFor(date), key)) {
      if (p.date.slice(0, 10) > date) break;
      rate = p.rate;
    }
    return rate;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Get the latest exchange rates.
   *
   * ```ts
   * // All rates from USD
   * const data = await client.latest();
   *
   * // Specific symbols with EUR base
   * const data = await client.latest({ base: 'EUR', symbols: ['USD', 'GBP', 'JPY'] });
   * ```
   */
  async latest(options: LatestOptions = {}): Promise<LatestResponse> {
    const key = this.resolveKey(options.apiKey);
    const params: Record<string, string> = {};
    params.source = options.base || 'USD';
    if (options.symbols?.length) {
      params.target = options.symbols.join(',');
    }
    const raw = await this.request<AuthRateResponse | AuthRateResponse[]>(
      '/api/v1/rates',
      params,
      key,
    );
    const ratesArray = Array.isArray(raw) ? raw : [raw];
    const rates: Record<string, number> = {};
    let date = '';
    for (const r of ratesArray) {
      rates[r.target] = r.rate;
      if (r.time) date = r.time;
    }
    return { base: params.source, date, rates };
  }

  /**
   * Get exchange rates for a specific historical date.
   *
   * ```ts
   * // Using a string
   * const data = await client.forDate('2026-01-15');
   *
   * // Using a Date object
   * const data = await client.forDate(new Date('2026-01-15'));
   *
   * // With options
   * const data = await client.forDate('2026-01-15', { base: 'EUR', symbols: ['USD', 'GBP'] });
   * ```
   */
  async forDate(
    date: string | Date,
    options: ForDateOptions = {},
  ): Promise<ForDateResponse> {
    const key = this.resolveKey(options.apiKey);
    const dateStr = this.formatDate(date);
    const source = options.base || 'USD';
    const rates: Record<string, number> = {};
    for (const target of this.requireSymbols(options.symbols, 'forDate')) {
      const rate = await this.rateOn(source, target, dateStr, key);
      if (rate !== undefined) rates[target] = rate;
    }
    return { base: source, date: dateStr, rates };
  }

  /**
   * Get exchange rate time series between two dates.
   *
   * ```ts
   * const data = await client.timeSeries('2026-01-01', '2026-03-31', {
   *   base: 'USD',
   *   symbols: ['EUR', 'GBP'],
   * });
   *
   * // Access rates by date
   * console.log(data.rates['2026-01-15']); // { EUR: 0.92, GBP: 0.78 }
   * ```
   */
  async timeSeries(
    startDate: string | Date,
    endDate: string | Date,
    options: TimeSeriesOptions = {},
  ): Promise<TimeSeriesResponse> {
    const key = this.resolveKey(options.apiKey);
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    const source = options.base || 'USD';
    const period = this.windowFor(start);
    const rates: Record<string, Record<string, number>> = {};
    for (const target of this.requireSymbols(options.symbols, 'timeSeries')) {
      for (const point of await this.historyPoints(source, target, period, key)) {
        const day = point.date.slice(0, 10);
        if (day < start || day > end) continue;
        if (!rates[day]) rates[day] = {};
        rates[day][target] = point.rate;
      }
    }
    return { base: source, startDate: start, endDate: end, rates };
  }

  /**
   * Get all supported currency symbols.
   *
   * ```ts
   * const { symbols } = await client.symbols();
   * console.log(symbols);
   * // { USD: 'United States Dollar', EUR: 'Euro', GBP: 'British Pound', ... }
   *
   * // Build a currency dropdown
   * const options = Object.entries(symbols).map(([code, name]) => ({ code, name }));
   * ```
   */
  async symbols(options: RequestOptions = {}): Promise<SymbolsResponse> {
    const key = this.resolveKey(options.apiKey);
    // The endpoint returns { currencies: [{ code, name, symbol }], count }.
    const raw = await this.request<{ currencies?: Array<{ code: string; name: string }> }>('/api/v1/symbols', {}, key);
    const symbols: Record<string, string> = {};
    for (const c of raw.currencies ?? []) symbols[c.code] = c.name;
    return { symbols };
  }

  /**
   * Latest table of OFFICIAL rates published by a central bank or tax
   * authority (121 central banks + HMRC, US Treasury, Swiss BAZG). These are
   * the fixed, citable rates for invoicing, tax, customs and accounting — not
   * live market rates. **No API key needed.**
   *
   * ```ts
   * // Full ECB reference table
   * const table = await client.officialRates('ecb');
   * console.log(table.rate_date, table.rates);
   *
   * // One pair — cross-computed inside the bank's table when not published directly
   * const usd = await client.officialRates('ecb', { source: 'EUR', target: 'USD' });
   * console.log(`ECB ${usd.rate_date}: 1 EUR = ${usd.rate} USD`);
   * ```
   *
   * Dated tables and history need a free key: see `/api/v1/central-bank/{bank}/{date}`.
   */
  async officialRates(
    bank: string,
    options: OfficialRateOptions = {},
  ): Promise<OfficialRatesResponse> {
    const code = bank.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,20}$/.test(code)) {
      throw new AllRatesTodayError(`Invalid source code: ${bank}. Call officialSources() for the list.`);
    }
    if (Boolean(options.source) !== Boolean(options.target)) {
      throw new AllRatesTodayError('Provide both source and target, or neither.');
    }
    const params: Record<string, string> = {};
    if (options.source && options.target) {
      params.source = options.source.toUpperCase();
      params.target = options.target.toUpperCase();
    }
    return this.request<OfficialRatesResponse>(
      `/api/open/central-bank/${encodeURIComponent(code)}`,
      params,
      options.apiKey,
    );
  }

  /**
   * Every covered official source with its code, name, latest publication
   * date and whether it is behind schedule. **No API key needed.**
   *
   * ```ts
   * const { sources } = await client.officialSources();
   * const behind = sources.filter((s) => s.stale).map((s) => s.code);
   * ```
   */
  async officialSources(options: RequestOptions = {}): Promise<OfficialSourcesResponse> {
    return this.request<OfficialSourcesResponse>('/api/open/central-banks', {}, options.apiKey);
  }

  /**
   * Get exchange rate between two currencies.
   *
   * ```ts
   * const rate = await client.getRate('USD', 'EUR');
   * console.log(`1 USD = ${rate.rate} EUR`);
   *
   * // With amount
   * const rate = await client.getRate('USD', 'EUR', 1000);
   * console.log(`$1,000 = €${rate.to.amount}`);
   * ```
   */
  async getRate(
    from: string,
    to: string,
    amount?: number,
    options: RequestOptions = {},
  ): Promise<RateResponse> {
    const key = this.resolveKey(options.apiKey);
    const params: Record<string, string> = { source: from, target: to };
    if (amount !== undefined) params.amount = String(amount);
    return this.request<RateResponse>('/api/v1/rates', params, key);
  }

  /**
   * Get authenticated exchange rates with metadata.
   *
   * ```ts
   * const rates = await client.getRates('USD', 'EUR');
   * rates.forEach(r => console.log(`${r.source}/${r.target}: ${r.rate} at ${r.time}`));
   * ```
   */
  async getRates(
    source: string,
    target: string,
    options: RequestOptions = {},
  ): Promise<AuthRateResponse[]> {
    const key = this.resolveKey(options.apiKey);
    return this.request<AuthRateResponse[]>('/api/v1/rates', { source, target }, key);
  }

  /**
   * Get historical rates by period.
   *
   * ```ts
   * const history = await client.getHistoricalRates('USD', 'EUR', '30d');
   * history.rates.forEach(point => {
   *   console.log(`${point.time}: ${point.rate}`);
   * });
   * ```
   */
  async getHistoricalRates(
    source: string,
    target: string,
    period: '1d' | '7d' | '30d' | '1y' = '7d',
    options: RequestOptions = {},
  ): Promise<HistoricalRateResponse> {
    const key = this.resolveKey(options.apiKey);
    return this.request<HistoricalRateResponse>(
      '/api/historical-rates',
      { source, target, period },
      key,
    );
  }

  /**
   * Convert an amount between two currencies.
   *
   * ```ts
   * // Current rate
   * const result = await client.convert('USD', 'EUR', 1000);
   * console.log(`$1,000 = €${result.result}`);
   *
   * // Historical conversion
   * const result = await client.convert('USD', 'EUR', 1000, { date: '2026-01-15' });
   * console.log(`Rate on Jan 15: ${result.rate}`);
   * ```
   */
  async convert(
    from: string,
    to: string,
    amount: number,
    options: ConvertOptions = {},
  ): Promise<ConvertResponse> {
    const key = this.resolveKey(options.apiKey);

    if (options.date) {
      // Historical conversion
      const dateStr = this.formatDate(options.date);
      const rate = await this.rateOn(from, to, dateStr, key);
      if (rate === undefined) {
        throw new AllRatesTodayError(`No ${from}/${to} rate available on or before ${dateStr}`);
      }
      return { from, to, amount, result: Number((amount * rate).toFixed(6)), rate, date: dateStr };
    }

    // Current conversion
    const data = await this.request<RateResponse>(
      '/api/v1/rates',
      { source: from, target: to, amount: String(amount) },
      key,
    );
    return {
      from,
      to,
      amount,
      result: data.to.amount,
      rate: data.rate,
    };
  }
}

export default AllRatesToday;
