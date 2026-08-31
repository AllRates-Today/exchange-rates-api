"""Tests for the central-bank rates client."""

import json
import urllib.error
from datetime import date
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

from allratestoday_central_bank import CentralBankRates, CentralBankError
from allratestoday_central_bank.client import NeedsApiKeyError

OPEN = "allratestoday_central_bank.client.urllib.request.urlopen"


def _resp(payload):
    m = MagicMock()
    m.read.return_value = json.dumps(payload).encode()
    m.__enter__ = lambda s: s
    m.__exit__ = lambda *a: None
    return m


def _captured_request(mock_urlopen):
    return mock_urlopen.call_args[0][0]


# --- keyless behaviour -------------------------------------------------------


def test_keyless_by_default():
    assert CentralBankRates().keyless is True
    assert CentralBankRates(api_key="k").keyless is False


def test_latest_works_without_a_key_and_sends_no_auth_header():
    with patch(OPEN) as m:
        m.return_value = _resp({"bank": "ecb", "rate_date": "2026-08-28", "rates": []})
        out = CentralBankRates().latest("ecb")

    req = _captured_request(m)
    assert "/api/open/central-bank/ecb" in req.full_url
    assert req.get_header("Authorization") is None
    assert out["bank"] == "ecb"


def test_latest_narrows_to_a_pair_and_uppercases_codes():
    with patch(OPEN) as m:
        m.return_value = _resp({"rate": 0.86})
        CentralBankRates().latest("ecb", source="usd", target="eur")

    url = _captured_request(m).full_url
    assert "source=USD" in url and "target=EUR" in url


def test_latest_lowercases_the_bank_code():
    with patch(OPEN) as m:
        m.return_value = _resp({"bank": "ecb"})
        CentralBankRates().latest("ECB")

    assert "/api/open/central-bank/ecb" in _captured_request(m).full_url


@pytest.mark.parametrize(
    "call",
    [
        lambda c: c.sources(),
        lambda c: c.for_date("ecb", "2026-01-15"),
        lambda c: c.history("ecb", symbol="USD"),
        lambda c: c.availability("ecb", year=2026),
        lambda c: c.compare("USD", "EUR"),
    ],
)
def test_metered_calls_explain_how_to_get_a_key_without_calling_out(call):
    with patch(OPEN) as m:
        with pytest.raises(NeedsApiKeyError, match="register"):
            call(CentralBankRates())
    m.assert_not_called()


def test_needs_api_key_error_is_a_central_bank_error():
    # Callers catching the base class must not miss this one.
    assert issubclass(NeedsApiKeyError, CentralBankError)


# --- authenticated behaviour -------------------------------------------------


def test_key_is_sent_as_a_bearer_token():
    with patch(OPEN) as m:
        m.return_value = _resp({"banks": []})
        CentralBankRates(api_key="art_live_x").sources()

    assert _captured_request(m).get_header("Authorization") == "Bearer art_live_x"


def test_for_date_builds_the_dated_path():
    with patch(OPEN) as m:
        m.return_value = _resp({"rate_date": "2026-01-15"})
        CentralBankRates(api_key="k").for_date("ecb", "2026-01-15")

    assert "/api/v1/central-bank/ecb/2026-01-15" in _captured_request(m).full_url


def test_for_date_accepts_a_date_object():
    with patch(OPEN) as m:
        m.return_value = _resp({})
        CentralBankRates(api_key="k").for_date("boj", date(2026, 3, 14))

    assert "/api/v1/central-bank/boj/2026-03-14" in _captured_request(m).full_url


def test_history_passes_the_window():
    with patch(OPEN) as m:
        m.return_value = _resp({})
        CentralBankRates(api_key="k").history(
            "ecb", symbol="usd", from_date=date(2026, 1, 1), to_date="2026-03-31"
        )

    url = _captured_request(m).full_url
    assert "/api/v1/central-bank/ecb/history" in url
    assert "symbol=USD" in url and "from=2026-01-01" in url and "to=2026-03-31" in url


def test_availability_and_compare_paths():
    with patch(OPEN) as m:
        m.return_value = _resp({})
        CentralBankRates(api_key="k").availability("ecb", year=2026)
    assert "availability" in _captured_request(m).full_url
    assert "year=2026" in _captured_request(m).full_url

    with patch(OPEN) as m:
        m.return_value = _resp({})
        CentralBankRates(api_key="k").compare("usd", "eur")
    url = _captured_request(m).full_url
    assert "/api/v1/central-banks/rates" in url
    assert "source=USD" in url and "target=EUR" in url


def test_empty_params_are_dropped_from_the_query():
    with patch(OPEN) as m:
        m.return_value = _resp({})
        CentralBankRates().latest("ecb")

    assert "?" not in _captured_request(m).full_url


# --- errors ------------------------------------------------------------------


def test_http_error_surfaces_the_upstream_message_and_status():
    err = urllib.error.HTTPError(
        "u", 404, "Not Found", {}, BytesIO(json.dumps({"error": "Unknown source"}).encode())
    )
    with patch(OPEN, side_effect=err):
        with pytest.raises(CentralBankError, match="Unknown source") as e:
            CentralBankRates().latest("nope")
    assert e.value.status == 404


def test_non_json_error_body_falls_back_to_the_status_code():
    err = urllib.error.HTTPError("u", 500, "Server Error", {}, BytesIO(b"<html>down</html>"))
    with patch(OPEN, side_effect=err):
        with pytest.raises(CentralBankError, match="HTTP 500"):
            CentralBankRates().latest("ecb")


def test_connection_error_is_wrapped():
    with patch(OPEN, side_effect=urllib.error.URLError("no route")):
        with pytest.raises(CentralBankError, match="Connection error"):
            CentralBankRates().latest("ecb")


def test_base_url_override_and_trailing_slash():
    with patch(OPEN) as m:
        m.return_value = _resp({})
        CentralBankRates(base_url="https://staging.example.com/").latest("ecb")

    assert _captured_request(m).full_url.startswith(
        "https://staging.example.com/api/open/central-bank/ecb"
    )
