"""
Data Manager Tool
Handles resetting, clearing, and managing user exercise data
"""

from phi.tools import Toolkit
from typing import Dict, Any, Optional, List
import requests
import os


class DataManagerTool(Toolkit):
    """Tool for managing user data including reset and cleanup operations"""
    
    def __init__(self):
        super().__init__(name="data_manager")
        
        # Backend configuration
        self.backend_url = self._find_active_backend()
        self.token = self._load_auth_token()
        
        # Register the functions that the AI agent can call
        self.register(self.reset_user_data)
        self.register(self.clear_recent_data)
        self.register(self.get_data_summary)
        self.register(self.confirm_reset)
    
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
    
    def get_data_summary(self) -> str:
        """
        Get a summary of current user data before any reset operation.
        
        Returns:
            Summary of current data in Hebrew
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
                total_reps = stats.get("total_reps", 0)
                
                message = f"📋 נתונים קיימים במערכת:\n\n"
                message += f"🏆 סך הכל נקודות: {total_points:,}\n"
                message += f"💪 סך הכל אימונים: {total_exercises:,}\n"
                message += f"🔢 סך הכל חזרות: {total_reps:,}\n"
                
                if "exercise_breakdown" in data and data["exercise_breakdown"]:
                    message += f"\n📊 התרגילים העיקריים:\n"
                    for exercise in data["exercise_breakdown"][:3]:  # Top 3
                        name = exercise.get("name", "תרגיל")
                        count = exercise.get("count", 0)
                        message += f"   • {name}: {count} פעמים\n"
                
                return message
                
            else:
                return f"❌ שגיאה בקבלת נתונים: {response.status_code}"
                
        except Exception as e:
            return f"❌ שגיאה בחיבור לשרת: {str(e)}"
    
    def reset_user_data(
        self,
        reset_type: str = "soft",
        confirm: bool = False
    ) -> str:
        """
        Reset user exercise data. Requires confirmation for safety.
        
        Args:
            reset_type: Type of reset ("soft" = zero points but keep history, "hard" = delete all)
            confirm: Whether the user has confirmed this action
        
        Returns:
            Status message about the reset operation
        """
        
        if not confirm:
            # First show what will be reset
            current_data = self.get_data_summary()
            if current_data.startswith("❌"):
                return current_data
            
            confirmation_msg = f"⚠️ בקשה לאיפוס נתונים:\n\n"
            confirmation_msg += current_data
            confirmation_msg += f"\n\n🔄 סוג איפוס: {'רך (נקודות בלבד)' if reset_type == 'soft' else 'מלא (כל הנתונים)'}\n"
            confirmation_msg += f"\n❗ האם אתה בטוח שברצונך לאפס? זה יהיה בלתי הפיך!\n"
            confirmation_msg += f"כתוב 'כן, אפס' או 'בטל' כדי להמשיך או לבטל."
            
            return confirmation_msg
        
        # This is a mock implementation - in reality, you'd need a backend endpoint
        # for resetting data. For now, we'll return a confirmation message.
        if reset_type == "soft":
            return self._perform_soft_reset()
        elif reset_type == "hard":
            return self._perform_hard_reset()
        else:
            return "❌ סוג איפוס לא תקין. השתמש ב-'soft' או 'hard'"
    
    def _perform_soft_reset(self) -> str:
        """Perform soft reset (points to zero, keep exercise history)"""
        # Note: This would require backend implementation
        # For now, return a realistic message
        
        return ("⚠️ איפוס רך אינו זמין כרגע.\n"
               "פונקציה זו דורשת הוספת endpoint בשרת.\n"
               "לרגע, ניתן לאפס רק באמצעות מסד הנתונים ישירות.")
    
    def _perform_hard_reset(self) -> str:
        """Perform hard reset (delete all exercise data)"""
        # Note: This would require backend implementation  
        # For now, return a realistic message
        
        return ("⚠️ איפוס מלא אינו זמין כרגע.\n"
               "פונקציה זו דורשת הוספת endpoint בשרת.\n"
               "לביטחון, איפוס מלא יכול להתבצע רק על ידי מפתח המערכת.")
    
    def confirm_reset(self, confirmation_text: str) -> str:
        """
        Process user confirmation for reset operation.
        
        Args:
            confirmation_text: User's confirmation response
        
        Returns:
            Result of confirmation processing
        """
        
        confirmation_text = confirmation_text.strip().lower()
        
        positive_confirmations = ["כן", "yes", "אפס", "בטוח", "כן אפס", "כן, אפס"]
        negative_confirmations = ["לא", "no", "בטל", "cancel", "עצור"]
        
        if any(conf in confirmation_text for conf in positive_confirmations):
            return "✅ אישור התקבל. מבצע איפוס נתונים..."
        elif any(conf in confirmation_text for conf in negative_confirmations):
            return "✅ איפוס בוטל בהצלחה. הנתונים שלך נשארו ללא שינוי."
        else:
            return ("❓ לא הבנתי את התשובה.\n"
                   "אנא כתוב 'כן' לאישור או 'בטל' לביטול.")
    
    def clear_recent_data(self, days: int = 1) -> str:
        """
        Clear exercise data from recent days (for cleaning up test data).
        
        Args:
            days: Number of recent days to clear
        
        Returns:
            Status message about the cleanup operation
        """
        
        # Note: This would require backend implementation
        # For now, provide guidance
        
        return (f"🧹 ניקוי נתונים מ-{days} הימים האחרונים:\n\n"
               f"⚠️ פונקציה זו דורשת הוספת endpoint בשרת.\n"
               f"במקום זאת, ניתן להשתמש בכלים הבאים:\n"
               f"• צפייה בסטטיסטיקות כדי לראות מה יימחק\n"
               f"• איפוס מלא אם נדרש\n"
               f"• פניה למפתח המערכת לניקוי ידני")