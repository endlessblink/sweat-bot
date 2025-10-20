"""
Pydantic schemas for exercise data validation
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class ExerciseBase(BaseModel):
    """Base exercise schema"""
    name: str = Field(..., description="Exercise name in English")
    name_he: str = Field(..., description="Exercise name in Hebrew")
    category: Optional[str] = Field(None, description="Exercise category")
    muscle_group: Optional[str] = Field(None, description="Primary muscle group")
    sets: Optional[int] = Field(1, ge=1, description="Number of sets")
    reps: Optional[int] = Field(None, ge=0, description="Number of repetitions")
    weight_kg: Optional[float] = Field(None, ge=0, description="Weight in kilograms")
    distance_km: Optional[float] = Field(None, ge=0, description="Distance in kilometers")
    duration_seconds: Optional[int] = Field(None, ge=0, description="Duration in seconds")
    rest_seconds: Optional[int] = Field(None, ge=0, description="Rest time in seconds")
    notes: Optional[str] = Field(None, description="Additional notes")
    voice_command: Optional[str] = Field(None, description="Original voice command")

class ExerciseCreate(ExerciseBase):
    """Schema for creating an exercise"""
    workout_id: uuid.UUID = Field(..., description="Workout this exercise belongs to")
    order_in_workout: Optional[int] = Field(None, description="Order within workout")
    points_earned: Optional[int] = Field(0, description="Points earned for this exercise")

class ExerciseUpdate(BaseModel):
    """Schema for updating an exercise"""
    name: Optional[str] = None
    name_he: Optional[str] = None
    category: Optional[str] = None
    muscle_group: Optional[str] = None
    sets: Optional[int] = Field(None, ge=1)
    reps: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    distance_km: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    rest_seconds: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    points_earned: Optional[int] = None
    is_personal_record: Optional[bool] = None

class ExerciseResponse(ExerciseBase):
    """Schema for exercise response"""
    id: uuid.UUID
    workout_id: uuid.UUID
    points_earned: int
    calories_burned: Optional[int]
    is_personal_record: bool
    order_in_workout: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class ExerciseStatistics(BaseModel):
    """Schema for exercise statistics"""
    total_exercises: int
    total_reps: int
    total_weight_kg: float
    total_points: int
    total_calories: int

class ExerciseBreakdown(BaseModel):
    """Schema for exercise breakdown by type"""
    name: str
    count: int
    total_reps: int
    points: int
    last_performed: Optional[str]

class ExerciseStatsResponse(BaseModel):
    """Schema for comprehensive exercise statistics"""
    total_stats: ExerciseStatistics
    exercise_breakdown: list[ExerciseBreakdown]