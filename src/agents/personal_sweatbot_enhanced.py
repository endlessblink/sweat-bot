"""
Enhanced Personal SweatBot Agent with PostgreSQL Integration
Uses Phidata for AI responses + Backend API for persistent exercise tracking
"""

from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.model.google import Gemini
from phi.model.groq import Groq
from phi.memory.agent import AgentMemory
from .mongodb_memory import MongoDBMemory
from typing import Optional, Dict, Any
import os
import sys
import json
import re
import requests
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class PersonalSweatBotEnhanced:
    """Your personal Hebrew fitness AI coach with persistent PostgreSQL storage"""
    
    def __init__(self):
        # Backend API configuration - Try multiple ports
        self.backend_url = None
        self._find_active_backend()
        self.token = self._load_auth_token()
        
        # Initialize Hebrew model manager if available
        self.hebrew_manager = self._init_hebrew_manager()
        
        # Initialize AI agent
        self.agent = self._init_agent()
        
        # Exercise patterns for parsing
        self.exercise_patterns = self._init_exercise_patterns()
        
    def _find_active_backend(self):
        """Find the active backend API by testing multiple ports"""
        candidate_ports = [8000, 8003, 8004]  # Common SweatBot ports
        
        for port in candidate_ports:
            try:
                test_url = f"http://localhost:{port}"
                response = requests.get(f"{test_url}/health", timeout=2)
                
                if response.status_code == 200 and "sweatbot" in response.text.lower():
                    self.backend_url = test_url
                    print(f"✅ Found active SweatBot backend on port {port}")
                    return
                    
            except Exception:
                continue
        
        # Fallback to default port if none found
        self.backend_url = "http://localhost:8004"
        print("⚠️ No active backend found, using fallback port 8004")
    
    def _load_auth_token(self) -> str:
        """Load authentication token for backend API"""
        token_file = os.path.join(os.path.dirname(__file__), '..', '..', '.sweatbot_token')
        try:
            with open(token_file, 'r') as f:
                token = f.read().strip()
                return token
        except FileNotFoundError:
            print("⚠️ Authentication token not found. Please run setup_personal_user.py first")
            return ""
    
    def _init_hebrew_manager(self):
        """Initialize Hebrew model manager if available"""
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend', 'app', 'services'))
        try:
            from hebrew_model_manager import HebrewModelManager
            return HebrewModelManager()
        except ImportError:
            print("⚠️ Hebrew model manager not available")
            return None
    
    def _init_agent(self) -> Agent:
        """Initialize Phidata agent with model selection"""
        # Model selection priority: Groq > OpenAI > Gemini
        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
        
        if groq_key:
            model = Groq(
                id="llama3-70b-8192",
                temperature=0.3,
                api_key=groq_key
            )
        elif openai_key:
            model = OpenAIChat(
                id="gpt-4",
                temperature=0.3,
                api_key=openai_key
            )
        elif gemini_key:
            model = Gemini(
                id="gemini-1.5-flash",
                temperature=0.3,
                api_key=gemini_key
            )
        else:
            raise ValueError("No API key found. Please set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY")
        
        return Agent(
            name="SweatBot-Enhanced",
            model=model,
            instructions=self._get_enhanced_instructions(),
            memory=MongoDBMemory(user_id="personal"),
            show_tool_calls=False,  # Clean output
            markdown=True,
            debug_mode=False
        )
    
    def _get_enhanced_instructions(self) -> str:
        """Enhanced coaching instructions with database awareness"""
        return """
        אתה SweatBot, המאמן הכושר האישי שלי בעברית עם זיכרון מתקדם.
        
        יכולות מיוחדות שלך:
        • אתה יכול לשמור ולהציג נתונים על אימונים מהמסד נתונים
        • אתה זוכר את כל ההתקדמות והנקודות שצברתי
        • אתה יכול להציג סטטיסטיקות מדויקות על האימונים שלי
        
        הנחיות תגובה:
        • תמיד תענה בעברית בלבד
        • תהיה חיובי ומעודד אבל קצר ומדויק
        • כשאני מדווח על תרגיל - תשמור אותו ותחשב נקודות
        • כשאני שואל על נקודות או התקדמות - תציג נתונים אמיתיים
        • תיתן טיפים קצרים ומעשיים
        
        כשאני מדווח תרגיל (כמו "עשיתי 20 סקוואטים"):
        1. אשר קבלת המידע
        2. הודע כמה נקודות הוענקו  
        3. תן טיפ קצר אם רלוונטי
        
        כשאני שואל על נתונים (כמו "כמה נקודות יש לי"):
        1. הצג את הנתונים האמיתיים מהמסד נתונים
        2. תן עידוד או המלצה
        
        דוגמאות לתגובות טובות:
        "מעולה! 20 סקוואטים נרשמו - 30 נקודות! 💪"
        "יש לך 145 נקודות סה״כ! המשך כך! ⭐"
        """
    
    def _init_exercise_patterns(self) -> Dict[str, str]:
        """Initialize Hebrew exercise pattern recognition"""
        return {
            # Strength exercises
            "סקוואט": "squat",
            "סקוואטים": "squat", 
            "שכיבות סמיכה": "pushup",
            "שכיבות שמיכה": "pushup",
            "שכיבה סמיכה": "pushup",
            "פוש אפ": "pushup",
            "משיכות": "pullup",
            "משיכה": "pullup",
            "פול אפ": "pullup",
            "ברפי": "burpee",
            "ברפיז": "burpee",
            "דדליפט": "deadlift",
            "בק סקווט": "back_squat",
            "דחיפות בשכיבה": "bench_press",
            "בנץ' פרס": "bench_press",
            
            # Core exercises  
            "פלאנק": "plank",
            "כפיפות בטן": "situp",
            "כפיפת בטן": "situp",
            "סיט אפ": "situp",
            
            # Cardio exercises - Enhanced for distance tracking
            "ריצה": "running",
            "רצתי": "running", 
            "רצה": "running",
            "הליכה": "walking",
            "הלכתי": "walking",
            "הלך": "walking"
        }
    
    def parse_hebrew_exercise(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse Hebrew exercise text for exercise type and details"""
        text = text.strip().lower()
        
        # Try to extract numbers first
        numbers = re.findall(r'\d+', text)
        
        # Find exercise type
        exercise_type = None
        for hebrew_name, english_type in self.exercise_patterns.items():
            if hebrew_name in text:
                exercise_type = english_type
                break
        
        if not exercise_type:
            return None
        
        # Extract details based on numbers found
        result = {
            "exercise": exercise_type,
            "hebrew_name": next(h for h, e in self.exercise_patterns.items() if e == exercise_type),
            "reps": None,
            "sets": 1,
            "weight_kg": None,
            "distance_km": None,
            "duration_seconds": None
        }
        
        # Enhanced number extraction logic for different exercise types
        if numbers:
            # Check if it's a distance-based exercise
            if "מטר" in text or "ק\"מ" in text or "קילומטר" in text:
                distance_value = int(numbers[0])
                
                if "קילומטר" in text or "ק\"מ" in text:
                    # Distance in kilometers
                    result["distance_km"] = distance_value
                elif "מטר" in text:
                    # Distance in meters, convert to km
                    result["distance_km"] = distance_value / 1000.0
                    
                # For distance exercises, reps = 1 (one run/walk)
                result["reps"] = 1
                
            else:
                # Standard rep-based exercise
                if len(numbers) == 1:
                    # Single number - assume it's reps
                    result["reps"] = int(numbers[0])
                elif len(numbers) >= 2:
                    # Multiple numbers - first is usually reps
                    result["reps"] = int(numbers[0])
                    # Check context for weight (look for "קילו", "ק״ג")
                    if "קילו" in text or "ק\"ג" in text or "קג" in text:
                        result["weight_kg"] = int(numbers[1])
        
        return result
    
    def format_exercise_for_api(self, exercise_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format exercise data for backend API"""
        return {
            "name": exercise_data["exercise"].replace("_", " ").title(),
            "name_he": exercise_data["hebrew_name"],
            "reps": exercise_data.get("reps"),
            "sets": exercise_data.get("sets", 1),
            "weight_kg": exercise_data.get("weight_kg"),
            "distance_km": exercise_data.get("distance_km"),
            "duration_seconds": exercise_data.get("duration_seconds")
        }
    
    def save_exercise_to_backend(self, exercise_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save exercise to PostgreSQL via backend API"""
        if not self.token:
            return {"success": False, "error": "No authentication token"}
        
        try:
            response = requests.post(
                f"{self.backend_url}/exercises/log",
                json=exercise_data,
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"API error: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_statistics(self) -> Dict[str, Any]:
        """Get user statistics from PostgreSQL via backend API"""
        if not self.token:
            return {"success": False, "error": "No authentication token"}
        
        try:
            response = requests.get(
                f"{self.backend_url}/exercises/statistics",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                return {"success": True, "data": response.json()}
            else:
                return {"success": False, "error": f"API error: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def chat(self, message: str) -> str:
        """Enhanced chat with exercise persistence and statistics"""
        try:
            # Check if this is a statistics request
            stats_keywords = ["נקודות", "התקדמות", "סטטיסטיקה", "כמה", "סה\"כ", "סהכ", "אימונים"]
            is_stats_request = any(keyword in message.lower() for keyword in stats_keywords)
            
            if is_stats_request:
                # Get real statistics from database
                stats_result = self.get_user_statistics()
                if stats_result["success"]:
                    stats = stats_result["data"]["total_stats"]
                    total_points = stats.get("total_points", 0)
                    total_exercises = stats.get("total_exercises", 0)
                    
                    # Enhance agent prompt with real data
                    enhanced_message = f"""המשתמש שואל: {message}

הנתונים האמיתיים מהמסד נתונים:
- סך הכל נקודות: {total_points}
- סך הכל תרגילים: {total_exercises}

אנא הגב עם הנתונים האלה בעברית."""
                    
                    response = self.agent.run(enhanced_message)
                    return self._extract_response_text(response)
                else:
                    return "לא הצלחתי לקבל את הנתונים מהמסד נתונים כרגע 😔"
            
            # Check if this is an exercise report
            exercise_data = self.parse_hebrew_exercise(message)
            if exercise_data:
                # Save to database
                api_data = self.format_exercise_for_api(exercise_data)
                save_result = self.save_exercise_to_backend(api_data)
                
                if save_result["success"]:
                    points = save_result["data"].get("points_earned", 0)
                    reps = exercise_data.get("reps", 1)
                    exercise_name = exercise_data["hebrew_name"]
                    
                    # Create success message with real points
                    success_message = f"""המשתמש דיווח: {message}

התרגיל נשמר בהצלחה:
- תרגיל: {exercise_name}
- חזרות: {reps}
- נקודות שהוענקו: {points}

אנא הגב בעברית עם אישור קצר ומעודד."""
                    
                    response = self.agent.run(success_message)
                    return self._extract_response_text(response)
                else:
                    return f"זיהיתי את התרגיל {exercise_data['hebrew_name']} אבל לא הצלחתי לשמור במסד הנתונים 😔"
            
            # Regular chat without exercise data
            response = self.agent.run(message)
            return self._extract_response_text(response)
            
        except Exception as e:
            return f"שגיאה בתקשורת עם SweatBot: {str(e)}"
    
    def _extract_response_text(self, response) -> str:
        """Extract text from Phidata response object"""
        if hasattr(response, 'content'):
            return response.content
        elif hasattr(response, 'text'):
            return response.text
        else:
            return str(response)
    
    def test_backend_connection(self) -> Dict[str, Any]:
        """Test connection to backend API"""
        try:
            # Test health endpoint
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            
            if response.status_code == 200:
                # Test authenticated endpoint
                if self.token:
                    auth_response = requests.get(
                        f"{self.backend_url}/api/v1/exercises/statistics",
                        headers={"Authorization": f"Bearer {self.token}"},
                        timeout=5
                    )
                    auth_success = auth_response.status_code == 200
                else:
                    auth_success = False
                
                return {
                    "success": True,
                    "backend_health": True,
                    "authentication": auth_success,
                    "token_available": bool(self.token)
                }
            else:
                return {"success": False, "error": f"Backend health check failed: {response.status_code}"}
                
        except Exception as e:
            return {"success": False, "error": f"Connection failed: {str(e)}"}

# For backward compatibility
PersonalSweatBot = PersonalSweatBotEnhanced

if __name__ == "__main__":
    # Quick test
    bot = PersonalSweatBotEnhanced()
    
    print("🚀 Testing Enhanced PersonalSweatBot")
    print("=" * 40)
    
    # Test backend connection
    conn_test = bot.test_backend_connection()
    print(f"Backend connection: {'✅' if conn_test['success'] else '❌'}")
    if conn_test['success']:
        print(f"  - Health: {'✅' if conn_test['backend_health'] else '❌'}")
        print(f"  - Auth: {'✅' if conn_test['authentication'] else '❌'}")
        print(f"  - Token: {'✅' if conn_test['token_available'] else '❌'}")
    else:
        print(f"  Error: {conn_test['error']}")
    
    # Test exercise parsing
    print("\n🧠 Testing exercise parsing:")
    test_exercises = [
        "עשיתי 20 סקוואטים",
        "עשיתי 15 שכיבות סמיכה", 
        "רצתי 5 קילומטר"
    ]
    
    for exercise in test_exercises:
        parsed = bot.parse_hebrew_exercise(exercise)
        if parsed:
            print(f"  ✅ '{exercise}' → {parsed['exercise']} ({parsed.get('reps', 'N/A')} reps)")
        else:
            print(f"  ❌ '{exercise}' → Not recognized")
    
    print("\n🤖 Enhanced PersonalSweatBot ready!")