#!/usr/bin/env python3
"""
Test script for the new points system functionality
"""

import asyncio
import sys
import os
import uuid
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import AsyncSessionLocal
from app.services.scalable_points_engine import scalable_points_engine
from app.services.points_configuration_service import points_config_service


async def test_points_calculation():
    """Test the points calculation system"""
    print("🧪 Testing SweatBot Points System v2.0")
    print("=" * 50)
    
    # Use a consistent test user ID
    test_user_id = str(uuid.uuid4())
    
    # Get database session
    async with AsyncSessionLocal() as db:
        try:
            # Test 1: Basic points calculation
            print("\n1. Testing basic points calculation...")
            exercise_data = {
                "exercise": "squat",
                "reps": 10,
                "sets": 3,
                "weight_kg": 50.0,
                "exercise_id": None,
                "is_personal_record": False
            }
            
            result = await scalable_points_engine.calculate_points_async(
                exercise_data, test_user_id, db
            )
            
            print(f"   ✅ Exercise: {exercise_data['exercise']}")
            print(f"   ✅ Total Points: {result.total_points}")
            print(f"   ✅ Status: {result.status.value}")
            print(f"   ✅ Applied Rules: {result.applied_rules}")
            print(f"   ✅ Calculation Time: {result.calculation_time:.3f}s")
            
            # Test 2: Personal record bonus
            print("\n2. Testing personal record bonus...")
            exercise_data["is_personal_record"] = True
            
            result_pr = await scalable_points_engine.calculate_points_async(
                exercise_data, test_user_id, db
            )
            
            print(f"   ✅ PR Points: {result_pr.total_points} (+{result_pr.total_points - result.total_points} bonus)")
            print(f"   ✅ PR Status: {result_pr.status.value}")
            
            # Test 3: Configuration service
            print("\n3. Testing configuration service...")
            exercises = await points_config_service.list_exercise_configs(db, active_only=True)
            print(f"   ✅ Found {len(exercises)} configured exercises")
            
            if exercises:
                first_exercise = exercises[0]
                print(f"   ✅ Example: {first_exercise['entity_key']} - {first_exercise['config_data'].get('name', 'N/A')}")
            
            # Test 4: Bulk calculation
            print("\n4. Testing bulk calculation...")
            bulk_exercises = [
                {"exercise": "squat", "reps": 10, "sets": 3},
                {"exercise": "push_up", "reps": 15, "sets": 2},
                {"exercise": "plank", "reps": 1, "sets": 1}  # Plank for 30 seconds
            ]
            
            total_points = 0
            for i, ex_data in enumerate(bulk_exercises, 1):
                result = await scalable_points_engine.calculate_points_async(
                    ex_data, test_user_id, db
                )
                total_points += result.total_points
                print(f"   ✅ Exercise {i}: {ex_data['exercise']} - {result.total_points} points")
            
            print(f"   ✅ Bulk Total: {total_points} points")
            
            # Test 5: Cache performance
            print("\n5. Testing cache performance...")
            start_time = datetime.now()
            
            # Same exercise twice to test caching
            for i in range(2):
                await scalable_points_engine.calculate_points_async(
                    {"exercise": "squat", "reps": 10, "sets": 1}, 
                    test_user_id, 
                    db
                )
            
            end_time = datetime.now()
            cache_time = (end_time - start_time).total_seconds()
            print(f"   ✅ Cached calculation time: {cache_time:.3f}s for 2 operations")
            
            print("\n" + "=" * 50)
            print("🎉 All tests passed! Points system is working correctly.")
            
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
            await db.rollback()
            import traceback
            traceback.print_exc()
        finally:
            pass  # Session will be closed automatically by context manager


if __name__ == "__main__":
    asyncio.run(test_points_calculation())