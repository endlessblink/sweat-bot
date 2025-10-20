"""
Hebrew Exercise Parser Service
Parses Hebrew voice commands into structured exercise data
"""

import re
from typing import Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

class HebrewParserService:
    """Service for parsing Hebrew exercise commands"""
    
    def __init__(self):
        # Exercise name mappings (Hebrew -> English)
        self.exercise_map = {
            "סקוואט": "squat",
            "סקוואטים": "squat",
            "סקווט": "squat",
            "שכיבות": "pushup",
            "שכיבות סמיכה": "pushup",
            "ברפי": "burpee",
            "ברפיז": "burpee",
            "בורפיז": "burpee",
            "משיכות": "pullup",
            "עליות מתח": "pullup",
            "בטן": "situp",
            "כפיפות בטן": "situp",
            "פלאנק": "plank",
            "קרש": "plank",
            "ריצה": "running",
            "הליכה": "walking",
            "דדליפט": "deadlift",
            "דד ליפט": "deadlift",
            "בנץ'": "bench_press",
            "לחיצת חזה": "bench_press",
            "כתפיים": "shoulder_press",
            "לחיצת כתפיים": "shoulder_press",
            "בק סקווט": "back_squat",
            "פרונט סקווט": "front_squat",
            "סקווט קדמי": "front_squat",
            "לאנג'": "lunge",
            "לאנג'ים": "lunge",
            "מקבילים": "dips",
            "טריצפס": "tricep_dips"
        }
        
        # Hebrew number words
        self.hebrew_numbers = {
            "אחד": 1, "אחת": 1,
            "שניים": 2, "שתיים": 2,
            "שלוש": 3, "שלושה": 3,
            "ארבע": 4, "ארבעה": 4,
            "חמש": 5, "חמישה": 5,
            "שש": 6, "שישה": 6,
            "שבע": 7, "שבעה": 7,
            "שמונה": 8,
            "תשע": 9, "תשעה": 9,
            "עשר": 10, "עשרה": 10,
            "עשרים": 20,
            "שלושים": 30,
            "ארבעים": 40,
            "חמישים": 50,
            "שישים": 60,
            "שבעים": 70,
            "שמונים": 80,
            "תשעים": 90,
            "מאה": 100
        }
        
        # Common Hebrew phrases for exercise logging
        self.action_phrases = [
            "עשיתי", "ביצעתי", "השלמתי", "סיימתי",
            "עשיתי", "עושה", "עשינו", "עשו"
        ]
        
        # Weight indicators
        self.weight_indicators = ["קילו", "ק\"ג", "kg", "קילוגרם"]
        
        # Time indicators
        self.time_indicators = ["שניות", "דקות", "דקה", "שנייה", "שעה"]
        
        # Distance indicators
        self.distance_indicators = ["מטר", "מטרים", "קילומטר", "ק\"מ", "km"]
    
    async def parse_exercise_command(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Parse Hebrew text for exercise information
        
        Examples:
        - "עשיתי 20 סקוואטים"
        - "ביצעתי 3 סטים של 10 שכיבות סמיכה"
        - "בק סקווט 50 קילו 5 חזרות"
        - "רצתי 5 קילומטר ב-25 דקות"
        """
        if not text:
            return None
        
        result = {}
        text_lower = text.lower()
        
        # Find exercise type
        exercise = self._extract_exercise(text_lower)
        if exercise:
            result["name"] = exercise["english"]
            result["name_he"] = exercise["hebrew"]
        
        # Extract numbers (reps, sets, weight, distance, time)
        numbers = self._extract_numbers(text_lower)
        
        # Extract weight if mentioned
        weight = self._extract_weight(text_lower, numbers)
        if weight:
            result["weight_kg"] = weight
        
        # Extract sets and reps
        sets_reps = self._extract_sets_reps(text_lower, numbers)
        if sets_reps:
            result.update(sets_reps)
        
        # Extract distance
        distance = self._extract_distance(text_lower, numbers)
        if distance:
            result["distance_km"] = distance
        
        # Extract duration
        duration = self._extract_duration(text_lower, numbers)
        if duration:
            result["duration_seconds"] = duration
        
        # Add confidence score
        if result:
            result["confidence"] = self._calculate_confidence(text_lower, result)
        
        return result if result else None
    
    def _extract_exercise(self, text: str) -> Optional[Dict[str, str]]:
        """Extract exercise name from text"""
        for hebrew, english in self.exercise_map.items():
            if hebrew in text:
                return {"hebrew": hebrew, "english": english}
        return None
    
    def _extract_numbers(self, text: str) -> list:
        """Extract all numbers from text (both digits and Hebrew words)"""
        numbers = []
        
        # Extract digit numbers
        digit_pattern = r'\d+'
        digit_matches = re.findall(digit_pattern, text)
        numbers.extend([int(n) for n in digit_matches])
        
        # Extract Hebrew word numbers
        for word, value in self.hebrew_numbers.items():
            if word in text:
                numbers.append(value)
        
        return numbers
    
    def _extract_weight(self, text: str, numbers: list) -> Optional[float]:
        """Extract weight from text"""
        for indicator in self.weight_indicators:
            if indicator in text:
                # Find the number closest to the weight indicator
                indicator_pos = text.find(indicator)
                
                # Look for number before the indicator
                text_before = text[:indicator_pos].strip()
                words_before = text_before.split()
                
                if words_before:
                    last_word = words_before[-1]
                    try:
                        return float(last_word)
                    except ValueError:
                        # Try Hebrew number
                        if last_word in self.hebrew_numbers:
                            return float(self.hebrew_numbers[last_word])
                
                # If no number found before, use the first available number
                if numbers:
                    return float(numbers[0])
        
        return None
    
    def _extract_sets_reps(self, text: str, numbers: list) -> Dict[str, int]:
        """Extract sets and reps from text"""
        result = {}
        
        # Check for explicit sets mention
        if "סט" in text or "סטים" in text:
            # Pattern: X סטים של Y חזרות
            if "של" in text and len(numbers) >= 2:
                result["sets"] = numbers[0]
                result["reps"] = numbers[1]
            elif numbers:
                result["sets"] = numbers[0]
        
        # Check for reps
        elif "חזרות" in text or "חזרה" in text:
            if numbers:
                result["reps"] = numbers[0]
                result["sets"] = 1
        
        # Default: if we have a number and an exercise, assume it's reps
        elif numbers and not any(ind in text for ind in self.weight_indicators + self.distance_indicators + self.time_indicators):
            result["reps"] = numbers[0]
            result["sets"] = 1
        
        return result
    
    def _extract_distance(self, text: str, numbers: list) -> Optional[float]:
        """Extract distance from text"""
        for indicator in self.distance_indicators:
            if indicator in text and numbers:
                # Convert to kilometers if needed
                if "מטר" in indicator and "קילו" not in indicator:
                    return numbers[0] / 1000  # Convert meters to km
                return float(numbers[0])
        return None
    
    def _extract_duration(self, text: str, numbers: list) -> Optional[int]:
        """Extract duration in seconds from text"""
        duration = 0
        
        if "שעה" in text or "שעות" in text:
            # Find number before hour indicator
            hour_match = re.search(r'(\d+)\s*שעה', text)
            if hour_match:
                duration += int(hour_match.group(1)) * 3600
        
        if "דקה" in text or "דקות" in text:
            # Find number before minute indicator
            min_match = re.search(r'(\d+)\s*דק', text)
            if min_match:
                duration += int(min_match.group(1)) * 60
        
        if "שני" in text:
            # Find number before second indicator
            sec_match = re.search(r'(\d+)\s*שני', text)
            if sec_match:
                duration += int(sec_match.group(1))
        
        # For plank, if only a number is given, assume seconds
        if duration == 0 and "פלאנק" in text and numbers:
            duration = numbers[0]
        
        return duration if duration > 0 else None
    
    def _calculate_confidence(self, text: str, parsed: Dict) -> float:
        """Calculate confidence score for parsing"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence for recognized patterns
        if parsed.get("name"):
            confidence += 0.2
        
        if any(phrase in text for phrase in self.action_phrases):
            confidence += 0.1
        
        if parsed.get("reps") or parsed.get("weight_kg"):
            confidence += 0.1
        
        if parsed.get("sets"):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def translate_exercise_name(self, english_name: str) -> str:
        """Translate English exercise name to Hebrew"""
        # Reverse lookup in the exercise map
        for hebrew, english in self.exercise_map.items():
            if english == english_name.lower().replace("_", " "):
                return hebrew
        
        # Default: return the English name
        return english_name
    
    def get_exercise_variations(self, exercise_name: str) -> list:
        """Get all variations of an exercise name (Hebrew and English)"""
        variations = [exercise_name]
        
        # Add Hebrew variations
        for hebrew, english in self.exercise_map.items():
            if english == exercise_name.lower() or hebrew == exercise_name:
                variations.append(hebrew)
                variations.append(english)
        
        return list(set(variations))  # Remove duplicates