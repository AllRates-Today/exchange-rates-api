"""Official central-bank and tax-authority exchange rates, from AllRatesToday.

Unlike a market rate, these are the rates a named institution published: fixed
once published, carrying the publisher's own date. They are what tax returns,
customs valuations and statutory accounting require.

The latest published table of any source is available without an API key.
"""

from .client import CentralBankRates, CentralBankError

try:
    from importlib.metadata import version as _version

    __version__ = _version("allratestoday-central-bank")
except Exception:  # pragma: no cover - running from a checkout, not installed
    __version__ = "0.0.0.dev0"

__all__ = ["CentralBankRates", "CentralBankError", "__version__"]
