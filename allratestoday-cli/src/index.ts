/**
 * allratestoday — lightweight currency exchange rates library.
 *
 * Fetches real-time mid-market rates from the AllRatesToday API
 * (Refinitiv / Reuters / interbank feeds, 160+ currencies).
 *
 * Basic usage:
 *   import { rate } from "allratestoday";
 *   const r = await rate("USD", "INR");
 *   // { date: "2026-04-20", base: "USD", target: "INR", rate: 83.2145 }
 */

export interface RateResult {
  date: string;
  base: string;
  target: string;
  rate: number;
}

export interface RateOptions {
  /** API key. Falls back to process.env.ALLRATESTODAY_API_KEY. */
  apiKey?: string;
  /** Override the base URL (for staging / self-hosted proxies). */
  baseUrl?: string;
  /** Custom fetch implementation (for older runtimes / testing). */
  fetch?: typeof fetch;
  /** Request timeout in milliseconds (default 15000). */
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = "https://allratestoday.com";
const CCY_PATTERN = /^[A-Z]{3,4}$/;

export class AllRatesTodayError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AllRatesTodayError";
    this.status = status;
  }
}

function resolveApiKey(opts?: RateOptions): string {
  const key =
    opts?.apiKey ??
    (typeof process !== "undefined" ? process.env?.ALLRATESTODAY_API_KEY : undefined);
  if (!key) {
    throw new AllRatesTodayError(
      "Missing API key. Pass options.apiKey or set ALLRATESTODAY_API_KEY env var. " +
        "Get a free key at https://allratestoday.com/register/"
    );
  }
  return key;
}

function validateCode(code: string, label: string): string {
  if (typeof code !== "string") {
    throw new AllRatesTodayError(`${label} must be a string`);
  }
  const upper = code.trim().toUpperCase();
  if (!CCY_PATTERN.test(upper)) {
    throw new AllRatesTodayError(`${label} must be an ISO 4217 code (e.g. "USD")`);
  }
  return upper;
}

/**
 * Fetch the current mid-market exchange rate for a single pair.
 *
 * @example
 *   const r = await rate("USD", "INR");
 *   // { date: "2026-04-20", base: "USD", target: "INR", rate: 83.2145 }
 */
export async function rate(
  base: string,
  target: string,
  options?: RateOptions
): Promise<RateResult> {
  const baseCode = validateCode(base, "base");
  const targetCode = validateCode(target, "target");
  const apiKey = resolveApiKey(options);
  const baseUrl = (options?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const fetchImpl = options?.fetch ?? (globalThis.fetch as typeof fetch | undefined);

  if (!fetchImpl) {
    throw new AllRatesTodayError(
      "fetch is not available in this runtime. Use Node 18+ or pass options.fetch."
    );
  }

  const url = `${baseUrl}/api/rate?source=${baseCode}&target=${targetCode}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 15_000);

  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "allratestoday-node/1.0",
      },
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      throw new AllRatesTodayError(`Request timed out after ${options?.timeoutMs ?? 15_000}ms`);
    }
    throw new AllRatesTodayError(`Network error: ${err?.message ?? err}`);
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await safeText(res);
    throw new AllRatesTodayError(
      `AllRatesToday API error ${res.status}: ${body || res.statusText}`,
      res.status
    );
  }

  const json: any = await res.json().catch(() => null);
  const rateValue = typeof json?.rate === "number" ? json.rate : NaN;
  if (!Number.isFinite(rateValue)) {
    throw new AllRatesTodayError(`Invalid response: ${JSON.stringify(json)}`);
  }

  return {
    date: new Date().toISOString().split("T")[0]!,
    base: baseCode,
    target: targetCode,
    rate: rateValue,
  };
}

/**
 * Convert an amount from one currency to another using the current rate.
 *
 * @example
 *   const out = await convert(100, "USD", "EUR");
 *   // { from: { currency: "USD", amount: 100 }, to: { currency: "EUR", amount: 92.34 }, rate: 0.9234, date: "..." }
 */
export async function convert(
  amount: number,
  from: string,
  to: string,
  options?: RateOptions
): Promise<{
  from: { currency: string; amount: number };
  to: { currency: string; amount: number };
  rate: number;
  date: string;
}> {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new AllRatesTodayError("amount must be a finite number");
  }
  const r = await rate(from, to, options);
  return {
    from: { currency: r.base, amount },
    to: { currency: r.target, amount: +(amount * r.rate).toFixed(6) },
    rate: r.rate,
    date: r.date,
  };
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}

// Default export for CommonJS interop: `const art = require("allratestoday")`
export default { rate, convert, AllRatesTodayError };
