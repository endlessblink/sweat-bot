"""
Personal SweatBot with Intelligent Tool System
Natural language understanding with specialized tools for Hebrew fitness tracking
"""

from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.model.google import Gemini
from phi.model.groq import Groq
import sys
import os
sys.path.append(os.path.dirname(__file__))

from mongodb_memory import MongoDBMemory
from tools import (
    ExerciseLoggerTool,
    StatisticsRetrieverTool, 
    DataManagerTool,
    GoalSetterTool,
    ProgressAnalyzerTool,
    WorkoutSuggesterTool
)
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class PersonalSweatBotWithTools:
    """
    Advanced Personal SweatBot with intelligent natural language understanding
    Uses specialized tools that the AI automatically selects based on user intent
    """
    
    def __init__(self):
        # Initialize all specialized tools
        self.tools = [
            ExerciseLoggerTool(),        # For logging exercises
            StatisticsRetrieverTool(),   # For getting stats and progress
            DataManagerTool(),           # For reset and data management
            GoalSetterTool(),            # For setting fitness goals
            ProgressAnalyzerTool(),      # For analyzing trends
            WorkoutSuggesterTool()       # For workout suggestions
        ]
        
        # Initialize the AI agent with tools
        self.agent = self._init_agent_with_tools()
    
    def _init_agent_with_tools(self) -> Agent:
        """Initialize Phidata agent with model selection and tools"""
        
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
            raise ValueError("No AI API key found. Please set GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY")
        
        return Agent(
            name="SweatBot-Advanced",
            model=model,
            tools=self.tools,
            instructions=self._get_intelligent_instructions(),
            memory=MongoDBMemory(user_id="personal"),
            show_tool_calls=False,  # Clean output for users
            markdown=False,  # Use plain text for Hebrew
            debug_mode=False
        )
    
    def _get_intelligent_instructions(self) -> str:
        """Advanced instructions for intelligent tool selection"""
        return """
        אתה SweatBot, המאמן הכושר האישי החכם שלי בעברית.
        
        🧠 יכולות חכמות שלך:
        • אתה מבין כוונות בשפה טבעית בעברית ובאנגלית
        • אתה בוחר את הכלי הנכון באופן אוטומטי
        • אין צורך בפקודות מיוחדות - אתה מבין מה אני רוצה
        
        🛠️ הכלים שברשותך:
        1. ExerciseLoggerTool - לרישום תרגילים מכל סוג דיבור טבעי
        2. StatisticsRetrieverTool - לקבלת נקודות, סטטיסטיקות, והתקדמות
        3. DataManagerTool - לאיפוס נתונים וניהול (עם אישור)
        4. GoalSetterTool - לקביעת יעדים והתעדף כושר
        5. ProgressAnalyzerTool - לניתוח מגמות ותובנות
        6. WorkoutSuggesterTool - להצעות אימונים מותאמות אישית
        
        🎯 איך להשתמש בכלים:
        • כשאני מדווח על תרגיל (כמו "עשיתי 20 סקוואטים") → השתמש ב-ExerciseLoggerTool
        • כשאני שואל על נקודות או התקדמות → השתמש ב-StatisticsRetrieverTool  
        • כשאני רוצה לאפס או למחוק נתונים → השתמש ב-DataManagerTool
        • כשאני קובע יעדים או שואל על יעדים → השתמש ב-GoalSetterTool
        • כשאני רוצה ניתוח או תובנות → השתמש ב-ProgressAnalyzerTool
        • כשאני שואל מה לעשות או רוצה הצעות → השתمש ב-WorkoutSuggesterTool
        
        🗨️ דוגמאות לשפה טבעית שאתה צריך להבין:
        
        רישום תרגילים:
        - "רצתי 5 קילומטר" 
        - "עשיתי אימון רגליים"
        - "סיימתי 30 שכיבות סמיכה"
        - "I did 20 squats"
        
        בקשת סטטיסטיקות:
        - "כמה נקודות יש לי?"
        - "מה ההתקדמות שלי?"
        - "Show me my progress"
        - "תראה לי את הסטטיסטיקות"
        
        ניהול נתונים:
        - "אפס את הנקודות שלי"
        - "אני רוצה להתחיל מחדש"
        - "Delete my data"
        - "Clear everything"
        
        יעדים:
        - "אני רוצה להגיע ל-100 נקודות השבוע"
        - "קבע לי יעד של 50 סקוואטים"
        - "Set a goal for me"
        
        הצעות אימון:
        - "מה לעשות היום?"
        - "תציע לי אימון"
        - "What should I do next?"
        - "אני מתחיל, מה מומלץ?"
        
        🔍 חשוב:
        • תמיד תענה בעברית (אלא אם המשתמש מבקש אחרת)
        • תהיה חיובי ומעודד
        • תשתמש בכלי המתאים בהתבסס על הכוונה, לא על מילים מסוימות
        • אל תבקש מהמשתמש לזכור פקודות - תבין מה הוא רוצה
        • תן תגובות קצרות ומדויקות
        
        זכור: אתה מאמן חכם שמבין כוונות, לא מחשב שצריך פקודות!
        """
    
    def chat(self, message: str) -> str:
        """
        Process user message with intelligent tool selection
        
        Args:
            message: User's natural language message
            
        Returns:
            AI response after using appropriate tools
        """
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
    
    def get_available_tools(self) -> str:
        """Get description of available tools"""
        return """
        🛠️ הכלים הזמינים ב-SweatBot החכם:
        
        💪 רישום תרגילים - מבין כל דיבור טבעי על פעילות גופנית
        📊 סטטיסטיקות - מציג נקודות, התקדמות, ונתונים מפורטים
        🔄 ניהול נתונים - איפוס ומחיקת נתונים (בבטחה)
        🎯 יעדים - קביעה ומעקב אחר יעדי כושר
        📈 ניתוח התקדמות - תובנות ומגמות על הביצועים
        🏋️ הצעות אימון - תוכניות אימון מותאמות אישית
        
        פשוט דבר איתי טבעי - אני אבין מה אתה רוצה! 🧠
        """


# For backward compatibility and testing
PersonalSweatBot = PersonalSweatBotWithTools


def test_tool_based_agent():
    """Test the new tool-based SweatBot"""
    print("🧪 Testing Tool-Based SweatBot")
    print("=" * 40)
    
    try:
        bot = PersonalSweatBotWithTools()
        print("✅ Bot initialized with tools")
        
        # Test different types of natural language input
        test_messages = [
            "היי SweatBot!",
            "עשיתי 15 סקוואטים",  # Should use ExerciseLoggerTool
            "כמה נקודות יש לי?",    # Should use StatisticsRetrieverTool
            "מה לעשות היום?",       # Should use WorkoutSuggesterTool
            "I want to reset my data" # Should use DataManagerTool
        ]
        
        for message in test_messages:
            print(f"\n📝 Test: {message}")
            response = bot.chat(message)
            print(f"🤖 Response: {response[:100]}...")
        
        print("\n✅ Tool-based system working!")
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_tool_based_agent()