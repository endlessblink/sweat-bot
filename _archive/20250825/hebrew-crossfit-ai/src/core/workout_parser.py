"""
Hebrew Workout Parser and Data Logger
Parses Hebrew and English workout commands and logs to Google Sheets
"""

import re
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
from dataclasses import dataclass
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class WorkoutData:
    """Structured workout data"""
    exercise: str
    exercise_he: Optional[str]
    sets: int
    reps: int
    weight: Optional[float]
    duration: Optional[int]  # in seconds
    distance: Optional[float]  # in meters
    calories: Optional[int]
    notes: Optional[str]
    timestamp: datetime
    language: str


class HebrewWorkoutParser:
    """Parse workout commands in Hebrew and English"""
    
    def __init__(self):
        # Exercise dictionary (Hebrew -> English)
        self.exercise_dict = {
            # Strength exercises
            "שכיבות סמיכה": "push-ups",
            "שכיבות": "push-ups",
            "מתח": "pull-ups",
            "עליות מתח": "pull-ups",
            "כפיפות בטן": "sit-ups",
            "בטן": "abs",
            "סקוואט": "squats",
            "סקוואטים": "squats",
            "דדליפט": "deadlift",
            "דד ליפט": "deadlift",
            "לחיצת כתפיים": "shoulder press",
            "לחיצת חזה": "bench press",
            "בנץ'": "bench press",
            "חתירה": "rowing",
            "תרגילי גב": "back exercises",
            
            # Cardio
            "ריצה": "running",
            "רצתי": "running",
            "רץ": "running", 
            "הליכה": "walking",
            "אופניים": "cycling",
            "רכיבה": "cycling",
            "חתירה": "rowing",
            "קפיצות חבל": "jump rope",
            "ברפיז": "burpees",
            "ברפי": "burpees",
            
            # CrossFit specific
            "סנאטץ'": "snatch",
            "קלין": "clean",
            "ג'רק": "jerk",
            "קלין אנד ג'רק": "clean and jerk",
            "וול בול": "wall balls",
            "כדור קיר": "wall balls",
            "קופסה": "box jumps",
            "קפיצות קופסה": "box jumps",
            "טרסטרס": "thrusters",
            "קטלבל": "kettlebell",
            "קטלבל סווינג": "kettlebell swings"
        }
        
        # Hebrew number words
        self.hebrew_numbers = {
            "אחת": 1, "אחד": 1, "שתיים": 2, "שניים": 2, "שלוש": 3, "שלושה": 3,
            "ארבע": 4, "ארבעה": 4, "חמש": 5, "חמישה": 5, "שש": 6, "שישה": 6,
            "שבע": 7, "שבעה": 7, "שמונה": 8, "תשע": 9, "תשעה": 9, "עשר": 10,
            "עשרה": 10, "עשרים": 20, "שלושים": 30, "ארבעים": 40, "חמישים": 50,
            "שישים": 60, "שבעים": 70, "שמונים": 80, "תשעים": 90, "מאה": 100
        }
        
        # Unit mappings
        self.weight_units = {
            "קילו": "kg", "ק\"ג": "kg", "קג": "kg", "kg": "kg",
            "פאונד": "lbs", "ליברות": "lbs", "lbs": "lbs", "lb": "lbs"
        }
        
        self.distance_units = {
            "מטר": "m", "מטרים": "m", "מ'": "m", "m": "m",
            "קילומטר": "km", "ק\"מ": "km", "קמ": "km", "km": "km",
            "מייל": "miles", "מיילים": "miles"
        }
    
    def is_question_about_exercise(self, text: str) -> bool:
        """Check if text is asking about exercises rather than logging"""
        question_words = [
            # Hebrew question words
            "איך", "מה", "איזה", "איפה", "מתי", "למה", "כמה", "מי",
            "צריך", "רוצה", "אפשר", "כדי", "בשביל", "להתחיל",
            # English question words  
            "how", "what", "which", "where", "when", "why", "who",
            "should", "can", "want", "need", "to", "for", "start"
        ]
        
        text_lower = text.lower()
        return any(word in text_lower for word in question_words)
    
    def parse_workout_command(self, text: str, language: str = "auto") -> Optional[WorkoutData]:
        """
        Parse workout command from text
        
        Args:
            text: Input text in Hebrew or English
            language: Language hint (he/en/auto)
            
        Returns:
            WorkoutData object or None if parsing fails
        """
        # Check if this is a question rather than a workout log
        if self.is_question_about_exercise(text):
            return None  # Don't parse questions as workouts
        
        # Detect language if auto
        if language == "auto":
            language = self._detect_language(text)
        
        # Normalize text
        text = text.strip().lower()
        
        # Parse based on language
        if language == "he":
            return self._parse_hebrew_workout(text)
        else:
            return self._parse_english_workout(text)
    
    def _detect_language(self, text: str) -> str:
        """Detect if text is Hebrew or English"""
        hebrew_chars = set('אבגדהוזחטיכלמנסעפצקרשת')
        if any(char in hebrew_chars for char in text):
            return "he"
        return "en"
    
    def _parse_hebrew_workout(self, text: str) -> Optional[WorkoutData]:
        """Parse Hebrew workout command"""
        # Initialize data
        exercise_he = None
        exercise_en = None
        sets = 1
        reps = 0
        weight = None
        duration = None
        distance = None
        
        # Find exercise
        for hebrew_ex, english_ex in self.exercise_dict.items():
            if hebrew_ex in text:
                exercise_he = hebrew_ex
                exercise_en = english_ex
                break
        
        if not exercise_en:
            logger.warning(f"Could not identify exercise in: {text}")
            return None
        
        # Extract numbers
        numbers = self._extract_numbers_hebrew(text)
        
        # Parse patterns
        # Pattern: "20 שכיבות סמיכה"
        if len(numbers) == 1:
            reps = numbers[0]
        
        # Pattern: "3 סטים של 10 סקוואט עם 100 קילו"
        elif "סטים" in text or "סט" in text:
            if len(numbers) >= 2:
                sets = numbers[0]
                reps = numbers[1]
                if len(numbers) >= 3 and any(unit in text for unit in self.weight_units):
                    weight = numbers[2]
        
        # Pattern: "דדליפט 5 חזרות 150 קילו"
        elif "חזרות" in text:
            reps_match = re.search(r'(\d+)\s*חזרות', text)
            if reps_match:
                reps = int(reps_match.group(1))
            
            # Look for weight
            for unit in self.weight_units:
                weight_match = re.search(rf'(\d+\.?\d*)\s*{unit}', text)
                if weight_match:
                    weight = float(weight_match.group(1))
                    break
        
        # Pattern: "רצתי 5 קילומטר"
        if exercise_en in ["running", "walking", "cycling"]:
            # Extract distance
            for unit in self.distance_units:
                dist_match = re.search(rf'(\d+\.?\d*)\s*{unit}', text)
                if dist_match:
                    distance = float(dist_match.group(1))
                    # Convert to meters if needed
                    if unit in ["קילומטר", "ק\"מ", "קמ", "km"]:
                        distance *= 1000
                    break
            
            # If no reps for cardio, set to 1 (for tracking purposes)
            if reps == 0:
                reps = 1
        
        return WorkoutData(
            exercise=exercise_en,
            exercise_he=exercise_he,
            sets=sets,
            reps=reps,
            weight=weight,
            duration=duration,
            distance=distance,
            calories=None,
            notes=None,
            timestamp=datetime.now(),
            language="he"
        )
    
    def _parse_english_workout(self, text: str) -> Optional[WorkoutData]:
        """Parse English workout command"""
        # Common patterns
        patterns = [
            # "20 push-ups"
            r'(\d+)\s+(\w+[-\s]?\w*)',
            # "3 sets of 10 squats"
            r'(\d+)\s+sets?\s+of\s+(\d+)\s+(\w+[-\s]?\w*)',
            # "deadlift 5 reps 315 lbs"
            r'(\w+[-\s]?\w*)\s+(\d+)\s+reps?\s+(\d+)\s*(kg|lbs)?',
            # "bench press 3x8 225lbs"
            r'(\w+[-\s]?\w*)\s+(\d+)x(\d+)\s+(\d+)\s*(kg|lbs)?'
        ]
        
        # Try each pattern
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                # Parse based on pattern...
                # Implementation similar to Hebrew parsing
        
        # Simplified parsing for now
        exercise = None
        sets = 1
        reps = 0
        weight = None
        
        # Find exercise name
        for word in ["push-ups", "pull-ups", "squats", "deadlift", "bench press",
                     "running", "cycling", "burpees", "wall balls"]:
            if word in text:
                exercise = word
                break
        
        if not exercise:
            return None
        
        # Extract numbers
        numbers = [int(n) for n in re.findall(r'\d+', text)]
        if numbers:
            reps = numbers[0]
            if len(numbers) > 1:
                weight = float(numbers[1])
        
        return WorkoutData(
            exercise=exercise,
            exercise_he=None,
            sets=sets,
            reps=reps,
            weight=weight,
            duration=None,
            distance=None,
            calories=None,
            notes=None,
            timestamp=datetime.now(),
            language="en"
        )
    
    def _extract_numbers_hebrew(self, text: str) -> List[int]:
        """Extract numbers from Hebrew text (both digits and words)"""
        numbers = []
        
        # Extract digit numbers
        digit_numbers = re.findall(r'\d+', text)
        numbers.extend([int(n) for n in digit_numbers])
        
        # Extract Hebrew word numbers
        for word, value in self.hebrew_numbers.items():
            if word in text:
                numbers.append(value)
        
        return sorted(numbers)


