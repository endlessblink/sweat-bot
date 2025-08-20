#!/usr/bin/env python3
"""
Personal SweatBot - Your Hebrew Fitness AI Coach
Simplified entry point for personal use with Phidata + existing Hebrew infrastructure
"""

import asyncio
import sys
import os
from pathlib import Path

# Add paths for imports
sys.path.append(str(Path(__file__).parent / "src" / "agents"))
sys.path.append(str(Path(__file__).parent / "backend" / "app" / "services"))

from personal_sweatbot import PersonalSweatBot, test_personal_agent

class PersonalSweatBotApp:
    """Personal SweatBot Application"""
    
    def __init__(self):
        self.sweatbot = PersonalSweatBot()
        print("🏋️ Personal SweatBot initialized!")
        print("Available commands:")
        print("  - chat: Regular conversation") 
        print("  - exercise: Log an exercise")
        print("  - stats: View your progress")
        print("  - quit: Exit")
    
    def run_interactive(self):
        """Run interactive chat session"""
        print("\n💬 Starting interactive chat with your personal SweatBot...")
        print("Type 'quit' to exit\n")
        
        while True:
            try:
                user_input = input("You: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'bye']:
                    print("🏋️ Keep up the great work! See you next time!")
                    break
                
                if not user_input:
                    continue
                
                # Process with SweatBot
                if user_input.startswith('/exercise '):
                    exercise_text = user_input[10:]  # Remove '/exercise ' prefix
                    result = asyncio.run(self.sweatbot.process_exercise(exercise_text))
                    
                    if result['success']:
                        print(f"SweatBot: {result['response']}")
                        if result.get('parsed_data'):
                            parsed = result['parsed_data']
                            if parsed.get('exercise'):
                                print(f"📊 Detected: {parsed.get('exercise_he', parsed['exercise'])}")
                                if parsed.get('count'):
                                    print(f"🔢 Count: {parsed['count']}")
                    else:
                        print(f"❌ Error: {result['response']}")
                else:
                    # Regular chat
                    response = self.sweatbot.chat(user_input)
                    print(f"SweatBot: {response}")
                
            except KeyboardInterrupt:
                print("\n\n🏋️ Keep up the great work! See you next time!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def demo_exercise_logging(self):
        """Demonstrate exercise logging"""
        print("\n🏋️ Exercise Logging Demo")
        print("=" * 40)
        
        demo_exercises = [
            "עשיתי 20 סקוואטים",
            "ביצעתי 15 שכיבות סמיכה", 
            "10 מתח",
            "פלנק 30 שניות"
        ]
        
        for exercise in demo_exercises:
            print(f"\n> {exercise}")
            try:
                result = asyncio.run(self.sweatbot.process_exercise(exercise))
                if result['success']:
                    print(f"SweatBot: {result['response']}")
                else:
                    print(f"❌ {result['response']}")
            except Exception as e:
                print(f"❌ Error: {e}")

def main():
    """Main entry point"""
    print("🏋️ Welcome to Personal SweatBot!")
    print("Your Hebrew Fitness AI Coach")
    print("=" * 50)
    
    # Test basic functionality first
    print("\n🧪 Testing basic functionality...")
    test_personal_agent()
    
    app = PersonalSweatBotApp()
    
    while True:
        print("\nWhat would you like to do?")
        print("1. Interactive chat")
        print("2. Exercise logging demo")
        print("3. Quit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == '1':
            app.run_interactive()
        elif choice == '2':
            app.demo_exercise_logging()
        elif choice == '3':
            print("🏋️ Keep up the great work! Goodbye!")
            break
        else:
            print("Please enter 1, 2, or 3")

if __name__ == "__main__":
    main()