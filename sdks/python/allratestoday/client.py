"""AllRatesToday API client."""

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union
import urllib.request
import urllib.parse
import urllib.error
import json

DEFAULT_BASE_URL = "https://allratestoday.com"
DEFAULT_TIMEOUT = 10


class AllRatesTodayError(Exception):
    """Error from the AllRatesToday API.

    Attributes:
        status: HTTP status code (when available).
    """

    def __init__(self, message: str, status: Optional[int] = None):
        super().__init__(message)
        self.status = status


class AllRatesToday:
    """Official Python client for the AllRatesToday exchange rate API.

    The most elegant way to access real-time mid-market exchange rates in Python.

    Args:
        api_key: Your API key (from https://allratestoday.com/register).
        base_url: API base URL. Defaults to https://allratestoday.com.
        timeout: Request timeout in seconds. Defaults to 10.

    Example::

        from allratestoday import AllRatesToday

        client = AllRatesToday(api_key="art_live_...")

        # Get latest rates
        data = client.latest(base="USD", symbols=["EUR", "GBP"])
        print(data["rates"])  # {"EUR": 0.9234, "GBP": 0.7891}

        # Convert amount
        result = client.convert("USD", "EUR", 1000)
        print(f"$1,000 = €{result['result']}")
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT,
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _resolve_key(self, override: Optional[str] = None) -> str:
        key = override or self.api_key
        if not key:
            raise AllRatesTodayError(
                "API key is required. Register for free at https://allratestoday.com/register"
            )
        return key

    def _request(
        self,
        path: str,
        params: Optional[Dict[str, str]] = None,
        api_key_override: Optional[str] = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        if params:
            query = urllib.parse.urlencode(
                {k: v for k, v in params.items() if v is not None and v != ""}
            )
            url = f"{url}?{query}"

        req = urllib.request.Request(url)
        key = api_key_override or self.api_key
        if key:
            req.add_header("Authorization", f"Bearer {key}")

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

    @staticmethod
    def _format_date(d: Union[str, date, datetime]) -> str:
        if isinstance(d, (date, datetime)):
            return d.strftime("%Y-%m-%d")
        return d

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def latest(
        self,
        base: str = "USD",
        symbols: Optional[List[str]] = None,
        *,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get the latest exchange rates.

        Args:
            base: Base currency code. Default: ``"USD"``.
            symbols: List of target currency codes. If omitted, returns all.
            api_key: Override the API key for this request only.

        Returns:
            dict with ``base``, ``date``, and ``rates``.

        Example::

            data = client.latest(base="EUR", symbols=["USD", "GBP", "JPY"])
            print(data["rates"])  # {"USD": 1.083, "GBP": 0.8546, "JPY": 163.92}
        """
        key = self._resolve_key(api_key)
        params: Dict[str, str] = {"source": base}
        if symbols:
            params["target"] = ",".join(symbols)
        raw = self._request("/api/v1/rates", params, key)
        rates_list = raw if isinstance(raw, list) else [raw]
        rates: Dict[str, float] = {}
        d = ""
        for r in rates_list:
            rates[r["target"]] = r["rate"]
            if r.get("time"):
                d = r["time"]
        return {"base": base, "date": d, "rates": rates}

    def for_date(
        self,
        date: Union[str, "date", datetime],
        base: str = "USD",
        symbols: Optional[List[str]] = None,
        *,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get exchange rates for a specific historical date.

        Args:
            date: Target date (``"YYYY-MM-DD"`` string, ``date``, or ``datetime``).
            base: Base currency code. Default: ``"USD"``.
            symbols: List of target currency codes.
            api_key: Override the API key for this request only.

        Returns:
            dict with ``base``, ``date``, and ``rates``.

        Example::

            # Using a string
            data = client.for_date("2026-01-15")

            # Using a date object
            from datetime import date
            data = client.for_date(date(2026, 1, 15), base="EUR", symbols=["USD"])
        """
        key = self._resolve_key(api_key)
        date_str = self._format_date(date)
        params: Dict[str, str] = {
            "source": base,
            "from": date_str,
            "to": date_str,
        }
        if symbols:
            params["target"] = ",".join(symbols)
        raw = self._request("/api/historical-rates", params, key)
        rates: Dict[str, float] = {}
        if raw.get("rates"):
            for r in raw["rates"]:
                rates[raw["target"]] = r["rate"]
        if raw.get("current"):
            rates[raw["target"]] = raw["current"]["rate"]
        return {"base": base, "date": date_str, "rates": rates}

    def time_series(
        self,
        start_date: Union[str, "date", datetime],
        end_date: Union[str, "date", datetime],
        base: str = "USD",
        symbols: Optional[List[str]] = None,
        *,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get exchange rate time series between two dates.

        Args:
            start_date: Start of the range (``"YYYY-MM-DD"``, ``date``, or ``datetime``).
            end_date: End of the range (``"YYYY-MM-DD"``, ``date``, or ``datetime``).
            base: Base currency code. Default: ``"USD"``.
            symbols: List of target currency codes.
            api_key: Override the API key for this request only.

        Returns:
            dict with ``base``, ``start_date``, ``end_date``, and ``rates`` grouped by date.

        Example::

            data = client.time_series("2026-01-01", "2026-03-31", symbols=["EUR"])
            print(data["rates"]["2026-01-15"])  # {"EUR": 0.9187}
        """
        key = self._resolve_key(api_key)
        start = self._format_date(start_date)
        end = self._format_date(end_date)
        params: Dict[str, str] = {
            "source": base,
            "from": start,
            "to": end,
        }
        if symbols:
            params["target"] = ",".join(symbols)
        raw = self._request("/api/historical-rates", params, key)
        rates: Dict[str, Dict[str, float]] = {}
        if raw.get("rates"):
            for point in raw["rates"]:
                date_key = point["time"].split("T")[0]
                if date_key not in rates:
                    rates[date_key] = {}
                rates[date_key][raw["target"]] = point["rate"]
        return {"base": base, "start_date": start, "end_date": end, "rates": rates}

    def symbols(
        self,
        *,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get all supported currency codes and their full names.

        Args:
            api_key: Override the API key for this request only.

        Returns:
            dict with ``symbols`` mapping currency codes to names.

        Example::

            data = client.symbols()
            print(data["symbols"]["USD"])  # "United States Dollar"

            # Build a currency list
            for code, name in data["symbols"].items():
                print(f"{code}: {name}")
        """
        key = self._resolve_key(api_key)
        return self._request("/api/v1/symbols", {}, key)

    def get_rate(
        self,
        from_currency: str,
        to_currency: str,
        amount: Optional[float] = None,
        *,
        api_key: Optional[str] = None,
    ) -> Any:
        """Get exchange rate between two currencies.

        Args:
            from_currency: Source currency code (e.g., ``"USD"``).
            to_currency: Target currency code (e.g., ``"EUR"``).
            amount: Optional amount to convert. Defaults to 1.
            api_key: Override the API key for this request only.

        Returns:
            dict with rate data.

        Example::

            rate = client.get_rate("USD", "EUR")
            print(f"1 USD = {rate['rate']} EUR")
        """
        key = self._resolve_key(api_key)
        params: Dict[str, str] = {"source": from_currency, "target": to_currency}
        if amount is not None:
            params["amount"] = str(amount)
        return self._request("/api/v1/rates", params, key)

    def get_rates(
        self,
        source: str,
        target: str,
        *,
        api_key: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get authenticated exchange rates with metadata.

        Args:
            source: Source currency code.
            target: Target currency code.
            api_key: Override the API key for this request only.

        Returns:
            List of rate objects with ``rate``, ``source``, ``target``, ``time``.
        """
        key = self._resolve_key(api_key)
        return self._request("/api/v1/rates", {"source": source, "target": target}, key)

    def get_historical_rates(
        self,
        source: str,
        target: str,
        period: str = "7d",
        *,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get historical rates by preset period.

        Args:
            source: Source currency code.
            target: Target currency code.
            period: Time period — ``"1d"``, ``"7d"``, ``"30d"``, or ``"1y"``.
            api_key: Override the API key for this request only.

        Returns:
            dict with ``current``, ``rates``, ``source``, ``target``, ``period``.

        Example::

            history = client.get_historical_rates("USD", "EUR", "30d")
            for point in history["rates"]:
                print(f"{point['time']}: {point['rate']}")
        """
        key = self._resolve_key(api_key)
        return self._request(
            "/api/historical-rates",
            {"source": source, "target": target, "period": period},
            key,
        )

    def convert(
        self,
        from_currency: str,
        to_currency: str,
        amount: float,
        date: Optional[Union[str, "date", datetime]] = None,
        *,
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Convert an amount from one currency to another.

        Supports both current and historical conversions.

        Args:
            from_currency: Source currency code.
            to_currency: Target currency code.
            amount: Amount to convert.
            date: Optional historical date (``"YYYY-MM-DD"``, ``date``, or ``datetime``).
            api_key: Override the API key for this request only.

        Returns:
            dict with ``from``, ``to``, ``amount``, ``result``, ``rate``, and optionally ``date``.

        Example::

            # Current conversion
            result = client.convert("USD", "EUR", 1000)
            print(f"$1,000 = €{result['result']}")

            # Historical conversion
            result = client.convert("USD", "EUR", 1000, date="2026-01-15")
            print(f"Rate on Jan 15: {result['rate']}")
        """
        key = self._resolve_key(api_key)

        if date is not None:
            date_str = self._format_date(date)
            params: Dict[str, str] = {
                "source": from_currency,
                "target": to_currency,
                "from": date_str,
                "to": date_str,
            }
            raw = self._request("/api/historical-rates", params, key)
            rate = 0.0
            if raw.get("current"):
                rate = raw["current"]["rate"]
            elif raw.get("rates"):
                rate = raw["rates"][0]["rate"]
            return {
                "from": from_currency,
                "to": to_currency,
                "amount": amount,
                "result": round(amount * rate, 6),
                "rate": rate,
                "date": date_str,
            }

        data = self._request(
            "/api/v1/rates",
            {"source": from_currency, "target": to_currency, "amount": str(amount)},
            key,
        )
        return {
            "from": from_currency,
            "to": to_currency,
            "amount": amount,
            "result": data["to"]["amount"],
            "rate": data["rate"],
        }
