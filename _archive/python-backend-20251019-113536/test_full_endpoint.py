"""
Full endpoint test with database connection
"""

import asyncio
import sys
sys.path.insert(0, '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/backend')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy import select
from app.models.points_models_v4 import ExerciseType


async def test_exercise_type_query():
    """Test querying exercise_type table"""
    print("Testing exercise_type query...")

    # Create engine
    database_url = "postgresql+asyncpg://fitness_user:secure_password@localhost:8001/hebrew_fitness"
    engine = create_async_engine(database_url, echo=False)

    AsyncSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with AsyncSessionLocal() as session:
        # Query for running
        print("\n1. Querying for 'running' exercise...")
        query = select(ExerciseType).where(ExerciseType.key == "running")
        result = await session.execute(query)
        exercise = result.scalar_one_or_none()

        if exercise:
            print(f"✅ Found: id={exercise.id}, key={exercise.key}, category={exercise.category}")
            print(f"   Category type: {type(exercise.category)}")
            print(f"   Category value: {exercise.category.value if hasattr(exercise.category, 'value') else exercise.category}")
        else:
            print("❌ Exercise 'running' not found!")

        # Query for squat
        print("\n2. Querying for 'squat' exercise...")
        query2 = select(ExerciseType).where(ExerciseType.key == "squat")
        result2 = await session.execute(query2)
        exercise2 = result2.scalar_one_or_none()

        if exercise2:
            print(f"✅ Found: id={exercise2.id}, key={exercise2.key}, category={exercise2.category}")
            print(f"   Category type: {type(exercise2.category)}")
        else:
            print("❌ Exercise 'squat' not found!")

        # List all exercises
        print("\n3. All exercises in database:")
        query3 = select(ExerciseType).order_by(ExerciseType.category, ExerciseType.key)
        result3 = await session.execute(query3)
        all_exercises = result3.scalars().all()

        for ex in all_exercises:
            print(f"   - {ex.key}: {ex.category}")

    await engine.dispose()
    print("\n✅ Test complete!")


if __name__ == "__main__":
    try:
        asyncio.run(test_exercise_type_query())
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
