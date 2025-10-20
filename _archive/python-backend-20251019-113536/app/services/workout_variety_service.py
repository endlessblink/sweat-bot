"""
Workout Variety Service
Provides diverse, Hebrew-accurate workout suggestions to prevent repetition
Ensures proper Hebrew grammar and varied exercise combinations
"""

import random
import json
import os
from typing import List, Dict, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class WorkoutVarietyService:
    """
    Service to generate varied workout suggestions with proper Hebrew
    Prevents repetitive patterns and ensures language accuracy
    Uses comprehensive exercise database from ExerciseDB and custom data
    """
    
    def __init__(self):
        # Load comprehensive exercise database from JSON file
        self.exercise_database = self._load_exercise_database()
        self.workout_templates = self.exercise_database.get("workout_templates", {})
        self.hebrew_fixes = self.exercise_database.get("hebrew_fixes", {})
        
        # Track recent workouts to avoid repetition
        self.recent_workouts = []
        
    def _load_exercise_database(self) -> Dict[str, Any]:
        """Load exercise database from JSON file"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), "..", "data", "exercise_database_enhanced.json")
            with open(db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load exercise database: {e}")
            # Fallback to basic database if file not found
            return self._get_fallback_database()
    
    def _get_fallback_database(self) -> Dict[str, Any]:
        """Fallback database if JSON loading fails"""
        return {
            "categories": {
                "cardio": {
                    "exercises": [
                        {"name": "קפיצות כוכבים", "duration_type": "time", "default_duration": "30 שניות"},
                        {"name": "ריצה במקום", "duration_type": "time", "default_duration": "60 שניות"}
                    ]
                },
                "strength_upper": {
                    "exercises": [
                        {"name": "שכיבות סמיכה", "duration_type": "reps", "default_duration": "10 חזרות"},
                        {"name": "לחיצות כתפיים", "duration_type": "reps", "default_duration": "12 חזרות"}
                    ]
                },
                "strength_lower": {
                    "exercises": [
                        {"name": "סקוואטים", "duration_type": "reps", "default_duration": "15 חזרות"},
                        {"name": "לאנג'ים", "duration_type": "reps", "default_duration": "10 חזרות"}
                    ]
                },
                "core": {
                    "exercises": [
                        {"name": "פלנק", "duration_type": "time", "default_duration": "30 שניות"},
                        {"name": "כפיפות בטן", "duration_type": "reps", "default_duration": "15 חזרות"}
                    ]
                },
                "flexibility": {
                    "exercises": [
                        {"name": "מתיחות דינמיות", "duration_type": "time", "default_duration": "60 שניות"},
                        {"name": "מתיחות סטטיות", "duration_type": "time", "default_duration": "120 שניות"}
                    ]
                }
            },
            "workout_templates": {
                "5_min_break": {
                    "name": "הפסקת פעילות",
                    "duration": 5,
                    "structure": [(1, "cardio"), (1, "strength_upper"), (1, "strength_lower"), (1, "core"), (1, "flexibility")]
                },
                "10_min_break": {
                    "name": "אימון קצר",
                    "duration": 10,
                    "structure": [(2, "cardio"), (2, "strength_upper"), (2, "strength_lower"), (2, "core"), (2, "flexibility")]
                }
            },
            "hebrew_fixes": {
                "common_mistakes": {
                    "תן לי": "תנו לי",
                    "תרגיל": "תרגילים",
                    "תרגילי": "תרגילים"
                },
                "proper_grammar": {
                    "singular_to_plural": {
                        "תרגיל": "תרגילים",
                        "אימון": "אימונים",
                        "הפסקה": "הפסקות"
                    },
                    "verb_forms": {
                        "תן": "תנו",
                        "עשה": "עשו",
                        "תעשה": "תעשו"
                    }
                }
            }
        }

    def _filter_categories_by_profile(self, categories: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter exercises based on user profile preferences and equipment

        Args:
            categories: Full exercise database categories
            user_context: User profile data (equipment, goals, focus_areas, avoid_exercises, fitness_level)

        Returns:
            Filtered categories dictionary
        """
        # If no user context, return all categories
        if not user_context:
            return categories

        filtered_categories = {}

        # Extract profile preferences
        available_equipment = user_context.get('available_equipment', {})
        fitness_goals = user_context.get('fitness_goals', [])
        focus_areas = user_context.get('focus_areas', [])
        avoid_exercises = user_context.get('avoid_exercises', [])
        fitness_level = user_context.get('fitness_level', 'intermediate')

        # Category mapping based on focus areas
        focus_area_mapping = {
            'upper_body': ['strength_upper', 'core'],
            'lower_body': ['strength_lower', 'balance_stability'],
            'core': ['core', 'isometric'],
            'full_body': list(categories.keys())
        }

        # Goal-based category prioritization
        goal_category_mapping = {
            'weight_loss': ['cardio', 'hiit', 'low_impact'],
            'muscle_gain': ['strength_upper', 'strength_lower', 'isometric'],
            'endurance': ['cardio', 'coordination_agility'],
            'strength': ['strength_upper', 'strength_lower', 'isometric'],
            'flexibility': ['low_impact', 'balance_stability'],
            'general_fitness': list(categories.keys())
        }

        # Determine priority categories based on goals and focus areas
        priority_categories = set()
        if focus_areas:
            for area in focus_areas:
                priority_categories.update(focus_area_mapping.get(area, []))
        if fitness_goals:
            for goal in fitness_goals:
                priority_categories.update(goal_category_mapping.get(goal, []))

        # If no specific priorities, include all categories
        if not priority_categories:
            priority_categories = set(categories.keys())

        # Filter exercises within each category
        for category_name, category_data in categories.items():
            # Skip categories not in priority list
            if category_name not in priority_categories:
                continue

            exercises = category_data.get('exercises', [])
            filtered_exercises = []

            for exercise in exercises:
                exercise_name = exercise.get('name', '').lower()
                difficulty = exercise.get('difficulty', 'intermediate')

                # Skip exercises user wants to avoid
                if any(avoid_ex.lower() in exercise_name for avoid_ex in avoid_exercises):
                    continue

                # Filter by fitness level (beginners skip advanced exercises)
                if fitness_level == 'beginner' and difficulty == 'advanced':
                    continue
                elif fitness_level == 'advanced' and difficulty == 'beginner':
                    continue  # Skip too easy exercises for advanced users

                # Equipment filtering (for now, we only have no-equipment exercises)
                # In the future, check if exercise requires equipment user doesn't have
                # For now, bodyweight exercises work for everyone
                if not available_equipment.get('bodyweight', True):
                    # Skip bodyweight if explicitly disabled (rare case)
                    continue

                filtered_exercises.append(exercise)

            # Only include category if it has exercises after filtering
            if filtered_exercises:
                filtered_categories[category_name] = {
                    **category_data,
                    'exercises': filtered_exercises
                }

        # If filtering removed all exercises, fall back to original categories
        if not filtered_categories:
            logger.warning("Profile filtering removed all exercises - falling back to full database")
            return categories

        return filtered_categories

    def get_varied_break_workout(self, duration_minutes: int = 5, user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a varied workout for a break with profile-based personalization

        Args:
            duration_minutes: Length of the break in minutes
            user_context: User's fitness level, preferences, equipment, goals, etc.

        Returns:
            Dict with workout plan and proper Hebrew instructions
        """
        if user_context is None:
            user_context = {}

        # Get categories from database
        categories = self.exercise_database.get("categories", {})

        # Apply profile-based filtering
        filtered_categories = self._filter_categories_by_profile(categories, user_context)
        
        # Determine workout template
        if duration_minutes <= 5:
            structure = [(1, "cardio"), (1, "strength_upper"), (1, "strength_lower"), (1, "core"), (1, "flexibility")]
            workout_name = "הפסקת פעילות"
        elif duration_minutes <= 10:
            structure = [(2, "cardio"), (2, "strength_upper"), (2, "strength_lower"), (2, "core"), (2, "flexibility")]
            workout_name = "אימון קצר"
        else:
            structure = [(3, "cardio"), (3, "strength_upper"), (3, "strength_lower"), (3, "core"), (3, "flexibility")]
            workout_name = "אימון ממוקד"
        
        # Build workout with variety using filtered categories
        workout_exercises = []
        used_categories = set()
        used_exercises = set()

        for minutes, category in structure:
            # Skip if we already used this category too much
            if category in used_categories and len(used_categories) < len(filtered_categories):
                # Try to find an unused category
                for alt_category in filtered_categories.keys():
                    if alt_category not in used_categories and alt_category != category:
                        category = alt_category
                        break

            used_categories.add(category)

            # Get exercises from this category
            category_data = filtered_categories.get(category, {})
            exercises = category_data.get("exercises", [])
            
            # Find exercises we haven't used recently
            available_exercises = [
                ex for ex in exercises 
                if ex.get("name", "") not in used_exercises and 
                ex.get("name", "") not in self._get_recent_exercises()
            ]
            
            # If no new exercises available, use all exercises
            if not available_exercises:
                available_exercises = exercises
            
            # Select random exercise
            if available_exercises:
                selected_exercise = random.choice(available_exercises)
                used_exercises.add(selected_exercise.get("name", ""))
                
                # Determine duration based on exercise type
                duration_type = selected_exercise.get("duration_type", "reps")
                default_duration = selected_exercise.get("default_duration", f"{minutes} דקות")
                
                if duration_type == "reps":
                    instruction = f"{selected_exercise.get('name', '')} ({default_duration})"
                else:
                    instruction = f"{selected_exercise.get('name', '')} במשך {default_duration}"
                
                workout_exercises.append({
                    "exercise": selected_exercise.get("name", ""),
                    "category": category,
                    "duration_type": duration_type,
                    "default_duration": default_duration,
                    "instruction": instruction,
                    "hebrew_name": selected_exercise.get("name", ""),
                    "variations": selected_exercise.get("variations", [])
                })
        
        # Generate proper Hebrew response
        workout_plan = self._generate_hebrew_workout_response(
            workout_exercises, 
            workout_name,
            duration_minutes
        )
        
        # Store this workout to avoid immediate repetition
        self._store_recent_workout(workout_exercises)
        
        return {
            "workout_plan": workout_plan,
            "exercises": workout_exercises,
            "duration_minutes": duration_minutes,
            "hebrew_response": workout_plan
        }
    
    def _generate_hebrew_workout_response(self, exercises: List[Dict], workout_name: str, duration: int) -> str:
        """
        Generate a proper Hebrew response for the workout
        
        Args:
            exercises: List of exercise dictionaries
            workout_name: Name of the workout
            duration: Total duration in minutes
            
        Returns:
            Properly formatted Hebrew text
        """
        # Hebrew intro based on duration
        if duration <= 5:
            intro = f"מצוין! הנה רעיון להפסקה פעילה של {duration} דקות שיעניג לכם וירענן אתכם:"
        elif duration <= 10:
            intro = f"אהבה! הנה אימון ממוקד של {duration} דקות עם מגוון תרגילים:"
        else:
            intro = f"מושלם! הנה תוכנית אימונים מלאה של {duration} דקות:"
        
        # Build exercise list with proper Hebrew
        exercise_list = []
        for i, exercise in enumerate(exercises, 1):
            category = exercise.get("category", "")
            if category == "cardio":
                prefix = "🏃‍♂️"
            elif category in ["strength_upper", "strength_lower"]:
                prefix = "💪"
            elif category == "core":
                prefix = "🎯"
            elif category == "flexibility":
                prefix = "🧘‍♀️"
            else:
                prefix = "⚡"
            
            hebrew_name = exercise.get('hebrew_name', '')
            instruction = exercise.get('instruction', '')
            exercise_list.append(f"{prefix}. **{hebrew_name}** - {instruction}")
        
        # Hebrew outro with proper grammar
        outro = f"\n\nתעשו הפסקה קצרה בין התרגילים אם צריך, ותיהנו מהאנרגיה! 🌟💪"
        
        # Combine all parts
        full_response = f"{intro}\n\n" + "\n".join(exercise_list) + outro
        
        return full_response
    
    def _get_recent_exercises(self, limit: int = 20) -> set:
        """Get exercises used in recent workouts to avoid repetition"""
        recent_exercises = set()
        for workout in self.recent_workouts[-limit:]:
            for exercise in workout:
                recent_exercises.add(exercise.get("exercise", ""))
        return recent_exercises
    
    def _store_recent_workout(self, exercises: List[Dict]):
        """Store workout for future variety consideration"""
        self.recent_workouts.append(exercises)
        
        # Keep only last 10 workouts to manage memory
        if len(self.recent_workouts) > 10:
            self.recent_workouts = self.recent_workouts[-10:]
    
    def get_single_exercise_suggestion(self, category: str = None) -> Dict[str, Any]:
        """
        Get a single varied exercise suggestion
        
        Args:
            category: Specific category to focus on, or random if None
            
        Returns:
            Single exercise with proper Hebrew
        """
        categories = self.exercise_database.get("categories", {})
        
        if category and category in categories:
            exercises = categories[category].get("exercises", [])
        else:
            # Pick random category
            category = random.choice(list(categories.keys()))
            exercises = categories[category].get("exercises", [])
        
        # Avoid recent exercises
        available_exercises = [
            ex for ex in exercises 
            if ex.get("name", "") not in self._get_recent_exercises()
        ]
        
        if not available_exercises:
            available_exercises = exercises
        
        if available_exercises:
            selected = random.choice(available_exercises)
            
            return {
                "exercise": selected.get("name", ""),
                "category": category,
                "hebrew_name": selected.get("name", ""),
                "duration_type": selected.get("duration_type", ""),
                "default_duration": selected.get("default_duration", ""),
                "variations": selected.get("variations", []),
                "hebrew_instruction": f"נסו את {selected.get('name', '')} ({selected.get('default_duration', '')})"
            }
        
        return {}
    
    def validate_hebrew_grammar(self, text: str) -> Tuple[str, List[str]]:
        """
        Validate and fix common Hebrew grammar mistakes
        
        Args:
            text: Hebrew text to validate
            
        Returns:
            Tuple of (corrected_text, list_of_corrections)
        """
        corrections = []
        corrected_text = text
        
        # Common Hebrew mistakes and their corrections - focused and simple
        key_corrections = [
            ("תן לי", "תנו לי"),
            ("תעשה", "תעשו"),
            ("עשה", "עשו")
        ]
        
        for mistake, correction in key_corrections:
            if mistake in corrected_text:
                corrected_text = corrected_text.replace(mistake, correction)
                corrections.append(f"תיקון: '{mistake}' → '{correction}'")
        
        return corrected_text, corrections
    
    def get_exercise_variety_stats(self) -> Dict[str, Any]:
        """Get statistics about exercise variety"""
        categories = self.exercise_database.get("categories", {})
        total_exercises = sum(len(cat.get("exercises", [])) for cat in categories.values())
        recent_unique = len(self._get_recent_exercises())
        
        return {
            "total_exercises_available": total_exercises,
            "categories_count": len(categories),
            "recent_unique_exercises": recent_unique,
            "repetition_rate": max(0, (recent_unique - 20) / total_exercises) if total_exercises > 0 else 0,
            "recent_workouts_count": len(self.recent_workouts)
        }