#!/usr/bin/env python3
"""
Test script for the improved workout variety system
Tests varied exercise generation and Hebrew grammar fixes
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.workout_variety_service import WorkoutVarietyService
from app.services.hebrew_model_manager import HebrewModelManager

async def test_workout_variety():
    """Test the workout variety service with multiple scenarios"""
    
    print("🧪 Testing Workout Variety Service")
    print("=" * 50)
    
    # Initialize the service
    variety_service = WorkoutVarietyService()
    
    # Test 1: 5-minute break workout
    print("\n📋 Test 1: 5-minute break workout")
    workout_5min = variety_service.get_varied_break_workout(5)
    print(f"✅ Generated: {workout_5min['workout_plan'][:100]}...")
    
    # Test 2: 10-minute workout
    print("\n📋 Test 2: 10-minute workout")
    workout_10min = variety_service.get_varied_break_workout(10)
    print(f"✅ Generated: {workout_10min['workout_plan'][:100]}...")
    
    # Test 3: Multiple 5-minute workouts (should be different)
    print("\n📋 Test 3: Multiple 5-minute workouts (checking for variety)")
    workouts = []
    for i in range(3):
        workout = variety_service.get_varied_break_workout(5)
        workouts.append(workout)
        exercises = [ex['exercise'] for ex in workout['exercises']]
        print(f"Workout {i+1}: {', '.join(exercises)}")
    
    # Check for variety
    all_exercises = set()
    for workout in workouts:
        for ex in workout['exercises']:
            all_exercises.add(ex['exercise'])
    
    print(f"✅ Total unique exercises across 3 workouts: {len(all_exercises)}")
    
    # Test 4: Hebrew grammar validation
    print("\n📋 Test 4: Hebrew grammar validation")
    test_texts = [
        "תן לי רעיונות ל5 תרגילים",
        "תרגיל להפסקה של 5 דק'",
        "מה לעשות בהפסקה"
    ]
    
    for text in test_texts:
        corrected, corrections = variety_service.validate_hebrew_grammar(text)
        print(f"Original: {text}")
        if corrections:
            print(f"Corrected: {corrected}")
            print(f"Corrections: {corrections}")
        else:
            print("✅ No corrections needed")
        print()
    
    # Test 5: Model manager integration
    print("\n📋 Test 5: Model manager integration")
    try:
        model_manager = HebrewModelManager()
        
        # Test break request detection
        test_requests = [
            "תן לי רעיונות ל5 תרגילים להפסקה",
            "מה לעשות בהפסקה של 5 דקות",
            "אימון קצר למשרד",
            "רציתי לתעד סקוואטים"  # This should not be detected as break request
        ]
        
        for request in test_requests:
            is_break = model_manager.is_workout_break_request(request)
            duration = model_manager.extract_break_duration(request)
            print(f"'{request}' -> Break: {is_break}, Duration: {duration} min")
        
        print("✅ Model manager integration working")
        
    except Exception as e:
        print(f"❌ Model manager test failed: {e}")
    
    # Test 6: Exercise variety statistics
    print("\n📋 Test 6: Exercise variety statistics")
    stats = variety_service.get_exercise_variety_stats()
    print(f"Available exercises: {stats['total_exercises_available']}")
    print(f"Categories: {stats['categories_count']}")
    print(f"Recent unique exercises: {stats['recent_unique_exercises']}")
    
    print("\n🎉 All tests completed!")
    print("=" * 50)

async def test_grammar_fixes():
    """Test Hebrew grammar fixes for common mistakes"""
    
    print("\n🔧 Testing Hebrew Grammar Fixes")
    print("=" * 50)
    
    variety_service = WorkoutVarietyService()
    
    # Test common mistakes
    mistake_examples = [
        "תן לי תרגיל",
        "תרגילי סקוואטים",
        "תעשה סקוואטים",
        "תן לי רעיון לאימון"
    ]
    
    for mistake in mistake_examples:
        corrected, corrections = variety_service.validate_hebrew_grammar(mistake)
        print(f"❌ Original: {mistake}")
        if corrections:
            print(f"✅ Corrected: {corrected}")
            print(f"📝 Fixes: {', '.join(corrections)}")
        else:
            print("✅ Already correct")
        print()

if __name__ == "__main__":
    asyncio.run(test_workout_variety())
    asyncio.run(test_grammar_fixes())