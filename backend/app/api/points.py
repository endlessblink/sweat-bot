"""
Points Management API
Endpoints for managing exercise points, achievements, and gamification rules
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, List, Any, Optional
import json
import os
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import User, Exercise, Workout
from app.services.exercise_integration_service import exercise_integration_service
from app.services.gamification_service import GamificationService

# Initialize gamification service
gamification_service = GamificationService()
from app.api.v1.auth import get_current_user, get_current_admin_user

# Development mode check
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# Pydantic models for request/response
class ExercisePointsRequest(BaseModel):
    exercise: str
    reps: int = 1
    sets: int = 1
    weight_kg: Optional[float] = None

class PointsResponse(BaseModel):
    total_points: int
    breakdown: Dict[str, Any]
    exercise: str
    reps: int
    sets: int
    weight_kg: Optional[float]

class ExerciseConfig(BaseModel):
    exercise: str
    name: str
    name_he: str
    category: str
    points_base: int
    enabled: bool = True

class AchievementConfig(BaseModel):
    id: str
    name: str
    name_he: str
    description: str
    description_he: str
    points: int
    icon: str
    enabled: bool = True

class RuleConfig(BaseModel):
    id: str
    name: str
    name_he: str
    description: str
    description_he: str
    rule_type: str
    value: float
    enabled: bool = True

router = APIRouter()

# Configuration file paths
POINTS_CONFIG_DIR = "data/points_config"
EXERCISE_POINTS_FILE = f"{POINTS_CONFIG_DIR}/exercise_points.json"
ACHIEVEMENTS_FILE = f"{POINTS_CONFIG_DIR}/achievements.json"
RULES_FILE = f"{POINTS_CONFIG_DIR}/rules.json"

# Ensure config directory exists
os.makedirs(POINTS_CONFIG_DIR, exist_ok=True)


@router.get("/exercises")
async def get_exercise_points(
    current_user: User = Depends(get_current_user)
):
    """Get exercise points configuration"""
    try:
        # Try to load from file first
        if os.path.exists(EXERCISE_POINTS_FILE):
            with open(EXERCISE_POINTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {"exercises": data}
        
        # Fallback to service configuration
        exercises = []
        for exercise_key, mapping in exercise_integration_service.exercise_mappings.items():
            exercises.append({
                "exercise": exercise_key,
                "name_he": mapping["name_he"],
                "name_en": mapping["name"],
                "category": mapping["category"],
                "points_base": mapping["points_base"],
                "primary_muscle": mapping["primary_muscle"],
                "weight_multiplier": 0.1,  # Default values
                "reps_multiplier": 1.0,
                "sets_multiplier": 5.0
            })
        
        return {"exercises": exercises}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load exercise points: {str(e)}")


@router.get("/public/exercises")
async def get_exercise_points_public():
    """Get exercise points configuration (public endpoint for development)"""
    try:
        # Try to load from file first
        if os.path.exists(EXERCISE_POINTS_FILE):
            with open(EXERCISE_POINTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {"exercises": data}
        
        # Fallback to default configuration
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


@router.get("/achievements")
async def get_achievements(
    current_user: User = Depends(get_current_user)
):
    """Get achievements configuration"""
    try:
        # Try to load from file first
        if os.path.exists(ACHIEVEMENTS_FILE):
            with open(ACHIEVEMENTS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {"achievements": data}
        
        # Fallback to service configuration
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
        
        return {"achievements": achievements}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load achievements: {str(e)}")


@router.get("/rules")
async def get_points_rules(
    current_user: User = Depends(get_current_user)
):
    """Get points rules configuration"""
    try:
        # Try to load from file first
        if os.path.exists(RULES_FILE):
            with open(RULES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {"rules": data}
        
        # Default rules
        default_rules = [
            {
                "id": "weight_bonus",
                "name": "Weight Bonus",
                "description": "Bonus points for weighted exercises",
                "type": "multiplier",
                "value": 0.1,
                "condition": "weight_kg > 0",
                "enabled": True
            },
            {
                "id": "high_rep_bonus",
                "name": "High Rep Bonus",
                "description": "Bonus for exercises with 20+ reps",
                "type": "bonus",
                "value": 50,
                "condition": "reps >= 20",
                "enabled": True
            },
            {
                "id": "personal_record",
                "name": "Personal Record",
                "description": "Bonus for setting new personal records",
                "type": "bonus",
                "value": 50,
                "condition": "is_personal_record = true",
                "enabled": True
            }
        ]
        
        return {"rules": default_rules}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load points rules: {str(e)}")


@router.post("/save")
async def save_points_configuration(
    config: Dict[str, Any],
    current_user: User = Depends(get_current_admin_user)
):
    """Save points configuration"""
    try:
        # Validate user has admin privileges (you might want to add an admin role check)
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Admin privileges required")
        
        # Save exercises
        if "exercises" in config:
            with open(EXERCISE_POINTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(config["exercises"], f, ensure_ascii=False, indent=2)
        
        # Save achievements
        if "achievements" in config:
            with open(ACHIEVEMENTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(config["achievements"], f, ensure_ascii=False, indent=2)
        
        # Save rules
        if "rules" in config:
            with open(RULES_FILE, 'w', encoding='utf-8') as f:
                json.dump(config["rules"], f, ensure_ascii=False, indent=2)
        
        # Update service configuration in memory
        await update_service_configuration(config)
        
        return {"message": "Configuration saved successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save configuration: {str(e)}")


@router.post("/calculate")
async def calculate_exercise_points(
    exercise_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Calculate points for an exercise based on current configuration"""
    try:
        # Load current configuration
        exercises_response = await get_exercise_points(current_user)
        rules_response = await get_points_rules(current_user)
        
        exercises = exercises_response["exercises"]
        rules = rules_response["rules"]
        
        # Find the exercise
        exercise_key = exercise_data.get("exercise")
        if not exercise_key:
            raise HTTPException(status_code=400, detail="Exercise key is required")
        
        exercise_config = None
        for ex in exercises:
            if ex["exercise"] == exercise_key:
                exercise_config = ex
                break
        
        if not exercise_config:
            raise HTTPException(status_code=404, detail="Exercise configuration not found")
        
        # Calculate base points
        points = exercise_config["points_base"]
        reps = exercise_data.get("reps", 1)
        sets = exercise_data.get("sets", 1)
        weight = exercise_data.get("weight_kg", 0)
        
        # Apply multipliers
        points *= reps * exercise_config["reps_multiplier"]
        points *= sets * exercise_config["sets_multiplier"]
        
        # Weight bonus
        if weight > 0:
            points += weight * exercise_config["weight_multiplier"]
        
        # Apply rules
        for rule in rules:
            if not rule["enabled"]:
                continue
            
            if rule["type"] == "bonus":
                if rule["condition"] == "reps >= 20" and reps >= 20:
                    points += rule["value"]
                elif rule["condition"] == "weight_kg > 0" and weight > 0:
                    points += rule["value"]
        
        return {
            "exercise": exercise_key,
            "points": int(points),
            "breakdown": {
                "base_points": exercise_config["points_base"],
                "reps": reps,
                "sets": sets,
                "weight": weight,
                "final_points": int(points)
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate points: {str(e)}")


@router.get("/stats/{user_id}")
async def get_user_points_stats(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get points statistics for a user"""
    try:
        # Users can only see their own stats unless they're admin
        if current_user.id != user_id and not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get user's exercises
        query = select(Exercise).where(Exercise.user_id == user_id)
        result = await db.execute(query)
        exercises = result.scalars().all()
        
        # Calculate statistics
        total_points = sum(ex.points_earned or 0 for ex in exercises)
        total_exercises = len(exercises)
        total_workouts = len(set(ex.workout_id for ex in exercises))
        
        # Get workout dates for streak calculation
        workout_query = select(Workout).where(Workout.user_id == user_id)
        workout_result = await db.execute(workout_query)
        workouts = workout_result.scalars().all()
        
        workout_dates = [w.started_at.date() for w in workouts]
        current_streak = gamification_service.calculate_streak(workout_dates)
        
        # Calculate level
        level_info = gamification_service.calculate_level(total_points)
        
        # Get achievements
        user_stats = {
            "total_workouts": total_workouts,
            "current_streak": current_streak,
            "total_exercises": total_exercises,
            "max_reps_single_exercise": max((ex.reps or 0) * (ex.sets or 1) for ex in exercises) if exercises else 0,
            "max_weight_lifted": max(ex.weight_kg or 0 for ex in exercises) if exercises else 0,
        }
        
        earned_achievements = gamification_service.check_achievements(user_stats)
        
        return {
            "user_id": user_id,
            "total_points": total_points,
            "total_exercises": total_exercises,
            "total_workouts": total_workouts,
            "current_streak": current_streak,
            "level": level_info,
            "achievements": [ach.value for ach in earned_achievements],
            "recent_exercises": [
                {
                    "name": ex.name_he,
                    "points": ex.points_earned,
                    "date": ex.created_at.isoformat() if ex.created_at else None
                }
                for ex in sorted(exercises, key=lambda x: x.created_at or datetime.min, reverse=True)[:10]
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get points leaderboard"""
    try:
        # Get all users with their total points
        # This is a simplified version - you might want to optimize this for production
        query = select(User)
        result = await db.execute(query)
        users = result.scalars().all()
        
        leaderboard_data = []
        
        for user in users:
            # Get user's total points
            exercise_query = select(Exercise).where(Exercise.user_id == user.id)
            exercise_result = await db.execute(exercise_query)
            exercises = exercise_result.scalars().all()
            
            total_points = sum(ex.points_earned or 0 for ex in exercises)
            
            leaderboard_data.append({
                "user_id": user.id,
                "username": user.username,
                "total_points": total_points,
                "total_exercises": len(exercises)
            })
        
        # Sort by points
        leaderboard_data.sort(key=lambda x: x["total_points"], reverse=True)
        
        # Add positions
        for i, entry in enumerate(leaderboard_data):
            entry["position"] = i + 1
        
        return {
            "leaderboard": leaderboard_data[:limit],
            "current_user_position": next(
                (entry["position"] for entry in leaderboard_data if entry["user_id"] == current_user.id),
                None
            )
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")


async def update_service_configuration(config: Dict[str, Any]):
    """Update in-memory service configuration"""
    try:
        # Update exercise mappings
        if "exercises" in config:
            for exercise_config in config["exercises"]:
                exercise_key = exercise_config["exercise"]
                if exercise_key in exercise_integration_service.exercise_mappings:
                    exercise_integration_service.exercise_mappings[exercise_key]["points_base"] = exercise_config["points_base"]
        
        # Update achievements
        if "achievements" in config:
            # This would require updating the gamification service
            # For now, we'll just log it
            print(f"Achievements updated: {len(config['achievements'])} achievements")
        
        # Update rules
        if "rules" in config:
            # This would require updating the points calculation logic
            # For now, we'll just log it
            print(f"Rules updated: {len(config['rules'])} rules")
    
    except Exception as e:
        print(f"Failed to update service configuration: {e}")


@router.get("/config/export")
async def export_configuration(
    current_user: User = Depends(get_current_admin_user)
):
    """Export complete points configuration"""
    try:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Admin privileges required")
        
        exercises_response = await get_exercise_points(current_user)
        achievements_response = await get_achievements(current_user)
        rules_response = await get_points_rules(current_user)
        
        export_data = {
            "exercises": exercises_response["exercises"],
            "achievements": achievements_response["achievements"],
            "rules": rules_response["rules"],
            "export_date": datetime.now().isoformat(),
            "version": "1.0"
        }
        
        return export_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export configuration: {str(e)}")


@router.post("/config/import")
async def import_configuration(
    config_data: Dict[str, Any],
    current_user: User = Depends(get_current_admin_user)
):
    """Import points configuration"""
    try:
        if not current_user.is_superuser:
            raise HTTPException(status_code=403, detail="Admin privileges required")
        
        # Validate configuration structure
        required_sections = ["exercises", "achievements", "rules"]
        for section in required_sections:
            if section not in config_data:
                raise HTTPException(status_code=400, detail=f"Missing required section: {section}")
        
        # Save the imported configuration
        await save_points_configuration(config_data, current_user)
        
        return {
            "message": "Configuration imported successfully",
            "imported_exercises": len(config_data["exercises"]),
            "imported_achievements": len(config_data["achievements"]),
            "imported_rules": len(config_data["rules"])
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to import configuration: {str(e)}")