class WorkoutDataLogger:
    """Log workout data to Google Sheets and local storage"""
    
    def __init__(self, credentials_file: Optional[str] = None):
        self.credentials_file = credentials_file or "credentials.json"
        self.gc = None
        self.sheet = None
        self.local_backup_file = "workout_backup.json"
        
        # Initialize Google Sheets if credentials exist
        if os.path.exists(self.credentials_file):
            self._init_google_sheets()
    
    def _init_google_sheets(self):
        """Initialize Google Sheets connection"""
        try:
            scope = ['https://spreadsheets.google.com/feeds',
                     'https://www.googleapis.com/auth/drive']
            
            creds = Credentials.from_service_account_file(self.credentials_file, scopes=scope)
            self.gc = gspread.authorize(creds)
            
            # Create or open spreadsheet
            try:
                self.sheet = self.gc.open("Hebrew_CrossFit_Tracker")
            except gspread.SpreadsheetNotFound:
                self.sheet = self.gc.create("Hebrew_CrossFit_Tracker")
                self._setup_sheet_headers()
            
            logger.info("Google Sheets initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets: {e}")
    
    def _setup_sheet_headers(self):
        """Setup sheet headers"""
        if self.sheet:
            worksheet = self.sheet.sheet1
            headers = [
                "Date", "Time", "Exercise", "Exercise_Hebrew", "Sets", "Reps", 
                "Weight_kg", "Duration_sec", "Distance_m", "Calories", 
                "Notes", "Language"
            ]
            worksheet.append_row(headers)
    
    def log_workout(self, workout_data: WorkoutData) -> bool:
        """
        Log workout data to Google Sheets and local backup
        
        Returns:
            True if successful, False otherwise
        """
        # Prepare row data
        row_data = [
            workout_data.timestamp.strftime("%Y-%m-%d"),
            workout_data.timestamp.strftime("%H:%M:%S"),
            workout_data.exercise,
            workout_data.exercise_he or "",
            workout_data.sets,
            workout_data.reps,
            workout_data.weight or "",
            workout_data.duration or "",
            workout_data.distance or "",
            workout_data.calories or "",
            workout_data.notes or "",
            workout_data.language
        ]
        
        # Try Google Sheets first
        if self.sheet:
            try:
                worksheet = self.sheet.sheet1
                worksheet.append_row(row_data)
                logger.info("Workout logged to Google Sheets")
            except Exception as e:
                logger.error(f"Failed to log to Google Sheets: {e}")
        
        # Always save to local backup
        self._save_local_backup(workout_data)
        
        return True
    
    def _save_local_backup(self, workout_data: WorkoutData):
        """Save workout data to local JSON backup"""
        try:
            # Load existing data
            if os.path.exists(self.local_backup_file):
                with open(self.local_backup_file, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
            else:
                backup_data = []
            
            # Add new workout
            workout_dict = {
                "timestamp": workout_data.timestamp.isoformat(),
                "exercise": workout_data.exercise,
                "exercise_he": workout_data.exercise_he,
                "sets": workout_data.sets,
                "reps": workout_data.reps,
                "weight": workout_data.weight,
                "duration": workout_data.duration,
                "distance": workout_data.distance,
                "calories": workout_data.calories,
                "notes": workout_data.notes,
                "language": workout_data.language
            }
            backup_data.append(workout_dict)
            
            # Save updated data
            with open(self.local_backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2)
            
            logger.info("Workout saved to local backup")
        except Exception as e:
            logger.error(f"Failed to save local backup: {e}")
    
    def get_workout_history(self, days: int = 30, exercise: Optional[str] = None) -> List[Dict]:
        """Get workout history from storage"""
        history = []
        
        # Try Google Sheets first
        if self.sheet:
            try:
                worksheet = self.sheet.sheet1
                all_values = worksheet.get_all_values()[1:]  # Skip header
                
                for row in all_values:
                    workout = {
                        "date": row[0],
                        "time": row[1],
                        "exercise": row[2],
                        "exercise_he": row[3],
                        "sets": int(row[4]) if row[4] else 0,
                        "reps": int(row[5]) if row[5] else 0,
                        "weight": float(row[6]) if row[6] else None,
                        "duration": int(row[7]) if row[7] else None,
                        "distance": float(row[8]) if row[8] else None,
                        "calories": int(row[9]) if row[9] else None,
                        "notes": row[10],
                        "language": row[11]
                    }
                    
                    # Filter by exercise if specified
                    if not exercise or workout["exercise"] == exercise:
                        history.append(workout)
                
            except Exception as e:
                logger.error(f"Failed to get history from Google Sheets: {e}")
        
        # Fallback to local backup
        if not history and os.path.exists(self.local_backup_file):
            with open(self.local_backup_file, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)
                history = backup_data[-days*10:]  # Approximate last N days
        
        return history


# Example usage
if __name__ == "__main__":
    # Initialize parser and logger
    parser = HebrewWorkoutParser()
    logger_service = WorkoutDataLogger()
    
    # Example Hebrew parsing
    hebrew_tests = [
        "עשיתי 20 שכיבות סמיכה",
        "3 סטים של 10 סקוואט עם 100 קילו",
        "דדליפט 5 חזרות 150 ק\"ג",
        "רצתי 5 קילומטר",
        "15 ברפיז"
    ]
    
    for test in hebrew_tests:
        result = parser.parse_workout_command(test, language="he")
        if result:
            print(f"Parsed: {test}")
            print(f"  Exercise: {result.exercise} ({result.exercise_he})")
            print(f"  Sets: {result.sets}, Reps: {result.reps}")
            print(f"  Weight: {result.weight}kg" if result.weight else "")
            print()
            
            # Log the workout
            logger_service.log_workout(result)