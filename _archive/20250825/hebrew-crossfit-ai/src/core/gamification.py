"""
Hebrew Gamification System for CrossFit
Provides achievements, leaderboards, and social features in Hebrew and English
"""

import json
import os
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import random
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AchievementType(Enum):
    """Achievement categories"""
    FIRST_WORKOUT = "first_workout"
    STREAK = "streak"
    PR = "personal_record"
    MILESTONE = "milestone"
    CHALLENGE = "challenge"
    SOCIAL = "social"
    NUTRITION = "nutrition"
    CONSISTENCY = "consistency"


@dataclass
class Achievement:
    """Achievement data structure"""
    id: str
    type: AchievementType
    name_he: str
    name_en: str
    description_he: str
    description_en: str
    icon: str
    points: int
    requirements: Dict[str, Any]
    unlocked: bool = False
    unlocked_date: Optional[datetime] = None
    progress: float = 0.0  # 0-1


@dataclass
class UserProfile:
    """User gamification profile"""
    user_id: str
    username: str
    level: int = 1
    total_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    achievements: List[str] = field(default_factory=list)
    weekly_goals: Dict[str, Any] = field(default_factory=dict)
    badges: List[str] = field(default_factory=list)
    last_workout: Optional[datetime] = None


class HebrewGamification:
    """Hebrew gamification system for CrossFit"""
    
    def __init__(self, storage_path: str = "gamification_data"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
        
        self.achievements = self._init_achievements()
        self.level_thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]
        self.hebrew_level_names = [
            "מתחיל", "חובב", "מתאמן", "ספורטאי", "אתלט",
            "לוחם", "אלוף", "אגדה", "טיטאן", "אל האימונים"
        ]
        self.english_level_names = [
            "Beginner", "Amateur", "Trainee", "Athlete", "Elite",
            "Warrior", "Champion", "Legend", "Titan", "Training God"
        ]
    
    def _init_achievements(self) -> Dict[str, Achievement]:
        """Initialize all achievements"""
        achievements = {
            # First steps
            "first_workout": Achievement(
                id="first_workout",
                type=AchievementType.FIRST_WORKOUT,
                name_he="ברוכים הבאים לקופסה!",
                name_en="Welcome to the Box!",
                description_he="השלמת את האימון הראשון שלך",
                description_en="Completed your first workout",
                icon="🏋️",
                points=50,
                requirements={"workouts": 1}
            ),
            
            # Streak achievements
            "week_streak": Achievement(
                id="week_streak",
                type=AchievementType.STREAK,
                name_he="אלוף העקביות",
                name_en="Consistency Champion",
                description_he="התאמנת 7 ימים ברצף",
                description_en="Worked out 7 days in a row",
                icon="🔥",
                points=100,
                requirements={"streak_days": 7}
            ),
            
            "month_streak": Achievement(
                id="month_streak",
                type=AchievementType.STREAK,
                name_he="מכונת אימונים",
                name_en="Training Machine",
                description_he="התאמנת 30 ימים ברצף",
                description_en="Worked out 30 days in a row",
                icon="🔥🔥",
                points=500,
                requirements={"streak_days": 30}
            ),
            
            # PR achievements
            "pr_crusher": Achievement(
                id="pr_crusher",
                type=AchievementType.PR,
                name_he="שוחט השיאים",
                name_en="PR Crusher",
                description_he="שברת 5 שיאים אישיים",
                description_en="Broke 5 personal records",
                icon="🏆",
                points=200,
                requirements={"prs": 5}
            ),
            
            "pr_master": Achievement(
                id="pr_master",
                type=AchievementType.PR,
                name_he="אדון השיאים",
                name_en="PR Master",
                description_he="שברת 20 שיאים אישיים",
                description_en="Broke 20 personal records",
                icon="👑",
                points=1000,
                requirements={"prs": 20}
            ),
            
            # Exercise milestones
            "pushup_50": Achievement(
                id="pushup_50",
                type=AchievementType.MILESTONE,
                name_he="מלך השכיבות",
                name_en="Push-up King",
                description_he="השלמת 50 שכיבות סמיכה ברצף",
                description_en="Completed 50 push-ups in a row",
                icon="💪",
                points=150,
                requirements={"exercise": "push-ups", "reps": 50}
            ),
            
            "pullup_20": Achievement(
                id="pullup_20",
                type=AchievementType.MILESTONE,
                name_he="אלוף המתח",
                name_en="Pull-up Champion",
                description_he="השלמת 20 עליות מתח ברצף",
                description_en="Completed 20 pull-ups in a row",
                icon="🦾",
                points=300,
                requirements={"exercise": "pull-ups", "reps": 20}
            ),
            
            "squat_heavy": Achievement(
                id="squat_heavy",
                type=AchievementType.MILESTONE,
                name_he="מלך הסקוואט",
                name_en="Squat King",
                description_he="סקוואט עם משקל גוף כפול 2",
                description_en="Squatted 2x body weight",
                icon="🦵",
                points=500,
                requirements={"exercise": "squats", "weight_multiplier": 2}
            ),
            
            # Challenges
            "murph_complete": Achievement(
                id="murph_complete",
                type=AchievementType.CHALLENGE,
                name_he="גיבור מרף",
                name_en="Murph Hero",
                description_he="השלמת את אתגר מרף",
                description_en="Completed the Murph challenge",
                icon="🎖️",
                points=1000,
                requirements={"challenge": "murph"}
            ),
            
            # Social
            "motivator": Achievement(
                id="motivator",
                type=AchievementType.SOCIAL,
                name_he="מעודד הקהילה",
                name_en="Community Motivator",
                description_he="עודדת 10 אנשים אחרים",
                description_en="Motivated 10 other people",
                icon="🤝",
                points=200,
                requirements={"motivations_given": 10}
            ),
            
            # Nutrition
            "nutrition_ninja": Achievement(
                id="nutrition_ninja",
                type=AchievementType.NUTRITION,
                name_he="נינג'ת התזונה",
                name_en="Nutrition Ninja",
                description_he="תיעדת 30 ארוחות בריאות",
                description_en="Logged 30 healthy meals",
                icon="🥗",
                points=300,
                requirements={"healthy_meals": 30}
            )
        }
        
        return achievements
    
    def load_user_profile(self, user_id: str) -> UserProfile:
        """Load user profile from storage"""
        profile_path = os.path.join(self.storage_path, f"{user_id}.json")
        
        if os.path.exists(profile_path):
            with open(profile_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                profile = UserProfile(**data)
                # Convert string dates back to datetime
                if profile.last_workout:
                    profile.last_workout = datetime.fromisoformat(profile.last_workout)
                return profile
        
        # Create new profile
        return UserProfile(user_id=user_id, username=f"User_{user_id}")
    
    def save_user_profile(self, profile: UserProfile):
        """Save user profile to storage"""
        profile_path = os.path.join(self.storage_path, f"{profile.user_id}.json")
        
        # Convert to dict for JSON serialization
        data = {
            "user_id": profile.user_id,
            "username": profile.username,
            "level": profile.level,
            "total_points": profile.total_points,
            "current_streak": profile.current_streak,
            "longest_streak": profile.longest_streak,
            "achievements": profile.achievements,
            "weekly_goals": profile.weekly_goals,
            "badges": profile.badges,
            "last_workout": profile.last_workout.isoformat() if profile.last_workout else None
        }
        
        with open(profile_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def process_workout(self, user_id: str, workout_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a workout and update gamification
        
        Returns:
            Dictionary with points earned, achievements unlocked, etc.
        """
        profile = self.load_user_profile(user_id)
        results = {
            "points_earned": 0,
            "achievements_unlocked": [],
            "level_up": False,
            "streak_update": None,
            "messages": []
        }
        
        # Base points for completing workout
        base_points = 10
        results["points_earned"] += base_points
        
        # Update streak
        streak_result = self._update_streak(profile)
        results["streak_update"] = streak_result
        if streak_result["bonus_points"] > 0:
            results["points_earned"] += streak_result["bonus_points"]
            results["messages"].append(streak_result["message"])
        
        # Check for PR
        if workout_data.get("is_pr"):
            pr_points = 50
            results["points_earned"] += pr_points
            results["messages"].append({
                "he": "🏆 שיא אישי חדש! +50 נקודות!",
                "en": "🏆 New Personal Record! +50 points!"
            })
        
        # Check achievements
        unlocked = self._check_achievements(profile, workout_data)
        for achievement_id in unlocked:
            achievement = self.achievements[achievement_id]
            results["achievements_unlocked"].append(achievement)
            results["points_earned"] += achievement.points
            profile.achievements.append(achievement_id)
        
        # Update total points and check level
        old_level = profile.level
        profile.total_points += results["points_earned"]
        profile.level = self._calculate_level(profile.total_points)
        
        if profile.level > old_level:
            results["level_up"] = True
            results["messages"].append({
                "he": f"🎉 עלית רמה! אתה עכשיו {self.hebrew_level_names[profile.level]}!",
                "en": f"🎉 Level up! You are now {self.english_level_names[profile.level]}!"
            })
        
        # Save updated profile
        self.save_user_profile(profile)
        
        return results
    
    def _update_streak(self, profile: UserProfile) -> Dict[str, Any]:
        """Update workout streak"""
        today = datetime.now().date()
        result = {
            "current_streak": 0,
            "bonus_points": 0,
            "message": {}
        }
        
        if profile.last_workout:
            last_workout_date = profile.last_workout.date()
            days_diff = (today - last_workout_date).days
            
            if days_diff == 0:
                # Same day workout
                result["current_streak"] = profile.current_streak
            elif days_diff == 1:
                # Streak continues
                profile.current_streak += 1
                result["current_streak"] = profile.current_streak
                
                # Bonus points for streak milestones
                if profile.current_streak == 7:
                    result["bonus_points"] = 50
                    result["message"] = {
                        "he": "🔥 7 ימים ברצף! +50 נקודות!",
                        "en": "🔥 7 day streak! +50 points!"
                    }
                elif profile.current_streak == 30:
                    result["bonus_points"] = 200
                    result["message"] = {
                        "he": "🔥🔥 30 ימים ברצף! +200 נקודות!",
                        "en": "🔥🔥 30 day streak! +200 points!"
                    }
                elif profile.current_streak % 10 == 0:
                    result["bonus_points"] = 100
                    result["message"] = {
                        "he": f"🔥 {profile.current_streak} ימים ברצף! +100 נקודות!",
                        "en": f"🔥 {profile.current_streak} day streak! +100 points!"
                    }
            else:
                # Streak broken
                profile.current_streak = 1
                result["current_streak"] = 1
                result["message"] = {
                    "he": "הרצף נקטע, אבל חזרת! בוא נתחיל רצף חדש!",
                    "en": "Streak broken, but you're back! Let's start a new streak!"
                }
        else:
            # First workout
            profile.current_streak = 1
            result["current_streak"] = 1
        
        # Update longest streak
        if profile.current_streak > profile.longest_streak:
            profile.longest_streak = profile.current_streak
        
        profile.last_workout = datetime.now()
        
        return result
    
    def _check_achievements(self, profile: UserProfile, workout_data: Dict[str, Any]) -> List[str]:
        """Check for newly unlocked achievements"""
        unlocked = []
        
        # First workout
        if "first_workout" not in profile.achievements and len(profile.achievements) == 0:
            unlocked.append("first_workout")
        
        # Streak achievements
        if profile.current_streak >= 7 and "week_streak" not in profile.achievements:
            unlocked.append("week_streak")
        
        if profile.current_streak >= 30 and "month_streak" not in profile.achievements:
            unlocked.append("month_streak")
        
        # Exercise-specific achievements
        exercise = workout_data.get("exercise")
        reps = workout_data.get("reps", 0)
        
        if exercise == "push-ups" and reps >= 50 and "pushup_50" not in profile.achievements:
            unlocked.append("pushup_50")
        
        if exercise == "pull-ups" and reps >= 20 and "pullup_20" not in profile.achievements:
            unlocked.append("pullup_20")
        
        return unlocked
    
    def _calculate_level(self, total_points: int) -> int:
        """Calculate user level based on total points"""
        for i in range(len(self.level_thresholds) - 1, -1, -1):
            if total_points >= self.level_thresholds[i]:
                return i
        return 0
    
    def get_leaderboard(self, timeframe: str = "week", limit: int = 10) -> List[Dict[str, Any]]:
        """Get leaderboard data"""
        leaderboard = []
        
        # Load all user profiles
        for filename in os.listdir(self.storage_path):
            if filename.endswith('.json'):
                with open(os.path.join(self.storage_path, filename), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    leaderboard.append({
                        "username": data["username"],
                        "level": data["level"],
                        "total_points": data["total_points"],
                        "current_streak": data["current_streak"],
                        "achievements": len(data["achievements"])
                    })
        
        # Sort by points
        leaderboard.sort(key=lambda x: x["total_points"], reverse=True)
        
        return leaderboard[:limit]
    
    def get_motivational_message(self, context: str, language: str = "he") -> str:
        """Get contextual motivational message"""
        messages = {
            "he": {
                "morning": [
                    "בוקר טוב אלוף! בוא נתחיל את היום חזק! 💪",
                    "יום חדש, הזדמנות חדשה להיות טוב יותר! 🌅",
                    "בוקר של אלופים! מי מוכן לשרוף? 🔥"
                ],
                "evening": [
                    "ערב טוב! עוד אימון לפני השינה? 🌙",
                    "לסיים את היום חזק! בוא נעשה את זה! 💪",
                    "אימון ערב = שינה טובה! 😴"
                ],
                "rest_day": [
                    "יום מנוחה חשוב! תן לגוף להתאושש 🧘",
                    "מנוחה היא חלק מהאימון. תחזור מחר חזק יותר! 💚",
                    "גם אלופים צריכים מנוחה. נתראה מחר! 👋"
                ],
                "comeback": [
                    "ברוך השב! החסרת לנו! 🎉",
                    "חזרת! בוא נמשיך מאיפה שהפסקנו! 💪",
                    "כמה טוב שחזרת! הקופסה לא אותו דבר בלעדיך! 🏋️"
                ]
            },
            "en": {
                "morning": [
                    "Good morning champion! Let's start the day strong! 💪",
                    "New day, new opportunity to be better! 🌅",
                    "Champions' morning! Who's ready to burn? 🔥"
                ],
                "evening": [
                    "Good evening! One more workout before bed? 🌙",
                    "End the day strong! Let's do this! 💪",
                    "Evening workout = better sleep! 😴"
                ],
                "rest_day": [
                    "Rest day is important! Let your body recover 🧘",
                    "Rest is part of training. Come back stronger tomorrow! 💚",
                    "Even champions need rest. See you tomorrow! 👋"
                ],
                "comeback": [
                    "Welcome back! We missed you! 🎉",
                    "You're back! Let's continue where we left off! 💪",
                    "So good to have you back! The box isn't the same without you! 🏋️"
                ]
            }
        }
        
        context_messages = messages.get(language, messages["en"]).get(context, [])
        return random.choice(context_messages) if context_messages else ""


# Example usage
if __name__ == "__main__":
    # Initialize gamification system
    gamification = HebrewGamification()
    
    # Example: Process a workout
    workout_data = {
        "exercise": "push-ups",
        "reps": 50,
        "is_pr": True
    }
    
    results = gamification.process_workout("user123", workout_data)
    print(f"Points earned: {results['points_earned']}")
    print(f"Achievements: {[a.name_he for a in results['achievements_unlocked']]}")
    
    # Get motivational message
    morning_message = gamification.get_motivational_message("morning", "he")
    print(f"Morning message: {morning_message}")