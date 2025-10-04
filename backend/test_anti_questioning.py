#!/usr/bin/env python3
"""
Test script to verify anti-questioning system is working
Tests that the AI gives short responses without excessive questions
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

import logging
from app.services.hebrew_model_manager import HebrewModelManager
from app.services.user_context_manager import user_context_manager

# Set up logging to see debug messages
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_anti_questioning():
    """Test that the system gives short responses without questions"""
    
    print("\n" + "="*60)
    print("🧪 TESTING ANTI-QUESTIONING SYSTEM")
    print("="*60)
    
    # Initialize services
    model_manager = HebrewModelManager()
    await user_context_manager.initialize()
    
    # Create test context for user Noam
    test_context = {
        "user_id": "test-noam-123",
        "username": "noam",
        "preferred_language": "he",
        "user_context": {
            "onboarding": {
                "completed": True,
                "skip_reason": "auto_configured_for_noam"
            },
            "fitness_profile": {
                "fitness_level": "intermediate",
                "communication_style": "concise"
            },
            "coaching_preferences": {
                "avoid_excessive_questions": True,
                "prefer_quick_confirmations": True,
                "auto_log_exercises": True,
                "celebration_style": "concise"
            },
            "total_exercises": 50,
            "total_points": 1000,
            "today_exercises": 3,
            "today_points": 60
        }
    }
    
    # Test messages
    test_messages = [
        "היי, מה שלומך?",
        "בוא אוכל לציור לך היום?",
        "עשיתי 20 סקוואטים",
        "רוצה להתחיל להתאמן"
    ]
    
    print("\n📝 Test Messages:")
    for i, msg in enumerate(test_messages, 1):
        print(f"  {i}. {msg}")
    
    print("\n" + "-"*60)
    
    for message in test_messages:
        print(f"\n🔹 USER: {message}")
        
        # Generate response
        response_data = await model_manager.generate_chat_response(
            message=message,
            model="gemini-1.5-flash",
            context=test_context,
            user_id="test-noam-123"
        )
        
        if response_data:
            response = response_data.get("response", "No response")
            print(f"🤖 AI: {response}")
            
            # Count questions in response
            question_count = response.count('?')
            print(f"📊 Analysis: {question_count} questions, {len(response)} chars")
            
            if question_count > 1:
                print("❌ FAIL: Too many questions!")
            elif len(response) > 200:
                print("⚠️ WARNING: Response might be too long")
            else:
                print("✅ PASS: Short response with minimal questions")
        else:
            print("❌ ERROR: No response received")
    
    print("\n" + "="*60)
    print("🏁 TEST COMPLETE")
    print("="*60)

if __name__ == "__main__":
    # Check for API key
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ ERROR: GEMINI_API_KEY not set in environment")
        print("Please set: export GEMINI_API_KEY='your-api-key'")
        sys.exit(1)
    
    # Run the test
    asyncio.run(test_anti_questioning())