"""
Exercise Tracking API Endpoints
Handles CRUD operations for exercises and workout logging
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.models import Exercise, Workout, PersonalRecord, User
from app.api.v1.auth import get_current_user
from app.services.gamification_service import GamificationService
from app.services.hebrew_parser_service import HebrewParserService

router = APIRouter()

# Pydantic models for API
class ExerciseInput(BaseModel):
    """Input model for logging an exercise"""
    name: str = Field(..., description="Exercise name in English or Hebrew")
    name_he: Optional[str] = Field(None, description="Hebrew name")
    reps: Optional[int] = Field(None, ge=0)
    sets: Optional[int] = Field(1, ge=1)
    weight_kg: Optional[float] = Field(None, ge=0)
    distance_km: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    voice_command: Optional[str] = None  # Original Hebrew command

class ExerciseResponse(BaseModel):
    """Response model for exercise data"""
    id: str
    name: str
    name_he: str
    sets: int
    reps: Optional[int]
    weight_kg: Optional[float]
    distance_km: Optional[float]
    duration_seconds: Optional[int]
    points_earned: int
    is_personal_record: bool
    timestamp: datetime
    
    class Config:
        from_attributes = True

class WorkoutResponse(BaseModel):
    """Response model for workout session"""
    id: str
    started_at: datetime
    completed_at: Optional[datetime]
    total_exercises: int
    total_points: int
    exercises: List[ExerciseResponse]
    
    class Config:
        from_attributes = True

class PersonalRecordResponse(BaseModel):
    """Response model for personal records"""
    exercise_name: str
    exercise_name_he: str
    record_type: str
    value: float
    unit: str
    achieved_at: datetime
    improvement_percentage: Optional[float]
    
    class Config:
        from_attributes = True

# Initialize services
gamification_service = GamificationService()
hebrew_parser = HebrewParserService()

@router.post("/log", response_model=ExerciseResponse)
async def log_exercise(
    exercise_input: ExerciseInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log a new exercise performance
    Supports Hebrew voice commands
    """
    # DEPRECATED: Hebrew parsing now handled by AI agent in frontend
    # Keeping for backward compatibility but not using
    # if exercise_input.voice_command:
    #     parsed = await hebrew_parser.parse_exercise_command(exercise_input.voice_command)
    #     if parsed:
    #         exercise_input = ExerciseInput(**{**exercise_input.dict(), **parsed})
    
    # Get or create current workout session
    workout = await get_or_create_workout(db, current_user.id)
    
    # DEPRECATED: Translation now handled by AI agent
    # Default to English name if Hebrew not provided
    if not exercise_input.name_he:
        exercise_input.name_he = exercise_input.name  # Just use English name as fallback
        # exercise_input.name_he = hebrew_parser.translate_exercise_name(exercise_input.name)
    
    # Create exercise record
    exercise = Exercise(
        workout_id=workout.id,
        name=exercise_input.name,
        name_he=exercise_input.name_he,
        sets=exercise_input.sets,
        reps=exercise_input.reps,
        weight_kg=exercise_input.weight_kg,
        distance_km=exercise_input.distance_km,
        duration_seconds=exercise_input.duration_seconds,
        voice_command=exercise_input.voice_command,
        order_in_workout=workout.total_exercises + 1
    )
    
    # Calculate points
    points = gamification_service.calculate_exercise_points(exercise)
    exercise.points_earned = points
    
    # Check for personal record
    is_pr = await check_personal_record(db, current_user.id, exercise)
    exercise.is_personal_record = is_pr
    
    if is_pr:
        await create_personal_record(db, current_user.id, exercise)
    
    # Update workout totals
    workout.total_exercises += 1
    workout.total_points += points
    if exercise.reps:
        workout.total_reps += exercise.reps * exercise.sets
    if exercise.weight_kg:
        workout.total_weight_kg += exercise.weight_kg * (exercise.reps or 1) * exercise.sets
    
    # Save to database
    db.add(exercise)
    db.add(workout)
    await db.commit()
    await db.refresh(exercise)
    
    return ExerciseResponse(
        id=str(exercise.id),
        name=exercise.name,
        name_he=exercise.name_he,
        sets=exercise.sets,
        reps=exercise.reps,
        weight_kg=exercise.weight_kg,
        distance_km=exercise.distance_km,
        duration_seconds=exercise.duration_seconds,
        points_earned=exercise.points_earned,
        is_personal_record=exercise.is_personal_record,
        timestamp=exercise.timestamp
    )

