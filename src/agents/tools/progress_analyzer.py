"""
Progress Analyzer Tool
Analyzes workout trends and provides insights
"""

from phi.tools import Toolkit
from typing import Dict, Any, List
import requests
import os
from datetime import datetime, timedelta


class ProgressAnalyzerTool(Toolkit):
    """Tool for analyzing progress trends and providing insights"""
    
    def __init__(self):
        super().__init__(name="progress_analyzer")
        
        # Backend configuration
        self.backend_url = self._find_active_backend()
        self.token = self._load_auth_token()
        
        # Register the functions that the AI agent can call
        self.register(self.analyze_progress_trends)
        self.register(self.get_weekly_insights)
        self.register(self.compare_periods)
    
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
    
    def analyze_progress_trends(self, period_days: int = 30) -> str:
        """
        Analyze progress trends over a specified period.
        
        Args:
            period_days: Number of days to analyze
        
        Returns:
            Progress analysis in Hebrew
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
                
                total_points = stats.get("total_points", 0)
                total_exercises = stats.get("total_exercises", 0)
                
                message = f"📊 ניתוח מגמות ({period_days} ימים אחרונים):\n\n"
                
                if total_exercises == 0:
                    return "📊 אין מספיק נתונים לניתוח מגמות. התחל לאמן ונבדק שוב!"
                
                # Calculate daily averages
                daily_exercises = total_exercises / max(period_days, 1)
                daily_points = total_points / max(period_days, 1)
                
                message += f"📈 ממוצע יומי:\n"
                message += f"   • {daily_exercises:.1f} אימונים ביום\n"
                message += f"   • {daily_points:.1f} נקודות ביום\n\n"
                
                # Provide insights based on activity level
                if daily_exercises >= 2:
                    message += "🔥 מעולה! אתה מאמן בקביעות גבוהה!\n"
                    message += "המשך כך ותראה שיפור משמעותי בכושר!"
                elif daily_exercises >= 1:
                    message += "💪 טוב מאוד! אימון יומי זה בדיוק מה שצריך!\n"
                    message += "נסה להוסיף עוד תרגיל או שניים ביום."
                elif daily_exercises >= 0.5:
                    message += "⭐ התחלה טובה! אימון כל יומיים זה בסדר.\n"
                    message += "נסה להעלות לאימון יומי להתקדמות מהירה יותר."
                else:
                    message += "🌱 זה התחלה! כל תרגיל חשוב.\n"
                    message += "נסה להגדיר יעד של אימון אחד ביום."
                
                return message
                
            else:
                return f"❌ שגיאה בקבלת נתונים: {response.status_code}"
                
        except Exception as e:
            return f"❌ שגיאה בחיבור לשרת: {str(e)}"
    
    def get_weekly_insights(self) -> str:
        """
        Get insights about weekly progress patterns.
        
        Returns:
            Weekly insights in Hebrew
        """
        
        try:
            response = requests.get(
                f"{self.backend_url}/exercises/statistics",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                message = f"📅 תובנות שבועיות:\n\n"
                
                if "weekly_progress" in data and data["weekly_progress"]:
                    recent_day = data["weekly_progress"][0]
                    exercises_today = recent_day.get("exercises", 0)
                    points_today = recent_day.get("points", 0)
                    
                    message += f"🌟 היום:\n"
                    message += f"   • {exercises_today} אימונים\n"
                    message += f"   • {points_today} נקודות\n\n"
                    
                    if exercises_today > 0:
                        message += "✨ כל הכבוד על הפעילות היום!\n"
                        message += "המשך כך לשמירה על קצב טוב."
                    else:
                        message += "💡 עוד לא אימנת היום?\n"
                        message += "זה זמן נהדר להתחיל עם תרגיל קל!"
                
                else:
                    message += "📊 אין מספיק נתונים שבועיים.\n"
                    message += "התחל לאמן ואני אוכל לתת לך תובנות מעמיקות יותר!"
                
                return message
                
            else:
                return f"❌ שגיאה בקבלת נתונים: {response.status_code}"
                
        except Exception as e:
            return f"❌ שגיאה בחיבור לשרת: {str(e)}"
    
    def compare_periods(
        self, 
        period1_days: int = 7, 
        period2_days: int = 7
    ) -> str:
        """
        Compare progress between two time periods.
        
        Args:
            period1_days: Days for first period (recent)
            period2_days: Days for second period (older)
        
        Returns:
            Comparison analysis in Hebrew
        """
        
        # Mock implementation - would require more complex backend queries
        return (f"📊 השוואת תקופות:\n\n"
               f"🔍 השוואה בין {period1_days} הימים האחרונים\n"
               f"ל-{period2_days} הימים שלפני כן:\n\n"
               f"⚠️ פונקציה זו דורשת הרחבת ה-API לקבלת נתונים לפי תאריכים.\n"
               f"בינתיים, השתמש ב'ניתוח מגמות' לקבלת תובנות כלליות.")