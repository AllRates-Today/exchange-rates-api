/**
 * AllRatesToday Exchange Rates API - JavaScript Example
 * https://allratestoday.com
 */

const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://allratestoday.com/api/v1';

/**
 * Get exchange rate between two currencies
 */
async function getExchangeRate(source, target) {
  const response = await fetch(
    `${BASE_URL}/rates?source=${source}&target=${target}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  const data = await response.json();
  return data[0];
}

/**
 * Get all exchange rates for a base currency
 */
async function getAllRates(source) {
  const response = await fetch(
    `${BASE_URL}/rates?source=${source}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

/**
 * Get historical exchange rate
 */
async function getHistoricalRate(source, target, date) {
  const response = await fetch(
    `${BASE_URL}/rates?source=${source}&target=${target}&time=${date}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  const data = await response.json();
  return data[0];
}

/**
 * Convert amount from one currency to another
 */
async function convertCurrency(amount, source, target) {
  const rateData = await getExchangeRate(source, target);
  return {
    amount: amount,
    source: source,
    target: target,
    rate: rateData.rate,
    result: amount * rateData.rate,
    time: rateData.time
  };
}

// Usage Examples
async function main() {
  try {
    // Get USD to EUR rate
    const rate = await getExchangeRate('USD', 'EUR');
    console.log(`USD to EUR: ${rate.rate}`);

    // Convert 100 USD to EUR
    const conversion = await convertCurrency(100, 'USD', 'EUR');
    console.log(`${conversion.amount} ${conversion.source} = ${conversion.result.toFixed(2)} ${conversion.target}`);

    // Get historical rate
    const historical = await getHistoricalRate('USD', 'EUR', '2024-01-01T00:00:00Z');
    console.log(`Historical USD to EUR (2024-01-01): ${historical.rate}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
