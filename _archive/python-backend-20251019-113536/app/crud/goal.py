"""
CRUD operations for goals
"""

from sqlalchemy.orm import Session
from .. import models, schemas
import uuid

def get_goal(db: Session, goal_id: uuid.UUID):
    return db.query(models.Goal).filter(models.Goal.id == goal_id).first()

def get_goals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Goal).offset(skip).limit(limit).all()

def create_goal(db: Session, goal: schemas.GoalCreate):
    db_goal = models.Goal(**goal.dict())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def update_goal(db: Session, goal_id: uuid.UUID, goal: schemas.GoalUpdate):
    db_goal = get_goal(db, goal_id)
    if db_goal:
        update_data = goal.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_goal, key, value)
        db.commit()
        db.refresh(db_goal)
    return db_goal

def delete_goal(db: Session, goal_id: uuid.UUID):
    db_goal = get_goal(db, goal_id)
    if db_goal:
        db.delete(db_goal)
        db.commit()
    return db_goal
