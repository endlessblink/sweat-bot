#!/usr/bin/env python3
"""
Test script to verify exercise variety after refactoring
"""

import requests
import json
import time
import asyncio
from websockets import connect

async def test_exercise_variety():
    """Test if the AI suggests varied exercises instead of the same 4"""
    
    print("🧪 Testing Exercise Variety After Refactoring")
    print("=" * 50)
    
    # Connect to WebSocket
    uri = "ws://localhost:8000/ws"
    
    try:
        async with connect(uri) as websocket:
            print("✅ Connected to SweatBot WebSocket")
            
            # Send multiple workout requests to test variety
            workout_requests = [
                "תן לי אימון קצר של 5 דקות",
                "מה אפשר לעשות בהפסקה של 5 דקות?",
                "תן לי תרגילים להפסקה קצרה",
                "אימון מהיר של 5 דקות",
                "תרגילים לזמן קצר"
            ]
            
            responses = []
            
            for i, request in enumerate(workout_requests):
                print(f"\n📝 Request {i+1}: {request}")
                
                # Send message
                await websocket.send(json.dumps({
                    "type": "chat_message",
                    "message": request,
                    "session_id": f"test-variety-{i}"
                }))
                
                # Receive response
                response = await websocket.recv()
                data = json.loads(response)
                
                if data.get("type") == "chat_response":
                    ai_response = data.get("content", "")
                    responses.append(ai_response)
                    print(f"🤖 Response {i+1}: {ai_response[:100]}...")
                
                # Small delay between requests
                await asyncio.sleep(1)
            
            # Analyze variety
            print("\n" + "=" * 50)
            print("📊 VARIETY ANALYSIS")
            print("=" * 50)
            
            # Count exercise mentions
            exercise_counts = {}
            exercises_seen = set()
            
            for i, response in enumerate(responses):
                print(f"\nResponse {i+1} exercises:")
                
                # Look for common exercise patterns
                common_exercises = [
                    "סקוואטים", "ג'אמפינג ג'קס", "פלנק", "שכיבות סמיכה",
                    "לאנג'ים", "ברפי", "קפיצות כוכבים", "הרמות ברכיים",
                    "שכיבות צד", "ריצה במקום", "הליכה מהירה", "טלטולים",
                    "כפיפות בטן", "סיבובי רוסי", "הרמות רגליים", "מתיחות דינמית"
                ]
                
                found_in_response = []
                for exercise in common_exercises:
                    if exercise in response:
                        found_in_response.append(exercise)
                        exercises_seen.add(exercise)
                        exercise_counts[exercise] = exercise_counts.get(exercise, 0) + 1
                
                print(f"  Found: {', '.join(found_in_response) if found_in_response else 'No recognized exercises'}")
            
            # Results
            print(f"\n🎯 RESULTS:")
            print(f"  Total unique exercises suggested: {len(exercises_seen)}")
            print(f"  Exercises seen: {', '.join(sorted(exercises_seen))}")
            
            # Check for the old hardcoded pattern
            hardcoded_pattern = {"סקוואטים", "ג'אמפינג ג'קס", "פלנק", "שכיבות סמיכה"}
            only_hardcoded = exercises_seen.issubset(hardcoded_pattern) and len(exercises_seen) <= 4
            
            if only_hardcoded:
                print("❌ FAILED: Still suggesting only the original 4 hardcoded exercises")
                print("   The refactoring may not have taken effect properly")
            else:
                print("✅ SUCCESS: Found varied exercises beyond the original 4!")
                print("   The refactoring appears to be working")
            
            # Check repetition
            if exercise_counts:
                most_common = max(exercise_counts.values())
                if most_common >= 3:
                    print(f"⚠️  WARNING: Some exercises repeated {most_common} times")
                else:
                    print("✅ Good variety: No exercise repeated too often")
            
            return len(exercises_seen) > 4
            
    except Exception as e:
        print(f"❌ Error testing variety: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_exercise_variety())
    print(f"\n🏁 Test {'PASSED' if result else 'FAILED'}")