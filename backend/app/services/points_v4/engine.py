"""
Points Calculation Engine v4.0 - Unified and Transparent

Single source of truth for all point calculations
NO eval() - all formulas are explicit and safe

Usage:
    from app.services.points_v4.engine import PointsEngine

    result = await PointsEngine.calculate_activity_points(
        user_id="uuid",
        exercise_key="squat",
        activity_data={"sets": 3, "reps": [10, 8, 8], "weights": [50, 55, 55]},
        user_context={"streak_days": 8, "exercises_today": ["squat"]}
    )

    print(result.breakdown.display_text_en)
    # "You earned 279 points: 150 base + 36 bonuses × 1.05 streak"
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from .formulas import (
    StrengthFormulaCalculator,
    CardioFormulaCalculator,
    CoreFormulaCalculator,
    CalculationResult,
    PointsBreakdown
)
from .bonuses import BonusSystem, BonusContext, MultiplierSystem, FraudDetection


class PointsEngine:
    """
    Unified points calculation engine

    Handles all exercise types with transparent formulas
    Returns complete breakdown for user trust
    """

    # Exercise type routing
    STRENGTH_EXERCISES = {'squat', 'push_up', 'pull_up', 'deadlift', 'bench_press', 'rope_climb'}
    CARDIO_EXERCISES = {'burpee', 'running', 'walking', 'cycling'}
    CORE_EXERCISES = {'plank', 'sit_up', 'abs'}

    @classmethod
    async def calculate_activity_points(
        cls,
        user_id: str,
        exercise_key: str,
        activity_data: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None,
        db: Optional[AsyncSession] = None
    ) -> CalculationResult:
        """
        Calculate points for any exercise type

        Args:
            user_id: User UUID
            exercise_key: Exercise identifier (e.g., 'squat', 'running')
            activity_data: Exercise-specific data (sets, reps, distance, etc.)
            user_context: Optional context (streak, challenges, seasonal events)
            db: Optional database session for fetching user stats

        Returns:
            CalculationResult with complete breakdown

        Example activity_data for strength:
            {
                "sets": 3,
                "reps": [10, 8, 8],
                "weights": [50, 55, 55],
                "rpe": [7, 8, 9]  # optional
            }

        Example activity_data for cardio:
            {
                "distance_km": 5.0,
                "duration_sec": 1650,  # 27:30
                "elevation_gain_m": 80,
                "avg_hr": 152  # optional
            }

        Example activity_data for core:
            {
                "duration_sec": 120  # for plank
                # OR
                "reps": 50  # for sit-ups
            }
        """
        import time
        start_time = time.time()

        # Initialize context
        context = user_context or {}
        streak_days = context.get("streak_days", 0)
        exercises_today = context.get("exercises_today", [])
        active_challenges = context.get("active_challenges", [])
        seasonal_event = context.get("seasonal_event", None)
        workout_hour = context.get("workout_hour", datetime.now().hour)

        # ================================================================
        # STEP 1: FRAUD DETECTION
        # ================================================================

        validation_result = cls._validate_activity(exercise_key, activity_data)

        if not validation_result["is_valid"]:
            # Return flagged result
            breakdown = PointsBreakdown()
            breakdown.warnings = validation_result["warnings"]
            return CalculationResult(
                total_points=0,
                breakdown=breakdown,
                exercise_key=exercise_key,
                calculation_time_ms=(time.time() - start_time) * 1000,
                status="flagged",
                errors=validation_result["flags"]
            )

        # ================================================================
        # STEP 2: CALCULATE BASE POINTS (Exercise-specific formula)
        # ================================================================

        if exercise_key in cls.STRENGTH_EXERCISES:
            result = await cls._calculate_strength(exercise_key, activity_data, user_context, db)

        elif exercise_key in cls.CARDIO_EXERCISES:
            result = await cls._calculate_cardio(exercise_key, activity_data, user_context, db)

        elif exercise_key in cls.CORE_EXERCISES:
            result = await cls._calculate_core(exercise_key, activity_data, user_context, db)

        else:
            # Unknown exercise type
            breakdown = PointsBreakdown()
            return CalculationResult(
                total_points=0,
                breakdown=breakdown,
                exercise_key=exercise_key,
                calculation_time_ms=(time.time() - start_time) * 1000,
                status="error",
                errors=[f"Unknown exercise type: {exercise_key}"]
            )

        # ================================================================
        # STEP 3: APPLY CROSS-EXERCISE BONUSES (variety, time-of-day)
        # ================================================================

        bonus_context = BonusContext(
            user_id=user_id,
            activity_date=date.today(),
            exercise_key=exercise_key,
            workout_hour=workout_hour,
            exercises_today=exercises_today
        )

        cross_bonuses = BonusSystem.calculate_all_bonuses(
            context=bonus_context,
            base_points=result.breakdown.subtotal
        )

        # Add cross-exercise bonuses
        if cross_bonuses["total_bonus"] > 0:
            result.breakdown.variety_bonus = cross_bonuses.get("breakdown", {}).get("variety", {}).get("bonus", 0)
            result.breakdown.subtotal += cross_bonuses["total_bonus"]

        # ================================================================
        # STEP 4: APPLY MULTIPLIERS (streak, challenge, seasonal)
        # ================================================================

        multiplier_result = MultiplierSystem.apply_multipliers(
            base_and_bonus_points=result.breakdown.subtotal,
            streak_days=streak_days,
            active_challenges=active_challenges,
            seasonal_event=seasonal_event
        )

        result.breakdown.streak_multiplier = multiplier_result["breakdown"].get("streak", {}).get("multiplier", 1.0)
        result.breakdown.challenge_multiplier = multiplier_result["breakdown"].get("challenge", {}).get("multiplier", 1.0)
        result.breakdown.seasonal_multiplier = multiplier_result["breakdown"].get("seasonal", {}).get("multiplier", 1.0)
        result.breakdown.total_multiplier = multiplier_result["total_multiplier"]
        result.breakdown.multiplier_cap_applied = multiplier_result["cap_applied"]
        result.breakdown.applied_multipliers = multiplier_result["applied_multipliers"]

        # Final total
        result.total_points = multiplier_result["final_points"]
        result.breakdown.total_points = multiplier_result["final_points"]

        # ================================================================
        # STEP 5: UPDATE DISPLAY TEXT WITH MULTIPLIERS
        # ================================================================

        if result.breakdown.total_multiplier > 1.0:
            mult_text = multiplier_result.get("display_text", "")
            result.breakdown.display_text_en += mult_text
            result.breakdown.display_text_he += mult_text

        # Add warnings from validation
        result.breakdown.warnings.extend(validation_result.get("warnings", []))

        # Final calculation time
        result.calculation_time_ms = (time.time() - start_time) * 1000

        return result

    @classmethod
    def _validate_activity(cls, exercise_key: str, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Route to appropriate fraud detection validator"""
        if exercise_key in cls.STRENGTH_EXERCISES:
            return FraudDetection.validate_strength_activity(
                exercise_key=exercise_key,
                sets=activity_data.get("sets", 1),
                reps_per_set=activity_data.get("reps", []),
                weights_per_set=activity_data.get("weights", [])
            )

        elif exercise_key in cls.CARDIO_EXERCISES:
            return FraudDetection.validate_cardio_activity(
                exercise_key=exercise_key,
                distance_km=activity_data.get("distance_km", 0),
                duration_sec=activity_data.get("duration_sec", 0),
                elevation_gain_m=activity_data.get("elevation_gain_m", 0)
            )

        elif exercise_key in cls.CORE_EXERCISES:
            return FraudDetection.validate_core_activity(
                exercise_key=exercise_key,
                reps=activity_data.get("reps"),
                duration_sec=activity_data.get("duration_sec")
            )

        return {"is_valid": True, "warnings": [], "flags": []}

    @classmethod
    async def _calculate_strength(
        cls,
        exercise_key: str,
        activity_data: Dict[str, Any],
        user_context: Optional[Dict[str, Any]],
        db: Optional[AsyncSession]
    ) -> CalculationResult:
        """Calculate points for strength exercise"""
        return StrengthFormulaCalculator.calculate(
            exercise_key=exercise_key,
            sets=activity_data.get("sets", 1),
            reps_per_set=activity_data.get("reps", []),
            weights_per_set=activity_data.get("weights", []),
            rpe_per_set=activity_data.get("rpe"),
            user_4week_avg_volume=user_context.get("user_4week_avg_volume") if user_context else None,
            user_previous_1rm=user_context.get("user_previous_1rm") if user_context else None
        )

    @classmethod
    async def _calculate_cardio(
        cls,
        exercise_key: str,
        activity_data: Dict[str, Any],
        user_context: Optional[Dict[str, Any]],
        db: Optional[AsyncSession]
    ) -> CalculationResult:
        """Calculate points for cardio exercise"""
        if exercise_key == "running":
            return CardioFormulaCalculator.calculate_running(
                distance_km=activity_data.get("distance_km", 0),
                duration_sec=activity_data.get("duration_sec", 0),
                elevation_gain_m=activity_data.get("elevation_gain_m", 0),
                avg_hr=activity_data.get("avg_hr"),
                is_first_10k_this_week=user_context.get("is_first_10k_this_week", False) if user_context else False
            )

        elif exercise_key == "cycling":
            return CardioFormulaCalculator.calculate_cycling(
                distance_km=activity_data.get("distance_km", 0),
                duration_sec=activity_data.get("duration_sec", 0),
                elevation_gain_m=activity_data.get("elevation_gain_m", 0)
            )

        else:
            # Walking, burpee - simplified for now
            return CardioFormulaCalculator.calculate_running(
                distance_km=activity_data.get("distance_km", 0),
                duration_sec=activity_data.get("duration_sec", 0),
                elevation_gain_m=activity_data.get("elevation_gain_m", 0)
            )

    @classmethod
    async def _calculate_core(
        cls,
        exercise_key: str,
        activity_data: Dict[str, Any],
        user_context: Optional[Dict[str, Any]],
        db: Optional[AsyncSession]
    ) -> CalculationResult:
        """Calculate points for core exercise"""
        # Duration-based (plank)
        if activity_data.get("duration_sec"):
            return CoreFormulaCalculator.calculate_duration(
                exercise_key=exercise_key,
                duration_sec=activity_data.get("duration_sec", 0),
                user_best_duration=user_context.get("user_best_duration") if user_context else None
            )

        # Reps-based (sit-up, abs)
        elif activity_data.get("reps"):
            return CoreFormulaCalculator.calculate_reps(
                exercise_key=exercise_key,
                reps=activity_data.get("reps", 0)
            )

        else:
            # No valid data
            breakdown = PointsBreakdown()
            return CalculationResult(
                total_points=0,
                breakdown=breakdown,
                exercise_key=exercise_key,
                calculation_time_ms=0,
                status="error",
                errors=["Core exercise requires either duration_sec or reps"]
            )

    @classmethod
    def generate_breakdown_json(cls, result: CalculationResult) -> Dict[str, Any]:
        """
        Generate complete breakdown JSON for database storage

        This is what gets stored in points_calculation.breakdown_json
        """
        b = result.breakdown

        return {
            "exercise_key": result.exercise_key,
            "components": {
                "base_points": b.base_points,
                "reps_component": b.reps_component,
                "sets_component": b.sets_component,
                "weight_component": b.weight_component,
                "distance_component": b.distance_component,
                "pace_factor": b.pace_factor,
                "duration_component": b.duration_component,
                "elevation_component": b.elevation_component
            },
            "bonuses": {
                "set_completion": b.set_completion_bonus,
                "weight": b.weight_bonus,
                "progressive_overload": b.progressive_overload_bonus,
                "variety": b.variety_bonus,
                "pr": b.pr_bonus,
                "rpe": b.rpe_bonus,
                "zone": b.zone_bonus,
                "milestone": b.milestone_bonus,
                "synergy": b.synergy_bonus,
                "total": b.subtotal - b.base_points
            },
            "multipliers": {
                "streak": b.streak_multiplier,
                "challenge": b.challenge_multiplier,
                "seasonal": b.seasonal_multiplier,
                "total": b.total_multiplier,
                "cap_applied": b.multiplier_cap_applied
            },
            "caps": {
                "soft_cap_threshold": b.soft_cap_threshold,
                "hard_cap": b.hard_cap,
                "reduction_applied": b.cap_reduction
            },
            "applied_bonuses": b.applied_bonuses,
            "applied_multipliers": b.applied_multipliers,
            "warnings": b.warnings,
            "total_points": b.total_points,
            "display_text_en": b.display_text_en,
            "display_text_he": b.display_text_he,
            "calculation_time_ms": result.calculation_time_ms,
            "status": result.status
        }
