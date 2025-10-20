"""
Onboarding API Endpoints for SweatBot
Handles user preference collection to reduce future AI questioning
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import logging

from app.core.database import get_db
from app.models.models import User
from app.api.v1.auth import get_current_user
from app.services.user_onboarding_service import user_onboarding_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for API
class OnboardingStatusResponse(BaseModel):
    """Response model for onboarding status"""
    is_onboarded: bool = Field(..., description="Whether user has completed onboarding")
    step: int = Field(..., description="Current step (1-based)")
    total_steps: int = Field(..., description="Total number of onboarding steps")
    progress_percentage: int = Field(..., description="Progress percentage")
    completed: bool = Field(..., description="Whether onboarding is fully completed")

class OnboardingQuestionResponse(BaseModel):
    """Response model for onboarding questions"""
    step: int = Field(..., description="Current step number")
    total_steps: int = Field(..., description="Total number of steps")
    question_key: str = Field(..., description="Key identifier for the question")
    question: str = Field(..., description="Question text in Hebrew")
    options: List[str] = Field(..., description="Available answer options")
    multi_select: bool = Field(default=False, description="Whether multiple options can be selected")
    progress_percentage: int = Field(..., description="Progress percentage")

class OnboardingAnswerRequest(BaseModel):
    """Request model for submitting onboarding answers"""
    question_key: str = Field(..., description="Key identifier for the question")
    answer: Union[str, List[str]] = Field(..., description="User's answer(s)")

class OnboardingAnswerResponse(BaseModel):
    """Response model for onboarding answer submission"""
    success: bool = Field(..., description="Whether answer was saved successfully")
    progress: int = Field(..., description="Number of questions answered")
    total: int = Field(..., description="Total number of questions")
    completed: bool = Field(..., description="Whether onboarding is now complete")
    message: Optional[str] = Field(None, description="Success or error message")

class SkipOnboardingRequest(BaseModel):
    """Request model for skipping onboarding"""
    reason: Optional[str] = Field("user_choice", description="Reason for skipping")

@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current onboarding status for the user
    """
    try:
        logger.info(f"Getting onboarding status for user {current_user.username}")
        
        # Check if user is already onboarded
        is_onboarded = await user_onboarding_service.is_user_onboarded(str(current_user.id), db)
        
        # Get progress details
        progress = await user_onboarding_service.get_onboarding_progress(str(current_user.id))
        
        return OnboardingStatusResponse(
            is_onboarded=is_onboarded,
            step=progress["step"],
            total_steps=progress["total_steps"],
            progress_percentage=int((progress["step"] - 1) / progress["total_steps"] * 100),
            completed=progress["completed"]
        )
        
    except Exception as e:
        logger.error(f"Error getting onboarding status: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בקבלת סטטוס הגדרות ראשוניות"
        )

@router.get("/next-question", response_model=OnboardingQuestionResponse)
async def get_next_onboarding_question(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the next onboarding question for the user
    """
    try:
        logger.info(f"Getting next onboarding question for user {current_user.username}")
        
        question_data = await user_onboarding_service.get_next_question(str(current_user.id))
        
        if not question_data:
            raise HTTPException(
                status_code=404,
                detail="אין שאלות נוספות - ההגדרות הראשוניות הושלמו"
            )
        
        return OnboardingQuestionResponse(**question_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting next onboarding question: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בקבלת שאלת הגדרות"
        )

@router.post("/answer", response_model=OnboardingAnswerResponse)
async def submit_onboarding_answer(
    answer_request: OnboardingAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit an answer to an onboarding question
    """
    try:
        logger.info(f"Submitting onboarding answer for user {current_user.username}: {answer_request.question_key}")
        
        result = await user_onboarding_service.save_answer(
            user_id=str(current_user.id),
            question_key=answer_request.question_key,
            answer=answer_request.answer
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=f"שגיאה בשמירת התשובה: {result.get('error', 'שגיאה לא ידועה')}"
            )
        
        # Prepare success message
        message = "תשובה נשמרה בהצלחה"
        if result["completed"]:
            message = "🎉 הגדרות ראשוניות הושלמו בהצלחה! עכשיו תוכל ליהנות מחוויה מותאמת אישית"
        
        return OnboardingAnswerResponse(
            success=True,
            progress=result["progress"],
            total=result["total"],
            completed=result["completed"],
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting onboarding answer: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בשמירת התשובה"
        )

@router.post("/skip", response_model=OnboardingAnswerResponse)
async def skip_onboarding(
    skip_request: SkipOnboardingRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Skip onboarding process and use default settings
    """
    try:
        logger.info(f"User {current_user.username} skipping onboarding: {skip_request.reason}")
        
        result = await user_onboarding_service.skip_onboarding(
            user_id=str(current_user.id),
            reason=skip_request.reason
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=f"שגיאה בדילוג על הגדרות: {result.get('error', 'שגיאה לא ידועה')}"
            )
        
        return OnboardingAnswerResponse(
            success=True,
            progress=0,  # Skipped
            total=0,     # Skipped
            completed=True,
            message="✅ הגדרות ברירת מחדל נשמרו - תוכל להתחיל לתעד אימונים!"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error skipping onboarding: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בדילוג על הגדרות ראשוניות"
        )

@router.get("/summary")
async def get_onboarding_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get summary of user's onboarding choices and preferences
    """
    try:
        logger.info(f"Getting onboarding summary for user {current_user.username}")
        
        # Check if user is onboarded
        is_onboarded = await user_onboarding_service.is_user_onboarded(str(current_user.id), db)
        
        if not is_onboarded:
            raise HTTPException(
                status_code=404,
                detail="המשתמש לא השלים הגדרות ראשוניות"
            )
        
        # Get progress to see the answers
        progress = await user_onboarding_service.get_onboarding_progress(str(current_user.id))
        
        return {
            "user_id": str(current_user.id),
            "username": current_user.username,
            "onboarding_completed": True,
            "answers": progress.get("answers", {}),
            "summary": "ההגדרות הראשוניות הושלמו בהצלחה",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting onboarding summary: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בקבלת סיכום הגדרות"
        )

@router.delete("/reset")
async def reset_onboarding(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reset onboarding process for the user (for testing or re-configuration)
    """
    try:
        logger.info(f"Resetting onboarding for user {current_user.username}")
        
        # This would clear the onboarding data from user context
        from app.services.user_context_manager import user_context_manager
        
        context = await user_context_manager.get_user_context(str(current_user.id))
        if context:
            # Remove onboarding and fitness profile data
            context.pop("onboarding", None)
            context.pop("fitness_profile", None)
            context.pop("coaching_preferences", None)
            
            await user_context_manager.store_user_context(str(current_user.id), context)
        
        return {
            "success": True,
            "message": "הגדרות ראשוניות אופסו בהצלחה",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error resetting onboarding: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה באיפוס הגדרות ראשוניות"
        )

@router.get("/health")
async def onboarding_health_check():
    """Health check for onboarding service"""
    try:
        return {
            "status": "healthy",
            "service": "onboarding",
            "timestamp": datetime.utcnow().isoformat(),
            "total_questions": len(user_onboarding_service.onboarding_questions)
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "onboarding",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }