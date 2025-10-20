"""
User Onboarding Service for SweatBot
Handles one-time setup flow to capture preferences and reduce future questioning
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_context_manager import user_context_manager
from app.models.models import User

logger = logging.getLogger(__name__)

class UserOnboardingService:
    """
    Service to handle user onboarding and preference collection
    Reduces future AI questioning by capturing key information upfront
    """
    
    def __init__(self):
        self.onboarding_questions = {
            "fitness_level": {
                "question": "מה רמת הכושר שלך?",
                "options": ["מתחיל", "בינוני", "מתקדם", "מקצועי"],
                "english_map": {"מתחיל": "beginner", "בינוני": "intermediate", "מתקדם": "advanced", "מקצועי": "expert"}
            },
            "preferred_exercises": {
                "question": "איזה תרגילים אתה הכי אוהב?",
                "options": ["סקוואטים", "שכיבות סמיכה", "דדליפט", "ברפי", "משיכות", "ריצה", "אחר"],
                "multi_select": True
            },
            "workout_frequency": {
                "question": "כמה פעמים בשבוע אתה מתאמן?",
                "options": ["1-2 פעמים", "3-4 פעמים", "5-6 פעמים", "יומי"],
                "english_map": {"1-2 פעמים": "1-2", "3-4 פעמים": "3-4", "5-6 פעמים": "5-6", "יומי": "daily"}
            },
            "primary_goals": {
                "question": "מה המטרות העיקריות שלך?",
                "options": ["ירידה במשקל", "עלייה במסה", "שיפור כושר", "חיטוב", "בריאות כללית"],
                "multi_select": True
            },
            "time_availability": {
                "question": "כמה זמן יש לך לאימון?",
                "options": ["15-30 דקות", "30-45 דקות", "45-60 דקות", "יותר משעה"],
                "english_map": {"15-30 דקות": "15-30", "30-45 דקות": "30-45", "45-60 דקות": "45-60", "יותר משעה": "60+"}
            },
            "communication_style": {
                "question": "איך אתה מעדיף שאני אדבר איתך?",
                "options": ["קצר ולעניין", "מפורט ומסביר", "מעודד ואנרגטי", "רגוע ותומך"],
                "english_map": {
                    "קצר ולעניין": "concise", 
                    "מפורט ומסביר": "detailed", 
                    "מעודד ואנרגטי": "energetic", 
                    "רגוע ותומך": "supportive"
                }
            }
        }
    
    async def is_user_onboarded(self, user_id: str, db: AsyncSession) -> bool:
        """Check if user has completed onboarding"""
        try:
            context = await user_context_manager.get_user_context(user_id)
            if not context:
                return False
            
            onboarding_data = context.get("onboarding", {})
            is_completed = onboarding_data.get("completed", False)
            
            # Log for debugging
            if is_completed:
                logger.info(f"✅ User {user_id} is onboarded (reason: {onboarding_data.get('skip_reason', 'completed')})")
            
            return is_completed
            
        except Exception as e:
            logger.error(f"Error checking onboarding status: {e}")
            return False
    
    async def get_onboarding_progress(self, user_id: str) -> Dict[str, Any]:
        """Get current onboarding progress for user"""
        try:
            context = await user_context_manager.get_user_context(user_id)
            if not context:
                return {"step": 1, "total_steps": len(self.onboarding_questions), "completed": False}
            
            onboarding_data = context.get("onboarding", {})
            completed_questions = len(onboarding_data.get("answers", {}))
            
            return {
                "step": completed_questions + 1,
                "total_steps": len(self.onboarding_questions),
                "completed": onboarding_data.get("completed", False),
                "answers": onboarding_data.get("answers", {})
            }
            
        except Exception as e:
            logger.error(f"Error getting onboarding progress: {e}")
            return {"step": 1, "total_steps": len(self.onboarding_questions), "completed": False}
    
    async def get_next_question(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the next onboarding question for user"""
        try:
            progress = await self.get_onboarding_progress(user_id)
            
            if progress["completed"]:
                return None
            
            # Get current step
            current_step = progress["step"]
            question_keys = list(self.onboarding_questions.keys())
            
            if current_step > len(question_keys):
                return None
            
            question_key = question_keys[current_step - 1]
            question_data = self.onboarding_questions[question_key]
            
            return {
                "step": current_step,
                "total_steps": len(question_keys),
                "question_key": question_key,
                "question": question_data["question"],
                "options": question_data["options"],
                "multi_select": question_data.get("multi_select", False),
                "progress_percentage": int((current_step - 1) / len(question_keys) * 100)
            }
            
        except Exception as e:
            logger.error(f"Error getting next question: {e}")
            return None
    
    async def save_answer(self, user_id: str, question_key: str, answer: Any) -> Dict[str, Any]:
        """Save user's answer to onboarding question"""
        try:
            context = await user_context_manager.get_user_context(user_id)
            if not context:
                # Initialize user context if needed
                context = await user_context_manager.build_initial_user_context(
                    user=None,  # We don't have user object here, will be handled in context manager
                    db=None,
                    user_id=user_id
                )
            
            # Initialize onboarding data if needed
            if "onboarding" not in context:
                context["onboarding"] = {"answers": {}, "completed": False, "started_at": datetime.utcnow().isoformat()}
            
            # Save the answer
            context["onboarding"]["answers"][question_key] = answer
            
            # Check if all questions are answered
            total_questions = len(self.onboarding_questions)
            answered_questions = len(context["onboarding"]["answers"])
            
            if answered_questions >= total_questions:
                context["onboarding"]["completed"] = True
                context["onboarding"]["completed_at"] = datetime.utcnow().isoformat()
                
                # Process answers into user profile
                await self._process_onboarding_completion(user_id, context)
            
            # Update context
            await user_context_manager.store_user_context(user_id, context)
            
            return {
                "success": True,
                "progress": answered_questions,
                "total": total_questions,
                "completed": context["onboarding"]["completed"]
            }
            
        except Exception as e:
            logger.error(f"Error saving onboarding answer: {e}")
            return {"success": False, "error": str(e)}
    
    async def _process_onboarding_completion(self, user_id: str, context: Dict[str, Any]) -> None:
        """Process completed onboarding into user fitness profile"""
        try:
            answers = context["onboarding"]["answers"]
            
            # Create comprehensive fitness profile
            fitness_profile = {
                "fitness_level": self._map_answer("fitness_level", answers.get("fitness_level", "")),
                "preferred_exercises": answers.get("preferred_exercises", []),
                "workout_frequency": self._map_answer("workout_frequency", answers.get("workout_frequency", "")),
                "primary_goals": answers.get("primary_goals", []),
                "time_availability": self._map_answer("time_availability", answers.get("time_availability", "")),
                "communication_style": self._map_answer("communication_style", answers.get("communication_style", "")),
                "onboarded_at": datetime.utcnow().isoformat()
            }
            
            # Update context with fitness profile
            context["fitness_profile"] = fitness_profile
            
            # Set up personalized coaching preferences
            context["coaching_preferences"] = {
                "avoid_excessive_questions": True,  # Key setting based on user feedback
                "prefer_quick_confirmations": True,
                "auto_log_exercises": True,
                "celebration_style": fitness_profile["communication_style"],
                "workout_suggestions": fitness_profile["preferred_exercises"][:3]  # Top 3 preferred
            }
            
            logger.info(f"✅ User {user_id} onboarding completed with profile: {fitness_profile}")
            
        except Exception as e:
            logger.error(f"Error processing onboarding completion: {e}")
    
    def _map_answer(self, question_key: str, answer: str) -> str:
        """Map Hebrew answer to English value if mapping exists"""
        question_data = self.onboarding_questions.get(question_key, {})
        english_map = question_data.get("english_map", {})
        return english_map.get(answer, answer)
    
    async def get_personalized_system_prompt_addition(self, user_id: str) -> str:
        """Get personalized system prompt addition based on onboarding"""
        try:
            context = await user_context_manager.get_user_context(user_id)
            if not context:
                logger.debug(f"No context found for user {user_id}")
                return ""
            
            # Check if user has onboarding/preferences set
            onboarding_data = context.get("onboarding", {})
            if not onboarding_data.get("completed", False):
                logger.debug(f"User {user_id} has not completed onboarding")
                return ""
            
            fitness_profile = context.get("fitness_profile", {})
            coaching_prefs = context.get("coaching_preferences", {})
            
            logger.info(f"🎯 Loading personalized preferences for user {user_id}")
            
            # Build personalized prompt addition
            prompt_addition = f"\n\n🎯 הגדרות אישיות עבור המשתמש:\n"
            
            # Add fitness level context
            fitness_level = fitness_profile.get("fitness_level", "")
            if fitness_level:
                prompt_addition += f"- רמת כושר: {fitness_level}\n"
            
            # Add communication style
            comm_style = fitness_profile.get("communication_style", "")
            if comm_style == "concise":
                prompt_addition += "- סגנון: תשובות קצרות ומהירות (1 משפט מקסימום)\n"
            elif comm_style == "energetic":
                prompt_addition += "- סגנון: אנרגטי ומעודד עם יותר אמוג'י\n"
            elif comm_style == "supportive":
                prompt_addition += "- סגנון: תומך ורגוע, פחות לחץ\n"
            
            # Add exercise preferences
            preferred = fitness_profile.get("preferred_exercises", [])
            if preferred:
                prompt_addition += f"- תרגילים מועדפים: {', '.join(preferred[:3])}\n"
            
            # Critical: Add no-questioning preference
            if coaching_prefs.get("avoid_excessive_questions", False):
                prompt_addition += "🚨 חשוב מאוד: המשתמש לא אוהב שאלות מיותרות - תאשר פעולות מיד!\n"
            
            return prompt_addition
            
        except Exception as e:
            logger.error(f"Error getting personalized prompt: {e}")
            return ""
    
    async def skip_onboarding(self, user_id: str, reason: str = "user_choice") -> Dict[str, Any]:
        """Allow user to skip onboarding with default settings"""
        try:
            context = await user_context_manager.get_user_context(user_id)
            if not context:
                context = {}
            
            # Set default preferences optimized for minimal questioning
            context["onboarding"] = {
                "completed": True,
                "skipped": True,
                "skipped_at": datetime.utcnow().isoformat(),
                "skip_reason": reason
            }
            
            # Default fitness profile for users who skip
            context["fitness_profile"] = {
                "fitness_level": "intermediate",  # Safe default
                "communication_style": "concise",  # Most users prefer this
                "onboarded_at": datetime.utcnow().isoformat()
            }
            
            # Critical: Set anti-questioning preferences
            context["coaching_preferences"] = {
                "avoid_excessive_questions": True,
                "prefer_quick_confirmations": True,
                "auto_log_exercises": True,
                "celebration_style": "concise"
            }
            
            await user_context_manager.store_user_context(user_id, context)
            
            logger.info(f"✅ User {user_id} skipped onboarding with defaults")
            
            return {"success": True, "message": "הגדרות ברירת מחדל נשמרו בהצלחה"}
            
        except Exception as e:
            logger.error(f"Error skipping onboarding: {e}")
            return {"success": False, "error": str(e)}

# Global service instance
user_onboarding_service = UserOnboardingService()