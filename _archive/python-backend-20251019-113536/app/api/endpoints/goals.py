"""
API endpoints for goals
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import crud, models, schemas
from app.core.database import get_db
import uuid

router = APIRouter()

@router.post("/", response_model=schemas.GoalResponse)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    return crud.goal.create_goal(db=db, goal=goal)

@router.get("/", response_model=List[schemas.GoalResponse])
def read_goals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    goals = crud.goal.get_goals(db, skip=skip, limit=limit)
    return goals

@router.get("/{goal_id}", response_model=schemas.GoalResponse)
def read_goal(goal_id: uuid.UUID, db: Session = Depends(get_db)):
    db_goal = crud.goal.get_goal(db, goal_id=goal_id)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal

@router.put("/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(goal_id: uuid.UUID, goal: schemas.GoalUpdate, db: Session = Depends(get_db)):
    db_goal = crud.goal.update_goal(db, goal_id=goal_id, goal=goal)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal

@router.delete("/{goal_id}", response_model=schemas.GoalResponse)
def delete_goal(goal_id: uuid.UUID, db: Session = Depends(get_db)):
    db_goal = crud.goal.delete_goal(db, goal_id=goal_id)
    if db_goal is None:
        raise HTTPException(status_code=404, detail="Goal not found")
    return db_goal
