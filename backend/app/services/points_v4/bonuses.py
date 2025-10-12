"""
Bonus and Multiplier Systems

Bonuses: Additive point increases for specific behaviors
Multipliers: Percentage increases applied after bonuses

All rules are transparent and configurable
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
from dataclasses import dataclass


@dataclass
class BonusContext:
    """Context needed for bonus calculations"""
    user_id: str
    activity_date: date
    exercise_key: str
    workout_hour: int

    # For variety bonus
    exercises_today: List[str]

    # For progressive overload
    user_4week_avg: Optional[float] = None
    current_volume: Optional[float] = None

    # For PR detection
    previous_best: Optional[float] = None
    current_value: Optional[float] = None

    # For time-of-day bonuses
    is_early_morning: bool = False  # Before 7 AM
    is_late_night: bool = False  # After 10 PM


class BonusSystem:
    """
    Applies bonus points for desired behaviors

    Bonuses encourage:
    - Variety (try different exercises)
    - Progressive overload (improvement over time)
    - Personal records (beat your best)
    - Time-of-day goals (early bird, night owl)
    - Consistency (session synergy)
    """

    # Bonus values
    VARIETY_BONUS = 5  # 3+ different exercises in one day
    PROGRESSIVE_OVERLOAD_PERCENT = 10  # 10% bonus if volume > 4-week avg
    PR_BONUS = 15  # Beat personal best
    EARLY_BIRD_BONUS = 10  # Workout before 7 AM
    NIGHT_OWL_BONUS = 10  # Workout after 10 PM
    SYNERGY_BONUS = 5  # Both duration and reps core exercises same day

    @classmethod
    def calculate_variety_bonus(cls, exercises_today: List[str]) -> Dict[str, Any]:
        """
        Variety bonus: +5 if 3+ different exercises in one day

        Encourages users to try different exercise types
        """
        unique_exercises = set(exercises_today)

        if len(unique_exercises) >= 3:
            return {
                "bonus": cls.VARIETY_BONUS,
                "applied": True,
                "reason": f"{len(unique_exercises)} different exercises today"
            }

        return {"bonus": 0, "applied": False}

    @classmethod
    def calculate_progressive_overload_bonus(
        cls,
        current_volume: float,
        user_4week_avg: Optional[float]
    ) -> Dict[str, Any]:
        """
        Progressive overload: +10% if current > 4-week average

        Rewards gradual strength increases
        """
        if not user_4week_avg or current_volume <= user_4week_avg:
            return {"bonus": 0, "applied": False}

        improvement_percent = ((current_volume - user_4week_avg) / user_4week_avg) * 100

        return {
            "bonus_percent": cls.PROGRESSIVE_OVERLOAD_PERCENT,
            "applied": True,
            "reason": f"Volume +{improvement_percent:.1f}% vs 4-week avg"
        }

    @classmethod
    def calculate_pr_bonus(
        cls,
        current_value: float,
        previous_best: Optional[float]
    ) -> Dict[str, Any]:
        """
        Personal record bonus: +15 when beating previous best

        Celebrates individual improvement
        """
        if not previous_best or current_value <= previous_best:
            return {"bonus": 0, "applied": False}

        improvement = current_value - previous_best
        improvement_percent = (improvement / previous_best) * 100

        return {
            "bonus": cls.PR_BONUS,
            "applied": True,
            "reason": f"New PR! +{improvement:.1f} ({improvement_percent:.1f}% improvement)"
        }

    @classmethod
    def calculate_time_of_day_bonus(cls, workout_hour: int) -> Dict[str, Any]:
        """
        Time-of-day bonuses:
        - Early bird: +10 before 7 AM
        - Night owl: +10 after 10 PM

        Rewards dedication at challenging times
        """
        if workout_hour < 7:
            return {
                "bonus": cls.EARLY_BIRD_BONUS,
                "applied": True,
                "type": "early_bird",
                "reason": f"Early bird workout at {workout_hour}:00"
            }

        if workout_hour >= 22:
            return {
                "bonus": cls.NIGHT_OWL_BONUS,
                "applied": True,
                "type": "night_owl",
                "reason": f"Night owl workout at {workout_hour}:00"
            }

        return {"bonus": 0, "applied": False}

    @classmethod
    def calculate_all_bonuses(
        cls,
        context: BonusContext,
        base_points: int
    ) -> Dict[str, Any]:
        """
        Calculate all applicable bonuses for an activity

        Returns:
            {
                "total_bonus": int,
                "applied_bonuses": List[Dict],
                "breakdown": Dict
            }
        """
        total_bonus = 0
        applied_bonuses = []
        breakdown = {}

        # Variety bonus
        variety = cls.calculate_variety_bonus(context.exercises_today)
        if variety["applied"]:
            total_bonus += variety["bonus"]
            applied_bonuses.append("variety")
            breakdown["variety"] = variety

        # Progressive overload (percent-based, calculated against base_points)
        if context.current_volume and context.user_4week_avg:
            overload = cls.calculate_progressive_overload_bonus(
                context.current_volume,
                context.user_4week_avg
            )
            if overload["applied"]:
                overload_bonus = int(base_points * (overload["bonus_percent"] / 100))
                total_bonus += overload_bonus
                applied_bonuses.append("progressive_overload")
                breakdown["progressive_overload"] = {**overload, "bonus": overload_bonus}

        # PR bonus
        if context.current_value and context.previous_best:
            pr = cls.calculate_pr_bonus(context.current_value, context.previous_best)
            if pr["applied"]:
                total_bonus += pr["bonus"]
                applied_bonuses.append("pr")
                breakdown["pr"] = pr

        # Time of day
        time_bonus = cls.calculate_time_of_day_bonus(context.workout_hour)
        if time_bonus["applied"]:
            total_bonus += time_bonus["bonus"]
            applied_bonuses.append(time_bonus["type"])
            breakdown["time_of_day"] = time_bonus

        return {
            "total_bonus": total_bonus,
            "applied_bonuses": applied_bonuses,
            "breakdown": breakdown
        }


class MultiplierSystem:
    """
    Applies multipliers to base + bonus points

    Multipliers stack multiplicatively then capped at 1.25 max

    Types:
    - Streak: 1.02 (3-6d), 1.05 (7-13d), 1.10 (14+d)
    - Challenge: 1.05-1.15 (per active challenge)
    - Seasonal: 1.05-1.10 (limited time events)

    Global cap: 1.25 max total multiplier
    """

    # Streak multipliers
    STREAK_3_6_DAYS = 1.02
    STREAK_7_13_DAYS = 1.05
    STREAK_14_PLUS_DAYS = 1.10

    # Challenge multipliers (configurable per challenge)
    CHALLENGE_MULTIPLIER_MIN = 1.05
    CHALLENGE_MULTIPLIER_MAX = 1.15

    # Seasonal multipliers (configurable per event)
    SEASONAL_MULTIPLIER_MIN = 1.05
    SEASONAL_MULTIPLIER_MAX = 1.10

    # Global cap
    MULTIPLIER_CAP = 1.25

    @classmethod
    def calculate_streak_multiplier(cls, streak_days: int) -> Dict[str, Any]:
        """
        Calculate streak multiplier based on consecutive days

        Args:
            streak_days: Current consecutive active days

        Returns:
            {
                "multiplier": float,
                "applied": bool,
                "tier": str,
                "reason": str
            }
        """
        if streak_days >= 14:
            return {
                "multiplier": cls.STREAK_14_PLUS_DAYS,
                "applied": True,
                "tier": "elite",
                "reason": f"{streak_days}-day streak (×{cls.STREAK_14_PLUS_DAYS})"
            }

        if streak_days >= 7:
            return {
                "multiplier": cls.STREAK_7_13_DAYS,
                "applied": True,
                "tier": "strong",
                "reason": f"{streak_days}-day streak (×{cls.STREAK_7_13_DAYS})"
            }

        if streak_days >= 3:
            return {
                "multiplier": cls.STREAK_3_6_DAYS,
                "applied": True,
                "tier": "building",
                "reason": f"{streak_days}-day streak (×{cls.STREAK_3_6_DAYS})"
            }

        return {
            "multiplier": 1.0,
            "applied": False,
            "tier": "none",
            "reason": "No streak"
        }

    @classmethod
    def calculate_challenge_multiplier(
        cls,
        active_challenges: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate multiplier from active challenges

        Args:
            active_challenges: List of dicts with challenge_id, multiplier

        Returns:
            {
                "multiplier": float,
                "applied": bool,
                "challenges": List[str],
                "reason": str
            }
        """
        if not active_challenges:
            return {"multiplier": 1.0, "applied": False}

        # Stack challenge multipliers
        total_multiplier = 1.0
        challenge_ids = []

        for challenge in active_challenges:
            mult = challenge.get("multiplier", 1.0)
            # Clamp to safe range
            mult = max(cls.CHALLENGE_MULTIPLIER_MIN, min(mult, cls.CHALLENGE_MULTIPLIER_MAX))
            total_multiplier *= mult
            challenge_ids.append(challenge.get("challenge_id", "unknown"))

        return {
            "multiplier": total_multiplier,
            "applied": True,
            "challenges": challenge_ids,
            "reason": f"{len(active_challenges)} active challenges (×{total_multiplier:.2f})"
        }

    @classmethod
    def calculate_seasonal_multiplier(
        cls,
        seasonal_event: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate multiplier from seasonal event

        Args:
            seasonal_event: Dict with event_id, multiplier, name

        Returns:
            {
                "multiplier": float,
                "applied": bool,
                "event_name": str,
                "reason": str
            }
        """
        if not seasonal_event:
            return {"multiplier": 1.0, "applied": False}

        mult = seasonal_event.get("multiplier", 1.0)
        # Clamp to safe range
        mult = max(cls.SEASONAL_MULTIPLIER_MIN, min(mult, cls.SEASONAL_MULTIPLIER_MAX))
        event_name = seasonal_event.get("name", "Unknown Event")

        return {
            "multiplier": mult,
            "applied": True,
            "event_name": event_name,
            "reason": f"{event_name} (×{mult:.2f})"
        }

    @classmethod
    def apply_multipliers(
        cls,
        base_and_bonus_points: int,
        streak_days: int,
        active_challenges: Optional[List[Dict[str, Any]]] = None,
        seasonal_event: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Apply all multipliers with global cap

        Process:
        1. Calculate individual multipliers
        2. Stack multiplicatively
        3. Apply global cap (1.25 max)
        4. Calculate final points

        Returns:
            {
                "final_points": int,
                "total_multiplier": float,
                "cap_applied": bool,
                "applied_multipliers": List[str],
                "breakdown": Dict
            }
        """
        applied_multipliers = []
        breakdown = {}

        # Calculate individual multipliers
        streak_mult = cls.calculate_streak_multiplier(streak_days)
        challenge_mult = cls.calculate_challenge_multiplier(active_challenges or [])
        seasonal_mult = cls.calculate_seasonal_multiplier(seasonal_event)

        # Stack multipliers
        total_multiplier = 1.0

        if streak_mult["applied"]:
            total_multiplier *= streak_mult["multiplier"]
            applied_multipliers.append("streak")
            breakdown["streak"] = streak_mult

        if challenge_mult["applied"]:
            total_multiplier *= challenge_mult["multiplier"]
            applied_multipliers.append("challenge")
            breakdown["challenge"] = challenge_mult

        if seasonal_mult["applied"]:
            total_multiplier *= seasonal_mult["multiplier"]
            applied_multipliers.append("seasonal")
            breakdown["seasonal"] = seasonal_mult

        # Apply global cap
        cap_applied = False
        if total_multiplier > cls.MULTIPLIER_CAP:
            cap_applied = True
            total_multiplier = cls.MULTIPLIER_CAP

        # Calculate final points
        final_points = int(base_and_bonus_points * total_multiplier)

        return {
            "final_points": final_points,
            "total_multiplier": round(total_multiplier, 2),
            "cap_applied": cap_applied,
            "applied_multipliers": applied_multipliers,
            "breakdown": breakdown,
            "display_text": cls._generate_display_text(
                base_and_bonus_points,
                final_points,
                total_multiplier,
                applied_multipliers,
                cap_applied
            )
        }

    @classmethod
    def _generate_display_text(
        cls,
        before: int,
        after: int,
        multiplier: float,
        applied: List[str],
        capped: bool
    ) -> str:
        """Generate human-readable multiplier explanation"""
        if multiplier == 1.0:
            return ""

        mult_text = " + ".join(applied)
        cap_text = " (capped at 1.25)" if capped else ""

        return f" × {multiplier:.2f} {mult_text}{cap_text} = {after} total"


class FraudDetection:
    """
    Validates activities for reasonable limits

    Prevents:
    - Unrealistic values (500kg squat, 2:00/km pace)
    - Duplicate activities
    - Suspicious patterns

    Flags (doesn't block) for manual review
    """

    # Reasonable limits for strength
    MAX_WEIGHT_KG = 500  # Even elite powerlifters rarely exceed
    MAX_REPS_PER_SET = 100  # Endurance sets cap
    MAX_SETS = 20  # Typical workout cap

    # Reasonable limits for cardio
    MIN_RUNNING_PACE_SEC_PER_KM = 150  # 2:30/km (world record ~2:40)
    MAX_RUNNING_PACE_SEC_PER_KM = 900  # 15:00/km (walking speed)
    MAX_DISTANCE_KM = 200  # Ultra marathon upper bound
    MAX_DURATION_HOURS = 8

    # Core limits
    MAX_PLANK_DURATION_SEC = 3600  # 1 hour (world record territory)
    MAX_CORE_REPS = 1000  # Single session cap

    @classmethod
    def validate_strength_activity(
        cls,
        exercise_key: str,
        sets: int,
        reps_per_set: List[int],
        weights_per_set: List[float]
    ) -> Dict[str, Any]:
        """
        Validate strength exercise for reasonable values

        Returns:
            {
                "is_valid": bool,
                "warnings": List[str],
                "flags": List[str]
            }
        """
        warnings = []
        flags = []

        # Check sets count
        if sets > cls.MAX_SETS:
            flags.append(f"Excessive sets: {sets} > {cls.MAX_SETS}")

        # Check each set
        for i, (reps, weight) in enumerate(zip(reps_per_set, weights_per_set)):
            # Check weight
            if weight > cls.MAX_WEIGHT_KG:
                flags.append(f"Unrealistic weight: {weight}kg > {cls.MAX_WEIGHT_KG}kg (set {i+1})")

            # Check reps
            if reps > cls.MAX_REPS_PER_SET:
                warnings.append(f"High reps: {reps} > {cls.MAX_REPS_PER_SET} (set {i+1})")

            # Check zero weight for non-bodyweight exercises
            bodyweight_exercises = {'push_up', 'pull_up', 'rope_climb'}
            if weight == 0 and exercise_key not in bodyweight_exercises:
                warnings.append(f"Zero weight for weighted exercise (set {i+1})")

        is_valid = len(flags) == 0

        return {
            "is_valid": is_valid,
            "warnings": warnings,
            "flags": flags,
            "status": "flagged" if flags else "valid"
        }

    @classmethod
    def validate_cardio_activity(
        cls,
        exercise_key: str,
        distance_km: float,
        duration_sec: int,
        elevation_gain_m: int = 0
    ) -> Dict[str, Any]:
        """
        Validate cardio exercise for reasonable values
        """
        warnings = []
        flags = []

        # Check distance
        if distance_km > cls.MAX_DISTANCE_KM:
            flags.append(f"Excessive distance: {distance_km}km > {cls.MAX_DISTANCE_KM}km")

        # Check duration
        duration_hours = duration_sec / 3600
        if duration_hours > cls.MAX_DURATION_HOURS:
            flags.append(f"Excessive duration: {duration_hours:.1f}h > {cls.MAX_DURATION_HOURS}h")

        # Check pace (for running)
        if exercise_key == "running" and distance_km > 0:
            pace_sec_per_km = duration_sec / distance_km

            if pace_sec_per_km < cls.MIN_RUNNING_PACE_SEC_PER_KM:
                flags.append(f"Unrealistic pace: {pace_sec_per_km/60:.2f} min/km (world record ~2:40/km)")

            if pace_sec_per_km > cls.MAX_RUNNING_PACE_SEC_PER_KM:
                warnings.append(f"Very slow pace: {pace_sec_per_km/60:.2f} min/km (walking speed)")

        # Check elevation (sanity check)
        if elevation_gain_m > distance_km * 100:  # More than 100m elevation per km
            warnings.append(f"High elevation gain: {elevation_gain_m}m for {distance_km}km")

        is_valid = len(flags) == 0

        return {
            "is_valid": is_valid,
            "warnings": warnings,
            "flags": flags,
            "status": "flagged" if flags else "valid"
        }

    @classmethod
    def validate_core_activity(
        cls,
        exercise_key: str,
        reps: Optional[int] = None,
        duration_sec: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Validate core exercise for reasonable values
        """
        warnings = []
        flags = []

        # Duration-based (plank)
        if duration_sec:
            if duration_sec > cls.MAX_PLANK_DURATION_SEC:
                flags.append(f"Excessive plank duration: {duration_sec}s > {cls.MAX_PLANK_DURATION_SEC}s")

            if duration_sec > 600:  # 10 minutes
                warnings.append(f"Very long plank: {duration_sec/60:.1f} minutes")

        # Reps-based
        if reps:
            if reps > cls.MAX_CORE_REPS:
                flags.append(f"Excessive core reps: {reps} > {cls.MAX_CORE_REPS}")

        is_valid = len(flags) == 0

        return {
            "is_valid": is_valid,
            "warnings": warnings,
            "flags": flags,
            "status": "flagged" if flags else "valid"
        }

    @classmethod
    def check_duplicate_activity(
        cls,
        user_id: str,
        started_at: datetime,
        ended_at: datetime,
        recent_activities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Check for duplicate or overlapping activities

        Args:
            user_id: User ID
            started_at: Activity start time
            ended_at: Activity end time
            recent_activities: List of recent activities for this user

        Returns:
            {
                "is_duplicate": bool,
                "overlapping_activity_id": Optional[int],
                "reason": str
            }
        """
        for activity in recent_activities:
            act_start = activity["started_at"]
            act_end = activity["ended_at"]

            # Check for exact duplicate
            if act_start == started_at and act_end == ended_at:
                return {
                    "is_duplicate": True,
                    "overlapping_activity_id": activity["id"],
                    "reason": "Exact duplicate time window"
                }

            # Check for overlap
            if (started_at < act_end and ended_at > act_start):
                return {
                    "is_duplicate": True,
                    "overlapping_activity_id": activity["id"],
                    "reason": "Overlapping time window"
                }

        return {
            "is_duplicate": False,
            "overlapping_activity_id": None,
            "reason": "No duplicates found"
        }
