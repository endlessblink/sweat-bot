"""
CRUD operations for exercises
Handles database operations for exercise logging and retrieval
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import uuid

from app.models.models import Exercise, Workout, User
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate

async def create_exercise(db: AsyncSession, exercise: ExerciseCreate) -> Exercise:
    """Create a new exercise record"""
    db_exercise = Exercise(
        id=uuid.uuid4(),
        workout_id=exercise.workout_id,
        name=exercise.name,
        name_he=exercise.name_he,
        category=getattr(exercise, 'category', 'general'),
        muscle_group=getattr(exercise, 'muscle_group', None),
        sets=exercise.sets or 1,
        reps=exercise.reps,
        weight_kg=exercise.weight_kg,
        distance_km=exercise.distance_km,
        duration_seconds=exercise.duration_seconds,
        rest_seconds=getattr(exercise, 'rest_seconds', None),
        calories_burned=getattr(exercise, 'calories_burned', None),
        points_earned=getattr(exercise, 'points_earned', 0),
        voice_command=getattr(exercise, 'voice_command', None),
        order_in_workout=getattr(exercise, 'order_in_workout', 1),
        notes=getattr(exercise, 'notes', None),
        timestamp=datetime.utcnow()
    )
    
    db.add(db_exercise)
    await db.commit()
    await db.refresh(db_exercise)
    
    return db_exercise

async def get_exercise(db: AsyncSession, exercise_id: str) -> Optional[Exercise]:
    """Get an exercise by ID"""
    result = await db.execute(
        select(Exercise)
        .options(selectinload(Exercise.workout))
        .where(Exercise.id == exercise_id)
    )
    return result.scalar_one_or_none()

async def get_exercises_by_workout(db: AsyncSession, workout_id: str) -> List[Exercise]:
    """Get all exercises in a workout"""
    result = await db.execute(
        select(Exercise)
        .where(Exercise.workout_id == workout_id)
        .order_by(Exercise.order_in_workout, Exercise.timestamp)
    )
    return result.scalars().all()

async def get_user_exercises(
    db: AsyncSession, 
    user_id: str, 
    limit: int = 50,
    exercise_name: Optional[str] = None
) -> List[Exercise]:
    """Get exercises for a specific user"""
    query = (
        select(Exercise)
        .join(Workout)
        .where(Workout.user_id == user_id)
        .order_by(Exercise.timestamp.desc())
        .limit(limit)
    )
    
    if exercise_name:
        query = query.where(
            (Exercise.name == exercise_name) | 
            (Exercise.name_he == exercise_name)
        )
    
    result = await db.execute(query)
    return result.scalars().all()

async def update_exercise(
    db: AsyncSession, 
    exercise_id: str, 
    exercise_update: ExerciseUpdate
) -> Optional[Exercise]:
    """Update an exercise"""
    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    db_exercise = result.scalar_one_or_none()
    
    if not db_exercise:
        return None
    
    # Update fields
    update_data = exercise_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_exercise, field, value)
    
    await db.commit()
    await db.refresh(db_exercise)
    
    return db_exercise

async def delete_exercise(db: AsyncSession, exercise_id: str) -> bool:
    """Delete an exercise"""
    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    db_exercise = result.scalar_one_or_none()
    
    if not db_exercise:
        return False
    
    await db.delete(db_exercise)
    await db.commit()
    
    return True

async def get_exercise_statistics(db: AsyncSession, user_id: str) -> dict:
    """Get comprehensive exercise statistics for a user"""
    
    # Get total statistics
    total_stats_result = await db.execute(
        select(
            func.count(Exercise.id).label('total_exercises'),
            func.sum(Exercise.reps * Exercise.sets).label('total_reps'),
            func.sum(Exercise.weight_kg * Exercise.reps * Exercise.sets).label('total_weight'),
            func.sum(Exercise.points_earned).label('total_points'),
            func.sum(Exercise.calories_burned).label('total_calories')
        )
        .join(Workout)
        .where(Workout.user_id == user_id)
    )
    
    total_stats = total_stats_result.first()
    
    # Get exercise breakdown
    exercise_breakdown_result = await db.execute(
        select(
            Exercise.name_he,
            func.count(Exercise.id).label('count'),
            func.sum(Exercise.reps * Exercise.sets).label('total_reps'),
            func.sum(Exercise.points_earned).label('points'),
            func.max(Exercise.timestamp).label('last_performed')
        )
        .join(Workout)
        .where(Workout.user_id == user_id)
        .group_by(Exercise.name_he)
        .order_by(func.sum(Exercise.points_earned).desc())
    )
    
    exercise_breakdown = exercise_breakdown_result.all()
    
    return {
        "total_stats": {
            "total_exercises": total_stats.total_exercises or 0,
            "total_reps": total_stats.total_reps or 0,
            "total_weight_kg": total_stats.total_weight or 0.0,
            "total_points": total_stats.total_points or 0,
            "total_calories": total_stats.total_calories or 0
        },
        "exercise_breakdown": [
            {
                "name": ex.name_he,
                "count": ex.count,
                "total_reps": ex.total_reps or 0,
                "points": ex.points or 0,
                "last_performed": ex.last_performed.isoformat() if ex.last_performed else None
            } for ex in exercise_breakdown
        ]
    }