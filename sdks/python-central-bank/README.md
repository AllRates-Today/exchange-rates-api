# allratestoday-central-bank

[![PyPI version](https://img.shields.io/pypi/v/allratestoday-central-bank.svg)](https://pypi.org/project/allratestoday-central-bank/)
[![Python](https://img.shields.io/pypi/pyversions/allratestoday-central-bank.svg)](https://pypi.org/project/allratestoday-central-bank/)
[![license](https://img.shields.io/pypi/l/allratestoday-central-bank.svg)](https://github.com/AllRates-Today/exchange-rates-api/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://pypi.org/project/allratestoday-central-bank/)

**Official exchange rates as published by 100+ central banks and tax authorities — ECB, Federal Reserve, Bank of Japan, HMRC, US Treasury and more.**

```bash
pip install allratestoday-central-bank
```

```python
from allratestoday_central_bank import CentralBankRates

cb = CentralBankRates()                  # no API key needed
pair = cb.latest("ecb", source="USD", target="EUR")

print(pair["rate"], "published", pair["rate_date"])
# 0.8588851671 published 2026-08-28
```

## Which rate is this?

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

## Works without an API key

`latest()` reads an open, edge-cached endpoint, so the newest published table of
any source needs no signup:

```python
cb = CentralBankRates()

cb.latest("ecb")                                   # full ECB table
cb.latest("hmrc")                                  # HMRC's published rates
cb.latest("boj", source="USD", target="JPY")       # one pair
```

A [free API key](https://allratestoday.com/register) (no card) adds historical
dates, time series, publication calendars and cross-source comparison:

```python
cb = CentralBankRates(api_key="art_live_...")
```

Methods that need one raise `NeedsApiKeyError` — a subclass of
`CentralBankError` — with sign-up instructions, before making any request.

## API

| Method | Key? | Returns |
|---|---|---|
| `latest(bank, source=None, target=None)` | no | Newest published table, or one pair from it |
| `sources()` | yes | Every covered institution with coverage dates |
| `for_date(bank, on, source=None, target=None)` | yes | The table in force on a date |
| `history(bank, symbol=..., from_date=..., to_date=...)` | yes | Date-by-date official series |
| `availability(bank, year=...)` | yes | Which dates the institution actually published |
| `compare(source, target)` | yes | One pair across every institution, with spread stats |

Dates accept `"YYYY-MM-DD"`, `datetime.date`, or `datetime.datetime`.

## Three things that will bite you

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
Check `sources()` before assuming yesterday's rate exists.

## Worked example: converting an invoice

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

## Also available

- **Live mid-market rates:** [`allratestoday`](https://pypi.org/project/allratestoday/)
- **Single-source packages:** `ecb-exchange-rate`, `hmrc-exchange-rate` and 100+ others on npm
- **MCP server** for AI agents: `npx -y @allratestoday/central-bank-mcp`
- **Claude Code plugin:** `/plugin marketplace add AllRates-Today/claude-code-plugin`

## Links

- Coverage and docs: <https://allratestoday.com/central-bank-rates-api/>
- API reference: <https://allratestoday.com/docs>
- Support: support@allratestoday.com

MIT licensed. Rates are served as published by the named institution; AllRatesToday is not affiliated with any of them.
