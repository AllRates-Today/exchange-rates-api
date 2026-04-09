# @allratestoday/sdk

[![npm version](https://img.shields.io/npm/v/@allratestoday/sdk.svg)](https://www.npmjs.com/package/@allratestoday/sdk)
[![license](https://img.shields.io/npm/l/@allratestoday/sdk.svg)](https://github.com/allratestoday/exchange-rates-api/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@allratestoday/sdk)

The most elegant way to access **real-time mid-market exchange rates** in Node.js and browsers.

- **Zero runtime dependencies** — pure TypeScript, nothing to audit
- **160+ currencies** — major, minor, and exotic pairs
- **Real-time data** — updated every 60 seconds from Reuters (Refinitiv)
- **Mid-market rates** — the true interbank rate, no hidden spread
- **Full TypeScript support** — complete type definitions with autocomplete
- **Works everywhere** — Node.js 18+ and modern browsers

## Installation

```bash
npm install @allratestoday/sdk
```

```bash
yarn add @allratestoday/sdk
```

```bash
pnpm add @allratestoday/sdk
```

## Quick Start

Get your free API key at [allratestoday.com/register](https://allratestoday.com/register) — no credit card required.

```typescript
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'art_live_your_key_here' });

// Get the latest exchange rates
const { rates } = await client.latest({ base: 'USD', symbols: ['EUR', 'GBP', 'JPY'] });
console.log(rates); // { EUR: 0.9234, GBP: 0.7891, JPY: 151.42 }

// Convert an amount
const result = await client.convert('USD', 'EUR', 1000);
console.log(`$1,000 = €${result.result}`);

// Get rates for a specific date
const historical = await client.forDate('2026-01-15', { base: 'USD', symbols: ['EUR'] });
console.log(historical.rates); // { EUR: 0.9187 }

// List all supported currencies
const { symbols } = await client.symbols();
console.log(symbols); // { USD: 'United States Dollar', EUR: 'Euro', ... }
```

## API Reference

### `new AllRatesToday(options?)`

Create a new client instance.

```typescript
const client = new AllRatesToday({
  apiKey: 'art_live_your_key_here',
  baseUrl: 'https://allratestoday.com', // optional
  timeout: 10000,                        // optional, in ms
});
```

| Option    | Type     | Default                       | Description                                                      |
| --------- | -------- | ----------------------------- | ---------------------------------------------------------------- |
| `apiKey`  | `string` | —                             | Your API key ([register free](https://allratestoday.com/register)) |
| `baseUrl` | `string` | `https://allratestoday.com`   | API base URL                                                     |
| `timeout` | `number` | `10000`                       | Request timeout in milliseconds                                  |

---

### `client.latest(options?)`

Get the latest exchange rates for one or more currencies.

```typescript
// All rates from USD (default base)
const data = await client.latest();
console.log(data.rates.EUR); // 0.9234

// Specific symbols with EUR base
const data = await client.latest({
  base: 'EUR',
  symbols: ['USD', 'GBP', 'JPY'],
});
console.log(data.rates);
// { USD: 1.0830, GBP: 0.8546, JPY: 163.92 }
```

**Parameters**

| Option    | Type       | Default | Description                                |
| --------- | ---------- | ------- | ------------------------------------------ |
| `base`    | `string`   | `USD`   | Base currency code                         |
| `symbols` | `string[]` | all     | Target currency codes to return            |
| `apiKey`  | `string`   | —       | Override the API key for this request only  |

**Response**

```typescript
{
  base: string;               // "USD"
  date: string;               // "2026-04-09T14:30:00Z"
  rates: Record<string, number>; // { EUR: 0.9234, GBP: 0.7891 }
}
```

---

### `client.forDate(date, options?)`

Get exchange rates for a specific historical date. Accepts a `string` (`YYYY-MM-DD`) or a JavaScript `Date` object.

```typescript
// Using a date string
const data = await client.forDate('2026-01-15');

// Using a Date object
const data = await client.forDate(new Date('2026-01-15'));

// With base and symbols
const data = await client.forDate('2025-12-31', {
  base: 'GBP',
  symbols: ['USD', 'EUR'],
});

console.log(data.rates); // { USD: 1.2534, EUR: 1.1723 }
```

**Parameters**

| Parameter | Type              | Description                               |
| --------- | ----------------- | ----------------------------------------- |
| `date`    | `string \| Date`  | Target date (`YYYY-MM-DD` or Date object) |

**Options**

| Option    | Type       | Default | Description                                |
| --------- | ---------- | ------- | ------------------------------------------ |
| `base`    | `string`   | `USD`   | Base currency code                         |
| `symbols` | `string[]` | all     | Target currency codes                      |
| `apiKey`  | `string`   | —       | Override the API key for this request only  |

**Response**

```typescript
{
  base: string;               // "USD"
  date: string;               // "2026-01-15"
  rates: Record<string, number>; // { EUR: 0.9187 }
}
```

---

### `client.timeSeries(startDate, endDate, options?)`

Get exchange rate time series between two dates. Useful for charts, reporting, and trend analysis.

```typescript
const data = await client.timeSeries('2026-01-01', '2026-03-31', {
  base: 'USD',
  symbols: ['EUR', 'GBP'],
});

// Rates are grouped by date
console.log(data.rates['2026-01-15']); // { EUR: 0.9187, GBP: 0.7834 }
console.log(data.rates['2026-02-20']); // { EUR: 0.9301, GBP: 0.7912 }
```

**Parameters**

| Parameter   | Type             | Description                               |
| ----------- | ---------------- | ----------------------------------------- |
| `startDate` | `string \| Date` | Start of the range (`YYYY-MM-DD` or Date) |
| `endDate`   | `string \| Date` | End of the range (`YYYY-MM-DD` or Date)   |

**Options**

| Option    | Type       | Default | Description                                |
| --------- | ---------- | ------- | ------------------------------------------ |
| `base`    | `string`   | `USD`   | Base currency code                         |
| `symbols` | `string[]` | all     | Target currency codes                      |
| `apiKey`  | `string`   | —       | Override the API key for this request only  |

**Response**

```typescript
{
  base: string;                                   // "USD"
  startDate: string;                              // "2026-01-01"
  endDate: string;                                // "2026-03-31"
  rates: Record<string, Record<string, number>>; // { "2026-01-01": { EUR: 0.92 } }
}
```

---

### `client.convert(from, to, amount, options?)`

Convert an amount from one currency to another. Supports both current and historical conversions.

```typescript
// Current conversion
const result = await client.convert('USD', 'EUR', 1000);
console.log(result);
// { from: 'USD', to: 'EUR', amount: 1000, result: 923.4, rate: 0.9234 }

// Historical conversion — what was $1,000 worth in EUR on Jan 15?
const result = await client.convert('USD', 'EUR', 1000, {
  date: '2026-01-15',
});
console.log(result);
// { from: 'USD', to: 'EUR', amount: 1000, result: 918.7, rate: 0.9187, date: '2026-01-15' }

// Using a Date object
const result = await client.convert('GBP', 'JPY', 500, {
  date: new Date('2025-12-31'),
});
```

**Parameters**

| Parameter | Type     | Description               |
| --------- | -------- | ------------------------- |
| `from`    | `string` | Source currency code       |
| `to`      | `string` | Target currency code       |
| `amount`  | `number` | Amount to convert          |

**Options**

| Option   | Type             | Default | Description                                          |
| -------- | ---------------- | ------- | ---------------------------------------------------- |
| `date`   | `string \| Date` | now     | Historical date for conversion (`YYYY-MM-DD` or Date) |
| `apiKey` | `string`         | —       | Override the API key for this request only             |

**Response**

```typescript
{
  from: string;    // "USD"
  to: string;      // "EUR"
  amount: number;  // 1000
  result: number;  // 923.4
  rate: number;    // 0.9234
  date?: string;   // "2026-01-15" (only for historical)
}
```

---

### `client.symbols(options?)`

Get all supported currency codes and their full names. Useful for building currency dropdowns and selectors.

```typescript
const { symbols } = await client.symbols();
console.log(symbols);
// {
//   USD: 'United States Dollar',
//   EUR: 'Euro',
//   GBP: 'British Pound Sterling',
//   JPY: 'Japanese Yen',
//   ...160+ currencies
// }

// Build a dropdown
const options = Object.entries(symbols).map(([code, name]) => ({
  value: code,
  label: `${code} — ${name}`,
}));
```

**Options**

| Option   | Type     | Default | Description                               |
| -------- | -------- | ------- | ----------------------------------------- |
| `apiKey` | `string` | —       | Override the API key for this request only |

**Response**

```typescript
{
  symbols: Record<string, string>; // { USD: 'United States Dollar', ... }
}
```

---

### `client.getRate(from, to, amount?, options?)`

Get a single exchange rate between two currencies.

```typescript
const rate = await client.getRate('USD', 'EUR');
console.log(`1 USD = ${rate.rate} EUR`);

// With amount
const rate = await client.getRate('USD', 'EUR', 500);
console.log(`$500 = €${rate.to.amount}`);
```

**Response**

```typescript
{
  from: { currency: string; amount: number };
  to: { currency: string; amount: number };
  rate: number;
  source: string;
}
```

---

### `client.getRates(source, target, options?)`

Get exchange rates with full metadata (timestamp, source).

```typescript
const rates = await client.getRates('USD', 'EUR');
rates.forEach(r => {
  console.log(`${r.source}/${r.target}: ${r.rate} at ${r.time}`);
});
```

**Response**

```typescript
Array<{
  rate: number;
  source: string;
  target: string;
  time: string;
}>
```

---

### `client.getHistoricalRates(source, target, period?, options?)`

Get historical rates using a preset period.

```typescript
const history = await client.getHistoricalRates('USD', 'EUR', '30d');

console.log(`Current: ${history.current.rate}`);
history.rates.forEach(point => {
  console.log(`${point.time}: ${point.rate}`);
});
```

**Period options:** `1d` | `7d` | `30d` | `1y` (default: `7d`)

**Response**

```typescript
{
  source: string;
  target: string;
  period: string;
  current: { rate: number; time: string };
  rates: Array<{ rate: number; time: string }>;
}
```

---

## Per-Request API Key Override

Every method accepts an optional `apiKey` parameter to override the client-level key. This is useful for multi-tenant applications where different users have different API keys.

```typescript
const client = new AllRatesToday({ apiKey: 'default_key' });

// Use a different key for this specific request
const data = await client.latest({ apiKey: 'other_users_key' });

// Works on all methods
const result = await client.convert('USD', 'EUR', 100, { apiKey: 'other_key' });
const { symbols } = await client.symbols({ apiKey: 'other_key' });
```

---

## Error Handling

All errors are thrown as `AllRatesTodayError` with an optional HTTP status code.

```typescript
import AllRatesToday, { AllRatesTodayError } from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'art_live_your_key_here' });

try {
  const rate = await client.getRate('USD', 'INVALID');
} catch (err) {
  if (err instanceof AllRatesTodayError) {
    console.log(err.message); // "Currency not found"
    console.log(err.status);  // 404
  }
}
```

Common error scenarios:

| Status | Cause                                       |
| ------ | ------------------------------------------- |
| —      | Missing API key (thrown before request)       |
| `401`  | Invalid API key                              |
| `404`  | Currency code not found                      |
| `429`  | Rate limit exceeded ([upgrade plan](https://allratestoday.com/pricing)) |
| `500`  | Server error (retry or check [status](https://allratestoday.com/status)) |

---

## TypeScript

The SDK is written in TypeScript and ships full type definitions. All interfaces are exported:

```typescript
import AllRatesToday, {
  AllRatesTodayError,
  AllRatesTodayOptions,
  RateResponse,
  AuthRateResponse,
  LatestOptions,
  LatestResponse,
  ForDateOptions,
  ForDateResponse,
  ConvertOptions,
  ConvertResponse,
  TimeSeriesOptions,
  TimeSeriesResponse,
  HistoricalRateResponse,
  SymbolsResponse,
  RequestOptions,
} from '@allratestoday/sdk';
```

---

## CommonJS

```javascript
const AllRatesToday = require('@allratestoday/sdk').default;

const client = new AllRatesToday({ apiKey: 'art_live_your_key_here' });
client.latest().then(data => console.log(data.rates));
```

---

## Examples

### Currency Dropdown (React)

```tsx
import { useEffect, useState } from 'react';
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'YOUR_API_KEY' });

function CurrencySelect({ value, onChange }) {
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    client.symbols().then(({ symbols }) => {
      setCurrencies(
        Object.entries(symbols).map(([code, name]) => ({ code, name }))
      );
    });
  }, []);

  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {currencies.map(c => (
        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
      ))}
    </select>
  );
}
```

### Price Display with Caching

```typescript
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'YOUR_API_KEY' });
let cache: { rates: Record<string, number>; time: number } | null = null;
const TTL = 5 * 60 * 1000; // 5 minutes

async function getPrice(amountUSD: number, currency: string): Promise<string> {
  if (!cache || Date.now() - cache.time > TTL) {
    const data = await client.latest({ base: 'USD' });
    cache = { rates: data.rates, time: Date.now() };
  }
  const converted = (amountUSD * cache.rates[currency]).toFixed(2);
  return `${converted} ${currency}`;
}

console.log(await getPrice(99.99, 'EUR')); // "92.32 EUR"
console.log(await getPrice(99.99, 'GBP')); // "78.90 GBP"
```

### Historical Chart Data

```typescript
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'YOUR_API_KEY' });

const data = await client.timeSeries('2026-01-01', '2026-04-01', {
  base: 'USD',
  symbols: ['EUR'],
});

// Format for charting library (e.g., Chart.js)
const labels = Object.keys(data.rates).sort();
const values = labels.map(date => data.rates[date].EUR);

console.log({ labels, values });
// { labels: ['2026-01-01', '2026-01-02', ...], values: [0.92, 0.921, ...] }
```

---

## Pricing

| Plan   | Requests/Month | Price      |
| ------ | -------------- | ---------- |
| Free   | 300            | Free       |
| Small  | 5,000          | €4.99/mo   |
| Medium | 10,000         | €9.99/mo   |
| Large  | 100,000        | €49.99/mo  |

All plans get the same features: real-time rates (60s updates), 160+ currencies, any base currency, full API access. Plans differ only in request volume.

---

## Links

- [API Documentation](https://allratestoday.com/developers)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [Pricing](https://allratestoday.com/pricing)
- [Status](https://allratestoday.com/status)
- [GitHub](https://github.com/allratestoday/exchange-rates-api)

## License

MIT
