"""
UI Response Processor Service
Converts PersonalSweatBotWithTools responses to structured UI data
"""

from typing import Dict, List, Any, Optional, Tuple
import re
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Exercise, User

logger = logging.getLogger(__name__)


class UIResponseProcessor:
    """Processes AI agent responses and extracts UI component data"""
    
    @staticmethod
    def extract_tool_calls(agent_response: str) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
        """
        Extract tool calls and structured data from agent response
        Returns: (tool_name, tool_result)
        """
        
        # Check for common tool patterns in response
        tool_patterns = {
            'statistics': [
                r'📊.*הסטטיסטיקות',
                r'🏆.*נקודות',
                r'💪.*אימונים',
                r'סך הכל.*נקודות'
            ],
            'exercise_logger': [
                r'✅.*נרשם',
                r'🎯.*נקודות.*עבור',
                r'מעולה.*סקוואטים',
                r'כל הכבוד.*עשית'
            ],
            'quick_actions': [
                r'מה תרצה לעשות',
                r'בוא נתחיל',
                r'איך אוכל לעזור',
                r'מה נעשה היום'
            ],
            'workout_suggester': [
                r'הצעת אימון',
                r'מומלץ.*תרגילים',
                r'נתחיל עם.*אימון',
                r'בוא נעשה.*אימון'
            ]
        }
        
        # Find which tool was likely used
        for tool_name, patterns in tool_patterns.items():
            for pattern in patterns:
                if re.search(pattern, agent_response, re.IGNORECASE):
                    logger.info(f"Detected tool usage: {tool_name}")
                    return tool_name, None
        
        return None, None
    
    @staticmethod
    def create_stats_component(agent_response: str) -> Dict[str, Any]:
        """Create stats chart component from statistics response"""
        
        # Extract numbers from Hebrew response
        points_match = re.search(r'(\d+).*נקודות', agent_response)
        workouts_match = re.search(r'(\d+).*אימונים', agent_response)
        reps_match = re.search(r'(\d+).*חזרות', agent_response)
        
        total_points = int(points_match.group(1)) if points_match else 0
        total_workouts = int(workouts_match.group(1)) if workouts_match else 0
        total_reps = int(reps_match.group(1)) if reps_match else 0
        
        # Calculate derived stats
        weekly_points = min(total_points, total_points // 4)  # Estimate weekly portion
        current_streak = min(total_workouts, 5)  # Estimate current streak
        weekly_goal = 100  # Default weekly goal
        
        # Generate recent activity data
        recent_exercises = []
        base_date = datetime.now()
        for i in range(7):
            date = base_date - timedelta(days=i)
            # Simulate some variety in daily activity
            daily_points = max(0, (total_points // 10) + (i % 3) * 5)
            daily_exercises = max(0, (total_workouts // 7) + (i % 2))
            
            recent_exercises.append({
                'date': date.strftime('%Y-%m-%d'),
                'points': daily_points,
                'exercises_count': daily_exercises
            })
        
        return {
            'type': 'stats-chart',
            'data': {
                'total_points': total_points,
                'weekly_points': weekly_points,
                'total_workouts': total_workouts,
                'weekly_workouts': min(total_workouts, 7),
                'current_streak': current_streak,
                'weekly_goal': weekly_goal,
                'recent_exercises': recent_exercises[:7]  # Last 7 days
            }
        }
    
    @staticmethod
    def create_quick_actions_component() -> Dict[str, Any]:
        """Create quick actions component"""
        return {
            'type': 'quick-actions',
            'data': {
                'actions': [
                    {
                        'label': 'רשום אימון',
                        'message': 'אני רוצה לרשום אימון',
                        'icon': '🏋️‍♂️',
                        'variant': 'primary'
                    },
                    {
                        'label': 'הצג נקודות',
                        'message': 'כמה נקודות יש לי?',
                        'icon': '📊',
                        'variant': 'secondary'
                    },
                    {
                        'label': 'הצע אימון',
                        'message': 'מה לעשות היום?',
                        'icon': '💪',
                        'variant': 'success'
                    },
                    {
                        'label': 'קבע יעד',
                        'message': 'אני רוצה לקבוע יעד חדש',
                        'icon': '🎯',
                        'variant': 'warning'
                    }
                ]
            }
        }
    
    @staticmethod
    def create_exercise_card_component(agent_response: str) -> Dict[str, Any]:
        """Create exercise card component from exercise logging response"""
        
        # Extract exercise details from Hebrew response
        exercise_match = re.search(r'(\d+).*?(סקוואטים|שכיבות|דחיפות|ריצה)', agent_response)
        points_match = re.search(r'(\d+).*נקודות', agent_response)
        
        exercise_name = "תרגיל"
        exercise_count = 1
        points_earned = 10
        
        if exercise_match:
            exercise_count = int(exercise_match.group(1))
            exercise_type = exercise_match.group(2)
            
            # Map Hebrew exercise names
            exercise_mapping = {
                'סקוואטים': 'Squats',
                'שכיבות': 'Push-ups', 
                'דחיפות': 'Push-ups',
                'ריצה': 'Running'
            }
            exercise_name = exercise_mapping.get(exercise_type, exercise_type)
        
        if points_match:
            points_earned = int(points_match.group(1))
        
        return {
            'type': 'exercise-card',
            'data': {
                'exercise_name': exercise_name,
                'exercise_name_hebrew': exercise_match.group(2) if exercise_match else "תרגיל",
                'reps': exercise_count,
                'points_earned': points_earned,
                'timestamp': datetime.now().isoformat(),
                'exercise_type': 'strength'
            }
        }
    
    @staticmethod
    def create_workout_suggestion_component(agent_response: str) -> Dict[str, Any]:
        """Create workout suggestion component"""
        
        # Extract suggested workout from response
        suggestion_patterns = [
            r'מומלץ.*?(\d+).*?(סקוואטים|שכיבות|דחיפות)',
            r'בוא נעשה.*?(\d+).*?(תרגילים|חזרות)',
            r'נתחיל עם.*?(\d+).*?(דקות|פעמים)'
        ]
        
        suggested_exercises = []
        for pattern in suggestion_patterns:
            matches = re.findall(pattern, agent_response)
            for match in matches:
                count, exercise_type = match
                suggested_exercises.append({
                    'name': exercise_type,
                    'reps': int(count),
                    'sets': 3
                })
        
        # Default workout if no specific suggestions found
        if not suggested_exercises:
            suggested_exercises = [
                {'name': 'סקוואטים', 'reps': 15, 'sets': 3},
                {'name': 'שכיבות סמך', 'reps': 10, 'sets': 3},
                {'name': 'פלאנק', 'reps': 30, 'sets': 1, 'type': 'seconds'}
            ]
        
        return {
            'type': 'workout-card',
            'data': {
                'workout_name': 'אימון מומלץ',
                'exercises': suggested_exercises,
                'estimated_duration': '15-20 דקות',
                'difficulty': 'בינוני',
                'target_muscles': ['רגליים', 'גוף עליון', 'ליבה']
            }
        }
    
    @classmethod
    def process_agent_response(
        cls, 
        agent_response: str, 
        user_message: str,
        db: Optional[AsyncSession] = None
    ) -> Tuple[str, List[Dict[str, Any]], Optional[str], Optional[Dict[str, Any]]]:
        """
        Process agent response and return UI components
        
        Returns: (response_text, ui_components, tool_called, tool_result)
        """
        
        ui_components = []
        tool_called, tool_result = cls.extract_tool_calls(agent_response)
        
        # Determine which components to generate based on response content and tool used
        should_show_stats = (
            tool_called == 'statistics' or
            any(keyword in user_message.lower() for keyword in ['נקודות', 'סטטיסטיקות', 'איך אני', 'מה המצב'])
        )
        
        should_show_exercise_card = (
            tool_called == 'exercise_logger' or
            any(keyword in user_message.lower() for keyword in ['עשיתי', 'סיימתי', 'רצתי']) or
            '✅' in agent_response or 'נרשם' in agent_response
        )
        
        should_show_quick_actions = (
            tool_called == 'quick_actions' or
            any(keyword in user_message.lower() for keyword in ['היי', 'שלום', 'מה לעשות', 'עזרה']) or
            'מה תרצה לעשות' in agent_response
        )
        
        should_show_workout_suggestion = (
            tool_called == 'workout_suggester' or
            any(keyword in user_message.lower() for keyword in ['הצע', 'מה לעשות היום', 'אימון']) or
            'מומלץ' in agent_response
        )
        
        # Generate appropriate UI components
        if should_show_stats:
            ui_components.append(cls.create_stats_component(agent_response))
        
        if should_show_exercise_card:
            ui_components.append(cls.create_exercise_card_component(agent_response))
        
        if should_show_quick_actions:
            ui_components.append(cls.create_quick_actions_component())
        
        if should_show_workout_suggestion:
            ui_components.append(cls.create_workout_suggestion_component(agent_response))
        
        logger.info(f"Generated {len(ui_components)} UI components for response")
        
        return agent_response, ui_components, tool_called, tool_result


# Global processor instance
ui_processor = UIResponseProcessor()