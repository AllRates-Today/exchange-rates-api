# Changelog — @allratestoday/sdk

## 1.5.0 — 2026-10-16

### Fixed
- `symbols()` returned an empty `symbols` object: the API returns a `currencies` list, which is now mapped to `symbols` (code → name). The full list is also returned as `currencies`, with `count`. No API key needed any more.
- `forDate()`, `timeSeries()` and `convert(..., { date })` returned empty rates or `0`: they now read the market-history windows the API actually serves (7 days, 30 days, 1 year) and pick the requested days.
- `getHistoricalRates()` returned `rates: undefined`: the API's `data` points are now mapped to `rates` and `current`, and also returned raw as `data`.
- `getRate(from, to)` without an amount returned an array instead of `RateResponse`; it is now normalised to the documented shape.
- `getRates()` always returns an array.

### Added
- `officialRatesOn(bank, date, options?)`: official table or pair as published on a date (keyed), including cross pairs and each bank's full archive.
- `AllRatesTodayError.code` (`missing_key`, `invalid_argument`, `http`, `timeout`, `network`) and `details` (parsed API error body, e.g. quota fields on 429). Timeouts and network failures are now wrapped in `AllRatesTodayError` instead of surfacing as raw `TimeoutError` / `TypeError`.
- `ForDateResponse.rateDates` and `ConvertResponse.rateDate`: the date of the data point actually used.
- Exported types `HistoryPeriod`, `HistoryPoint`, `CurrencyInfo`, `DatedOfficialRatesResponse`, `AllRatesTodayErrorCode`.
- Input validation: malformed and future dates, start after end, and market dates older than 365 days throw `invalid_argument` before any request.

### Changed
- `forDate()` and `timeSeries()` now require `symbols` (one history request per symbol). Calls without symbols previously returned no data.
- README rewritten: market vs official rates, browser key safety, rate definitions, full method reference with live responses, error codes, retries, quotas, compatibility.

## 1.4.5 — 2026-10-14
- npm keywords.

## 1.4.0 — 2026-10-01
- Added keyless `officialRates()` and `officialSources()` for central-bank and tax-authority tables.

## 1.3.10 — 2026-09-30
- README wording.
