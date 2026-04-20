# 📈 allratestoday

[![npm version](https://img.shields.io/npm/v/allratestoday)](https://www.npmjs.com/package/allratestoday)
[![npm downloads](https://img.shields.io/npm/dm/allratestoday)](https://www.npmjs.com/package/allratestoday)
[![license](https://img.shields.io/npm/l/allratestoday)](./LICENSE)

Lightweight Node.js library and CLI for **real-time mid-market currency exchange rates** — 160+ currencies sourced from **Refinitiv (Reuters)** and interbank feeds via the [AllRatesToday API](https://allratestoday.com).

- ⚡ **Real-time** rates, not daily snapshots
- 🌍 **160+ currencies** including majors, emerging-market, precious metals (XAU, XAG)
- 📦 **Zero dependencies** (uses native `fetch`)
- 🖥️ Works as a **Node library AND CLI**
- 🔒 Mid-market rates (no retail markup)

---

## 📦 Installation

```bash
npm install allratestoday
```

Or with yarn / pnpm:

```bash
yarn add allratestoday
pnpm add allratestoday
```

---

## 🔑 Get a free API key

This package calls the authenticated AllRatesToday API. Grab a free key at
**[allratestoday.com/register](https://allratestoday.com/register/)** — no credit card required.

Export it once:

```bash
export ALLRATESTODAY_API_KEY="art_live_..."
```

Or pass it explicitly to each call (see below).

---

## 🚀 Usage

### Node.js — get a rate

```js
import { rate } from "allratestoday";

const r = await rate("USD", "INR");
console.log(r);
// {
//   date: "2026-04-20",
//   base: "USD",
//   target: "INR",
//   rate: 83.2145
// }
```

### Node.js — convert an amount

```js
import { convert } from "allratestoday";

const out = await convert(100, "USD", "EUR");
console.log(out);
// {
//   from: { currency: "USD", amount: 100 },
//   to:   { currency: "EUR", amount: 92.34 },
//   rate: 0.9234,
//   date: "2026-04-20"
// }
```

### Pass the API key explicitly

```js
const r = await rate("GBP", "USD", { apiKey: "art_live_..." });
```

### TypeScript

```ts
import { rate, RateResult, RateOptions } from "allratestoday";

const opts: RateOptions = { timeoutMs: 5000 };
const r: RateResult = await rate("EUR", "JPY", opts);
```

### Custom fetch (Node < 18 or test doubles)

```js
import { rate } from "allratestoday";
import fetch from "node-fetch";

const r = await rate("USD", "INR", { fetch });
```

---

## 💻 CLI

Install globally:

```bash
npm install -g allratestoday
```

Then:

```bash
$ allratestoday USD INR
{
  "date": "2026-04-20",
  "base": "USD",
  "target": "INR",
  "rate": 83.2145
}
```

Convert an amount (third positional argument):

```bash
$ allratestoday USD EUR 250
{
  "from": { "currency": "USD", "amount": 250 },
  "to":   { "currency": "EUR", "amount": 230.85 },
  "rate": 0.9234,
  "date": "2026-04-20"
}
```

Pipe into `jq`:

```bash
$ allratestoday GBP USD | jq '.rate'
1.3512
```

---

## 📚 API reference

### `rate(base, target, options?)`

Fetch the latest mid-market rate for a single pair.

| Param    | Type    | Description                                  |
|----------|---------|----------------------------------------------|
| `base`   | string  | ISO 4217 code of the source currency (`"USD"`, `"EUR"`, `"XAU"`, …) |
| `target` | string  | ISO 4217 code of the target currency         |
| `options`| object  | Optional (see below)                         |

Returns `Promise<RateResult>`:

```ts
interface RateResult {
  date: string;    // ISO date, e.g. "2026-04-20"
  base: string;    // "USD"
  target: string;  // "INR"
  rate: number;    // 83.2145
}
```

### `convert(amount, from, to, options?)`

Multiply an amount by the current rate.

### `RateOptions`

```ts
interface RateOptions {
  apiKey?: string;       // defaults to process.env.ALLRATESTODAY_API_KEY
  baseUrl?: string;      // override for staging / self-hosted proxies
  fetch?: typeof fetch;  // custom fetch implementation
  timeoutMs?: number;    // default 15000
}
```

### Errors

All errors are thrown as `AllRatesTodayError` with a `.status` field (HTTP status where applicable):

```js
import { rate, AllRatesTodayError } from "allratestoday";

try {
  await rate("USD", "XXX");
} catch (err) {
  if (err instanceof AllRatesTodayError) {
    console.error(err.status, err.message);
  }
}
```

---

## 🌍 Supported currencies

160+ currencies including majors (USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD), emerging-market currencies (INR, CNY, BRL, MXN, TRY, ZAR, SGD, HKD, KRW, THB, PHP, PKR, BDT, LKR, NGN, GHS, KES, AED, SAR, EGP), and precious metals (XAU, XAG).

Full list: [`allratestoday.com/api/v1/symbols`](https://allratestoday.com/api/v1/symbols).

---

## 🔗 Related packages

| Package | Install | Purpose |
|---|---|---|
| `@allratestoday/sdk` | `npm install @allratestoday/sdk` | Full-featured SDK (historical, batch, webhooks) |
| `react-currency-localizer-realtime` | `npm install react-currency-localizer-realtime` | React hooks & components |
| `allratestoday` *(this package)* | `npm install allratestoday` | Lightweight one-function + CLI |

---

## 📄 License

MIT © [AllRatesToday](https://allratestoday.com)
