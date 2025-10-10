"""
Points API v3 - Unified endpoints using YAML-based configuration
Single source of truth for all points calculations
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.models.points_models_v3 import (
    PointsConfigurationV3,
    PointsCalculationV3,
    UserPointsSummaryV3,
    UserAchievementV3,
    LeaderboardCacheV3,
    PointsConfigAuditV3
)
from app.services.points_engine_v3 import points_engine_v3, CalculationResult, CalculationStatus
from app.api.v1.auth import get_current_user, get_current_admin_user
from app.models.models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v3/points", tags=["Points v3"])


# Pydantic Models
class ExercisePointsRequest(BaseModel):
    exercise: str = Field(..., description="Exercise key (e.g., 'squat')")
    reps: int = Field(0, ge=0, description="Number of repetitions")
    sets: int = Field(1, ge=1, description="Number of sets")
    weight_kg: float = Field(0.0, ge=0, description="Weight in kilograms")
    distance_km: float = Field(0.0, ge=0, description="Distance in kilometers")
    duration_seconds: int = Field(0, ge=0, description="Duration in seconds")
    is_personal_record: bool = Field(False, description="Is this a personal record")
    exercise_id: Optional[str] = Field(None, description="Optional exercise ID for tracking")


class BulkCalculationRequest(BaseModel):
    exercises: List[ExercisePointsRequest]


class ConfigUpdateRequest(BaseModel):
    entity_type: str = Field(..., description="Type: exercise, rule, or achievement")
    entity_key: str = Field(..., description="Unique key for the entity")
    config_data: Dict[str, Any] = Field(..., description="Configuration data")
    notes: Optional[str] = Field(None, description="Optional notes for this change")


# ============================================================================
# CORE CALCULATION ENDPOINTS
# ============================================================================

@router.post("/calculate")
async def calculate_points(
    request: ExercisePointsRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate points for a single exercise
    Returns detailed breakdown and applies all active rules
    """
    try:
        # Get user context for rules evaluation
        user_context = await _get_user_context(str(current_user.id), db)

        # Calculate points using unified engine
        result = await points_engine_v3.calculate_points(
            exercise_key=request.exercise,
            reps=request.reps,
            sets=request.sets,
            weight_kg=request.weight_kg,
            distance_km=request.distance_km,
            duration_seconds=request.duration_seconds,
            is_personal_record=request.is_personal_record,
            user_context=user_context
        )

        if result.status == CalculationStatus.FAILED:
            raise HTTPException(status_code=400, detail={
                "message": "Points calculation failed",
                "errors": result.errors
            })

        # Save to database (audit trail)
        calculation = PointsCalculationV3(
            user_id=str(current_user.id),
            exercise_id=request.exercise_id,
            exercise_key=request.exercise,
            calculation_data={
                'breakdown': {
                    'base_points': result.breakdown.base_points,
                    'reps_points': result.breakdown.reps_points,
                    'sets_points': result.breakdown.sets_points,
                    'weight_points': result.breakdown.weight_points,
                    'distance_points': result.breakdown.distance_points,
                    'duration_points': result.breakdown.duration_points,
                    'bonus_points': result.breakdown.bonus_points,
                    'multiplier_value': result.breakdown.multiplier_value,
                    'total_before_multiplier': result.breakdown.total_before_multiplier,
                    'applied_bonuses': result.breakdown.applied_bonuses,
                    'applied_multipliers': result.breakdown.applied_multipliers
                },
                'input': request.dict()
            },
            points_earned=result.total_points,
            rules_applied=result.applied_rules,
            configuration_version=1,  # TODO: Get from config
            calculation_time_ms=result.calculation_time * 1000
        )
        db.add(calculation)
        await db.commit()

        # Check achievements in background
        background_tasks.add_task(
            _check_and_award_achievements,
            str(current_user.id),
            result.total_points,
            db
        )

        # Refresh materialized view in background
        background_tasks.add_task(_refresh_user_summary, db)

        return {
            "success": True,
            "total_points": result.total_points,
            "exercise_key": result.exercise_key,
            "exercise_name_he": result.exercise_name_he,
            "breakdown": {
                "base_points": result.breakdown.base_points,
                "reps_points": result.breakdown.reps_points,
                "sets_points": result.breakdown.sets_points,
                "weight_points": result.breakdown.weight_points,
                "distance_points": result.breakdown.distance_points,
                "duration_points": result.breakdown.duration_points,
                "bonus_points": result.breakdown.bonus_points,
                "multiplier": result.breakdown.multiplier_value,
                "total": result.breakdown.total_points
            },
            "applied_bonuses": result.breakdown.applied_bonuses,
            "applied_multipliers": result.breakdown.applied_multipliers,
            "calculation_time_ms": result.calculation_time * 1000,
            "calculation_id": str(calculation.id)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Points calculation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@router.post("/calculate/bulk")
async def calculate_bulk_points(
    request: BulkCalculationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate points for multiple exercises in a single request
    Optimized for batch operations
    """
    try:
        user_context = await _get_user_context(str(current_user.id), db)
        results = []
        total_points = 0

        for exercise_request in request.exercises:
            result = await points_engine_v3.calculate_points(
                exercise_key=exercise_request.exercise,
                reps=exercise_request.reps,
                sets=exercise_request.sets,
                weight_kg=exercise_request.weight_kg,
                distance_km=exercise_request.distance_km,
                duration_seconds=exercise_request.duration_seconds,
                is_personal_record=exercise_request.is_personal_record,
                user_context=user_context
            )

            if result.status == CalculationStatus.COMPLETED:
                total_points += result.total_points

                # Save to database
                calculation = PointsCalculationV3(
                    user_id=str(current_user.id),
                    exercise_id=exercise_request.exercise_id,
                    exercise_key=exercise_request.exercise,
                    calculation_data={'breakdown': result.breakdown.__dict__, 'input': exercise_request.dict()},
                    points_earned=result.total_points,
                    rules_applied=result.applied_rules,
                    configuration_version=1,
                    calculation_time_ms=result.calculation_time * 1000
                )
                db.add(calculation)

            results.append({
                "exercise": exercise_request.exercise,
                "points": result.total_points,
                "status": result.status.value,
                "errors": result.errors
            })

        await db.commit()

        # Background tasks
        background_tasks.add_task(_check_and_award_achievements, str(current_user.id), total_points, db)
        background_tasks.add_task(_refresh_user_summary, db)

        return {
            "success": True,
            "results": results,
            "total_points": total_points,
            "exercise_count": len(request.exercises)
        }

    except Exception as e:
        logger.error(f"Bulk calculation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Bulk calculation failed: {str(e)}")


# ============================================================================
# CONFIGURATION ENDPOINTS
# ============================================================================

@router.get("/config/exercises")
async def get_exercise_config(
    active_only: bool = Query(True, description="Return only active configurations"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get exercise configurations"""
    try:
        query = select(PointsConfigurationV3).where(
            PointsConfigurationV3.entity_type == 'exercise'
        )

        if active_only:
            query = query.where(PointsConfigurationV3.is_active == True)

        query = query.order_by(PointsConfigurationV3.entity_key)

        result = await db.execute(query)
        configs = result.scalars().all()

        return {
            "exercises": [
                {
                    "key": config.entity_key,
                    **config.config_data,
                    "version": config.version,
                    "is_active": config.is_active
                }
                for config in configs
            ],
            "total_count": len(configs),
            "source": "database"
        }

    except Exception as e:
        logger.error(f"Failed to get exercise config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/rules")
async def get_rules_config(
    active_only: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get rules configurations"""
    try:
        query = select(PointsConfigurationV3).where(
            PointsConfigurationV3.entity_type == 'rule'
        )

        if active_only:
            query = query.where(PointsConfigurationV3.is_active == True)

        result = await db.execute(query)
        configs = result.scalars().all()

        return {
            "rules": [config.config_data for config in configs],
            "total_count": len(configs)
        }

    except Exception as e:
        logger.error(f"Failed to get rules config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/config/update")
async def update_configuration(
    request: ConfigUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update configuration (admin only)
    Creates new version and triggers cache invalidation
    """
    try:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Admin privileges required")

        # Get current version
        query = select(func.max(PointsConfigurationV3.version)).where(
            and_(
                PointsConfigurationV3.entity_type == request.entity_type,
                PointsConfigurationV3.entity_key == request.entity_key
            )
        )
        result = await db.execute(query)
        current_version = result.scalar() or 0

        # Create new version
        new_config = PointsConfigurationV3(
            entity_type=request.entity_type,
            entity_key=request.entity_key,
            config_data=request.config_data,
            version=current_version + 1,
            is_active=True,
            created_by=current_user.username,
            notes=request.notes
        )

        # Deactivate old versions
        update_query = select(PointsConfigurationV3).where(
            and_(
                PointsConfigurationV3.entity_type == request.entity_type,
                PointsConfigurationV3.entity_key == request.entity_key,
                PointsConfigurationV3.is_active == True
            )
        )
        old_configs = await db.execute(update_query)
        for old_config in old_configs.scalars():
            old_config.is_active = False

        db.add(new_config)
        await db.commit()

        # Reload engine configuration
        await points_engine_v3.reload_config()

        return {
            "success": True,
            "message": "Configuration updated successfully",
            "version": new_config.version,
            "config_id": str(new_config.id)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update configuration: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STATISTICS & LEADERBOARD
# ============================================================================

@router.get("/stats/{user_id}")
async def get_user_stats(
    user_id: str,
    period: str = Query("all_time", regex="^(all_time|30d|7d|1d)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user statistics"""
    try:
        if str(current_user.id) != user_id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get from materialized view
        query = select(UserPointsSummaryV3).where(UserPointsSummaryV3.user_id == user_id)
        result = await db.execute(query)
        summary = result.scalar_one_or_none()

        if not summary:
            return {
                "user_id": user_id,
                "total_points": 0,
                "total_calculations": 0,
                "active_days": 0,
                "recent_activity": []
            }

        return {
            "user_id": user_id,
            "total_points": summary.total_points,
            "total_calculations": summary.total_calculations,
            "active_days": summary.active_days,
            "last_activity": summary.last_activity.isoformat() if summary.last_activity else None,
            "recent_activity": summary.recent_activity or []
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _get_user_context(user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Get user context for rules evaluation"""
    try:
        # Get user summary
        query = select(UserPointsSummaryV3).where(UserPointsSummaryV3.user_id == user_id)
        result = await db.execute(query)
        summary = result.scalar_one_or_none()

        # Calculate streak days (simplified)
        streak_days = 0
        if summary and summary.active_days:
            streak_days = summary.active_days

        # Get today's exercise count
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        session_query = select(func.count(PointsCalculationV3.id)).where(
            and_(
                PointsCalculationV3.user_id == user_id,
                PointsCalculationV3.created_at >= today_start
            )
        )
        session_result = await db.execute(session_query)
        session_exercise_count = session_result.scalar() or 0

        return {
            'user_id': user_id,
            'total_points': summary.total_points if summary else 0,
            'total_workouts': summary.total_calculations if summary else 0,
            'streak_days': streak_days,
            'session_exercise_count': session_exercise_count,
            'workout_hour': datetime.utcnow().hour
        }

    except Exception as e:
        logger.warning(f"Failed to get user context: {e}")
        return {}


async def _check_and_award_achievements(user_id: str, points_earned: int, db: AsyncSession):
    """Background task to check and award achievements"""
    try:
        user_context = await _get_user_context(user_id, db)
        achievements = await points_engine_v3.check_achievements(user_id, user_context, db)

        for achievement in achievements:
            # Check if already earned
            existing_query = select(UserAchievementV3).where(
                and_(
                    UserAchievementV3.user_id == user_id,
                    UserAchievementV3.achievement_id == achievement['id']
                )
            )
            existing_result = await db.execute(existing_query)
            if existing_result.scalar_one_or_none():
                continue

            # Award achievement
            user_achievement = UserAchievementV3(
                user_id=user_id,
                achievement_id=achievement['id'],
                achievement_name=achievement['name'],
                achievement_name_he=achievement['name_he'],
                points_awarded=achievement['points'],
                icon=achievement['icon']
            )
            db.add(user_achievement)

        await db.commit()

    except Exception as e:
        logger.error(f"Achievement checking failed for user {user_id}: {e}")


async def _refresh_user_summary(db: AsyncSession):
    """Refresh materialized view (background task)"""
    try:
        await db.execute("SELECT refresh_user_points_summary()")
        await db.commit()
        logger.info("User points summary refreshed")
    except Exception as e:
        logger.error(f"Failed to refresh user summary: {e}")
