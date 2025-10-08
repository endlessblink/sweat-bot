# Pydantic schemas package

# Import all schemas to make them available
from .goal import GoalBase, GoalCreate, GoalUpdate, GoalResponse
from .exercise import ExerciseBase, ExerciseCreate, ExerciseUpdate, ExerciseResponse

__all__ = [
    'GoalBase', 'GoalCreate', 'GoalUpdate', 'GoalResponse',
    'ExerciseBase', 'ExerciseCreate', 'ExerciseUpdate', 'ExerciseResponse'
]