"""
WebSocket Handlers
Process different types of WebSocket messages and coordinate services
"""

from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import json
from typing import Optional, Dict, Any

from app.websocket.connection_manager import connection_manager, MessageType
from app.services.hebrew_parser_service import HebrewParserService
from app.services.gamification_service import GamificationService
from app.services.voice_service import VoiceService
from app.services.hebrew_model_manager import HebrewModelManager
from app.core.database import get_db
from app.models.models import User, Exercise, Workout
from app.api.v1.auth import get_current_user_ws

logger = logging.getLogger(__name__)

# Initialize services
hebrew_parser = HebrewParserService()
gamification_service = GamificationService()
voice_service = VoiceService()
model_manager = HebrewModelManager()

class WebSocketHandler:
    """Main WebSocket message handler"""
    
    def __init__(self, websocket: WebSocket, user: User, db: AsyncSession):
        self.websocket = websocket
        self.user = user
        self.db = db
        self.user_id = str(user.id)
    
    async def handle_connection(self):
        """Main connection handling loop"""
        try:
            # Connect user
            await connection_manager.connect(
                self.websocket, 
                self.user_id,
                metadata={
                    "username": self.user.username,
                    "language": self.user.preferred_language or "he"
                }
            )
            
            # Auto-join personal workout room
            await connection_manager.join_room(self.user_id, f"workout_{self.user_id}")
            
            # Send initial stats
            await self.send_initial_stats()
            
            # Main message loop
            while True:
                # Receive message
                data = await self.websocket.receive_json()
                
                # Process message
                result = await connection_manager.handle_message(self.user_id, data)
                
                if result:
                    await self.process_message_result(result)
                    
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for user {self.user_id}")
        except Exception as e:
            logger.error(f"WebSocket error for user {self.user_id}: {e}")
        finally:
            await connection_manager.disconnect(self.user_id)
    
    async def process_message_result(self, result: Dict):
        """Process the result from connection manager"""
        result_type = result.get("type")
        
        if result_type == "voice_ready":
            # Process complete voice audio
            await self.handle_voice_audio(result["audio"])
            
        elif result_type == "chat_message":
            # Process chat message
            model = result.get("model", "gemini-1.5-flash")
            await self.handle_chat_message(result["message"], model)
            
        elif result_type == "exercise_log":
            # Process exercise log
            await self.handle_exercise_log(result["exercise"])
            
        elif result_type == "stats_request":
            # Send current stats
            await self.send_current_stats()
    
    async def handle_voice_audio(self, audio_data: bytes):
        """Process voice audio through transcription and command parsing"""
        try:
            # Transcribe audio
            transcription = await voice_service.transcribe_audio(
                audio_data,
                language=self.user.preferred_language or "he"
            )
            
            if not transcription:
                await connection_manager.send_personal_message({
                    "type": MessageType.SERVER_ERROR.value,
                    "data": {
                        "error": "לא הצלחתי להבין את ההקלטה",
                        "error_en": "Could not understand the recording"
                    }
                }, self.user_id)
                return
            
            # Send transcription back to user
            await connection_manager.send_personal_message({
                "type": MessageType.SERVER_TRANSCRIPTION.value,
                "data": {
                    "text": transcription,
                    "language": self.user.preferred_language or "he"
                }
            }, self.user_id)
            
            # Process as command
            await self.handle_chat_message(transcription, "gemini-1.5-flash")
            
        except Exception as e:
            logger.error(f"Error processing voice audio: {e}")
            await connection_manager.send_personal_message({
                "type": MessageType.SERVER_ERROR.value,
                "data": {
                    "error": "שגיאה בעיבוד ההקלטה",
                    "error_en": "Error processing recording"
                }
            }, self.user_id)
    
    async def handle_chat_message(self, message: str, model: str = "gemini-1.5-flash"):
        """Process chat message and generate response"""
        try:
            # Parse for exercise commands
            parsed = await hebrew_parser.parse_exercise_command(message)
            
            if parsed and parsed.get("confidence", 0) > 0.6:
                # Log exercise
                await self.handle_exercise_log(parsed)
                
                # Send confirmation
                exercise_name = parsed.get("name_he", parsed.get("name"))
                response = f"רשמתי {exercise_name}"
                
                if parsed.get("reps"):
                    response += f" - {parsed['reps']} חזרות"
                if parsed.get("sets") and parsed["sets"] > 1:
                    response += f" ב-{parsed['sets']} סטים"
                if parsed.get("weight_kg"):
                    response += f" עם {parsed['weight_kg']} ק״ג"
                
                response += "! 💪"
                
            else:
                # Generate AI chat response using model manager
                try:
                    context = {
                        "user_id": self.user_id,
                        "username": self.user.username,
                        "preferred_language": self.user.preferred_language,
                        "user_context": await self._get_user_context()
                    }
                    
                    # Try to generate response with AI model
                    ai_response = await model_manager.generate_chat_response(
                        message=message,
                        model=model,
                        context=context,
                        user_id=self.user_id
                    )
                    
                    if ai_response and ai_response.get("response"):
                        response = ai_response["response"]
                        
                        # Check for exercise detection in AI response
                        if ai_response.get("exercise_detected"):
                            exercise_info = ai_response["exercise_detected"]
                            if exercise_info.get("points"):
                                await connection_manager.send_personal_message({
                                    "type": "points_earned",
                                    "data": {
                                        "points": exercise_info["points"],
                                        "source": "conversation"
                                    }
                                }, self.user_id)
                    else:
                        # Fallback to simple response
                        response = await self.generate_fallback_response(message)
                        
                except Exception as e:
                    logger.error(f"Error generating AI response: {e}")
                    response = await self.generate_fallback_response(message)
            
            # Send response with UI component
            await connection_manager.send_ui_component(self.user_id, {
                "type": "chat_message",
                "message": response,
                "sender": "bot",
                "actions": self.get_suggested_actions(message)
            })
            
        except Exception as e:
            logger.error(f"Error handling chat message: {e}")
            await connection_manager.send_personal_message({
                "type": MessageType.SERVER_ERROR.value,
                "data": {"error": "Failed to process message"}
            }, self.user_id)
    
    async def handle_exercise_log(self, exercise_data: Dict):
        """Log exercise and send updates"""
        try:
            from app.api.v1.exercises import log_exercise, ExerciseInput
            
            # Create exercise input
            exercise_input = ExerciseInput(**exercise_data)
            
            # Log exercise (reuse existing endpoint logic)
            exercise_response = await log_exercise(
                exercise_input=exercise_input,
                db=self.db,
                current_user=self.user
            )
            
            # Send confirmation
            await connection_manager.send_ui_component(self.user_id, {
                "type": "exercise_logged",
                "exercise": {
                    "name": exercise_response.name_he,
                    "reps": exercise_response.reps,
                    "sets": exercise_response.sets,
                    "weight": exercise_response.weight_kg,
                    "points": exercise_response.points_earned,
                    "is_pr": exercise_response.is_personal_record
                }
            })
            
            # Check for achievements
            user_stats = await self.get_user_stats()
            achievements = gamification_service.check_achievements(user_stats)
            
            for achievement in achievements:
                notification = gamification_service.format_achievement_notification(
                    achievement,
                    language=self.user.preferred_language or "he"
                )
                await connection_manager.send_achievement_notification(
                    self.user_id,
                    notification
                )
            
            # Update stats
            await self.send_current_stats()
            
            # Check daily challenge
            daily_challenge = gamification_service.get_daily_challenge()
            if gamification_service.check_daily_challenge_completion(
                exercise_response,
                daily_challenge
            ):
                await connection_manager.send_achievement_notification(self.user_id, {
                    "type": "daily_challenge_complete",
                    "title": "אתגר יומי הושלם!",
                    "description": daily_challenge["name_he"],
                    "points": daily_challenge["points"],
                    "icon": "🎯"
                })
            
        except Exception as e:
            logger.error(f"Error logging exercise: {e}")
            await connection_manager.send_personal_message({
                "type": MessageType.SERVER_ERROR.value,
                "data": {"error": "Failed to log exercise"}
            }, self.user_id)
    
    async def send_initial_stats(self):
        """Send initial stats when user connects"""
        try:
            stats = await self.get_user_stats()
            level_info = gamification_service.calculate_level(stats.get("total_points", 0))
            
            await connection_manager.send_stats_update(self.user_id, {
                "level": level_info,
                "streak": stats.get("current_streak", 0),
                "today_points": stats.get("today_points", 0),
                "total_workouts": stats.get("total_workouts", 0),
                "daily_challenge": gamification_service.get_daily_challenge()
            })
        except Exception as e:
            logger.error(f"Error sending initial stats: {e}")
    
    async def send_current_stats(self):
        """Send current updated stats"""
        try:
            stats = await self.get_user_stats()
            level_info = gamification_service.calculate_level(stats.get("total_points", 0))
            
            # Check for level up
            if stats.get("previous_level", 0) < level_info["level"]:
                await connection_manager.send_achievement_notification(self.user_id, {
                    "type": "level_up",
                    "title": f"עלית לרמה {level_info['level']}!",
                    "description": f"אתה עכשיו {level_info['title_he']}",
                    "icon": "⭐",
                    "points": 0
                })
            
            await connection_manager.send_stats_update(self.user_id, {
                "level": level_info,
                "streak": stats.get("current_streak", 0),
                "today_points": stats.get("today_points", 0),
                "total_workouts": stats.get("total_workouts", 0)
            })
        except Exception as e:
            logger.error(f"Error sending current stats: {e}")
    
    async def get_user_stats(self) -> Dict:
        """Get comprehensive user statistics"""
        from sqlalchemy import select, func, and_
        from datetime import datetime, timedelta
        
        # Get total stats
        total_query = select(
            func.count(Exercise.id).label('total_exercises'),
            func.sum(Exercise.points_earned).label('total_points')
        ).join(Workout).where(Workout.user_id == self.user.id)
        
        result = await self.db.execute(total_query)
        totals = result.first()
        
        # Get today's points
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_query = select(
            func.sum(Exercise.points_earned).label('today_points')
        ).join(Workout).where(
            and_(
                Workout.user_id == self.user.id,
                Exercise.timestamp >= today_start
            )
        )
        
        today_result = await self.db.execute(today_query)
        today_points = today_result.scalar() or 0
        
        # Get workout dates for streak calculation
        workout_dates_query = select(
            func.date(Workout.started_at).label('workout_date')
        ).where(
            Workout.user_id == self.user.id
        ).group_by(func.date(Workout.started_at))
        
        dates_result = await self.db.execute(workout_dates_query)
        workout_dates = [row.workout_date for row in dates_result]
        
        # Calculate streak
        current_streak = gamification_service.calculate_streak(
            [datetime.combine(d, datetime.min.time()) for d in workout_dates]
        )
        
        # Get total workouts
        workout_count_query = select(
            func.count(Workout.id).label('total_workouts')
        ).where(Workout.user_id == self.user.id)
        
        workout_result = await self.db.execute(workout_count_query)
        total_workouts = workout_result.scalar() or 0
        
        return {
            "total_exercises": totals.total_exercises or 0,
            "total_points": totals.total_points or 0,
            "today_points": today_points,
            "current_streak": current_streak,
            "total_workouts": total_workouts,
            "workout_dates": workout_dates
        }
    
    async def _get_user_context(self) -> Dict[str, Any]:
        """Get user context for AI chat"""
        try:
            stats = await self.get_user_stats()
            
            # Get recent workouts
            from sqlalchemy import select
            recent_workouts_query = select(Workout).where(
                Workout.user_id == self.user.id
            ).order_by(Workout.started_at.desc()).limit(5)
            
            result = await self.db.execute(recent_workouts_query)
            recent_workouts = result.scalars().all()
            
            return {
                "recent_workouts": [
                    {
                        "name": w.workout_name_he,
                        "date": w.started_at.isoformat(),
                        "exercises": w.total_exercises,
                        "points": w.total_points
                    } for w in recent_workouts
                ],
                "stats": stats,
                "preferences": {
                    "language": self.user.preferred_language or "he"
                }
            }
        except Exception as e:
            logger.error(f"Error getting user context: {e}")
            return {}
    
    async def generate_fallback_response(self, message: str) -> str:
        """Generate simple fallback response when AI is unavailable"""
        # Trust the frontend AI to handle all messages naturally
        # This is only for emergency fallback when everything else fails
        return "שגיאה זמנית בשירות. אנא נסה שוב."
    
    def get_suggested_actions(self, message: str) -> list:
        """Get suggested quick actions based on context"""
        # Let the AI decide what actions to suggest based on conversation context
        # Don't force UI elements unless the user asks for them
        return []

async def websocket_endpoint(
    websocket: WebSocket,
    current_user: User = Depends(get_current_user_ws),
    db: AsyncSession = Depends(get_db)
):
    """Main WebSocket endpoint"""
    handler = WebSocketHandler(websocket, current_user, db)
    await handler.handle_connection()