# AllRatesToday - Exchange Rates API

A free, fast, and reliable REST API for real-time and historical currency exchange rates. Sourced from Reuters (Refinitiv) and interbank market feeds.

[![API Status](https://img.shields.io/badge/API-Online-brightgreen)](https://allratestoday.com/status)
[![Tests](https://github.com/allratestoday/exchange-rates-api/actions/workflows/test.yml/badge.svg)](https://github.com/allratestoday/exchange-rates-api/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/allratestoday/exchange-rates-api/branch/main/graph/badge.svg)](https://codecov.io/gh/allratestoday/exchange-rates-api)
[![Known Vulnerabilities](https://snyk.io/test/github/allratestoday/exchange-rates-api/badge.svg)](https://snyk.io/test/github/allratestoday/exchange-rates-api)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@allratestoday/sdk)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@allratestoday/sdk?label=npm&color=cb3837)](https://www.npmjs.com/package/@allratestoday/sdk)
[![PyPI](https://img.shields.io/pypi/v/allratestoday?label=PyPI&color=3775a9)](https://pypi.org/project/allratestoday/)
[![Packagist](https://img.shields.io/packagist/v/allratestoday/sdk?label=Packagist&color=f28d1a)](https://packagist.org/packages/allratestoday/sdk)

## Features

- **Real-time rates** — Live mid-market exchange rates updated on every request
- **160+ currencies** — Major, emerging market, and popular currencies
- **Historical data** — Access historical rates with flexible date ranges (1d/7d/30d/1y)
- **Official SDKs** — JavaScript/TypeScript, Python, and PHP
- **Free tier** — 300 requests/month, no credit card required
- **Fast & reliable** — Powered by Cloudflare's global edge network
- **Data source** — Reuters (Refinitiv) and interbank market feeds

## Official SDKs

### JavaScript / TypeScript

```bash
npm install @allratestoday/sdk
```

```typescript
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday();
const rate = await client.getRate('USD', 'EUR');
console.log(`1 USD = ${rate.rate} EUR`);

// Convert amount
const result = await client.convert('USD', 'EUR', 100);
console.log(`$100 = €${result.result}`);

// With API key for higher limits & historical data
const auth = new AllRatesToday({ apiKey: 'art_live_...' });
const history = await auth.getHistoricalRates('USD', 'EUR', '30d');
```

### Python

```bash
pip install allratestoday
```

```python
from allratestoday import AllRatesToday

client = AllRatesToday()
rate = client.get_rate("USD", "EUR")
print(f"1 USD = {rate['rate']} EUR")

# Convert amount
result = client.convert("USD", "EUR", 100)
print(f"$100 = €{result['result']}")

# With API key for higher limits & historical data
auth = AllRatesToday(api_key="art_live_...")
history = auth.get_historical_rates("USD", "EUR", "30d")
```

### PHP

```bash
composer require allratestoday/sdk
```

```php
use AllRatesToday\AllRatesToday;

$client = new AllRatesToday();
$rate = $client->getRate('USD', 'EUR');
echo "1 USD = {$rate['rate']} EUR";

// Convert amount
$result = $client->convert('USD', 'EUR', 100);
echo "$100 = €{$result['result']}";

// With API key for higher limits & historical data
$auth = new AllRatesToday('art_live_...');
$history = $auth->getHistoricalRates('USD', 'EUR', '30d');
```

## Quick Start (No SDK)

### Free Public Endpoint (No API Key)

```bash
curl "https://allratestoday.com/api/public/rates?from=USD&to=EUR"
```

```json
{
  "from": { "currency": "USD", "amount": 1 },
  "to": { "currency": "EUR", "amount": 0.9215 },
  "rate": 0.9215,
  "source": "AllRatesToday.com"
}
```

### Authenticated Endpoint

```bash
curl "https://allratestoday.com/api/v1/rates?source=USD&target=EUR" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Get your free API key at [allratestoday.com/profile](https://allratestoday.com/profile).

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/rates` | No | Free public rates (100/hour per IP) |
| GET | `/api/v1/rates` | Yes | Authenticated rates with higher limits |
| GET | `/api/rate` | No | Simple pair rate lookup |
| GET | `/api/historical-rates` | Yes | Historical rate data |

## Pricing

| Plan | Requests/Month | Rate Limit | Price |
|------|---------------|------------|-------|
| Free | 300 | 10/min | Free |
| Small | 5,000 | 10/min | €4.99/mo |
| Medium | 10,000 | Unlimited | €9.99/mo |
| Large | 100,000 | Unlimited | €49.99/mo |

See [allratestoday.com/pricing](https://allratestoday.com/pricing) for details.

## Supported Currencies

160+ currencies including:

**Major:** USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD

**Popular:** INR, CNY, BRL, MXN, TRY, ZAR, SGD, HKD, KRW, THB, PHP, PKR, BDT, LKR, NGN, GHS, KES, AED, SAR, EGP, and more

## Error Handling

| Code | Description |
|------|-------------|
| 400 | Bad request — missing or invalid parameters |
| 401 | Missing or invalid API key |
| 429 | Rate limit or monthly quota exceeded |
| 500 | Internal server error |
| 503 | Service temporarily unavailable |

## Links

- **Website:** [allratestoday.com](https://allratestoday.com)
- **API Docs:** [allratestoday.com/docs](https://allratestoday.com/docs)
- **Developer Guide:** [allratestoday.com/developers](https://allratestoday.com/developers)
- **Status:** [allratestoday.com/status](https://allratestoday.com/status)
- **Pricing:** [allratestoday.com/pricing](https://allratestoday.com/pricing)
- **Support:** [allratestoday.com/contact](https://allratestoday.com/contact)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
