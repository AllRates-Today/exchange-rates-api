# Exchange Rate API — @allratestoday/sdk

[![npm version](https://img.shields.io/npm/v/@allratestoday/sdk.svg)](https://www.npmjs.com/package/@allratestoday/sdk)
[![codecov](https://codecov.io/gh/AllRates-Today/exchange-rates-api/branch/main/graph/badge.svg)](https://codecov.io/gh/AllRates-Today/exchange-rates-api)
[![license](https://img.shields.io/npm/l/@allratestoday/sdk.svg)](https://github.com/AllRates-Today/exchange-rates-api/blob/main/LICENSE)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://www.typescriptlang.org/)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@allratestoday/sdk)

Official JavaScript/TypeScript client for [AllRatesToday](https://allratestoday.com): live mid-market exchange rates for 160+ currencies, and the official rates published by 121 central banks and 3 tax authorities. Zero dependencies, ESM and CommonJS, full TypeScript types.

```bash
npm install @allratestoday/sdk
```

## Contents

- [Two kinds of rates](#two-kinds-of-rates)
- [Quick start](#quick-start)
- [API key and configuration](#api-key-and-configuration)
- [Browser and frontend apps](#browser-and-frontend-apps)
- [What a rate means](#what-a-rate-means)
- [Methods](#methods)
- [Errors, retries and troubleshooting](#errors-retries-and-troubleshooting)
- [Quotas and billing](#quotas-and-billing)
- [Compatibility](#compatibility)
- [TypeScript](#typescript)
- [Use it from an AI agent](#use-it-from-an-ai-agent)
- [Testing, contributing and support](#testing-contributing-and-support)

## Two kinds of rates

| | Mid-market rates | Official rates |
| --- | --- | --- |
| Use for | Pricing, checkout, conversion widgets, dashboards | Invoices, VAT/GST, customs, accounting, audits |
| What it is | Live mid-market rate, no retail spread | The figure a central bank or tax authority published |
| Updates | About every minute | Once per publication (usually each business day) |
| History | Last 365 days (`forDate`, `timeSeries`, `getHistoricalRates`) | Each bank's full archive (`officialRatesOn`), e.g. ECB from 1999 |
| API key | Required | Latest table: **no key** (`officialRates`). Past dates and cross pairs: key (`officialRatesOn`) |
| Methods | `latest`, `getRate`, `getRates`, `convert`, `forDate`, `timeSeries`, `getHistoricalRates` | `officialRates`, `officialRatesOn`, `officialSources` |

## Quick start

```ts
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: process.env.ALLRATESTODAY_API_KEY });

const { rates } = await client.latest({ base: 'USD', symbols: ['EUR', 'GBP', 'JPY'] });
console.log(rates); // { EUR: 0.889521, GBP: 0.750666, JPY: 157.95 }
```

No key yet? Official rates work without one:

```ts
const usdInr = await new AllRatesToday().officialRates('rbi', { source: 'USD', target: 'INR' });
console.log(usdInr.rate_date, usdInr.rate); // 2026-10-15 95.0691
```

Get a free key (300 requests, no card) at [allratestoday.com/register](https://allratestoday.com/register).

## API key and configuration

```ts
const client = new AllRatesToday({
  apiKey: process.env.ALLRATESTODAY_API_KEY, // needed for market rates and dated official rates
  baseUrl: 'https://allratestoday.com',      // optional
  timeout: 10000,                            // optional, ms
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | — | Sent as `Authorization: Bearer <key>`. Not needed for `officialRates`, `officialSources`, `symbols`. |
| `baseUrl` | `string` | `https://allratestoday.com` | Origin only. The SDK adds paths such as `/api/v1/rates`, so a proxy at another origin must serve the same paths. |
| `timeout` | `number` | `10000` | Per HTTP request, in ms. Applies to every method. On expiry the SDK throws `AllRatesTodayError` with `code: 'timeout'`. |

**Keep the key out of your code and your repo.** Load it from the environment (`.env` with your framework's loader, or your host's secret settings) and add `.env` to `.gitignore`:

```bash
# .env  (never commit this file)
ALLRATESTODAY_API_KEY=art_live_...
```

**Retries are not automatic.** Every method makes its requests once; see [retrying](#retrying-transient-failures) for a pattern.

**Per-request key override**, for multi-tenant apps: every method accepts `{ apiKey }` in its options.

```ts
await client.latest({ symbols: ['EUR'], apiKey: tenant.key });
await client.convert('USD', 'EUR', 100, { apiKey: tenant.key });
```

## Browser and frontend apps

> [!WARNING]
> Never put your API key in browser, mobile or desktop app code. Anyone can read it from the bundle or the network tab and spend your quota.

- **Keyless methods work in the browser.** `officialRates()`, `officialSources()` and `symbols()` call endpoints that send `Access-Control-Allow-Origin: *`.
- **Keyed methods are server-side only.** The keyed endpoints do not send CORS headers, so browsers block them anyway. Call them from your backend, an API route or a serverless function, and expose only what your frontend needs:

```ts
// app/api/rates/route.ts  (Next.js route handler — runs on the server)
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: process.env.ALLRATESTODAY_API_KEY });

export async function GET() {
  const { rates, date } = await client.latest({ base: 'USD', symbols: ['EUR', 'GBP'] });
  return Response.json({ rates, date }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
```

```ts
// In the browser: call your own endpoint, not AllRatesToday
const { rates } = await fetch('/api/rates').then((r) => r.json());
```

In SSR frameworks, create the client only in server code (route handlers, server components, `getServerSideProps`, loaders), never in a component that also runs in the browser.

## What a rate means

- **Direction.** Every rate is *units of the target per 1 unit of the base*. `latest({ base: 'USD', symbols: ['EUR'] })` → `rates.EUR = 0.8895` means 1 USD = 0.8895 EUR. For the reverse, use `1 / rate` or swap base and target.
- **Market timestamps** (`date` in `latest`, `time` in `getRate`/`getRates`) are UTC, ISO 8601, e.g. `2026-10-16T08:34:01+0000`.
- **Market history dates** are UTC calendar days (`YYYY-MM-DD`). `1d` history has hourly timestamps.
- **Official `rate_date`** is the day the institution published the table, not the time of your request. Cite it on invoices and filings.
- **Weekends and holidays.** Banks publish nothing on those days. `officialRatesOn()` returns the last earlier table and sets `published_on_requested_date: false`. `forDate()` uses the closest earlier point and reports it in `rateDates`.
- **Stale sources.** `stale: true` on an official response means the institution is behind its own publication schedule; the table is its latest one. `officialSources()` lists which sources are stale right now.
- **Derived official pairs.** `method: 'published'` is the bank's own figure; `'inverse'` is 1 / a published rate; `'cross'` is computed through the bank's base currency (only from `officialRatesOn`). `derived: true` for the last two.

## Methods

All methods return a Promise. Codes are ISO 4217 and case-insensitive. Dates are `YYYY-MM-DD` strings or `Date` objects (a `Date` is taken as its UTC day). "Calls" is how many requests the method counts against your quota.

| Method | Key | Calls |
| --- | --- | --- |
| [`latest(options?)`](#latestoptions) | yes | 1 |
| [`getRate(from, to, amount?, options?)`](#getratefrom-to-amount-options) | yes | 1 |
| [`getRates(source, target, options?)`](#getratessource-target-options) | yes | 1 |
| [`convert(from, to, amount, options?)`](#convertfrom-to-amount-options) | yes | 1 (historical: as `forDate`) |
| [`forDate(date, options)`](#fordatedate-options) | yes | per symbol: 1, or 12 if over 29 days ago |
| [`timeSeries(start, end, options)`](#timeseriesstart-end-options) | yes | per symbol: 1, or 12 if start over 29 days ago |
| [`getHistoricalRates(source, target, period?, options?)`](#gethistoricalratessource-target-period-options) | yes | 1, or 12 for `1y` |
| [`symbols(options?)`](#symbolsoptions) | no | — |
| [`officialRates(bank, options?)`](#officialratesbank-options) | no | — |
| [`officialRatesOn(bank, date, options?)`](#officialratesonbank-date-options) | yes | 1 |
| [`officialSources(options?)`](#officialsourcesoptions) | no | — |

### `latest(options?)`

Live mid-market rates from one base.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `base` | `string` | `'USD'` | Base currency |
| `symbols` | `string[]` | all (~160) | Target currencies; still one call |

```ts
const data = await client.latest({ base: 'USD', symbols: ['EUR', 'GBP', 'JPY'] });
// { base: 'USD', date: '2026-10-16T08:37:01+0000', rates: { EUR: 0.889521, GBP: 0.750666, JPY: 157.95 } }
```

### `getRate(from, to, amount?, options?)`

One pair, optionally converted.

```ts
await client.getRate('USD', 'EUR');
// { from: { currency: 'USD', amount: 1 }, to: { currency: 'EUR', amount: 0.889521 },
//   rate: 0.889521, source: 'interbank', time: '2026-10-16T08:38:01+0000' }

await client.getRate('USD', 'EUR', 500);
// { from: { currency: 'USD', amount: 500 }, to: { currency: 'EUR', amount: 444.7605 }, rate: 0.889521, source: 'interbank' }
```

`source` is the rate type label (`interbank` = mid-market), not a data vendor.

### `getRates(source, target, options?)`

Raw rate rows. `target` may be comma-separated (`'EUR,GBP'`) for several rows in one call.

```ts
await client.getRates('USD', 'EUR,GBP');
// [ { rate: 0.889403, source: 'USD', target: 'EUR', time: '2026-10-16T08:34:01+0000' },
//   { rate: 0.750723, source: 'USD', target: 'GBP', time: '2026-10-16T08:34:01+0000' } ]
```

### `convert(from, to, amount, options?)`

Convert at the live rate, or at a past date's rate with `{ date }` (last 365 days).

```ts
await client.convert('USD', 'EUR', 1000);
// { from: 'USD', to: 'EUR', amount: 1000, result: 889.403, rate: 0.889403 }

await client.convert('USD', 'EUR', 1000, { date: '2026-10-01' });
// { from: 'USD', to: 'EUR', amount: 1000, result: 882.768, rate: 0.882768, date: '2026-10-01', rateDate: '2026-10-01' }
```

For money, round once at the end in the currency's minor unit. `result` is not rounded to cents.

### `forDate(date, options)`

Mid-market rates for a past date in the last 365 days.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `symbols` | `string[]` | **required** | One request per symbol |
| `base` | `string` | `'USD'` | |

```ts
await client.forDate('2026-10-01', { base: 'EUR', symbols: ['USD', 'GBP'] });
// { base: 'EUR', date: '2026-10-01', rates: { USD: 1.1328, GBP: 0.85395 },
//   rateDates: { USD: '2026-10-01', GBP: '2026-10-01' } }
```

Dates up to 29 days ago use daily data. Older dates use the 1-year series, which has **weekly** points, so `rateDates` may be a few days earlier than `date`, and each symbol costs 12 calls. Dates over a year old throw `invalid_argument`; use [`officialRatesOn()`](#officialratesonbank-date-options) for those.

### `timeSeries(start, end, options)`

Rates for every available day between two dates (inclusive), in the last 365 days. Same options, data density and costs as `forDate`.

```ts
const ts = await client.timeSeries('2026-10-05', '2026-10-08', { symbols: ['EUR', 'GBP'] });
// { base: 'USD', startDate: '2026-10-05', endDate: '2026-10-08', rates: {
//     '2026-10-05': { EUR: 0.888573, GBP: 0.755116 },
//     '2026-10-06': { EUR: 0.891504, GBP: 0.756544 }, ... } }

// For a chart
const labels = Object.keys(ts.rates).sort();
const values = labels.map((d) => ts.rates[d].EUR);
```

### `getHistoricalRates(source, target, period?, options?)`

A preset window ending today: `'1d'` (hourly), `'7d'` (default) and `'30d'` (daily), `'1y'` (weekly, 12 calls).

```ts
const h = await client.getHistoricalRates('USD', 'EUR', '7d');
// { source: 'USD', target: 'EUR', period: '7d',
//   current: { rate: 0.889521, time: '2026-10-16' },
//   rates: [ { rate: 0.892738, time: '2026-10-10' }, ... ],   // oldest first
//   data:  [ { date: '2026-10-10', rate: 0.892738, timestamp: 1791590400000 }, ... ] }
```

### `symbols(options?)`

Every supported currency. No key needed.

```ts
const { symbols, currencies, count } = await client.symbols();
// symbols:    { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', ... }
// currencies: [ { code: 'USD', name: 'US Dollar', symbol: '$' }, ... ]
// count:      163
```

### `officialRates(bank, options?)`

The latest table an institution published. No key needed. `bank` is a source code from `officialSources()`, e.g. `ecb`, `fed`, `boe`, `rbi`, `cbuae`, `hmrc`.

| Option | Type | |
| --- | --- | --- |
| `source`, `target` | `string` | Give both to get one pair. It must be published, or the inverse of a published rate. |

```ts
const table = await client.officialRates('ecb');
// { bank: 'ecb', rate_date: '2026-10-15', stale: false, cadence: 'daily',
//   rates: [ { base: 'EUR', quote: 'AUD', type: 'reference', value: 1.6218 }, ... ],
//   attribution: { source: 'Official rates published by ECB, served by AllRatesToday', url: '...', terms: '...' } }

const pair = await client.officialRates('ecb', { source: 'EUR', target: 'USD' });
// { bank: 'ecb', rate_date: '2026-10-15', source: 'EUR', target: 'USD', rate: 1.1208,
//   rate_type: 'reference', derived: false, method: 'published', stale: false, ... }
```

A pair the bank does not cover (e.g. USD/GBP from the ECB) throws a 404; use `officialRatesOn()` for cross pairs. Keyless use requires the visible attribution in `attribution.terms`.

### `officialRatesOn(bank, date, options?)`

The table, or one pair, as published on a date. Needs a key. Covers each bank's archive, and any pair inside the table.

```ts
await client.officialRatesOn('rbi', '2026-09-30', { source: 'USD', target: 'INR' });
// { bank: 'rbi', name: 'Reserve Bank of India', requested_date: '2026-09-30', rate_date: '2026-09-30',
//   published_on_requested_date: true, source: 'USD', target: 'INR', rate: 95.9832,
//   rate_type: 'reference', derived: false, method: 'published', disclaimer: '...' }

await client.officialRatesOn('ecb', '2019-03-15', { source: 'USD', target: 'GBP' });
// { ..., rate_date: '2019-03-15', rate: 0.7553501946, derived: true, method: 'cross' }
```

### `officialSources(options?)`

Every official source with its latest publication date. No key needed.

```ts
const { sources, stale_count } = await client.officialSources();
// sources: [ { code: 'amcm', name: 'Monetary Authority of Macao', latest: '2026-10-16', stale: false, cadence: 'daily' }, ... ]
```

## Errors, retries and troubleshooting

Every failure is an `AllRatesTodayError` with a `code`, and for HTTP errors a `status` and the parsed response body in `details`.

```ts
import AllRatesToday, { AllRatesTodayError } from '@allratestoday/sdk';

try {
  await client.latest({ symbols: ['EUR'] });
} catch (err) {
  if (err instanceof AllRatesTodayError) {
    console.log(err.code, err.status, err.message, err.details);
  }
}
```

| `code` | `status` | Cause | What to do |
| --- | --- | --- | --- |
| `missing_key` | — | Keyed method called without `apiKey` (no request sent) | Pass `apiKey` |
| `invalid_argument` | — | Bad date format, future date, market date over a year old, missing `symbols`, bad bank code, lone `source`/`target` | Fix the call; the message says which |
| `http` | `400` | Unknown currency code or bad parameter | Check codes against `symbols()` |
| `http` | `401` | Missing or invalid key | Check the key in your [dashboard](https://allratestoday.com/profile) |
| `http` | `403` | Your plan does not include this data (e.g. market rates on an official-rates-only plan) | See `details.error`; change plan |
| `http` | `404` | The bank does not publish that pair / no table | Try `officialRatesOn()` or another source |
| `http` | `429` | Request quota used up | `details` has `used`, `limit`, `plan`, `resets_at`, `upgrade_url` |
| `http` | `5xx` | Temporary server or upstream error | Retry with backoff |
| `timeout` | — | No response within `timeout` ms | Retry; raise `timeout` if it keeps happening |
| `network` | — | DNS, TLS or connection failure (`err.cause` has the original error) | Retry; check connectivity |

### Retrying transient failures

Retry only `timeout`, `network` and `5xx`. Retrying `4xx` (including `429` quota errors) just fails again.

```ts
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const retryable =
        err instanceof AllRatesTodayError &&
        (err.code === 'timeout' || err.code === 'network' || (err.status ?? 0) >= 500);
      if (!retryable || i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** (i - 1))); // 0.5s, 1s, ...
    }
  }
}

const data = await withRetry(() => client.latest({ symbols: ['EUR'] }));
```

**Cache instead of polling.** Market rates move about once a minute and official rates once a day, so cache `latest()` for at least 60 seconds and official tables until the next publication.

## Quotas and billing

- The free plan includes **300 requests in total** (they do not reset). Paid plans have monthly quotas; see [pricing](https://allratestoday.com/pricing).
- Keyless methods (`officialRates`, `officialSources`, `symbols`) do not use your quota.
- History is billed by volume: a `1y` window is 12 calls; `7d`, `30d` and `1d` are 1. `forDate` and `timeSeries` make one history request per symbol.
- Your current usage is in the [dashboard](https://allratestoday.com/profile). When you run out, calls fail with `429` and `details` says when the quota resets.

## Compatibility

- **Node.js 18 or later** (uses the built-in `fetch` and `AbortSignal.timeout`). Other runtimes with those globals (Deno, Bun, edge workers, modern browsers) should work but are not part of the test suite. In browsers, use keyless methods only (see above).
- **ESM and CommonJS** builds with an `exports` map:

```js
import AllRatesToday, { AllRatesTodayError } from '@allratestoday/sdk'; // ESM / TypeScript
const { default: AllRatesToday } = require('@allratestoday/sdk');      // CommonJS
```

- **TypeScript** types are bundled (`dist/index.d.ts`); no `@types` package needed.
- **Bundlers**: zero dependencies and `sideEffects: false`, so it tree-shakes.

## TypeScript

All request and response types are exported:

```ts
import type {
  AllRatesTodayOptions, RequestOptions, AllRatesTodayErrorCode,
  LatestOptions, LatestResponse, RateResponse, AuthRateResponse,
  ConvertOptions, ConvertResponse, ForDateOptions, ForDateResponse,
  TimeSeriesOptions, TimeSeriesResponse, HistoryPeriod, HistoryPoint, HistoricalRateResponse,
  SymbolsResponse, CurrencyInfo,
  OfficialRateOptions, OfficialRatesResponse, DatedOfficialRatesResponse, OfficialRateEntry,
  OfficialSource, OfficialSourcesResponse,
} from '@allratestoday/sdk';
```

## Use it from an AI agent

The same rates are available to coding agents and LLM tools without a second integration:

- **Claude Code plugin** (no key): `/plugin marketplace add AllRates-Today/claude-code-plugin` then `/plugin install allratestoday@allratestoday`
- **Hosted MCP endpoint**: `https://allratestoday.com/api/mcp` — Streamable HTTP, keyless, nothing to install
- **Local MCP servers**: `npx -y @allratestoday/mcp-server` (live mid-market rates) · `npx -y @allratestoday/central-bank-mcp` (official central-bank rates)
- **Trial key for agents, no signup**: `POST https://allratestoday.com/api/agent/keys` (send `Content-Type: application/json`) returns a 100-call key valid 7 days; both MCP servers expose it as `request_trial_key`
- **Daily Reference Rate**: one fixed USD table per business day, the 16:00 London median of minute samples, never revised — keyless at `https://allratestoday.com/api/open/reference-rate`
- Machine-readable site guide: [llms.txt](https://allratestoday.com/llms.txt)

## Testing, contributing and support

```bash
npm test               # unit tests: fetch is mocked, no network or API key needed
npm run test:coverage
npm run build
```

- **Changelog**: [CHANGELOG.md](https://github.com/AllRates-Today/exchange-rates-api/blob/main/sdks/javascript/CHANGELOG.md)
- **Bugs and feature requests**: [GitHub issues](https://github.com/AllRates-Today/exchange-rates-api/issues)
- **Contributing**: pull requests welcome. Add or update tests in `src/index.test.ts` and run `npm test` before opening one.
- **Support**: [info@allratestoday.com](mailto:info@allratestoday.com) · [API docs](https://allratestoday.com/docs/) · [status](https://allratestoday.com/status)

## License

MIT
