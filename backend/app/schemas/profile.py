"""
Pydantic schemas for user profile management
Includes health stats, equipment inventory, and fitness preferences
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class HealthStatsCreate(BaseModel):
    """Schema for creating/updating health statistics"""
    age: Optional[int] = Field(None, ge=13, le=120, description="User age")
    weight_kg: Optional[float] = Field(None, gt=0, le=500, description="Weight in kg")
    height_cm: Optional[float] = Field(None, gt=0, le=300, description="Height in cm")
    body_fat_percentage: Optional[float] = Field(None, ge=0, le=100, description="Body fat %")
    resting_heart_rate: Optional[int] = Field(None, ge=30, le=200, description="Resting HR")
    blood_pressure_systolic: Optional[int] = Field(None, ge=70, le=250, description="Systolic BP")
    blood_pressure_diastolic: Optional[int] = Field(None, ge=40, le=150, description="Diastolic BP")
    fitness_level: Optional[str] = Field(None, description="beginner, intermediate, advanced")
    activity_level: Optional[str] = Field(None, description="Activity level")
    workout_frequency_per_week: Optional[int] = Field(None, ge=0, le=14, description="Workouts/week")
    preferred_workout_duration_minutes: Optional[int] = Field(None, ge=5, le=300, description="Session length")

    @validator('fitness_level')
    def validate_fitness_level(cls, v):
        if v and v not in ['beginner', 'intermediate', 'advanced']:
            raise ValueError('fitness_level must be beginner, intermediate, or advanced')
        return v

    @validator('activity_level')
    def validate_activity_level(cls, v):
        valid_levels = ['sedentary', 'lightly_active', 'moderate', 'very_active', 'extremely_active']
        if v and v not in valid_levels:
            raise ValueError(f'activity_level must be one of: {", ".join(valid_levels)}')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "age": 30,
                "weight_kg": 75.0,
                "height_cm": 175.0,
                "fitness_level": "intermediate",
                "activity_level": "moderate",
                "workout_frequency_per_week": 4,
                "preferred_workout_duration_minutes": 45
            }
        }


class MedicalInfoCreate(BaseModel):
    """Schema for medical conditions and injuries"""
    medical_conditions: Optional[List[str]] = Field(default=[], description="Medical conditions")
    injuries: Optional[List[str]] = Field(default=[], description="Current or past injuries")

    class Config:
        json_schema_extra = {
            "example": {
                "medical_conditions": ["asthma", "hypertension"],
                "injuries": ["knee surgery 2020", "shoulder strain"]
            }
        }


class EquipmentInventoryCreate(BaseModel):
    """Schema for equipment inventory"""
    available_equipment: Optional[Dict[str, Any]] = Field(default={}, description="Equipment inventory")
    equipment_preferences: Optional[Dict[str, Any]] = Field(default={}, description="Equipment preferences")

    class Config:
        json_schema_extra = {
            "example": {
                "available_equipment": {
                    "bodyweight": True,
                    "resistance_bands": {"light": True, "medium": False, "heavy": False},
                    "dumbbells": {"max_weight_kg": 20, "pairs": [5, 10, 15, 20]},
                    "yoga_mat": True,
                    "pull_up_bar": False
                },
                "equipment_preferences": {
                    "preferred_types": ["bodyweight", "resistance_bands"],
                    "avoid_equipment": ["barbell"],
                    "min_space_required": "2x2 meters"
                }
            }
        }


class FitnessPreferencesCreate(BaseModel):
    """Schema for fitness goals and preferences"""
    fitness_goals: Optional[List[str]] = Field(default=[], description="Fitness goals")
    preferred_workout_types: Optional[List[str]] = Field(default=[], description="Workout types")
    avoid_exercises: Optional[List[str]] = Field(default=[], description="Exercises to avoid")
    focus_areas: Optional[List[str]] = Field(default=[], description="Body areas to focus")
    time_constraints: Optional[Dict[str, Any]] = Field(default={}, description="Schedule constraints")

    class Config:
        json_schema_extra = {
            "example": {
                "fitness_goals": ["weight_loss", "muscle_gain", "endurance"],
                "preferred_workout_types": ["hiit", "strength", "cardio"],
                "avoid_exercises": ["jumping", "high_impact"],
                "focus_areas": ["upper_body", "core"],
                "time_constraints": {
                    "max_workout_duration": 45,
                    "preferred_times": ["morning", "evening"],
                    "days_available": ["monday", "wednesday", "friday", "sunday"]
                }
            }
        }


class ProfileComplete(BaseModel):
    """Complete user profile response"""
    # Basic info
    user_id: str
    email: str
    full_name: Optional[str] = None
    full_name_he: Optional[str] = None

    # Health stats
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    resting_heart_rate: Optional[int] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    fitness_level: Optional[str] = None
    activity_level: Optional[str] = None
    workout_frequency_per_week: Optional[int] = None
    preferred_workout_duration_minutes: Optional[int] = None

    # Medical info
    medical_conditions: Optional[List[str]] = None
    injuries: Optional[List[str]] = None

    # Equipment
    available_equipment: Optional[Dict[str, Any]] = None
    equipment_preferences: Optional[Dict[str, Any]] = None

    # Preferences
    fitness_goals: Optional[List[str]] = None
    preferred_workout_types: Optional[List[str]] = None
    avoid_exercises: Optional[List[str]] = None
    focus_areas: Optional[List[str]] = None
    time_constraints: Optional[Dict[str, Any]] = None

    # Tracking
    profile_completion_percentage: int = 0
    onboarding_completed: bool = False
    last_profile_update: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProfileUpdateResponse(BaseModel):
    """Response after profile update"""
    success: bool
    message: str
    profile_completion_percentage: int
    updated_fields: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Profile updated successfully",
                "profile_completion_percentage": 75,
                "updated_fields": ["age", "weight_kg", "fitness_level"]
            }
        }
