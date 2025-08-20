"""
Goal Setter Tool
Handles setting and tracking fitness goals
"""

from phi.tools import Toolkit
from typing import Dict, Any, Optional
import json
import os


class GoalSetterTool(Toolkit):
    """Tool for setting and tracking fitness goals"""
    
    def __init__(self):
        super().__init__(name="goal_setter")
        
        # Register the functions that the AI agent can call
        self.register(self.set_goal)
        self.register(self.get_current_goals)
        self.register(self.check_goal_progress)
    
    def set_goal(
        self,
        goal_type: str,
        target_value: int,
        time_period: str = "week",
        goal_description: str = ""
    ) -> str:
        """
        Set a fitness goal for the user.
        
        Args:
            goal_type: Type of goal ("points", "exercises", "running_km", "pushups", etc.)
            target_value: Target value to achieve
            time_period: Time period for the goal ("day", "week", "month")
            goal_description: Optional description of the goal
        
        Returns:
            Confirmation message about the goal setting
        """
        
        # Goal type translations
        goal_translations = {
            "points": "נקודות",
            "exercises": "אימונים", 
            "running_km": "ק\"מ ריצה",
            "pushups": "שכיבות סמיכה",
            "squats": "סקוואטים",
            "pullups": "משיכות"
        }
        
        period_translations = {
            "day": "יום",
            "week": "שבוע", 
            "month": "חודש"
        }
        
        goal_name_he = goal_translations.get(goal_type, goal_type)
        period_he = period_translations.get(time_period, time_period)
        
        message = f"🎯 יעד חדש נקבע בהצלחה!\n\n"
        message += f"📋 יעד: {target_value} {goal_name_he} ב{period_he}\n"
        
        if goal_description:
            message += f"💭 תיאור: {goal_description}\n"
        
        message += f"\n✨ בהצלחה! אני אעקוב אחרי ההתקדמות שלך!"
        
        # In a real implementation, this would save to database
        return message
    
    def get_current_goals(self) -> str:
        """
        Get list of current active goals.
        
        Returns:
            List of current goals in Hebrew
        """
        
        # Mock response - in reality this would query the database
        return ("🎯 היעדים הפעילים שלך:\n\n"
               "📊 כרגע אין יעדים מוגדרים במערכת.\n"
               "אתה יכול להגדיר יעדים חדשים על ידי אמירת משהו כמו:\n"
               "• 'אני רוצה להגיע ל-100 נקודות השבוע'\n"
               "• 'קבע לי יעד של 50 סקוואטים ביום'\n"
               "• 'אני רוצה לרוץ 5 ק\"מ השבוע'")
    
    def check_goal_progress(self, goal_type: str = "all") -> str:
        """
        Check progress towards current goals.
        
        Args:
            goal_type: Type of goal to check, or "all" for all goals
        
        Returns:
            Progress report in Hebrew
        """
        
        return ("📈 התקדמות ביעדים:\n\n"
               "📊 כרגע אין יעדים פעילים למעקב.\n"
               "לאחר שתגדיר יעדים, אני אוכל לעקוב אחרי ההתקדמות שלך\n"
               "ולתת לך עדכונים קבועים על מצבך!")