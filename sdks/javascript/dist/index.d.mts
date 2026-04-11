interface AllRatesTodayOptions {
    /** API key. Register for free at https://allratestoday.com/register */
    apiKey?: string;
    /** API base URL. Default: `https://allratestoday.com` */
    baseUrl?: string;
    /** Request timeout in milliseconds. Default: `10000` */
    timeout?: number;
}
interface RequestOptions {
    /** Override the API key for this request only. */
    apiKey?: string;
}
interface RateResponse {
    from: {
        currency: string;
        amount: number;
    };
    to: {
        currency: string;
        amount: number;
    };
    rate: number;
    source: string;
}
interface AuthRateResponse {
    rate: number;
    source: string;
    target: string;
    time: string;
}
interface LatestOptions extends RequestOptions {
    /** Base currency code. Default: `USD` */
    base?: string;
    /** Array of target currency codes. If omitted, returns all available. */
    symbols?: string[];
}
interface LatestResponse {
    base: string;
    date: string;
    rates: Record<string, number>;
}
interface ForDateOptions extends RequestOptions {
    /** Base currency code. Default: `USD` */
    base?: string;
    /** Array of target currency codes. */
    symbols?: string[];
}
interface ForDateResponse {
    base: string;
    date: string;
    rates: Record<string, number>;
}
interface ConvertOptions extends RequestOptions {
    /** Historical date for conversion (YYYY-MM-DD or Date object). */
    date?: string | Date;
}
interface ConvertResponse {
    from: string;
    to: string;
    amount: number;
    result: number;
    rate: number;
    date?: string;
}
interface TimeSeriesOptions extends RequestOptions {
    /** Base currency code. Default: `USD` */
    base?: string;
    /** Array of target currency codes. */
    symbols?: string[];
}
interface TimeSeriesResponse {
    base: string;
    startDate: string;
    endDate: string;
    rates: Record<string, Record<string, number>>;
}
interface HistoricalRateResponse {
    source: string;
    target: string;
    period: string;
    current: {
        rate: number;
        time: string;
    };
    rates: Array<{
        rate: number;
        time: string;
    }>;
}
interface SymbolsResponse {
    symbols: Record<string, string>;
}
declare class AllRatesTodayError extends Error {
    /** HTTP status code (when available). */
    status?: number;
    constructor(message: string, status?: number);
}
declare class AllRatesToday {
    private apiKey?;
    private baseUrl;
    private timeout;
    /**
     * Create an AllRatesToday client.
     *
     * ```ts
     * const client = new AllRatesToday({ apiKey: 'art_live_...' });
     * ```
     *
     * @param options - Configuration. Get a free API key at https://allratestoday.com/register
     */
    constructor(options?: AllRatesTodayOptions);
    private resolveKey;
    private request;
    private formatDate;
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
    latest(options?: LatestOptions): Promise<LatestResponse>;
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
    forDate(date: string | Date, options?: ForDateOptions): Promise<ForDateResponse>;
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
    timeSeries(startDate: string | Date, endDate: string | Date, options?: TimeSeriesOptions): Promise<TimeSeriesResponse>;
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
    symbols(options?: RequestOptions): Promise<SymbolsResponse>;
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
    getRate(from: string, to: string, amount?: number, options?: RequestOptions): Promise<RateResponse>;
    /**
     * Get authenticated exchange rates with metadata.
     *
     * ```ts
     * const rates = await client.getRates('USD', 'EUR');
     * rates.forEach(r => console.log(`${r.source}/${r.target}: ${r.rate} at ${r.time}`));
     * ```
     */
    getRates(source: string, target: string, options?: RequestOptions): Promise<AuthRateResponse[]>;
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
    getHistoricalRates(source: string, target: string, period?: '1d' | '7d' | '30d' | '1y', options?: RequestOptions): Promise<HistoricalRateResponse>;
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
    convert(from: string, to: string, amount: number, options?: ConvertOptions): Promise<ConvertResponse>;
}

export { AllRatesToday, AllRatesTodayError, type AllRatesTodayOptions, type AuthRateResponse, type ConvertOptions, type ConvertResponse, type ForDateOptions, type ForDateResponse, type HistoricalRateResponse, type LatestOptions, type LatestResponse, type RateResponse, type RequestOptions, type SymbolsResponse, type TimeSeriesOptions, type TimeSeriesResponse, AllRatesToday as default };