@router.get("/history", response_model=List[ExerciseResponse])
async def get_exercise_history(
    exercise_name: Optional[str] = None,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get exercise history for the user"""
    query = select(Exercise).join(Workout).where(
        Workout.user_id == current_user.id
    )
    
    if exercise_name:
        query = query.where(
            (Exercise.name == exercise_name) | 
            (Exercise.name_he == exercise_name)
        )
    
    # Date filter
    start_date = datetime.now() - timedelta(days=days)
    query = query.where(Exercise.timestamp >= start_date)
    
    # Order by most recent
    query = query.order_by(Exercise.timestamp.desc())
    
    result = await db.execute(query)
    exercises = result.scalars().all()
    
    return [
        ExerciseResponse(
            id=str(e.id),
            name=e.name,
            name_he=e.name_he,
            sets=e.sets,
            reps=e.reps,
            weight_kg=e.weight_kg,
            distance_km=e.distance_km,
            duration_seconds=e.duration_seconds,
            points_earned=e.points_earned,
            is_personal_record=e.is_personal_record,
            timestamp=e.timestamp
        ) for e in exercises
    ]

@router.get("/personal-records", response_model=List[PersonalRecordResponse])
async def get_personal_records(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all personal records for the user"""
    query = select(PersonalRecord).where(
        PersonalRecord.user_id == current_user.id
    ).order_by(PersonalRecord.achieved_at.desc())
    
    result = await db.execute(query)
    records = result.scalars().all()
    
    return [
        PersonalRecordResponse(
            exercise_name=pr.exercise_name,
            exercise_name_he=pr.exercise_name_he,
            record_type=pr.record_type,
            value=pr.value,
            unit=pr.unit,
            achieved_at=pr.achieved_at,
            improvement_percentage=pr.improvement_percentage
        ) for pr in records
    ]

@router.get("/statistics")
async def get_exercise_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive exercise statistics"""
    # Get total stats
    total_query = select(
        func.count(Exercise.id).label('total_exercises'),
        func.sum(Exercise.reps * Exercise.sets).label('total_reps'),
        func.sum(Exercise.weight_kg * Exercise.reps * Exercise.sets).label('total_weight'),
        func.sum(Exercise.points_earned).label('total_points')
    ).join(Workout).where(Workout.user_id == current_user.id)
    
    total_result = await db.execute(total_query)
    total_stats = total_result.first()
    
    # Get exercise breakdown
    breakdown_query = select(
        Exercise.name_he,
        func.count(Exercise.id).label('count'),
        func.sum(Exercise.reps * Exercise.sets).label('total_reps'),
        func.sum(Exercise.points_earned).label('points')
    ).join(Workout).where(
        Workout.user_id == current_user.id
    ).group_by(Exercise.name_he).order_by(func.sum(Exercise.points_earned).desc())
    
    breakdown_result = await db.execute(breakdown_query)
    exercise_breakdown = breakdown_result.all()
    
    # Get weekly progress
    week_ago = datetime.now() - timedelta(days=7)
    weekly_query = select(
        func.date(Exercise.timestamp).label('date'),
        func.count(Exercise.id).label('count'),
        func.sum(Exercise.points_earned).label('points')
    ).join(Workout).where(
        and_(
            Workout.user_id == current_user.id,
            Exercise.timestamp >= week_ago
        )
    ).group_by(func.date(Exercise.timestamp))
    
    weekly_result = await db.execute(weekly_query)
    weekly_progress = weekly_result.all()
    
    return {
        "total_stats": {
            "total_exercises": total_stats.total_exercises or 0,
            "total_reps": total_stats.total_reps or 0,
            "total_weight_kg": total_stats.total_weight or 0,
            "total_points": total_stats.total_points or 0
        },
        "exercise_breakdown": [
            {
                "name": ex.name_he,
                "count": ex.count,
                "total_reps": ex.total_reps,
                "points": ex.points
            } for ex in exercise_breakdown
        ],
        "weekly_progress": [
            {
                "date": str(wp.date),
                "exercises": wp.count,
                "points": wp.points
            } for wp in weekly_progress
        ]
    }

@router.post("/parse-hebrew")
async def parse_hebrew_command(
    command: str,
    current_user: User = Depends(get_current_user)
):
    """Parse a Hebrew exercise command"""
    parsed = await hebrew_parser.parse_exercise_command(command)
    return {
        "original": command,
        "parsed": parsed,
        "confidence": parsed.get("confidence", 0) if parsed else 0
    }

# Helper functions
async def get_or_create_workout(db: AsyncSession, user_id: str) -> Workout:
    """Get current workout or create new one"""
    # Check for active workout (not completed, less than 2 hours old)
    two_hours_ago = datetime.now() - timedelta(hours=2)
    
    query = select(Workout).where(
        and_(
            Workout.user_id == user_id,
            Workout.is_completed == False,
            Workout.started_at >= two_hours_ago
        )
    )
    
    result = await db.execute(query)
    workout = result.scalar_one_or_none()
    
    if not workout:
        # Create new workout
        workout = Workout(
            user_id=user_id,
            workout_type="general",
            workout_name="Daily Workout",
            workout_name_he="אימון יומי"
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)
    
    return workout

async def check_personal_record(db: AsyncSession, user_id: str, exercise: Exercise) -> bool:
    """Check if this exercise is a personal record"""
    # Check for max weight PR
    if exercise.weight_kg:
        query = select(func.max(Exercise.weight_kg)).select_from(Exercise).join(Workout).where(
            and_(
                Workout.user_id == user_id,
                Exercise.name == exercise.name
            )
        )
        result = await db.execute(query)
        max_weight = result.scalar()
        
        if not max_weight or exercise.weight_kg > max_weight:
            return True
    
    # Check for max reps PR (at same weight or bodyweight)
    if exercise.reps:
        query = select(func.max(Exercise.reps)).select_from(Exercise).join(Workout).where(
            and_(
                Workout.user_id == user_id,
                Exercise.name == exercise.name,
                Exercise.weight_kg == exercise.weight_kg
            )
        )
        result = await db.execute(query)
        max_reps = result.scalar()
        
        if not max_reps or exercise.reps > max_reps:
            return True
    
    return False

async def create_personal_record(db: AsyncSession, user_id: str, exercise: Exercise):
    """Create a personal record entry"""
    record_type = "max_weight" if exercise.weight_kg else "max_reps"
    value = exercise.weight_kg if exercise.weight_kg else exercise.reps
    unit = "kg" if exercise.weight_kg else "reps"
    
    pr = PersonalRecord(
        user_id=user_id,
        exercise_name=exercise.name,
        exercise_name_he=exercise.name_he,
        record_type=record_type,
        value=value,
        unit=unit,
        additional_info={"reps": exercise.reps} if exercise.weight_kg else {}
    )
    
    db.add(pr)
    await db.commit()

# Data Management Endpoints
@router.post("/reset-points")
async def reset_points(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset user's points to 0"""
    # Update all exercises to have 0 points
    query = select(Exercise).join(Workout).where(Workout.user_id == current_user.id)
    result = await db.execute(query)
    exercises = result.scalars().all()
    
    for exercise in exercises:
        exercise.points_earned = 0
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Points reset successfully",
        "exercises_affected": len(exercises)
    }

