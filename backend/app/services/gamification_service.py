"""
Gamification Service
Handles points, achievements, challenges, and leaderboards
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class AchievementType(Enum):
    """Types of achievements users can earn"""
    FIRST_WORKOUT = "first_workout"
    STREAK_3_DAYS = "streak_3_days"
    STREAK_7_DAYS = "streak_7_days"
    STREAK_30_DAYS = "streak_30_days"
    PERSONAL_RECORD = "personal_record"
    CENTURY_CLUB = "century_club"  # 100 reps in single exercise
    HEAVY_LIFTER = "heavy_lifter"  # Lift 100kg+
    MARATHON_RUNNER = "marathon_runner"  # Run 42km total
    EARLY_BIRD = "early_bird"  # Workout before 6am
    NIGHT_OWL = "night_owl"  # Workout after 10pm
    PERFECT_WEEK = "perfect_week"  # 7 workouts in 7 days
    EXERCISE_MASTER = "exercise_master"  # Master specific exercise

class GamificationService:
    """Service for managing gamification features"""
    
    def __init__(self):
        # Point values for different activities
        self.point_values = {
            "exercise_rep": 1,
            "exercise_set": 5,
            "weight_per_kg": 0.5,
            "distance_per_km": 10,
            "duration_per_minute": 2,
            "personal_record": 50,
            "daily_challenge": 25,
            "achievement_unlock": 100,
            "perfect_form": 10,
            "streak_bonus": 5
        }
        
        # Achievement definitions
        self.achievements = {
            AchievementType.FIRST_WORKOUT: {
                "name": "Getting Started",
                "name_he": "התחלה חדשה",
                "description": "Complete your first workout",
                "description_he": "השלם את האימון הראשון שלך",
                "points": 100,
                "icon": "🎯"
            },
            AchievementType.STREAK_3_DAYS: {
                "name": "On a Roll",
                "name_he": "בתנופה",
                "description": "Work out 3 days in a row",
                "description_he": "התאמן 3 ימים ברציפות",
                "points": 150,
                "icon": "🔥"
            },
            AchievementType.STREAK_7_DAYS: {
                "name": "Week Warrior",
                "name_he": "לוחם השבוע",
                "description": "Work out 7 days in a row",
                "description_he": "התאמן 7 ימים ברציפות",
                "points": 300,
                "icon": "⚡"
            },
            AchievementType.STREAK_30_DAYS: {
                "name": "Unstoppable",
                "name_he": "בלתי ניתן לעצירה",
                "description": "Work out 30 days in a row",
                "description_he": "התאמן 30 ימים ברציפות",
                "points": 1000,
                "icon": "🏆"
            },
            AchievementType.PERSONAL_RECORD: {
                "name": "Record Breaker",
                "name_he": "שובר שיאים",
                "description": "Set a new personal record",
                "description_he": "קבע שיא אישי חדש",
                "points": 50,
                "icon": "📈"
            },
            AchievementType.CENTURY_CLUB: {
                "name": "Century Club",
                "name_he": "מועדון המאה",
                "description": "Complete 100 reps in a single exercise",
                "description_he": "השלם 100 חזרות בתרגיל אחד",
                "points": 200,
                "icon": "💯"
            },
            AchievementType.HEAVY_LIFTER: {
                "name": "Heavy Metal",
                "name_he": "משקל כבד",
                "description": "Lift 100kg or more",
                "description_he": "הרם 100 ק״ג או יותר",
                "points": 250,
                "icon": "🏋️"
            },
            AchievementType.EARLY_BIRD: {
                "name": "Early Bird",
                "name_he": "ציפור מוקדמת",
                "description": "Complete a workout before 6 AM",
                "description_he": "השלם אימון לפני 6 בבוקר",
                "points": 75,
                "icon": "🌅"
            },
            AchievementType.PERFECT_WEEK: {
                "name": "Perfect Week",
                "name_he": "שבוע מושלם",
                "description": "Work out every day for a week",
                "description_he": "התאמן כל יום במשך שבוע",
                "points": 500,
                "icon": "⭐"
            }
        }
        
        # Level thresholds
        self.level_thresholds = self._generate_level_thresholds()
        
        # Daily challenges
        self.daily_challenges = [
            {
                "id": "pushup_20",
                "name": "Push-up Challenge",
                "name_he": "אתגר שכיבות סמיכה",
                "description": "Complete 20 push-ups",
                "description_he": "השלם 20 שכיבות סמיכה",
                "target": {"exercise": "pushup", "reps": 20},
                "points": 25
            },
            {
                "id": "squat_30",
                "name": "Squat Challenge",
                "name_he": "אתגר סקוואט",
                "description": "Complete 30 squats",
                "description_he": "השלם 30 סקוואטים",
                "target": {"exercise": "squat", "reps": 30},
                "points": 25
            },
            {
                "id": "plank_60",
                "name": "Plank Challenge",
                "name_he": "אתגר פלאנק",
                "description": "Hold plank for 60 seconds",
                "description_he": "החזק פלאנק למשך 60 שניות",
                "target": {"exercise": "plank", "duration": 60},
                "points": 30
            },
            {
                "id": "burpee_10",
                "name": "Burpee Challenge",
                "name_he": "אתגר ברפי",
                "description": "Complete 10 burpees",
                "description_he": "השלם 10 ברפיז",
                "target": {"exercise": "burpee", "reps": 10},
                "points": 35
            },
            {
                "id": "run_2km",
                "name": "Running Challenge",
                "name_he": "אתגר ריצה",
                "description": "Run 2 kilometers",
                "description_he": "רוץ 2 קילומטרים",
                "target": {"exercise": "running", "distance": 2},
                "points": 40
            }
        ]
    
    def _generate_level_thresholds(self) -> List[int]:
        """Generate level thresholds with exponential growth"""
        thresholds = [0]  # Level 0
        base_xp = 100
        for level in range(1, 101):  # Levels 1-100
            # Exponential growth formula
            xp_needed = int(base_xp * (1.15 ** (level - 1)))
            thresholds.append(thresholds[-1] + xp_needed)
        return thresholds
    
    def calculate_exercise_points(self, exercise: Any) -> int:
        """Calculate points earned from an exercise"""
        points = 0
        
        # Base points for completing exercise
        if exercise.reps:
            points += exercise.reps * self.point_values["exercise_rep"]
        
        if exercise.sets:
            points += exercise.sets * self.point_values["exercise_set"]
        
        # Weight bonus
        if exercise.weight_kg:
            points += exercise.weight_kg * self.point_values["weight_per_kg"]
        
        # Distance bonus
        if exercise.distance_km:
            points += exercise.distance_km * self.point_values["distance_per_km"]
        
        # Duration bonus
        if exercise.duration_seconds:
            minutes = exercise.duration_seconds / 60
            points += minutes * self.point_values["duration_per_minute"]
        
        # Personal record bonus
        if hasattr(exercise, 'is_personal_record') and exercise.is_personal_record:
            points += self.point_values["personal_record"]
        
        return int(points)
    
    def check_achievements(self, user_stats: Dict) -> List[AchievementType]:
        """Check which achievements the user has earned"""
        earned_achievements = []
        
        # First workout
        if user_stats.get("total_workouts") == 1:
            earned_achievements.append(AchievementType.FIRST_WORKOUT)
        
        # Streak achievements
        streak = user_stats.get("current_streak", 0)
        if streak >= 3 and not user_stats.get("has_3_day_streak"):
            earned_achievements.append(AchievementType.STREAK_3_DAYS)
        if streak >= 7 and not user_stats.get("has_7_day_streak"):
            earned_achievements.append(AchievementType.STREAK_7_DAYS)
        if streak >= 30 and not user_stats.get("has_30_day_streak"):
            earned_achievements.append(AchievementType.STREAK_30_DAYS)
        
        # Century club
        max_reps = user_stats.get("max_reps_single_exercise", 0)
        if max_reps >= 100 and not user_stats.get("has_century"):
            earned_achievements.append(AchievementType.CENTURY_CLUB)
        
        # Heavy lifter
        max_weight = user_stats.get("max_weight_lifted", 0)
        if max_weight >= 100 and not user_stats.get("has_heavy_lifter"):
            earned_achievements.append(AchievementType.HEAVY_LIFTER)
        
        # Early bird
        if user_stats.get("workout_before_6am") and not user_stats.get("has_early_bird"):
            earned_achievements.append(AchievementType.EARLY_BIRD)
        
        # Perfect week
        if user_stats.get("consecutive_days") >= 7 and not user_stats.get("has_perfect_week"):
            earned_achievements.append(AchievementType.PERFECT_WEEK)
        
        return earned_achievements
    
    def calculate_level(self, total_points: int) -> Dict[str, Any]:
        """Calculate user level based on total points"""
        level = 0
        for i, threshold in enumerate(self.level_thresholds):
            if total_points >= threshold:
                level = i
            else:
                break
        
        # Calculate progress to next level
        if level < len(self.level_thresholds) - 1:
            current_threshold = self.level_thresholds[level]
            next_threshold = self.level_thresholds[level + 1]
            points_in_level = total_points - current_threshold
            points_needed = next_threshold - current_threshold
            progress_percentage = (points_in_level / points_needed) * 100
        else:
            progress_percentage = 100
            points_needed = 0
        
        return {
            "level": level,
            "total_points": total_points,
            "progress_percentage": round(progress_percentage, 1),
            "points_to_next_level": points_needed - (total_points - self.level_thresholds[level]) if level < 100 else 0,
            "title": self.get_level_title(level),
            "title_he": self.get_level_title_hebrew(level)
        }
    
    def get_level_title(self, level: int) -> str:
        """Get title based on level"""
        titles = [
            (0, "Beginner"),
            (5, "Novice"),
            (10, "Apprentice"),
            (20, "Athlete"),
            (30, "Warrior"),
            (40, "Champion"),
            (50, "Master"),
            (60, "Grand Master"),
            (70, "Elite"),
            (80, "Legend"),
            (90, "Mythic"),
            (100, "Immortal")
        ]
        
        for threshold, title in reversed(titles):
            if level >= threshold:
                return title
        return "Beginner"
    
    def get_level_title_hebrew(self, level: int) -> str:
        """Get Hebrew title based on level"""
        titles = [
            (0, "מתחיל"),
            (5, "טירון"),
            (10, "חניך"),
            (20, "ספורטאי"),
            (30, "לוחם"),
            (40, "אלוף"),
            (50, "מאסטר"),
            (60, "מאסטר בכיר"),
            (70, "עילית"),
            (80, "אגדה"),
            (90, "מיתולוגי"),
            (100, "אלמותי")
        ]
        
        for threshold, title in reversed(titles):
            if level >= threshold:
                return title
        return "מתחיל"
    
    def get_daily_challenge(self, date: datetime = None) -> Dict[str, Any]:
        """Get the daily challenge for a specific date"""
        if date is None:
            date = datetime.now()
        
        # Use date as seed for consistent daily challenge
        day_index = date.toordinal() % len(self.daily_challenges)
        return self.daily_challenges[day_index]
    
    def check_daily_challenge_completion(self, exercise: Any, challenge: Dict) -> bool:
        """Check if an exercise completes the daily challenge"""
        target = challenge["target"]
        
        # Check exercise type
        if exercise.name.lower() != target["exercise"]:
            return False
        
        # Check requirements
        if "reps" in target:
            total_reps = (exercise.reps or 0) * (exercise.sets or 1)
            if total_reps < target["reps"]:
                return False
        
        if "duration" in target:
            if (exercise.duration_seconds or 0) < target["duration"]:
                return False
        
        if "distance" in target:
            if (exercise.distance_km or 0) < target["distance"]:
                return False
        
        return True
    
    def calculate_streak(self, workout_dates: List[datetime]) -> int:
        """Calculate current workout streak"""
        if not workout_dates:
            return 0
        
        # Sort dates in descending order
        sorted_dates = sorted(workout_dates, reverse=True)
        
        # Check if user worked out today or yesterday
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        
        last_workout = sorted_dates[0].date()
        if last_workout not in [today, yesterday]:
            return 0
        
        # Count consecutive days
        streak = 1
        for i in range(1, len(sorted_dates)):
            current_date = sorted_dates[i].date()
            prev_date = sorted_dates[i-1].date()
            
            if (prev_date - current_date).days == 1:
                streak += 1
            else:
                break
        
        return streak
    
    def generate_motivational_message(self, context: str, language: str = "he") -> str:
        """Generate contextual motivational message"""
        messages = {
            "personal_record": {
                "he": ["שיא חדש! אתה מתקדם!", "כל הכבוד! עברת את עצמך!", "זה היה מדהים! 💪"],
                "en": ["New record! You're improving!", "Well done! You beat yourself!", "That was amazing! 💪"]
            },
            "streak_milestone": {
                "he": ["ממשיך בתנופה! 🔥", "עקביות זה המפתח!", "אתה בלתי ניתן לעצירה!"],
                "en": ["Keep the momentum! 🔥", "Consistency is key!", "You're unstoppable!"]
            },
            "achievement_unlock": {
                "he": ["הישג חדש! 🏆", "עוד צעד קדימה!", "אתה אלוף!"],
                "en": ["Achievement unlocked! 🏆", "Another step forward!", "You're a champion!"]
            },
            "workout_complete": {
                "he": ["אימון מצוין!", "כל הכבוד על ההתמדה!", "עבודה טובה! 💯"],
                "en": ["Great workout!", "Well done on the persistence!", "Good work! 💯"]
            },
            "level_up": {
                "he": ["עלית רמה! ⭐", "התקדמות מרשימה!", "לרמה הבאה! 🚀"],
                "en": ["Level up! ⭐", "Impressive progress!", "To the next level! 🚀"]
            }
        }
        
        import random
        msg_list = messages.get(context, messages["workout_complete"])
        return random.choice(msg_list.get(language, msg_list["en"]))
    
    def format_achievement_notification(self, achievement_type: AchievementType, language: str = "he") -> Dict[str, Any]:
        """Format achievement for notification"""
        achievement = self.achievements[achievement_type]
        
        return {
            "type": "achievement",
            "title": achievement[f"name_{language}"] if f"name_{language}" in achievement else achievement["name"],
            "description": achievement[f"description_{language}"] if f"description_{language}" in achievement else achievement["description"],
            "icon": achievement["icon"],
            "points": achievement["points"],
            "timestamp": datetime.now().isoformat()
        }
    
    def get_leaderboard_position(self, user_points: int, all_users_points: List[int]) -> Dict[str, Any]:
        """Calculate user's position in leaderboard"""
        sorted_points = sorted(all_users_points, reverse=True)
        position = sorted_points.index(user_points) + 1 if user_points in sorted_points else len(sorted_points) + 1
        
        percentile = ((len(sorted_points) - position + 1) / len(sorted_points)) * 100 if sorted_points else 0
        
        return {
            "position": position,
            "total_users": len(sorted_points),
            "percentile": round(percentile, 1),
            "is_top_10": position <= 10,
            "is_top_100": position <= 100
        }