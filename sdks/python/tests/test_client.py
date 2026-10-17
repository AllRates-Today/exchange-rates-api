"""Tests for the AllRatesToday Python SDK."""

import json
import urllib.error
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

from allratestoday import AllRatesToday, AllRatesTodayError

API_KEY = "test_api_key_123"


def days_ago(n):
    """ISO date ``n`` days before today (history windows end today)."""
    return (datetime.now(timezone.utc).date() - timedelta(days=n)).isoformat()


def history(*points):
    """Live /api/historical-rates shape: {data: [{date, rate, timestamp}]}."""
    return {
        "source": "USD", "target": "EUR", "period": "7d", "source_api": "mid-market",
        "data": [
            {"date": d, "rate": r, "timestamp": int(datetime.fromisoformat(d).replace(tzinfo=timezone.utc).timestamp() * 1000)}
            for d, r in points
        ],
    }


def mock_response(body, status=200):
    """Create a mock urllib response."""
    resp = MagicMock()
    resp.read.return_value = json.dumps(body).encode()
    resp.__enter__ = MagicMock(return_value=resp)
    resp.__exit__ = MagicMock(return_value=False)
    return resp


def mock_http_error(body, status):
    """Create a mock HTTPError."""
    return urllib.error.HTTPError(
        url="https://allratestoday.com/api/v1/rates",
        code=status,
        msg=f"HTTP {status}",
        hdrs=None,
        fp=BytesIO(json.dumps(body).encode()),
    )


def mock_http_error_bad_json(status):
    """Create a mock HTTPError with non-JSON body."""
    return urllib.error.HTTPError(
        url="https://allratestoday.com/api/v1/rates",
        code=status,
        msg=f"HTTP {status}",
        hdrs=None,
        fp=BytesIO(b"not json"),
    )


@pytest.fixture
def client():
    return AllRatesToday(api_key=API_KEY)


# ---------------------------------------------------------------------------
# Constructor
# ---------------------------------------------------------------------------


class TestConstructor:
    def test_default_options(self):
        c = AllRatesToday()
        assert c.api_key is None
        assert c.base_url == "https://allratestoday.com"
        assert c.timeout == 10

    def test_custom_options(self):
        c = AllRatesToday(
            api_key="key", base_url="https://custom.api.com/", timeout=5
        )
        assert c.api_key == "key"
        assert c.base_url == "https://custom.api.com"
        assert c.timeout == 5


# ---------------------------------------------------------------------------
# AllRatesTodayError
# ---------------------------------------------------------------------------


class TestError:
    def test_message_only(self):
        err = AllRatesTodayError("something failed")
        assert str(err) == "something failed"
        assert err.status is None

    def test_message_and_status(self):
        err = AllRatesTodayError("not found", 404)
        assert str(err) == "not found"
        assert err.status == 404


# ---------------------------------------------------------------------------
# API key validation
# ---------------------------------------------------------------------------


class TestApiKeyValidation:
    def test_latest_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.latest()

    def test_get_rate_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.get_rate("USD", "EUR")

    def test_get_rates_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.get_rates("USD", "EUR")

    def test_get_historical_rates_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.get_historical_rates("USD", "EUR")

    def test_convert_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.convert("USD", "EUR", 100)

    def test_for_date_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.for_date("2026-01-15")

    def test_time_series_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.time_series("2026-01-01", "2026-03-31")

    def test_symbols_without_key(self):
        c = AllRatesToday()
        with pytest.raises(AllRatesTodayError, match="API key is required"):
            c.symbols()


# ---------------------------------------------------------------------------
# Per-request API key override
# ---------------------------------------------------------------------------