@router.delete("/clear")
async def clear_exercises(
    period: Optional[str] = "all",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear exercise history for specified period"""
    from datetime import datetime, timedelta
    
    # Build query based on period
    query = select(Exercise).join(Workout).where(Workout.user_id == current_user.id)
    
    if period == "today":
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.where(Exercise.created_at >= today_start)
    elif period == "week":
        week_ago = datetime.now() - timedelta(days=7)
        query = query.where(Exercise.created_at >= week_ago)
    elif period == "month":
        month_ago = datetime.now() - timedelta(days=30)
        query = query.where(Exercise.created_at >= month_ago)
    
    result = await db.execute(query)
    exercises = result.scalars().all()
    
    # Delete exercises
    for exercise in exercises:
        await db.delete(exercise)
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"Cleared {len(exercises)} exercises",
        "period": period
    }

@router.delete("/clear-all")
async def clear_all_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear ALL user data including exercises, workouts, and personal records"""
    # Clear exercises
    exercises_query = select(Exercise).join(Workout).where(Workout.user_id == current_user.id)
    exercises_result = await db.execute(exercises_query)
    exercises = exercises_result.scalars().all()
    for exercise in exercises:
        await db.delete(exercise)
    
    # Clear workouts
    workouts_query = select(Workout).where(Workout.user_id == current_user.id)
    workouts_result = await db.execute(workouts_query)
    workouts = workouts_result.scalars().all()
    for workout in workouts:
        await db.delete(workout)
    
    # Clear personal records
    pr_query = select(PersonalRecord).where(PersonalRecord.user_id == current_user.id)
    pr_result = await db.execute(pr_query)
    personal_records = pr_result.scalars().all()
    for pr in personal_records:
        await db.delete(pr)
    
    await db.commit()
    
    return {
        "success": True,
        "message": "All data cleared successfully",
        "deleted": {
            "exercises": len(exercises),
            "workouts": len(workouts),
            "personal_records": len(personal_records)
        }
    }