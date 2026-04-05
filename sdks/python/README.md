# allratestoday

Official Python SDK for the [AllRatesToday](https://allratestoday.com) exchange rate API.

Real-time mid-market exchange rates for 160+ currencies, sourced from Reuters (Refinitiv) and interbank market feeds.

## Installation

```bash
pip install allratestoday
```

## Quick Start

Get your free API key at [allratestoday.com/register](https://allratestoday.com/register) (300 requests/month free).

```python
from allratestoday import AllRatesToday

client = AllRatesToday(api_key="art_live_your_key_here")

# Get exchange rate
rate = client.get_rate("USD", "EUR")
print(f"1 USD = {rate[0]['rate']} EUR")

# Convert amount
result = client.convert("USD", "EUR", 100)
print(f"$100 = €{result['result']}")

# Get historical rates
history = client.get_historical_rates("USD", "EUR", "30d")
for point in history["rates"]:
    print(f"{point['time']}: {point['rate']}")
```

## API Reference

### `AllRatesToday(api_key, base_url=None, timeout=10)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | `str` | **required** | Your API key ([register free](https://allratestoday.com/register)) |
| `base_url` | `str` | `https://allratestoday.com` | API base URL |
| `timeout` | `int` | `10` | Request timeout in seconds |

### Methods

| Method | Description |
|--------|-------------|
| `get_rate(from, to, amount=None)` | Get exchange rate between two currencies |
| `convert(from, to, amount)` | Convert amount between currencies |
| `get_rates(source, target)` | Get rate data with metadata |
| `get_historical_rates(source, target, period)` | Historical rates (1d/7d/30d/1y) |

All methods require an API key.

### Error Handling

```python
from allratestoday import AllRatesToday, AllRatesTodayError

client = AllRatesToday(api_key="art_live_your_key_here")

try:
    rate = client.get_rate("USD", "INVALID")
except AllRatesTodayError as e:
    print(e)        # Error message
    print(e.status)  # HTTP status code (e.g., 400)
```

## Zero Dependencies

This SDK uses only Python standard library (`urllib`, `json`). No external dependencies required.

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

## License

MIT
