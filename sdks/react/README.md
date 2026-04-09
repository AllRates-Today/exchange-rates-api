# @allratestoday/react

[![npm version](https://img.shields.io/npm/v/@allratestoday/react.svg)](https://www.npmjs.com/package/@allratestoday/react)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/@allratestoday/react.svg)](https://github.com/allratestoday/exchange-rates-api/blob/main/LICENSE)
[![zero dependencies](https://img.shields.io/badge/runtime_deps-0-brightgreen.svg)](https://www.npmjs.com/package/@allratestoday/react)

**React hooks and components for automatically displaying prices in a user's local currency using IP geolocation**

Built with real-time mid-market exchange rates from AllRatesToday (Reuters/Refinitiv data, 160+ currencies). Perfect for e-commerce sites, pricing pages, and international applications.

## Features

- **Automatic Currency Detection**: Uses IP geolocation to detect user's local currency
- **Real-Time Mid-Market Rates**: Updated every 60 seconds from Reuters/Refinitiv — no hidden spreads
- **160+ Currencies**: Major, minor, and exotic pairs
- **Intelligent Caching**: 24-hour localStorage for geolocation, 1-hour memory cache for rates
- **Multiple Usage Patterns**: Hook-based API, batch converter, and declarative component
- **Manual Override**: Bypass geolocation with explicit currency selection
- **TypeScript**: Fully typed with comprehensive type definitions
- **Zero Runtime Dependencies**: Only peer dependency is React itself
- **Graceful Fallbacks**: Shows original price if conversion fails
- **Case-Insensitive**: Currency codes work in any case (`'usd'`, `'USD'`, `'Usd'`)

## Installation

```bash
npm install @allratestoday/react
```

```bash
yarn add @allratestoday/react
```

```bash
pnpm add @allratestoday/react
```

> **Note:** React 17+ is a peer dependency.

## Get Your API Key

Get your free API key from [allratestoday.com/register](https://allratestoday.com/register) — no credit card required. 300 requests/month free.

## Quick Start

### 1. Use the Hook

```tsx
import { useCurrencyConverter } from '@allratestoday/react'

function ProductPrice({ price }: { price: number }) {
  const { convertedPrice, localCurrency, isLoading, error } = useCurrencyConverter({
    basePrice: price,
    baseCurrency: 'USD',
    apiKey: 'YOUR_API_KEY',
  })

  if (isLoading) return <span>Loading price...</span>
  if (error) return <span>${price}</span>

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

### 2. Or Use the Component

```tsx
import { LocalizedPrice } from '@allratestoday/react'

function ProductCard() {
  return (
    <div>
      <h3>Premium Plan</h3>
      <LocalizedPrice
        basePrice={99.99}
        baseCurrency="USD"
        apiKey="YOUR_API_KEY"
      />
    </div>
  )
}
```

---

## API Reference

### `useCurrencyConverter(options)`

The main hook for converting a single price to the user's local currency.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `basePrice` | `number` | Yes | The price in the base currency |
| `baseCurrency` | `string` | Yes | ISO 4217 currency code (case-insensitive) |
| `apiKey` | `string` | Yes | Your AllRatesToday API key |
| `manualCurrency` | `string` | No | Override detected currency |
| `geoEndpoint` | `string` | No | Custom geolocation endpoint URL |
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

Batch-friendly hook for converting multiple prices efficiently. Ideal for e-commerce with many products.

```tsx
import { useCurrencyLocalizer } from '@allratestoday/react'

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
| `format` | `(price: number) => string` | Format with currency symbol |
| `convertAndFormat` | `(price: number) => string` | Convert and format in one call |
| `localCurrency` | `string \| null` | Detected currency code |
| `baseCurrency` | `string` | Original currency code |
| `exchangeRate` | `number \| null` | Exchange rate used |
| `isLoading` | `boolean` | Loading state |
| `isReady` | `boolean` | True when ready to convert |
| `error` | `Error \| null` | Error object if any |

---

### `<LocalizedPrice />`

React component for displaying localized prices.

```tsx
<LocalizedPrice
  basePrice={99.99}
  baseCurrency="USD"
  apiKey="YOUR_API_KEY"
/>
```

**Props**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `basePrice` | `number` | Yes | The price in base currency |
| `baseCurrency` | `string` | Yes | ISO 4217 currency code |
| `apiKey` | `string` | Yes | Your AllRatesToday API key |
| `manualCurrency` | `string` | No | Override detected currency |
| `geoEndpoint` | `string` | No | Custom geolocation endpoint |
| `loadingComponent` | `ReactNode` | No | Custom loading component |
| `errorComponent` | `function` | No | Custom error component |
| `formatPrice` | `function` | No | Custom price formatter |

---

## Usage Examples

### E-Commerce Product Grid

```tsx
import { LocalizedPrice } from '@allratestoday/react'

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
            formatPrice={(price, currency) => `${currency} ${price.toFixed(2)}/month`}
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
import { LocalizedPrice } from '@allratestoday/react'

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

### Batch Conversion for Product Lists

```tsx
import { useCurrencyLocalizer } from '@allratestoday/react'

function ProductList({ products }) {
  const { convertAndFormat, isReady, isLoading } = useCurrencyLocalizer({
    baseCurrency: 'USD',
    apiKey: import.meta.env.VITE_ALLRATESTODAY_KEY,
  })

  if (isLoading) return <p>Loading prices...</p>

  return (
    <table>
      <tbody>
        {products.map(p => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{isReady ? convertAndFormat(p.price) : `$${p.price}`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Error Handling

```tsx
function PriceWithStates() {
  const { convertedPrice, localCurrency, isLoading, error } = useCurrencyConverter({
    basePrice: 59.99,
    baseCurrency: 'USD',
    apiKey: import.meta.env.VITE_ALLRATESTODAY_KEY,
    onSuccess: (result) => console.log('Converted:', result),
    onError: (error) => console.error('Failed:', error.message),
  })

  if (isLoading) return <div className="spinner">Converting...</div>

  if (error) {
    return (
      <div>
        <span>$59.99 USD</span>
        <small>Unable to convert: {error.message}</small>
      </div>
    )
  }

  return (
    <span>
      {new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: localCurrency || 'USD',
      }).format(convertedPrice || 59.99)}
    </span>
  )
}
```

---

## Architecture

### Two-API Strategy

| Service | Purpose | Key Required? | Cache Duration |
|---------|---------|--------------|----------------|
| [ipapi.co](https://ipapi.co) | IP geolocation (currency detection) | No | 24 hours (localStorage) |
| [AllRatesToday](https://allratestoday.com) | Real-time exchange rates | Yes (free tier) | 1 hour (memory) |

### Caching Strategy

- **Geolocation**: Cached in `localStorage` for 24 hours. User location rarely changes, so subsequent page loads make zero geolocation API calls.
- **Exchange Rates**: Cached in memory for 1 hour. Balances data freshness with API call efficiency.
- **Same-currency**: If base and target currency match, returns instantly with rate `1` (no API call).

### Why AllRatesToday?

| Feature | AllRatesToday | exchangerate-api.com |
|---------|---------------|---------------------|
| Rate type | Mid-market (no spread) | Retail (includes spread) |
| Update frequency | Every 60 seconds | Daily |
| Data source | Reuters/Refinitiv | Undisclosed |
| Free tier | 300 req/month | 1,500 req/month |
| Base currency | Any (free tier) | USD only (free tier) |

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

## SSR Considerations

When using with SSR frameworks (Next.js, Remix), geolocation runs on the server and reflects the server's IP. Use `manualCurrency` for server rendering:

```tsx
const [isClient, setIsClient] = useState(false)
useEffect(() => setIsClient(true), [])

<LocalizedPrice
  basePrice={99.99}
  baseCurrency="USD"
  apiKey={process.env.NEXT_PUBLIC_ALLRATESTODAY_KEY}
  manualCurrency={!isClient ? 'USD' : undefined}
/>
```

---

## Testing

```bash
npm test               # Run tests
npm run test:coverage  # Run with coverage
npm run test:watch     # Watch mode
```

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

## Links

- [API Documentation](https://allratestoday.com/developers)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [GitHub](https://github.com/allratestoday/exchange-rates-api)
- [Core SDK (Node.js)](https://www.npmjs.com/package/@allratestoday/sdk)

## License

MIT
