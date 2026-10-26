# allratestoday-central-bank

[![PyPI version](https://img.shields.io/pypi/v/allratestoday-central-bank.svg)](https://pypi.org/project/allratestoday-central-bank/)
[![Python](https://img.shields.io/pypi/pyversions/allratestoday-central-bank.svg)](https://pypi.org/project/allratestoday-central-bank/)
[![license](https://img.shields.io/pypi/l/allratestoday-central-bank.svg)](https://github.com/AllRates-Today/exchange-rates-api/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://pypi.org/project/allratestoday-central-bank/)
[![ECB EUR/USD today](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fallratestoday.com%2Fapi%2Fopen%2Fcentral-bank%2Fecb%3Fsource%3DEUR%26target%3DUSD&query=%24.rate&label=ECB%20EUR%2FUSD&color=0A7E8C&cacheSeconds=3600)](https://allratestoday.com/central-bank-rates-api/ecb/)

**Official exchange rates for Python, as published by [122 central banks and 4 tax authorities](https://allratestoday.com/central-bank-rates-api/institutions/) — ECB, Federal Reserve, Bank of Japan, Bank of England, HMRC, US Treasury and more. The latest table of every source works without an API key. Zero dependencies.**

## 🚀 Why this package?

- 🏛️ **Published rates, not estimates** — each number is what a named institution printed, with that institution's own `rate_date`
- 🔓 **No key for the latest table** — `latest()` reads an open, edge-cached endpoint for any of the [126 sources](https://allratestoday.com/central-bank-rates-api/institutions/)
- 🌍 **One client, every source** — switch from the ECB to HMRC to the Reserve Bank of India by changing one string
- 🔀 **Published vs derived, always flagged** — computed pairs carry `derived: True` and are never crossed between institutions
- 📊 **Cross-source comparison** — one pair across every institution with spread statistics
- 📅 **Publication calendars** — which dates a source actually published, for audit trails
- ⚡ **Zero dependencies** — standard library only, Python 3.9+, typed (`py.typed`)

## 📦 Installation

```bash
pip install allratestoday-central-bank
```

## 🏁 Quick start

```python
from allratestoday_central_bank import CentralBankRates

cb = CentralBankRates()                  # no API key needed
pair = cb.latest("ecb", source="EUR", target="USD")

print(pair["rate"], "published", pair["rate_date"])
# 1.1253 published 2026-10-16
```

## ⚖️ Which rate is this?

Not a market rate. A **published** rate: the number a named institution put out
for a given day, fixed once published, carrying that institution's own date.

That distinction is the whole reason this package exists. Compliance rules
almost never say "use the current market rate" — they name a publisher and a
date. *The ECB reference rate on the invoice date. The HMRC monthly rate for the
period.* The two routinely differ by a percent or more, so a VAT return computed
from a live market rate produces numbers nobody can reconcile.

Use this package for invoices, VAT and tax returns, customs valuation, transfer
pricing, month-end and statutory accounting, and audit evidence.

For live mid-market rates — price display, checkout, conversion UI — use
[`allratestoday`](https://pypi.org/project/allratestoday/) instead.

## ⚡ Works without an API key

`latest()` reads an open, edge-cached endpoint, so the newest published table of
any source needs no signup:

```python
cb = CentralBankRates()

cb.latest("ecb")                                   # full ECB table
cb.latest("hmrc")                                  # HMRC's published rates
cb.latest("boj", source="USD", target="JPY")       # one pair
```

A pair response looks like this:

```python
{
    "bank": "ecb", "rate_date": "2026-10-16",
    "source": "EUR", "target": "USD", "rate": 1.1253,
    "rate_type": "reference", "derived": False, "method": "published",
    "age_days": 3, "stale": False, "cadence": "daily",
    "attribution": {"source": "Official rates published by ECB, served by AllRatesToday", ...},
}
```

## 🔑 API key

A [free API key](https://allratestoday.com/register) (no card) adds the source
list, publication calendars and cross-source comparison. Historical dates and
time series (`for_date`, `history`) need a [paid plan](https://allratestoday.com/pricing);
free and trial keys get a 403. Your key and plan live on the
[dashboard](https://allratestoday.com/profile).

```python
cb = CentralBankRates(api_key="art_live_...")
```

## 📚 API reference

| Method | Key? | Returns |
|---|---|---|
| `latest(bank, source=None, target=None)` | no | Newest published table, or one pair from it |
| `sources()` | free key | Every covered institution with coverage dates |
| `availability(bank, year=...)` | free key | Which dates the institution actually published |
| `compare(source, target)` | free key | One pair across every institution, with spread stats |
| `for_date(bank, on, source=None, target=None)` | paid plan | The table in force on a date |
| `history(bank, symbol=..., from_date=..., to_date=...)` | paid plan | Date-by-date official series |

`bank` is the source code used across AllRatesToday — `ecb`, `fed`, `boe`, `boj`,
`rbi`, `hmrc`, `cbsl` and so on; the full list is on the
[central bank](https://allratestoday.com/central-bank-rates-api/) and
[tax authority](https://allratestoday.com/tax-authority-rates-api/) hubs.
Dates accept `"YYYY-MM-DD"`, `datetime.date`, or `datetime.datetime`.

```python
cb = CentralBankRates(api_key="art_live_...")

cb.compare("USD", "EUR")              # {"count": 111, "banks": [{"code": "amcm", "rate": ..., "rate_date": ...}, ...]}
cb.availability("ecb", year=2026)     # {"count": ..., "dates": ["2026-01-02", "2026-01-05", ...]}
```

## 🌍 Covered sources

<!-- sources:start -->
**[122 central banks and 4 tax authorities](https://allratestoday.com/central-bank-rates-api/institutions/)**, including the ECB, Federal Reserve, Bank of England, Bank of Japan, RBI, PBOC, HMRC and the US Treasury. The full list, with every institution's code, country, currencies, history start and latest publication date, is on the [institutions page](https://allratestoday.com/central-bank-rates-api/institutions/).

Pass an institution's code as `bank` (e.g. `cb.latest("rbi")`). Every source's latest table is keyless. `sources()` returns the same list in code, with a free key.
<!-- sources:end -->

## 🧭 Three things that will bite you

**1. `rate_date` is the answer, not the date you asked for.** Most institutions
publish on business days only. Ask for a Sunday and you get the previous
publication, with `rate_date` saying which day it really is. Record that date —
it is the audit trail.

```python
table = cb.for_date("ecb", "2026-01-04")   # a Sunday
table["rate_date"]                          # '2026-01-02'
```

**2. `derived: True` means the institution did not publish that pair.** It was
cross-computed within that institution's own table. Fine for display; say so if
the number goes into a filing, and never derive one institution's rate from
another's — an ECB rate crossed through USD is not an HMRC rate.

**3. Cadence differs by source.** The Fed's H.10 is weekly, the SNB publishes
monthly averages, the US Treasury is quarterly, most central banks are daily.
Check `cadence` on the response, or `sources()`, before assuming yesterday's rate exists.

## 🧾 Worked example: converting an invoice

```python
from allratestoday_central_bank import CentralBankRates

cb = CentralBankRates(api_key="art_live_...")

def invoice_total_in_gbp(amount_usd: float, invoice_date: str) -> tuple[float, str]:
    """Convert at the HMRC rate in force on the invoice date."""
    published = cb.for_date("hmrc", invoice_date, source="USD", target="GBP")
    total = amount_usd * published["rate"]
    # Return the publication date alongside the number: it is what an auditor
    # will ask for, and it is not necessarily the invoice date.
    return round(total, 2), published["rate_date"]
```

## 🛡️ Error handling

Every failure raises `CentralBankError`, with the HTTP status on `.status` when
the server answered. Calls that need a key raise its subclass `NeedsApiKeyError`
*before* any request is made, with sign-up instructions in the message.

```python
from allratestoday_central_bank import CentralBankRates, CentralBankError, NeedsApiKeyError

try:
    CentralBankRates(api_key="art_live_...").for_date("ecb", "2026-01-15")
except NeedsApiKeyError as err:
    print(err)                  # no key configured
except CentralBankError as err:
    print(err, err.status)      # e.g. 403 on a free key: dated tables need a paid plan
```

| Status | Meaning |
|---|---|
| `None` | No key configured (`NeedsApiKeyError`), or a network error |
| `401` | Invalid API key |
| `403` | Your plan does not include this call |
| `404` | The source does not publish that pair or date |
| `429` | Quota or rate limit reached |

## 🧩 ERP & accounting systems

Loading an official rate into an accounting system? Step-by-step guides with
the direction each system expects:
[Business Central](https://allratestoday.com/docs/integrations/business-central/) ·
[Xero](https://allratestoday.com/docs/integrations/xero/) ·
[QuickBooks Online](https://allratestoday.com/docs/integrations/quickbooks/) ·
[SAP](https://allratestoday.com/docs/integrations/sap/) ·
[Odoo](https://allratestoday.com/docs/integrations/odoo/).

## 🤖 AI agents

- **MCP server:** `npx -y @allratestoday/central-bank-mcp`, or the hosted keyless endpoint `https://allratestoday.com/api/mcp`
- **Claude Code plugin:** `/plugin marketplace add AllRates-Today/claude-code-plugin`
- **Trial key for agents** (no signup): `POST https://allratestoday.com/api/agent/keys` with `Content-Type: application/json` → 100 calls over 7 days for latest rates and latest tables (dated tables and history are paid-plan only); MCP tool `request_trial_key`

## 📦 Also available

- **Live mid-market rates:** [`allratestoday`](https://pypi.org/project/allratestoday/)
- **Single-source packages:** [`ecb-exchange-rate`](https://pypi.org/project/ecb-exchange-rate/), [`fed-exchange-rate`](https://pypi.org/project/fed-exchange-rate/) and [`boe-exchange-rate`](https://pypi.org/project/boe-exchange-rate/) on PyPI; `hmrc-exchange-rate` and 120 more on npm

## 📥 Bulk data (no key)

Need the whole archive rather than an API call? The same published tables are
mirrored daily as open data, one CSV per institution:
[Hugging Face](https://huggingface.co/datasets/AllRatesToday/central-bank-exchange-rates) ·
[Kaggle](https://www.kaggle.com/datasets/allratestoday/central-bank-exchange-rates) (CC BY-NC 4.0).

## 🔗 Links

- [API Documentation](https://allratestoday.com/developers) · [Central bank API docs](https://allratestoday.com/docs/#central-bank) · [Methodology](https://allratestoday.com/official-rates-methodology/)
- [Central bank sources](https://allratestoday.com/central-bank-rates-api/) · [Tax authority sources](https://allratestoday.com/tax-authority-rates-api/)
- [Register (Free)](https://allratestoday.com/register) · [Dashboard](https://allratestoday.com/profile) · [Pricing](https://allratestoday.com/pricing/)
- [Status](https://allratestoday.com/status)
- [Postman collection](https://allratestoday.com/postman/)
- [GitHub](https://github.com/AllRates-Today/exchange-rates-api)
- Support: support@allratestoday.com

## 📜 License

MIT. Rates are served as published by the named institution; AllRatesToday is not affiliated with any of them.
