import React$1 from 'react';

/** Options for the useCurrencyConverter hook. */
interface CurrencyConverterOptions {
    /** The price in the base currency. */
    basePrice: number;
    /** ISO 4217 currency code (case-insensitive, e.g., 'USD' or 'usd'). */
    baseCurrency: string;
    /** Your AllRatesToday API key. Get one free at allratestoday.com/register */
    apiKey: string;
    /** Override detected currency with a specific currency code. */
    manualCurrency?: string;
    /** Custom geolocation endpoint URL. Defaults to ipapi.co */
    geoEndpoint?: string;
    /** Callback on successful conversion. */
    onSuccess?: (result: ConversionResult) => void;
    /** Callback on error. */
    onError?: (error: Error) => void;
}
/** Result returned by the useCurrencyConverter hook. */
interface CurrencyConverterResult {
    /** Price converted to the local currency. */
    convertedPrice: number | null;
    /** Detected or manually set local currency code. */
    localCurrency: string | null;
    /** Original base currency code. */
    baseCurrency: string;
    /** Exchange rate used for conversion. */
    exchangeRate: number | null;
    /** Whether the hook is loading data. */
    isLoading: boolean;
    /** Error object if conversion failed. */
    error: Error | null;
}
/** Options for the useCurrencyLocalizer hook (batch converter). */
interface CurrencyLocalizerOptions {
    /** ISO 4217 base currency code. */
    baseCurrency: string;
    /** Your AllRatesToday API key. */
    apiKey: string;
    /** Override detected currency. */
    manualCurrency?: string;
    /** Custom geolocation endpoint URL. */
    geoEndpoint?: string;
    /** Callback when the converter is ready. */
    onReady?: () => void;
    /** Callback on error. */
    onError?: (error: Error) => void;
}
/** Result returned by the useCurrencyLocalizer hook. */
interface CurrencyLocalizerResult {
    /** Convert a single price. */
    convert: (price: number) => number | null;
    /** Format a price with currency symbol. */
    format: (price: number) => string;
    /** Convert and format in one call. */
    convertAndFormat: (price: number) => string;
    /** Detected or manual local currency code. */
    localCurrency: string | null;
    /** Original base currency code. */
    baseCurrency: string;
    /** Exchange rate used. */
    exchangeRate: number | null;
    /** Whether data is loading. */
    isLoading: boolean;
    /** Whether the converter is ready to use. */
    isReady: boolean;
    /** Error object if any. */
    error: Error | null;
}
/** Props for the LocalizedPrice component. */
interface LocalizedPriceProps {
    /** The price in base currency. */
    basePrice: number;
    /** ISO 4217 currency code. */
    baseCurrency: string;
    /** Your AllRatesToday API key. */
    apiKey: string;
    /** Override detected currency. */
    manualCurrency?: string;
    /** Custom geolocation endpoint URL. */
    geoEndpoint?: string;
    /** Custom loading component. */
    loadingComponent?: React.ReactNode;
    /** Custom error component. Receives the error and original price. */
    errorComponent?: (error: Error, basePrice: number, baseCurrency: string) => React.ReactNode;
    /** Custom price formatter. */
    formatPrice?: (price: number, currency: string) => string;
}
/** Internal conversion result. */
interface ConversionResult {
    convertedPrice: number;
    localCurrency: string;
    exchangeRate: number;
}

/** React hooks for currency conversion. */

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
declare function useCurrencyConverter(options: CurrencyConverterOptions): CurrencyConverterResult;
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
declare function useCurrencyLocalizer(options: CurrencyLocalizerOptions): CurrencyLocalizerResult;

/** React components for currency localization. */

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
declare function LocalizedPrice({ basePrice, baseCurrency, apiKey, manualCurrency, geoEndpoint, loadingComponent, errorComponent, formatPrice, }: LocalizedPriceProps): React$1.ReactElement;

export { type ConversionResult, type CurrencyConverterOptions, type CurrencyConverterResult, type CurrencyLocalizerOptions, type CurrencyLocalizerResult, LocalizedPrice, type LocalizedPriceProps, useCurrencyConverter, useCurrencyLocalizer };
