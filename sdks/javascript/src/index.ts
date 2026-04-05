const BASE_URL = 'https://allratestoday.com';

export interface RateResponse {
  from: { currency: string; amount: number };
  to: { currency: string; amount: number };
  rate: number;
  source: string;
}

export interface AuthRateResponse {
  rate: number;
  source: string;
  target: string;
  time: string;
}

export interface HistoricalRateResponse {
  source: string;
  target: string;
  period: string;
  current: { rate: number; time: string };
  rates: Array<{ rate: number; time: string }>;
}

export interface AllRatesTodayOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export class AllRatesToday {
  private apiKey?: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: AllRatesTodayOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || BASE_URL;
    this.timeout = options.timeout || 10000;
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new AllRatesTodayError(
        (error as any).error || `HTTP ${response.status}`,
        response.status
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get exchange rate between two currencies (free, no auth required)
   */
  async getRate(from: string, to: string, amount?: number): Promise<RateResponse> {
    const params: Record<string, string> = { from, to };
    if (amount !== undefined) params.amount = String(amount);
    return this.request<RateResponse>('/api/public/rates', params);
  }

  /**
   * Get authenticated exchange rate (requires API key)
   */
  async getRates(source: string, target: string): Promise<AuthRateResponse[]> {
    if (!this.apiKey) throw new AllRatesTodayError('API key required for authenticated requests');
    return this.request<AuthRateResponse[]>('/api/v1/rates', { source, target });
  }

  /**
   * Get historical rates (requires API key)
   */
  async getHistoricalRates(
    source: string,
    target: string,
    period: '1d' | '7d' | '30d' | '1y' = '7d'
  ): Promise<HistoricalRateResponse> {
    if (!this.apiKey) throw new AllRatesTodayError('API key required for historical rates');
    return this.request<HistoricalRateResponse>('/api/historical-rates', {
      source,
      target,
      period,
    });
  }

  /**
   * Convert an amount from one currency to another
   */
  async convert(from: string, to: string, amount: number): Promise<{ from: string; to: string; amount: number; result: number; rate: number }> {
    const data = await this.getRate(from, to, amount);
    return {
      from,
      to,
      amount,
      result: data.to.amount,
      rate: data.rate,
    };
  }
}

export class AllRatesTodayError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AllRatesTodayError';
    this.status = status;
  }
}

export default AllRatesToday;
