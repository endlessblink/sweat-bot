"""
Service for tracking user consistency and awarding rewards.
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from .. import crud, models
import uuid

class ConsistencyService:
    def __init__(self, db: Session):
        self.db = db

    def check_consistency(self, user_id: uuid.UUID, db: Session):
        """Check user consistency and award rewards."""
        goals = crud.goal.get_goals(db, is_active=True)
        workouts = crud.exercise.get_workouts_by_user(db, user_id=user_id, limit=100) # Fetch last 100 workouts

        for goal in goals:
            if self.is_goal_met(goal, workouts):
                # Award points
                gamification_service.add_points(user_id, goal.points_reward)

                # Send notification
                connection_manager.send_personal_message(
                    {
                        "type": "goal_completed",
                        "data": {
                            "title": goal.name_he,
                            "points": goal.points_reward,
                        },
                    },
                    user_id,
                )

    def is_goal_met(self, goal: models.Goal, workouts: list[models.Workout]) -> bool:
        """Check if a specific goal is met."""
        if goal.name == "4 CrossFit Workouts a Week":
            # Get the last 7 days of workouts
            today = datetime.utcnow().date()
            last_week = today - timedelta(days=7)
            recent_workouts = [w for w in workouts if w.timestamp.date() >= last_week]

            # Check if there are at least 4 CrossFit workouts
            crossfit_workouts = [w for w in recent_workouts if w.workout_type == "crossfit"]
            return len(crossfit_workouts) >= 4

        return False


