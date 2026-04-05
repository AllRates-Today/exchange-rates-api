# @allratestoday/sdk

Official JavaScript/TypeScript SDK for the [AllRatesToday](https://allratestoday.com) exchange rate API.

Real-time mid-market exchange rates for 160+ currencies, sourced from Reuters (Refinitiv) and interbank market feeds.

## Installation

```bash
npm install @allratestoday/sdk
```

## Quick Start

### Free Public Rates (No API Key)

```typescript
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday();

// Get exchange rate
const rate = await client.getRate('USD', 'EUR');
console.log(`1 USD = ${rate.rate} EUR`);

// Convert amount
const result = await client.convert('USD', 'EUR', 100);
console.log(`$100 = €${result.result}`);
```

### Authenticated Rates (API Key Required)

```typescript
import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'art_live_your_key_here' });

// Get authenticated rates
const rates = await client.getRates('USD', 'EUR');
console.log(rates);

// Get historical rates
const history = await client.getHistoricalRates('USD', 'EUR', '30d');
console.log(history.rates);
```

## API Reference

### `new AllRatesToday(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | — | Your API key (from [dashboard](https://allratestoday.com/profile)) |
| `baseUrl` | `string` | `https://allratestoday.com` | API base URL |
| `timeout` | `number` | `10000` | Request timeout in ms |

### Methods

| Method | Auth | Description |
|--------|------|-------------|
| `getRate(from, to, amount?)` | No | Get exchange rate (free) |
| `convert(from, to, amount)` | No | Convert amount between currencies |
| `getRates(source, target)` | Yes | Authenticated rate lookup |
| `getHistoricalRates(source, target, period)` | Yes | Historical rates (1d/7d/30d/1y) |

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

## Links

- [API Documentation](https://allratestoday.com/docs)
- [Get API Key](https://allratestoday.com/profile)
- [Pricing](https://allratestoday.com/pricing)
- [Status](https://allratestoday.com/status)

## License

MIT
