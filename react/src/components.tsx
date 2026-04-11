/** React components for currency localization. */

import React from 'react';
import { useCurrencyConverter } from './hooks';
import type { LocalizedPriceProps } from './types';

/**
 * React component that displays a price converted to the user's local currency.
 *
 * @example
 * ```tsx
 * <LocalizedPrice
 *   basePrice={99.99}
 *   baseCurrency="USD"
 *   apiKey="your-api-key"
 * />
 * ```
 */
export function LocalizedPrice({
  basePrice,
  baseCurrency,
  apiKey,
  manualCurrency,
  geoEndpoint,
  loadingComponent,
  errorComponent,
  formatPrice,
}: LocalizedPriceProps): React.ReactElement {
  const { convertedPrice, localCurrency, isLoading, error } =
    useCurrencyConverter({
      basePrice,
      baseCurrency,
      apiKey,
      manualCurrency,
      geoEndpoint,
    });

  if (isLoading) {
    if (loadingComponent) return <>{loadingComponent}</>;
    return <span>Loading...</span>;
  }

  if (error || convertedPrice === null) {
    if (errorComponent && error) {
      return <>{errorComponent(error, basePrice, baseCurrency)}</>;
    }
    // Fallback: show original price
    try {
      const formatted = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: baseCurrency.toUpperCase(),
      }).format(basePrice);
      return <span>{formatted}</span>;
    } catch {
      return (
        <span>
          {baseCurrency.toUpperCase()} {basePrice.toFixed(2)}
        </span>
      );
    }
  }

  const currency = localCurrency || baseCurrency.toUpperCase();

  if (formatPrice) {
    return <span>{formatPrice(convertedPrice, currency)}</span>;
  }

  try {
    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(convertedPrice);
    return <span>{formatted}</span>;
  } catch {
    return (
      <span>
        {currency} {convertedPrice.toFixed(2)}
      </span>
    );
  }
}
