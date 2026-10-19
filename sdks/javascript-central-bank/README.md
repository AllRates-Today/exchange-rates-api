# @allratestoday/central-bank

[![npm version](https://img.shields.io/npm/v/@allratestoday/central-bank.svg)](https://www.npmjs.com/package/@allratestoday/central-bank)
[![license](https://img.shields.io/npm/l/@allratestoday/central-bank.svg)](https://github.com/AllRates-Today/exchange-rates-api/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/@allratestoday/central-bank)

**Official exchange rates as published by 121 central banks and tax authorities — ECB, Federal Reserve, Bank of Japan, HMRC, US Treasury and more.**

```bash
npm install @allratestoday/central-bank
```

```ts
import { CentralBankRates } from '@allratestoday/central-bank';

const cb = new CentralBankRates();                       // no API key needed
const pair = await cb.latest('ecb', { source: 'USD', target: 'EUR' });

console.log(pair.rate, 'published', pair.rate_date);
// 0.8588851671 published 2026-08-28
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
[`@allratestoday/sdk`](https://www.npmjs.com/package/@allratestoday/sdk) instead.

## Works without an API key

`latest()` reads an open, edge-cached endpoint, so the newest published table of
any source needs no signup:

```ts
const cb = new CentralBankRates();

await cb.latest('ecb');                                  // full ECB table
await cb.latest('hmrc');                                 // HMRC's published rates
await cb.latest('boj', { source: 'USD', target: 'JPY' }); // one pair
```

A [free API key](https://allratestoday.com/register) (no card) adds publication
calendars and cross-source comparison. Historical dates and time series
(`forDate`, `history`) need a [paid plan](https://allratestoday.com/pricing);
free and trial keys get a 403. Pass the key:

```ts
const cb = new CentralBankRates({ apiKey: process.env.ALLRATES_API_KEY });
```

Methods that need one throw `NeedsApiKeyError` — a subclass of
`CentralBankError` — with sign-up instructions, before making any request.

## API

| Method | Key? | Returns |
|---|---|---|
| `latest(bank, { source?, target? })` | no | Newest published table, or one pair from it |
| `sources()` | yes | Every covered institution with coverage dates |
| `forDate(bank, on, { source?, target? })` | paid plan | The table in force on a date |
| `history(bank, { symbol?, from?, to? })` | paid plan | Date-by-date official series |
| `availability(bank, { year? })` | yes | Which dates the institution actually published |
| `compare(source, target)` | yes | One pair across every institution, with spread stats |

Dates accept `"YYYY-MM-DD"` or a `Date`.

## Covered sources

<!-- sources:start -->
**121 central banks and 3 tax authorities.** Pass the `Code` as `bank` (e.g. `await cb.latest('rbi')`). Every source's latest table is keyless.

### Tax authorities

| Code | Institution | Country | Currency | Publishes | Archive from |
|---|---|---|---|---|---|
| `bazg` | [Swiss Federal Office for Customs and Border Security](https://allratestoday.com/tax-authority-rates-api/bazg/) | Switzerland | CHF | daily | 2000 |
| `hmrc` | [HM Revenue & Customs](https://allratestoday.com/tax-authority-rates-api/hmrc/) | United Kingdom | GBP | monthly | 2021 |
| `ustreasury` | [U.S. Department of the Treasury](https://allratestoday.com/tax-authority-rates-api/ustreasury/) | United States | USD | quarterly | 2001 |

### Central banks

| Code | Institution | Country | Currency | Publishes | Archive from |
|---|---|---|---|---|---|
| `boa` | [Bank of Albania](https://allratestoday.com/central-bank-rates-api/boa/) | Albania | ALL | daily | 2026 |
| `bda` | [Bank of Algeria](https://allratestoday.com/central-bank-rates-api/bda/) | Algeria | DZD | daily | 2000 |
| `bna` | [National Bank of Angola](https://allratestoday.com/central-bank-rates-api/bna/) | Angola | AOA | daily | 1999 |
| `bcra` | [Central Bank of Argentina](https://allratestoday.com/central-bank-rates-api/bcra/) | Argentina | ARS | daily | 2000 |
| `cba` | [Central Bank of Armenia](https://allratestoday.com/central-bank-rates-api/cba/) | Armenia | AMD | daily | 2000 |
| `rba` | [Reserve Bank of Australia](https://allratestoday.com/central-bank-rates-api/rba/) | Australia | AUD | daily | 2023 |
| `cbar` | [Central Bank of Azerbaijan](https://allratestoday.com/central-bank-rates-api/cbar/) | Azerbaijan | AZN | daily | 2016 |
| `cbb` | [Central Bank of Bahrain](https://allratestoday.com/central-bank-rates-api/cbb/) | Bahrain | BHD | daily | 2016 |
| `bb` | [Bangladesh Bank](https://allratestoday.com/central-bank-rates-api/bb/) | Bangladesh | BDT | daily | 2010 |
| `cbbd` | [Central Bank of Barbados](https://allratestoday.com/central-bank-rates-api/cbbd/) | Barbados | BBD | daily | 2010 |
| `nbrb` | [National Bank of the Republic of Belarus](https://allratestoday.com/central-bank-rates-api/nbrb/) | Belarus | BYN | daily | 2016 |
| `cbbz` | [Central Bank of Belize](https://allratestoday.com/central-bank-rates-api/cbbz/) | Belize | BZD | daily | 2010 |
| `rma` | [Royal Monetary Authority of Bhutan](https://allratestoday.com/central-bank-rates-api/rma/) | Bhutan | BTN | daily | 2024 |
| `bcbol` | [Banco Central de Bolivia](https://allratestoday.com/central-bank-rates-api/bcbol/) | Bolivia | BOB | daily | 2016 |
| `cbbh` | [Central Bank of Bosnia and Herzegovina](https://allratestoday.com/central-bank-rates-api/cbbh/) | Bosnia and Herzegovina | BAM | daily | 2016 |
| `bob` | [Bank of Botswana](https://allratestoday.com/central-bank-rates-api/bob/) | Botswana | BWP | daily | 2026 |
| `bcb` | [Banco Central do Brasil](https://allratestoday.com/central-bank-rates-api/bcb/) | Brazil | BRL | daily | 2016 |
| `bnb` | [Bulgarian National Bank](https://allratestoday.com/central-bank-rates-api/bnb/) | Bulgaria | EUR | daily | 2016 |
| `nbc` | [National Bank of Cambodia](https://allratestoday.com/central-bank-rates-api/nbc/) | Cambodia | KHR | daily | 2016 |
| `boc` | [Bank of Canada](https://allratestoday.com/central-bank-rates-api/boc/) | Canada | CAD | daily | 2017 |
| `beac` | [Bank of Central African States (BEAC)](https://allratestoday.com/central-bank-rates-api/beac/) | Central Africa (CEMAC) | XAF | daily | 2026 |
| `bcch` | [Central Bank of Chile](https://allratestoday.com/central-bank-rates-api/bcch/) | Chile | CLP | daily | 1982 |
| `pboc` | [People's Bank of China](https://allratestoday.com/central-bank-rates-api/pboc/) | China | CNY | daily | 2026 |
| `sfc` | [Superintendencia Financiera de Colombia](https://allratestoday.com/central-bank-rates-api/sfc/) | Colombia | COP | daily | 1991 |
| `bccr` | [Banco Central de Costa Rica](https://allratestoday.com/central-bank-rates-api/bccr/) | Costa Rica | CRC | daily | 2026 |
| `bccu` | [Banco Central de Cuba](https://allratestoday.com/central-bank-rates-api/bccu/) | Cuba | CUP | daily | 2025 |
| `cnb` | [Czech National Bank](https://allratestoday.com/central-bank-rates-api/cnb/) | Czech Republic | CZK | daily | 2016 |
| `bcc` | [Banque Centrale du Congo](https://allratestoday.com/central-bank-rates-api/bcc/) | DR Congo | CDF | daily | 2026 |
| `dnb` | [Danmarks Nationalbank](https://allratestoday.com/central-bank-rates-api/dnb/) | Denmark | DKK | daily | 2016 |
| `bcrd` | [Banco Central de la República Dominicana](https://allratestoday.com/central-bank-rates-api/bcrd/) | Dominican Republic | DOP | daily | 1991 |
| `cbe` | [Central Bank of Egypt](https://allratestoday.com/central-bank-rates-api/cbe/) | Egypt | EGP | daily | 2026 |
| `nbe` | [National Bank of Ethiopia](https://allratestoday.com/central-bank-rates-api/nbe/) | Ethiopia | ETB | daily | 2024 |
| `ecb` | [European Central Bank](https://allratestoday.com/central-bank-rates-api/ecb/) | Eurozone | EUR | daily | 1999 |
| `rbf` | [Reserve Bank of Fiji](https://allratestoday.com/central-bank-rates-api/rbf/) | Fiji | FJD | daily | 2001 |
| `nbg` | [National Bank of Georgia](https://allratestoday.com/central-bank-rates-api/nbg/) | Georgia | GEL | daily | 2016 |
| `bog` | [Bank of Ghana](https://allratestoday.com/central-bank-rates-api/bog/) | Ghana | GHS | daily | 2007 |
| `banguat` | [Banco de Guatemala](https://allratestoday.com/central-bank-rates-api/banguat/) | Guatemala | GTQ | daily | 2004 |
| `bogy` | [Bank of Guyana](https://allratestoday.com/central-bank-rates-api/bogy/) | Guyana | GYD | weekly | 2026 |
| `brh` | [Banque de la République d'Haïti](https://allratestoday.com/central-bank-rates-api/brh/) | Haiti | HTG | daily | 2026 |
| `bch` | [Banco Central de Honduras](https://allratestoday.com/central-bank-rates-api/bch/) | Honduras | HNL | daily | 2019 |
| `hkma` | [Hong Kong Monetary Authority](https://allratestoday.com/central-bank-rates-api/hkma/) | Hong Kong | HKD | monthly | 1981 |
| `mnb` | [Magyar Nemzeti Bank](https://allratestoday.com/central-bank-rates-api/mnb/) | Hungary | HUF | daily | 2016 |
| `cbi` | [Central Bank of Iceland](https://allratestoday.com/central-bank-rates-api/cbi/) | Iceland | ISK | daily | 2016 |
| `rbi` | [Reserve Bank of India](https://allratestoday.com/central-bank-rates-api/rbi/) | India | INR | daily | 2003 |
| `bi` | [Bank Indonesia](https://allratestoday.com/central-bank-rates-api/bi/) | Indonesia | IDR | daily | 2016 |
| `cbiq` | [Central Bank of Iraq](https://allratestoday.com/central-bank-rates-api/cbiq/) | Iraq | IQD | daily | 2009 |
| `boi` | [Bank of Israel](https://allratestoday.com/central-bank-rates-api/boi/) | Israel | ILS | daily | 1975 |
| `bdi` | [Banca d'Italia](https://allratestoday.com/central-bank-rates-api/bdi/) | Italy | EUR | daily | 2016 |
| `bojm` | [Bank of Jamaica](https://allratestoday.com/central-bank-rates-api/bojm/) | Jamaica | JMD | daily | 2000 |
| `boj` | [Bank of Japan](https://allratestoday.com/central-bank-rates-api/boj/) | Japan | JPY | daily | 1998 |
| `cbj` | [Central Bank of Jordan](https://allratestoday.com/central-bank-rates-api/cbj/) | Jordan | JOD | daily | 2026 |
| `nbk` | [National Bank of Kazakhstan](https://allratestoday.com/central-bank-rates-api/nbk/) | Kazakhstan | KZT | daily | 2016 |
| `cbke` | [Central Bank of Kenya](https://allratestoday.com/central-bank-rates-api/cbke/) | Kenya | KES | daily | 2024 |
| `cbk` | [Central Bank of Kuwait](https://allratestoday.com/central-bank-rates-api/cbk/) | Kuwait | KWD | daily | 2008 |
| `nbkr` | [National Bank of the Kyrgyz Republic](https://allratestoday.com/central-bank-rates-api/nbkr/) | Kyrgyzstan | KGS | daily | 2026 |
| `bol` | [Bank of the Lao PDR](https://allratestoday.com/central-bank-rates-api/bol/) | Laos | LAK | daily | 2021 |
| `cbl` | [Central Bank of Libya](https://allratestoday.com/central-bank-rates-api/cbl/) | Libya | LYD | daily | 2015 |
| `lb` | [Bank of Lithuania](https://allratestoday.com/central-bank-rates-api/lb/) | Lithuania | EUR | daily | 2015 |
| `amcm` | [Monetary Authority of Macao](https://allratestoday.com/central-bank-rates-api/amcm/) | Macao | MOP | daily | 1999 |
| `bfm` | [Central Bank of Madagascar (BFM)](https://allratestoday.com/central-bank-rates-api/bfm/) | Madagascar | MGA | daily | 2023 |
| `rbm` | [Reserve Bank of Malawi](https://allratestoday.com/central-bank-rates-api/rbm/) | Malawi | MWK | daily | 2016 |
| `bnm` | [Bank Negara Malaysia](https://allratestoday.com/central-bank-rates-api/bnm/) | Malaysia | MYR | daily | 2020 |
| `mma` | [Maldives Monetary Authority](https://allratestoday.com/central-bank-rates-api/mma/) | Maldives | MVR | daily | 2011 |
| `bcm` | [Banque Centrale de Mauritanie](https://allratestoday.com/central-bank-rates-api/bcm/) | Mauritania | MRU | daily | 2023 |
| `bmu` | [Bank of Mauritius](https://allratestoday.com/central-bank-rates-api/bmu/) | Mauritius | MUR | daily | 2026 |
| `banxico` | [Banco de México](https://allratestoday.com/central-bank-rates-api/banxico/) | Mexico | MXN | daily | 1993 |
| `nbm` | [National Bank of Moldova](https://allratestoday.com/central-bank-rates-api/nbm/) | Moldova | MDL | daily | 1994 |
| `bom` | [Bank of Mongolia](https://allratestoday.com/central-bank-rates-api/bom/) | Mongolia | MNT | daily | 2026 |
| `bam` | [Bank Al-Maghrib](https://allratestoday.com/central-bank-rates-api/bam/) | Morocco | MAD | daily | 2000 |
| `bdm` | [Banco de Moçambique](https://allratestoday.com/central-bank-rates-api/bdm/) | Mozambique | MZN | daily | 2026 |
| `cbm` | [Central Bank of Myanmar](https://allratestoday.com/central-bank-rates-api/cbm/) | Myanmar | MMK | daily | 2012 |
| `bon` | [Bank of Namibia](https://allratestoday.com/central-bank-rates-api/bon/) | Namibia | NAD | daily | 2026 |
| `nrb` | [Nepal Rastra Bank](https://allratestoday.com/central-bank-rates-api/nrb/) | Nepal | NPR | daily | 1998 |
| `rbnz` | [Reserve Bank of New Zealand](https://allratestoday.com/central-bank-rates-api/rbnz/) | New Zealand | NZD | daily | 1999 |
| `bcn` | [Banco Central de Nicaragua](https://allratestoday.com/central-bank-rates-api/bcn/) | Nicaragua | NIO | daily | 2012 |
| `cbn` | [Central Bank of Nigeria](https://allratestoday.com/central-bank-rates-api/cbn/) | Nigeria | NGN | daily | 2001 |
| `nbrm` | [National Bank of North Macedonia](https://allratestoday.com/central-bank-rates-api/nbrm/) | North Macedonia | MKD | daily | 1993 |
| `norges` | [Norges Bank](https://allratestoday.com/central-bank-rates-api/norges/) | Norway | NOK | daily | 2016 |
| `cbo` | [Central Bank of Oman](https://allratestoday.com/central-bank-rates-api/cbo/) | Oman | OMR | daily | 2022 |
| `sbp` | [State Bank of Pakistan](https://allratestoday.com/central-bank-rates-api/sbp/) | Pakistan | PKR | daily | 2017 |
| `pma` | [Palestine Monetary Authority](https://allratestoday.com/central-bank-rates-api/pma/) | Palestine | ILS | daily | 2026 |
| `bcp` | [Banco Central del Paraguay](https://allratestoday.com/central-bank-rates-api/bcp/) | Paraguay | PYG | daily | 2016 |
| `bcrp` | [Central Reserve Bank of Peru](https://allratestoday.com/central-bank-rates-api/bcrp/) | Peru | PEN | daily | 2016 |
| `bsp` | [Bangko Sentral ng Pilipinas](https://allratestoday.com/central-bank-rates-api/bsp/) | Philippines | PHP | daily | 2026 |
| `nbp` | [Narodowy Bank Polski](https://allratestoday.com/central-bank-rates-api/nbp/) | Poland | PLN | daily | 2016 |
| `qcb` | [Qatar Central Bank](https://allratestoday.com/central-bank-rates-api/qcb/) | Qatar | QAR | daily | 2024 |
| `bnr` | [National Bank of Romania](https://allratestoday.com/central-bank-rates-api/bnr/) | Romania | RON | daily | 2005 |
| `cbr` | [Bank of Russia](https://allratestoday.com/central-bank-rates-api/cbr/) | Russia | RUB | daily | 2016 |
| `bnrw` | [National Bank of Rwanda](https://allratestoday.com/central-bank-rates-api/bnrw/) | Rwanda | RWF | daily | 2012 |
| `sama` | [Saudi Central Bank (SAMA)](https://allratestoday.com/central-bank-rates-api/sama/) | Saudi Arabia | SAR | monthly_average | 2009 |
| `nbs` | [National Bank of Serbia](https://allratestoday.com/central-bank-rates-api/nbs/) | Serbia | RSD | daily | 2016 |
| `bsl` | [Bank of Sierra Leone](https://allratestoday.com/central-bank-rates-api/bsl/) | Sierra Leone | SLE | daily | 2026 |
| `mas` | [Monetary Authority of Singapore](https://allratestoday.com/central-bank-rates-api/mas/) | Singapore | SGD | daily | 1988 |
| `sarb` | [South African Reserve Bank](https://allratestoday.com/central-bank-rates-api/sarb/) | South Africa | ZAR | daily | 2000 |
| `bok` | [Bank of Korea](https://allratestoday.com/central-bank-rates-api/bok/) | South Korea | KRW | daily | 1964 |
| `cbsl` | [Central Bank of Sri Lanka](https://allratestoday.com/central-bank-rates-api/cbsl/) | Sri Lanka | LKR | daily | 2010 |
| `cbvs` | [Central Bank of Suriname](https://allratestoday.com/central-bank-rates-api/cbvs/) | Suriname | SRD | daily | 2009 |
| `riksbank` | [Sveriges Riksbank](https://allratestoday.com/central-bank-rates-api/riksbank/) | Sweden | SEK | daily | 2016 |
| `snb` | [Swiss National Bank](https://allratestoday.com/central-bank-rates-api/snb/) | Switzerland | CHF | monthly_average | 1914 |
| `bcstp` | [Banco Central de São Tomé e Príncipe](https://allratestoday.com/central-bank-rates-api/bcstp/) | São Tomé and Príncipe | STN | daily | 2026 |
| `cbc` | [Central Bank of the Republic of China (Taiwan)](https://allratestoday.com/central-bank-rates-api/cbc/) | Taiwan | TWD | daily | 2008 |
| `nbt` | [National Bank of Tajikistan](https://allratestoday.com/central-bank-rates-api/nbt/) | Tajikistan | TJS | daily | 2010 |
| `botz` | [Bank of Tanzania](https://allratestoday.com/central-bank-rates-api/botz/) | Tanzania | TZS | daily | 2010 |
| `bot` | [Bank of Thailand](https://allratestoday.com/central-bank-rates-api/bot/) | Thailand | THB | daily | 2002 |
| `cbg` | [Central Bank of The Gambia](https://allratestoday.com/central-bank-rates-api/cbg/) | The Gambia | GMD | daily | 2026 |
| `cbtt` | [Central Bank of Trinidad and Tobago](https://allratestoday.com/central-bank-rates-api/cbtt/) | Trinidad and Tobago | TTD | daily | 1991 |
| `bct` | [Central Bank of Tunisia](https://allratestoday.com/central-bank-rates-api/bct/) | Tunisia | TND | daily | 2004 |
| `cbt` | [Central Bank of Turkmenistan](https://allratestoday.com/central-bank-rates-api/cbt/) | Turkmenistan | TMT | daily | 2009 |
| `tcmb` | [Central Bank of Türkiye](https://allratestoday.com/central-bank-rates-api/tcmb/) | Türkiye | TRY | daily | 2020 |
| `bou` | [Bank of Uganda](https://allratestoday.com/central-bank-rates-api/bou/) | Uganda | UGX | daily | 2026 |
| `nbu` | [National Bank of Ukraine](https://allratestoday.com/central-bank-rates-api/nbu/) | Ukraine | UAH | daily | 1996 |
| `cbuae` | [Central Bank of the UAE](https://allratestoday.com/central-bank-rates-api/cbuae/) | United Arab Emirates | AED | daily | 2019 |
| `boe` | [Bank of England](https://allratestoday.com/central-bank-rates-api/boe/) | United Kingdom | GBP | daily | 2016 |
| `fed` | [US Federal Reserve](https://allratestoday.com/central-bank-rates-api/fed/) | United States | USD | weekly | 2016 |
| `bcu` | [Central Bank of Uruguay](https://allratestoday.com/central-bank-rates-api/bcu/) | Uruguay | UYU | daily | 2000 |
| `cbu` | [Central Bank of Uzbekistan](https://allratestoday.com/central-bank-rates-api/cbu/) | Uzbekistan | UZS | daily | 2016 |
| `bcv` | [Central Bank of Venezuela](https://allratestoday.com/central-bank-rates-api/bcv/) | Venezuela | VES | daily | 2016 |
| `sbv` | [State Bank of Vietnam](https://allratestoday.com/central-bank-rates-api/sbv/) | Vietnam | VND | daily | 2009 |
| `boz` | [Bank of Zambia](https://allratestoday.com/central-bank-rates-api/boz/) | Zambia | ZMW | daily | 2026 |
| `rbz` | [Reserve Bank of Zimbabwe](https://allratestoday.com/central-bank-rates-api/rbz/) | Zimbabwe | ZWG | daily | 2024 |
| `bceao` | [Central Bank of West African States (BCEAO)](https://allratestoday.com/central-bank-rates-api/bceao/) | eight WAEMU countries | XOF | daily | 2014 |
<!-- sources:end -->

## Three things that will bite you

**1. `rate_date` is the answer, not the date you asked for.** Most institutions
publish on business days only. Ask for a Sunday and you get the previous
publication, with `rate_date` saying which day it really is. Record that date —
it is the audit trail.

```ts
const table = await cb.forDate('ecb', '2026-01-04'); // a Sunday
table.rate_date;                                      // '2026-01-02'
```

**2. `derived: true` means the institution did not publish that pair.** It was
cross-computed within that institution's own table. Fine for display; say so if
the number goes into a filing, and never derive one institution's rate from
another's — an ECB rate crossed through USD is not an HMRC rate.

**3. Cadence differs by source.** The Fed's H.10 is weekly, the SNB publishes
monthly averages, the US Treasury is quarterly, most central banks are daily.
Check `sources()` before assuming yesterday's rate exists.

## Worked example: converting an invoice

```ts
import { CentralBankRates } from '@allratestoday/central-bank';

const cb = new CentralBankRates({ apiKey: process.env.ALLRATES_API_KEY });

/** Convert at the HMRC rate in force on the invoice date. */
async function invoiceTotalInGbp(amountUsd: number, invoiceDate: string) {
  const published = await cb.forDate('hmrc', invoiceDate, { source: 'USD', target: 'GBP' });
  // Return the publication date alongside the number: it is what an auditor
  // will ask for, and it is not necessarily the invoice date.
  return {
    total: Math.round(amountUsd * published.rate * 100) / 100,
    rateDate: published.rate_date,
  };
}
```

## Also available

- **Live mid-market rates:** [`@allratestoday/sdk`](https://www.npmjs.com/package/@allratestoday/sdk)
- **Python:** [`allratestoday-central-bank`](https://pypi.org/project/allratestoday-central-bank/)
- **Single-source packages:** `ecb-exchange-rate`, `hmrc-exchange-rate` and 120 more
- **MCP server** for AI agents: `npx -y @allratestoday/central-bank-mcp`, or the hosted keyless endpoint `https://allratestoday.com/api/mcp`
- **Claude Code plugin:** `/plugin marketplace add AllRates-Today/claude-code-plugin`
- **Trial key for agents** (no signup): `POST https://allratestoday.com/api/agent/keys` with `Content-Type: application/json` → 100 calls over 7 days for latest rates and latest tables (dated tables and history are paid-plan only); MCP tool `request_trial_key`
- **Open data archive:** the same published tables mirrored daily, one CSV per institution — [Hugging Face](https://huggingface.co/datasets/AllRatesToday/central-bank-exchange-rates) · [Kaggle](https://www.kaggle.com/datasets/allratestoday/central-bank-exchange-rates) (CC BY-NC 4.0)

## Links

- Coverage and docs: <https://allratestoday.com/central-bank-rates-api/>
- API reference: <https://allratestoday.com/docs>
- Support: support@allratestoday.com
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [Status](https://allratestoday.com/status)
- [GitHub](https://github.com/AllRates-Today/exchange-rates-api)

MIT licensed. Rates are served as published by the named institution; AllRatesToday is not affiliated with any of them.
