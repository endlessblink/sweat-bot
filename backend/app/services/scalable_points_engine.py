"""
Enhanced Points Calculation Engine with Caching and Async Processing
Replaces the file-based configuration with database-driven scalable system
"""

from typing import Dict, List, Optional, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
import json
import asyncio
import logging
from datetime import datetime, timedelta
import uuid
from dataclasses import dataclass
from enum import Enum

from app.core.database import get_db
from app.models.models import (
    PointsConfiguration, PointsHistory, UserAchievement, 
    Exercise, User, Workout, GamificationStats
)
from app.services.gamification_service import gamification_service, AchievementType

logger = logging.getLogger(__name__)

class CalculationStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class PointsResult:
    """Result of points calculation"""
    total_points: int
    breakdown: Dict[str, Any]
    applied_rules: List[str]
    calculation_time: float
    status: CalculationStatus
    task_id: Optional[str] = None
    errors: Optional[List[str]] = None

@dataclass
class ExerciseConfig:
    """Exercise configuration for points calculation"""
    exercise_key: str
    name: str
    name_he: str
    category: str
    points_base: int
    multipliers: Dict[str, float]
    enabled: bool = True

class ScalablePointsEngine:
    """Scalable points calculation engine with caching and async processing"""
    
    def __init__(self):
        self.cache_ttl = 3600  # 1 hour
        self.calculation_queue = asyncio.Queue()
        self.redis_client = None  # Will be initialized lazily
        self._cache = {}  # In-memory fallback cache
        
    async def _get_redis_client(self):
        """Lazy initialization of Redis client"""
        if self.redis_client is None:
            try:
                import redis
                self.redis_client = redis.Redis(
                    host='localhost',
                    port=6379,
                    db=0,
                    decode_responses=True
                )
                # Test connection
                self.redis_client.ping()
                logger.info("Connected to Redis for points caching")
            except Exception as e:
                logger.warning(f"Redis not available, using memory cache: {e}")
                self.redis_client = None
        return self.redis_client
    
    async def _cache_get(self, key: str) -> Optional[Any]:
        """Get value from cache (Redis or memory)"""
        redis = await self._get_redis_client()
        if redis:
            try:
                value = redis.get(key)
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
                redis.setex(key, ttl, json.dumps(value, default=str))
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")
        
        # Fallback to memory cache
        self._cache[key] = value
    
    async def load_exercise_config(self, exercise_key: str, db: AsyncSession) -> Optional[ExerciseConfig]:
        """Load exercise configuration from database with caching"""
        cache_key = f"exercise_config:{exercise_key}"
        
        # Try cache first
        cached = await self._cache_get(cache_key)
        if cached:
            return ExerciseConfig(**cached)
        
        # Load from database
        query = select(PointsConfiguration).where(
            and_(
                PointsConfiguration.entity_type == 'exercise',
                PointsConfiguration.entity_key == exercise_key,
                PointsConfiguration.is_active == True
            )
        ).order_by(PointsConfiguration.version.desc())
        
        result = await db.execute(query)
        config = result.scalar_one_or_none()
        
        if not config:
            # Create default config from service
            default_config = await self._create_default_exercise_config(exercise_key, db)
            await self._cache_set(cache_key, default_config.__dict__)
            return default_config
        
        exercise_config = ExerciseConfig(**config.config_data)
        await self._cache_set(cache_key, exercise_config.__dict__)
        
        return exercise_config
    
    async def _create_default_exercise_config(self, exercise_key: str, db: AsyncSession) -> ExerciseConfig:
        """Create default exercise configuration from existing service data"""
        from app.services.exercise_integration_service import exercise_integration_service
        
        mapping = exercise_integration_service.exercise_mappings.get(exercise_key, {})
        
        return ExerciseConfig(
            exercise_key=exercise_key,
            name=mapping.get('name', exercise_key),
            name_he=mapping.get('name_he', exercise_key),
            category=mapping.get('category', 'general'),
            points_base=mapping.get('points_base', 10),
            multipliers={
                'reps': mapping.get('reps_multiplier', 1.0),
                'sets': mapping.get('sets_multiplier', 5.0),
                'weight': mapping.get('weight_multiplier', 0.1)
            }
        )
    
    async def load_points_rules(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """Load active points rules from database with caching"""
        cache_key = "points_rules:active"
        
        # Try cache first
        cached = await self._cache_get(cache_key)
        if cached:
            return cached
        
        # Load from database
        query = select(PointsConfiguration).where(
            and_(
                PointsConfiguration.entity_type == 'rule',
                PointsConfiguration.is_active == True
            )
        ).order_by(PointsConfiguration.version.desc())
        
        result = await db.execute(query)
        rules = []
        
        for config in result.scalars().all():
            rules.append(config.config_data)
        
        await self._cache_set(cache_key, rules)
        return rules
    
    async def calculate_points_async(
        self, 
        exercise_data: Dict[str, Any], 
        user_id: str,
        db: AsyncSession
    ) -> PointsResult:
        """Async points calculation with caching"""
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Load configuration
            exercise_config = await self.load_exercise_config(exercise_data['exercise'], db)
            if not exercise_config:
                return PointsResult(
                    total_points=0,
                    breakdown={},
                    applied_rules=[],
                    calculation_time=0,
                    status=CalculationStatus.FAILED,
                    errors=[f"Exercise configuration not found: {exercise_data['exercise']}"]
                )
            
            # Load rules
            rules = await self.load_points_rules(db)
            
            # Calculate points
            result = await self._calculate_points_detailed(
                exercise_data, exercise_config, rules
            )
            
            # Save to history
            await self._save_points_history(
                user_id, exercise_data.get('exercise_id'), result, db
            )
            
            # Update user stats
            await self._update_user_stats(user_id, result.total_points, db)
            
            result.calculation_time = asyncio.get_event_loop().time() - start_time
            result.status = CalculationStatus.COMPLETED
            
            return result
            
        except Exception as e:
            logger.error(f"Points calculation failed: {e}")
            return PointsResult(
                total_points=0,
                breakdown={},
                applied_rules=[],
                calculation_time=asyncio.get_event_loop().time() - start_time,
                status=CalculationStatus.FAILED,
                errors=[str(e)]
            )
    
    async def _calculate_points_detailed(
        self,
        exercise_data: Dict[str, Any],
        exercise_config: ExerciseConfig,
        rules: List[Dict[str, Any]]
    ) -> PointsResult:
        """Detailed points calculation with breakdown"""
        
        # Base points calculation
        base_points = exercise_config.points_base
        reps = exercise_data.get('reps', 1)
        sets = exercise_data.get('sets', 1)
        weight = exercise_data.get('weight_kg', 0)
        
        # Apply multipliers
        total_points = base_points
        breakdown = {
            'base_points': base_points,
            'multipliers': {},
            'bonuses': [],
            'total_points': 0
        }
        
        # Reps multiplier
        if reps > 0:
            rep_points = base_points * reps * exercise_config.multipliers['reps']
            total_points += rep_points
            breakdown['multipliers']['reps'] = rep_points
        
        # Sets multiplier
        if sets > 0:
            set_points = base_points * sets * exercise_config.multipliers['sets']
            total_points += set_points
            breakdown['multipliers']['sets'] = set_points
        
        # Weight multiplier
        if weight > 0:
            weight_points = weight * exercise_config.multipliers['weight']
            total_points += weight_points
            breakdown['multipliers']['weight'] = weight_points
        
        # Apply rules
        applied_rules = []
        for rule in rules:
            if not rule.get('enabled', True):
                continue
                
            rule_applied = await self._apply_rule(rule, exercise_data, total_points)
            if rule_applied['applied']:
                total_points += rule_applied['points']
                breakdown['bonuses'].append({
                    'rule_id': rule['id'],
                    'rule_name': rule['name'],
                    'points': rule_applied['points']
                })
                applied_rules.append(rule['id'])
        
        breakdown['total_points'] = int(total_points)
        
        return PointsResult(
            total_points=int(total_points),
            breakdown=breakdown,
            applied_rules=applied_rules,
            calculation_time=0,  # Will be set by caller
            status=CalculationStatus.COMPLETED
        )
    
    async def _apply_rule(self, rule: Dict[str, Any], exercise_data: Dict[str, Any], current_points: int) -> Dict[str, Any]:
        """Apply a single rule to the exercise"""
        rule_type = rule.get('rule_type')
        condition = rule.get('condition', '')
        value = rule.get('value', 0)
        
        applied = False
        points = 0
        
        if rule_type == 'bonus':
            # Check conditions
            if condition == 'reps >= 20' and exercise_data.get('reps', 0) >= 20:
                applied = True
                points = value
            elif condition == 'weight_kg > 0' and exercise_data.get('weight_kg', 0) > 0:
                applied = True
                points = value
            elif condition == 'is_personal_record = true' and exercise_data.get('is_personal_record', False):
                applied = True
                points = value
        
        elif rule_type == 'multiplier':
            if condition == 'weight_kg > 0' and exercise_data.get('weight_kg', 0) > 0:
                applied = True
                points = int(current_points * value)
        
        return {'applied': applied, 'points': points}
    
    async def _save_points_history(
        self,
        user_id: str,
        exercise_id: Optional[str],
        result: PointsResult,
        db: AsyncSession
    ):
        """Save points calculation to history"""
        history = PointsHistory(
            user_id=user_id,
            exercise_id=exercise_id,
            points_earned=result.total_points,
            calculation_breakdown=result.breakdown,
            rule_ids=result.applied_rules
        )
        
        db.add(history)
        await db.commit()
    
    async def _update_user_stats(self, user_id: str, points: int, db: AsyncSession):
        """Update user gamification stats"""
        # Get or create user stats
        query = select(GamificationStats).where(GamificationStats.user_id == user_id)
        result = await db.execute(query)
        stats = result.scalar_one_or_none()
        
        if not stats:
            stats = GamificationStats(
                user_id=user_id,
                total_points=points,
                current_level=1
            )
            db.add(stats)
        else:
            stats.total_points += points
            
            # Calculate level
            level_info = gamification_service.calculate_level(stats.total_points)
            stats.current_level = level_info['level']
            stats.experience_points = stats.total_points
            stats.next_level_xp = level_info.get('points_to_next_level', 100)
        
        await db.commit()
    
    async def get_user_points_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        db: AsyncSession = None
    ) -> List[Dict[str, Any]]:
        """Get user's points history with pagination"""
        if not db:
            async for db_session in get_db():
                db = db_session
                break
        
        query = select(PointsHistory).where(
            PointsHistory.user_id == user_id
        ).order_by(PointsHistory.created_at.desc()).offset(offset).limit(limit)
        
        result = await db.execute(query)
        history = result.scalars().all()
        
        return [
            {
                'id': h.id,
                'points_earned': h.points_earned,
                'breakdown': h.calculation_breakdown,
                'created_at': h.created_at.isoformat(),
                'exercise_id': str(h.exercise_id) if h.exercise_id else None
            }
            for h in history
        ]
    
    async def get_leaderboard(
        self,
        period_type: str = 'all_time',
        limit: int = 10,
        db: AsyncSession = None
    ) -> List[Dict[str, Any]]:
        """Get cached leaderboard data"""
        cache_key = f"leaderboard:{period_type}:{limit}"
        
        # Try cache first
        cached = await self._cache_get(cache_key)
        if cached:
            return cached
        
        if not db:
            async for db_session in get_db():
                db = db_session
                break
        
        # Generate leaderboard from database
        query = select(
            User.id,
            User.username,
            User.full_name,
            GamificationStats.total_points,
            GamificationStats.current_level,
            GamificationStats.global_rank
        ).join(
            GamificationStats, User.id == GamificationStats.user_id
        ).order_by(
            GamificationStats.total_points.desc()
        ).limit(limit)
        
        result = await db.execute(query)
        leaderboard = []
        
        for i, row in enumerate(result.all()):
            leaderboard.append({
                'position': i + 1,
                'user_id': str(row.id),
                'username': row.username,
                'full_name': row.full_name,
                'total_points': row.total_points,
                'level': row.current_level,
                'global_rank': row.global_rank
            })
        
        # Cache the result
        await self._cache_set(cache_key, leaderboard, ttl=300)  # 5 minutes cache
        
        return leaderboard
    
    async def invalidate_cache(self, pattern: Optional[str] = None):
        """Invalidate cache entries"""
        redis = await self._get_redis_client()
        if redis:
            try:
                if pattern:
                    keys = redis.keys(pattern)
                    if keys:
                        redis.delete(*keys)
                else:
                    redis.flushdb()
                
                # Clear memory cache
                self._cache.clear()
                
                logger.info(f"Cache invalidated: {pattern or 'all'}")
            except Exception as e:
                logger.error(f"Cache invalidation failed: {e}")
        else:
            # Clear memory cache
            self._cache.clear()

# Singleton instance
scalable_points_engine = ScalablePointsEngine()