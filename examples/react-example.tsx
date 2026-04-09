/**
 * AllRatesToday - React Currency Localizer Example
 * npm install react-currency-localizer-realtime
 * https://allratestoday.com
 */

import React, { useState } from 'react';
import {
  LocalizedPrice,
  useCurrencyConverter,
  useCurrencyLocalizer,
} from 'react-currency-localizer-realtime';

const API_KEY = 'YOUR_API_KEY'; // Get free key from allratestoday.com/register

// Example 1: Simple component usage
function SimplePrice() {
  return (
    <div>
      <h3>Premium Plan</h3>
      <LocalizedPrice
        basePrice={19.99}
        baseCurrency="USD"
        apiKey={API_KEY}
      />
    </div>
  );
}

// Example 2: Hook-based with full control
function ProductPrice({ price }: { price: number }) {
  const { convertedPrice, localCurrency, isLoading, error } = useCurrencyConverter({
    basePrice: price,
    baseCurrency: 'USD',
    apiKey: API_KEY,
  });

  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>${price} USD</span>;

  return (
    <span>
      {new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: localCurrency || 'USD',
      }).format(convertedPrice || price)}
    </span>
  );
}

// Example 3: Batch conversion for product lists
function ProductList() {
  const products = [
    { id: 1, name: 'T-Shirt', price: 29.99 },
    { id: 2, name: 'Jeans', price: 79.99 },
    { id: 3, name: 'Sneakers', price: 129.99 },
  ];

  const { convertAndFormat, isReady } = useCurrencyLocalizer({
    baseCurrency: 'USD',
    apiKey: API_KEY,
  });

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          {p.name}: {isReady ? convertAndFormat(p.price) : '...'}
        </li>
      ))}
    </ul>
  );
}

// Example 4: Manual currency override
function CurrencySelector() {
  const [currency, setCurrency] = useState('');

  return (
    <div>
      <select value={currency} onChange={e => setCurrency(e.target.value)}>
        <option value="">Auto-detect</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
        <option value="JPY">JPY</option>
      </select>

      <LocalizedPrice
        basePrice={99.99}
        baseCurrency="USD"
        apiKey={API_KEY}
        manualCurrency={currency || undefined}
      />
    </div>
  );
}

// Example 5: Pricing table with custom format
function PricingTable() {
  const plans = [
    { name: 'Basic', price: 9.99 },
    { name: 'Pro', price: 19.99 },
    { name: 'Enterprise', price: 49.99 },
  ];

  return (
    <div>
      {plans.map(plan => (
        <div key={plan.name}>
          <h3>{plan.name}</h3>
          <LocalizedPrice
            basePrice={plan.price}
            baseCurrency="USD"
            apiKey={API_KEY}
            formatPrice={(price, currency) => `${currency} ${price.toFixed(2)}/month`}
          />
        </div>
      ))}
    </div>
  );
}

// Example 6: Custom loading and error states
function CustomStates() {
  return (
    <LocalizedPrice
      basePrice={99.99}
      baseCurrency="USD"
      apiKey={API_KEY}
      loadingComponent={<span className="skeleton">Loading price...</span>}
      errorComponent={(error, basePrice) => (
        <span>${basePrice} <small>(conversion unavailable)</small></span>
      )}
    />
  );
}

export default function App() {
  return (
    <div>
      <h1>AllRatesToday React Examples</h1>
      <SimplePrice />
      <ProductPrice price={49.99} />
      <ProductList />
      <CurrencySelector />
      <PricingTable />
      <CustomStates />
    </div>
  );
}
