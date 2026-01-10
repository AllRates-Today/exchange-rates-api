# AllRatesToday Exchange Rates API

A free, fast, and reliable REST API for real-time and historical currency exchange rates.

[![API Status](https://img.shields.io/badge/API-Online-brightgreen)](https://allratestoday.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Real-time rates** - Live exchange rates updated every minute
- **Historical data** - Access historical rates for any date
- **150+ currencies** - Major currencies, cryptocurrencies, and precious metals
- **Fast & reliable** - Built on Cloudflare's global edge network
- **Simple authentication** - Free API key with generous rate limits

## Quick Start

### 1. Get Your Free API Key

Sign up at [allratestoday.com/register](https://allratestoday.com/register) to get your free API key.

### 2. Make Your First Request

```bash
curl -X GET "https://allratestoday.com/api/v1/rates?source=USD&target=EUR" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Get the Response

```json
[
  {
    "rate": 0.92,
    "source": "USD",
    "target": "EUR",
    "time": "2024-01-10T12:00:00Z"
  }
]
```

## API Reference

### Base URL

```
https://allratestoday.com/api/v1
```

### Authentication

All requests require an API key. Include it in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

#### Get Exchange Rates

```
GET /rates
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source` | string | No | Base currency code (e.g., `USD`) |
| `target` | string | No | Target currency code (e.g., `EUR`) |
| `time` | string | No | ISO 8601 timestamp for historical rate |
| `from` | string | No | Start date for historical range (YYYY-MM-DD) |
| `to` | string | No | End date for historical range (YYYY-MM-DD) |
| `group` | string | No | Group results (`day`, `hour`) |

**Example: Get USD to EUR rate**
```bash
curl "https://allratestoday.com/api/v1/rates?source=USD&target=EUR" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example: Get all rates for USD**
```bash
curl "https://allratestoday.com/api/v1/rates?source=USD" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example: Get historical rate**
```bash
curl "https://allratestoday.com/api/v1/rates?source=USD&target=EUR&time=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example: Get rate history for a date range**
```bash
curl "https://allratestoday.com/api/v1/rates?source=USD&target=EUR&from=2024-01-01&to=2024-01-31&group=day" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response Format

```json
[
  {
    "rate": 0.92,
    "source": "USD",
    "target": "EUR",
    "time": "2024-01-10T12:00:00Z"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `rate` | number | Exchange rate |
| `source` | string | Base currency code |
| `target` | string | Target currency code |
| `time` | string | Timestamp of the rate (ISO 8601) |

## Code Examples

### JavaScript (Node.js / Browser)

```javascript
const API_KEY = 'your_api_key';

async function getExchangeRate(source, target) {
  const response = await fetch(
    `https://allratestoday.com/api/v1/rates?source=${source}&target=${target}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    }
  );

  const data = await response.json();
  return data[0].rate;
}

// Usage
const rate = await getExchangeRate('USD', 'EUR');
console.log(`1 USD = ${rate} EUR`);
```

### Python

```python
import requests

API_KEY = 'your_api_key'
BASE_URL = 'https://allratestoday.com/api/v1'

def get_exchange_rate(source, target):
    response = requests.get(
        f'{BASE_URL}/rates',
        params={'source': source, 'target': target},
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    data = response.json()
    return data[0]['rate']

# Usage
rate = get_exchange_rate('USD', 'EUR')
print(f'1 USD = {rate} EUR')
```

### PHP

```php
<?php
$apiKey = 'your_api_key';
$source = 'USD';
$target = 'EUR';

$url = "https://allratestoday.com/api/v1/rates?source={$source}&target={$target}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer {$apiKey}"
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo "1 {$source} = {$data[0]['rate']} {$target}";
```

### cURL

```bash
# Get current rate
curl -X GET "https://allratestoday.com/api/v1/rates?source=USD&target=EUR" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get historical rate
curl -X GET "https://allratestoday.com/api/v1/rates?source=USD&target=EUR&time=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Rate Limits

| Plan | Requests per Day | Rate |
|------|------------------|------|
| Free | 100 | $0 |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704931200
```

## Supported Currencies

### Major Currencies
`USD`, `EUR`, `GBP`, `JPY`, `CHF`, `CAD`, `AUD`, `NZD`, `CNY`, `HKD`, `SGD`, `INR`, `MXN`, `BRL`, `ZAR`

### All Currencies
The API supports 150+ currencies including:
- All major world currencies
- Cryptocurrencies (BTC, ETH, etc.)
- Precious metals (XAU, XAG)
- And many more

## Error Handling

### Error Response Format

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `401` | Authentication required or invalid API key |
| `429` | Rate limit exceeded |
| `500` | Server error |

### Rate Limit Exceeded (429)

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

## Support

- **Website:** [allratestoday.com](https://allratestoday.com)
- **Email:** info@allratestoday.com
- **Documentation:** [allratestoday.com/developers](https://allratestoday.com/developers)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
