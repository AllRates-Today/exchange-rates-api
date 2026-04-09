/**
 * AllRatesToday Exchange Rates API - SDK Example
 * npm install @allratestoday/sdk
 * https://allratestoday.com
 */

import AllRatesToday from '@allratestoday/sdk';

const client = new AllRatesToday({ apiKey: 'YOUR_API_KEY' });

async function main() {
  // Get latest rates for multiple currencies
  const { rates } = await client.latest({ base: 'USD', symbols: ['EUR', 'GBP', 'JPY'] });
  console.log('Latest rates:', rates);

  // Convert an amount
  const result = await client.convert('USD', 'EUR', 1000);
  console.log(`$1,000 = €${result.result}`);

  // Get rates for a specific date
  const historical = await client.forDate('2026-01-15', { base: 'USD', symbols: ['EUR'] });
  console.log('Rate on Jan 15:', historical.rates);

  // Time series
  const series = await client.timeSeries('2026-01-01', '2026-03-31', {
    base: 'USD',
    symbols: ['EUR'],
  });
  console.log('Time series:', Object.keys(series.rates).length, 'data points');

  // List all currencies
  const { symbols } = await client.symbols();
  console.log('Supported currencies:', Object.keys(symbols).length);

  // Historical conversion
  const pastConversion = await client.convert('USD', 'EUR', 1000, { date: '2026-01-15' });
  console.log(`$1,000 on Jan 15 = €${pastConversion.result} (rate: ${pastConversion.rate})`);
}

main().catch(console.error);
