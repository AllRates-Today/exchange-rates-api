# react-currency-localizer-realtime

[![npm version](https://img.shields.io/npm/v/react-currency-localizer-realtime.svg)](https://www.npmjs.com/package/react-currency-localizer-realtime)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://www.typescriptlang.org/)
[![Tests](https://github.com/allratestoday/exchange-rates-api/actions/workflows/test.yml/badge.svg)](https://github.com/allratestoday/exchange-rates-api/actions/workflows/test.yml)
[![license](https://img.shields.io/npm/l/react-currency-localizer-realtime.svg)](https://github.com/allratestoday/exchange-rates-api/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/runtime_deps-0-brightgreen.svg)](https://www.npmjs.com/package/react-currency-localizer-realtime)

**React hooks and components for automatically displaying prices in a user's local currency using IP geolocation**

Built with real-time mid-market exchange rates from AllRatesToday (Reuters/Refinitiv data, 160+ currencies). Perfect for e-commerce sites, pricing pages, and international applications.

## Why Choose This Library?

- **Real-Time Mid-Market Rates**: Updated every 60 seconds from Reuters/Refinitiv — no hidden spreads or markup
- **Automatic Currency Detection**: Uses IP geolocation to detect user's local currency (no API key needed for geolocation)
- **160+ Currencies**: Major, minor, and exotic pairs — covering 99% of UN-recognized territories
- **Intelligent Caching**: 24-hour localStorage for geolocation, 1-hour memory cache for exchange rates
- **Multiple Usage Patterns**: Hook-based API, batch converter, and declarative component
- **Manual Override**: Bypass geolocation with explicit currency selection
- **TypeScript**: Fully typed with comprehensive type definitions and autocomplete
- **Zero Runtime Dependencies**: Only peer dependency is React itself — no TanStack Query, no extra bundles
- **Lightweight**: ~10KB minified (~4KB gzipped) — less than half the size of alternatives
- **Graceful Fallbacks**: Shows original price if conversion fails — your users never see a broken UI
- **Case-Insensitive**: Currency codes work in any case (`'usd'`, `'USD'`, `'Usd'`)
- **Free APIs**: Both geolocation and exchange rates work on free tiers — no credit card required

## Get Your API Key

Get your free API key from [allratestoday.com/register](https://allratestoday.com/register) — no credit card required. 300 requests/month on the free tier. With intelligent caching, this serves thousands of daily visitors.

## Installation

```bash
# npm
npm install react-currency-localizer-realtime

# yarn
yarn add react-currency-localizer-realtime

# pnpm
pnpm add react-currency-localizer-realtime
```

> **Note:** React 17+ is a peer dependency. No other dependencies required.

## Quick Start

### 1. Use the Component (Simplest)

```tsx
import { LocalizedPrice } from 'react-currency-localizer-realtime'

function ProductCard() {
  return (
    <div>
      <h3>Premium Plan</h3>
      <LocalizedPrice
        basePrice={99.99}
        baseCurrency="USD"
        apiKey="YOUR_API_KEY" // Get free key from allratestoday.com/register
      />
    </div>
  )
}
```

### 2. Use the Hook (Full Control)

```tsx
import { useCurrencyConverter } from 'react-currency-localizer-realtime'

function ProductPrice({ price }: { price: number }) {
  const { convertedPrice, localCurrency, isLoading, error } = useCurrencyConverter({
    basePrice: price,
    baseCurrency: 'USD',
    apiKey: 'YOUR_API_KEY',
  })

  if (isLoading) return <span>Loading price...</span>
  if (error) return <span>${price}</span> // Fallback to original price

  return (
    <span>
      {new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: localCurrency || 'USD',
      }).format(convertedPrice || price)}
    </span>
  )
}
```

### 3. Batch Conversion (Product Lists)

```tsx
import { useCurrencyLocalizer } from 'react-currency-localizer-realtime'

function ProductList({ products }) {
  const { convertAndFormat, isReady } = useCurrencyLocalizer({
    baseCurrency: 'USD',
    apiKey: 'YOUR_API_KEY',
  })

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          {p.name}: {isReady ? convertAndFormat(p.price) : '...'}
        </li>
      ))}
    </ul>
  )
}
```

---

## API Reference

- [useCurrencyConverter](#usecurrencyconverteroptions) — Convert a single price
- [useCurrencyLocalizer](#usecurrencylocalizeroptions) — Batch convert multiple prices
- [LocalizedPrice](#localizedprice-) — Declarative component

---

### `useCurrencyConverter(options)`

The main hook for converting a single price to the user's local currency.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `basePrice` | `number` | Yes | The price in the base currency |
| `baseCurrency` | `string` | Yes | ISO 4217 currency code (case-insensitive, e.g., `'USD'` or `'usd'`) |
| `apiKey` | `string` | Yes | Your AllRatesToday API key (validated for helpful error messages) |
| `manualCurrency` | `string` | No | Override detected currency (case-insensitive) |
| `geoEndpoint` | `string` | No | Custom geolocation endpoint URL (defaults to ipapi.co) |
| `onSuccess` | `function` | No | Callback on successful conversion |
| `onError` | `function` | No | Callback on error |

**Returns**

| Property | Type | Description |
|----------|------|-------------|
| `convertedPrice` | `number \| null` | Price in local currency |
| `localCurrency` | `string \| null` | Detected/manual currency code |
| `baseCurrency` | `string` | Original currency code |
| `exchangeRate` | `number \| null` | Exchange rate used |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error object if any |

---

### `useCurrencyLocalizer(options)`

Batch-friendly hook for converting multiple prices efficiently. Ideal for e-commerce product listings where you need to convert many prices with one exchange rate lookup.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseCurrency` | `string` | Yes | ISO 4217 currency code |
| `apiKey` | `string` | Yes | Your AllRatesToday API key |
| `manualCurrency` | `string` | No | Override detected currency |
| `geoEndpoint` | `string` | No | Custom geolocation endpoint URL |
| `onReady` | `function` | No | Callback when converter is ready |
| `onError` | `function` | No | Callback on error |

**Returns**

| Property | Type | Description |
|----------|------|-------------|
| `convert` | `(price: number) => number \| null` | Convert a price |
| `format` | `(price: number) => string` | Format a price with currency symbol |
| `convertAndFormat` | `(price: number) => string` | Convert and format in one call |
| `localCurrency` | `string \| null` | Detected currency code |
| `baseCurrency` | `string` | Original currency code |
| `exchangeRate` | `number \| null` | Exchange rate used |
| `isLoading` | `boolean` | Loading state |
| `isReady` | `boolean` | True when ready to convert |
| `error` | `Error \| null` | Error object if any |

**Example**

```tsx
import { useCurrencyLocalizer } from 'react-currency-localizer-realtime'

function ProductList({ products }) {
  const { convertAndFormat, isReady } = useCurrencyLocalizer({
    baseCurrency: 'USD',
    apiKey: process.env.REACT_APP_ALLRATESTODAY_KEY,
  })

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          {p.name}: {isReady ? convertAndFormat(p.price) : '...'}
        </li>
      ))}
    </ul>
  )
}
```

---

### `<LocalizedPrice />`

React component for displaying localized prices. Automatically handles loading, error fallbacks, and formatting.

**Props**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `basePrice` | `number` | Yes | The price in base currency |
| `baseCurrency` | `string` | Yes | ISO 4217 currency code (case-insensitive) |
| `apiKey` | `string` | Yes | Your AllRatesToday API key (validated automatically) |
| `manualCurrency` | `string` | No | Override detected currency (case-insensitive) |
| `geoEndpoint` | `string` | No | Custom geolocation endpoint URL |
| `loadingComponent` | `ReactNode` | No | Custom loading component |
| `errorComponent` | `function` | No | Custom error component (if not provided, shows original price as fallback) |
| `formatPrice` | `function` | No | Custom price formatter |

---

## Usage Examples

### E-Commerce Product Grid

```tsx
import { LocalizedPrice } from 'react-currency-localizer-realtime'

function ProductGrid() {
  const products = [
    { id: 1, name: 'T-Shirt', price: 29.99 },
    { id: 2, name: 'Jeans', price: 79.99 },
    { id: 3, name: 'Sneakers', price: 129.99 },
  ]

  return (
    <div className="grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <LocalizedPrice
            basePrice={product.price}
            baseCurrency="USD"
            // Vite: import.meta.env.VITE_ALLRATESTODAY_KEY
            // CRA: process.env.REACT_APP_ALLRATESTODAY_KEY
            // Next.js: process.env.NEXT_PUBLIC_ALLRATESTODAY_KEY
            apiKey={import.meta.env.VITE_ALLRATESTODAY_KEY}
          />
        </div>
      ))}
    </div>
  )
}
```

### Subscription Pricing Table

```tsx
function PricingTable() {
  const plans = [
    { name: 'Basic', price: 9.99 },
    { name: 'Pro', price: 19.99 },
    { name: 'Enterprise', price: 49.99 },
  ]

  return (
    <div className="pricing-table">
      {plans.map(plan => (
        <div key={plan.name} className="plan">
          <h3>{plan.name}</h3>
          <LocalizedPrice
            basePrice={plan.price}
            baseCurrency="USD"
            apiKey={import.meta.env.VITE_ALLRATESTODAY_KEY}
            formatPrice={(price, currency) =>
              `${currency} ${price.toFixed(2)}/month`
            }
          />
        </div>
      ))}
    </div>
  )
}
```

### Manual Currency Selector

```tsx
import { useState } from 'react'
import { LocalizedPrice } from 'react-currency-localizer-realtime'

function CurrencySelector() {
  const [selectedCurrency, setSelectedCurrency] = useState('')

  return (
    <div>
      <select
        value={selectedCurrency}
        onChange={e => setSelectedCurrency(e.target.value)}
      >
        <option value="">Auto-detect</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="JPY">JPY</option>
      </select>

      <LocalizedPrice
        basePrice={99.99}
        baseCurrency="USD"
        apiKey={import.meta.env.VITE_ALLRATESTODAY_KEY}
        manualCurrency={selectedCurrency || undefined}
      />
    </div>
  )
}
```

### Error Handling and Loading States

```tsx
function PriceWithStates() {
  const { convertedPrice, localCurrency, isLoading, error } = useCurrencyConverter({
    basePrice: 59.99,
    baseCurrency: 'usd', // Case-insensitive! Will be converted to 'USD'
    apiKey: import.meta.env.VITE_ALLRATESTODAY_KEY,
    onSuccess: (result) => {
      console.log('Conversion successful:', result)
    },
    onError: (error) => {
      console.error('Conversion failed:', error.message)
    },
  })

  if (isLoading) {
    return (
      <div className="price-loading">
        <div className="spinner" />
        <span>Converting price...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="price-error">
        <span>$59.99 USD</span>
        <small>Unable to convert: {error.message}</small>
      </div>
    )
  }

  return (
    <div className="price-success">
      {new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: localCurrency || 'USD',
      }).format(convertedPrice || 59.99)}
    </div>
  )
}
```

### Graceful Fallback Behavior

```tsx
// LocalizedPrice automatically shows original price if conversion fails
function AutoFallbackPrice() {
  return (
    <LocalizedPrice
      basePrice={99.99}
      baseCurrency="USD"
      apiKey="YOUR_API_KEY"
    />
    // If API fails → Shows "$99.99" as fallback
  )
}

// Custom error component for full control
function CustomErrorPrice() {
  return (
    <LocalizedPrice
      basePrice={99.99}
      baseCurrency="USD"
      apiKey="YOUR_API_KEY"
      errorComponent={(error, basePrice, baseCurrency) => (
        <div className="price-error">
          <span className="price">${basePrice}</span>
          <span className="error-badge">Conversion unavailable</span>
        </div>
      )}
    />
  )
}
```

---

## Architecture Overview

### Two-API Strategy

This package uses a carefully designed decoupled architecture for maximum reliability:

| Service | Purpose | Key Required? | Why This Service? |
|---------|---------|--------------|-------------------|
| [ipapi.co](https://ipapi.co) | IP geolocation (currency detection) | No | HTTPS-compatible, no API key, robust rate limiting |
| [AllRatesToday](https://allratestoday.com) | Real-time exchange rates | Yes (free tier) | Mid-market rates from Reuters/Refinitiv, 60s updates |

**Philosophy:** Use specialized services for what they do best — ipapi.co for location identification, AllRatesToday for financial data.

### Intelligent Caching Strategy

| Data Type | Cache Location | Duration | Rationale |
|-----------|---------------|----------|-----------|
| Geolocation | `localStorage` | 24 hours | User location rarely changes |
| Exchange Rates | In-memory | 1 hour | Balances freshness vs performance |
| Same-currency | Instant return | N/A | No API call needed (rate = 1) |

### Why AllRatesToday Over Other Rate APIs?

| Feature | AllRatesToday | exchangerate-api.com | Open Exchange Rates |
|---------|--------------|---------------------|-------------------|
| Rate type | Mid-market (no spread) | Retail (includes spread) | Retail |
| Update frequency | Every 60 seconds | Daily | Hourly |
| Data source | Reuters/Refinitiv (named) | Undisclosed | "Multiple sources" |
| Free tier | 300 req/month | 1,500 req/month | 1,000 req/month |
| Base currency | Any (free tier) | USD only (free tier) | USD only (free tier) |

---

## Performance

| Metric | Value |
|--------|-------|
| Bundle size | ~10KB minified, ~4KB gzipped |
| First load | 2 API calls (geolocation + exchange rate) |
| Subsequent loads | 0-1 API calls (geolocation cached in localStorage) |
| Batch conversion | 1000+ prices in <1ms after initial load |
| Memoized formatters | `Intl.NumberFormat` instances cached per currency |
| Rate limits | Handled gracefully with automatic fallbacks |

---

## Environment Variables

```bash
# Vite
VITE_ALLRATESTODAY_KEY=your_api_key_here

# Create React App
REACT_APP_ALLRATESTODAY_KEY=your_api_key_here

# Next.js
NEXT_PUBLIC_ALLRATESTODAY_KEY=your_api_key_here
```

---

## Server-Side Rendering (SSR) Caveats

When using this library with SSR frameworks (Next.js, Remix, SvelteKit), be aware that:

- **IP geolocation runs on the server**: The detected location reflects the server's IP, not the user's
- **Hydration mismatches possible**: Server-rendered currency may differ from client-side detection
- **Recommended approach**: Use `manualCurrency` on server, auto-detect on client

```tsx
const [isClient, setIsClient] = useState(false)
useEffect(() => setIsClient(true), [])

<LocalizedPrice
  basePrice={99.99}
  baseCurrency="USD"
  apiKey={process.env.NEXT_PUBLIC_ALLRATESTODAY_KEY}
  manualCurrency={!isClient ? 'USD' : undefined} // USD on server, auto-detect on client
/>
```

---

## Supported Currencies

The package supports **160+ currencies** via AllRatesToday, covering 99% of all UN-recognized states and territories.

**Major Global Currencies:** USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY

**Popular Regional Currencies:** INR, BRL, RUB, KRW, SGD, HKD, NOK, SEK, MXN, ZAR, TRY, AED, SAR, EGP, PKR, BDT, THB, PHP, and many more

### Volatile Currencies (Special Caution)

The following currencies experience heightened volatility with substantial differences between official and actual rates:

| Code | Currency | Notes |
|------|----------|-------|
| ARS | Argentine Peso | Multiple exchange rates in market |
| VES | Venezuelan Bolivar | Hyperinflation environment |
| ZWL | Zimbabwean Dollar | Historical hyperinflation legacy |
| SYP | Syrian Pound | Ongoing conflict impacts rates |
| SSP | South Sudanese Pound | High volatility |
| YER | Yemeni Rial | Regional instability |
| LYD | Libyan Dinar | Political instability |

> **Note:** For volatile currencies, rates default to central bank published rates, which may differ significantly from actual market rates.

---

## Troubleshooting

### "API key is missing" Error

```tsx
// Provide your API key (get one free at allratestoday.com/register)
useCurrencyConverter({
  basePrice: 99.99,
  baseCurrency: 'USD',
  apiKey: import.meta.env.VITE_ALLRATESTODAY_KEY, // Not empty string
})
```

### Currency Case Sensitivity

```tsx
// All of these work the same way (case-insensitive)
useCurrencyConverter({ baseCurrency: 'USD', manualCurrency: 'EUR', ... })
useCurrencyConverter({ baseCurrency: 'usd', manualCurrency: 'eur', ... })
useCurrencyConverter({ baseCurrency: 'Usd', manualCurrency: 'Eur', ... })
```

### Rate Limiting

```tsx
// The package automatically handles rate limits with graceful fallbacks
// If the API returns 429, the component shows the original price
useCurrencyConverter({
  basePrice: 99.99,
  baseCurrency: 'USD',
  apiKey: 'your-key',
  onError: (error) => {
    if (error.message.includes('429')) {
      console.log('Rate limited, showing original price')
    }
  },
})
```

### Geolocation Blocked

```tsx
// If geolocation is blocked (VPN, corporate firewall), use manual override
<LocalizedPrice
  basePrice={99.99}
  baseCurrency="USD"
  apiKey="your-key"
  manualCurrency="EUR" // Bypass geolocation entirely
/>
```

---

## Testing

```bash
npm test               # Run unit tests (mocked APIs, no network needed)
npm run test:coverage  # Run with coverage report
npm run test:watch     # Watch mode for development
```

25 tests covering hooks, components, caching, error handling, and edge cases.

---

## Pricing

| Plan   | Requests/Month | Price      |
| ------ | -------------- | ---------- |
| Free   | 300            | Free       |
| Small  | 5,000          | €4.99/mo   |
| Medium | 10,000         | €9.99/mo   |
| Large  | 100,000        | €49.99/mo  |

With intelligent caching, a site with 10,000 daily visitors uses only ~24 API calls/day (1-hour cache) — well within the free tier.

---

## Key Design Decisions

- **Zero Runtime Dependencies** — No TanStack Query, no axios, no bloat. Just React hooks and the Fetch API
- **Two-API Architecture** — Specialized services for maximum accuracy (geolocation vs exchange rates)
- **Hook-Based API** — Modern React patterns with full TypeScript support
- **LocalizedPrice Component** — Declarative wrapper for the common case
- **Intelligent Caching** — Optimized per data type (24h geo, 1h rates)
- **Graceful Degradation** — Always shows a price, even if conversion fails
- **Mid-Market Rates** — Reuters/Refinitiv data with no hidden spreads
- **Free APIs Only** — Zero cost barrier to entry

---

## Links

- [API Documentation](https://allratestoday.com/developers)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [GitHub](https://github.com/allratestoday/exchange-rates-api)
- [Core SDK (Node.js)](https://www.npmjs.com/package/@allratestoday/sdk)

## License

MIT