class TestApiKeyOverride:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_latest_override(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(
            [{"rate": 0.92, "source": "USD", "target": "EUR", "time": "2026-04-09T14:00:00Z"}]
        )
        no_key_client = AllRatesToday()
        no_key_client.latest(api_key="override_key")
        req = mock_urlopen.call_args[0][0]
        assert req.get_header("Authorization") == "Bearer override_key"

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_symbols_override(self, mock_urlopen):
        mock_urlopen.return_value = mock_response({"symbols": {"USD": "US Dollar"}})
        no_key_client = AllRatesToday()
        no_key_client.symbols(api_key="override_key")
        req = mock_urlopen.call_args[0][0]
        assert req.get_header("Authorization") == "Bearer override_key"

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_get_rate_override(self, mock_urlopen):
        mock_urlopen.return_value = mock_response(
            {"from": {"currency": "USD", "amount": 1}, "to": {"currency": "EUR", "amount": 0.92}, "rate": 0.92, "source": "wise"}
        )
        no_key_client = AllRatesToday()
        no_key_client.get_rate("USD", "EUR", api_key="override_key")
        req = mock_urlopen.call_args[0][0]
        assert req.get_header("Authorization") == "Bearer override_key"


# ---------------------------------------------------------------------------
# latest()
# ---------------------------------------------------------------------------


class TestLatest:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_basic(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response([
            {"rate": 0.92, "source": "USD", "target": "EUR", "time": "2026-04-09T14:00:00Z"},
            {"rate": 0.79, "source": "USD", "target": "GBP", "time": "2026-04-09T14:00:00Z"},
        ])
        result = client.latest()
        assert result["base"] == "USD"
        assert result["rates"]["EUR"] == 0.92
        assert result["rates"]["GBP"] == 0.79
        assert result["date"] == "2026-04-09T14:00:00Z"

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_with_base_and_symbols(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(
            [{"rate": 1.08, "source": "EUR", "target": "USD", "time": "2026-04-09T14:00:00Z"}]
        )
        client.latest(base="EUR", symbols=["USD", "GBP"])
        url = mock_urlopen.call_args[0][0].full_url
        assert "source=EUR" in url
        assert "target=USD%2CGBP" in url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_single_response(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(
            {"rate": 0.92, "source": "USD", "target": "EUR", "time": "2026-04-09T14:00:00Z"}
        )
        result = client.latest(symbols=["EUR"])
        assert result["rates"]["EUR"] == 0.92

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_authorization_header(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response([])
        client.latest()
        req = mock_urlopen.call_args[0][0]
        assert req.get_header("Authorization") == f"Bearer {API_KEY}"


# ---------------------------------------------------------------------------
# for_date()
# ---------------------------------------------------------------------------


class TestForDate:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_string_date(self, mock_urlopen, client):
        d = days_ago(3)
        mock_urlopen.return_value = mock_response(history((days_ago(4), 0.91), (d, 0.9187), (days_ago(2), 0.93)))
        result = client.for_date(d, symbols=["EUR"])
        assert result["date"] == d
        assert result["rates"]["EUR"] == 0.9187
        url = mock_urlopen.call_args[0][0].full_url
        assert "period=7d" in url
        assert "from=" not in url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_date_object(self, mock_urlopen, client):
        d = datetime.now(timezone.utc).date() - timedelta(days=20)
        mock_urlopen.return_value = mock_response(history((d.isoformat(), 0.92)))
        result = client.for_date(d, symbols=["EUR"])
        assert result["date"] == d.isoformat()
        assert "period=30d" in mock_urlopen.call_args[0][0].full_url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_datetime_object(self, mock_urlopen, client):
        d = datetime.now(timezone.utc) - timedelta(days=100)
        mock_urlopen.return_value = mock_response(history((d.date().isoformat(), 0.92)))
        result = client.for_date(d, symbols=["EUR"])
        assert result["date"] == d.date().isoformat()
        assert "period=1y" in mock_urlopen.call_args[0][0].full_url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_with_base_and_symbols(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(history((days_ago(1), 0.85)))
        client.for_date(days_ago(1), base="EUR", symbols=["GBP"])
        url = mock_urlopen.call_args[0][0].full_url
        assert "source=EUR" in url
        assert "target=GBP" in url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_closest_earlier_point(self, mock_urlopen, client):
        # The 1y window is weekly: a mid-week date takes the previous point.
        mock_urlopen.return_value = mock_response(history((days_ago(105), 0.90), (days_ago(98), 0.95)))
        result = client.for_date(days_ago(100), symbols=["EUR"])
        assert result["rates"]["EUR"] == 0.90

    def test_requires_symbols(self, client):
        with pytest.raises(AllRatesTodayError, match="needs symbols"):
            client.for_date(days_ago(1))

    def test_older_than_a_year(self, client):
        with pytest.raises(AllRatesTodayError, match="last 365 days"):
            client.for_date(days_ago(400), symbols=["EUR"])


# ---------------------------------------------------------------------------
# time_series()
# ---------------------------------------------------------------------------


class TestTimeSeries:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_basic(self, mock_urlopen, client):
        a, b = days_ago(20), days_ago(19)
        mock_urlopen.return_value = mock_response(history((days_ago(25), 0.9), (a, 0.9187), (b, 0.9195)))
        result = client.time_series(a, days_ago(1), symbols=["EUR"])
        assert result["base"] == "USD"
        assert result["start_date"] == a
        assert result["end_date"] == days_ago(1)
        assert result["rates"] == {a: {"EUR": 0.9187}, b: {"EUR": 0.9195}}

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_date_objects(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(history())
        today = datetime.now(timezone.utc).date()
        client.time_series(today - timedelta(days=200), today, symbols=["EUR"])
        url = mock_urlopen.call_args[0][0].full_url
        assert "period=1y" in url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_one_call_per_symbol(self, mock_urlopen, client):
        mock_urlopen.side_effect = [
            mock_response(history((days_ago(2), 0.85))),
            mock_response(history((days_ago(2), 1.1))),
        ]
        result = client.time_series(days_ago(5), days_ago(0), base="EUR", symbols=["GBP", "USD"])
        urls = [c[0][0].full_url for c in mock_urlopen.call_args_list]
        assert len(urls) == 2
        assert "source=EUR" in urls[0] and "target=GBP" in urls[0]
        assert "target=USD" in urls[1]
        assert result["rates"][days_ago(2)] == {"GBP": 0.85, "USD": 1.1}

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_empty_rates(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(history())
        result = client.time_series(days_ago(5), days_ago(0), symbols=["EUR"])
        assert result["rates"] == {}


# ---------------------------------------------------------------------------
# symbols()
# ---------------------------------------------------------------------------


class TestSymbols:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_basic(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response({
            "currencies": [
                {"code": "USD", "name": "United States Dollar", "symbol": "$"},
                {"code": "EUR", "name": "Euro", "symbol": "€"},
            ],
            "count": 2,
        })
        result = client.symbols()
        assert result["symbols"] == {"USD": "United States Dollar", "EUR": "Euro"}

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_correct_endpoint(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response({"currencies": [], "count": 0})
        client.symbols()
        url = mock_urlopen.call_args[0][0].full_url
        assert "/api/v1/symbols" in url


# ---------------------------------------------------------------------------
# get_rate()
# ---------------------------------------------------------------------------


class TestGetRate:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_without_amount_normalises_list(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response([
            {"rate": 0.9234, "source": "USD", "target": "EUR", "time": "2026-04-09T14:00:00+0000"}
        ])
        result = client.get_rate("USD", "EUR")
        assert result == {
            "from": {"currency": "USD", "amount": 1},
            "to": {"currency": "EUR", "amount": 0.9234},
            "rate": 0.9234,
            "source": "mid-market",
        }

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_basic(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response({
            "from": {"currency": "USD", "amount": 1},
            "to": {"currency": "EUR", "amount": 0.9234},
            "rate": 0.9234, "source": "wise",
        })
        result = client.get_rate("USD", "EUR")
        assert result["rate"] == 0.9234

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_with_amount(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response({
            "from": {"currency": "USD", "amount": 500},
            "to": {"currency": "EUR", "amount": 461.7},
            "rate": 0.9234, "source": "wise",
        })
        client.get_rate("USD", "EUR", 500)
        url = mock_urlopen.call_args[0][0].full_url
        assert "amount=500" in url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_url_params(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response({
            "from": {"currency": "GBP", "amount": 1},
            "to": {"currency": "JPY", "amount": 191.89},
            "rate": 191.89, "source": "wise",
        })
        client.get_rate("GBP", "JPY")
        url = mock_urlopen.call_args[0][0].full_url
        assert "source=GBP" in url
        assert "target=JPY" in url


# ---------------------------------------------------------------------------
# get_rates()
# ---------------------------------------------------------------------------


class TestGetRates:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_basic(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response([
            {"rate": 0.9234, "source": "USD", "target": "EUR", "time": "2026-04-09T14:00:00Z"}
        ])
        result = client.get_rates("USD", "EUR")
        assert len(result) == 1
        assert result[0]["rate"] == 0.9234


# ---------------------------------------------------------------------------
# get_historical_rates()
# ---------------------------------------------------------------------------


class TestGetHistoricalRates:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_default_period(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(history((days_ago(1), 0.9234), (days_ago(7), 0.9198)))
        result = client.get_historical_rates("USD", "EUR")
        assert result["period"] == "7d"
        assert result["current"] == {"rate": 0.9234, "time": days_ago(1)}
        assert [p["rate"] for p in result["rates"]] == [0.9198, 0.9234]

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_custom_period(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(history())
        result = client.get_historical_rates("USD", "EUR", "30d")
        url = mock_urlopen.call_args[0][0].full_url
        assert "period=30d" in url
        assert result["current"] == {"rate": 0, "time": ""}


# ---------------------------------------------------------------------------
# convert()
# ---------------------------------------------------------------------------


class TestConvert:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_current(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response({
            "from": {"currency": "USD", "amount": 1000},
            "to": {"currency": "EUR", "amount": 923.4},
            "rate": 0.9234, "source": "wise",
        })
        result = client.convert("USD", "EUR", 1000)
        assert result["from"] == "USD"
        assert result["to"] == "EUR"
        assert result["amount"] == 1000
        assert result["result"] == 923.4
        assert result["rate"] == 0.9234
        assert "date" not in result

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_historical_string_date(self, mock_urlopen, client):
        d = days_ago(10)
        mock_urlopen.return_value = mock_response(history((d, 0.9187), (days_ago(9), 0.95)))
        result = client.convert("USD", "EUR", 1000, date=d)
        assert result["rate"] == 0.9187
        assert result["result"] == 918.7
        assert result["date"] == d

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_historical_date_object(self, mock_urlopen, client):
        d = datetime.now(timezone.utc).date() - timedelta(days=3)
        mock_urlopen.return_value = mock_response(history((d.isoformat(), 0.92)))
        result = client.convert("USD", "EUR", 500, date=d)
        assert result["date"] == d.isoformat()
        assert result["amount"] == 500
        assert result["result"] == 460.0

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_no_data_raises(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response(history())
        with pytest.raises(AllRatesTodayError, match="No USD/EUR rate"):
            client.convert("USD", "EUR", 100, date=days_ago(2))


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------


class TestErrorHandling:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_http_error_with_json(self, mock_urlopen, client):
        mock_urlopen.side_effect = mock_http_error({"error": "Currency not found"}, 404)
        with pytest.raises(AllRatesTodayError) as exc_info:
            client.get_rate("USD", "INVALID")
        assert exc_info.value.status == 404
        assert "Currency not found" in str(exc_info.value)

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_http_error_bad_json(self, mock_urlopen, client):
        mock_urlopen.side_effect = mock_http_error_bad_json(500)
        with pytest.raises(AllRatesTodayError) as exc_info:
            client.latest()
        assert exc_info.value.status == 500
        assert "HTTP 500" in str(exc_info.value)

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_401_unauthorized(self, mock_urlopen, client):
        mock_urlopen.side_effect = mock_http_error({"error": "Invalid API key"}, 401)
        with pytest.raises(AllRatesTodayError) as exc_info:
            client.latest()
        assert exc_info.value.status == 401

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_429_rate_limit(self, mock_urlopen, client):
        mock_urlopen.side_effect = mock_http_error({"error": "Rate limit exceeded"}, 429)
        with pytest.raises(AllRatesTodayError) as exc_info:
            client.latest()
        assert exc_info.value.status == 429

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_connection_error(self, mock_urlopen, client):
        mock_urlopen.side_effect = urllib.error.URLError("Connection refused")
        with pytest.raises(AllRatesTodayError, match="Connection error"):
            client.latest()


# ---------------------------------------------------------------------------
# Request construction
# ---------------------------------------------------------------------------


class TestRequestConstruction:
    @patch("allratestoday.client.urllib.request.urlopen")
    def test_custom_base_url(self, mock_urlopen):
        custom_client = AllRatesToday(api_key=API_KEY, base_url="https://custom.api.com")
        mock_urlopen.return_value = mock_response({"symbols": {}})
        custom_client.symbols()
        url = mock_urlopen.call_args[0][0].full_url
        assert "https://custom.api.com" in url

    @patch("allratestoday.client.urllib.request.urlopen")
    def test_timeout_passed(self, mock_urlopen, client):
        mock_urlopen.return_value = mock_response([])
        client.latest()
        assert mock_urlopen.call_args[1]["timeout"] == 10
