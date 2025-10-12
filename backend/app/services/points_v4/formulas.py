"""
Point Calculation Formulas - Transparent and Scientific

All formulas are based on measurable work:
- Strength: mechanical work (force × distance proxy = weight × reps)
- Cardio: distance × pace factor + elevation
- Core: time under tension or repetitions

NO eval() - All calculations are explicit, safe, and auditable
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from decimal import Decimal
import math


@dataclass
class PointsBreakdown:
    """
    Transparent breakdown of point calculation
    Shows user exactly how points were earned
    """
    # Base components
    base_points: int = 0
    reps_component: int = 0
    sets_component: int = 0
    weight_component: int = 0
    distance_component: int = 0
    pace_factor: float = 1.0
    duration_component: int = 0
    elevation_component: int = 0

    # Bonuses (additive)
    set_completion_bonus: int = 0
    weight_bonus: int = 0
    progressive_overload_bonus: int = 0
    variety_bonus: int = 0
    pr_bonus: int = 0
    rpe_bonus: int = 0
    zone_bonus: int = 0
    milestone_bonus: int = 0
    synergy_bonus: int = 0

    # Total before multipliers
    subtotal: int = 0

    # Multipliers (multiplicative)
    streak_multiplier: float = 1.0
    challenge_multiplier: float = 1.0
    seasonal_multiplier: float = 1.0
    total_multiplier: float = 1.0
    multiplier_cap_applied: bool = False

    # Caps and reductions
    soft_cap_threshold: int = 0
    hard_cap: int = 0
    cap_reduction: int = 0

    # Final total
    total_points: int = 0

    # Display text
    display_text_en: str = ""
    display_text_he: str = ""

    # Applied rules (for audit trail)
    applied_bonuses: List[str] = field(default_factory=list)
    applied_multipliers: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


@dataclass
class CalculationResult:
    """
    Complete calculation result with breakdown and metadata
    """
    total_points: int
    breakdown: PointsBreakdown
    exercise_key: str
    calculation_time_ms: float
    status: str = "completed"  # completed, capped, flagged
    errors: List[str] = field(default_factory=list)


class StrengthFormulaCalculator:
    """
    Strength exercise point calculator

    Formula: base = Σ(0.1 × weight_kg × reps) + bodyweight_bonus

    Exercises: squat, push_up, pull_up, deadlift, bench_press, rope_climb

    Bonuses:
    - Set completion: +2 per set with reps ≥ 5
    - Weight bonus: +30 for any weighted exercise
    - Progressive overload: +10% if volume > 4-week average
    - PR bonus: +15 when improving estimated 1RM
    - RPE bonus: +1 per set for RPE ≥ 8

    Caps:
    - Soft cap at 250 points (0.5x additional)
    - Hard cap at 350 points
    """

    # Coefficients (can be moved to config table later)
    WEIGHT_FACTOR = 0.1
    BODYWEIGHT_FACTOR = 0.05  # For bodyweight exercises
    SET_BONUS = 2
    WEIGHT_BONUS = 30
    PR_BONUS = 15
    RPE_BONUS_PER_SET = 1
    OVERLOAD_BONUS_PERCENT = 10

    SOFT_CAP = 250
    HARD_CAP = 350

    # Bodyweight exercises (don't require weight_kg)
    BODYWEIGHT_EXERCISES = {'push_up', 'pull_up', 'rope_climb'}

    @classmethod
    def calculate(
        cls,
        exercise_key: str,
        sets: int,
        reps_per_set: List[int],  # Can vary per set
        weights_per_set: List[float],  # Can vary per set
        rpe_per_set: Optional[List[float]] = None,
        user_4week_avg_volume: Optional[float] = None,
        user_previous_1rm: Optional[float] = None
    ) -> CalculationResult:
        """
        Calculate points for strength exercise

        Args:
            exercise_key: e.g., 'squat', 'deadlift'
            sets: Number of sets
            reps_per_set: Reps for each set [10, 8, 8]
            weights_per_set: Weight for each set [50, 55, 55]
            rpe_per_set: Optional RPE ratings [7, 8, 9]
            user_4week_avg_volume: User's 4-week average for progressive overload detection
            user_previous_1rm: User's previous estimated 1RM for PR detection

        Returns:
            CalculationResult with full breakdown
        """
        import time
        start_time = time.time()

        breakdown = PointsBreakdown()

        # Validate inputs
        if sets != len(reps_per_set) or sets != len(weights_per_set):
            return CalculationResult(
                total_points=0,
                breakdown=breakdown,
                exercise_key=exercise_key,
                calculation_time_ms=0,
                status="error",
                errors=["Sets count mismatch with reps/weights arrays"]
            )

        # ================================================================
        # BASE CALCULATION: Volume = weight × reps
        # ================================================================

        total_volume = 0
        total_reps = 0
        is_bodyweight = exercise_key in cls.BODYWEIGHT_EXERCISES

        for i in range(sets):
            reps = reps_per_set[i]
            weight = weights_per_set[i]
            total_reps += reps

            if is_bodyweight or weight > 0:
                # Calculate volume per set
                if is_bodyweight and weight == 0:
                    # Bodyweight exercise without added weight
                    volume = reps * cls.BODYWEIGHT_FACTOR * 100  # Assume ~70kg bodyweight baseline
                else:
                    volume = weight * reps * cls.WEIGHT_FACTOR

                total_volume += volume

        breakdown.base_points = int(total_volume)
        breakdown.reps_component = total_reps
        breakdown.sets_component = sets
        breakdown.weight_component = int(sum(weights_per_set))

        # ================================================================
        # BONUSES
        # ================================================================

        # Set completion bonus: +2 per quality set (reps ≥ 5)
        quality_sets = sum(1 for r in reps_per_set if r >= 5)
        if quality_sets > 0:
            breakdown.set_completion_bonus = quality_sets * cls.SET_BONUS
            breakdown.applied_bonuses.append(f"set_completion_x{quality_sets}")

        # Weight bonus: +30 for any weighted exercise
        has_weight = any(w > 0 for w in weights_per_set)
        if has_weight:
            breakdown.weight_bonus = cls.WEIGHT_BONUS
            breakdown.applied_bonuses.append("weight_bonus")

        # Progressive overload bonus: +10% if volume > 4-week average
        if user_4week_avg_volume and total_volume > user_4week_avg_volume:
            overload_bonus = int(breakdown.base_points * (cls.OVERLOAD_BONUS_PERCENT / 100))
            breakdown.progressive_overload_bonus = overload_bonus
            breakdown.applied_bonuses.append("progressive_overload")

        # PR bonus: +15 when improving estimated 1RM
        if user_previous_1rm:
            # Estimate 1RM using Epley formula: 1RM = weight × (1 + reps/30)
            max_set_idx = 0
            max_1rm_estimate = 0
            for i in range(sets):
                estimated_1rm = weights_per_set[i] * (1 + reps_per_set[i] / 30)
                if estimated_1rm > max_1rm_estimate:
                    max_1rm_estimate = estimated_1rm
                    max_set_idx = i

            if max_1rm_estimate > user_previous_1rm:
                breakdown.pr_bonus = cls.PR_BONUS
                breakdown.applied_bonuses.append(f"pr_bonus (new 1RM: {max_1rm_estimate:.1f}kg)")

        # RPE bonus: +1 per set for RPE ≥ 8
        if rpe_per_set:
            high_effort_sets = sum(1 for rpe in rpe_per_set if rpe and rpe >= 8)
            if high_effort_sets > 0:
                breakdown.rpe_bonus = high_effort_sets * cls.RPE_BONUS_PER_SET
                breakdown.applied_bonuses.append(f"rpe_x{high_effort_sets}")

        # ================================================================
        # CALCULATE SUBTOTAL (before multipliers)
        # ================================================================

        breakdown.subtotal = (
            breakdown.base_points +
            breakdown.set_completion_bonus +
            breakdown.weight_bonus +
            breakdown.progressive_overload_bonus +
            breakdown.pr_bonus +
            breakdown.rpe_bonus
        )

        # ================================================================
        # APPLY CAPS (soft cap with diminishing returns)
        # ================================================================

        breakdown.soft_cap_threshold = cls.SOFT_CAP
        breakdown.hard_cap = cls.HARD_CAP

        if breakdown.subtotal > cls.SOFT_CAP:
            # Apply 0.5x to points above soft cap
            excess = breakdown.subtotal - cls.SOFT_CAP
            reduction = int(excess * 0.5)
            breakdown.cap_reduction = reduction
            breakdown.subtotal -= reduction
            breakdown.warnings.append(f"Soft cap applied: reduced {reduction} points")

        if breakdown.subtotal > cls.HARD_CAP:
            # Hard cap
            breakdown.cap_reduction += (breakdown.subtotal - cls.HARD_CAP)
            breakdown.subtotal = cls.HARD_CAP
            breakdown.warnings.append(f"Hard cap applied at {cls.HARD_CAP} points")

        # ================================================================
        # FINAL TOTAL (multipliers applied separately in MultiplierSystem)
        # ================================================================

        breakdown.total_points = breakdown.subtotal
        breakdown.total_multiplier = 1.0  # Multipliers applied later

        # ================================================================
        # GENERATE DISPLAY TEXT
        # ================================================================

        bonus_parts = []
        if breakdown.set_completion_bonus > 0:
            bonus_parts.append(f"{breakdown.set_completion_bonus} sets")
        if breakdown.weight_bonus > 0:
            bonus_parts.append(f"{breakdown.weight_bonus} weight")
        if breakdown.progressive_overload_bonus > 0:
            bonus_parts.append(f"{breakdown.progressive_overload_bonus} overload")
        if breakdown.pr_bonus > 0:
            bonus_parts.append(f"{breakdown.pr_bonus} PR")
        if breakdown.rpe_bonus > 0:
            bonus_parts.append(f"{breakdown.rpe_bonus} RPE")

        bonus_text = " + ".join(bonus_parts) if bonus_parts else "no bonuses"

        breakdown.display_text_en = (
            f"You earned {breakdown.total_points} points: "
            f"{breakdown.base_points} base + {bonus_text}"
        )

        breakdown.display_text_he = (
            f"השגת {breakdown.total_points} נקודות: "
            f"{breakdown.base_points} בסיס + {bonus_text}"
        )

        # Calculation time
        calc_time_ms = (time.time() - start_time) * 1000

        return CalculationResult(
            total_points=breakdown.total_points,
            breakdown=breakdown,
            exercise_key=exercise_key,
            calculation_time_ms=calc_time_ms,
            status="completed"
        )


class CardioFormulaCalculator:
    """
    Cardio exercise point calculator

    Formula: base = distance_km × pace_factor × coefficient

    Exercises: running, cycling, walking, burpee

    pace_factor = clamp(reference_pace / actual_pace, 0.6, 1.4)

    Bonuses:
    - Elevation: +1 per 50m (running), +1 per 100m (cycling)
    - Zone: +10 if HR in Zone 2-3, +15 if Zone 4
    - Milestone: +10 for first 10K of week

    Caps:
    - Running: 400 (soft at 300)
    - Cycling: 450 (soft at 350)
    - Walking: 250
    """

    # Base coefficients
    RUNNING_COEFFICIENT = 40
    CYCLING_COEFFICIENT = 5
    WALKING_COEFFICIENT = 5
    BURPEE_COEFFICIENT = 0.8  # Per burpee

    # Reference paces (seconds per km)
    RUNNING_REFERENCE_PACE_SEC_PER_KM = 360  # 6:00/km baseline
    CYCLING_REFERENCE_SPEED_KMH = 25
    WALKING_REFERENCE_PACE_SEC_PER_KM = 540  # 9:00/km

    # Pace factor clamps
    PACE_FACTOR_MIN = 0.6
    PACE_FACTOR_MAX = 1.4

    # Bonuses
    ELEVATION_BONUS_RUNNING_PER_50M = 1
    ELEVATION_BONUS_CYCLING_PER_100M = 1
    ZONE_2_3_BONUS = 10
    ZONE_4_BONUS = 15
    MILESTONE_10K_BONUS = 10

    # Caps
    RUNNING_SOFT_CAP = 300
    RUNNING_HARD_CAP = 400
    CYCLING_SOFT_CAP = 350
    CYCLING_HARD_CAP = 450
    WALKING_SOFT_CAP = 200
    WALKING_HARD_CAP = 250
    BURPEE_HARD_CAP = 300

    @classmethod
    def calculate_running(
        cls,
        distance_km: float,
        duration_sec: int,
        elevation_gain_m: int = 0,
        avg_hr: Optional[int] = None,
        is_first_10k_this_week: bool = False
    ) -> CalculationResult:
        """Calculate points for running"""
        import time
        start_time = time.time()

        breakdown = PointsBreakdown()

        # ================================================================
        # BASE CALCULATION: distance × pace_factor × coefficient
        # ================================================================

        # Calculate pace (sec per km)
        actual_pace_sec_per_km = duration_sec / distance_km if distance_km > 0 else 0

        # Pace factor: faster than reference = higher factor
        pace_factor = cls.RUNNING_REFERENCE_PACE_SEC_PER_KM / actual_pace_sec_per_km if actual_pace_sec_per_km > 0 else 1.0
        pace_factor = max(cls.PACE_FACTOR_MIN, min(pace_factor, cls.PACE_FACTOR_MAX))

        breakdown.distance_component = int(distance_km * pace_factor * cls.RUNNING_COEFFICIENT)
        breakdown.pace_factor = round(pace_factor, 2)
        breakdown.base_points = breakdown.distance_component

        # ================================================================
        # BONUSES
        # ================================================================

        # Elevation bonus: +1 per 50m
        if elevation_gain_m > 0:
            breakdown.elevation_component = elevation_gain_m // 50
            breakdown.applied_bonuses.append(f"elevation_{elevation_gain_m}m")

        # HR zone bonus
        if avg_hr:
            if 120 <= avg_hr <= 160:  # Zone 2-3 (moderate)
                breakdown.zone_bonus = cls.ZONE_2_3_BONUS
                breakdown.applied_bonuses.append("zone_2-3")
            elif 160 < avg_hr <= 180:  # Zone 4 (hard)
                breakdown.zone_bonus = cls.ZONE_4_BONUS
                breakdown.applied_bonuses.append("zone_4")

        # Milestone bonus: first 10K of week
        if is_first_10k_this_week and distance_km >= 10.0:
            breakdown.milestone_bonus = cls.MILESTONE_10K_BONUS
            breakdown.applied_bonuses.append("first_10k_week")

        # ================================================================
        # SUBTOTAL
        # ================================================================

        breakdown.subtotal = (
            breakdown.base_points +
            breakdown.elevation_component +
            breakdown.zone_bonus +
            breakdown.milestone_bonus
        )

        # ================================================================
        # APPLY CAPS
        # ================================================================

        breakdown.soft_cap_threshold = cls.RUNNING_SOFT_CAP
        breakdown.hard_cap = cls.RUNNING_HARD_CAP

        if breakdown.subtotal > cls.RUNNING_SOFT_CAP:
            excess = breakdown.subtotal - cls.RUNNING_SOFT_CAP
            reduction = int(excess * 0.5)
            breakdown.cap_reduction = reduction
            breakdown.subtotal -= reduction
            breakdown.warnings.append(f"Running soft cap: reduced {reduction} points")

        if breakdown.subtotal > cls.RUNNING_HARD_CAP:
            breakdown.cap_reduction += (breakdown.subtotal - cls.RUNNING_HARD_CAP)
            breakdown.subtotal = cls.RUNNING_HARD_CAP
            breakdown.warnings.append(f"Running hard cap at {cls.RUNNING_HARD_CAP}")

        breakdown.total_points = breakdown.subtotal

        # ================================================================
        # DISPLAY TEXT
        # ================================================================

        bonus_sum = breakdown.elevation_component + breakdown.zone_bonus + breakdown.milestone_bonus

        breakdown.display_text_en = (
            f"You earned {breakdown.total_points} points: "
            f"{breakdown.base_points} base ({distance_km}km × {pace_factor:.2f} pace)"
        )
        if bonus_sum > 0:
            breakdown.display_text_en += f" + {bonus_sum} bonuses"

        breakdown.display_text_he = (
            f"השגת {breakdown.total_points} נקודות: "
            f"{breakdown.base_points} בסיס ({distance_km} ק\"מ × {pace_factor:.2f} קצב)"
        )
        if bonus_sum > 0:
            breakdown.display_text_he += f" + {bonus_sum} בונוסים"

        calc_time_ms = (time.time() - start_time) * 1000

        return CalculationResult(
            total_points=breakdown.total_points,
            breakdown=breakdown,
            exercise_key="running",
            calculation_time_ms=calc_time_ms
        )

    @classmethod
    def calculate_cycling(
        cls,
        distance_km: float,
        duration_sec: int,
        elevation_gain_m: int = 0
    ) -> CalculationResult:
        """Calculate points for cycling"""
        import time
        start_time = time.time()

        breakdown = PointsBreakdown()

        # Calculate speed (km/h)
        duration_hours = duration_sec / 3600
        avg_speed_kmh = distance_km / duration_hours if duration_hours > 0 else 0

        # Speed factor: faster = higher factor
        speed_factor = avg_speed_kmh / cls.CYCLING_REFERENCE_SPEED_KMH
        speed_factor = max(0.7, min(speed_factor, 1.3))

        breakdown.distance_component = int(distance_km * cls.CYCLING_COEFFICIENT * speed_factor)
        breakdown.pace_factor = round(speed_factor, 2)
        breakdown.base_points = breakdown.distance_component

        # Elevation bonus: +1 per 100m
        if elevation_gain_m > 0:
            breakdown.elevation_component = elevation_gain_m // 100
            breakdown.applied_bonuses.append(f"elevation_{elevation_gain_m}m")

        breakdown.subtotal = breakdown.base_points + breakdown.elevation_component

        # Apply caps
        breakdown.soft_cap_threshold = cls.CYCLING_SOFT_CAP
        breakdown.hard_cap = cls.CYCLING_HARD_CAP

        if breakdown.subtotal > cls.CYCLING_SOFT_CAP:
            excess = breakdown.subtotal - cls.CYCLING_SOFT_CAP
            reduction = int(excess * 0.5)
            breakdown.cap_reduction = reduction
            breakdown.subtotal -= reduction

        if breakdown.subtotal > cls.CYCLING_HARD_CAP:
            breakdown.cap_reduction += (breakdown.subtotal - cls.CYCLING_HARD_CAP)
            breakdown.subtotal = cls.CYCLING_HARD_CAP

        breakdown.total_points = breakdown.subtotal

        # Display text
        breakdown.display_text_en = f"You earned {breakdown.total_points} points: {breakdown.base_points} base ({distance_km}km × {speed_factor:.2f} speed)"
        breakdown.display_text_he = f"השגת {breakdown.total_points} נקודות: {breakdown.base_points} בסיס ({distance_km} ק\"מ × {speed_factor:.2f} מהירות)"

        calc_time_ms = (time.time() - start_time) * 1000

        return CalculationResult(
            total_points=breakdown.total_points,
            breakdown=breakdown,
            exercise_key="cycling",
            calculation_time_ms=calc_time_ms
        )


class CoreFormulaCalculator:
    """
    Core exercise point calculator

    Formula:
    - Duration-based (plank): base = duration_sec × 0.1
    - Reps-based (sit-up, abs): base = reps × 0.2

    Exercises: plank, sit_up, abs

    Bonuses:
    - PR bonus: +10 for longest hold (plank)
    - Synergy: +5 if both duration and reps core exercises same day

    Cap: 250 per activity
    """

    DURATION_FACTOR = 0.1  # Points per second
    REPS_FACTOR = 0.2  # Points per rep
    PR_BONUS = 10
    SYNERGY_BONUS = 5
    HARD_CAP = 250

    @classmethod
    def calculate_duration(
        cls,
        exercise_key: str,
        duration_sec: int,
        user_best_duration: Optional[int] = None
    ) -> CalculationResult:
        """Calculate points for duration-based core (e.g., plank)"""
        import time
        start_time = time.time()

        breakdown = PointsBreakdown()

        breakdown.duration_component = int(duration_sec * cls.DURATION_FACTOR)
        breakdown.base_points = breakdown.duration_component

        # PR bonus for longest hold
        if user_best_duration and duration_sec > user_best_duration:
            breakdown.pr_bonus = cls.PR_BONUS
            breakdown.applied_bonuses.append(f"pr_bonus (new best: {duration_sec}s)")

        breakdown.subtotal = breakdown.base_points + breakdown.pr_bonus

        # Apply hard cap
        if breakdown.subtotal > cls.HARD_CAP:
            breakdown.cap_reduction = breakdown.subtotal - cls.HARD_CAP
            breakdown.subtotal = cls.HARD_CAP
            breakdown.warnings.append(f"Core hard cap at {cls.HARD_CAP}")

        breakdown.total_points = breakdown.subtotal

        # Display text
        breakdown.display_text_en = f"You earned {breakdown.total_points} points: {breakdown.base_points} base ({duration_sec}s hold)"
        breakdown.display_text_he = f"השגת {breakdown.total_points} נקודות: {breakdown.base_points} בסיס ({duration_sec}שניות החזקה)"

        calc_time_ms = (time.time() - start_time) * 1000

        return CalculationResult(
            total_points=breakdown.total_points,
            breakdown=breakdown,
            exercise_key=exercise_key,
            calculation_time_ms=calc_time_ms
        )

    @classmethod
    def calculate_reps(
        cls,
        exercise_key: str,
        reps: int
    ) -> CalculationResult:
        """Calculate points for reps-based core (e.g., sit-ups, abs)"""
        import time
        start_time = time.time()

        breakdown = PointsBreakdown()

        breakdown.reps_component = int(reps * cls.REPS_FACTOR)
        breakdown.base_points = breakdown.reps_component
        breakdown.subtotal = breakdown.base_points

        # Apply hard cap
        if breakdown.subtotal > cls.HARD_CAP:
            breakdown.cap_reduction = breakdown.subtotal - cls.HARD_CAP
            breakdown.subtotal = cls.HARD_CAP

        breakdown.total_points = breakdown.subtotal

        # Display text
        breakdown.display_text_en = f"You earned {breakdown.total_points} points: {breakdown.base_points} base ({reps} reps)"
        breakdown.display_text_he = f"השגת {breakdown.total_points} נקודות: {breakdown.base_points} בסיס ({reps} חזרות)"

        calc_time_ms = (time.time() - start_time) * 1000

        return CalculationResult(
            total_points=breakdown.total_points,
            breakdown=breakdown,
            exercise_key=exercise_key,
            calculation_time_ms=calc_time_ms
        )
