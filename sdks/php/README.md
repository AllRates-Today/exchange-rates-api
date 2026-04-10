# AllRatesToday PHP SDK

Official PHP SDK for the [AllRatesToday](https://allratestoday.com) exchange rate API.

Real-time mid-market exchange rates for 160+ currencies, sourced from Reuters (Refinitiv) and interbank market feeds.

## Installation

```bash
composer require allratestoday/sdk
```

## Quick Start

### Free Public Rates (No API Key)

```php
use AllRatesToday\AllRatesToday;

$client = new AllRatesToday();

// Get exchange rate
$rate = $client->getRate('USD', 'EUR');
echo "1 USD = {$rate['rate']} EUR\n";

// Convert amount
$result = $client->convert('USD', 'EUR', 100);
echo "\$100 = €{$result['result']}\n";
```

### Authenticated Rates (API Key Required)

```php
use AllRatesToday\AllRatesToday;

$client = new AllRatesToday('art_live_your_key_here');

// Get authenticated rates
$rates = $client->getRates('USD', 'EUR');
print_r($rates);

// Get historical rates
$history = $client->getHistoricalRates('USD', 'EUR', '30d');
foreach ($history['rates'] as $point) {
    echo "{$point['time']}: {$point['rate']}\n";
}
```

## API Reference

### `new AllRatesToday($apiKey, $baseUrl, $timeout)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `$apiKey` | `string\|null` | `null` | Your API key ([get one](https://allratestoday.com/profile)) |
| `$baseUrl` | `string` | `https://allratestoday.com` | API base URL |
| `$timeout` | `int` | `10` | Request timeout in seconds |

### Methods

| Method | Auth | Description |
|--------|------|-------------|
| `getRate($from, $to, $amount)` | No | Get exchange rate (free) |
| `convert($from, $to, $amount)` | No | Convert amount between currencies |
| `getRates($source, $target)` | Yes | Authenticated rate lookup |
| `getHistoricalRates($source, $target, $period)` | Yes | Historical rates (1d/7d/30d/1y) |

### Error Handling

```php
use AllRatesToday\AllRatesToday;
use AllRatesToday\AllRatesTodayException;

try {
    $rate = $client->getRate('USD', 'INVALID');
} catch (AllRatesTodayException $e) {
    echo $e->getMessage();      // Error message
    echo $e->getStatusCode();   // HTTP status code
}
```

## Requirements

- PHP >= 7.4
- ext-curl
- ext-json

## Links

- [API Documentation](https://allratestoday.com/docs)
- [Get API Key](https://allratestoday.com/profile)

## License

MIT
