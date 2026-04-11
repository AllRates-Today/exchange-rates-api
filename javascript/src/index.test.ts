import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AllRatesToday, { AllRatesTodayError } from './index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(errorBody: unknown, status: number) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(errorBody),
  });
}

function mockFetchJsonFail(status: number, statusText: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: () => Promise.reject(new Error('invalid json')),
  });
}

const API_KEY = 'test_api_key_123';

let client: AllRatesToday;

beforeEach(() => {
  client = new AllRatesToday({ apiKey: API_KEY });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('AllRatesToday constructor', () => {
  it('creates a client with default options', () => {
    const c = new AllRatesToday();
    expect(c).toBeInstanceOf(AllRatesToday);
  });

  it('creates a client with custom options', () => {
    const c = new AllRatesToday({
      apiKey: 'key',
      baseUrl: 'https://custom.api.com',
      timeout: 5000,
    });
    expect(c).toBeInstanceOf(AllRatesToday);
  });
});

// ---------------------------------------------------------------------------
// AllRatesTodayError
// ---------------------------------------------------------------------------

describe('AllRatesTodayError', () => {
  it('creates an error with message only', () => {
    const err = new AllRatesTodayError('something failed');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AllRatesTodayError');
    expect(err.message).toBe('something failed');
    expect(err.status).toBeUndefined();
  });

  it('creates an error with message and status', () => {
    const err = new AllRatesTodayError('not found', 404);
    expect(err.message).toBe('not found');
    expect(err.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// API Key validation
// ---------------------------------------------------------------------------

describe('API key validation', () => {
  it('throws when no API key is set', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.latest()).rejects.toThrow(AllRatesTodayError);
    await expect(noKeyClient.latest()).rejects.toThrow('API key is required');
  });

  it('throws for getRate without key', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.getRate('USD', 'EUR')).rejects.toThrow('API key is required');
  });

  it('throws for getRates without key', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.getRates('USD', 'EUR')).rejects.toThrow('API key is required');
  });

  it('throws for getHistoricalRates without key', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.getHistoricalRates('USD', 'EUR')).rejects.toThrow('API key is required');
  });

  it('throws for convert without key', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.convert('USD', 'EUR', 100)).rejects.toThrow('API key is required');
  });

  it('throws for forDate without key', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.forDate('2026-01-15')).rejects.toThrow('API key is required');
  });

  it('throws for timeSeries without key', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.timeSeries('2026-01-01', '2026-03-31')).rejects.toThrow('API key is required');
  });

  it('throws for symbols without key', async () => {
    const noKeyClient = new AllRatesToday();
    await expect(noKeyClient.symbols()).rejects.toThrow('API key is required');
  });
});

// ---------------------------------------------------------------------------
// Per-request API key override
// ---------------------------------------------------------------------------

