#!/usr/bin/env python3
"""
Test the enhanced weight tracking functionality
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from core.enhanced_exercise_tracker_fixed import EnhancedExerciseTracker

def test_weight_tracking():
    """Test various weight tracking scenarios"""
    print("🧪 Testing Enhanced Exercise Tracker\n")
    
    # Initialize tracker
    tracker = EnhancedExerciseTracker(":memory:")  # Use in-memory DB for testing
    
    # Test cases
    test_cases = [
        # Basic weight exercises
        ("עשיתי בק סקווט 50 קילו", "Back squat with 50kg"),
        ("עשיתי בק סקווט 60 קילו 5 חזרות", "Back squat 60kg for 5 reps"),
        ("עשיתי דדליפט 80 קג 3 חזרות", "Deadlift 80kg for 3 reps"),
        ("עשיתי דדליפט 100 קילו 3 חזרות 3 סטים", "Deadlift 100kg, 3 reps, 3 sets"),
        
        # Other exercises
        ("עשיתי לחיצת כתפיים 40 קילו", "Shoulder press 40kg"),
        ("עשיתי סנאץ' 50 קילו", "Snatch 50kg"),
        ("עשיתי קלין אנד ג'רק 70 קילו", "Clean and jerk 70kg"),
        
        # Bodyweight exercises
        ("עשיתי 20 שכיבות סמיכה", "20 push-ups"),
        ("עשיתי 15 משיכות", "15 pull-ups"),
        
        # Edge cases
        ("עשיתי פרונט סקווט 45.5 קילו", "Front squat 45.5kg"),
        ("עשיתי בק סקווט 100 ק\"ג", "Back squat 100kg (different unit format)"),
    ]
    
    print("📝 Testing exercise parsing:\n")
    
    for hebrew_input, description in test_cases:
        print(f"Input: {hebrew_input}")
        print(f"Expected: {description}")
        
        result = tracker.add_exercise_from_text(hebrew_input)
        
        if result:
            parsed = result['parsed']
            print(f"✅ Parsed successfully:")
            print(f"   Exercise: {parsed['exercise_he']} ({parsed['exercise']})")
            print(f"   Weight: {parsed.get('weight', 'N/A')} kg")
            print(f"   Reps: {parsed['reps']}")
            print(f"   Sets: {parsed['sets']}")
            
            # Check for PR
            if result.get('pr_info'):
                pr = result['pr_info']
                print(f"   🎉 NEW PR! {pr['new_value']}kg (previous: {pr['previous_value']}kg)")
            
            # Generate AI response
            response = tracker.generate_ai_response(result)
            print(f"   AI Response: {response}")
        else:
            print(f"❌ Failed to parse")
        
        print("-" * 50)
    
    # Test PR progression
    print("\n🏆 Testing Personal Records:\n")
    
    # Simulate PR progression
    pr_tests = [
        "עשיתי בק סקווט 40 קילו",
        "עשיתי בק סקווט 45 קילו",
        "עשיתי בק סקווט 50 קילו",  # Should be a PR
        "עשיתי בק סקווט 45 קילו",  # Not a PR
        "עשיתי בק סקווט 55 קילו",  # New PR!
    ]
    
    for test in pr_tests:
        result = tracker.add_exercise_from_text(test)
        if result:
            print(f"Input: {test}")
            if result.get('pr_info'):
                pr = result['pr_info']
                print(f"🎉 NEW PR! {pr['new_value']}kg (improvement: +{pr['improvement']}kg)")
            else:
                parsed = result['parsed']
                print(f"   Recorded: {parsed['weight']}kg (not a PR)")
    
    # Test getting max info
    print("\n📊 Testing Max Retrieval:\n")
    
    max_info = tracker.get_exercise_max("בק סקווט")
    print(f"Back Squat Max: {max_info['current_max']['weight']}kg")
    print(f"Recent history: {len(max_info['recent_history'])} entries")
    
    # Test progress report
    print("\n📈 Testing Progress Report:\n")
    
    progress = tracker.get_progress_report("בק סקווט", days=30)
    print(f"Workouts in last 30 days: {progress['workout_count']}")
    print(f"Weight change: {progress['trends']['weight_change']:+.1f}kg")
    print(f"Percentage change: {progress['trends']['weight_change_pct']:+.1f}%")


def test_edge_cases():
    """Test edge cases and error handling"""
    print("\n🔍 Testing Edge Cases:\n")
    
    tracker = EnhancedExerciseTracker(":memory:")
    
    edge_cases = [
        # Questions (should not be recorded)
        "כמה עשיתי בק סקווט?",
        "מה השיא שלי בדדליפט?",
        
        # Non-exercise statements
        "אני עייף היום",
        "הגב כואב לי",
        
        # Malformed inputs
        "בק סקווט קילו",  # Missing number
        "עשיתי קילו 50",  # Wrong order
        "50 50 50",  # Just numbers
    ]
    
    for test in edge_cases:
        print(f"Testing: {test}")
        result = tracker.add_exercise_from_text(test)
        if result:
            print(f"  ⚠️  Unexpectedly parsed: {result['parsed']}")
        else:
            print(f"  ✅ Correctly rejected")


if __name__ == "__main__":
    print("=" * 60)
    print("Hebrew CrossFit AI - Enhanced Weight Tracking Tests")
    print("=" * 60)
    
    test_weight_tracking()
    test_edge_cases()
    
    print("\n✅ All tests completed!")
    print("\nKey features tested:")
    print("- Weight parsing in Hebrew")
    print("- Personal record tracking")
    print("- Progress monitoring")
    print("- AI response generation")
    print("- Edge case handling")