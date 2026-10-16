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
  /** Units of `to` per 1 unit of `from`. */
  rate: number;
  /** Rate type label, e.g. `interbank` (live mid-market). */
  source: string;
  /** Rate timestamp (ISO 8601, UTC) when the API returns one. */
  time?: string;
}

export interface AuthRateResponse {
  /** Units of `target` per 1 unit of `source`. */
  rate: number;
  /** Base currency code. */
  source: string;
  /** Quote currency code. */
  target: string;
  /** Rate timestamp (ISO 8601, UTC). */
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
  /** Timestamp of the rates (ISO 8601, UTC). */
  date: string;
  /** Units of each currency per 1 unit of `base`. */
  rates: Record<string, number>;
}

export interface ForDateOptions extends RequestOptions {
  /** Base currency code. Default: `USD` */
  base?: string;
  /** Target currency codes (required). Each symbol is one history request. */
  symbols: string[];
}

export interface ForDateResponse {
  base: string;
  /** The date you asked for (YYYY-MM-DD). */
  date: string;
  rates: Record<string, number>;
  /** Date of the data point actually used per currency. Equal to `date` unless no point exists for that day (then the closest earlier one). */
  rateDates: Record<string, string>;
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
  /** Requested date, for historical conversions. */
  date?: string;
  /** Date of the data point actually used, for historical conversions. */
  rateDate?: string;
}

export interface TimeSeriesOptions extends RequestOptions {
  /** Base currency code. Default: `USD` */
  base?: string;
  /** Target currency codes (required). Each symbol is one history request. */
  symbols: string[];
}

export interface TimeSeriesResponse {
  base: string;
  startDate: string;
  endDate: string;
  rates: Record<string, Record<string, number>>;
}

export type HistoryPeriod = '1d' | '7d' | '30d' | '1y';

export interface HistoryPoint {
  /** `YYYY-MM-DD` for daily/weekly points, full ISO timestamp for hourly (`1d`) points. */
  date: string;
  rate: number;
  /** Unix time in milliseconds. */
  timestamp: number;
}

export interface HistoricalRateResponse {
  source: string;
  target: string;
  period: string;
  /** Most recent point in the series. */
  current: { rate: number; time: string };
  /** Points oldest first. `time` is the point's date (or timestamp for `1d`). */
  rates: Array<{ rate: number; time: string }>;
  /** Raw points as the API returns them. */
  data: HistoryPoint[];
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface SymbolsResponse {
  /** Code → name, e.g. `{ USD: 'US Dollar' }`. */
  symbols: Record<string, string>;
  /** Full list with display symbols. */
  currencies: CurrencyInfo[];
  count: number;
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
  /** True when the pair is not published as-is: the inverse of a published rate (keyless), or a cross via the bank's base (`officialRatesOn`). */
  derived?: boolean;
  method?: 'published' | 'inverse' | 'cross';
  /** True when the institution is behind its own publication schedule. */
  stale?: boolean;
  attribution: OfficialRateAttribution;
  free_key: string;
}

export interface DatedOfficialRatesResponse {
  bank: string;
  /** Institution name, e.g. `European Central Bank`. */
  name: string;
  /** The date you asked for (YYYY-MM-DD). */
  requested_date: string;
  /** Publication date of the table actually returned. Earlier than `requested_date` on weekends/holidays. */
  rate_date: string;
  published_on_requested_date: boolean;
  /** Full published table. Present when no pair was requested. */
  rates?: OfficialRateEntry[];
  source?: string;
  target?: string;
  rate?: number;
  rate_type?: string;
  derived?: boolean;
  method?: 'published' | 'inverse' | 'cross';
  disclaimer?: string;
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

export type AllRatesTodayErrorCode = 'missing_key' | 'invalid_argument' | 'http' | 'timeout' | 'network';

export class AllRatesTodayError extends Error {
  /** HTTP status code, for `code: 'http'` errors. */
  status?: number;
  /** What went wrong: `missing_key`, `invalid_argument`, `http`, `timeout` or `network`. */
  code: AllRatesTodayErrorCode;
  /** Parsed JSON error body from the API, e.g. `{ error, used, limit, plan, resets_at }` on 429. */
  details?: Record<string, unknown>;

