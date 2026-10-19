# allratestoday

[![PyPI version](https://img.shields.io/pypi/v/allratestoday.svg)](https://pypi.org/project/allratestoday/)
[![Tests](https://github.com/AllRates-Today/exchange-rates-api/actions/workflows/test.yml/badge.svg)](https://github.com/AllRates-Today/exchange-rates-api/actions/workflows/test.yml)
[![license](https://img.shields.io/pypi/l/allratestoday.svg)](https://github.com/AllRates-Today/exchange-rates-api/blob/main/LICENSE)
[![Python](https://img.shields.io/pypi/pyversions/allratestoday.svg)](https://pypi.org/project/allratestoday/)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://pypi.org/project/allratestoday/)
[![Security: Snyk](https://img.shields.io/badge/Security-Snyk-4C4A73?logo=snyk&logoColor=white)](https://snyk.io/test/github/AllRates-Today/exchange-rates-api)

**Real-time mid-market exchange rates for Python — 160+ currencies, conversions and history from the [AllRatesToday API](https://allratestoday.com/developers), with zero dependencies. Need the official rate a central bank or tax authority published instead? See [`allratestoday-central-bank`](https://pypi.org/project/allratestoday-central-bank/).**

## 🚀 Why Choose This Client?

- ⚡ **Lightning Fast** — Zero dependencies, pure Python standard library
- 📡 **Real-Time Data** — Rates updated every 60 seconds
- 💹 **Mid-Market Rates** — No retail spread or markup baked in
- 🌍 **160+ Currencies** — Major, minor, and exotic currency pairs
- 🔷 **Type Hints** — Full type annotations for IDE autocomplete
- 📦 **Zero Dependencies** — Uses only `urllib` and `json` from the standard library
- ✅ **Tested in CI** — the test suite runs on every push
- 🔀 **Multi-tenant ready** — per-request API key override on every method

## 🔑 Get Your API Key

Get a free API key at [allratestoday.com/register](https://allratestoday.com/register) — no credit card. Your key, usage and plan live on the [dashboard](https://allratestoday.com/profile).

| Plan | Includes |
| --- | --- |
| Free | `latest`, `convert`, `get_rate`, `get_rates`, `symbols` |
| Paid | Everything above plus `for_date`, `time_series`, `get_historical_rates` and dated `convert` — see [pricing](https://allratestoday.com/pricing/) |

AI agents can self-issue a 100-call, 7-day trial key with no signup — see the AI agent section below.

## 📦 Installation

```bash
pip install allratestoday
```

## 🏁 Quick Start

Get up and running in seconds:

```python
from allratestoday import AllRatesToday

# Set your API key
client = AllRatesToday(api_key="YOUR_API_KEY")

# Get latest exchange rates
data = client.latest(base="USD", symbols=["EUR", "GBP", "JPY"])
print(data["rates"])  # {"EUR": 0.891067, "GBP": 0.749934, "JPY": 158.2}

# Convert an amount
result = client.convert("USD", "EUR", 1000)
print(f"$1,000 = €{result['result']}")
```

## 📚 API Reference

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
# {"USD": 1.12225, "GBP": 0.8416, "JPY": 177.53}
```

**Response:**

```python
{
    "base": "EUR",
    "date": "2026-10-19T11:46:01+0000",
    "rates": {"USD": 1.12225, "GBP": 0.8416, "JPY": 177.53}
}
```

---

### Historical Exchange Rates

Get rates for any date in the last 365 days (paid plans; free and trial keys get a 403 `historical_requires_paid_plan`):

```python
# Using a string date
data = client.for_date("2026-01-15", base="USD", symbols=["EUR"])
print(data["rates"])  # {"EUR": 0.9187}

# Using a date object
from datetime import date
data = client.for_date(date(2026, 1, 15), base="EUR", symbols=["USD", "GBP"])

# Using a datetime object
from datetime import datetime
data = client.for_date(datetime(2026, 1, 15, 12, 0, 0), symbols=["EUR"])
```

`for_date()` and `time_series()` need `symbols` (one request per symbol) and cover the last 365 days.

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

Convert any amount between currencies — including historical conversions (paid plans):

```python
# Current conversion
result = client.convert("USD", "EUR", 1000)
print(result)
# {"from": "USD", "to": "EUR", "amount": 1000, "result": 891.067, "rate": 0.891067}

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
#     "USD": "US Dollar",
#     "EUR": "Euro",
#     "GBP": "British Pound",
#     "JPY": "Japanese Yen",
#     ...160+ currencies
# }

# Build a currency list
for code, name in data["symbols"].items():
    print(f"{code}: {name}")
```

---

### Time Series Data

Get exchange rates over a date range for trend analysis and charting (paid plans):

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
# {"from": {"currency": "USD", "amount": 500}, "to": {"currency": "EUR", "amount": 445.5335},
#  "rate": 0.891067, "source": "mid-market"}
```

---

### Historical Rates by Period

Get historical rates using preset periods — no date math needed (paid plans):

```python
history = client.get_historical_rates("USD", "EUR", "30d")
print(f"Current: {history['current']['rate']}")
for point in history["rates"]:
    print(f"{point['time']}: {point['rate']}")
```

**Available periods:** `1d`, `7d`, `30d`, `1y` (default: `7d`)

---

## 🔧 Configuration

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

## 🔀 Per-Request API Key Override

Every method supports a per-request API key override — useful for multi-tenant apps:

```python
client = AllRatesToday(api_key="default_key")

# Override for a specific request
data = client.latest(api_key="other_users_key")
result = client.convert("USD", "EUR", 100, api_key="tenant_key")
symbols = client.symbols(api_key="another_key")
```

---

## 🛡️ Error Handling

All errors are raised as `AllRatesTodayError` with an optional HTTP status code:

```python
from allratestoday import AllRatesToday, AllRatesTodayError

client = AllRatesToday(api_key="YOUR_API_KEY")

try:
    data = client.for_date("2026-01-15", symbols=["EUR"])
except AllRatesTodayError as e:
    print(e)         # "Historical rates require a paid plan. ..."
    print(e.status)  # 403
```

| Status | Meaning                                |
| ------ | -------------------------------------- |
| —      | Missing API key, bad date or missing `symbols` (raised before any request) |
| `400`  | Unknown currency code                  |
| `401`  | Invalid API key                        |
| `403`  | Your plan does not include this call (history needs a paid plan) |
| `429`  | Quota or rate limit reached            |
| `500`  | Server error                           |

---

## 💡 Quota tips

- Each method call is one request against your quota; `latest(symbols=[...])` returns several currencies in one call, so prefer it to looping `get_rate`.
- `for_date()` and `time_series()` make one request per symbol.
- Rates refresh every 60 seconds — caching responses for a minute loses nothing.

## 🏛️ Official central-bank rates

Mid-market rates are right for pricing and display. Tax filings, customs, statutory accounts and many invoicing rules instead require the rate a named institution published. For those, use [`allratestoday-central-bank`](https://pypi.org/project/allratestoday-central-bank/) — 121 central banks and 3 tax authorities, latest tables with no API key:

```python
from allratestoday_central_bank import CentralBankRates

cb = CentralBankRates()
print(cb.latest("ecb", source="EUR", target="USD"))  # the ECB's own published rate and its rate_date
```

---

## 📖 Methods Reference

| Method                                              | Description                                                |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `latest(base, symbols, api_key)`                    | Get latest rates for one or more currencies                |
| `for_date(date, base, symbols, api_key)`            | Get rates for a specific historical date (paid plan)       |
| `convert(from, to, amount, date, api_key)`          | Convert amount (historical date needs a paid plan)         |
| `time_series(start, end, base, symbols, api_key)`   | Get rates across a custom date range (paid plan)           |
| `symbols(api_key)`                                  | List all 160+ supported currency codes and names           |
| `get_rate(from, to, amount, api_key)`               | Get a single exchange rate                                 |
| `get_rates(source, target, api_key)`                | Get rates with full metadata                               |
| `get_historical_rates(source, target, period, api_key)` | Historical rates by preset period (1d/7d/30d/1y; paid plan) |

---

## 📦 Zero Dependencies

This SDK uses only Python standard library (`urllib`, `json`). No external packages required. Nothing to audit, nothing to break.

---

## 🤖 Use it from an AI agent

The same rates are available to coding agents and LLM tools without a second integration:

- **Claude Code plugin** (no key): `/plugin marketplace add AllRates-Today/claude-code-plugin` then `/plugin install allratestoday@allratestoday`
- **Hosted MCP endpoint**: `https://allratestoday.com/api/mcp` — Streamable HTTP, keyless, nothing to install
- **Local MCP servers**: `npx -y @allratestoday/mcp-server` (live mid-market rates) · `npx -y @allratestoday/central-bank-mcp` (official central-bank rates)
- **Trial key for agents, no signup**: `POST https://allratestoday.com/api/agent/keys` (send `Content-Type: application/json`) returns a 100-call key valid 7 days for latest rates and latest central-bank tables (history and dated tables are paid-plan only); both MCP servers expose it as `request_trial_key`
- **Daily Reference Rate** (first published 2026-10-12): one fixed USD table per business day, the 16:00 London median of minute samples, never revised — keyless at `https://allratestoday.com/api/open/reference-rate`, `get_reference_rate` in the MCP server
- Machine-readable site guide: [llms.txt](https://allratestoday.com/llms.txt)

## 🔗 Links

- [API Documentation](https://allratestoday.com/developers)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [Status](https://allratestoday.com/status)
- [GitHub](https://github.com/AllRates-Today/exchange-rates-api)

## 📜 License

MIT
