"""
Workout Suggester Tool
Provides personalized workout recommendations
"""

from phi.tools import Toolkit
from typing import Dict, Any, List
import requests
import os
import random


class WorkoutSuggesterTool(Toolkit):
    """Tool for suggesting personalized workouts based on user history and preferences"""
    
    def __init__(self):
        super().__init__(name="workout_suggester")
        
        # Backend configuration
        self.backend_url = self._find_active_backend()
        self.token = self._load_auth_token()
        
        # Exercise suggestions database
        self.exercise_suggestions = {
            "beginner": {
                "cardio": ["הליכה 10 דקות", "רצה 500 מטר", "הליכה במקום 5 דקות"],
                "strength": ["10 סקוואטים", "5 שכיבות סמיכה", "פלאנק 30 שניות"],
                "core": ["10 כפיפות בטן", "פלאנק 20 שניות", "10 כפיפות בטן לצדדים"]
            },
            "intermediate": {
                "cardio": ["רצה 1 קילומטר", "רצה 800 מטר", "הליכה מהירה 15 דקות"],
                "strength": ["20 סקוואטים", "15 שכיבות סמיכה", "5 משיכות"],
                "core": ["30 כפיפות בטן", "פלאנק 60 שניות", "20 כפיפות בטן לצדדים"]
            },
            "advanced": {
                "cardio": ["רצה 3 קילומטר", "רצה 2 קילומטר", "רצה עם מרווחים"],
                "strength": ["50 סקוואטים", "30 שכיבות סמיכה", "15 משיכות", "10 ברפיז"],
                "core": ["50 כפיפות בטן", "פלאנק 2 דקות", "30 כפיפות בטן לצדדים"]
            }
        }
        
        # Register the functions that the AI agent can call
        self.register(self.suggest_workout)
        self.register(self.suggest_next_exercise)
        self.register(self.create_weekly_plan)
    
    def _find_active_backend(self) -> str:
        """Find active SweatBot backend"""
        for port in [8000, 8003, 8004]:
            try:
                response = requests.get(f"http://localhost:{port}/health", timeout=2)
                if response.status_code == 200 and "sweatbot" in response.text.lower():
                    return f"http://localhost:{port}"
            except:
                continue
        return "http://localhost:8004"
    
    def _load_auth_token(self) -> str:
        """Load authentication token"""
        token_file = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.sweatbot_token')
        try:
            with open(token_file, 'r') as f:
                return f.read().strip()
        except:
            return ""
    
    def _determine_user_level(self, total_exercises: int, total_points: int) -> str:
        """Determine user fitness level based on activity"""
        if total_exercises < 10 or total_points < 100:
            return "beginner"
        elif total_exercises < 50 or total_points < 500:
            return "intermediate"
        else:
            return "advanced"
    
    def suggest_workout(
        self,
        workout_type: str = "mixed",
        duration_minutes: int = 20,
        focus_area: str = "general"
    ) -> str:
        """
        Suggest a personalized workout based on user's history and preferences.
        
        Args:
            workout_type: Type of workout ("cardio", "strength", "mixed", "core")
            duration_minutes: Desired workout duration
            focus_area: Focus area ("upper_body", "lower_body", "core", "general")
        
        Returns:
            Workout suggestion in Hebrew
        """
        
        # Get user's current level
        user_level = "intermediate"  # Default
        
        if self.token:
            try:
                response = requests.get(
                    f"{self.backend_url}/exercises/statistics",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    stats = data["total_stats"]
                    total_exercises = stats.get("total_exercises", 0)
                    total_points = stats.get("total_points", 0)
                    user_level = self._determine_user_level(total_exercises, total_points)
                    
            except:
                pass  # Use default level
        
        message = f"🏋️ הצעת אימון מותאמת אישית:\n\n"
        level_names = {'beginner': 'מתחיל', 'intermediate': 'בינוני', 'advanced': 'מתקדם'}
        message += f"📊 רמתך: {level_names[user_level]}\n"
        message += f"⏱️ משך זמן: {duration_minutes} דקות\n\n"
        
        # Select exercises based on workout type and user level
        suggested_exercises = []
        
        if workout_type == "mixed":
            # Mixed workout - variety from all categories
            cardio_exercises = self.exercise_suggestions[user_level]["cardio"][:2]
            strength_exercises = self.exercise_suggestions[user_level]["strength"][:2]
            core_exercises = self.exercise_suggestions[user_level]["core"][:1]
            
            suggested_exercises.extend(random.sample(cardio_exercises, min(1, len(cardio_exercises))))
            suggested_exercises.extend(random.sample(strength_exercises, min(2, len(strength_exercises))))
            suggested_exercises.extend(random.sample(core_exercises, min(1, len(core_exercises))))
            
        elif workout_type in self.exercise_suggestions[user_level]:
            # Specific workout type
            available_exercises = self.exercise_suggestions[user_level][workout_type]
            suggested_exercises = random.sample(available_exercises, min(3, len(available_exercises)))
        
        else:
            # Default mixed workout
            all_exercises = []
            for category in self.exercise_suggestions[user_level].values():
                all_exercises.extend(category)
            suggested_exercises = random.sample(all_exercises, min(4, len(all_exercises)))
        
        message += "🎯 התרגילים המוצעים:\n"
        for i, exercise in enumerate(suggested_exercises, 1):
            message += f"   {i}. {exercise}\n"
        
        message += f"\n💡 טיפ: התחל עם חימום קל והקפד על טכניקה נכונה!\n"
        message += f"בהצלחה! 💪"
        
        return message
    
    def suggest_next_exercise(self, last_exercise: str = "") -> str:
        """
        Suggest the next exercise based on what was just done.
        
        Args:
            last_exercise: The last exercise performed
        
        Returns:
            Next exercise suggestion in Hebrew
        """
        
        # Smart suggestions based on last exercise
        if "ריצה" in last_exercise or "הליכה" in last_exercise:
            next_suggestions = ["נמתח לרגליים", "תן לגוף להתאושש", "שתה מים"]
        elif "סקוואט" in last_exercise:
            next_suggestions = ["שכיבות סמיכה", "פלאנק", "מתיחות לרגליים"]
        elif "שכיבות" in last_exercise:
            next_suggestions = ["סקוואטים", "פלאנק", "מתיחות לזרועות"]
        else:
            next_suggestions = ["פלאנק", "מתיחות כלליות", "נשימות עמוקות"]
        
        suggestion = random.choice(next_suggestions)
        
        return (f"💡 הצעה לתרגיל הבא:\n\n"
               f"🎯 {suggestion}\n\n"
               f"זה יהיה משלים יפה את מה שעשית! 👍")
    
    def create_weekly_plan(self, goal: str = "general_fitness") -> str:
        """
        Create a weekly workout plan based on user goals.
        
        Args:
            goal: User's fitness goal ("weight_loss", "strength", "endurance", "general_fitness")
        
        Returns:
            Weekly workout plan in Hebrew
        """
        
        plans = {
            "weight_loss": {
                "Sunday": "ריצה 20 דקות + כפיפות בטן",
                "Monday": "הליכה מהירה 30 דקות", 
                "Tuesday": "אימון מעגלי: 3 סטים של (10 סקוואטים + 10 שכיבות + פלאנק 30 שניות)",
                "Wednesday": "ריצה 15 דקות + מתיחות",
                "Thursday": "אימון כוח: 20 סקוואטים + 15 שכיבות + 5 משיכות",
                "Friday": "הליכה 25 דקות",
                "Saturday": "מנוחה או יוגה קלה"
            },
            "strength": {
                "Sunday": "רגליים: 30 סקוואטים + 20 בק סקווט",
                "Monday": "חזה וכתפיים: 25 שכיבות + 10 דחיפות מעל הראש",
                "Tuesday": "גב: 10 משיכות + פלאנק 60 שניות", 
                "Wednesday": "מנוחה פעילה - הליכה קלה",
                "Thursday": "רגליים: 25 סקוואטים + 15 בק סקווט",
                "Friday": "גוף עליון: 20 שכיבות + 8 משיכות",
                "Saturday": "מנוחה"
            },
            "general_fitness": {
                "Sunday": "ריצה 15 דקות + 15 סקוואטים",
                "Monday": "10 שכיבות סמיכה + פלאנק 45 שניות",
                "Tuesday": "הליכה 20 דקות + מתיחות",
                "Wednesday": "אימון מעגלי קל - 15 דקות",
                "Thursday": "ריצה 10 דקות + 20 כפיפות בטן", 
                "Friday": "5 משיכות + 20 סקוואטים",
                "Saturday": "מנוחה או פעילות חופשית"
            }
        }
        
        plan = plans.get(goal, plans["general_fitness"])
        
        message = f"📅 תוכנית אימון שבועית ({goal}):\n\n"
        
        days_he = {
            "Sunday": "ראשון",
            "Monday": "שני", 
            "Tuesday": "שלישי",
            "Wednesday": "רביעי",
            "Thursday": "חמישי",
            "Friday": "שישי",
            "Saturday": "שבת"
        }
        
        for day_en, workout in plan.items():
            day_he = days_he[day_en]
            message += f"🗓️ יום {day_he}: {workout}\n"
        
        message += f"\n💡 זכור: התאם את התוכנית לרמתך והקשב לגופך!\n"
        message += f"בהצלחה עם התוכנית החדשה! 🌟"
        
        return message