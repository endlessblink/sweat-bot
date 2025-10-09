"""
Profile management API endpoints
Provides endpoints for creating and updating user profiles
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.models import User
from app.schemas.profile import (
    HealthStatsCreate,
    MedicalInfoCreate,
    EquipmentInventoryCreate,
    FitnessPreferencesCreate,
    ProfileComplete,
    ProfileUpdateResponse
)
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


def calculate_profile_completion(user: User) -> int:
    """Calculate profile completion percentage based on filled fields"""
    total_points = 100
    points = 0

    # Basic info (30 points)
    if user.age:
        points += 10
    if user.weight_kg:
        points += 10
    if user.height_cm:
        points += 10

    # Fitness level & activity (20 points)
    if user.fitness_level:
        points += 10
    if user.activity_level:
        points += 10

    # Workout preferences (20 points)
    if user.workout_frequency_per_week:
        points += 10
    if user.preferred_workout_duration_minutes:
        points += 10

    # Goals (20 points)
    if user.fitness_goals and len(user.fitness_goals) > 0:
        points += 10
    if user.preferred_workout_types and len(user.preferred_workout_types) > 0:
        points += 10

    # Equipment (10 points)
    if user.available_equipment:
        points += 10

    return min(points, total_points)


@router.post("/health-stats", response_model=ProfileUpdateResponse)
async def update_health_stats(
    health_stats: HealthStatsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user health statistics"""
    updated_fields = []

    # Update health stats fields
    for field, value in health_stats.dict(exclude_unset=True).items():
        if value is not None:
            setattr(current_user, field, value)
            updated_fields.append(field)

    # Update profile tracking
    current_user.last_profile_update = datetime.utcnow()
    current_user.profile_completion_percentage = calculate_profile_completion(current_user)

    db.commit()
    db.refresh(current_user)

    return ProfileUpdateResponse(
        success=True,
        message="Health statistics updated successfully",
        profile_completion_percentage=current_user.profile_completion_percentage,
        updated_fields=updated_fields
    )


@router.post("/medical-info", response_model=ProfileUpdateResponse)
async def update_medical_info(
    medical_info: MedicalInfoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update medical conditions and injuries"""
    updated_fields = []

    if medical_info.medical_conditions is not None:
        current_user.medical_conditions = medical_info.medical_conditions
        updated_fields.append("medical_conditions")

    if medical_info.injuries is not None:
        current_user.injuries = medical_info.injuries
        updated_fields.append("injuries")

    # Update profile tracking
    current_user.last_profile_update = datetime.utcnow()
    current_user.profile_completion_percentage = calculate_profile_completion(current_user)

    db.commit()
    db.refresh(current_user)

    return ProfileUpdateResponse(
        success=True,
        message="Medical information updated successfully",
        profile_completion_percentage=current_user.profile_completion_percentage,
        updated_fields=updated_fields
    )


@router.post("/equipment", response_model=ProfileUpdateResponse)
async def update_equipment_inventory(
    equipment: EquipmentInventoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update equipment inventory and preferences"""
    updated_fields = []

    if equipment.available_equipment is not None:
        current_user.available_equipment = equipment.available_equipment
        updated_fields.append("available_equipment")

    if equipment.equipment_preferences is not None:
        current_user.equipment_preferences = equipment.equipment_preferences
        updated_fields.append("equipment_preferences")

    # Update profile tracking
    current_user.last_profile_update = datetime.utcnow()
    current_user.profile_completion_percentage = calculate_profile_completion(current_user)

    db.commit()
    db.refresh(current_user)

    return ProfileUpdateResponse(
        success=True,
        message="Equipment inventory updated successfully",
        profile_completion_percentage=current_user.profile_completion_percentage,
        updated_fields=updated_fields
    )


@router.post("/preferences", response_model=ProfileUpdateResponse)
async def update_fitness_preferences(
    preferences: FitnessPreferencesCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update fitness goals and workout preferences"""
    updated_fields = []

    for field, value in preferences.dict(exclude_unset=True).items():
        if value is not None:
            setattr(current_user, field, value)
            updated_fields.append(field)

    # Update profile tracking
    current_user.last_profile_update = datetime.utcnow()
    current_user.profile_completion_percentage = calculate_profile_completion(current_user)

    # Mark onboarding as completed if profile is sufficiently complete
    if current_user.profile_completion_percentage >= 70:
        current_user.onboarding_completed = True

    db.commit()
    db.refresh(current_user)

    return ProfileUpdateResponse(
        success=True,
        message="Fitness preferences updated successfully",
        profile_completion_percentage=current_user.profile_completion_percentage,
        updated_fields=updated_fields
    )


@router.get("/complete", response_model=ProfileComplete)
async def get_complete_profile(
    current_user: User = Depends(get_current_user)
):
    """Get complete user profile"""
    return ProfileComplete(
        user_id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        full_name_he=current_user.full_name_he,
        age=current_user.age,
        weight_kg=current_user.weight_kg,
        height_cm=current_user.height_cm,
        body_fat_percentage=current_user.body_fat_percentage,
        resting_heart_rate=current_user.resting_heart_rate,
        blood_pressure_systolic=current_user.blood_pressure_systolic,
        blood_pressure_diastolic=current_user.blood_pressure_diastolic,
        fitness_level=current_user.fitness_level,
        activity_level=current_user.activity_level,
        workout_frequency_per_week=current_user.workout_frequency_per_week,
        preferred_workout_duration_minutes=current_user.preferred_workout_duration_minutes,
        medical_conditions=current_user.medical_conditions,
        injuries=current_user.injuries,
        available_equipment=current_user.available_equipment,
        equipment_preferences=current_user.equipment_preferences,
        fitness_goals=current_user.fitness_goals,
        preferred_workout_types=current_user.preferred_workout_types,
        avoid_exercises=current_user.avoid_exercises,
        focus_areas=current_user.focus_areas,
        time_constraints=current_user.time_constraints,
        profile_completion_percentage=current_user.profile_completion_percentage,
        onboarding_completed=current_user.onboarding_completed or False,
        last_profile_update=current_user.last_profile_update
    )


@router.get("/completion-status")
async def get_profile_completion_status(
    current_user: User = Depends(get_current_user)
):
    """Get profile completion status with missing fields"""
    completion = calculate_profile_completion(current_user)

    missing_fields = []
    if not current_user.age:
        missing_fields.append("age")
    if not current_user.weight_kg:
        missing_fields.append("weight_kg")
    if not current_user.height_cm:
        missing_fields.append("height_cm")
    if not current_user.fitness_level:
        missing_fields.append("fitness_level")
    if not current_user.activity_level:
        missing_fields.append("activity_level")
    if not current_user.workout_frequency_per_week:
        missing_fields.append("workout_frequency_per_week")
    if not current_user.fitness_goals or len(current_user.fitness_goals) == 0:
        missing_fields.append("fitness_goals")
    if not current_user.preferred_workout_types or len(current_user.preferred_workout_types) == 0:
        missing_fields.append("preferred_workout_types")

    return {
        "profile_completion_percentage": completion,
        "onboarding_completed": current_user.onboarding_completed or False,
        "missing_fields": missing_fields,
        "total_fields": 10,
        "completed_fields": 10 - len(missing_fields)
    }
