"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AllRatesToday: () => AllRatesToday,
  AllRatesTodayError: () => AllRatesTodayError,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var DEFAULT_BASE_URL = "https://allratestoday.com";
var DEFAULT_TIMEOUT = 1e4;
var AllRatesTodayError = class extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AllRatesTodayError";
    this.status = status;
  }
};
var AllRatesToday = class {
  /**
   * Create an AllRatesToday client.
   *
   * ```ts
   * const client = new AllRatesToday({ apiKey: 'art_live_...' });
   * ```
   *
   * @param options - Configuration. Get a free API key at https://allratestoday.com/register
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }
  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------
  resolveKey(override) {
    const key = override || this.apiKey;
    if (!key) {
      throw new AllRatesTodayError(
        "API key is required. Register for free at https://allratestoday.com/register"
      );
    }
    return key;
  }
  async request(path, params = {}, keyOverride) {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== void 0 && value !== "") {
        url.searchParams.set(key, value);
      }
    }
    const headers = {};
    const apiKey = keyOverride || this.apiKey;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const response = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(this.timeout)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new AllRatesTodayError(
        error.error || `HTTP ${response.status}`,
        response.status
      );
    }
    return response.json();
  }
  formatDate(date) {
    if (date instanceof Date) {
      return date.toISOString().split("T")[0];
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
  async latest(options = {}) {
    const key = this.resolveKey(options.apiKey);
    const params = {};
    params.source = options.base || "USD";
    if (options.symbols?.length) {
      params.target = options.symbols.join(",");
    }
    const raw = await this.request(
      "/api/v1/rates",
      params,
      key
    );
    const ratesArray = Array.isArray(raw) ? raw : [raw];
    const rates = {};
    let date = "";
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
  async forDate(date, options = {}) {
    const key = this.resolveKey(options.apiKey);
    const dateStr = this.formatDate(date);
    const params = {
      source: options.base || "USD",
      from: dateStr,
      to: dateStr
    };
    if (options.symbols?.length) {
      params.target = options.symbols.join(",");
    }
    const raw = await this.request(
      "/api/historical-rates",
      params,
      key
    );
    const rates = {};
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
  async timeSeries(startDate, endDate, options = {}) {
    const key = this.resolveKey(options.apiKey);
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    const source = options.base || "USD";
    const params = {
      source,
      from: start,
      to: end
    };
    if (options.symbols?.length) {
      params.target = options.symbols.join(",");
    }
    const raw = await this.request(
      "/api/historical-rates",
      params,
      key
    );
    const rates = {};
    if (raw.rates) {
      for (const point of raw.rates) {
        const dateKey = point.time.split("T")[0];
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
  async symbols(options = {}) {
    const key = this.resolveKey(options.apiKey);
    return this.request("/api/v1/symbols", {}, key);
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
  async getRate(from, to, amount, options = {}) {
    const key = this.resolveKey(options.apiKey);
    const params = { source: from, target: to };
    if (amount !== void 0) params.amount = String(amount);
    return this.request("/api/v1/rates", params, key);
  }
  /**
   * Get authenticated exchange rates with metadata.
   *
   * ```ts
   * const rates = await client.getRates('USD', 'EUR');
   * rates.forEach(r => console.log(`${r.source}/${r.target}: ${r.rate} at ${r.time}`));
   * ```
   */
  async getRates(source, target, options = {}) {
    const key = this.resolveKey(options.apiKey);
    return this.request("/api/v1/rates", { source, target }, key);
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
  async getHistoricalRates(source, target, period = "7d", options = {}) {
    const key = this.resolveKey(options.apiKey);
    return this.request(
      "/api/historical-rates",
      { source, target, period },
      key
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
  async convert(from, to, amount, options = {}) {
    const key = this.resolveKey(options.apiKey);
    if (options.date) {
      const dateStr = this.formatDate(options.date);
      const params = {
        source: from,
        target: to,
        from: dateStr,
        to: dateStr
      };
      const raw = await this.request(
        "/api/historical-rates",
        params,
        key
      );
      const rate = raw.current?.rate ?? raw.rates?.[0]?.rate ?? 0;
      return { from, to, amount, result: Number((amount * rate).toFixed(6)), rate, date: dateStr };
    }
    const data = await this.request(
      "/api/v1/rates",
      { source: from, target: to, amount: String(amount) },
      key
    );
    return {
      from,
      to,
      amount,
      result: data.to.amount,
      rate: data.rate
    };
  }
};
var index_default = AllRatesToday;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AllRatesToday,
  AllRatesTodayError
});
