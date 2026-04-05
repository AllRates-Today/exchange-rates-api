# allratestoday

Official Python SDK for the [AllRatesToday](https://allratestoday.com) exchange rate API.

Real-time mid-market exchange rates for 160+ currencies, sourced from Reuters (Refinitiv) and interbank market feeds.

## Installation

```bash
pip install allratestoday
```

## Quick Start

### Free Public Rates (No API Key)

```python
from allratestoday import AllRatesToday

client = AllRatesToday()

# Get exchange rate
rate = client.get_rate("USD", "EUR")
print(f"1 USD = {rate['rate']} EUR")

# Convert amount
result = client.convert("USD", "EUR", 100)
print(f"$100 = €{result['result']}")
```

### Authenticated Rates (API Key Required)

```python
from allratestoday import AllRatesToday

client = AllRatesToday(api_key="art_live_your_key_here")

# Get authenticated rates
rates = client.get_rates("USD", "EUR")
print(rates)

# Get historical rates
history = client.get_historical_rates("USD", "EUR", "30d")
for point in history["rates"]:
    print(f"{point['time']}: {point['rate']}")
```

## API Reference

### `AllRatesToday(api_key=None, base_url=None, timeout=10)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | `str` | `None` | Your API key ([get one here](https://allratestoday.com/profile)) |
| `base_url` | `str` | `https://allratestoday.com` | API base URL |
| `timeout` | `int` | `10` | Request timeout in seconds |

### Methods

| Method | Auth | Description |
|--------|------|-------------|
| `get_rate(from, to, amount=None)` | No | Get exchange rate (free) |
| `convert(from, to, amount)` | No | Convert amount between currencies |
| `get_rates(source, target)` | Yes | Authenticated rate lookup |
| `get_historical_rates(source, target, period)` | Yes | Historical rates (1d/7d/30d/1y) |

### Error Handling

```python
from allratestoday import AllRatesToday, AllRatesTodayError

client = AllRatesToday()

try:
    rate = client.get_rate("USD", "INVALID")
except AllRatesTodayError as e:
    print(e)        # Error message
    print(e.status)  # HTTP status code (e.g., 400)
```

## Zero Dependencies

This SDK uses only Python standard library (`urllib`, `json`). No external dependencies required.

## Links

- [API Documentation](https://allratestoday.com/docs)
- [Get API Key](https://allratestoday.com/profile)
- [Pricing](https://allratestoday.com/pricing)

## License

MIT
