# AllRatesToday PHP SDK

Official PHP SDK for the [AllRatesToday](https://allratestoday.com) exchange rate API.

Real-time mid-market exchange rates for 160+ currencies, with no retail spread.

## 📦 Installation

```bash
composer require allratestoday/sdk
```

## 🏁 Quick Start

Get your free API key at [allratestoday.com/register](https://allratestoday.com/register).

```php
use AllRatesToday\AllRatesToday;

$client = new AllRatesToday('art_live_your_key_here');

// Get exchange rate
$rate = $client->getRate('USD', 'EUR');
echo "1 USD = {$rate[0]['rate']} EUR\n";

// Convert amount
$result = $client->convert('USD', 'EUR', 100);
echo "\$100 = €{$result['result']}\n";

// Get historical rates (paid plans; free and trial keys get 403 historical_requires_paid_plan)
$history = $client->getHistoricalRates('USD', 'EUR', '30d');
foreach ($history['rates'] as $point) {
    echo "{$point['time']}: {$point['rate']}\n";
}
```

## 📚 API Reference

### `new AllRatesToday($apiKey, $baseUrl, $timeout)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `$apiKey` | `string` | **required** | Your API key ([register free](https://allratestoday.com/register)) |
| `$baseUrl` | `string` | `https://allratestoday.com` | API base URL |
| `$timeout` | `int` | `10` | Request timeout in seconds |

### Methods

| Method | Description |
|--------|-------------|
| `getRate($from, $to, $amount)` | Get exchange rate between two currencies |
| `convert($from, $to, $amount)` | Convert amount between currencies |
| `getRates($source, $target)` | Get rate data with metadata |
| `getHistoricalRates($source, $target, $period)` | Historical rates (1d/7d/30d/1y; paid plan) |

All methods require an API key.

### 🛡️ Error Handling

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

## ⚙️ Requirements

- PHP >= 7.4
- ext-curl
- ext-json

## 🤖 Use it from an AI agent

The same rates are available to coding agents and LLM tools without a second integration:

- **Claude Code plugin** (no key): `/plugin marketplace add AllRates-Today/claude-code-plugin` then `/plugin install allratestoday@allratestoday`
- **Hosted MCP endpoint**: `https://allratestoday.com/api/mcp` — Streamable HTTP, keyless, nothing to install
- **Local MCP servers**: `npx -y @allratestoday/mcp-server` (live mid-market rates) · `npx -y @allratestoday/central-bank-mcp` (official central-bank rates)
- **Trial key for agents, no signup**: `POST https://allratestoday.com/api/agent/keys` (send `Content-Type: application/json`) returns a 100-call key valid 7 days for latest rates and latest central-bank tables (history and dated tables are paid-plan only); both MCP servers expose it as `request_trial_key`
- **Daily Reference Rate** (first published 2026-10-12): one fixed USD table per business day, the 16:00 London median of minute samples, never revised — keyless at `https://allratestoday.com/api/open/reference-rate`, `get_reference_rate` in the MCP server
- Machine-readable site guide: [llms.txt](https://allratestoday.com/llms.txt)

## 🔗 Links

- [API Documentation](https://allratestoday.com/docs)
- [Register (Free)](https://allratestoday.com/register)
- [Dashboard](https://allratestoday.com/profile)
- [Status](https://allratestoday.com/status)
- [Postman collection](https://allratestoday.com/postman/)
- [GitHub](https://github.com/AllRates-Today/exchange-rates-api)

## 📜 License

MIT
