"""
Exercise Logger Tool
Handles natural language exercise logging with Hebrew support
"""

from phi.tools import Toolkit
from typing import Optional, Dict, Any
import re
import requests
import os


class ExerciseLoggerTool(Toolkit):
    """Tool for logging exercises from natural language input"""
    
    def __init__(self):
        super().__init__(name="exercise_logger")
        
        # Backend configuration
        self.backend_url = self._find_active_backend()
        self.token = self._load_auth_token()
        
        # Exercise patterns for Hebrew recognition
        self.exercise_patterns = {
            # Cardio exercises
            "ריצה": "running", "רצתי": "running", "רצה": "running",
            "הליכה": "walking", "הלכתי": "walking", "הלך": "walking",
            
            # Strength exercises
            "סקוואט": "squat", "סקוואטים": "squat",
            "שכיבות סמיכה": "pushup", "שכיבות שמיכה": "pushup", "פוש אפ": "pushup",
            "משיכות": "pullup", "משיכה": "pullup", "פול אפ": "pullup",
            "ברפי": "burpee", "ברפיז": "burpee",
            "דדליפט": "deadlift", "בק סקווט": "back_squat",
            "דחיפות בשכיבה": "bench_press", "בנץ' פרס": "bench_press",
            
            # Core exercises
            "פלאנק": "plank", "כפיפות בטן": "situp", "כפיפת בטן": "situp"
        }
        
        # Register the function that the AI agent can call
        self.register(self.log_exercise)
    
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
    
    def parse_exercise_from_text(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse exercise information from natural language text"""
        text = text.strip().lower()
        
        # Extract numbers
        numbers = re.findall(r'\d+(?:\.\d+)?', text)
        
        # Find exercise type
        exercise_type = None
        hebrew_name = None
        
        for hebrew, english in self.exercise_patterns.items():
            if hebrew in text:
                exercise_type = english
                hebrew_name = hebrew
                break
        
        if not exercise_type:
            return None
        
        # Initialize result
        result = {
            "exercise": exercise_type,
            "hebrew_name": hebrew_name,
            "reps": None,
            "sets": 1,
            "weight_kg": None,
            "distance_km": None,
            "duration_seconds": None
        }
        
        if numbers:
            # Check for distance-based exercises
            if "מטר" in text or "ק\"מ" in text or "קילומטר" in text:
                distance_value = float(numbers[0])
                
                if "קילומטר" in text or "ק\"מ" in text:
                    result["distance_km"] = distance_value
                elif "מטר" in text:
                    result["distance_km"] = distance_value / 1000.0
                    
                result["reps"] = 1  # One run/walk session
                
            else:
                # Standard rep-based exercise
                if len(numbers) == 1:
                    result["reps"] = int(float(numbers[0]))
                elif len(numbers) >= 2:
                    result["reps"] = int(float(numbers[0]))
                    # Check for weight indicators
                    if "קילו" in text or "ק\"ג" in text or "קג" in text:
                        result["weight_kg"] = float(numbers[1])
        
        return result
    
    def log_exercise(
        self, 
        exercise_description: str,
        confirm: bool = True
    ) -> str:
        """
        Log an exercise from natural language description.
        
        Args:
            exercise_description: Natural language description of the exercise (Hebrew or English)
            confirm: Whether to confirm the exercise was logged
        
        Returns:
            Status message about the exercise logging
        """
        
        if not self.token:
            return "❌ No authentication token available. Please set up authentication first."
        
        # Parse the exercise description
        exercise_data = self.parse_exercise_from_text(exercise_description)
        
        if not exercise_data:
            return f"לא הצלחתי לזהות תרגיל בתיאור: '{exercise_description}'. אנא נסה שוב עם תיאור יותר ברור."
        
        # Format for API
        api_data = {
            "name": exercise_data["exercise"].replace("_", " ").title(),
            "name_he": exercise_data["hebrew_name"],
            "reps": exercise_data.get("reps"),
            "sets": exercise_data.get("sets", 1),
            "weight_kg": exercise_data.get("weight_kg"),
            "distance_km": exercise_data.get("distance_km"),
            "duration_seconds": exercise_data.get("duration_seconds"),
            "voice_command": exercise_description
        }
        
        # Save to backend
        try:
            response = requests.post(
                f"{self.backend_url}/exercises/log",
                json=api_data,
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                points = result.get("points_earned", 0)
                
                # Build success message
                if exercise_data.get("distance_km"):
                    distance_text = f"{exercise_data['distance_km']} ק\"מ"
                    message = f"✅ {exercise_data['hebrew_name']} {distance_text} נרשם בהצלחה!"
                elif exercise_data.get("reps"):
                    reps_text = f"{exercise_data['reps']}"
                    message = f"✅ {reps_text} {exercise_data['hebrew_name']} נרשמו בהצלחה!"
                else:
                    message = f"✅ {exercise_data['hebrew_name']} נרשם בהצלחה!"
                
                if points > 0:
                    message += f" קיבלת {points} נקודות! 💪"
                
                return message
                
            else:
                return f"❌ שגיאה בשמירת התרגיל: {response.status_code}"
                
        except Exception as e:
            return f"❌ שגיאה בחיבור לשרת: {str(e)}"