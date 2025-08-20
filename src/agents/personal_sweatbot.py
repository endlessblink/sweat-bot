"""
Personal SweatBot Agent - Optimized for Your Fitness Experience
Uses Phidata for reliable, consistent Hebrew fitness coaching
"""

from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.model.google import Gemini
from phi.model.groq import Groq
from phi.memory.agent import AgentMemory
from typing import Optional
import os
import sys
from dotenv import load_dotenv

# Use existing Hebrew infrastructure
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend', 'app', 'services'))
try:
    from hebrew_model_manager import HebrewModelManager
    HEBREW_MANAGER_AVAILABLE = True
except ImportError:
    HEBREW_MANAGER_AVAILABLE = False

# Load environment variables
load_dotenv()

class PersonalSweatBot:
    """Your personal Hebrew fitness AI coach"""
    
    def __init__(self):
        # Initialize Hebrew model manager for comprehensive Hebrew support
        self.hebrew_manager = None
        if HEBREW_MANAGER_AVAILABLE:
            self.hebrew_manager = HebrewModelManager()
        
        # Your personal preferences (customize these based on what you want)
        # Check which API key is available and use the appropriate model
        # Priority: Groq (fast + reliable) > OpenAI > Gemini (quota limited)
        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
        
        if groq_key:
            model = Groq(
                id="llama3-70b-8192",  # Current supported model with Hebrew support
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
                id="gemini-1.5-flash",  # Better quota limits than pro
                temperature=0.3,
                api_key=gemini_key
            )
        else:
            raise ValueError("No API key found. Please set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in your .env file")
        
        self.agent = Agent(
            name="SweatBot-Personal",
            model=model,
            instructions=self._get_personal_instructions(),
            memory=AgentMemory(),  # Remember your workout history and preferences
            show_tool_calls=True,  # Debug mode to see what's happening
            markdown=True,  # Better formatted responses
            debug_mode=True  # Helpful during development
        )
    
    def _get_personal_instructions(self) -> str:
        """Your personalized coaching instructions"""
        return """
        אתה SweatBot, המאמן הכושר האישי שלי בעברית.
        
        הנחיות אישיות:
        • תמיד תענה בעברית
        • תהיה חיובי ומעודד אבל לא מגזים
        • תזכור את האימונים הקודמים שלי
        • תעזור לי לעקוב אחרי התקדמות
        • תיתן טיפים מעשיים לשיפור
        • תחשב נקודות על התרגילים שאני עושה
        
        כשאני מדווח על תרגיל:
        1. אשר קבלת המידע
        2. חשב כמה נקודות זה שווה
        3. תן עצה קצרה ומעשית
        4. שאל אם אני רוצה לדווח על משהו נוסף
        
        דוגמאות לתגובות טובות:
        "מעולה! 20 סקוואטים = 30 נקודות 💪
        טיפ: שמור על הגב ישר וירד עמוק.
        מה עוד עשית היום?"
        """
    
    def chat(self, message: str) -> str:
        """Send message to your personal SweatBot"""
        try:
            response = self.agent.run(message)
            # Extract content from RunResponse object
            if hasattr(response, 'content'):
                return response.content
            elif hasattr(response, 'text'):
                return response.text
            else:
                return str(response)
        except Exception as e:
            return f"שגיאה בתקשורת עם SweatBot: {str(e)}"
    
    def chat_with_history(self, message: str, history: list) -> str:
        """Send message to SweatBot with conversation history for context"""
        try:
            # Build context from conversation history
            context_messages = []
            for msg in history:
                if msg.get('role') == 'user':
                    context_messages.append(f"User: {msg.get('content', '')}")
                elif msg.get('role') == 'assistant':
                    context_messages.append(f"SweatBot: {msg.get('content', '')}")
            
            # Create message with history context
            if context_messages:
                context_text = "Previous conversation:\n" + "\n".join(context_messages[-6:])  # Last 6 messages
                full_message = f"{context_text}\n\nCurrent message: {message}"
            else:
                full_message = message
            
            # Send to agent with full context
            response = self.agent.run(full_message)
            
            # Extract content from RunResponse object
            if hasattr(response, 'content'):
                return response.content
            elif hasattr(response, 'text'):
                return response.text
            else:
                return str(response)
                
        except Exception as e:
            return f"שגיאה בתקשורת עם SweatBot: {str(e)}"
    
    async def process_exercise(self, exercise_text: str) -> dict:
        """Process exercise input using existing Hebrew infrastructure"""
        try:
            if self.hebrew_manager:
                # Use the existing Hebrew parser
                parsed_data = await self.hebrew_manager.parse_exercise_command(exercise_text)
            else:
                # Fallback to simple parsing
                parsed_data = self._simple_exercise_parse(exercise_text)
            
            # Get agent response
            response = self.agent.run(f"המשתמש אמר: {exercise_text}")
            
            # Extract content from RunResponse object
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            return {
                "exercise": exercise_text,
                "parsed_data": parsed_data,
                "response": response_text,
                "success": True
            }
            
        except Exception as e:
            return {
                "exercise": exercise_text,
                "response": f"לא הצלחתי לעבד את התרגיל: {str(e)}",
                "success": False
            }
    
    async def process_audio(self, audio_data: bytes) -> dict:
        """Process voice input using existing Hebrew Whisper"""
        if not self.hebrew_manager:
            return {"error": "Hebrew manager not available", "text": ""}
        
        try:
            # Use existing Hebrew Whisper model
            result = await self.hebrew_manager.process_audio(audio_data, language="he")
            
            # If we got text, process it as exercise
            if result.get("text"):
                exercise_result = await self.process_exercise(result["text"])
                result.update(exercise_result)
            
            return result
            
        except Exception as e:
            return {"error": str(e), "text": ""}
    
    def _simple_exercise_parse(self, text: str) -> dict:
        """Simple exercise parsing fallback"""
        import re
        
        # Basic exercise patterns
        exercises = {
            "סקוואט": "squat",
            "שכיבות": "pushup", 
            "בורפי": "burpee",
            "מתח": "pullup"
        }
        
        result = {}
        
        # Find exercise
        for hebrew, english in exercises.items():
            if hebrew in text.lower():
                result["exercise"] = english
                result["exercise_he"] = hebrew
                break
        
        # Extract numbers
        numbers = re.findall(r'\d+', text)
        if numbers:
            result["count"] = int(numbers[0])
        
        return result

# Quick test function
def test_personal_agent():
    """Test your personal SweatBot"""
    print("🏋️ Testing Personal SweatBot...")
    
    sweatbot = PersonalSweatBot()
    
    # Test basic chat
    response1 = sweatbot.chat("שלום SweatBot!")
    print(f"Response 1: {response1}")
    
    # Test exercise reporting
    response2 = sweatbot.chat("עשיתי 20 סקוואטים")
    print(f"Response 2: {response2}")
    
    # Test follow-up
    response3 = sweatbot.chat("איך אני מתקדם?")
    print(f"Response 3: {response3}")

if __name__ == "__main__":
    test_personal_agent()