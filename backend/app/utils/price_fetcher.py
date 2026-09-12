"""
Utility for fetching current market prices for material categories.

- Tries a public commodity-price endpoint (placeholder URL).
- Falls back to sensible per-category defaults when the external service
  is unreachable or returns unexpected data.
- Simple in-process cache (5-minute TTL) to limit repeated calls.
"""

import time
from typing import Dict, Optional

# Cache structure: {category: (price, timestamp)}
_PRICE_CACHE: Dict[str, tuple] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes

# Default INR prices per kg for each material category (conservative market estimates)
_DEFAULT_PRICES: Dict[str, float] = {
    "Cardboard": 16.0,
    "Paper":     18.0,
    "Plastic":   22.0,
    "Pallets":   12.0,
}
_FALLBACK_PRICE = 16.0  # generic fallback


def _fetch_from_api(category: str) -> Optional[float]:
    """Attempt to retrieve the price from an external API.
    Replace the URL and parsing logic with a real provider when available.
    """
    try:
        import httpx
        url = f"https://public-commodity-api.example.com/price?category={category.lower()}"
        resp = httpx.get(url, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            price = float(data.get("price_per_kg", 0))
            if price > 0:
                return price
    except Exception as exc:
        # Safe ASCII-only print to avoid Windows console encoding issues
        msg = f"[PriceFetcher] API unavailable for '{category}': {exc}"
        print(msg.encode("ascii", "replace").decode("ascii"))
    return None


def get_market_price(category: str) -> float:
    """Public entry-point used by the simulator.

    Returns the latest market price for *category* (per kg, INR).
    If the external call fails, returns a per-category default and logs a safe message.
    """
    now = time.time()
    cached = _PRICE_CACHE.get(category)
    if cached and now - cached[1] < _CACHE_TTL_SECONDS:
        return cached[0]

    price = _fetch_from_api(category)
    if price is None or price <= 0:
        price = _DEFAULT_PRICES.get(category, _FALLBACK_PRICE)
        print(f"[PriceFetcher] Using default price for '{category}': {price} INR/kg")

    _PRICE_CACHE[category] = (price, now)
    return price
