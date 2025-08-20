"""
Statistics Retriever Tool
Handles fetching user progress, points, and workout statistics
"""

from phi.tools import Toolkit
from typing import Dict, Any, Optional
import requests
import os


class StatisticsRetrieverTool(Toolkit):
    """Tool for retrieving user exercise statistics and progress"""
    
    def __init__(self):
        super().__init__(name="statistics_retriever")
        
        # Backend configuration
        self.backend_url = self._find_active_backend()
        self.token = self._load_auth_token()
        
        # Register the functions that the AI agent can call
        self.register(self.get_user_statistics)
        self.register(self.get_progress_summary)
        self.register(self.get_points_breakdown)
    
    def _find_active_backend(self) -> str:
        """Find active SweatBot backend"""
        for port in [8000, 8003, 8004]:
            try:
                response = requests.get(f"http://localhost:{port}/health", timeout=2)
                if response.status_code == 200 and "sweatbot" in response.text.lower():
                    return f"http://localhost:{port}"
            except:
                continue
        return "http://localhost:8004"  # fallback
    
    def _load_auth_token(self) -> str:
        """Load authentication token"""
        token_file = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.sweatbot_token')
        try:
            with open(token_file, 'r') as f:
                return f.read().strip()
        except:
            return ""
    
    def get_user_statistics(
        self,
        include_breakdown: bool = True,
        include_weekly: bool = True
    ) -> str:
        """
        Get comprehensive user statistics including points, exercises, and progress.
        
        Args:
            include_breakdown: Include exercise-by-exercise breakdown
            include_weekly: Include weekly progress data
        
        Returns:
            Formatted statistics message in Hebrew
        """
        
        if not self.token:
            return "❌ אין הרשאת גישה למסד הנתונים"
        
        try:
            response = requests.get(
                f"{self.backend_url}/exercises/statistics",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                stats = data["total_stats"]
                
                # Build main statistics message
                total_points = stats.get("total_points", 0)
                total_exercises = stats.get("total_exercises", 0)
                total_reps = stats.get("total_reps", 0)
                
                message = f"📊 הסטטיסטיקות שלך:\n\n"
                message += f"🏆 סך הכל נקודות: {total_points:,}\n"
                message += f"💪 סך הכל אימונים: {total_exercises:,}\n"
                message += f"🔢 סך הכל חזרות: {total_reps:,}\n"
                
                # Add exercise breakdown if requested
                if include_breakdown and "exercise_breakdown" in data:
                    message += f"\n📋 פירוט לפי תרגילים:\n"
                    
                    for exercise in data["exercise_breakdown"][:5]:  # Top 5
                        name = exercise.get("name", "תרגיל")
                        count = exercise.get("count", 0)
                        points = exercise.get("points", 0)
                        message += f"   • {name}: {count} פעמים ({points} נקודות)\n"
                
                # Add weekly progress if requested and available
                if include_weekly and "weekly_progress" in data:
                    weekly = data["weekly_progress"]
                    if weekly:
                        recent_day = weekly[0]  # Most recent day
                        message += f"\n📅 השבוע:\n"
                        message += f"   • היום: {recent_day.get('exercises', 0)} אימונים"
                        message += f" ({recent_day.get('points', 0)} נקודות)\n"
                
                return message
                
            else:
                return f"❌ שגיאה בקבלת נתונים: {response.status_code}"
                
        except Exception as e:
            return f"❌ שגיאה בחיבור לשרת: {str(e)}"
    
    def get_progress_summary(self, time_period: str = "week") -> str:
        """
        Get a summary of progress for a specific time period.
        
        Args:
            time_period: Time period to analyze ("week", "month", "all")
        
        Returns:
            Progress summary message in Hebrew
        """
        
        # Get basic statistics first
        stats_response = self.get_user_statistics(include_breakdown=False, include_weekly=True)
        
        if stats_response.startswith("❌"):
            return stats_response
        
        try:
            response = requests.get(
                f"{self.backend_url}/exercises/statistics",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                stats = data["total_stats"]
                
                total_points = stats.get("total_points", 0)
                total_exercises = stats.get("total_exercises", 0)
                
                message = f"🎯 סיכום התקדמות:\n\n"
                
                # Basic progress
                if total_exercises == 0:
                    message += "עדיין לא התחלת! בוא נתחיל עם התרגיל הראשון שלך! 💪"
                elif total_exercises < 10:
                    message += f"התחלה מעולה! עשית {total_exercises} אימונים עם {total_points} נקודות.\n"
                    message += "המשך כך והשגת רהוט בקרוב! 🌟"
                elif total_exercises < 50:
                    message += f"ממש טוב! {total_exercises} אימונים ו-{total_points} נקודות!\n"
                    message += "אתה בדרך הנכונה לרמה הבאה! 🚀"
                else:
                    message += f"וואו! {total_exercises} אימונים ו-{total_points:,} נקודות!\n"
                    message += "אתה אלוף אמיתי! המשך במרץ! 🏆"
                
                return message
                
            else:
                return f"❌ שגיאה בקבלת נתונים: {response.status_code}"
                
        except Exception as e:
            return f"❌ שגיאה בחיבור לשרת: {str(e)}"
    
    def get_points_breakdown(self) -> str:
        """
        Get detailed breakdown of how points were earned.
        
        Returns:
            Points breakdown message in Hebrew
        """
        
        try:
            response = requests.get(
                f"{self.backend_url}/exercises/statistics",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "exercise_breakdown" not in data:
                    return "📊 אין נתונים זמינים על פירוט נקודות"
                
                message = f"🏅 פירוט צבירת נקודות:\n\n"
                
                total_points = 0
                for exercise in data["exercise_breakdown"]:
                    name = exercise.get("name", "תרגיל")
                    count = exercise.get("count", 0)
                    points = exercise.get("points", 0)
                    total_points += points
                    
                    if count > 0:
                        avg_points = points / count
                        message += f"💪 {name}:\n"
                        message += f"   • {count} פעמים × {avg_points:.1f} נק׳ = {points} נק׳\n\n"
                
                message += f"🎯 סה״כ: {total_points:,} נקודות מכל התרגילים!"
                
                return message
                
            else:
                return f"❌ שגיאה בקבלת נתונים: {response.status_code}"
                
        except Exception as e:
            return f"❌ שגיאה בחיבור לשרת: {str(e)}"