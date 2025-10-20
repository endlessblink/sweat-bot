"""
User Context Manager Service
Provides persistent user context storage with Redis for seamless user experience
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.config import settings
from app.models.models import User, Workout, Exercise, PersonalRecord

logger = logging.getLogger(__name__)

class UserContextManager:
    """
    Manages persistent user context with Redis storage
    Provides seamless user experience across sessions
    """
    
    def __init__(self):
        self.redis_client = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize Redis connection"""
        if not self._initialized:
            try:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self.redis_client.ping()
                self._initialized = True
                logger.info("✅ User Context Manager initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Redis connection: {e}")
                raise
    
    async def store_user_context(self, user_id: str, context_data: Dict[str, Any]):
        """
        Store comprehensive user context in Redis with 24hr expiration
        
        Args:
            user_id: User ID
            context_data: Dictionary containing user context information
        """
        try:
            if not self._initialized:
                await self.initialize()
            
            context_key = f"user_context:{user_id}"
            
            # Add timestamp to context
            context_data["last_updated"] = datetime.utcnow().isoformat()
            context_data["user_id"] = user_id
            
            # Store with 24 hour expiration
            await self.redis_client.setex(
                context_key,
                int(timedelta(hours=24).total_seconds()),
                json.dumps(context_data, ensure_ascii=False)
            )
            
            logger.info(f"✅ Stored context for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to store user context: {e}")
    
    async def get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieve user context from Redis
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary containing user context or empty dict if not found
        """
        try:
            if not self._initialized:
                await self.initialize()
            
            context_key = f"user_context:{user_id}"
            context_data = await self.redis_client.get(context_key)
            
            if context_data:
                parsed_context = json.loads(context_data)
                logger.info(f"✅ Retrieved context for user {user_id}")
                return parsed_context
            else:
                logger.info(f"ℹ️ No context found for user {user_id}")
                return {}
                
        except Exception as e:
            logger.error(f"❌ Failed to retrieve user context: {e}")
            return {}
    
    async def update_user_context(self, user_id: str, updates: Dict[str, Any]):
        """
        Update specific fields in user context
        
        Args:
            user_id: User ID
            updates: Dictionary of fields to update
        """
        try:
            # Get existing context
            existing_context = await self.get_user_context(user_id)
            
            # Merge updates
            existing_context.update(updates)
            
            # Store updated context
            await self.store_user_context(user_id, existing_context)
            
        except Exception as e:
            logger.error(f"❌ Failed to update user context: {e}")
    
    async def build_initial_user_context(self, user: User, db: AsyncSession) -> Dict[str, Any]:
        """
        Build comprehensive initial user context from database
        
        Args:
            user: User model instance
            db: Database session
            
        Returns:
            Complete user context dictionary
        """
        try:
            context = {
                "user_id": str(user.id),
                "username": user.username,
                "full_name": user.full_name,
                "preferred_language": user.preferred_language or "he",
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login_at.isoformat() if user.last_login_at else None,
                "session_start": datetime.utcnow().isoformat()
            }
            
            # Get workout statistics
            workout_stats = await self._get_workout_statistics(user.id, db)
            context.update(workout_stats)
            
            # Get recent workout history
            recent_workouts = await self._get_recent_workouts(user.id, db)
            context["recent_workouts"] = recent_workouts
            
            # Get personal records
            personal_records = await self._get_personal_records(user.id, db)
            context["personal_records"] = personal_records
            
            # Get user preferences and fitness profile
            fitness_profile = await self._get_fitness_profile(user.id, db)
            context["fitness_profile"] = fitness_profile
            
            # Special handling for user Noam - set anti-questioning preferences
            if user.username.lower() == "noam":
                logger.info(f"🎯 Applying special anti-questioning preferences for user Noam")
                # Override with anti-questioning defaults
                context["onboarding"] = {
                    "completed": True,
                    "skipped": True,
                    "skip_reason": "auto_configured_for_noam",
                    "completed_at": datetime.utcnow().isoformat()
                }
                context["fitness_profile"]["communication_style"] = "concise"
                context["coaching_preferences"] = {
                    "avoid_excessive_questions": True,
                    "prefer_quick_confirmations": True,
                    "auto_log_exercises": True,
                    "celebration_style": "concise"
                }
            
            logger.info(f"✅ Built initial context for user {user.username}")
            return context
            
        except Exception as e:
            logger.error(f"❌ Failed to build user context: {e}")
            return {"user_id": str(user.id), "username": user.username}
    
    async def _get_workout_statistics(self, user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Get comprehensive workout statistics"""
        try:
            # Total statistics
            total_query = select(
                func.count(Exercise.id).label('total_exercises'),
                func.sum(Exercise.points_earned).label('total_points'),
                func.count(func.distinct(Workout.id)).label('total_workouts')
            ).join(Workout).where(Workout.user_id == user_id)
            
            result = await db.execute(total_query)
            totals = result.first()
            
            # Today's statistics
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_query = select(
                func.count(Exercise.id).label('today_exercises'),
                func.sum(Exercise.points_earned).label('today_points')
            ).join(Workout).where(
                and_(
                    Workout.user_id == user_id,
                    Exercise.timestamp >= today_start
                )
            )
            
            today_result = await db.execute(today_query)
            today_stats = today_result.first()
            
            # This week's statistics
            week_start = datetime.now() - timedelta(days=7)
            week_query = select(
                func.count(Exercise.id).label('week_exercises'),
                func.sum(Exercise.points_earned).label('week_points')
            ).join(Workout).where(
                and_(
                    Workout.user_id == user_id,
                    Exercise.timestamp >= week_start
                )
            )
            
            week_result = await db.execute(week_query)
            week_stats = week_result.first()
            
            return {
                "total_exercises": totals.total_exercises or 0,
                "total_points": totals.total_points or 0,
                "total_workouts": totals.total_workouts or 0,
                "today_exercises": today_stats.today_exercises or 0,
                "today_points": today_stats.today_points or 0,
                "week_exercises": week_stats.week_exercises or 0,
                "week_points": week_stats.week_points or 0
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get workout statistics: {e}")
            return {}
    
    async def _get_recent_workouts(self, user_id: str, db: AsyncSession, limit: int = 5) -> list:
        """Get recent workout sessions"""
        try:
            query = select(Workout).where(
                Workout.user_id == user_id
            ).order_by(Workout.started_at.desc()).limit(limit)
            
            result = await db.execute(query)
            workouts = result.scalars().all()
            
            recent_workouts = []
            for workout in workouts:
                recent_workouts.append({
                    "id": str(workout.id),
                    "name": workout.workout_name_he or workout.workout_name,
                    "date": workout.started_at.isoformat(),
                    "exercises": workout.total_exercises,
                    "points": workout.total_points,
                    "duration": (workout.completed_at - workout.started_at).total_seconds() if workout.completed_at else None
                })
            
            return recent_workouts
            
        except Exception as e:
            logger.error(f"❌ Failed to get recent workouts: {e}")
            return []
    
    async def _get_personal_records(self, user_id: str, db: AsyncSession) -> list:
        """Get user's personal records"""
        try:
            query = select(PersonalRecord).where(
                PersonalRecord.user_id == user_id
            ).order_by(PersonalRecord.achieved_at.desc()).limit(10)
            
            result = await db.execute(query)
            records = result.scalars().all()
            
            personal_records = []
            for record in records:
                personal_records.append({
                    "exercise": record.exercise_name_he or record.exercise_name,
                    "type": record.record_type,
                    "value": float(record.value),
                    "unit": record.unit,
                    "date": record.achieved_at.isoformat()
                })
            
            return personal_records
            
        except Exception as e:
            logger.error(f"❌ Failed to get personal records: {e}")
            return []
    
    async def _get_fitness_profile(self, user_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Get or create user fitness profile"""
        try:
            # For now, we'll build a basic profile based on workout history
            # In the future, this could be stored as a separate table
            
            # Calculate fitness level based on workout consistency and PRs
            total_workouts = await self._get_total_workouts(user_id, db)
            recent_activity = await self._get_recent_activity_days(user_id, db)
            
            # Determine fitness level
            if total_workouts >= 50 and recent_activity >= 5:
                fitness_level = "מתקדם"
            elif total_workouts >= 20 and recent_activity >= 3:
                fitness_level = "בינוני"
            elif total_workouts >= 5:
                fitness_level = "מתחיל"
            else:
                fitness_level = "חדש"
            
            return {
                "fitness_level": fitness_level,
                "workout_consistency": recent_activity,
                "experience_level": total_workouts,
                "preferred_workout_types": await self._get_preferred_exercises(user_id, db),
                "goals": ["שיפור כושר כללי", "עלייה בכוח", "הרזיה בריאה"],  # Default goals
                "last_assessment": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get fitness profile: {e}")
            return {"fitness_level": "לא ידוע"}
    
    async def _get_total_workouts(self, user_id: str, db: AsyncSession) -> int:
        """Get total number of workouts"""
        try:
            query = select(func.count(Workout.id)).where(Workout.user_id == user_id)
            result = await db.execute(query)
            return result.scalar() or 0
        except:
            return 0
    
    async def _get_recent_activity_days(self, user_id: str, db: AsyncSession) -> int:
        """Get number of days with activity in last 30 days"""
        try:
            thirty_days_ago = datetime.now() - timedelta(days=30)
            query = select(
                func.count(func.distinct(func.date(Workout.started_at)))
            ).where(
                and_(
                    Workout.user_id == user_id,
                    Workout.started_at >= thirty_days_ago
                )
            )
            result = await db.execute(query)
            return result.scalar() or 0
        except:
            return 0
    
    async def _get_preferred_exercises(self, user_id: str, db: AsyncSession) -> list:
        """Get most common exercise types"""
        try:
            query = select(
                Exercise.name_he,
                func.count(Exercise.id).label('count')
            ).join(Workout).where(
                Workout.user_id == user_id
            ).group_by(Exercise.name_he).order_by(
                func.count(Exercise.id).desc()
            ).limit(5)
            
            result = await db.execute(query)
            exercises = result.all()
            
            return [ex.name_he for ex in exercises if ex.name_he]
            
        except Exception as e:
            logger.error(f"❌ Failed to get preferred exercises: {e}")
            return []
    
    async def clear_user_context(self, user_id: str):
        """Clear user context from Redis"""
        try:
            if not self._initialized:
                await self.initialize()
                
            context_key = f"user_context:{user_id}"
            await self.redis_client.delete(context_key)
            logger.info(f"✅ Cleared context for user {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Failed to clear user context: {e}")

# Singleton instance
user_context_manager = UserContextManager()