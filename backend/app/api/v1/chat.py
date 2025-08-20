"""
Chat API Endpoints for SweatBot
Handles conversational AI with model routing and memory integration
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import uuid

from app.core.database import get_db
from app.models.models import User
from app.api.v1.auth import get_current_user
from app.services.hebrew_model_manager import HebrewModelManager
from app.services.gamification_service import GamificationService
from app.services.exercise_integration_service import exercise_integration_service
from app.services.user_context_manager import user_context_manager

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
model_manager = HebrewModelManager()
gamification_service = GamificationService()

# Pydantic models for API
class ChatMessage(BaseModel):
    """Input model for chat messages"""
    message: str = Field(..., description="User message in Hebrew or English")
    model: Optional[str] = Field("gemini-1.5-flash", description="AI model to use")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    session_id: Optional[str] = Field(None, description="Chat session ID")

class ChatResponse(BaseModel):
    """Response model for chat messages"""
    response: str = Field(..., description="AI response")
    model_used: str = Field(..., description="Model that generated response")
    session_id: str = Field(..., description="Chat session ID")
    confidence: Optional[float] = Field(None, description="Response confidence")
    exercise_detected: Optional[Dict[str, Any]] = Field(None, description="Detected exercise if any")
    points_earned: Optional[int] = Field(None, description="Points from exercise")
    correction_processed: Optional[bool] = Field(None, description="Whether a correction was processed")
    learning_applied: Optional[Dict[str, Any]] = Field(None, description="Learning patterns applied")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True

class CorrectionRequest(BaseModel):
    """Input model for correction requests"""
    original_text: str = Field(..., description="Original Hebrew text that was parsed")
    original_parse: Dict[str, Any] = Field(..., description="Original parsing result")
    correction_text: str = Field(..., description="User's correction in Hebrew")
    corrected_values: Dict[str, Any] = Field(..., description="Corrected values")
    session_id: Optional[str] = Field(None, description="Chat session ID")

class CorrectionResponse(BaseModel):
    """Response model for correction processing"""
    success: bool = Field(..., description="Whether correction was processed successfully")
    response_message: str = Field(..., description="Hebrew acknowledgment message")
    learned_patterns: Optional[Dict[str, Any]] = Field(None, description="Patterns learned from correction")
    exercise_updated: Optional[bool] = Field(None, description="Whether exercise log was updated")
    points_recalculated: Optional[int] = Field(None, description="New points after correction")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ModelStatus(BaseModel):
    """Model availability status"""
    model_name: str
    available: bool
    status: str
    error: Optional[str] = None

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    chat_input: ChatMessage,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message to the AI chat system
    Supports model selection and exercise detection
    """
    try:
        # Generate session ID if not provided
        session_id = chat_input.session_id or str(uuid.uuid4())
        
        # Log the chat attempt
        logger.info(f"Chat request from user {current_user.username} with model {chat_input.model}")
        
        # Get user context from Redis-based context manager
        user_context = await user_context_manager.get_user_context(str(current_user.id))
        
        # If no context exists, build it from database
        if not user_context:
            user_context = await user_context_manager.build_initial_user_context(current_user, db)
            await user_context_manager.store_user_context(str(current_user.id), user_context)
        
        # Prepare the chat context
        context = {
            "user_id": str(current_user.id),
            "username": current_user.username,
            "preferred_language": current_user.preferred_language,
            "session_id": session_id,
            "user_context": user_context,
            **(chat_input.context or {})
        }
        
        # Try to get response from selected model
        try:
            response_data = await model_manager.generate_chat_response(
                message=chat_input.message,
                model=chat_input.model,
                context=context,
                user_id=str(current_user.id)
            )
            
            if not response_data:
                # Fallback to default model if primary fails
                logger.warning(f"Model {chat_input.model} failed, trying fallback")
                response_data = await model_manager.generate_chat_response(
                    message=chat_input.message,
                    model="gemini-1.5-flash",  # Fallback model
                    context=context,
                    user_id=str(current_user.id)
                )
            
            if not response_data:
                raise HTTPException(
                    status_code=503,
                    detail="שירות הבינה המלאכותית אינו זמין כרגע. אנא נסה שוב בעוד מספר דקות."
                )
            
        except Exception as model_error:
            logger.error(f"Model error for user {current_user.username}: {model_error}")
            
            # Return user-friendly error message
            error_message = _get_friendly_error_message(str(model_error), current_user.preferred_language)
            
            raise HTTPException(
                status_code=503,
                detail=error_message
            )
        
        # Check for Hebrew exercise commands in user message
        exercise_parsing_result = None
        exercise_info = None
        points_earned = None
        correction_processed = False
        learning_applied = None
        
        # First, check if this is a correction pattern
        is_correction = await _detect_correction_pattern(chat_input.message)
        
        if is_correction:
            # Handle as correction - this would need the previous context
            correction_result = await _process_inline_correction(
                user_id=str(current_user.id),
                message=chat_input.message,
                user=current_user,
                db=db,
                context=context
            )
            
            if correction_result.get("success"):
                correction_processed = True
                learning_applied = correction_result.get("learned_patterns")
                # Use the correction acknowledgment as the AI response
                response_data = {
                    "response": correction_result.get("response_message", "תודה על התיקון! 📚"),
                    "model_used": "correction_processor",
                    "confidence": 1.0
                }
        
        # If not a correction, try to parse as exercise command
        if not correction_processed and chat_input.message.strip():
            exercise_parsing_result = await exercise_integration_service.process_exercise_message(
                user_id=str(current_user.id),
                message=chat_input.message,
                user=current_user,
                db=db,
                auto_log=True  # Auto-log if confidence is high enough
            )
            
            if exercise_parsing_result.get("success") and exercise_parsing_result.get("exercise_logged"):
                # Exercise was successfully parsed and logged
                points_earned = exercise_parsing_result.get("points_earned", 0)
                exercise_info = {
                    "detected": True,
                    "exercise_id": exercise_parsing_result.get("exercise_id"),
                    "points": points_earned,
                    "source": "hebrew_parser",
                    "auto_logged": True,
                    "parsed_data": exercise_parsing_result.get("parsed_data", {})
                }
                
                # Update the AI response to acknowledge the exercise
                if points_earned > 0:
                    # Replace or enhance the AI response with exercise confirmation
                    response_data["response"] = exercise_parsing_result.get("response_message", response_data["response"])
        
        # Fallback: Check AI's own exercise detection (legacy system)
        if not exercise_info and response_data.get("exercise_detected"):
            exercise_info = response_data["exercise_detected"]
            points_earned = exercise_info.get("points", 0)
            
            # Log exercise to gamification system (legacy method)
            if points_earned:
                try:
                    await gamification_service.add_points(
                        user_id=str(current_user.id),
                        points=points_earned,
                        source="chat_exercise",
                        details=exercise_info
                    )
                except Exception as e:
                    logger.warning(f"Legacy gamification failed: {e}")
        
        # Update user context with exercise activity
        if exercise_info and points_earned:
            context_updates = {
                "last_exercise_time": datetime.utcnow().isoformat(),
                "today_exercises": user_context.get("today_exercises", 0) + 1,
                "today_points": user_context.get("today_points", 0) + points_earned
            }
            await user_context_manager.update_user_context(str(current_user.id), context_updates)
        
        # Store conversation in memory system
        await _store_conversation(
            user_id=str(current_user.id),
            session_id=session_id,
            user_message=chat_input.message,
            ai_response=response_data["response"],
            model_used=response_data.get("model_used", chat_input.model),
            exercise_info=exercise_info,
            db=db
        )
        
        logger.info(f"Chat response generated successfully for user {current_user.username}")
        
        return ChatResponse(
            response=response_data["response"],
            model_used=response_data.get("model_used", chat_input.model),
            session_id=session_id,
            confidence=response_data.get("confidence"),
            exercise_detected=exercise_info,
            points_earned=points_earned,
            correction_processed=correction_processed,
            learning_applied=learning_applied,
            timestamp=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה פנימית. אנא נסה שוב או פנה לתמיכה."
        )

