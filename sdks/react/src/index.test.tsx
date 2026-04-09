import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useCurrencyConverter, useCurrencyLocalizer } from './hooks';
import { LocalizedPrice } from './components';
import * as api from './api';
import * as cache from './cache';

// Mock the API module
vi.mock('./api', () => ({
  detectCurrency: vi.fn(),
  fetchRate: vi.fn(),
}));

const mockedDetectCurrency = vi.mocked(api.detectCurrency);
const mockedFetchRate = vi.mocked(api.fetchRate);

beforeEach(() => {
  vi.clearAllMocks();
  mockedDetectCurrency.mockResolvedValue('EUR');
  mockedFetchRate.mockResolvedValue(0.9234);
});

// ---------------------------------------------------------------------------
// useCurrencyConverter
// ---------------------------------------------------------------------------

describe('useCurrencyConverter', () => {
  it('converts price using detected currency', async () => {
    const { result } = renderHook(() =>
      useCurrencyConverter({
        basePrice: 100,
        baseCurrency: 'USD',
        apiKey: 'test-key',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.convertedPrice).toBe(92.34);
    expect(result.current.localCurrency).toBe('EUR');
    expect(result.current.exchangeRate).toBe(0.9234);
    expect(result.current.baseCurrency).toBe('USD');
    expect(result.current.error).toBeNull();
  });

  it('uses manual currency when provided', async () => {
    const { result } = renderHook(() =>
      useCurrencyConverter({
        basePrice: 100,
        baseCurrency: 'USD',
        apiKey: 'test-key',
        manualCurrency: 'GBP',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedDetectCurrency).not.toHaveBeenCalled();
    expect(mockedFetchRate).toHaveBeenCalledWith('test-key', 'USD', 'GBP');
    expect(result.current.localCurrency).toBe('GBP');
  });

  it('normalizes currency codes to uppercase', async () => {
    const { result } = renderHook(() =>
      useCurrencyConverter({
        basePrice: 50,
        baseCurrency: 'usd',
        apiKey: 'test-key',
        manualCurrency: 'eur',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.baseCurrency).toBe('USD');
    expect(result.current.localCurrency).toBe('EUR');
  });

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyConverter({
        basePrice: 100,
        baseCurrency: 'USD',
        apiKey: 'test-key',
        onSuccess,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(onSuccess).toHaveBeenCalledWith({
      convertedPrice: 92.34,
      localCurrency: 'EUR',
      exchangeRate: 0.9234,
    });
  });

  it('handles errors and calls onError', async () => {
    mockedFetchRate.mockRejectedValue(new Error('API failed'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useCurrencyConverter({
        basePrice: 100,
        baseCurrency: 'USD',
        apiKey: 'test-key',
        onError,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('API failed');
    expect(result.current.convertedPrice).toBeNull();
    expect(onError).toHaveBeenCalled();
  });

  it('handles geolocation errors', async () => {
    mockedDetectCurrency.mockRejectedValue(new Error('Geo failed'));

    const { result } = renderHook(() =>
      useCurrencyConverter({
        basePrice: 100,
        baseCurrency: 'USD',
        apiKey: 'test-key',
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error?.message).toBe('Geo failed');
  });

  it('passes geoEndpoint to detectCurrency', async () => {
    renderHook(() =>
      useCurrencyConverter({
        basePrice: 100,
        baseCurrency: 'USD',
        apiKey: 'test-key',
        geoEndpoint: 'https://custom-geo.com/json',
      }),
    );

    await waitFor(() =>
      expect(mockedDetectCurrency).toHaveBeenCalledWith('https://custom-geo.com/json'),
    );
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() =>
      useCurrencyConverter({
        basePrice: 100,
        baseCurrency: 'USD',
        apiKey: 'test-key',
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.convertedPrice).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// useCurrencyLocalizer
// ---------------------------------------------------------------------------

describe('useCurrencyLocalizer', () => {
  it('provides convert and format functions', async () => {
    const { result } = renderHook(() =>
      useCurrencyLocalizer({
        baseCurrency: 'USD',
        apiKey: 'test-key',
      }),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.convert(100)).toBe(92.34);
    expect(result.current.convert(200)).toBe(184.68);
    expect(result.current.localCurrency).toBe('EUR');
    expect(result.current.exchangeRate).toBe(0.9234);
  });

  it('returns null from convert when not ready', () => {
    const { result } = renderHook(() =>
      useCurrencyLocalizer({
        baseCurrency: 'USD',
        apiKey: 'test-key',
      }),
    );

    // Before loading completes
    expect(result.current.convert(100)).toBeNull();
    expect(result.current.isReady).toBe(false);
  });

  it('format returns formatted price string', async () => {
    const { result } = renderHook(() =>
      useCurrencyLocalizer({
        baseCurrency: 'USD',
        apiKey: 'test-key',
      }),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    const formatted = result.current.format(92.34);
    // Intl.NumberFormat output varies by locale, just check it's a string
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('convertAndFormat combines both steps', async () => {
    const { result } = renderHook(() =>
      useCurrencyLocalizer({
        baseCurrency: 'USD',
        apiKey: 'test-key',
      }),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    const formatted = result.current.convertAndFormat(100);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });

  it('calls onReady callback', async () => {
    const onReady = vi.fn();
    const { result } = renderHook(() =>
      useCurrencyLocalizer({
        baseCurrency: 'USD',
        apiKey: 'test-key',
        onReady,
      }),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(onReady).toHaveBeenCalled();
  });

  it('calls onError on failure', async () => {
    mockedFetchRate.mockRejectedValue(new Error('Rate failed'));
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useCurrencyLocalizer({
        baseCurrency: 'USD',
        apiKey: 'test-key',
        onError,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(onError).toHaveBeenCalled();
    expect(result.current.error?.message).toBe('Rate failed');
    expect(result.current.isReady).toBe(false);
  });

  it('uses manual currency', async () => {
    const { result } = renderHook(() =>
      useCurrencyLocalizer({
        baseCurrency: 'USD',
        apiKey: 'test-key',
        manualCurrency: 'JPY',
      }),
    );

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(mockedDetectCurrency).not.toHaveBeenCalled();
    expect(result.current.localCurrency).toBe('JPY');
  });
});

// ---------------------------------------------------------------------------
// LocalizedPrice component
// ---------------------------------------------------------------------------

describe('LocalizedPrice', () => {
  it('renders converted price', async () => {
    render(
      <LocalizedPrice
        basePrice={100}
        baseCurrency="USD"
        apiKey="test-key"
      />,
    );

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeDefined();

    // After loading, shows converted price
    await waitFor(() => {
      const el = screen.getByText((text) => text.includes('92'));
      expect(el).toBeDefined();
    });
  });

  it('renders custom loading component', () => {
    render(
      <LocalizedPrice
        basePrice={100}
        baseCurrency="USD"
        apiKey="test-key"
        loadingComponent={<span>Converting...</span>}
      />,
    );

    expect(screen.getByText('Converting...')).toBeDefined();
  });

  it('renders fallback on error', async () => {
    mockedFetchRate.mockRejectedValue(new Error('API down'));

    render(
      <LocalizedPrice
        basePrice={99.99}
        baseCurrency="USD"
        apiKey="test-key"
      />,
    );

    // Should fall back to showing original price
    await waitFor(() => {
      const el = screen.getByText((text) => text.includes('99.99'));
      expect(el).toBeDefined();
    });
  });

  it('renders custom error component', async () => {
    mockedFetchRate.mockRejectedValue(new Error('API down'));

    render(
      <LocalizedPrice
        basePrice={99.99}
        baseCurrency="USD"
        apiKey="test-key"
        errorComponent={(error) => <span>Error: {error.message}</span>}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Error: API down')).toBeDefined();
    });
  });

  it('uses custom formatPrice', async () => {
    render(
      <LocalizedPrice
        basePrice={100}
        baseCurrency="USD"
        apiKey="test-key"
        formatPrice={(price, currency) => `${currency} ${price}/mo`}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('EUR 92.34/mo')).toBeDefined();
    });
  });

  it('uses manual currency', async () => {
    render(
      <LocalizedPrice
        basePrice={100}
        baseCurrency="USD"
        apiKey="test-key"
        manualCurrency="GBP"
      />,
    );

    await waitFor(() => {
      const el = screen.getByText((text) => text.includes('92'));
      expect(el).toBeDefined();
    });

    expect(mockedDetectCurrency).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Cache module
// ---------------------------------------------------------------------------

describe('cache', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
  });

  it('getCachedGeo returns null when empty', () => {
    expect(cache.getCachedGeo()).toBeNull();
  });

  it('setCachedGeo and getCachedGeo round-trip', () => {
    cache.setCachedGeo('EUR');
    expect(cache.getCachedGeo()).toBe('EUR');
  });

  it('getCachedRate returns null when empty', () => {
    expect(cache.getCachedRate('USD_EUR')).toBeNull();
  });

  it('setCachedRate and getCachedRate round-trip', () => {
    cache.setCachedRate('USD_EUR', 0.9234);
    expect(cache.getCachedRate('USD_EUR')).toBe(0.9234);
  });
});
