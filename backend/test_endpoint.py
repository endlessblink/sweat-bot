"""
Quick test script for POST /v1/activities endpoint
"""

import asyncio
import sys
sys.path.insert(0, '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/backend')

from app.services.points_v4.engine import PointsEngine


async def test_squat_calculation():
    """Test squat calculation directly"""
    print("Testing squat calculation...")

    result = await PointsEngine.calculate_activity_points(
        user_id="891b240b-9a87-4ae3-923e-31609ea7a5e9",
        exercise_key="squat",
        activity_data={
            "sets": 3,
            "reps": [10, 10, 10],
            "weights": [50.0, 50.0, 50.0],
            "rpe": [7, 8, 9]
        },
        user_context={
            "streak_days": 0,
            "exercises_today": [],
            "active_challenges": []
        }
    )

    print(f"\n✅ SUCCESS!")
    print(f"Total Points: {result.total_points}")
    print(f"Calculation Time: {result.calculation_time_ms:.2f}ms")
    print(f"Display Text: {result.breakdown.display_text_en}")
    print(f"\nBreakdown JSON:")
    import json
    print(json.dumps(PointsEngine.generate_breakdown_json(result), indent=2))


async def test_running_calculation():
    """Test running calculation directly"""
    print("\n" + "="*60)
    print("Testing running calculation...")

    result = await PointsEngine.calculate_activity_points(
        user_id="891b240b-9a87-4ae3-923e-31609ea7a5e9",
        exercise_key="running",
        activity_data={
            "distance_km": 5.0,
            "duration_sec": 1650,
            "elevation_gain_m": 80,
            "avg_hr": 152
        },
        user_context={
            "streak_days": 0,
            "exercises_today": [],
            "active_challenges": []
        }
    )

    print(f"\n✅ SUCCESS!")
    print(f"Total Points: {result.total_points}")
    print(f"Calculation Time: {result.calculation_time_ms:.2f}ms")
    print(f"Display Text: {result.breakdown.display_text_en}")


if __name__ == "__main__":
    asyncio.run(test_squat_calculation())
    asyncio.run(test_running_calculation())
