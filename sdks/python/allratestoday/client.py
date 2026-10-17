"""AllRatesToday API client."""

from datetime import date, datetime, timezone
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

    @staticmethod
    def _window_for(start: str) -> str:
        """The history endpoint serves fixed windows ending today (7d, 30d, 1y)
        and one target per call, so pick the smallest window that reaches ``start``."""
        try:
            days = (datetime.now(timezone.utc).date() - datetime.strptime(start, "%Y-%m-%d").date()).days
        except ValueError:
            raise AllRatesTodayError(f"Invalid date: {start}. Use YYYY-MM-DD.")
        if days < 0:
            raise AllRatesTodayError(f"Date {start} is in the future.")
        if days <= 6:
            return "7d"
        if days <= 29:
            return "30d"
        if days <= 364:
            return "1y"
        raise AllRatesTodayError(
            f"Historical market rates cover the last 365 days; {start} is older."
        )

    @staticmethod
    def _require_symbols(symbols: Optional[List[str]], method: str) -> List[str]:
        if not symbols:
            raise AllRatesTodayError(f"{method}() needs symbols, e.g. symbols=['EUR'].")
        return symbols

    def _history_points(
        self, source: str, target: str, period: str, key: str
    ) -> List[Dict[str, Any]]:
        raw = self._request(
            "/api/historical-rates",
            {"source": source, "target": target, "period": period},
            key,
        )
        return sorted(raw.get("data") or [], key=lambda p: p["timestamp"])

    def _rate_on(self, source: str, target: str, day: str, key: str) -> Optional[float]:
        """Rate on ``day``, or the closest earlier point (the 1y window is weekly)."""
        rate = None
        for p in self._history_points(source, target, self._window_for(day), key):
            if p["date"][:10] > day:
                break
            rate = p["rate"]
        return rate

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

        Paid plans only: free and trial keys get a 403
        ``historical_requires_paid_plan`` error.

        Args:
            date: Target date (``"YYYY-MM-DD"`` string, ``date``, or ``datetime``).
            base: Base currency code. Default: ``"USD"``.
            symbols: List of target currency codes (required; one request each).
            api_key: Override the API key for this request only.

        Returns:
            dict with ``base``, ``date``, and ``rates``. Covers the last 365 days.

        Example::

            # Using a string
            data = client.for_date("2026-01-15", symbols=["EUR"])

            # Using a date object
            from datetime import date
            data = client.for_date(date(2026, 1, 15), base="EUR", symbols=["USD"])
        """
        key = self._resolve_key(api_key)
        date_str = self._format_date(date)
        rates: Dict[str, float] = {}
        for target in self._require_symbols(symbols, "for_date"):
            rate = self._rate_on(base, target, date_str, key)
            if rate is not None:
                rates[target] = rate
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

        Paid plans only: free and trial keys get a 403
        ``historical_requires_paid_plan`` error.

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
        period = self._window_for(start)
        rates: Dict[str, Dict[str, float]] = {}
        for target in self._require_symbols(symbols, "time_series"):
            for point in self._history_points(base, target, period, key):
                day = point["date"][:10]
                if day < start or day > end:
                    continue
                rates.setdefault(day, {})[target] = point["rate"]
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
        # The endpoint returns {"currencies": [{"code", "name", "symbol"}], "count"}.
        raw = self._request("/api/v1/symbols", {}, key)
        return {"symbols": {c["code"]: c["name"] for c in raw.get("currencies") or []}}

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
        raw = self._request("/api/v1/rates", params, key)
        # Without ``amount`` the endpoint answers with the rates list; return the documented shape.
        if isinstance(raw, list) or "from" not in raw:
            r = raw[0] if isinstance(raw, list) and raw else raw
            if not r:
                raise AllRatesTodayError(f"No rate returned for {from_currency}/{to_currency}")
            return {
                "from": {"currency": r["source"], "amount": 1},
                "to": {"currency": r["target"], "amount": r["rate"]},
                "rate": r["rate"],
                "source": "mid-market",
            }
        return raw

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

        Paid plans only: free and trial keys get a 403
        ``historical_requires_paid_plan`` error.

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
        # The endpoint returns {"data": [{"date", "rate", "timestamp"}]}; map it to rates / current.
        points = self._history_points(source, target, period, key)
        rates = [{"rate": p["rate"], "time": p["date"]} for p in points]
        return {
            "source": source,
            "target": target,
            "period": period,
            "current": rates[-1] if rates else {"rate": 0, "time": ""},
            "rates": rates,
        }

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

        Supports both current and historical conversions; a ``date`` needs a
        paid plan (free and trial keys get a 403 ``historical_requires_paid_plan``).

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
            rate = self._rate_on(from_currency, to_currency, date_str, key)
            if rate is None:
                raise AllRatesTodayError(
                    f"No {from_currency}/{to_currency} rate available on or before {date_str}"
                )
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