@router.get("/models", response_model=List[ModelStatus])
async def get_available_models(
    current_user: User = Depends(get_current_user)
):
    """Get list of available AI models and their status"""
    try:
        models_status = await model_manager.get_models_status()
        
        return [
            ModelStatus(
                model_name=model_name,
                available=status_info["available"],
                status=status_info["status"],
                error=status_info.get("error")
            )
            for model_name, status_info in models_status.items()
        ]
        
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        raise HTTPException(
            status_code=500,
            detail="לא ניתן לקבל את רשימת המודלים כרגע"
        )

@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat history for a specific session"""
    try:
        # This would integrate with the MongoDB memory system
        # For now, return a placeholder response
        return {
            "session_id": session_id,
            "messages": [],
            "message": "היסטוריית הצ'אט תהיה זמינה בקרוב"
        }
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בקבלת היסטוריית הצ'אט"
        )

@router.post("/correction", response_model=CorrectionResponse)
async def process_correction(
    correction_request: CorrectionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a user correction and learn from it
    Example: User says "לא, עשיתי 30 לא 20" to correct a previous exercise parse
    """
    try:
        logger.info(f"Processing correction from user {current_user.username}")
        
        # Process the correction through the exercise integration service
        correction_result = await exercise_integration_service.process_user_correction(
            user_id=str(current_user.id),
            original_text=correction_request.original_text,
            original_parse=correction_request.original_parse,
            correction_text=correction_request.correction_text,
            corrected_values=correction_request.corrected_values,
            user=current_user,
            db=db
        )
        
        if correction_result.get("success"):
            logger.info(f"✅ Correction processed successfully for user {current_user.username}")
            
            return CorrectionResponse(
                success=True,
                response_message=correction_result.get("response_message", "תודה על התיקון! אני לומד מזה 📚"),
                learned_patterns=correction_result.get("learned_patterns"),
                exercise_updated=correction_result.get("exercise_updated", False),
                points_recalculated=correction_result.get("points_recalculated", 0),
                timestamp=datetime.utcnow()
            )
        else:
            logger.warning(f"❌ Correction processing failed for user {current_user.username}")
            
            return CorrectionResponse(
                success=False,
                response_message=correction_result.get("response_message", "לא הצלחתי לעבד את התיקון, אבל אני אזכור את זה! 🤔"),
                timestamp=datetime.utcnow()
            )
            
    except Exception as e:
        logger.error(f"Error processing correction: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בעיבוד התיקון"
        )

