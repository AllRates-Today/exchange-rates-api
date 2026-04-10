# Exchange Rate API — @allratestoday/sdk

[![npm version](https://img.shields.io/npm/v/@allratestoday/sdk.svg)](https://www.npmjs.com/package/@allratestoday/sdk)
[![codecov](https://codecov.io/gh/allratestoday/exchange-rates-api/branch/main/graph/badge.svg)](https://codecov.io/gh/allratestoday/exchange-rates-api)
[![license](https://img.shields.io/npm/l/@allratestoday/sdk.svg)](https://github.com/allratestoday/exchange-rates-api/blob/main/LICENSE)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://www.typescriptlang.org/)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@allratestoday/sdk)

**Real-time mid-market currency exchange rates for Node.js and browsers. The most elegant way to access 160+ currencies from Reuters/Refinitiv.**

## 🚀 Why Choose This Client?

- ⚡ **Lightning Fast** — Zero runtime dependencies, pure TypeScript performance
- 📡 **Real-Time Data** — Rates updated every 60 seconds from Reuters (Refinitiv) and interbank feeds
- 💹 **Mid-Market Rates** — The true interbank rate — no hidden spread or markup
- 🌍 **160+ Currencies** — Major, minor, and exotic currency pairs
- 🔷 **Type-Safe** — Full TypeScript support with intelligent autocomplete
- 🌐 **Universal** — Works seamlessly in Node.js 18+ and modern browsers
- 🧑‍💻 **Developer-Friendly** — Simple API, extensive documentation, and great DX

## 🔑 Get Your API Key

Ready to start? Get your free API key from [allratestoday.com/register](https://allratestoday.com/register).

## 📦 Installation

```bash
npm install @allratestoday/sdk
```

```bash
yarn add @allratestoday/sdk
```

```bash
pnpm add @allratestoday/sdk
```

## 🏁 Quick Start

Get up and running in seconds:

```typescript
import AllRatesToday from '@allratestoday/sdk';

// Set your API key
const client = new AllRatesToday({ apiKey: 'YOUR_API_KEY' });

// Get latest exchange rates
const { rates } = await client.latest({ base: 'USD', symbols: ['EUR', 'GBP', 'JPY'] });
console.log(rates);
```

## 📚 API Reference

- [Latest Rates](#-latest-exchange-rates) — Get current exchange rates
- [Historical Data](#-historical-exchange-rates) — Fetch rates for specific dates
- [Currency Conversion](#-currency-conversion) — Convert between currencies
- [Time Series](#-time-series-data) — Get rates over date ranges
- [Available Currencies](#-available-currencies) — List all supported currencies
- [Single Rate](#-single-rate) — Get one currency pair
- [Historical by Period](#-historical-rates-by-period) — Preset period lookups

---

### Latest Exchange Rates

Get the most current exchange rates with a single call:

```typescript
// Get all rates from USD
const data = await client.latest();
console.log(data);

// Target specific currencies
const data = await client.latest({ base: 'USD', symbols: ['CHF', 'GBP', 'JPY'] });
console.log(data);
```

**Response:**

```javascript
{
  base: 'USD',
  date: '2026-04-09T14:30:00Z',
  rates: {
    CHF: 0.8821,
    GBP: 0.7891,
    JPY: 151.42
  }
}
```

### Historical Exchange Rates

Travel back in time to get rates from any date:

```typescript
// Using a string date
const data = await client.forDate('2026-01-15', { base: 'USD', symbols: ['EUR'] });
console.log(data);

// Using a Date object
const data = await client.forDate(new Date('2026-01-15'), { base: 'EUR', symbols: ['USD', 'GBP'] });
console.log(data);
```

**Response:**

```javascript
{
  base: 'USD',
  date: '2026-01-15',
  rates: {
    EUR: 0.9187
  }
}
```

### Currency Conversion

Convert any amount between currencies — including historical conversions:

```typescript
// Current conversion
const result = await client.convert('USD', 'EUR', 1000);
console.log(result);
```

**Response:**

```javascript
{
  from: 'USD',
  to: 'EUR',
  amount: 1000,
  result: 923.4,
  rate: 0.9234
}
```

```typescript
// Historical conversion — what was $1,000 worth on Jan 15?
const result = await client.convert('USD', 'EUR', 1000, { date: '2026-01-15' });
console.log(result);
```

**Response:**

```javascript
{
  from: 'USD',
  to: 'EUR',
  amount: 1000,
  result: 918.7,
  rate: 0.9187,
  date: '2026-01-15'
}
```

### Available Currencies

Discover all 160+ supported currency symbols and names:

```typescript
const data = await client.symbols();
console.log(data);
```

**Response:**

```javascript
{
  symbols: {
    AED: 'United Arab Emirates Dirham',
    AFN: 'Afghan Afghani',
    ALL: 'Albanian Lek',
    AMD: 'Armenian Dram',
    AUD: 'Australian Dollar',
    BDT: 'Bangladeshi Taka',
    BRL: 'Brazilian Real',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    EUR: 'Euro',
    GBP: 'British Pound Sterling',
    INR: 'Indian Rupee',
    JPY: 'Japanese Yen',
    KRW: 'South Korean Won',
    USD: 'United States Dollar',
    // ...160+ currencies
  }
}
```

### Time Series Data

Get exchange rates over a date range for trend analysis and charting:

```typescript
const data = await client.timeSeries('2026-01-01', '2026-03-31', {
  base: 'USD',
  symbols: ['EUR', 'GBP'],
});
console.log(data);
```

**Response:**

```javascript
{
  base: 'USD',
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  rates: {
    '2026-01-01': {
      EUR: 0.9187,
      GBP: 0.7834
    },
    '2026-01-02': {
      EUR: 0.9195,
      GBP: 0.7841
    },
    '2026-01-03': {
      EUR: 0.9201,
      GBP: 0.7856
    },
    // ...
  }
}
```

### Single Rate

Get a single exchange rate between two currencies:

```typescript
const rate = await client.getRate('USD', 'EUR');
console.log(rate);
```

**Response:**

```javascript
{
  from: { currency: 'USD', amount: 1 },
  to: { currency: 'EUR', amount: 0.9234 },
  rate: 0.9234,
  source: 'wise'
}
```

```typescript
// With amount
const rate = await client.getRate('USD', 'EUR', 500);
console.log(`$500 = €${rate.to.amount}`);
```

### Historical Rates by Period

Get historical rates using preset periods — no date math needed:

```typescript
const history = await client.getHistoricalRates('USD', 'EUR', '30d');
console.log(history);
```

**Response:**

```javascript
{
  source: 'USD',
  target: 'EUR',
  period: '30d',
  current: { rate: 0.9234, time: '2026-04-09T14:30:00Z' },
  rates: [
    { rate: 0.9198, time: '2026-03-10T00:00:00Z' },
    { rate: 0.9210, time: '2026-03-11T00:00:00Z' },
    // ...
  ]
}
```

**Available periods:** `1d` | `7d` | `30d` | `1y`

---

## 🔧 Configuration

```typescript
const client = new AllRatesToday({
  apiKey: 'YOUR_API_KEY',          // Required — get one free at allratestoday.com/register
  baseUrl: 'https://allratestoday.com', // Optional — API base URL
  timeout: 10000,                       // Optional — request timeout in ms
});
```

| Option    | Type     | Default                     | Description                      |
| --------- | -------- | --------------------------- | -------------------------------- |
| `apiKey`  | `string` | —                           | Your API key                     |
| `baseUrl` | `string` | `https://allratestoday.com` | API base URL                     |
| `timeout` | `number` | `10000`                     | Request timeout in milliseconds  |

---

## 🔀 Per-Request API Key Override

Every method supports a per-request API key override — useful for multi-tenant apps:

```typescript
const client = new AllRatesToday({ apiKey: 'default_key' });

// Override for a specific request
const data = await client.latest({ apiKey: 'other_users_key' });
const result = await client.convert('USD', 'EUR', 100, { apiKey: 'tenant_key' });
const { symbols } = await client.symbols({ apiKey: 'another_key' });
```

---

## 🛡️ Error Handling

All errors are thrown as `AllRatesTodayError` with an optional HTTP status code:

```typescript
import AllRatesToday, { AllRatesTodayError } from '@allratestoday/sdk';

try {
  const rate = await client.getRate('USD', 'INVALID');
} catch (err) {
  if (err instanceof AllRatesTodayError) {
    console.log(err.message); // "Currency not found"
    console.log(err.status);  // 404
  }
}
```

| Status | Meaning                              |
| ------ | ------------------------------------ |
| —      | Missing API key (thrown before request) |
| `401`  | Invalid API key                      |
| `404`  | Currency code not found              |
| `429`  | Rate limit exceeded                  |
| `500`  | Server error                         |

---

## 🔷 TypeScript

The SDK is written in TypeScript and ships full type definitions. All interfaces are exported:

```typescript
import AllRatesToday, {
  AllRatesTodayError,
  AllRatesTodayOptions,
  RequestOptions,
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
} from '@allratestoday/sdk';
```

---

## 📦 CommonJS

```javascript
const AllRatesToday = require('@allratestoday/sdk').default;

const client = new AllRatesToday({ apiKey: 'YOUR_API_KEY' });
client.latest().then(data => console.log(data.rates));
```

---

## 💡 Examples

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

// Format for charting libraries (Chart.js, Recharts, etc.)
const labels = Object.keys(data.rates).sort();
const values = labels.map(date => data.rates[date].EUR);

console.log({ labels, values });
// { labels: ['2026-01-01', '2026-01-02', ...], values: [0.92, 0.921, ...] }
```

---

## 📖 Methods Reference

| Method | Description |
| ------ | ----------- |
| `latest(options?)` | Get latest rates for one or more currencies |
| `forDate(date, options?)` | Get rates for a specific historical date |
| `convert(from, to, amount, options?)` | Convert amount between currencies (supports historical date) |
| `timeSeries(start, end, options?)` | Get rates across a custom date range |
| `symbols(options?)` | List all 160+ supported currency codes and names |
| `getRate(from, to, amount?, options?)` | Get a single exchange rate |
| `getRates(source, target, options?)` | Get rates with full metadata |
| `getHistoricalRates(source, target, period?, options?)` | Historical rates by preset period (1d/7d/30d/1y) |

---

## 🧪 Testing

Run isolated unit tests (no API calls needed):

```bash
npm test
```

Run tests with coverage report:

```bash
npm run test:coverage
```

Watch mode for development:

```bash
npm run test:watch
```

---

## 🔗 Links

- [API Documentation](https://allratestoday.com/developers)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [Status](https://allratestoday.com/status)
- [GitHub](https://github.com/allratestoday/exchange-rates-api)

## 📜 License

MIT
