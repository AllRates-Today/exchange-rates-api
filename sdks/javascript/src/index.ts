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
    const params: Record<string, string> = {
      source: options.base || 'USD',
      from: dateStr,
      to: dateStr,
    };
    if (options.symbols?.length) {
      params.target = options.symbols.join(',');
    }
    const raw = await this.request<HistoricalRateResponse>(
      '/api/historical-rates',
      params,
      key,
    );
    const rates: Record<string, number> = {};
    if (raw.rates?.length) {
      for (const r of raw.rates) {
        rates[raw.target] = r.rate;
      }
    }
    if (raw.current) {
      rates[raw.target] = raw.current.rate;
    }
    return { base: params.source, date: dateStr, rates };
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
    const params: Record<string, string> = {
      source,
      from: start,
      to: end,
    };
    if (options.symbols?.length) {
      params.target = options.symbols.join(',');
    }
    const raw = await this.request<HistoricalRateResponse>(
      '/api/historical-rates',
      params,
      key,
    );
    const rates: Record<string, Record<string, number>> = {};
    if (raw.rates) {
      for (const point of raw.rates) {
        const dateKey = point.time.split('T')[0];
        if (!rates[dateKey]) rates[dateKey] = {};
        rates[dateKey][raw.target] = point.rate;
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
    return this.request<SymbolsResponse>('/api/v1/symbols', {}, key);
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
      const params: Record<string, string> = {
        source: from,
        target: to,
        from: dateStr,
        to: dateStr,
      };
      const raw = await this.request<HistoricalRateResponse>(
        '/api/historical-rates',
        params,
        key,
      );
      const rate = raw.current?.rate ?? raw.rates?.[0]?.rate ?? 0;
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
