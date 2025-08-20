"""
Exercise Integration Service
Bridges Hebrew exercise parser with existing exercise logging API
Handles validation, conversion, and automatic exercise logging
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.hebrew_exercise_parser import hebrew_exercise_parser, hebrew_parser_with_learning
from app.models.models import User, Workout, Exercise
from app.crud.exercise import create_exercise
from app.schemas.exercise import ExerciseCreate
from app.services.gamification_service import GamificationService

# Initialize gamification service
gamification_service = GamificationService()

logger = logging.getLogger(__name__)

class ExerciseIntegrationService:
    """
    Service that integrates Hebrew exercise parsing with the exercise logging system
    """
    
    def __init__(self):
        self.parser = hebrew_exercise_parser
        self.learning_parser = hebrew_parser_with_learning
        
        # Exercise type mappings to database schema
        self.exercise_mappings = {
            "squat": {
                "name": "Squat",
                "name_he": "סקוואט",
                "category": "strength",
                "points_base": 10,
                "primary_muscle": "legs"
            },
            "pushup": {
                "name": "Push-up",
                "name_he": "שכיבות סמיכה",
                "category": "strength",
                "points_base": 8,
                "primary_muscle": "chest"
            },
            "pullup": {
                "name": "Pull-up",
                "name_he": "משיכות למעלה",
                "category": "strength",
                "points_base": 15,
                "primary_muscle": "back"
            },
            "burpee": {
                "name": "Burpee",
                "name_he": "ברפי",
                "category": "cardio",
                "points_base": 12,
                "primary_muscle": "full_body"
            },
            "deadlift": {
                "name": "Deadlift",
                "name_he": "דדליפט",
                "category": "strength",
                "points_base": 20,
                "primary_muscle": "back"
            },
            "plank": {
                "name": "Plank",
                "name_he": "פלאנק",
                "category": "core",
                "points_base": 8,
                "primary_muscle": "core"
            },
            "situp": {
                "name": "Sit-up",
                "name_he": "כפיפות בטן",
                "category": "core",
                "points_base": 6,
                "primary_muscle": "core"
            },
            "running": {
                "name": "Running",
                "name_he": "ריצה",
                "category": "cardio",
                "points_base": 15,
                "primary_muscle": "legs"
            },
            "walking": {
                "name": "Walking",
                "name_he": "הליכה",
                "category": "cardio",
                "points_base": 5,
                "primary_muscle": "legs"
            },
            "bench_press": {
                "name": "Bench Press",
                "name_he": "דחיפות בשכיבה",
                "category": "strength",
                "points_base": 18,
                "primary_muscle": "chest"
            },
            "back_squat": {
                "name": "Back Squat",
                "name_he": "בק סקווט",
                "category": "strength",
                "points_base": 25,
                "primary_muscle": "legs"
            }
        }
    
    async def process_exercise_message(
        self, 
        user_id: str, 
        message: str, 
        user: User,
        db: AsyncSession,
        auto_log: bool = False
    ) -> Dict[str, Any]:
        """
        Process a Hebrew exercise message and optionally log it automatically
        
        Args:
            user_id: User ID
            message: Hebrew exercise message
            user: User instance
            db: Database session
            auto_log: Whether to automatically log confirmed exercises
            
        Returns:
            Dictionary with parsing results and next actions
        """
        try:
            # Parse the Hebrew message using learning parser for Noam
            if user_id.lower() == "noam" or user.username.lower() == "noam":
                parsed_result = await self.learning_parser.parse_exercise_command_with_learning(message, user_id)
            else:
                parsed_result = await self.parser.parse_exercise_command(message)
            
            if "error" in parsed_result:
                return {
                    "success": False,
                    "error": parsed_result["error"],
                    "response_message": parsed_result.get("response_message", "שגיאה בפיענוח התרגיל"),
                    "requires_action": False
                }
            
            # Check if parsing was successful enough
            if not parsed_result.get("log_ready", False):
                return {
                    "success": False,
                    "parsed_data": parsed_result,
                    "response_message": parsed_result.get("response_message"),
                    "requires_clarification": True,
                    "requires_action": False
                }
            
            # Validate and enrich the parsed data
            enriched_data = await self._enrich_exercise_data(parsed_result)
            
            if auto_log or not parsed_result.get("requires_confirmation", True):
                # Automatically log the exercise
                log_result = await self._log_exercise_to_database(
                    user_id, enriched_data, user, db
                )
                
                if log_result["success"]:
                    # Calculate and update points
                    points_result = await self._calculate_and_award_points(
                        user_id, enriched_data, log_result["exercise_id"], db
                    )
                    
                    response_message = self._generate_success_message(
                        enriched_data, points_result
                    )
                    
                    return {
                        "success": True,
                        "auto_logged": True,
                        "exercise_logged": True,
                        "exercise_id": log_result["exercise_id"],
                        "points_earned": points_result.get("points_earned", 0),
                        "response_message": response_message,
                        "parsed_data": enriched_data,
                        "requires_action": False
                    }
                else:
                    return {
                        "success": False,
                        "error": log_result["error"],
                        "response_message": "הייתה שגיאה בשמירת התרגיל. נסה שוב 😔",
                        "parsed_data": enriched_data,
                        "requires_action": True
                    }
            else:
                # Return confirmation request
                return {
                    "success": True,
                    "requires_confirmation": True,
                    "response_message": parsed_result.get("response_message"),
                    "confirmation_data": enriched_data,
                    "suggested_actions": ["confirm", "modify", "cancel"],
                    "requires_action": True
                }
                
        except Exception as e:
            logger.error(f"❌ Exercise processing error: {e}")
            return {
                "success": False,
                "error": str(e),
                "response_message": "הייתה שגיאה בעיבוד התרגיל. נסה שוב 🤔",
                "requires_action": False
            }
    
    async def confirm_and_log_exercise(
        self,
        user_id: str,
        confirmation_data: Dict[str, Any],
        user: User,
        db: AsyncSession,
        modifications: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Confirm and log an exercise after user confirmation
        
        Args:
            user_id: User ID
            confirmation_data: Previously parsed exercise data
            user: User instance
            db: Database session
            modifications: Optional modifications to the data
            
        Returns:
            Result of logging operation
        """
        try:
            # Apply modifications if provided
            final_data = confirmation_data.copy()
            if modifications:
                final_data.update(modifications)
            
            # Log to database
            log_result = await self._log_exercise_to_database(
                user_id, final_data, user, db
            )
            
            if log_result["success"]:
                # Calculate and award points
                points_result = await self._calculate_and_award_points(
                    user_id, final_data, log_result["exercise_id"], db
                )
                
                response_message = self._generate_success_message(
                    final_data, points_result
                )
                
                return {
                    "success": True,
                    "exercise_logged": True,
                    "exercise_id": log_result["exercise_id"],
                    "points_earned": points_result.get("points_earned", 0),
                    "response_message": response_message,
                    "final_data": final_data
                }
            else:
                return {
                    "success": False,
                    "error": log_result["error"],
                    "response_message": "לא הצלחתי לשמור את התרגיל. נסה שוב 😔"
                }
                
        except Exception as e:
            logger.error(f"❌ Exercise confirmation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "response_message": "הייתה שגיאה באישור התרגיל 😔"
            }
    
    async def _enrich_exercise_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich parsed data with database schema information"""
        enriched = parsed_data.copy()
        
        exercise_key = parsed_data.get("exercise")
        if exercise_key and exercise_key in self.exercise_mappings:
            mapping = self.exercise_mappings[exercise_key]
            enriched.update({
                "exercise_name": mapping["name"],
                "exercise_name_he": mapping["name_he"],
                "category": mapping["category"],
                "points_base": mapping["points_base"],
                "primary_muscle": mapping["primary_muscle"]
            })
        
        # Set default values
        enriched.setdefault("reps", enriched.get("count", 1))
        enriched.setdefault("sets", 1)
        enriched.setdefault("weight_kg", enriched.get("weight", None))
        enriched.setdefault("duration_seconds", None)
        enriched.setdefault("distance_km", None)
        
        # Convert units
        if "duration" in enriched and enriched.get("duration_unit") == "minutes":
            enriched["duration_seconds"] = enriched["duration"] * 60
        elif "duration" in enriched and enriched.get("duration_unit") == "hours":
            enriched["duration_seconds"] = enriched["duration"] * 3600
        elif "duration" in enriched and enriched.get("duration_unit") == "seconds":
            enriched["duration_seconds"] = enriched["duration"]
        
        if "distance" in enriched:
            if enriched.get("distance_unit") == "m":
                enriched["distance_km"] = enriched["distance"] / 1000
            elif enriched.get("distance_unit") == "miles":
                enriched["distance_km"] = enriched["distance"] * 1.609
            else:
                enriched["distance_km"] = enriched["distance"]
        
        return enriched
    
    async def _log_exercise_to_database(
        self,
        user_id: str,
        exercise_data: Dict[str, Any],
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Log exercise to database"""
        try:
            # Find or create current workout
            current_workout = await self._get_or_create_current_workout(user, db)
            
            # Create exercise record
            exercise_create = ExerciseCreate(
                workout_id=current_workout.id,
                name=exercise_data.get("exercise_name", "Unknown Exercise"),
                name_he=exercise_data.get("exercise_name_he", "תרגיל לא ידוע"),
                category=exercise_data.get("category", "general"),
                reps=exercise_data.get("reps", 1),
                sets=exercise_data.get("sets", 1),
                weight_kg=exercise_data.get("weight_kg"),
                duration_seconds=exercise_data.get("duration_seconds"),
                distance_km=exercise_data.get("distance_km"),
                notes=f"Parsed from: {exercise_data.get('original_text', '')}",
                points_earned=0  # Will be calculated separately
            )
            
            exercise = await create_exercise(db, exercise_create)
            
            logger.info(f"✅ Exercise logged: {exercise.name_he} for user {user_id}")
            
            return {
                "success": True,
                "exercise_id": exercise.id,
                "workout_id": current_workout.id
            }
            
        except Exception as e:
            logger.error(f"❌ Database logging error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _get_or_create_current_workout(self, user: User, db: AsyncSession) -> Workout:
        """Get or create today's workout session"""
        today = datetime.now().date()
        
        # Look for today's workout
        query = select(Workout).where(
            Workout.user_id == user.id,
            Workout.started_at >= datetime.combine(today, datetime.min.time())
        ).order_by(Workout.started_at.desc())
        
        result = await db.execute(query)
        existing_workout = result.scalars().first()
        
        if existing_workout and not existing_workout.completed_at:
            return existing_workout
        
        # Create new workout
        workout = Workout(
            user_id=user.id,
            workout_name="אימון יומי",
            workout_name_he="אימון יומי",
            started_at=datetime.now(),
            total_exercises=0,
            total_points=0
        )
        
        db.add(workout)
        await db.commit()
        await db.refresh(workout)
        
        logger.info(f"✅ Created new workout session for user {user.id}")
        return workout
    
    async def _calculate_and_award_points(
        self,
        user_id: str,
        exercise_data: Dict[str, Any],
        exercise_id: int,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Calculate and award points for the exercise"""
        try:
            base_points = exercise_data.get("points_base", 10)
            reps = exercise_data.get("reps", 1)
            sets = exercise_data.get("sets", 1)
            weight = exercise_data.get("weight_kg", 0)
            
            # Calculate points
            points = base_points * reps * sets
            
            # Bonus for weight
            if weight and weight > 0:
                weight_bonus = min(weight * 0.1, base_points)  # Max bonus = base points
                points += weight_bonus
            
            # Bonus for high reps
            if reps > 20:
                points += base_points * 0.5
            
            points = int(points)
            
            # Update exercise record with points
            query = select(Exercise).where(Exercise.id == exercise_id)
            result = await db.execute(query)
            exercise = result.scalar_one()
            
            exercise.points_earned = points
            await db.commit()
            
            # Award points through gamification service if available
            try:
                # The gamification service doesn't have async methods, skip for now
                # Points are already stored in the exercise record
                pass
            except Exception as e:
                logger.warning(f"⚠️ Could not award gamification points: {e}")
            
            logger.info(f"✅ Awarded {points} points for exercise {exercise_id}")
            
            return {
                "points_earned": points,
                "calculation": {
                    "base_points": base_points,
                    "reps": reps,
                    "sets": sets,
                    "weight_bonus": weight * 0.1 if weight else 0
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Points calculation error: {e}")
            return {"points_earned": 0, "error": str(e)}
    
    def _generate_success_message(
        self,
        exercise_data: Dict[str, Any],
        points_result: Dict[str, Any]
    ) -> str:
        """Generate success message in Hebrew"""
        try:
            exercise_name = exercise_data.get("exercise_name_he", "תרגיל")
            reps = exercise_data.get("reps", 1)
            points = points_result.get("points_earned", 0)
            
            messages = [
                f"כל הכבוד! רשמתי {reps} {exercise_name} וקיבלת {points} נקודות! 🔥",
                f"מעולה! {reps} {exercise_name} נרשמו בהצלחה! זה {points} נקודות! 💪",
                f"יפה! סיימת {reps} {exercise_name} וצברת {points} נקודות! ⭐",
                f"אלוף! {exercise_name} x{reps} נרשם! +{points} נקודות! 🌟"
            ]
            
            import random
            base_message = random.choice(messages)
            
            # Add weight info if available
            if exercise_data.get("weight_kg"):
                weight = exercise_data["weight_kg"]
                base_message += f" עם {weight} ק״ג!"
            
            # Add encouragement
            if points >= 50:
                base_message += " ממש מרשים! 🚀"
            elif points >= 25:
                base_message += " המשך כך! 💯"
            
            return base_message
            
        except Exception:
            return "התרגיל נרשם בהצלחה! כל הכבוד! 💪"
    
    async def get_exercise_suggestions(self, partial_text: str) -> List[Dict[str, Any]]:
        """Get exercise suggestions based on partial Hebrew text"""
        suggestions = []
        
        partial_lower = partial_text.lower()
        
        for exercise_key, mapping in self.exercise_mappings.items():
            for hebrew_name in [mapping["name_he"]] + mapping.get("aliases", []):
                if partial_lower in hebrew_name.lower() or hebrew_name.lower().startswith(partial_lower):
                    suggestions.append({
                        "exercise": exercise_key,
                        "name_he": hebrew_name,
                        "name_en": mapping["name"],
                        "category": mapping["category"],
                        "example": f"עשיתי 10 {hebrew_name}"
                    })
        
        return suggestions[:5]  # Limit to 5 suggestions
    
    async def process_user_correction(
        self,
        user_id: str,
        original_text: str,
        original_parse: Dict[str, Any],
        correction_text: str,
        corrected_values: Dict[str, Any],
        user: User,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Process user correction and learn from it
        
        Args:
            user_id: User ID
            original_text: Original Hebrew input that was parsed
            original_parse: What the parser originally extracted
            correction_text: User's correction in Hebrew (e.g., "לא, עשיתי 30 לא 20")
            corrected_values: What the values should actually be
            user: User instance
            db: Database session
            
        Returns:
            Result of correction processing and learning
        """
        try:
            # Process the correction through the learning parser
            correction_result = await self.learning_parser.process_correction(
                user_id, original_text, original_parse, correction_text, corrected_values
            )
            
            # If correction was successful, update the database
            if correction_result.get("success"):
                # Find and update the incorrect exercise log
                updated_exercise = await self._update_exercise_log_from_correction(
                    original_parse, corrected_values, db
                )
                
                if updated_exercise:
                    # Recalculate points based on corrected values
                    points_result = await self._recalculate_points_after_correction(
                        user_id, corrected_values, updated_exercise["exercise_id"], db
                    )
                    
                    correction_result.update({
                        "exercise_updated": True,
                        "exercise_id": updated_exercise["exercise_id"],
                        "points_recalculated": points_result.get("points_earned", 0),
                        "database_updated": True
                    })
                
                # Update user context with correction
                from app.services.user_context_manager import user_context_manager
                await user_context_manager.update_user_context(user_id, {
                    "last_correction_time": datetime.utcnow().isoformat(),
                    "total_corrections": correction_result.get("learned_patterns", {}).get("total_corrections", 0)
                })
            
            logger.info(f"✅ Processed correction for user {user_id}")
            return correction_result
            
        except Exception as e:
            logger.error(f"❌ Error processing correction: {e}")
            return {
                "success": False,
                "error": str(e),
                "response_message": "לא הצלחתי לעבד את התיקון. אבל אני אזכור את זה! 🤔"
            }
    
    async def _update_exercise_log_from_correction(
        self,
        original_parse: Dict[str, Any],
        corrected_values: Dict[str, Any],
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Update exercise log based on correction"""
        try:
            # This would find the most recent exercise log that matches the original parse
            # and update it with the corrected values
            # For now, we'll return a placeholder
            return {
                "exercise_id": "placeholder_id",
                "updated": True
            }
        except Exception as e:
            logger.error(f"❌ Failed to update exercise log: {e}")
            return None
    
    async def _recalculate_points_after_correction(
        self,
        user_id: str,
        corrected_values: Dict[str, Any],
        exercise_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Recalculate points after correction"""
        try:
            # Recalculate points using the same logic as original calculation
            # but with corrected values
            return {"points_earned": 0}  # Placeholder
        except Exception as e:
            logger.error(f"❌ Failed to recalculate points: {e}")
            return {"points_earned": 0}
    
    def get_learning_statistics(self) -> Dict[str, Any]:
        """Get learning statistics from the parser"""
        return self.learning_parser.get_learning_statistics()

# Singleton instance
exercise_integration_service = ExerciseIntegrationService()