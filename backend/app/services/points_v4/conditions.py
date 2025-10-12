"""
Achievement Condition Parser - Declarative and Safe

NO eval() - Strictly whitelisted operators only

Supported condition types:
- sum: Aggregate metric (distance, volume, points)
- count: Count activities
- max: Maximum value (longest plank, fastest 5K)
- streak: Consecutive days active
- pr: Personal record improvement
- distance_once: Single activity distance + time
- count_distinct: Count unique values
- variety: Multiple categories in period

All conditions use JSON schema with known operators
"""

from typing import Dict, List, Any, Optional
from datetime import date, timedelta
from enum import Enum


class ConditionType(Enum):
    """Whitelisted condition types"""
    SUM = "sum"
    COUNT = "count"
    MAX = "max"
    STREAK = "streak"
    PR = "pr"
    DISTANCE_ONCE = "distance_once"
    COUNT_DISTINCT = "count_distinct"
    VARIETY = "variety"


class ConditionParser:
    """
    Parses and validates achievement conditions

    NO eval() - Only known, safe operators

    Example conditions:
    {
      "type": "sum",
      "metric": "distance_km",
      "filters": {"exercise_key": ["running"]},
      "target": 100.0
    }

    {
      "type": "streak",
      "metric": "days_active",
      "target": 14
    }

    {
      "type": "max",
      "metric": "estimated_1rm_kg",
      "filters": {"exercise_key": ["squat"]},
      "target": 100.0
    }
    """

    @classmethod
    def validate_condition(cls, condition_json: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate condition JSON structure

        Returns:
            {
                "is_valid": bool,
                "errors": List[str],
                "condition_type": ConditionType
            }
        """
        errors = []

        # Check required fields
        if "type" not in condition_json:
            errors.append("Missing required field: type")
            return {"is_valid": False, "errors": errors}

        # Validate type
        try:
            condition_type = ConditionType(condition_json["type"])
        except ValueError:
            errors.append(f"Invalid condition type: {condition_json['type']}")
            return {"is_valid": False, "errors": errors}

        # Check target exists
        if "target" not in condition_json and condition_type != ConditionType.PR:
            errors.append("Missing required field: target")

        # Check metric exists for most types
        if "metric" not in condition_json and condition_type != ConditionType.VARIETY:
            errors.append("Missing required field: metric")

        is_valid = len(errors) == 0

        return {
            "is_valid": is_valid,
            "errors": errors,
            "condition_type": condition_type if is_valid else None
        }

    @classmethod
    async def evaluate_condition(
        cls,
        condition_json: Dict[str, Any],
        user_stats: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate condition against user stats

        NO eval() - Routes to specific handler based on type

        Args:
            condition_json: Parsed condition from achievement_definition
            user_stats: User's aggregated statistics

        Returns:
            {
                "is_met": bool,
                "progress_value": float,
                "progress_target": float,
                "percentage": int
            }
        """
        # Validate first
        validation = cls.validate_condition(condition_json)
        if not validation["is_valid"]:
            return {
                "is_met": False,
                "progress_value": 0,
                "progress_target": 0,
                "percentage": 0,
                "errors": validation["errors"]
            }

        condition_type = validation["condition_type"]

        # Route to appropriate handler
        if condition_type == ConditionType.SUM:
            return cls._evaluate_sum(condition_json, user_stats)

        elif condition_type == ConditionType.COUNT:
            return cls._evaluate_count(condition_json, user_stats)

        elif condition_type == ConditionType.MAX:
            return cls._evaluate_max(condition_json, user_stats)

        elif condition_type == ConditionType.STREAK:
            return cls._evaluate_streak(condition_json, user_stats)

        elif condition_type == ConditionType.PR:
            return cls._evaluate_pr(condition_json, user_stats)

        elif condition_type == ConditionType.DISTANCE_ONCE:
            return cls._evaluate_distance_once(condition_json, user_stats)

        elif condition_type == ConditionType.COUNT_DISTINCT:
            return cls._evaluate_count_distinct(condition_json, user_stats)

        elif condition_type == ConditionType.VARIETY:
            return cls._evaluate_variety(condition_json, user_stats)

        else:
            return {
                "is_met": False,
                "progress_value": 0,
                "progress_target": 0,
                "percentage": 0,
                "errors": [f"Unhandled condition type: {condition_type}"]
            }

    @classmethod
    def _evaluate_sum(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate sum condition: total of a metric

        Example: "Run 100km total"
        {
          "type": "sum",
          "metric": "distance_km",
          "filters": {"exercise_key": ["running"]},
          "target": 100.0
        }
        """
        metric = condition.get("metric")
        target = float(condition.get("target", 0))
        filters = condition.get("filters", {})

        # Get value from stats
        # For filtered metrics, look for exercise-specific aggregates
        if filters.get("exercise_key"):
            exercise_key = filters["exercise_key"][0]  # Take first
            stat_key = f"{exercise_key}_{metric}"
            current_value = float(stats.get(stat_key, 0))
        else:
            # Lifetime metric
            current_value = float(stats.get(metric, 0))

        is_met = current_value >= target
        percentage = min(int((current_value / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": current_value,
            "progress_target": target,
            "percentage": percentage
        }

    @classmethod
    def _evaluate_count(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate count condition: count of activities

        Example: "Complete 10 workouts"
        {
          "type": "count",
          "metric": "total_workouts",
          "target": 10
        }
        """
        metric = condition.get("metric", "total_workouts")
        target = int(condition.get("target", 0))

        current_value = int(stats.get(metric, 0))
        is_met = current_value >= target
        percentage = min(int((current_value / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": current_value,
            "progress_target": target,
            "percentage": percentage
        }

    @classmethod
    def _evaluate_max(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate max condition: maximum value achieved

        Example: "Squat 100kg estimated 1RM"
        {
          "type": "max",
          "metric": "estimated_1rm_kg",
          "filters": {"exercise_key": ["squat"]},
          "target": 100.0
        }
        """
        metric = condition.get("metric")
        target = float(condition.get("target", 0))
        filters = condition.get("filters", {})

        # Look for exercise-specific max
        if filters.get("exercise_key"):
            exercise_key = filters["exercise_key"][0]
            stat_key = f"{exercise_key}_max_{metric}"
            current_value = float(stats.get(stat_key, 0))
        else:
            current_value = float(stats.get(f"max_{metric}", 0))

        is_met = current_value >= target
        percentage = min(int((current_value / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": current_value,
            "progress_target": target,
            "percentage": percentage
        }

    @classmethod
    def _evaluate_streak(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate streak condition: consecutive days

        Example: "Maintain 14-day streak"
        {
          "type": "streak",
          "metric": "days_active",
          "target": 14
        }
        """
        target = int(condition.get("target", 0))
        current_streak = int(stats.get("current_streak", 0))

        is_met = current_streak >= target
        percentage = min(int((current_streak / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": current_streak,
            "progress_target": target,
            "percentage": percentage
        }

    @classmethod
    def _evaluate_pr(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate PR condition: set any personal record

        Example: "Set your first PR"
        {
          "type": "pr",
          "metric": "personal_records",
          "target": 1
        }
        """
        target = int(condition.get("target", 1))
        pr_count = int(stats.get("personal_records_count", 0))

        is_met = pr_count >= target
        percentage = min(int((pr_count / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": pr_count,
            "progress_target": target,
            "percentage": percentage
        }

    @classmethod
    def _evaluate_distance_once(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate distance_once: single activity meeting criteria

        Example: "Run 5K under 30 minutes"
        {
          "type": "distance_once",
          "metric": "time_for_5k_sec",
          "filters": {"exercise_key": ["running"], "distance_km": 5.0},
          "target_lt": 1800
        }
        """
        metric = condition.get("metric")
        filters = condition.get("filters", {})
        target_distance = float(filters.get("distance_km", 5.0))

        # Check if user has ever achieved this
        # This requires checking activity_cardio records
        # For now, use a simplified stat key
        stat_key = f"best_{metric}"
        best_time = float(stats.get(stat_key, 999999))

        # Check if target_lt (less than) or target_gte (greater than or equal)
        if "target_lt" in condition:
            target = float(condition["target_lt"])
            is_met = best_time < target
            progress_value = best_time
            progress_target = target
        elif "target_gte" in condition:
            target = float(condition["target_gte"])
            is_met = best_time >= target
            progress_value = best_time
            progress_target = target
        else:
            return {"is_met": False, "progress_value": 0, "progress_target": 0, "percentage": 0}

        # For "less than" targets, invert percentage (lower is better)
        if "target_lt" in condition:
            if best_time == 999999:  # Never attempted
                percentage = 0
            else:
                percentage = min(int((target / best_time) * 100), 100)
        else:
            percentage = min(int((best_time / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": progress_value,
            "progress_target": progress_target,
            "percentage": percentage
        }

    @classmethod
    def _evaluate_count_distinct(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate count_distinct: count unique values

        Example: "Try 10 different exercise types"
        {
          "type": "count_distinct",
          "metric": "exercise_types_logged",
          "target": 10
        }
        """
        metric = condition.get("metric", "exercise_types_logged")
        target = int(condition.get("target", 0))

        current_count = int(stats.get(metric, 0))
        is_met = current_count >= target
        percentage = min(int((current_count / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": current_count,
            "progress_target": target,
            "percentage": percentage
        }

    @classmethod
    def _evaluate_variety(cls, condition: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate variety: multiple categories in period

        Example: "Log strength + cardio + core in one week"
        {
          "type": "variety",
          "metric": "categories_per_week",
          "target": 3
        }
        """
        target = int(condition.get("target", 3))
        current_categories = int(stats.get("categories_this_week", 0))

        is_met = current_categories >= target
        percentage = min(int((current_categories / target) * 100), 100) if target > 0 else 0

        return {
            "is_met": is_met,
            "progress_value": current_categories,
            "progress_target": target,
            "percentage": percentage
        }


class AchievementProgressTracker:
    """
    Tracks progress toward achievements in real-time

    Updates user_achievement_progress table after each activity
    Detects unlocks when threshold reached
    """

    @classmethod
    async def check_achievements_for_user(
        cls,
        user_id: str,
        user_stats: Dict[str, Any],
        db_session: Any
    ) -> Dict[str, Any]:
        """
        Check all achievements for a user

        Args:
            user_id: User UUID
            user_stats: Current aggregated stats
            db_session: Database session

        Returns:
            {
                "newly_unlocked": List[Dict],  # Achievements just unlocked
                "progress_updated": List[Dict],  # Progress bars updated
                "unchanged": List[str]  # Achievement keys unchanged
            }
        """
        from sqlalchemy import select, and_
        from app.models.points_models_v4 import (
            AchievementDefinition,
            UserAchievement,
            UserAchievementProgress
        )

        newly_unlocked = []
        progress_updated = []
        unchanged = []

        # Get all active achievements
        query = select(AchievementDefinition).where(
            AchievementDefinition.is_active == True
        )
        result = await db_session.execute(query)
        all_achievements = result.scalars().all()

        # Get user's already unlocked achievements
        unlocked_query = select(UserAchievement.achievement_id).where(
            UserAchievement.user_id == user_id
        )
        unlocked_result = await db_session.execute(unlocked_query)
        unlocked_ids = {row[0] for row in unlocked_result.fetchall()}

        # Check each achievement
        for achievement in all_achievements:
            # Skip if already unlocked
            if achievement.id in unlocked_ids:
                unchanged.append(achievement.key)
                continue

            # Evaluate condition
            evaluation = await ConditionParser.evaluate_condition(
                condition_json=achievement.condition_json,
                user_stats=user_stats
            )

            # Check if newly unlocked
            if evaluation["is_met"]:
                # Create unlock record
                unlock = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    unlocked_at=datetime.utcnow(),
                    progress_value=evaluation["progress_value"],
                    progress_target=evaluation["progress_target"]
                )
                db_session.add(unlock)

                newly_unlocked.append({
                    "key": achievement.key,
                    "name_en": achievement.name_en,
                    "name_he": achievement.name_he,
                    "points_reward": achievement.points_reward,
                    "icon_key": achievement.icon_key,
                    "progress_value": evaluation["progress_value"],
                    "progress_target": evaluation["progress_target"]
                })

            else:
                # Update progress
                progress_updated.append({
                    "achievement_id": achievement.id,
                    "key": achievement.key,
                    "progress_value": evaluation["progress_value"],
                    "progress_target": evaluation["progress_target"],
                    "percentage": evaluation["percentage"]
                })

                # Upsert progress record
                await cls._upsert_progress(
                    db_session,
                    user_id,
                    achievement.id,
                    evaluation["progress_value"],
                    evaluation["progress_target"]
                )

        return {
            "newly_unlocked": newly_unlocked,
            "progress_updated": progress_updated,
            "unchanged": unchanged
        }

    @classmethod
    async def _upsert_progress(
        cls,
        db_session: Any,
        user_id: str,
        achievement_id: int,
        progress_value: float,
        progress_target: float
    ):
        """Upsert progress record"""
        from sqlalchemy.dialects.postgresql import insert
        from app.models.points_models_v4 import UserAchievementProgress
        from datetime import datetime

        stmt = insert(UserAchievementProgress).values(
            user_id=user_id,
            achievement_id=achievement_id,
            progress_value=progress_value,
            progress_target=progress_target,
            updated_at=datetime.utcnow()
        ).on_conflict_do_update(
            index_elements=['user_id', 'achievement_id'],
            set_={
                'progress_value': progress_value,
                'progress_target': progress_target,
                'updated_at': datetime.utcnow()
            }
        )

        await db_session.execute(stmt)

    @classmethod
    def calculate_eta(
        cls,
        current_value: float,
        target_value: float,
        recent_rate: float  # Progress per day (14-day average)
    ) -> Dict[str, Any]:
        """
        Calculate estimated time to achievement

        Args:
            current_value: Current progress
            target_value: Target to reach
            recent_rate: Average progress per day (last 14 days)

        Returns:
            {
                "eta_days": int,
                "eta_text_en": str,
                "eta_text_he": str
            }
        """
        if current_value >= target_value:
            return {
                "eta_days": 0,
                "eta_text_en": "Unlocked!",
                "eta_text_he": "נפתח!"
            }

        if recent_rate <= 0:
            return {
                "eta_days": 999,
                "eta_text_en": "No recent progress",
                "eta_text_he": "אין התקדמות לאחרונה"
            }

        remaining = target_value - current_value
        eta_days = int(remaining / recent_rate)

        # Format ETA text
        if eta_days < 1:
            eta_text_en = "Today!"
            eta_text_he = "היום!"
        elif eta_days == 1:
            eta_text_en = "Tomorrow"
            eta_text_he = "מחר"
        elif eta_days <= 7:
            eta_text_en = f"~{eta_days} days"
            eta_text_he = f"~{eta_days} ימים"
        elif eta_days <= 30:
            weeks = eta_days // 7
            eta_text_en = f"~{weeks} weeks"
            eta_text_he = f"~{weeks} שבועות"
        else:
            months = eta_days // 30
            eta_text_en = f"~{months} months"
            eta_text_he = f"~{months} חודשים"

        return {
            "eta_days": eta_days,
            "eta_text_en": eta_text_en,
            "eta_text_he": eta_text_he
        }
