"""AllRatesToday - Official Python SDK for real-time exchange rates."""

from .client import AllRatesToday, AllRatesTodayError

try:  # Python 3.8+ has importlib.metadata; the fallback covers a source tree
    from importlib.metadata import PackageNotFoundError, version as _version

    __version__ = _version("allratestoday")
except Exception:  # pragma: no cover - not installed (running from a checkout)
    __version__ = "0.0.0.dev0"

__all__ = ["AllRatesToday", "AllRatesTodayError", "__version__"]
