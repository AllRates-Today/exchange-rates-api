/** React hooks for currency conversion. */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { detectCurrency, fetchRate } from './api';
import type {
  CurrencyConverterOptions,
  CurrencyConverterResult,
  CurrencyLocalizerOptions,
  CurrencyLocalizerResult,
} from './types';

/**
 * React hook for converting a single price to the user's local currency.
 *
 * @example
 * ```tsx
 * const { convertedPrice, localCurrency, isLoading } = useCurrencyConverter({
 *   basePrice: 99.99,
 *   baseCurrency: 'USD',
 *   apiKey: 'your-api-key',
 * });
 * ```
 */
export function useCurrencyConverter(
  options: CurrencyConverterOptions,
): CurrencyConverterResult {
  const {
    basePrice,
    baseCurrency: rawBase,
    apiKey,
    manualCurrency,
    geoEndpoint,
    onSuccess,
    onError,
  } = options;

  const baseCurrency = rawBase.toUpperCase();

  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [localCurrency, setLocalCurrency] = useState<string | null>(
    manualCurrency?.toUpperCase() ?? null,
  );
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refs for callbacks to avoid re-triggering effect
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Determine target currency
        let targetCurrency = manualCurrency?.toUpperCase();
        if (!targetCurrency) {
          targetCurrency = await detectCurrency(geoEndpoint);
        }

        if (cancelled) return;
        setLocalCurrency(targetCurrency);

        // Step 2: Fetch exchange rate
        const rate = await fetchRate(apiKey, baseCurrency, targetCurrency);
        if (cancelled) return;

        const converted = Number((basePrice * rate).toFixed(2));
        setExchangeRate(rate);
        setConvertedPrice(converted);

        onSuccessRef.current?.({
          convertedPrice: converted,
          localCurrency: targetCurrency,
          exchangeRate: rate,
        });
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onErrorRef.current?.(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [basePrice, baseCurrency, apiKey, manualCurrency, geoEndpoint]);

  return {
    convertedPrice,
    localCurrency,
    baseCurrency,
    exchangeRate,
    isLoading,
    error,
  };
}

/**
 * React hook for batch currency conversion. Converts multiple prices efficiently.
 *
 * @example
 * ```tsx
 * const { convertAndFormat, isReady } = useCurrencyLocalizer({
 *   baseCurrency: 'USD',
 *   apiKey: 'your-api-key',
 * });
 *
 * // Convert many prices with one hook
 * products.map(p => convertAndFormat(p.price)); // ["€92.34", "€78.91", ...]
 * ```
 */
export function useCurrencyLocalizer(
  options: CurrencyLocalizerOptions,
): CurrencyLocalizerResult {
  const {
    baseCurrency: rawBase,
    apiKey,
    manualCurrency,
    geoEndpoint,
    onReady,
    onError,
  } = options;

  const baseCurrency = rawBase.toUpperCase();

  const [localCurrency, setLocalCurrency] = useState<string | null>(
    manualCurrency?.toUpperCase() ?? null,
  );
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        let targetCurrency = manualCurrency?.toUpperCase();
        if (!targetCurrency) {
          targetCurrency = await detectCurrency(geoEndpoint);
        }

        if (cancelled) return;
        setLocalCurrency(targetCurrency);

        const rate = await fetchRate(apiKey, baseCurrency, targetCurrency);
        if (cancelled) return;

        setExchangeRate(rate);
        onReadyRef.current?.();
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onErrorRef.current?.(error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [baseCurrency, apiKey, manualCurrency, geoEndpoint]);

  const isReady = exchangeRate !== null && !isLoading;

  const convert = useCallback(
    (price: number): number | null => {
      if (exchangeRate === null) return null;
      return Number((price * exchangeRate).toFixed(2));
    },
    [exchangeRate],
  );

  const formatter = useMemo(() => {
    if (!localCurrency) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: localCurrency,
      });
    } catch {
      return null;
    }
  }, [localCurrency]);

  const format = useCallback(
    (price: number): string => {
      if (formatter) return formatter.format(price);
      return `${localCurrency ?? baseCurrency} ${price.toFixed(2)}`;
    },
    [formatter, localCurrency, baseCurrency],
  );

  const convertAndFormat = useCallback(
    (price: number): string => {
      const converted = convert(price);
      if (converted === null) return format(price);
      return format(converted);
    },
    [convert, format],
  );

  return {
    convert,
    format,
    convertAndFormat,
    localCurrency,
    baseCurrency,
    exchangeRate,
    isLoading,
    isReady,
    error,
  };
}
