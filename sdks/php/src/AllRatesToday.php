<?php

namespace AllRatesToday;

class AllRatesToday
{
    private ?string $apiKey;
    private string $baseUrl;
    private int $timeout;

    /**
     * @param string|null $apiKey  Your API key (from https://allratestoday.com/profile)
     * @param string      $baseUrl API base URL
     * @param int         $timeout Request timeout in seconds
     */
    public function __construct(
        ?string $apiKey = null,
        string $baseUrl = 'https://allratestoday.com',
        int $timeout = 10
    ) {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->timeout = $timeout;
    }

    /**
     * Get exchange rate between two currencies.
     *
     * @param string     $from   Source currency code (e.g., 'USD')
     * @param string     $to     Target currency code (e.g., 'EUR')
     * @param float|null $amount Optional amount to convert
     * @return array Without $amount: list of {rate, source, target, time} (use $rate[0]['rate']).
     *               With $amount: {from: {currency, amount}, to: {currency, amount}, rate, source}.
     * @throws AllRatesTodayException
     */
    public function getRate(string $from, string $to, ?float $amount = null): array
    {
        if (!$this->apiKey) {
            throw new AllRatesTodayException('API key required. Register for free at https://allratestoday.com/register');
        }
        $params = ['source' => $from, 'target' => $to];
        if ($amount !== null) {
            $params['amount'] = $amount;
        }
        return $this->request('/api/v1/rates', $params);
    }

    /**
     * Get authenticated exchange rate (requires API key).
     *
     * @param string $source Source currency code
     * @param string $target Target currency code
     * @return array List of rate objects
     * @throws AllRatesTodayException
     */
    public function getRates(string $source, string $target): array
    {
        if (!$this->apiKey) {
            throw new AllRatesTodayException('API key required for authenticated requests');
        }
        return $this->request('/api/v1/rates', ['source' => $source, 'target' => $target]);
    }

    /**
     * Get historical rates (requires a paid plan; free and trial keys get
     * HTTP 403 historical_requires_paid_plan).
     *
     * @param string $source Source currency code
     * @param string $target Target currency code
     * @param string $period Time period: '1d', '7d', '30d', or '1y'
     * @return array{source: string, target: string, period: string, current: array, rates: array}
     * @throws AllRatesTodayException
     */
    public function getHistoricalRates(string $source, string $target, string $period = '7d'): array
    {
        if (!$this->apiKey) {
            throw new AllRatesTodayException('API key required for historical rates');
        }
        // The endpoint returns {data: [{date, rate, timestamp}]}; map it to rates / current.
        $raw = $this->request('/api/historical-rates', [
            'source' => $source,
            'target' => $target,
            'period' => $period,
        ]);
        $points = $raw['data'] ?? [];
        usort($points, fn($a, $b) => $a['timestamp'] <=> $b['timestamp']);
        $rates = array_map(fn($p) => ['rate' => $p['rate'], 'time' => $p['date']], $points);
        return [
            'source' => $source,
            'target' => $target,
            'period' => $period,
            'current' => $rates ? $rates[count($rates) - 1] : ['rate' => 0, 'time' => ''],
            'rates' => $rates,
        ];
    }

    /**
     * Convert an amount from one currency to another.
     *
     * @param string $from   Source currency code
     * @param string $to     Target currency code
     * @param float  $amount Amount to convert
     * @return array{from: string, to: string, amount: float, result: float, rate: float}
     * @throws AllRatesTodayException
     */
    public function convert(string $from, string $to, float $amount): array
    {
        $data = $this->getRate($from, $to, $amount);
        return [
            'from' => $from,
            'to' => $to,
            'amount' => $amount,
            'result' => $data['to']['amount'],
            'rate' => $data['rate'],
        ];
    }

    private function request(string $path, array $params = []): array
    {
        $url = $this->baseUrl . $path;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => $this->apiKey
                ? ['Authorization: Bearer ' . $this->apiKey]
                : [],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new AllRatesTodayException('Connection error: ' . $error);
        }

        $data = json_decode($response, true);

        if ($httpCode >= 400) {
            $msg = $data['error'] ?? "HTTP {$httpCode}";
            throw new AllRatesTodayException($msg, $httpCode);
        }

        return $data;
    }
}