  constructor(
    message: string,
    status?: number,
    code?: AllRatesTodayErrorCode,
    details?: Record<string, unknown>,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = 'AllRatesTodayError';
    this.status = status;
    this.code = code ?? (status !== undefined ? 'http' : 'invalid_argument');
    this.details = details;
    if (options?.cause !== undefined) (this as { cause?: unknown }).cause = options.cause;
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
        'API key is required. Register for free at https://allratestoday.com/register',
        undefined,
        'missing_key',
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

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw new AllRatesTodayError(`Request timed out after ${this.timeout} ms`, undefined, 'timeout', undefined, { cause: err });
      }
      throw new AllRatesTodayError(
        `Network error: ${(err as Error)?.message ?? String(err)}`,
        undefined,
        'network',
        undefined,
        { cause: err },
      );
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: response.statusText }));
      const details = body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined;
      throw new AllRatesTodayError(
        (details?.error as string) || `HTTP ${response.status}`,
        response.status,
        'http',
        details,
      );
    }

    return response.json() as Promise<T>;
  }

  private formatDate(date: string | Date): string {
    const str = date instanceof Date ? date.toISOString().split('T')[0] : date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str) || Number.isNaN(Date.parse(`${str}T00:00:00Z`))) {
      throw new AllRatesTodayError(`Invalid date: ${String(date)}. Use YYYY-MM-DD or a Date.`);
    }
    return str;
  }

  private requireSymbols(symbols: string[] | undefined, method: string): string[] {
    if (!symbols?.length) {
      throw new AllRatesTodayError(`${method}() needs symbols, e.g. { symbols: ['EUR'] }. Each symbol is one request.`);
    }
    return symbols;
  }

  /**
   * Smallest history window that reaches back to `start`. Market history is
   * served as windows ending today (7 days, 30 days, 1 year), so older dates
   * are not available from the market-rate API.
   */
  private windowFor(start: string): '7d' | '30d' | '1y' {
    const today = new Date().toISOString().split('T')[0];
    const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
    if (days < 0) throw new AllRatesTodayError(`Date ${start} is in the future.`);
    if (days <= 6) return '7d';
    if (days <= 29) return '30d';
    if (days <= 364) return '1y';
    throw new AllRatesTodayError(
      `Market-rate history covers the last 365 days; ${start} is older. ` +
      'For older dates use official central-bank rates: GET /api/v1/central-bank/{bank}/{date} (e.g. ECB from 1999).',
    );
  }

  private async history(
    source: string,
    target: string,
    period: HistoryPeriod,
    key: string,
  ): Promise<HistoryPoint[]> {
    const raw = await this.request<{ data?: HistoryPoint[] }>(
      '/api/historical-rates',
      { source, target, period },
      key,
    );
    return (raw.data ?? []).slice().sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Last point on or before `date` (YYYY-MM-DD). */
  private pointOn(points: HistoryPoint[], date: string): HistoryPoint | undefined {
    let hit: HistoryPoint | undefined;
    for (const p of points) {
      if (p.date.slice(0, 10) <= date) hit = p;
      else break;
    }
    return hit;
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
   * Get mid-market rates for a past date within the last 365 days.
   *
   * One history request per symbol. Billed per request by window: dates up to
   * 29 days ago cost 1 call per symbol, older dates (up to 1 year) cost 12,
   * because the 1-year window is weekly points. If a day has no point, the
   * closest earlier one is used and reported in `rateDates`.
   *
   * ```ts
   * const data = await client.forDate('2026-10-01', { base: 'USD', symbols: ['EUR', 'GBP'] });
   * // { base: 'USD', date: '2026-10-01', rates: { EUR: 0.85, GBP: 0.74 }, rateDates: { ... } }
   * ```
   */
  async forDate(
    date: string | Date,
    options: ForDateOptions,
  ): Promise<ForDateResponse> {
    const key = this.resolveKey(options?.apiKey);
    const dateStr = this.formatDate(date);
    const symbols = this.requireSymbols(options?.symbols, 'forDate');
    const base = (options.base || 'USD').toUpperCase();
    const period = this.windowFor(dateStr);
    const rates: Record<string, number> = {};
    const rateDates: Record<string, string> = {};
    for (const sym of symbols) {
      const target = sym.toUpperCase();
      const point = this.pointOn(await this.history(base, target, period, key), dateStr);
      if (point) {
        rates[target] = point.rate;
        rateDates[target] = point.date.slice(0, 10);
      }
    }
    return { base, date: dateStr, rates, rateDates };
  }

  /**
   * Daily mid-market rates between two dates within the last 365 days.
   *
   * One history request per symbol. Ranges starting up to 29 days ago return
   * daily points (1 call per symbol); older starts use the 1-year window,
   * which has weekly points and costs 12 calls per symbol.
   *
   * ```ts
   * const data = await client.timeSeries('2026-10-01', '2026-10-10', { symbols: ['EUR', 'GBP'] });
   * console.log(data.rates['2026-10-05']); // { EUR: 0.86, GBP: 0.75 }
   * ```
   */
  async timeSeries(
    startDate: string | Date,
    endDate: string | Date,
    options: TimeSeriesOptions,
  ): Promise<TimeSeriesResponse> {
    const key = this.resolveKey(options?.apiKey);
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    if (start > end) throw new AllRatesTodayError(`startDate ${start} is after endDate ${end}.`);
    const symbols = this.requireSymbols(options?.symbols, 'timeSeries');
    const base = (options.base || 'USD').toUpperCase();
    const period = this.windowFor(start);
    const rates: Record<string, Record<string, number>> = {};
    for (const sym of symbols) {
      const target = sym.toUpperCase();
      for (const point of await this.history(base, target, period, key)) {
        const day = point.date.slice(0, 10);
        if (day < start || day > end) continue;
        (rates[day] ??= {})[target] = point.rate;
      }
    }
    return { base, startDate: start, endDate: end, rates };
  }

  /**
   * Get all supported currency codes and names. **No API key needed.**
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
    const raw = await this.request<{ currencies?: CurrencyInfo[]; count?: number }>(
      '/api/v1/symbols',
      {},
      options.apiKey,
    );
    const currencies = raw.currencies ?? [];
    const symbols: Record<string, string> = {};
    for (const c of currencies) symbols[c.code] = c.name;
    return { symbols, currencies, count: raw.count ?? currencies.length };
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
   * // One pair — published as-is or the inverse of a published rate (`derived: true`)
   * const usd = await client.officialRates('ecb', { source: 'EUR', target: 'USD' });
   * console.log(`ECB ${usd.rate_date}: 1 EUR = ${usd.rate} USD`);
   * ```
   *
   * Cross pairs and past dates need a key: use `officialRatesOn()`.
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
   * Official table (or one pair) as published on a given date. Needs an API
   * key; 1 call. On weekends and holidays the last earlier publication is
   * returned (`published_on_requested_date: false`). Unlike the keyless
   * `officialRates()`, any pair inside the table can be cross-computed
   * (`method: 'cross'`), e.g. USD/GBP from the ECB's EUR table.
   *
   * ```ts
   * const r = await client.officialRatesOn('rbi', '2026-09-30', { source: 'USD', target: 'INR' });
   * console.log(r.rate_date, r.rate); // 2026-09-30 95.9832
   * ```
   */
  async officialRatesOn(
    bank: string,
    date: string | Date,
    options: OfficialRateOptions = {},
  ): Promise<DatedOfficialRatesResponse> {
    const key = this.resolveKey(options.apiKey);
    const code = bank.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,20}$/.test(code)) {
      throw new AllRatesTodayError(`Invalid source code: ${bank}. Call officialSources() for the list.`);
    }
    if (Boolean(options.source) !== Boolean(options.target)) {
      throw new AllRatesTodayError('Provide both source and target, or neither.');
    }
    const dateStr = this.formatDate(date);
    const params: Record<string, string> = {};
    if (options.source && options.target) {
      params.source = options.source.toUpperCase();
      params.target = options.target.toUpperCase();
    }
    return this.request<DatedOfficialRatesResponse>(
      `/api/v1/central-bank/${encodeURIComponent(code)}/${dateStr}`,
      params,
      key,
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
    const raw = await this.request<RateResponse | AuthRateResponse | AuthRateResponse[]>('/api/v1/rates', params, key);
    // Without `amount` the API answers with the rates array; normalise to one shape.
    if (Array.isArray(raw) || !('from' in raw)) {
      const r = Array.isArray(raw) ? raw[0] : raw;
      if (!r) throw new AllRatesTodayError(`No rate returned for ${from}/${to}`);
      const qty = amount ?? 1;
      return {
        from: { currency: r.source, amount: qty },
        to: { currency: r.target, amount: Number((qty * r.rate).toFixed(6)) },
        rate: r.rate,
        source: 'interbank',
        time: r.time,
      };
    }
    return raw;
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
    const raw = await this.request<AuthRateResponse | AuthRateResponse[]>('/api/v1/rates', { source, target }, key);
    return Array.isArray(raw) ? raw : [raw];
  }

  /**
   * Mid-market history for a preset window ending today: `1d` (hourly),
   * `7d` / `30d` (daily) or `1y` (weekly). `1y` is billed as 12 calls.
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
    period: HistoryPeriod = '7d',
    options: RequestOptions = {},
  ): Promise<HistoricalRateResponse> {
    const key = this.resolveKey(options.apiKey);
    const data = await this.history(source, target, period, key);
    const rates = data.map((p) => ({ rate: p.rate, time: p.date }));
    const last = rates[rates.length - 1];
    return {
      source: source.toUpperCase(),
      target: target.toUpperCase(),
      period,
      current: last ?? { rate: 0, time: '' },
      rates,
      data,
    };
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
      const target = to.toUpperCase();
      const day = await this.forDate(dateStr, { base: from, symbols: [target], apiKey: key });
      const rate = day.rates[target];
      if (rate === undefined) {
        throw new AllRatesTodayError(`No ${from}/${to} rate available on or before ${dateStr}`);
      }
      return {
        from,
        to,
        amount,
        result: Number((amount * rate).toFixed(6)),
        rate,
        date: dateStr,
        rateDate: day.rateDates[target],
      };
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
