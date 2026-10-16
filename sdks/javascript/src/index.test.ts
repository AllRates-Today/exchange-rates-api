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


// ---------------------------------------------------------------------------
// timeSeries()
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// symbols()
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// getRate()
// ---------------------------------------------------------------------------


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


// ---------------------------------------------------------------------------
// convert()
// ---------------------------------------------------------------------------


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


// ---------------------------------------------------------------------------
// Official (central bank) rates — keyless
// ---------------------------------------------------------------------------

describe('officialRates / officialSources', () => {
  it('fetches a full table without an API key', async () => {
    const body = { bank: 'ecb', rate_date: '2026-09-30', rates: [{ base: 'EUR', quote: 'USD', type: 'reference', value: 1.17 }], attribution: { source: '', url: '', terms: '' }, free_key: '' };
    const fetchMock = mockFetch(body);
    vi.stubGlobal('fetch', fetchMock);
    const keyless = new AllRatesToday();
    const res = await keyless.officialRates('ECB');
    expect(res.rate_date).toBe('2026-09-30');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://allratestoday.com/api/open/central-bank/ecb');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('narrows to one pair with uppercased codes', async () => {
    const fetchMock = mockFetch({ bank: 'ecb', rate_date: '2026-09-30', rate: 1.17 });
    vi.stubGlobal('fetch', fetchMock);
    await client.officialRates('ecb', { source: 'eur', target: 'usd' });
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get('source')).toBe('EUR');
    expect(url.searchParams.get('target')).toBe('USD');
  });

  it('rejects a lone source or target', async () => {
    await expect(client.officialRates('ecb', { source: 'EUR' })).rejects.toThrow(/both source and target/);
  });

  it('rejects an invalid bank code', async () => {
    await expect(client.officialRates('not a bank!')).rejects.toThrow(/Invalid source code/);
  });

  it('lists sources without an API key', async () => {
    const fetchMock = mockFetch({ sources: [{ code: 'ecb', name: 'European Central Bank', latest: '2026-09-30' }], stale_count: 0, checked_at: '', docs: '', free_key: '' });
    vi.stubGlobal('fetch', fetchMock);
    const res = await new AllRatesToday().officialSources();
    expect(res.sources[0].code).toBe('ecb');
    expect(fetchMock.mock.calls[0][0]).toBe('https://allratestoday.com/api/open/central-banks');
  });
});

// ---------------------------------------------------------------------------
// History-backed methods (market history is served as windows ending today)
// ---------------------------------------------------------------------------

const TODAY = '2026-10-16';

function historyBody(target: string, days: Array<[string, number]>, period = '7d') {
  return {
    source: 'USD',
    target,
    period,
    source_api: 'interbank',
    data: days.map(([date, rate]) => ({ date, rate, timestamp: Date.parse(`${date.slice(0, 10)}T00:00:00Z`) })),
  };
}

/** fetch mock that answers /api/historical-rates per target currency. */
function historyFetch(byTarget: Record<string, Array<[string, number]>>) {
  return vi.fn().mockImplementation((url: string) => {
    const u = new URL(url);
    const target = u.searchParams.get('target')!;
    const body = historyBody(target, byTarget[target] ?? [], u.searchParams.get('period')!);
    return Promise.resolve({ ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(body) });
  });
}

