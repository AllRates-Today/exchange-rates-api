import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CentralBankRates, CentralBankError, NeedsApiKeyError } from './index';

function mockFetch(payload: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: 'Error',
    json: async () => payload,
  } as unknown as Response);
}

function calledUrl(f: ReturnType<typeof vi.fn>): string {
  return f.mock.calls[0][0] as string;
}

function calledHeaders(f: ReturnType<typeof vi.fn>): Record<string, string> {
  return (f.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('keyless behaviour', () => {
  it('is keyless by default', () => {
    expect(new CentralBankRates().keyless).toBe(true);
    expect(new CentralBankRates({ apiKey: 'k' }).keyless).toBe(false);
  });

  it('latest works without a key and sends no auth header', async () => {
    const f = mockFetch({ bank: 'ecb', rate_date: '2026-08-28', rates: [] });
    vi.stubGlobal('fetch', f);

    const out = await new CentralBankRates().latest('ecb');

    expect(calledUrl(f)).toContain('/api/open/central-bank/ecb');
    expect(calledHeaders(f).Authorization).toBeUndefined();
    expect((out as any).bank).toBe('ecb');
  });

  it('narrows to a pair and uppercases currency codes', async () => {
    const f = mockFetch({ rate: 0.86 });
    vi.stubGlobal('fetch', f);

    await new CentralBankRates().latest('ecb', { source: 'usd', target: 'eur' });

    expect(calledUrl(f)).toContain('source=USD');
    expect(calledUrl(f)).toContain('target=EUR');
  });

  it('lowercases the bank code', async () => {
    const f = mockFetch({});
    vi.stubGlobal('fetch', f);

    await new CentralBankRates().latest('ECB');

    expect(calledUrl(f)).toContain('/api/open/central-bank/ecb');
  });

  it('omits empty params from the query', async () => {
    const f = mockFetch({});
    vi.stubGlobal('fetch', f);

    await new CentralBankRates().latest('ecb');

    expect(calledUrl(f)).not.toContain('?');
  });
});

describe('metered methods', () => {
  const calls: Array<[string, (c: CentralBankRates) => Promise<unknown>]> = [
    ['sources', (c) => c.sources()],
    ['forDate', (c) => c.forDate('ecb', '2026-01-15')],
    ['history', (c) => c.history('ecb', { symbol: 'USD' })],
    ['availability', (c) => c.availability('ecb', { year: 2026 })],
    ['compare', (c) => c.compare('USD', 'EUR')],
  ];

  it.each(calls)('%s explains how to get a key without calling out', async (_name, call) => {
    const f = mockFetch({});
    vi.stubGlobal('fetch', f);

    await expect(call(new CentralBankRates())).rejects.toThrow(NeedsApiKeyError);
    expect(f).not.toHaveBeenCalled();
  });

  it('NeedsApiKeyError is a CentralBankError, so base-class catches still work', () => {
    expect(new NeedsApiKeyError('x')).toBeInstanceOf(CentralBankError);
  });
});

describe('authenticated behaviour', () => {
  it('sends the key as a bearer token', async () => {
    const f = mockFetch({ banks: [] });
    vi.stubGlobal('fetch', f);

    await new CentralBankRates({ apiKey: 'art_live_x' }).sources();

    expect(calledHeaders(f).Authorization).toBe('Bearer art_live_x');
  });

  it('builds the dated path, from a string or a Date', async () => {
    const f = mockFetch({});
    vi.stubGlobal('fetch', f);
    await new CentralBankRates({ apiKey: 'k' }).forDate('ecb', '2026-01-15');
    expect(calledUrl(f)).toContain('/api/v1/central-bank/ecb/2026-01-15');

    const g = mockFetch({});
    vi.stubGlobal('fetch', g);
    await new CentralBankRates({ apiKey: 'k' }).forDate('boj', new Date('2026-03-14T12:00:00Z'));
    expect(calledUrl(g)).toContain('/api/v1/central-bank/boj/2026-03-14');
  });

  it('history passes the window', async () => {
    const f = mockFetch({});
    vi.stubGlobal('fetch', f);

    await new CentralBankRates({ apiKey: 'k' }).history('ecb', {
      symbol: 'usd',
      from: '2026-01-01',
      to: new Date('2026-03-31T00:00:00Z'),
    });

    const url = calledUrl(f);
    expect(url).toContain('/api/v1/central-bank/ecb/history');
    expect(url).toContain('symbol=USD');
    expect(url).toContain('from=2026-01-01');
    expect(url).toContain('to=2026-03-31');
  });

  it('availability and compare hit the right paths', async () => {
    const f = mockFetch({});
    vi.stubGlobal('fetch', f);
    await new CentralBankRates({ apiKey: 'k' }).availability('ecb', { year: 2026 });
    expect(calledUrl(f)).toContain('availability');
    expect(calledUrl(f)).toContain('year=2026');

    const g = mockFetch({});
    vi.stubGlobal('fetch', g);
    await new CentralBankRates({ apiKey: 'k' }).compare('usd', 'eur');
    expect(calledUrl(g)).toContain('/api/v1/central-banks/rates');
    expect(calledUrl(g)).toContain('source=USD');
  });
});

describe('errors', () => {
  it('surfaces the upstream message and status', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'Unknown source' }, false, 404));

    await expect(new CentralBankRates().latest('nope')).rejects.toMatchObject({
      message: 'Unknown source',
      status: 404,
    });
  });

  it('falls back to the status code when the body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => {
          throw new Error('not json');
        },
      } as unknown as Response),
    );

    await expect(new CentralBankRates().latest('ecb')).rejects.toThrow(/Server Error|HTTP 500/);
  });

  it('wraps a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no route')));

    await expect(new CentralBankRates().latest('ecb')).rejects.toThrow(/Connection error/);
  });
});

describe('configuration', () => {
  it('honours a base URL override', async () => {
    const f = mockFetch({});
    vi.stubGlobal('fetch', f);

    await new CentralBankRates({ baseUrl: 'https://staging.example.com' }).latest('ecb');

    expect(calledUrl(f)).toMatch(/^https:\/\/staging\.example\.com\/api\/open\/central-bank\/ecb/);
  });
});
