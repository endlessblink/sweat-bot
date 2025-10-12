"""
Activity Logging API - Points System v4.0

POST /v1/activities - Log exercise and calculate points
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
from datetime import datetime
from uuid import UUID, uuid4

from app.core.database import get_db
from app.models.models import User
from app.api.v1.auth import get_current_user
from app.services.points_v4.engine import PointsEngine
from app.models.points_models_v4 import (
    ActivityLog,
    ActivityStrengthSet,
    ActivityCardio,
    ActivityCore,
    PointsCalculation,
    ExerciseType
)

router = APIRouter()


# ================================================================
# REQUEST/RESPONSE MODELS
# ================================================================

class ActivityMetrics(BaseModel):
    """Exercise-specific metrics"""
    # Strength
    sets: Optional[int] = None
    reps: Optional[List[int]] = None
    weights: Optional[List[float]] = None
    rpe: Optional[List[int]] = None

    # Cardio
    distance_km: Optional[float] = None
    duration_sec: Optional[int] = None
    elevation_gain_m: Optional[int] = None
    avg_hr: Optional[int] = None

    # Core
    # duration_sec: already defined above
    # reps: already defined above

    @validator('rpe', each_item=True)
    def validate_rpe(cls, v):
        if v is not None and (v < 1 or v > 10):
            raise ValueError('RPE must be between 1 and 10')
        return v


class CreateActivityRequest(BaseModel):
    """Request body for POST /v1/activities"""
    exercise_key: str = Field(..., description="Exercise identifier (e.g., 'running', 'squat')")
    started_at: datetime = Field(..., description="Activity start time (ISO 8601)")
    ended_at: datetime = Field(..., description="Activity end time (ISO 8601)")
    metrics: ActivityMetrics = Field(..., description="Exercise-specific metrics")
    source: str = Field(default="manual", description="Activity source (manual, device:strava, etc.)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")


class StreakInfo(BaseModel):
    """User streak information"""
    current: int
    best: int
    grace_tokens: int = 0


class AchievementUnlocked(BaseModel):
    """Achievement unlock notification"""
    key: str
    name_en: str
    name_he: str
    points_reward: int
    tier: int
    icon_key: str


class PointsBreakdownResponse(BaseModel):
    """Detailed points breakdown"""
    base: int
    bonus: int
    multiplier: float
    total: int
    breakdown: Dict[str, Any]


class CreateActivityResponse(BaseModel):
    """Response for POST /v1/activities"""
    activity_id: UUID
    points: PointsBreakdownResponse
    streak: StreakInfo
    achievements_unlocked: List[AchievementUnlocked]
    display_text: str
    calculation_time_ms: float


# ================================================================
# ENDPOINTS
# ================================================================

@router.post(
    "/v1/activities",
    response_model=CreateActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log activity and calculate points",
    description="""
    Log a new exercise activity and receive instant points calculation with complete breakdown.

    **Supports all exercise types:**
    - **Strength**: squat, push_up, pull_up, deadlift, bench_press, rope_climb
    - **Cardio**: running, cycling, walking, burpee
    - **Core**: plank, sit_up, abs

    **Features:**
    - Transparent point calculation with detailed breakdown
    - Automatic fraud detection
    - Streak tracking with grace tokens
    - Achievement unlock detection
    - Personal record tracking
    - Progressive overload bonus

    **Example requests** available in the PRD docs/main-docs/POINTS_SYSTEM_V4_PRD.md
    """
)
async def create_activity(
    request: CreateActivityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Log exercise activity and calculate points

    Flow:
    1. Validate exercise type exists
    2. Create activity_log entry
    3. Create exercise-specific detail entry (strength_set/cardio/core)
    4. Calculate points using PointsEngine
    5. Store points_calculation
    6. Update user stats (async worker in Phase 2)
    7. Check for achievement unlocks (async worker in Phase 2)
    8. Return complete response
    """

    # ================================================================
    # STEP 1: VALIDATE EXERCISE TYPE
    # ================================================================

    from sqlalchemy import select
    exercise_type_query = select(ExerciseType).where(ExerciseType.key == request.exercise_key)
    result = await db.execute(exercise_type_query)
    exercise_type = result.scalar_one_or_none()

    if not exercise_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise type '{request.exercise_key}' not found"
        )

    # ================================================================
    # STEP 2: CREATE ACTIVITY LOG
    # ================================================================

    activity_log = ActivityLog(
        id=uuid4(),
        user_id=current_user.id,
        exercise_type_id=exercise_type.id,
        started_at=request.started_at,
        ended_at=request.ended_at,
        source=request.source,
        is_valid=True,  # Will be set to False if fraud detected
        notes=request.notes
    )

    db.add(activity_log)
    await db.flush()  # Get the activity ID

    # ================================================================
    # STEP 3: CREATE EXERCISE-SPECIFIC DETAIL ENTRY
    # ================================================================

    if request.exercise_key in PointsEngine.STRENGTH_EXERCISES:
        # Create strength sets
        if request.metrics.sets and request.metrics.reps:
            for set_index in range(request.metrics.sets):
                strength_set = ActivityStrengthSet(
                    id=uuid4(),
                    activity_id=activity_log.id,
                    set_index=set_index + 1,
                    reps=request.metrics.reps[set_index] if set_index < len(request.metrics.reps) else request.metrics.reps[-1],
                    weight_kg=request.metrics.weights[set_index] if request.metrics.weights and set_index < len(request.metrics.weights) else None,
                    rpe=request.metrics.rpe[set_index] if request.metrics.rpe and set_index < len(request.metrics.rpe) else None
                )
                db.add(strength_set)

    elif request.exercise_key in PointsEngine.CARDIO_EXERCISES:
        # Create cardio entry
        cardio = ActivityCardio(
            activity_id=activity_log.id,
            distance_km=request.metrics.distance_km or 0,
            duration_sec=request.metrics.duration_sec or 0,
            avg_hr=request.metrics.avg_hr,
            elevation_gain_m=request.metrics.elevation_gain_m or 0
        )
        db.add(cardio)

    elif request.exercise_key in PointsEngine.CORE_EXERCISES:
        # Create core entry
        core = ActivityCore(
            activity_id=activity_log.id,
            reps=request.metrics.reps[0] if request.metrics.reps else None,
            duration_sec=request.metrics.duration_sec
        )
        db.add(core)

    # ================================================================
    # STEP 4: CALCULATE POINTS
    # ================================================================

    # Prepare activity data for engine
    activity_data = {}
    if request.exercise_key in PointsEngine.STRENGTH_EXERCISES:
        activity_data = {
            "sets": request.metrics.sets,
            "reps": request.metrics.reps,
            "weights": request.metrics.weights,
            "rpe": request.metrics.rpe
        }
    elif request.exercise_key in PointsEngine.CARDIO_EXERCISES:
        activity_data = {
            "distance_km": request.metrics.distance_km,
            "duration_sec": request.metrics.duration_sec,
            "elevation_gain_m": request.metrics.elevation_gain_m,
            "avg_hr": request.metrics.avg_hr
        }
    elif request.exercise_key in PointsEngine.CORE_EXERCISES:
        activity_data = {
            "reps": request.metrics.reps[0] if request.metrics.reps else None,
            "duration_sec": request.metrics.duration_sec
        }

    # TODO: Fetch user context from database (streak, challenges, etc.)
    # For now, use minimal context
    user_context = {
        "streak_days": 0,
        "exercises_today": [],
        "active_challenges": []
    }

    # Calculate points
    calculation_result = await PointsEngine.calculate_activity_points(
        user_id=str(current_user.id),
        exercise_key=request.exercise_key,
        activity_data=activity_data,
        user_context=user_context,
        db=db
    )

    # ================================================================
    # STEP 5: STORE POINTS CALCULATION
    # ================================================================

    breakdown_json = PointsEngine.generate_breakdown_json(calculation_result)

    points_calc = PointsCalculation(
        id=uuid4(),
        activity_id=activity_log.id,
        user_id=current_user.id,
        exercise_type_id=exercise_type.id,
        base_points=calculation_result.breakdown.base_points,
        bonus_points=calculation_result.breakdown.subtotal - calculation_result.breakdown.base_points,
        multiplier=calculation_result.breakdown.total_multiplier,
        breakdown_json=breakdown_json
    )

    db.add(points_calc)

    # ================================================================
    # STEP 6: COMMIT ALL CHANGES
    # ================================================================

    await db.commit()

    # ================================================================
    # STEP 7: RETURN RESPONSE
    # ================================================================

    # TODO: Phase 2 - Trigger async workers for:
    # - Update user_stats_daily
    # - Update user_stats_summary
    # - Check achievement unlocks
    # - Update leaderboards
    # - Check for PRs

    return CreateActivityResponse(
        activity_id=activity_log.id,
        points=PointsBreakdownResponse(
            base=calculation_result.breakdown.base_points,
            bonus=calculation_result.breakdown.subtotal - calculation_result.breakdown.base_points,
            multiplier=calculation_result.breakdown.total_multiplier,
            total=calculation_result.total_points,
            breakdown=breakdown_json
        ),
        streak=StreakInfo(
            current=user_context["streak_days"],
            best=user_context["streak_days"]  # TODO: fetch from database
        ),
        achievements_unlocked=[],  # TODO: Phase 2
        display_text=calculation_result.breakdown.display_text_en,
        calculation_time_ms=calculation_result.calculation_time_ms
    )