@router.get("/learning-stats")
async def get_learning_statistics(
    current_user: User = Depends(get_current_user)
):
    """Get learning statistics for the current user"""
    try:
        stats = exercise_integration_service.get_learning_statistics()
        
        return {
            "user_id": str(current_user.id),
            "learning_stats": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting learning stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בקבלת סטטיסטיקות למידה"
        )

@router.post("/clear-session")
async def clear_chat_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear a chat session"""
    try:
        # This would clear the session from memory system
        logger.info(f"Clearing chat session {session_id} for user {current_user.username}")
        
        return {
            "message": "הפגישה נוקתה בהצלחה",
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Error clearing chat session: {e}")
        raise HTTPException(
            status_code=500,
            detail="שגיאה בניקוי הפגישה"
        )

@router.get("/health")
async def chat_health_check():
    """Health check for chat service"""
    try:
        # Check model manager status
        model_status = await model_manager.health_check()
        
        return {
            "status": "healthy",
            "service": "chat",
            "models": model_status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "chat",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Helper functions
async def _get_user_context(user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Get user context from memory system and database"""
    # This would integrate with MongoDB memory system
    # For now, return basic context
    return {
        "recent_workouts": [],
        "personal_records": [],
        "preferences": {},
        "goals": []
    }

async def _store_conversation(
    user_id: str,
    session_id: str,
    user_message: str,
    ai_response: str,
    model_used: str,
    exercise_info: Optional[Dict[str, Any]],
    db: AsyncSession
):
    """Store conversation in memory system"""
    try:
        # Create memory content for this conversation
        memory_content = f"""# SweatBot Conversation - {datetime.utcnow().isoformat()}

**User ID**: {user_id}
**Session ID**: {session_id}
**Model Used**: {model_used}

## User Message:
{user_message}

## AI Response:
{ai_response}
"""
        
        if exercise_info:
            memory_content += f"""
## Exercise Detected:
- **Keywords**: {exercise_info.get('keywords', [])}
- **Points Earned**: {exercise_info.get('points', 0)}
- **Source**: {exercise_info.get('source', 'unknown')}
"""
        
        # Store using MCP memory system (would need to integrate with Claude Code's MCP)
        # For now, store locally or in a simple file
        memory_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "session_id": session_id,
            "user_message": user_message,
            "ai_response": ai_response,
            "model_used": model_used,
            "exercise_info": exercise_info
        }
        
        # Simple file-based storage for now
        import json
        import os
        
        memory_dir = "memories/sweatbot"
        os.makedirs(memory_dir, exist_ok=True)
        
        memory_filename = f"{memory_dir}/conversation_{session_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(memory_filename, 'w', encoding='utf-8') as f:
            json.dump(memory_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Stored conversation memory: {memory_filename}")
        
    except Exception as e:
        logger.error(f"Error storing conversation in memory: {e}")
        # Don't fail the request if memory storage fails
        pass

def _get_friendly_error_message(error: str, language: str = "he") -> str:
    """Convert technical errors to user-friendly messages"""
    error_lower = error.lower()
    
    if language == "he":
        if "timeout" in error_lower or "connection" in error_lower:
            return "הזמן הקצוב פג. אנא נסה שוב."
        elif "api" in error_lower or "key" in error_lower:
            return "בעיה בהתחברות לשירות. אנא נסה שוב בעוד כמה דקות."
        elif "quota" in error_lower or "limit" in error_lower:
            return "הגעת למגבלת השימוש. אנא נסה שוב מאוחר יותר."
        elif "model" in error_lower:
            return "המודל שנבחר אינו זמין כרגע. אנא בחר מודל אחר."
        else:
            return "סליחה, לא הצלחתי לעבד את הבקשה. אנא נסה שוב."
    else:
        if "timeout" in error_lower or "connection" in error_lower:
            return "Request timed out. Please try again."
        elif "api" in error_lower or "key" in error_lower:
            return "Service connection issue. Please try again in a few minutes."
        elif "quota" in error_lower or "limit" in error_lower:
            return "Usage limit reached. Please try again later."
        elif "model" in error_lower:
            return "Selected model is not available. Please choose another model."
        else:
            return "Sorry, I couldn't process the request. Please try again."