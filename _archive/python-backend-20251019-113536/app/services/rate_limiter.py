"""
Rate Limiter Service
Controls API usage per user with Redis-backed sliding window
"""

import redis.asyncio as redis
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded"""
    def __init__(self, message: str, retry_after: int):
        self.message = message
        self.retry_after = retry_after
        super().__init__(self.message)


# Redis connection
redis_client: Optional[redis.Redis] = None


async def get_redis():
    """Get or create Redis connection"""
    global redis_client
    if redis_client is None:
        from app.core.config import settings
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
    return redis_client


async def check_rate_limit(
    user_id: str,
    is_premium: bool = False,
    limit_per_day: int = 10
) -> None:
    """
    Check if user has exceeded rate limit

    Args:
        user_id: User ID
        is_premium: Whether user has premium subscription
        limit_per_day: Daily message limit for free users

    Raises:
        RateLimitExceeded: If rate limit exceeded
    """
    # Premium users have no limits
    if is_premium:
        return

    try:
        r = await get_redis()

        # Key for tracking daily requests
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"rate_limit:ai_chat:{user_id}:{today}"

        # Get current count
        current_count = await r.get(key)
        count = int(current_count) if current_count else 0

        logger.debug(f"Rate limit check - user: {user_id}, count: {count}/{limit_per_day}")

        # Check limit
        if count >= limit_per_day:
            # Calculate retry_after (seconds until midnight)
            now = datetime.now()
            midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            retry_after = int((midnight - now).total_seconds())

            raise RateLimitExceeded(
                f"Daily limit of {limit_per_day} messages exceeded. Upgrade to premium for unlimited access.",
                retry_after=retry_after
            )

        # Increment counter
        await r.incr(key)

        # Set expiry at midnight (if first request of the day)
        if count == 0:
            # Expire at end of day
            now = datetime.now()
            midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            expire_seconds = int((midnight - now).total_seconds())
            await r.expire(key, expire_seconds)

        logger.info(f"Rate limit OK - user: {user_id}, {count + 1}/{limit_per_day} today")

    except RateLimitExceeded:
        raise  # Re-raise rate limit errors
    except Exception as e:
        # If Redis fails, allow the request (fail open)
        logger.error(f"Rate limit check failed: {e}, allowing request")


async def get_user_usage_count(user_id: str) -> Dict[str, int]:
    """Get user's current usage count"""
    try:
        r = await get_redis()
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"rate_limit:ai_chat:{user_id}:{today}"

        current_count = await r.get(key)
        count = int(current_count) if current_count else 0

        return {
            "today": count,
            "limit": 10,
            "remaining": max(0, 10 - count)
        }
    except Exception as e:
        logger.error(f"Failed to get usage count: {e}")
        return {"today": 0, "limit": 10, "remaining": 10}


async def reset_user_rate_limit(user_id: str) -> None:
    """Reset rate limit for user (admin function)"""
    try:
        r = await get_redis()
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"rate_limit:ai_chat:{user_id}:{today}"

        await r.delete(key)
        logger.info(f"Rate limit reset for user: {user_id}")
    except Exception as e:
        logger.error(f"Failed to reset rate limit: {e}")
