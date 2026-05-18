"""
Redis Cache Service — ProcureAI
================================
• Connects to Redis (Upstash or local) on startup.
• Falls back to a no-op (no crash) when Redis is unavailable so local dev
  without Redis still works — it just skips caching.
• All cache keys are namespaced: "procureai:{key}"
• TTLs are defined per data category so stale data is never served too long.

Cache TTL strategy
------------------
  READ-HEAVY / rarely changes   → 300 s  (5 min)  e.g. products, suppliers list
  COMPUTED / aggregations       → 120 s  (2 min)  e.g. analytics, insights
  REAL-TIME / user-specific     →  30 s  (30 sec) e.g. notifications, PO status
  STATIC / config               → 600 s  (10 min) e.g. departments, categories

Cache invalidation strategy
---------------------------
  When a WRITE happens (POST/PATCH/DELETE), the router calls
  `cache.invalidate_pattern("products:*")` which deletes all keys
  matching that prefix so the next GET always fetches fresh data.
"""

import os
import json
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ─── TTL constants (seconds) ──────────────────────────────────────────────────
TTL_LIST       = 300   # product/supplier/inventory/requisition/PO lists
TTL_ANALYTICS  = 120   # spend charts, KPIs — re-computed regularly
TTL_INSIGHTS   = 120   # AI insight summaries
TTL_REALTIME   = 30    # notifications, PO pending count
TTL_STATIC     = 600   # departments, categories, company config

NAMESPACE = "procureai"


class RedisCache:
    """Thin async-compatible Redis wrapper with graceful fallback."""

    def __init__(self):
        self._client = None
        self._available = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    def connect(self):
        """Call once at app startup (synchronous — redis-py is sync by default)."""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            import redis
            client = redis.Redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=False,
            )
            client.ping()          # raises if Redis is not reachable
            self._client = client
            self._available = True
            logger.info(f"✅ Redis connected: {redis_url.split('@')[-1]}")
        except Exception as exc:
            self._available = False
            logger.warning(
                f"⚠️  Redis not available ({exc}). "
                "Running WITHOUT server-side cache — all reads hit Neon DB directly."
            )

    def close(self):
        if self._client:
            try:
                self._client.close()
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Key helpers
    # ------------------------------------------------------------------
    def _key(self, key: str) -> str:
        return f"{NAMESPACE}:{key}"

    # ------------------------------------------------------------------
    # Core operations
    # ------------------------------------------------------------------
    def get(self, key: str) -> Optional[Any]:
        """Return deserialized value or None on miss / unavailable."""
        if not self._available:
            return None
        try:
            raw = self._client.get(self._key(key))
            if raw is None:
                return None
            logger.debug(f"🟢 Cache HIT  → {key}")
            return json.loads(raw)
        except Exception as exc:
            logger.warning(f"Redis GET error ({key}): {exc}")
            return None

    def set(self, key: str, value: Any, ttl: int = TTL_LIST) -> bool:
        """Serialize and store value. Returns True on success."""
        if not self._available:
            return False
        try:
            self._client.setex(self._key(key), ttl, json.dumps(value, default=str))
            logger.debug(f"🔵 Cache SET  → {key} (ttl={ttl}s)")
            return True
        except Exception as exc:
            logger.warning(f"Redis SET error ({key}): {exc}")
            return False

    def delete(self, key: str) -> bool:
        """Delete a single key."""
        if not self._available:
            return False
        try:
            self._client.delete(self._key(key))
            logger.debug(f"🔴 Cache DEL  → {key}")
            return True
        except Exception as exc:
            logger.warning(f"Redis DEL error ({key}): {exc}")
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a glob pattern.
        E.g. invalidate_pattern("products:*") clears every products key.
        Returns the number of keys deleted.
        """
        if not self._available:
            return 0
        try:
            full_pattern = self._key(pattern)
            keys = self._client.keys(full_pattern)
            if keys:
                deleted = self._client.delete(*keys)
                logger.info(f"🔴 Cache INVALIDATE → {pattern}  ({deleted} keys)")
                return deleted
            return 0
        except Exception as exc:
            logger.warning(f"Redis INVALIDATE error ({pattern}): {exc}")
            return 0

    def invalidate_many(self, patterns: list[str]) -> None:
        """Invalidate multiple patterns at once (e.g. after a write that
        affects several collections)."""
        for p in patterns:
            self.invalidate_pattern(p)

    @property
    def available(self) -> bool:
        return self._available


# ─── Singleton — import this everywhere ──────────────────────────────────────
cache = RedisCache()
