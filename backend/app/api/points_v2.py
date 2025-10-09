"""
Points Management API v2.0
Enhanced endpoints with database-driven configuration and scalable architecture
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, List, Any, Optional
import json
import os
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import (
    User, Exercise, Workout, PointsHistory, GamificationStats, PointsConfiguration, 
    UserAchievement, Leaderboard
)
from app.services.exercise_integration_service import exercise_integration_service
from app.services.gamification_service import GamificationService
from app.services.scalable_points_engine import scalable_points_engine, PointsResult, CalculationStatus
from app.services.points_configuration_service import (
    points_config_service, 
    ExerciseConfigModel, 
    AchievementConfigModel, 
    RuleConfigModel
)
from app.api.v1.auth import get_current_user, get_current_admin_user
import logging

logger = logging.getLogger(__name__)

# Initialize gamification service
gamification_service = GamificationService()

# Create router
router = APIRouter()

# Development mode check
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# Enhanced Pydantic models for request/response
class ExercisePointsRequest(BaseModel):
    exercise: str
    reps: int = 1
    sets: int = 1
    weight_kg: Optional[float] = None
    exercise_id: Optional[str] = None
    is_personal_record: bool = False

class PointsResponse(BaseModel):
    task_id: Optional[str] = None
    total_points: int
    breakdown: Dict[str, Any]
    applied_rules: List[str]
    calculation_time: float
    status: str
    exercise: str
    reps: int
    sets: int
    weight_kg: Optional[float]
    errors: Optional[List[str]] = None

class BulkExercisePointsRequest(BaseModel):
    exercises: List[ExercisePointsRequest]

class ConfigurationImportRequest(BaseModel):
    configurations: Dict[str, Any]
    validate_only: bool = False

class ConfigurationExportRequest(BaseModel):
    include_versions: bool = False
    config_types: Optional[List[str]] = None

@router.get("/health")
async def points_health_check():
    """Health check for points system"""
    try:
        # Test basic functionality
        cache_status = "available" if await scalable_points_engine._get_redis_client() else "memory_only"
        
        return {
            "status": "healthy",
            "cache_type": cache_status,
            "version": "2.0",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Points system unhealthy: {str(e)}")

@router.get("/exercises")
async def get_exercise_points(
    active_only: bool = Query(True, description="Return only active configurations"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get exercise points configuration from database"""
    try:
        exercises = await points_config_service.list_exercise_configs(
            db, active_only=active_only
        )
        
        # Format response
        response = {
            "exercises": [config['config'] for config in exercises],
            "total_count": len(exercises),
            "active_only": active_only
        }
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load exercise points: {str(e)}")

