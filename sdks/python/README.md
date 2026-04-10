# allratestoday

[![PyPI version](https://img.shields.io/pypi/v/allratestoday.svg)](https://pypi.org/project/allratestoday/)
[![codecov](https://codecov.io/gh/allratestoday/exchange-rates-api/branch/main/graph/badge.svg)](https://codecov.io/gh/allratestoday/exchange-rates-api)
[![Tests](https://github.com/allratestoday/exchange-rates-api/actions/workflows/test.yml/badge.svg)](https://github.com/allratestoday/exchange-rates-api/actions/workflows/test.yml)
[![license](https://img.shields.io/pypi/l/allratestoday.svg)](https://github.com/allratestoday/exchange-rates-api/blob/main/LICENSE)
[![Python](https://img.shields.io/pypi/pyversions/allratestoday.svg)](https://pypi.org/project/allratestoday/)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://pypi.org/project/allratestoday/)

**The most elegant way to access real-time mid-market exchange rates in Python**

## Why Choose This Client?

- **Lightning Fast**: Zero dependencies, pure Python standard library
- **Real-Time Data**: Rates updated every 60 seconds from Reuters (Refinitiv) and interbank feeds
- **Mid-Market Rates**: The true interbank rate — no hidden spread or markup
- **160+ Currencies**: Major, minor, and exotic currency pairs
- **Type Hints**: Full type annotations for IDE autocomplete
- **Zero Dependencies**: Uses only `urllib` and `json` from the standard library
- **100% Test Coverage**: Comprehensive test suite with full coverage

## Get Your API Key

Ready to start? Get your free API key from [allratestoday.com/register](https://allratestoday.com/register).

## Installation

```bash
pip install allratestoday
```

## Quick Start

Get up and running in seconds:

```python
from allratestoday import AllRatesToday

# Set your API key
client = AllRatesToday(api_key="YOUR_API_KEY")

# Get latest exchange rates
data = client.latest(base="USD", symbols=["EUR", "GBP", "JPY"])
print(data["rates"])  # {"EUR": 0.9234, "GBP": 0.7891, "JPY": 151.42}

# Convert an amount
result = client.convert("USD", "EUR", 1000)
print(f"$1,000 = €{result['result']}")
```

## API Reference

- [Latest Rates](#latest-exchange-rates) — Get current exchange rates
- [Historical Data](#historical-exchange-rates) — Fetch rates for specific dates
- [Currency Conversion](#currency-conversion) — Convert between currencies
- [Time Series](#time-series-data) — Get rates over date ranges
- [Available Currencies](#available-currencies) — List all supported currencies
- [Single Rate](#single-rate) — Get one currency pair
- [Historical by Period](#historical-rates-by-period) — Preset period lookups

---

### Latest Exchange Rates

Get the most current exchange rates with a single call:

```python
# All rates from USD (default base)
data = client.latest()
print(data["rates"])

# Target specific currencies with EUR base
data = client.latest(base="EUR", symbols=["USD", "GBP", "JPY"])
print(data["rates"])
# {"USD": 1.083, "GBP": 0.8546, "JPY": 163.92}
```

**Response:**

```python
{
    "base": "EUR",
    "date": "2026-04-09T14:30:00Z",
    "rates": {"USD": 1.083, "GBP": 0.8546, "JPY": 163.92}
}
```

---

### Historical Exchange Rates

Travel back in time to get rates from any date:

```python
# Using a string date
data = client.for_date("2026-01-15", base="USD", symbols=["EUR"])
print(data["rates"])  # {"EUR": 0.9187}

# Using a date object
from datetime import date
data = client.for_date(date(2026, 1, 15), base="EUR", symbols=["USD", "GBP"])

# Using a datetime object
from datetime import datetime
data = client.for_date(datetime(2026, 1, 15, 12, 0, 0))
```

**Response:**

```python
{
    "base": "USD",
    "date": "2026-01-15",
    "rates": {"EUR": 0.9187}
}
```

---

### Currency Conversion

Convert any amount between currencies — including historical conversions:

```python
# Current conversion
result = client.convert("USD", "EUR", 1000)
print(result)
# {"from": "USD", "to": "EUR", "amount": 1000, "result": 923.4, "rate": 0.9234}

# Historical conversion — what was $1,000 worth on Jan 15?
result = client.convert("USD", "EUR", 1000, date="2026-01-15")
print(f"Rate on Jan 15: {result['rate']}")
# {"from": "USD", "to": "EUR", "amount": 1000, "result": 918.7, "rate": 0.9187, "date": "2026-01-15"}

# Using a date object
from datetime import date
result = client.convert("GBP", "JPY", 500, date=date(2025, 12, 31))
```

---

### Available Currencies

Discover all 160+ supported currency symbols and names:

```python
data = client.symbols()
print(data["symbols"])
# {
#     "USD": "United States Dollar",
#     "EUR": "Euro",
#     "GBP": "British Pound Sterling",
#     "JPY": "Japanese Yen",
#     ...160+ currencies
# }

# Build a currency list
for code, name in data["symbols"].items():
    print(f"{code}: {name}")
```

---

### Time Series Data

Get exchange rates over a date range for trend analysis and charting:

```python
data = client.time_series(
    "2026-01-01", "2026-03-31",
    base="USD",
    symbols=["EUR", "GBP"],
)
print(data["rates"]["2026-01-15"])
# {"EUR": 0.9187, "GBP": 0.7834}

# Using date objects
from datetime import date
data = client.time_series(
    date(2026, 1, 1), date(2026, 3, 31),
    symbols=["EUR"],
)
```

**Response:**

```python
{
    "base": "USD",
    "start_date": "2026-01-01",
    "end_date": "2026-03-31",
    "rates": {
        "2026-01-01": {"EUR": 0.9187, "GBP": 0.7834},
        "2026-01-02": {"EUR": 0.9195, "GBP": 0.7841},
        ...
    }
}
```

---

### Single Rate

Get a single exchange rate between two currencies:

```python
rate = client.get_rate("USD", "EUR")
print(f"1 USD = {rate['rate']} EUR")

# With amount
rate = client.get_rate("USD", "EUR", 500)
print(f"$500 = €{rate['to']['amount']}")
```

---

### Historical Rates by Period

Get historical rates using preset periods — no date math needed:

```python
history = client.get_historical_rates("USD", "EUR", "30d")
print(f"Current: {history['current']['rate']}")
for point in history["rates"]:
    print(f"{point['time']}: {point['rate']}")
```

**Available periods:** `1d`, `7d`, `30d`, `1y` (default: `7d`)

---

## Configuration

```python
client = AllRatesToday(
    api_key="YOUR_API_KEY",                      # Required
    base_url="https://allratestoday.com",        # Optional
    timeout=10,                                   # Optional (seconds)
)
```

| Parameter  | Type  | Default                     | Description                     |
| ---------- | ----- | --------------------------- | ------------------------------- |
| `api_key`  | `str` | —                           | Your API key                    |
| `base_url` | `str` | `https://allratestoday.com` | API base URL                    |
| `timeout`  | `int` | `10`                        | Request timeout in seconds      |

---

## Per-Request API Key Override

Every method supports a per-request API key override — useful for multi-tenant apps:

```python
client = AllRatesToday(api_key="default_key")

# Override for a specific request
data = client.latest(api_key="other_users_key")
result = client.convert("USD", "EUR", 100, api_key="tenant_key")
symbols = client.symbols(api_key="another_key")
```

---

## Error Handling

All errors are raised as `AllRatesTodayError` with an optional HTTP status code:

```python
from allratestoday import AllRatesToday, AllRatesTodayError

client = AllRatesToday(api_key="YOUR_API_KEY")

try:
    rate = client.get_rate("USD", "INVALID")
except AllRatesTodayError as e:
    print(e)        # "Currency not found"
    print(e.status)  # 404
```

| Status | Meaning                                |
| ------ | -------------------------------------- |
| —      | Missing API key (raised before request) |
| `401`  | Invalid API key                        |
| `404`  | Currency code not found                |
| `429`  | Rate limit exceeded                    |
| `500`  | Server error                           |

---

## Testing

Run tests:

```bash
pip install pytest pytest-cov
pytest tests/ -v
```

Run with coverage:

```bash
pytest tests/ --cov=allratestoday --cov-report=term-missing
```

---

## Methods Reference

| Method                                              | Description                                                |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `latest(base, symbols, api_key)`                    | Get latest rates for one or more currencies                |
| `for_date(date, base, symbols, api_key)`            | Get rates for a specific historical date                   |
| `convert(from, to, amount, date, api_key)`          | Convert amount (supports historical date)                  |
| `time_series(start, end, base, symbols, api_key)`   | Get rates across a custom date range                       |
| `symbols(api_key)`                                  | List all 160+ supported currency codes and names           |
| `get_rate(from, to, amount, api_key)`               | Get a single exchange rate                                 |
| `get_rates(source, target, api_key)`                | Get rates with full metadata                               |
| `get_historical_rates(source, target, period, api_key)` | Historical rates by preset period (1d/7d/30d/1y)      |

---

## Zero Dependencies

This SDK uses only Python standard library (`urllib`, `json`). No external packages required. Nothing to audit, nothing to break.

---

## Links

- [API Documentation](https://allratestoday.com/developers)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [Status](https://allratestoday.com/status)
- [GitHub](https://github.com/allratestoday/exchange-rates-api)

## License

MIT
