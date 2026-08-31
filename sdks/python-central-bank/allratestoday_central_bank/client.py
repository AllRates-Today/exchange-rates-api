"""Client for the AllRatesToday central-bank rates API."""

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union
import json
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_BASE_URL = "https://allratestoday.com"
DEFAULT_TIMEOUT = 10

DateLike = Union[str, date, datetime]


class CentralBankError(Exception):
    """Error from the AllRatesToday API.

    Attributes:
        status: HTTP status code, when the failure came back from the server.
    """

    def __init__(self, message: str, status: Optional[int] = None):
        super().__init__(message)
        self.status = status


class NeedsApiKeyError(CentralBankError):
    """Raised for a lookup that is only served to authenticated callers.

    Carries the sign-up instructions so the message is actionable rather than a
    bare 401.
    """

    def __init__(self, what: str):
        super().__init__(
            f"{what} requires an AllRatesToday API key. The free tier covers it - "
            "register at https://allratestoday.com/register (no card), then pass "
            "api_key= when constructing the client. Without a key this client can "
            "still return the latest published table for any source."
        )


class CentralBankRates:
    """Official published exchange rates from 100+ central banks and tax authorities.

    Works without an API key: :meth:`latest` reads the open, edge-cached endpoint
    that serves each source's most recent published table. Historical dates, time
    series, publication calendars and cross-source comparison are metered and
    need a key.

    Args:
        api_key: Optional AllRatesToday API key. Free tier at
            https://allratestoday.com/register.
        base_url: API base URL. Defaults to https://allratestoday.com.
        timeout: Request timeout in seconds. Defaults to 10.

    Example::

        from allratestoday_central_bank import CentralBankRates

        cb = CentralBankRates()                       # no key needed
        table = cb.latest("ecb")                      # newest ECB table
        pair = cb.latest("ecb", source="USD", target="EUR")
        print(pair["rate"], "published", pair["rate_date"])
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

    @property
    def keyless(self) -> bool:
        """True when no API key is configured, so only open endpoints are reachable."""
        return not self.api_key

    # -------------------------------------------------------------------------
    # Plumbing
    # -------------------------------------------------------------------------

    def _request(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}{path}"
        if params:
            query = urllib.parse.urlencode(
                {k: v for k, v in params.items() if v is not None and v != ""}
            )
            if query:
                url = f"{url}?{query}"

        req = urllib.request.Request(url)
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", f"allratestoday-central-bank-python/{_ua_version()}")
        if self.api_key:
            req.add_header("Authorization", f"Bearer {self.api_key}")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            try:
                msg = json.loads(body).get("error", f"HTTP {e.code}")
            except (json.JSONDecodeError, AttributeError):
                msg = f"HTTP {e.code}"
            raise CentralBankError(msg, status=e.code) from e
        except urllib.error.URLError as e:
            raise CentralBankError(f"Connection error: {e.reason}") from e

    @staticmethod
    def _fmt_date(d: DateLike) -> str:
        if isinstance(d, (date, datetime)):
            return d.strftime("%Y-%m-%d")
        return d

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def sources(self) -> Dict[str, Any]:
        """List every covered institution, with coverage dates.

        Returns:
            ``{"banks": [{"code", "name", "country", "home_ccy", "kind",
            "rate_types", "latest_date", ...}], "disclaimer": str}``. The ``code``
            is what every other method takes as ``bank``.

        Raises:
            NeedsApiKeyError: if no API key is configured.
        """
        if self.keyless:
            raise NeedsApiKeyError("Listing sources with coverage dates")
        return self._request("/api/v1/central-banks")

    def latest(
        self,
        bank: str,
        source: Optional[str] = None,
        target: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Newest published table for one source, or one pair from it.

        Served by the open endpoint, so this works without an API key.

        Args:
            bank: Source code, e.g. ``"ecb"``, ``"fed"``, ``"boj"``, ``"hmrc"``.
            source: Optional base currency. Give both source and target for a
                single pair.
            target: Optional quote currency.

        Returns:
            The full table (``{"bank", "rate_date", "rates": [...]}``) or, with
            both currencies, a single ``{"bank", "rate_date", "rate", ...}``.
            A pair the institution does not publish directly is cross-computed
            within its own table and flagged ``"derived": True``.

        Note:
            ``rate_date`` is the publisher's own date and may be earlier than
            today: most sources publish on business days only. Record the date
            that comes back, not the date you asked for.
        """
        return self._request(
            f"/api/open/central-bank/{urllib.parse.quote(bank.lower())}",
            {
                "source": source.upper() if source else None,
                "target": target.upper() if target else None,
            },
        )

    def for_date(
        self,
        bank: str,
        on: DateLike,
        source: Optional[str] = None,
        target: Optional[str] = None,
    ) -> Dict[str, Any]:
        """The table in force on a given date.

        Weekends and holidays roll back to the last date the institution actually
        published; the returned ``rate_date`` says which.

        Args:
            bank: Source code.
            on: Date as ``YYYY-MM-DD``, :class:`datetime.date` or
                :class:`datetime.datetime`.
            source: Optional base currency.
            target: Optional quote currency.

        Raises:
            NeedsApiKeyError: if no API key is configured.
        """
        if self.keyless:
            raise NeedsApiKeyError(f"The {bank} table for a specific date")
        return self._request(
            f"/api/v1/central-bank/{urllib.parse.quote(bank.lower())}/{self._fmt_date(on)}",
            {
                "source": source.upper() if source else None,
                "target": target.upper() if target else None,
            },
        )

    def history(
        self,
        bank: str,
        symbol: Optional[str] = None,
        source: Optional[str] = None,
        target: Optional[str] = None,
        from_date: Optional[DateLike] = None,
        to_date: Optional[DateLike] = None,
    ) -> Dict[str, Any]:
        """Date-by-date official series for one pair from one institution.

        Args:
            bank: Source code.
            symbol: Currency quoted against the institution's home currency.
            source: Base currency, when specifying an explicit pair instead.
            target: Quote currency.
            from_date: Start of the window.
            to_date: End of the window.

        Note:
            History is volume-billed: one call per currency per month of data
            returned. Request the window you need.

        Raises:
            NeedsApiKeyError: if no API key is configured.
        """
        if self.keyless:
            raise NeedsApiKeyError("Historical series")
        return self._request(
            f"/api/v1/central-bank/{urllib.parse.quote(bank.lower())}/history",
            {
                "symbol": symbol.upper() if symbol else None,
                "source": source.upper() if source else None,
                "target": target.upper() if target else None,
                "from": self._fmt_date(from_date) if from_date else None,
                "to": self._fmt_date(to_date) if to_date else None,
            },
        )

    def availability(
        self,
        bank: str,
        year: Optional[int] = None,
        from_date: Optional[DateLike] = None,
        to_date: Optional[DateLike] = None,
    ) -> Dict[str, Any]:
        """Which dates an institution actually published on (no rate values).

        Useful for reconciling a period: it tells you which days have an official
        rate at all, so a gap is a publication holiday rather than missing data.

        Raises:
            NeedsApiKeyError: if no API key is configured.
        """
        if self.keyless:
            raise NeedsApiKeyError("Publication calendars")
        return self._request(
            f"/api/v1/central-bank/{urllib.parse.quote(bank.lower())}/availability",
            {
                "year": str(year) if year else None,
                "from": self._fmt_date(from_date) if from_date else None,
                "to": self._fmt_date(to_date) if to_date else None,
            },
        )

    def compare(self, source: str, target: str) -> Dict[str, Any]:
        """One currency pair as published by every institution that covers it.

        Returns each source's own number plus spread statistics — the honest way
        to see how much "the" exchange rate depends on who published it.

        Raises:
            NeedsApiKeyError: if no API key is configured.
        """
        if self.keyless:
            raise NeedsApiKeyError("Cross-source comparison")
        return self._request(
            "/api/v1/central-banks/rates",
            {"source": source.upper(), "target": target.upper()},
        )


def _ua_version() -> str:
    from . import __version__

    return __version__
