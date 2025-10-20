"""
Pydantic schemas for goal data validation
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class GoalBase(BaseModel):
    """Base goal schema"""
    name: str = Field(..., description="Goal name in English")
    name_he: str = Field(..., description="Goal name in Hebrew")
    description: str = Field(..., description="Goal description in English")
    description_he: str = Field(..., description="Goal description in Hebrew")
    category: str = Field(..., description="Goal category (e.g., consistency, performance)")
    target_type: str = Field(..., description="Type of activity to track (e.g., session, reps, distance)")
    target_value: int = Field(..., description="Numerical target for the goal")
    time_period: str = Field(..., description="Time frame for the goal (e.g., weekly, monthly, daily)")
    points_reward: int = Field(..., description="Points awarded upon completion")
    is_active: bool = Field(True, description="Whether the goal is active")

class GoalCreate(GoalBase):
    """Schema for creating a goal"""
    pass

class GoalUpdate(BaseModel):
    """Schema for updating a goal"""
    name: Optional[str] = None
    name_he: Optional[str] = None
    description: Optional[str] = None
    description_he: Optional[str] = None
    category: Optional[str] = None
    target_type: Optional[str] = None
    target_value: Optional[int] = None
    time_period: Optional[str] = None
    points_reward: Optional[int] = None
    is_active: Optional[bool] = None

class GoalResponse(GoalBase):
    """Schema for goal response"""
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