describe('API key validation', () => {
  const noKey = () => new AllRatesToday();

  it('throws a missing_key error before any request', async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal('fetch', fetchMock);
    await expect(noKey().latest()).rejects.toMatchObject({ code: 'missing_key' });
    await expect(noKey().latest()).rejects.toThrow('API key is required');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['getRate', (c: AllRatesToday) => c.getRate('USD', 'EUR')],
    ['getRates', (c: AllRatesToday) => c.getRates('USD', 'EUR')],
    ['getHistoricalRates', (c: AllRatesToday) => c.getHistoricalRates('USD', 'EUR')],
    ['convert', (c: AllRatesToday) => c.convert('USD', 'EUR', 100)],
    ['forDate', (c: AllRatesToday) => c.forDate('2026-10-10', { symbols: ['EUR'] })],
    ['timeSeries', (c: AllRatesToday) => c.timeSeries('2026-10-10', '2026-10-12', { symbols: ['EUR'] })],
  ])('throws for %s without key', async (_name, call) => {
    await expect(call(noKey())).rejects.toThrow('API key is required');
  });

  it('symbols() works without a key', async () => {
    const fetchMock = mockFetch({ currencies: [], count: 0 });
    vi.stubGlobal('fetch', fetchMock);
    await noKey().symbols();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
});

describe('symbols()', () => {
  it('maps the currency list to a code → name record', async () => {
    const fetchMock = mockFetch({
      currencies: [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
      ],
      count: 2,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.symbols();

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/symbols');
    expect(result.symbols).toEqual({ USD: 'US Dollar', EUR: 'Euro' });
    expect(result.currencies[1]).toEqual({ code: 'EUR', name: 'Euro', symbol: '€' });
    expect(result.count).toBe(2);
  });
});

describe('getRate()', () => {
  it('normalises the rates array returned without amount', async () => {
    vi.stubGlobal('fetch', mockFetch([
      { rate: 0.9234, source: 'USD', target: 'EUR', time: '2026-10-16T08:00:00+0000' },
    ]));

    const result = await client.getRate('USD', 'EUR');

    expect(result).toEqual({
      from: { currency: 'USD', amount: 1 },
      to: { currency: 'EUR', amount: 0.9234 },
      rate: 0.9234,
      source: 'interbank',
      time: '2026-10-16T08:00:00+0000',
    });
  });

  it('passes amount and returns the conversion shape', async () => {
    const body = {
      from: { currency: 'USD', amount: 500 },
      to: { currency: 'EUR', amount: 461.7 },
      rate: 0.9234,
      source: 'interbank',
    };
    const fetchMock = mockFetch(body);
    vi.stubGlobal('fetch', fetchMock);

    const result = await client.getRate('USD', 'EUR', 500);

    expect(fetchMock.mock.calls[0][0]).toContain('amount=500');
    expect(result).toEqual(body);
  });

  it('sends source and target', async () => {
    const fetchMock = mockFetch([{ rate: 1.1, source: 'GBP', target: 'USD', time: 't' }]);
    vi.stubGlobal('fetch', fetchMock);
    await client.getRate('GBP', 'USD');
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/rates');
    expect(url.searchParams.get('source')).toBe('GBP');
    expect(url.searchParams.get('target')).toBe('USD');
  });

  it('throws when the API returns no rate', async () => {
    vi.stubGlobal('fetch', mockFetch([]));
    await expect(client.getRate('USD', 'EUR')).rejects.toThrow('No rate returned');
  });
});

describe('history-backed methods', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getHistoricalRates()', () => {
    it('defaults to 7d and maps data to rates/current', async () => {
      const fetchMock = historyFetch({ EUR: [['2026-10-15', 0.89], ['2026-10-14', 0.88], ['2026-10-16', 0.9]] });
      vi.stubGlobal('fetch', fetchMock);

      const h = await client.getHistoricalRates('USD', 'EUR');

      const url = new URL(fetchMock.mock.calls[0][0]);
      expect(url.pathname).toBe('/api/historical-rates');
      expect(url.searchParams.get('period')).toBe('7d');
      expect(h.rates).toEqual([
        { rate: 0.88, time: '2026-10-14' },
        { rate: 0.89, time: '2026-10-15' },
        { rate: 0.9, time: '2026-10-16' },
      ]);
      expect(h.current).toEqual({ rate: 0.9, time: '2026-10-16' });
      expect(h.data).toHaveLength(3);
    });

    it('passes a custom period', async () => {
      const fetchMock = historyFetch({ EUR: [] });
      vi.stubGlobal('fetch', fetchMock);
      const h = await client.getHistoricalRates('USD', 'EUR', '1y');
      expect(fetchMock.mock.calls[0][0]).toContain('period=1y');
      expect(h.rates).toEqual([]);
    });
  });

  describe('forDate()', () => {
    it('makes one request per symbol and picks the requested day', async () => {
      const fetchMock = historyFetch({
        EUR: [['2026-10-12', 0.9], ['2026-10-13', 0.91], ['2026-10-14', 0.92]],
        GBP: [['2026-10-12', 0.75], ['2026-10-13', 0.76]],
      });
      vi.stubGlobal('fetch', fetchMock);

      const r = await client.forDate('2026-10-13', { base: 'usd', symbols: ['EUR', 'gbp'] });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][0]).toContain('period=7d');
      expect(r).toEqual({
        base: 'USD',
        date: '2026-10-13',
        rates: { EUR: 0.91, GBP: 0.76 },
        rateDates: { EUR: '2026-10-13', GBP: '2026-10-13' },
      });
    });

    it('falls back to the closest earlier point', async () => {
      vi.stubGlobal('fetch', historyFetch({ EUR: [['2026-03-06', 0.86], ['2026-03-13', 0.87]] }));
      const r = await client.forDate('2026-03-11', { symbols: ['EUR'] });
      expect(r.rates.EUR).toBe(0.86);
      expect(r.rateDates.EUR).toBe('2026-03-06');
    });

    it('accepts a Date object', async () => {
      const fetchMock = historyFetch({ EUR: [['2026-10-10', 0.9]] });
      vi.stubGlobal('fetch', fetchMock);
      const r = await client.forDate(new Date('2026-10-10T15:00:00Z'), { symbols: ['EUR'] });
      expect(r.date).toBe('2026-10-10');
    });

    it.each([
      ['2026-10-10', '7d'],
      ['2026-09-20', '30d'],
      ['2026-01-15', '1y'],
    ])('uses the smallest window for %s (%s)', async (date, period) => {
      const fetchMock = historyFetch({ EUR: [] });
      vi.stubGlobal('fetch', fetchMock);
      await client.forDate(date, { symbols: ['EUR'] });
      expect(fetchMock.mock.calls[0][0]).toContain(`period=${period}`);
    });

    it('rejects dates older than a year, in the future, malformed, or without symbols', async () => {
      const fetchMock = mockFetch({});
      vi.stubGlobal('fetch', fetchMock);
      await expect(client.forDate('2024-01-15', { symbols: ['EUR'] })).rejects.toThrow('last 365 days');
      await expect(client.forDate('2026-12-01', { symbols: ['EUR'] })).rejects.toThrow('in the future');
      await expect(client.forDate('15/01/2026', { symbols: ['EUR'] })).rejects.toThrow('Invalid date');
      await expect(client.forDate('2026-10-10', { symbols: [] })).rejects.toThrow('needs symbols');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('timeSeries()', () => {
    it('builds a date → currency map within the range', async () => {
      vi.stubGlobal('fetch', historyFetch({
        EUR: [['2026-10-09', 0.8], ['2026-10-10', 0.9], ['2026-10-11', 0.91], ['2026-10-12', 0.92]],
        GBP: [['2026-10-10', 0.75], ['2026-10-11', 0.76]],
      }));

      const r = await client.timeSeries('2026-10-10', new Date('2026-10-11T00:00:00Z'), { symbols: ['EUR', 'GBP'] });

      expect(r).toEqual({
        base: 'USD',
        startDate: '2026-10-10',
        endDate: '2026-10-11',
        rates: {
          '2026-10-10': { EUR: 0.9, GBP: 0.75 },
          '2026-10-11': { EUR: 0.91, GBP: 0.76 },
        },
      });
    });

    it('rejects a start after the end', async () => {
      await expect(client.timeSeries('2026-10-12', '2026-10-10', { symbols: ['EUR'] })).rejects.toThrow('after endDate');
    });
  });

  describe('convert()', () => {
    it('converts at the current rate', async () => {
      const fetchMock = mockFetch({
        from: { currency: 'USD', amount: 1000 },
        to: { currency: 'EUR', amount: 923.4 },
        rate: 0.9234,
        source: 'interbank',
      });
      vi.stubGlobal('fetch', fetchMock);

      const r = await client.convert('USD', 'EUR', 1000);

      expect(fetchMock.mock.calls[0][0]).toContain('amount=1000');
      expect(r).toEqual({ from: 'USD', to: 'EUR', amount: 1000, result: 923.4, rate: 0.9234 });
    });

    it('converts at a historical date', async () => {
      vi.stubGlobal('fetch', historyFetch({ EUR: [['2026-10-01', 0.882768]] }));
      const r = await client.convert('USD', 'EUR', 1000, { date: '2026-10-01' });
      expect(r).toEqual({
        from: 'USD', to: 'EUR', amount: 1000, result: 882.768, rate: 0.882768, date: '2026-10-01', rateDate: '2026-10-01',
      });
    });

    it('throws when no historical point exists', async () => {
      vi.stubGlobal('fetch', historyFetch({ EUR: [] }));
      await expect(client.convert('USD', 'EUR', 1, { date: '2026-10-01' })).rejects.toThrow('No USD/EUR rate');
    });
  });
});

describe('transport errors', () => {
  it('wraps a timeout as code "timeout"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'TimeoutError' })));
    const err = await client.latest().catch((e) => e);
    expect(err).toBeInstanceOf(AllRatesTodayError);
    expect(err.code).toBe('timeout');
    expect(err.message).toContain('timed out after 10000 ms');
  });

  it('wraps other fetch failures as code "network"', async () => {
    const cause = new TypeError('fetch failed');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    const err = await client.latest().catch((e) => e);
    expect(err.code).toBe('network');
    expect(err.cause).toBe(cause);
  });

  it('exposes the 429 body as details', async () => {
    const body = { error: 'Request limit exceeded', used: 300, limit: 300, plan: 'free', resets_at: null };
    vi.stubGlobal('fetch', mockFetchError(body, 429));
    const err = await client.latest().catch((e) => e);
    expect(err).toMatchObject({ status: 429, code: 'http', details: body, message: 'Request limit exceeded' });
  });
});

describe('officialRatesOn()', () => {
  it('calls the dated endpoint with the key and pair', async () => {
    const body = { bank: 'ecb', requested_date: '2026-10-11', rate_date: '2026-10-09', published_on_requested_date: false, rate: 0.75, method: 'cross' };
    const fetchMock = mockFetch(body);
    vi.stubGlobal('fetch', fetchMock);

    const r = await client.officialRatesOn('ECB', '2026-10-11', { source: 'usd', target: 'gbp' });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/central-bank/ecb/2026-10-11');
    expect(url.searchParams.get('source')).toBe('USD');
    expect(url.searchParams.get('target')).toBe('GBP');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${API_KEY}`);
    expect(r).toEqual(body);
  });

  it('needs a key and validates input', async () => {
    await expect(new AllRatesToday().officialRatesOn('ecb', '2026-10-11')).rejects.toMatchObject({ code: 'missing_key' });
    await expect(client.officialRatesOn('ecb', '2026-10-11', { source: 'USD' })).rejects.toThrow('both source and target');
    await expect(client.officialRatesOn('bad code!', '2026-10-11')).rejects.toThrow('Invalid source code');
  });
});
