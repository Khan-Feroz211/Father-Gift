from typing import Optional

import redis.asyncio as aioredis
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

REFRESH_TOKEN_PREFIX = "refresh_token:"


class CacheService:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
        return self._redis

    async def cache_set(self, key: str, value: str, ttl: int = 300) -> None:
        try:
            r = await self.get_redis()
            await r.setex(key, ttl, value)
        except Exception as exc:
            logger.warning("cache_set_failed", key=key, error=str(exc))

    async def cache_get(self, key: str) -> Optional[str]:
        try:
            r = await self.get_redis()
            return await r.get(key)
        except Exception as exc:
            logger.warning("cache_get_failed", key=key, error=str(exc))
            return None

    async def cache_delete(self, key: str) -> None:
        try:
            r = await self.get_redis()
            await r.delete(key)
        except Exception as exc:
            logger.warning("cache_delete_failed", key=key, error=str(exc))

    async def rate_limit_check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Returns True if the request is allowed, False if rate limited."""
        try:
            r = await self.get_redis()
            current = await r.incr(key)
            if current == 1:
                await r.expire(key, window_seconds)
            return current <= max_requests
        except Exception as exc:
            logger.warning("rate_limit_check_failed", key=key, error=str(exc))
            return True  # Fail open

    async def store_refresh_token(self, user_id: str, token: str) -> None:
        try:
            r = await self.get_redis()
            key = f"{REFRESH_TOKEN_PREFIX}{user_id}"
            ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
            await r.setex(key, ttl, token)
        except Exception as exc:
            logger.warning("store_refresh_token_failed", user_id=user_id, error=str(exc))

    async def validate_refresh_token(self, user_id: str, token: str) -> bool:
        try:
            r = await self.get_redis()
            key = f"{REFRESH_TOKEN_PREFIX}{user_id}"
            stored = await r.get(key)
            return stored == token
        except Exception as exc:
            logger.warning("validate_refresh_token_failed", user_id=user_id, error=str(exc))
            return False

    async def revoke_refresh_token(self, user_id: str) -> None:
        try:
            r = await self.get_redis()
            await r.delete(f"{REFRESH_TOKEN_PREFIX}{user_id}")
        except Exception as exc:
            logger.warning("revoke_refresh_token_failed", user_id=user_id, error=str(exc))


cache_service = CacheService()