@router.post("/exercises")
async def create_exercise_config(
    config_data: Dict[str, Any],
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new exercise configuration"""
    try:
        # Validate configuration
        validation = await points_config_service.validate_configuration('exercise', config_data)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail={
                "message": "Invalid configuration",
                "errors": validation['errors'],
                "warnings": validation['warnings']
            })
        
        # Create configuration
        config = await points_config_service.create_exercise_config(config_data, db)
        
        return {
            "message": "Exercise configuration created successfully",
            "config_id": config.id,
            "exercise_key": config.entity_key,
            "version": config.version
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create exercise configuration: {str(e)}")

@router.put("/exercises/{exercise_key}")
async def update_exercise_config(
    exercise_key: str,
    config_data: Dict[str, Any],
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update exercise configuration"""
    try:
        # Validate configuration
        validation = await points_config_service.validate_configuration('exercise', config_data)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail={
                "message": "Invalid configuration",
                "errors": validation['errors'],
                "warnings": validation['warnings']
            })
        
        # Update configuration
        config = await points_config_service.update_exercise_config(exercise_key, config_data, db)
        
        return {
            "message": "Exercise configuration updated successfully",
            "config_id": config.id,
            "exercise_key": config.entity_key,
            "version": config.version
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update exercise configuration: {str(e)}")

@router.delete("/exercises/{exercise_key}")
async def delete_exercise_config(
    exercise_key: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete (deactivate) exercise configuration"""
    try:
        success = await points_config_service.delete_exercise_config(exercise_key, db)
        
        if not success:
            raise HTTPException(status_code=404, detail="Exercise configuration not found")
        
        return {"message": "Exercise configuration deactivated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete exercise configuration: {str(e)}")

@router.get("/rules")
async def get_points_rules(
    active_only: bool = Query(True, description="Return only active rules"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get points rules configuration from database"""
    try:
        rules = await points_config_service.list_rule_configs(db, active_only=active_only)
        
        return {
            "rules": rules,
            "total_count": len(rules),
            "active_only": active_only
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load points rules: {str(e)}")

@router.post("/rules")
async def create_rule_config(
    config_data: Dict[str, Any],
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new rule configuration"""
    try:
        # Validate configuration
        validation = await points_config_service.validate_configuration('rule', config_data)
        if not validation['valid']:
            raise HTTPException(status_code=400, detail={
                "message": "Invalid configuration",
                "errors": validation['errors'],
                "warnings": validation['warnings']
            })
        
        # Create configuration
        config = await points_config_service.create_rule_config(config_data, db)
        
        return {
            "message": "Rule configuration created successfully",
            "config_id": config.id,
            "rule_id": config.entity_key,
            "version": config.version
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create rule configuration: {str(e)}")

@router.get("/achievements")
async def get_achievements(
    active_only: bool = Query(True, description="Return only active achievements"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get achievements configuration"""
    try:
        # Try database first, fallback to service
        query = select(PointsConfiguration).where(
            PointsConfiguration.entity_type == 'achievement'
        )
        
        if active_only:
            query = query.where(PointsConfiguration.is_active == True)
        
        query = query.order_by(PointsConfiguration.entity_key)
        result = await db.execute(query)
        
        achievements = []
        for config in result.scalars().all():
            achievements.append(config.config_data)
        
        # Fallback to service if no database configurations
        if not achievements:
            achievements = []
            for achievement_type, achievement_data in gamification_service.achievements.items():
                achievements.append({
                    "id": achievement_type.value,
                    "name": achievement_data["name"],
                    "name_he": achievement_data["name_he"],
                    "description": achievement_data["description"],
                    "description_he": achievement_data["description_he"],
                    "points": achievement_data["points"],
                    "icon": achievement_data["icon"],
                    "enabled": True
                })
        
        return {
            "achievements": achievements,
            "total_count": len(achievements),
            "active_only": active_only
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load achievements: {str(e)}")

@router.post("/calculate")
async def calculate_exercise_points(
    exercise_data: ExercisePointsRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate points for an exercise using the scalable engine"""
    try:
        # Convert to dict for engine
        exercise_dict = exercise_data.dict()
        
        # Calculate points
        result = await scalable_points_engine.calculate_points_async(
            exercise_dict, str(current_user.id), db
        )
        
        # Add background task for achievement checking
        if result.status == CalculationStatus.COMPLETED and result.total_points > 0:
            background_tasks.add_task(
                check_and_award_achievements,
                str(current_user.id),
                result.total_points,
                db
            )
        
        return PointsResponse(
            task_id=result.task_id,
            total_points=result.total_points,
            breakdown=result.breakdown,
            applied_rules=result.applied_rules,
            calculation_time=result.calculation_time,
            status=result.status.value,
            exercise=exercise_data.exercise,
            reps=exercise_data.reps,
            sets=exercise_data.sets,
            weight_kg=exercise_data.weight_kg,
            errors=result.errors
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate points: {str(e)}")

@router.post("/calculate/bulk")
async def calculate_bulk_exercise_points(
    request: BulkExercisePointsRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate points for multiple exercises"""
    try:
        results = []
        total_points = 0
        
        for exercise_data in request.exercises:
            exercise_dict = exercise_data.dict()
            result = await scalable_points_engine.calculate_points_async(
                exercise_dict, str(current_user.id), db
            )
            
            results.append({
                "exercise": exercise_data.exercise,
                "points": result.total_points,
                "status": result.status.value,
                "errors": result.errors
            })
            
            if result.status == CalculationStatus.COMPLETED:
                total_points += result.total_points
        
        # Add background task for achievement checking
        if total_points > 0:
            background_tasks.add_task(
                check_and_award_achievements,
                str(current_user.id),
                total_points,
                db
            )
        
        return {
            "results": results,
            "total_points": total_points,
            "exercise_count": len(request.exercises)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate bulk points: {str(e)}")

@router.get("/history/{user_id}")
async def get_user_points_history(
    user_id: str,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get points history for a user"""
    try:
        # Users can only see their own history unless admin
        if str(current_user.id) != user_id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Access denied")
        
        history = await scalable_points_engine.get_user_points_history(
            user_id, limit, offset, db
        )
        
        return {
            "user_id": user_id,
            "history": history,
            "total_count": len(history),
            "limit": limit,
            "offset": offset
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user history: {str(e)}")

@router.get("/stats/{user_id}")
async def get_user_points_stats(
    user_id: str,
    period: str = Query("all_time", regex="^(all_time|30d|7d|1d)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive user points statistics"""
    try:
        # Users can only see their own stats unless admin
        if str(current_user.id) != user_id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get user's gamification stats
        query = select(GamificationStats).where(GamificationStats.user_id == user_id)
        result = await db.execute(query)
        stats = result.scalar_one_or_none()
        
        # Get recent points history
        recent_history = await scalable_points_engine.get_user_points_history(
            user_id, limit=10, db=db
        )
        
        # Calculate period-specific stats
        period_stats = await calculate_period_stats(user_id, period, db)
        
        return {
            "user_id": user_id,
            "period": period,
            "gamification_stats": {
                "total_points": stats.total_points if stats else 0,
                "current_level": stats.current_level if stats else 1,
                "current_streak_days": stats.current_streak_days if stats else 0,
                "total_workouts": stats.total_workouts if stats else 0,
                "total_exercise_count": stats.total_exercise_count if stats else 0
            },
            "period_stats": period_stats,
            "recent_activity": recent_history[:5],
            "level_info": gamification_service.calculate_level(
                stats.total_points if stats else 0
            ) if stats else gamification_service.calculate_level(0)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")

@router.get("/leaderboard")
async def get_leaderboard(
    period_type: str = Query("all_time", regex="^(all_time|weekly|monthly|daily)$"),
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get points leaderboard"""
    try:
        leaderboard = await scalable_points_engine.get_leaderboard(
            period_type, limit, db
        )
        
        # Find current user's position
        current_user_position = None
        for entry in leaderboard:
            if entry['user_id'] == str(current_user.id):
                current_user_position = entry['position']
                break
        
        return {
            "period_type": period_type,
            "leaderboard": leaderboard,
            "current_user_position": current_user_position,
            "total_entries": len(leaderboard),
            "generated_at": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")

@router.post("/config/import")
async def import_configuration(
    request: ConfigurationImportRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Import points configuration"""
    try:
        if request.validate_only:
            # Validate only, don't import
            validation_results = {}
            for config_type, configs in request.configurations.items():
                validation_results[config_type] = {
                    "valid": True,
                    "errors": [],
                    "warnings": []
                }
                
                for config in configs:
                    validation = await points_config_service.validate_configuration(
                        config_type, config
                    )
                    if not validation['valid']:
                        validation_results[config_type]['valid'] = False
                        validation_results[config_type]['errors'].extend(validation['errors'])
                    validation_results[config_type]['warnings'].extend(validation['warnings'])
            
            return {
                "message": "Validation completed",
                "validation_results": validation_results
            }
        else:
            # Actual import
            results = await points_config_service.bulk_import_configurations(
                request.configurations, db
            )
            
            return {
                "message": "Configuration imported successfully",
                "results": results
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import configuration: {str(e)}")

@router.post("/config/export")
async def export_configuration(
    request: ConfigurationExportRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Export points configuration"""
    try:
        export_data = await points_config_service.export_configurations(
            db, include_versions=request.include_versions
        )
        
        # Filter by config types if specified
        if request.config_types:
            filtered_data = {
                "export_date": export_data["export_date"],
                "version": export_data["version"]
            }
            for config_type in request.config_types:
                if config_type in export_data:
                    filtered_data[config_type] = export_data[config_type]
            export_data = filtered_data
        
        return export_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export configuration: {str(e)}")

@router.post("/cache/clear")
async def clear_cache(
    pattern: Optional[str] = Query(None, description="Cache pattern to clear"),
    current_user: User = Depends(get_current_admin_user)
):
    """Clear points system cache"""
    try:
        await scalable_points_engine.invalidate_cache(pattern)
        
        return {
            "message": "Cache cleared successfully",
            "pattern": pattern or "all"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")

# Helper functions
async def check_and_award_achievements(user_id: str, points_earned: int, db: AsyncSession):
    """Background task to check and award achievements"""
    try:
        # Get user's current stats
        query = select(GamificationStats).where(GamificationStats.user_id == user_id)
        result = await db.execute(query)
        stats = result.scalar_one_or_none()
        
        if not stats:
            # Create initial stats if not exists
            stats = GamificationStats(user_id=user_id)
            db.add(stats)
            await db.commit()
        
        # Check for achievement milestones using gamification service
        await gamification_service.check_achievements(user_id, points_earned, db)
        
    except Exception as e:
        logger.error(f"Achievement checking failed for user {user_id}: {e}")

async def calculate_period_stats(user_id: str, period: str, db: AsyncSession) -> Dict[str, Any]:
    """Calculate period-specific statistics"""
    try:
        from datetime import datetime, timedelta
        
        # Calculate date range based on period
        now = datetime.utcnow()
        if period == "1d":
            start_date = now - timedelta(days=1)
        elif period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        else:  # all_time
            start_date = None
        
        # Query points history for the period
        query = select(PointsHistory).where(PointsHistory.user_id == user_id)
        if start_date:
            query = query.where(PointsHistory.created_at >= start_date)
        
        result = await db.execute(query)
        history = result.scalars().all()
        
        # Calculate stats
        total_points = sum(h.points_earned for h in history)
        total_exercises = len(set(h.exercise_id for h in history if h.exercise_id))
        
        # Count unique workouts (distinct dates)
        workout_dates = set()
        for h in history:
            if h.created_at:
                workout_dates.add(h.created_at.date())
        
        return {
            "points": total_points,
            "exercises": total_exercises,
            "workouts": len(workout_dates)
        }
        
    except Exception as e:
        logger.error(f"Period stats calculation failed for user {user_id}: {e}")
        return {
            "points": 0,
            "exercises": 0,
            "workouts": 0
        }

# Legacy endpoint compatibility
@router.get("/public/exercises")
async def get_exercise_points_public():
    """Public endpoint for exercise points (legacy compatibility)"""
    try:
        # Return basic exercise configurations for public access
        default_exercises = {
            "squat": {"name": "סקוואט", "category": "Strength", "base_points": 10},
            "push_up": {"name": "שכיבות סמיכה", "category": "Strength", "base_points": 8},
            "deadlift": {"name": "דדליפט", "category": "Strength", "base_points": 20},
            "burpee": {"name": "ברפי", "category": "Cardio", "base_points": 15},
            "plank": {"name": "פלאנק", "category": "Core", "base_points": 8}
        }
        return {"exercises": default_exercises}
        
    except Exception as e:
        return {"exercises": {}}