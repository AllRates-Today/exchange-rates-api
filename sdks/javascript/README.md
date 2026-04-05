# @allratestoday/sdk

Official JavaScript/TypeScript SDK for the [AllRatesToday](https://allratestoday.com) exchange rate API.

Real-time mid-market exchange rates for 160+ currencies, sourced from Reuters (Refinitiv) and interbank market feeds.

## Installation

```bash
npm install @allratestoday/sdk
```

## Quick Start

Get your free API key at [allratestoday.com/register](https://allratestoday.com/register) (300 requests/month free).

```typescript
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'art_live_your_key_here' });

// Get exchange rate
const rate = await client.getRate('USD', 'EUR');
console.log(`1 USD = ${rate.rate} EUR`);

// Convert amount
const result = await client.convert('USD', 'EUR', 100);
console.log(`$100 = €${result.result}`);

// Get historical rates
const history = await client.getHistoricalRates('USD', 'EUR', '30d');
console.log(history.rates);
```

## API Reference

### `new AllRatesToday(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **required** | Your API key ([register free](https://allratestoday.com/register)) |
| `baseUrl` | `string` | `https://allratestoday.com` | API base URL |
| `timeout` | `number` | `10000` | Request timeout in ms |

### Methods

| Method | Description |
|--------|-------------|
| `getRate(from, to, amount?)` | Get exchange rate between two currencies |
| `convert(from, to, amount)` | Convert amount between currencies |
| `getRates(source, target)` | Get rate data with metadata |
| `getHistoricalRates(source, target, period)` | Historical rates (1d/7d/30d/1y) |

All methods require an API key.

### Error Handling

```typescript
import AllRatesToday, { AllRatesTodayError } from '@allratestoday/sdk';

try {
  const rate = await client.getRate('USD', 'INVALID');
} catch (err) {
  if (err instanceof AllRatesTodayError) {
    console.log(err.message); // Error description
    console.log(err.status);  // HTTP status code
  }
}
```

## Pricing

| Plan | Requests/Month | Price |
|------|---------------|-------|
| Free | 300 | Free |
| Small | 5,000 | €4.99/mo |
| Medium | 10,000 | €9.99/mo |
| Large | 100,000 | €49.99/mo |

## Links

- [API Documentation](https://allratestoday.com/docs)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [Pricing](https://allratestoday.com/pricing)
- [Status](https://allratestoday.com/status)

## License

MIT
