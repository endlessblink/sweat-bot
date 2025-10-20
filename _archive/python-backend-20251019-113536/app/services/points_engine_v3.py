"""
Unified Points Calculation Engine v3
Single source of truth for all points calculations with YAML configuration
"""

import yaml
import json
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from pathlib import Path
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

logger = logging.getLogger(__name__)

# Configuration paths
CONFIG_DIR = Path("config/points")
EXERCISES_CONFIG = CONFIG_DIR / "exercises.yaml"
RULES_CONFIG = CONFIG_DIR / "rules.yaml"
ACHIEVEMENTS_CONFIG = CONFIG_DIR / "achievements.yaml"


class CalculationStatus(Enum):
    """Status of points calculation"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CACHED = "cached"


@dataclass
class PointsBreakdown:
    """Detailed breakdown of points calculation"""
    base_points: int = 0
    reps_points: int = 0
    sets_points: int = 0
    weight_points: int = 0
    distance_points: int = 0
    duration_points: int = 0
    bonus_points: int = 0
    multiplier_value: float = 1.0
    total_before_multiplier: int = 0
    total_points: int = 0
    applied_bonuses: List[Dict[str, Any]] = field(default_factory=list)
    applied_multipliers: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class CalculationResult:
    """Result of points calculation"""
    total_points: int
    breakdown: PointsBreakdown
    status: CalculationStatus
    calculation_time: float = 0.0
    exercise_key: str = ""
    exercise_name_he: str = ""
    applied_rules: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class PointsEngineV3:
    """Unified points calculation engine with YAML configuration"""

    def __init__(self):
        self.exercises_config: Dict[str, Any] = {}
        self.rules_config: Dict[str, Any] = {}
        self.achievements_config: Dict[str, Any] = {}
        self.cache_ttl = 3600  # 1 hour
        self._cache: Dict[str, Any] = {}
        self._redis_client = None
        self.config_loaded = False

    async def initialize(self):
        """Initialize engine by loading all configurations"""
        try:
            self.exercises_config = self._load_yaml(EXERCISES_CONFIG)
            self.rules_config = self._load_yaml(RULES_CONFIG)
            self.achievements_config = self._load_yaml(ACHIEVEMENTS_CONFIG)
            self.config_loaded = True
            logger.info("Points Engine v3 initialized successfully")
            logger.info(f"Loaded {len(self.exercises_config.get('exercises', {}))} exercises")
            logger.info(f"Loaded {len(self.rules_config.get('rules', {}))} rules")
            logger.info(f"Loaded {len(self.achievements_config.get('achievements', {}))} achievements")
        except Exception as e:
            logger.error(f"Failed to initialize Points Engine v3: {e}")
            raise

    def _load_yaml(self, file_path: Path) -> Dict[str, Any]:
        """Load YAML configuration file"""
        try:
            if not file_path.exists():
                logger.warning(f"Configuration file not found: {file_path}")
                return {}

            with open(file_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                return config or {}
        except Exception as e:
            logger.error(f"Failed to load YAML from {file_path}: {e}")
            raise

    async def _get_redis_client(self):
        """Lazy initialization of Redis client"""
        if self._redis_client is None:
            try:
                import redis.asyncio as redis
                self._redis_client = await redis.from_url(
                    "redis://localhost:8003",
                    decode_responses=True
                )
                await self._redis_client.ping()
                logger.info("Connected to Redis for points caching")
            except Exception as e:
                logger.warning(f"Redis not available, using memory cache: {e}")
                self._redis_client = False
        return self._redis_client if self._redis_client else None

    async def _cache_get(self, key: str) -> Optional[Any]:
        """Get value from cache (Redis or memory)"""
        redis = await self._get_redis_client()
        if redis:
            try:
                value = await redis.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")

        # Fallback to memory cache
        return self._cache.get(key)

    async def _cache_set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache (Redis or memory)"""
        redis = await self._get_redis_client()
        ttl = ttl or self.cache_ttl

        if redis:
            try:
                await redis.setex(key, ttl, json.dumps(value, default=str))
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")

        # Fallback to memory cache
        self._cache[key] = value

    def get_exercise_config(self, exercise_key: str) -> Optional[Dict[str, Any]]:
        """Get exercise configuration by key"""
        exercises = self.exercises_config.get('exercises', {})
        config = exercises.get(exercise_key)

        if not config:
            logger.warning(f"Exercise not found in config: {exercise_key}")
            return None

        if not config.get('enabled', True):
            logger.warning(f"Exercise is disabled: {exercise_key}")
            return None

        return config

    async def calculate_points(
        self,
        exercise_key: str,
        reps: int = 0,
        sets: int = 1,
        weight_kg: float = 0.0,
        distance_km: float = 0.0,
        duration_seconds: int = 0,
        is_personal_record: bool = False,
        user_context: Optional[Dict[str, Any]] = None
    ) -> CalculationResult:
        """
        Calculate points for an exercise with full breakdown

        Args:
            exercise_key: Unique exercise identifier
            reps: Number of repetitions
            sets: Number of sets
            weight_kg: Weight in kilograms
            distance_km: Distance in kilometers (for cardio)
            duration_seconds: Duration in seconds
            is_personal_record: Whether this is a PR
            user_context: Additional user context (streak, session count, etc.)

        Returns:
            CalculationResult with total points and detailed breakdown
        """
        start_time = datetime.now()

        if not self.config_loaded:
            await self.initialize()

        # Get exercise configuration
        exercise_config = self.get_exercise_config(exercise_key)
        if not exercise_config:
            return CalculationResult(
                total_points=0,
                breakdown=PointsBreakdown(),
                status=CalculationStatus.FAILED,
                exercise_key=exercise_key,
                errors=[f"Exercise not found or disabled: {exercise_key}"]
            )

        # Initialize breakdown
        breakdown = PointsBreakdown()
        breakdown.base_points = exercise_config.get('base_points', 10)

        # Get multipliers
        multipliers = exercise_config.get('multipliers', {})
        reps_mult = multipliers.get('reps', 1.0)
        sets_mult = multipliers.get('sets', 5.0)
        weight_mult = multipliers.get('weight', 0.1)
        distance_mult = multipliers.get('distance_km', 10.0)
        duration_min_mult = multipliers.get('duration_min', 2.0)
        duration_sec_mult = multipliers.get('duration_sec', 0.5)

        # Calculate component points
        if reps > 0:
            breakdown.reps_points = int(breakdown.base_points * reps * reps_mult)

        if sets > 1:
            breakdown.sets_points = int(breakdown.base_points * sets * sets_mult)

        if weight_kg > 0:
            breakdown.weight_points = int(weight_kg * weight_mult)

        if distance_km > 0:
            breakdown.distance_points = int(distance_km * distance_mult)

        if duration_seconds > 0:
            # Try duration_sec multiplier first, then duration_min
            if 'duration_sec' in multipliers:
                breakdown.duration_points = int(duration_seconds * duration_sec_mult)
            elif 'duration_min' in multipliers:
                duration_min = duration_seconds / 60
                breakdown.duration_points = int(duration_min * duration_min_mult)

        # Calculate total before bonuses
        breakdown.total_before_multiplier = (
            breakdown.base_points +
            breakdown.reps_points +
            breakdown.sets_points +
            breakdown.weight_points +
            breakdown.distance_points +
            breakdown.duration_points
        )

        # Apply rules (bonuses and multipliers)
        context = {
            'reps': reps,
            'sets': sets,
            'weight_kg': weight_kg,
            'distance_km': distance_km,
            'duration_seconds': duration_seconds,
            'duration_minutes': duration_seconds / 60 if duration_seconds > 0 else 0,
            'is_personal_record': is_personal_record,
            **(user_context or {})
        }

        applied_rules = []
        rules = self.rules_config.get('rules', {})

        # Sort rules by priority
        sorted_rules = sorted(
            rules.items(),
            key=lambda x: x[1].get('priority', 999)
        )

        # Apply bonus rules first
        for rule_id, rule_config in sorted_rules:
            if not rule_config.get('enabled', True):
                continue

            if rule_config.get('rule_type') == 'bonus':
                if self._evaluate_condition(rule_config.get('condition', ''), context):
                    bonus_value = rule_config.get('value', 0)
                    breakdown.bonus_points += bonus_value
                    breakdown.applied_bonuses.append({
                        'id': rule_id,
                        'name': rule_config.get('name', rule_id),
                        'value': bonus_value
                    })
                    applied_rules.append(rule_id)

        # Calculate total with bonuses
        current_total = breakdown.total_before_multiplier + breakdown.bonus_points

        # Apply multiplier rules
        for rule_id, rule_config in sorted_rules:
            if not rule_config.get('enabled', True):
                continue

            if rule_config.get('rule_type') == 'multiplier':
                if self._evaluate_condition(rule_config.get('condition', ''), context):
                    mult_value = rule_config.get('value', 1.0)
                    breakdown.multiplier_value *= mult_value
                    breakdown.applied_multipliers.append({
                        'id': rule_id,
                        'name': rule_config.get('name', rule_id),
                        'value': mult_value
                    })
                    applied_rules.append(rule_id)

        # Apply final multiplier
        breakdown.total_points = int(current_total * breakdown.multiplier_value)

        # Calculate execution time
        calc_time = (datetime.now() - start_time).total_seconds()

        return CalculationResult(
            total_points=breakdown.total_points,
            breakdown=breakdown,
            status=CalculationStatus.COMPLETED,
            calculation_time=calc_time,
            exercise_key=exercise_key,
            exercise_name_he=exercise_config.get('name_he', exercise_key),
            applied_rules=applied_rules
        )

    def _evaluate_condition(self, condition: str, context: Dict[str, Any]) -> bool:
        """Safely evaluate a condition string with context"""
        if not condition:
            return True

        try:
            # Create safe evaluation environment
            safe_globals = {
                '__builtins__': {},
                'abs': abs,
                'min': min,
                'max': max,
                'int': int,
                'float': float,
                'len': len
            }

            # Evaluate condition
            result = eval(condition, safe_globals, context)
            return bool(result)
        except Exception as e:
            logger.warning(f"Failed to evaluate condition '{condition}': {e}")
            return False

    async def check_achievements(
        self,
        user_id: str,
        user_stats: Dict[str, Any],
        db: AsyncSession
    ) -> List[Dict[str, Any]]:
        """Check and award achievements based on user stats"""
        earned_achievements = []

        achievements = self.achievements_config.get('achievements', {})

        for achievement_id, achievement_config in achievements.items():
            if not achievement_config.get('enabled', True):
                continue

            # Check if achievement already earned
            # (This would query the database for user_achievements table)

            # Evaluate condition
            condition = achievement_config.get('condition', '')
            if self._evaluate_condition(condition, user_stats):
                earned_achievements.append({
                    'id': achievement_id,
                    'name': achievement_config.get('name', achievement_id),
                    'name_he': achievement_config.get('name_he', achievement_id),
                    'points': achievement_config.get('points', 0),
                    'icon': achievement_config.get('icon', '🏆')
                })

        return earned_achievements

    async def reload_config(self):
        """Reload configuration from YAML files"""
        logger.info("Reloading points configuration...")
        await self.initialize()
        await self._cache.clear()
        logger.info("Configuration reloaded successfully")


# Singleton instance
points_engine_v3 = PointsEngineV3()
