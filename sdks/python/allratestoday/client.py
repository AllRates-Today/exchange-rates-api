"""AllRatesToday API client."""

from typing import Optional
import urllib.request
import urllib.parse
import urllib.error
import json

BASE_URL = "https://allratestoday.com"


class AllRatesTodayError(Exception):
    """Error from the AllRatesToday API."""

    def __init__(self, message: str, status: Optional[int] = None):
        super().__init__(message)
        self.status = status


class AllRatesToday:
    """Official Python client for the AllRatesToday exchange rate API.

    Args:
        api_key: Your API key (from https://allratestoday.com/profile).
                 Not required for free public endpoint.
        base_url: API base URL. Defaults to https://allratestoday.com.
        timeout: Request timeout in seconds. Defaults to 10.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = BASE_URL,
        timeout: int = 10,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _request(self, path: str, params: Optional[dict] = None) -> dict:
        url = f"{self.base_url}{path}"
        if params:
            query = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
            url = f"{url}?{query}"

        req = urllib.request.Request(url)
        if self.api_key:
            req.add_header("Authorization", f"Bearer {self.api_key}")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            try:
                error_data = json.loads(body)
                msg = error_data.get("error", f"HTTP {e.code}")
            except (json.JSONDecodeError, KeyError):
                msg = f"HTTP {e.code}"
            raise AllRatesTodayError(msg, status=e.code) from e
        except urllib.error.URLError as e:
            raise AllRatesTodayError(f"Connection error: {e.reason}") from e

    def get_rate(self, from_currency: str, to_currency: str, amount: Optional[float] = None) -> dict:
        """Get exchange rate between two currencies (requires API key).

        Register for free at https://allratestoday.com/register

        Args:
            from_currency: Source currency code (e.g., 'USD').
            to_currency: Target currency code (e.g., 'EUR').
            amount: Optional amount to convert. Defaults to 1.

        Returns:
            dict with rate data.
        """
        if not self.api_key:
            raise AllRatesTodayError("API key required. Register for free at https://allratestoday.com/register")
        params = {"source": from_currency, "target": to_currency}
        if amount is not None:
            params["amount"] = str(amount)
        return self._request("/api/v1/rates", params)

    def get_rates(self, source: str, target: str) -> list:
        """Get authenticated exchange rate (requires API key).

        Args:
            source: Source currency code.
            target: Target currency code.

        Returns:
            List of rate objects with 'rate', 'source', 'target', 'time'.
        """
        if not self.api_key:
            raise AllRatesTodayError("API key required for authenticated requests")
        return self._request("/api/v1/rates", {"source": source, "target": target})

    def get_historical_rates(
        self, source: str, target: str, period: str = "7d"
    ) -> dict:
        """Get historical rates (requires API key).

        Args:
            source: Source currency code.
            target: Target currency code.
            period: Time period — '1d', '7d', '30d', or '1y'.

        Returns:
            dict with 'current', 'rates', 'source', 'target', 'period'.
        """
        if not self.api_key:
            raise AllRatesTodayError("API key required for historical rates")
        return self._request("/api/historical-rates", {
            "source": source,
            "target": target,
            "period": period,
        })

    def convert(self, from_currency: str, to_currency: str, amount: float) -> dict:
        """Convert an amount from one currency to another.

        Args:
            from_currency: Source currency code.
            to_currency: Target currency code.
            amount: Amount to convert.

        Returns:
            dict with 'from', 'to', 'amount', 'result', 'rate'.
        """
        data = self.get_rate(from_currency, to_currency, amount)
        return {
            "from": from_currency,
            "to": to_currency,
            "amount": amount,
            "result": data["to"]["amount"],
            "rate": data["rate"],
        }