describe('per-request API key override', () => {
  it('uses override key for latest()', async () => {
    const fetchMock = mockFetch([
      { rate: 0.92, source: 'USD', target: 'EUR', time: '2026-04-09T14:00:00Z' },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    const noKeyClient = new AllRatesToday();
    await noKeyClient.latest({ apiKey: 'override_key' });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer override_key');
  });

  it('uses override key for symbols()', async () => {
    const fetchMock = mockFetch({ symbols: { USD: 'US Dollar' } });
    vi.stubGlobal('fetch', fetchMock);

    const noKeyClient = new AllRatesToday();
    await noKeyClient.symbols({ apiKey: 'override_key' });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer override_key');
  });

  it('uses override key for getRate()', async () => {
    const fetchMock = mockFetch({
      from: { currency: 'USD', amount: 1 },
      to: { currency: 'EUR', amount: 0.92 },
      rate: 0.92,
      source: 'wise',
    });
    vi.stubGlobal('fetch', fetchMock);

    const noKeyClient = new AllRatesToday();
    await noKeyClient.getRate('USD', 'EUR', undefined, { apiKey: 'override_key' });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer override_key');
  });
});

// ---------------------------------------------------------------------------
// latest()
// ---------------------------------------------------------------------------

describe('latest()', () => {
  it('fetches latest rates with default base', async () => {
    const fetchMock = mockFetch([
      { rate: 0.92, source: 'USD', target: 'EUR', time: '2026-04-09T14:00:00Z' },
      { rate: 0.79, source: 'USD', target: 'GBP', time: '2026-04-09T14:00:00Z' },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.latest();

    expect(result.base).toBe('USD');
    expect(result.rates.EUR).toBe(0.92);
    expect(result.rates.GBP).toBe(0.79);
    expect(result.date).toBe('2026-04-09T14:00:00Z');
  });

  it('sends correct URL with base and symbols', async () => {
    const fetchMock = mockFetch([
      { rate: 1.08, source: 'EUR', target: 'USD', time: '2026-04-09T14:00:00Z' },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await client.latest({ base: 'EUR', symbols: ['USD', 'GBP'] });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('source=EUR');
    expect(calledUrl).toContain('target=USD%2CGBP');
  });

  it('handles single rate response (not array)', async () => {
    const fetchMock = mockFetch(
      { rate: 0.92, source: 'USD', target: 'EUR', time: '2026-04-09T14:00:00Z' },
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.latest({ symbols: ['EUR'] });
    expect(result.rates.EUR).toBe(0.92);
  });

  it('sends authorization header', async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal('fetch', fetchMock);

    await client.latest();

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe(`Bearer ${API_KEY}`);
  });
});

// ---------------------------------------------------------------------------
// forDate()
// ---------------------------------------------------------------------------

describe('forDate()', () => {
  it('fetches rates for a string date', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.9187, time: '2026-01-15T00:00:00Z' },
      rates: [{ rate: 0.9187, time: '2026-01-15T00:00:00Z' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.forDate('2026-01-15');

    expect(result.date).toBe('2026-01-15');
    expect(result.base).toBe('USD');
    expect(result.rates.EUR).toBe(0.9187);
  });

  it('accepts a Date object', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.92, time: '2026-01-15T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.forDate(new Date('2026-01-15'));

    expect(result.date).toBe('2026-01-15');
    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('from=2026-01-15');
    expect(calledUrl).toContain('to=2026-01-15');
  });

  it('passes base and symbols', async () => {
    const fetchMock = mockFetch({
      source: 'EUR',
      target: 'GBP',
      period: 'custom',
      current: { rate: 0.85, time: '2026-01-15T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.forDate('2026-01-15', { base: 'EUR', symbols: ['GBP'] });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('source=EUR');
    expect(calledUrl).toContain('target=GBP');
  });

  it('uses current rate when rates array is empty', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.9187, time: '2026-01-15T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.forDate('2026-01-15');
    expect(result.rates.EUR).toBe(0.9187);
  });
});

// ---------------------------------------------------------------------------
// timeSeries()
// ---------------------------------------------------------------------------

describe('timeSeries()', () => {
  it('fetches time series with string dates', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.92, time: '2026-03-31T00:00:00Z' },
      rates: [
        { rate: 0.9187, time: '2026-01-01T00:00:00Z' },
        { rate: 0.9195, time: '2026-01-02T00:00:00Z' },
        { rate: 0.9210, time: '2026-01-03T00:00:00Z' },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.timeSeries('2026-01-01', '2026-03-31');

    expect(result.base).toBe('USD');
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-03-31');
    expect(result.rates['2026-01-01'].EUR).toBe(0.9187);
    expect(result.rates['2026-01-02'].EUR).toBe(0.9195);
    expect(result.rates['2026-01-03'].EUR).toBe(0.9210);
  });

  it('accepts Date objects', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.92, time: '2026-03-31T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.timeSeries(new Date('2026-01-01'), new Date('2026-03-31'));

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('from=2026-01-01');
    expect(calledUrl).toContain('to=2026-03-31');
  });

  it('passes base and symbols options', async () => {
    const fetchMock = mockFetch({
      source: 'EUR',
      target: 'GBP',
      period: 'custom',
      current: { rate: 0.85, time: '2026-03-31T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.timeSeries('2026-01-01', '2026-03-31', {
      base: 'EUR',
      symbols: ['GBP', 'USD'],
    });

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('source=EUR');
    expect(calledUrl).toContain('target=GBP%2CUSD');
  });

  it('handles empty rates array', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.92, time: '2026-03-31T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.timeSeries('2026-01-01', '2026-03-31');
    expect(result.rates).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// symbols()
// ---------------------------------------------------------------------------

describe('symbols()', () => {
  it('fetches all symbols', async () => {
    const mockSymbols = {
      symbols: {
        USD: 'United States Dollar',
        EUR: 'Euro',
        GBP: 'British Pound Sterling',
      },
    };
    const fetchMock = mockFetch(mockSymbols);
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.symbols();

    expect(result.symbols.USD).toBe('United States Dollar');
    expect(result.symbols.EUR).toBe('Euro');
    expect(result.symbols.GBP).toBe('British Pound Sterling');
  });

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch({ symbols: {} });
    vi.stubGlobal('fetch', fetchMock);

    await client.symbols();

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('/api/v1/symbols');
  });
});

// ---------------------------------------------------------------------------
// getRate()
// ---------------------------------------------------------------------------

describe('getRate()', () => {
  it('fetches a single rate', async () => {
    const mockResponse = {
      from: { currency: 'USD', amount: 1 },
      to: { currency: 'EUR', amount: 0.9234 },
      rate: 0.9234,
      source: 'wise',
    };
    const fetchMock = mockFetch(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.getRate('USD', 'EUR');

    expect(result.rate).toBe(0.9234);
    expect(result.from.currency).toBe('USD');
    expect(result.to.currency).toBe('EUR');
  });

  it('passes amount when provided', async () => {
    const fetchMock = mockFetch({
      from: { currency: 'USD', amount: 500 },
      to: { currency: 'EUR', amount: 461.7 },
      rate: 0.9234,
      source: 'wise',
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.getRate('USD', 'EUR', 500);

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('amount=500');
  });

  it('sends correct query parameters', async () => {
    const fetchMock = mockFetch({
      from: { currency: 'GBP', amount: 1 },
      to: { currency: 'JPY', amount: 191.89 },
      rate: 191.89,
      source: 'wise',
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.getRate('GBP', 'JPY');

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('source=GBP');
    expect(calledUrl).toContain('target=JPY');
  });
});

// ---------------------------------------------------------------------------
// getRates()
// ---------------------------------------------------------------------------

describe('getRates()', () => {
  it('fetches authenticated rates', async () => {
    const mockResponse = [
      { rate: 0.9234, source: 'USD', target: 'EUR', time: '2026-04-09T14:00:00Z' },
    ];
    const fetchMock = mockFetch(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.getRates('USD', 'EUR');

    expect(result).toHaveLength(1);
    expect(result[0].rate).toBe(0.9234);
    expect(result[0].time).toBe('2026-04-09T14:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// getHistoricalRates()
// ---------------------------------------------------------------------------

describe('getHistoricalRates()', () => {
  it('fetches historical rates with default period', async () => {
    const mockResponse = {
      source: 'USD',
      target: 'EUR',
      period: '7d',
      current: { rate: 0.9234, time: '2026-04-09T14:00:00Z' },
      rates: [
        { rate: 0.9198, time: '2026-04-02T00:00:00Z' },
        { rate: 0.9210, time: '2026-04-03T00:00:00Z' },
      ],
    };
    const fetchMock = mockFetch(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.getHistoricalRates('USD', 'EUR');

    expect(result.period).toBe('7d');
    expect(result.current.rate).toBe(0.9234);
    expect(result.rates).toHaveLength(2);
  });

  it('passes custom period', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: '30d',
      current: { rate: 0.92, time: '2026-04-09T14:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.getHistoricalRates('USD', 'EUR', '30d');

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('period=30d');
  });

  it('calls the correct endpoint', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: '1y',
      current: { rate: 0.92, time: '2026-04-09T14:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.getHistoricalRates('USD', 'EUR', '1y');

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('/api/historical-rates');
    expect(calledUrl).toContain('period=1y');
  });
});

// ---------------------------------------------------------------------------
// convert()
// ---------------------------------------------------------------------------

describe('convert()', () => {
  it('converts at current rate', async () => {
    const fetchMock = mockFetch({
      from: { currency: 'USD', amount: 1000 },
      to: { currency: 'EUR', amount: 923.4 },
      rate: 0.9234,
      source: 'wise',
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.convert('USD', 'EUR', 1000);

    expect(result.from).toBe('USD');
    expect(result.to).toBe('EUR');
    expect(result.amount).toBe(1000);
    expect(result.result).toBe(923.4);
    expect(result.rate).toBe(0.9234);
    expect(result.date).toBeUndefined();
  });

  it('converts at historical date (string)', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.9187, time: '2026-01-15T00:00:00Z' },
      rates: [{ rate: 0.9187, time: '2026-01-15T00:00:00Z' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.convert('USD', 'EUR', 1000, { date: '2026-01-15' });

    expect(result.rate).toBe(0.9187);
    expect(result.result).toBe(918.7);
    expect(result.date).toBe('2026-01-15');
  });

  it('converts at historical date (Date object)', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.9187, time: '2026-01-15T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.convert('USD', 'EUR', 500, {
      date: new Date('2026-01-15'),
    });

    expect(result.date).toBe('2026-01-15');
    expect(result.amount).toBe(500);
  });

  it('falls back to rates array when current is missing', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: undefined,
      rates: [{ rate: 0.9200, time: '2026-01-15T00:00:00Z' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.convert('USD', 'EUR', 100, { date: '2026-01-15' });

    expect(result.rate).toBe(0.92);
  });

  it('returns 0 rate when no data available', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: undefined,
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.convert('USD', 'EUR', 100, { date: '2026-01-15' });

    expect(result.rate).toBe(0);
    expect(result.result).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('error handling', () => {
  it('throws AllRatesTodayError on HTTP error with JSON body', async () => {
    const fetchMock = mockFetchError({ error: 'Currency not found' }, 404);
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.getRate('USD', 'INVALID')).rejects.toThrow(AllRatesTodayError);
    await expect(client.getRate('USD', 'INVALID')).rejects.toThrow('Currency not found');

    try {
      await client.getRate('USD', 'INVALID');
    } catch (err) {
      expect(err).toBeInstanceOf(AllRatesTodayError);
      expect((err as AllRatesTodayError).status).toBe(404);
    }
  });

  it('throws AllRatesTodayError on HTTP error with non-JSON body', async () => {
    const fetchMock = mockFetchJsonFail(500, 'Internal Server Error');
    vi.stubGlobal('fetch', fetchMock);

    try {
      await client.latest();
    } catch (err) {
      expect(err).toBeInstanceOf(AllRatesTodayError);
      expect((err as AllRatesTodayError).status).toBe(500);
    }
  });

  it('throws on 401 unauthorized', async () => {
    const fetchMock = mockFetchError({ error: 'Invalid API key' }, 401);
    vi.stubGlobal('fetch', fetchMock);

    try {
      await client.latest();
    } catch (err) {
      expect(err).toBeInstanceOf(AllRatesTodayError);
      expect((err as AllRatesTodayError).status).toBe(401);
      expect((err as AllRatesTodayError).message).toBe('Invalid API key');
    }
  });

  it('throws on 429 rate limit', async () => {
    const fetchMock = mockFetchError({ error: 'Rate limit exceeded' }, 429);
    vi.stubGlobal('fetch', fetchMock);

    try {
      await client.latest();
    } catch (err) {
      expect(err).toBeInstanceOf(AllRatesTodayError);
      expect((err as AllRatesTodayError).status).toBe(429);
    }
  });

  it('falls back to HTTP status message when error field is missing', async () => {
    const fetchMock = mockFetchError({}, 503);
    vi.stubGlobal('fetch', fetchMock);

    try {
      await client.latest();
    } catch (err) {
      expect(err).toBeInstanceOf(AllRatesTodayError);
      expect((err as AllRatesTodayError).message).toBe('HTTP 503');
    }
  });
});

// ---------------------------------------------------------------------------
// Request construction
// ---------------------------------------------------------------------------

describe('request construction', () => {
  it('uses custom baseUrl', async () => {
    const customClient = new AllRatesToday({
      apiKey: API_KEY,
      baseUrl: 'https://custom.api.com',
    });
    const fetchMock = mockFetch({ symbols: {} });
    vi.stubGlobal('fetch', fetchMock);

    await customClient.symbols();

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('https://custom.api.com');
  });

  it('skips empty params', async () => {
    const fetchMock = mockFetch([
      { rate: 0.92, source: 'USD', target: 'EUR', time: '2026-04-09T14:00:00Z' },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await client.latest(); // no symbols = no target param

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).not.toContain('target=');
  });

  it('sets AbortSignal timeout', async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal('fetch', fetchMock);

    await client.latest();

    const options = fetchMock.mock.calls[0][1];
    expect(options.signal).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// formatDate (tested through public methods)
// ---------------------------------------------------------------------------

describe('date formatting', () => {
  it('handles string dates', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.92, time: '2025-12-31T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.forDate('2025-12-31');

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('from=2025-12-31');
  });

  it('converts Date objects to YYYY-MM-DD', async () => {
    const fetchMock = mockFetch({
      source: 'USD',
      target: 'EUR',
      period: 'custom',
      current: { rate: 0.92, time: '2025-06-15T00:00:00Z' },
      rates: [],
    });
    vi.stubGlobal('fetch', fetchMock);

    await client.forDate(new Date('2025-06-15T12:00:00Z'));

    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('from=2025-06-15');
  });
});
