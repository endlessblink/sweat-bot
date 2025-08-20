"""
Hebrew Exercise Command Parser Service
Flexible NLP-based parser for Hebrew exercise commands
Handles commands like "עשיתי 20 סקוואטים", "בק סקווט 50 קילו"
"""

import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

class ExerciseType(Enum):
    """Common exercise types with Hebrew mappings"""
    SQUAT = ("squat", ["סקוואט", "סקוואטים", "כפיפות ברכיים"])
    PUSHUP = ("pushup", ["שכיבות", "שכיבות סמיכה", "דחיפות", "פושאפ"])
    PULLUP = ("pullup", ["משיכות", "משיכות למעלה", "פול אפ", "עליות"])
    BURPEE = ("burpee", ["ברפי", "ברפיז", "ברפיס"])
    DEADLIFT = ("deadlift", ["דדליפט", "הרמה מתה", "דד ליפט"])
    PLANK = ("plank", ["פלאנק", "איסק", "תמיכה בזרועות"])
    SITUP = ("situp", ["סיטאפ", "בטן", "בטנים", "כפיפות בטן"])
    RUNNING = ("running", ["ריצה", "ריצות", "רוץ", "רצתי"])
    WALKING = ("walking", ["הליכה", "הולך", "הלכתי"])
    BENCH_PRESS = ("bench_press", ["בנץ׳ פרס", "דחיפות בשכיבה", "חזה"])
    BACK_SQUAT = ("back_squat", ["בק סקווט", "סקווט גב", "סקווט עם משקל"])

class HebrewExerciseParser:
    """
    Advanced Hebrew exercise command parser
    Extracts exercise type, count, weight, sets from natural Hebrew text
    """
    
    def __init__(self):
        # Build exercise mapping from enum
        self.exercise_mappings = {}
        for exercise_type in ExerciseType:
            english_name, hebrew_variants = exercise_type.value
            for hebrew_name in hebrew_variants:
                self.exercise_mappings[hebrew_name.lower()] = english_name
        
        # Hebrew number patterns
        self.hebrew_numbers = {
            'אחד': 1, 'אחת': 1, 'שני': 2, 'שתי': 2, 'שלוש': 3, 'שלושה': 3,
            'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5, 'שש': 6, 'ששה': 6,
            'שבע': 7, 'שבעה': 7, 'שמונה': 8, 'תשע': 9, 'תשעה': 9, 'עשר': 10,
            'עשרה': 10, 'עשרים': 20, 'שלושים': 30, 'ארבעים': 40, 'חמישים': 50
        }
        
        # Action verbs in Hebrew
        self.action_verbs = [
            'עשיתי', 'ביצעתי', 'השלמתי', 'עושה', 'מבצע', 'עמדתי', 'רצתי',
            'הלכתי', 'הרמתי', 'דחפתי', 'משכתי', 'קפצתי', 'נשמתי'
        ]
        
        # Weight and measurement patterns
        self.weight_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:קילו|ק״ג|kg)',
            r'(\d+(?:\.\d+)?)\s*(?:פאונד|לבש״ח|lb)',
            r'(\d+(?:\.\d+)?)\s*(?:גרם|gr)'
        ]
        
        # Time and distance patterns
        self.time_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:דקות|דק|min|minutes)',
            r'(\d+(?:\.\d+)?)\s*(?:שניות|שנ|sec|seconds)',
            r'(\d+(?:\.\d+)?)\s*(?:שעות|שע|hours|hr)'
        ]
        
        self.distance_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:קילומטר|קמ|km)',
            r'(\d+(?:\.\d+)?)\s*(?:מטר|מ|m)',
            r'(\d+(?:\.\d+)?)\s*(?:מיל|miles)'
        ]
        
        # Common Hebrew exercise command patterns
        self.command_patterns = [
            # "עשיתי 20 סקוואטים"
            r'(?:עשיתי|ביצעתי|השלמתי)\s+(\d+)\s+(.+)',
            # "20 סקוואטים עשיתי"
            r'(\d+)\s+(.+)\s+(?:עשיתי|ביצעתי|השלמתי)',
            # "סקוואט 20 פעמים"
            r'(.+)\s+(\d+)\s+(?:פעמים|חזרות)',
            # "בק סקווט 50 קילו"
            r'(.+)\s+(\d+(?:\.\d+)?)\s+(?:קילו|ק״ג)',
            # "רצתי 5 קילומטר"
            r'(?:רצתי|הלכתי)\s+(\d+(?:\.\d+)?)\s+(?:קילומטר|קמ)',
            # Simple count pattern "20 סקוואטים"
            r'(\d+)\s+(.+)',
            # Exercise with weight "דדליפט 80 קילו"
            r'(.+)\s+(\d+(?:\.\d+)?)\s*(?:קילו|ק״ג|kg)'
        ]
    
    async def parse_exercise_command(self, text: str) -> Dict[str, Any]:
        """
        Parse Hebrew exercise command and extract structured data
        
        Args:
            text: Hebrew text containing exercise command
            
        Returns:
            Dictionary with parsed exercise data
        """
        try:
            if not text or len(text.strip()) < 3:
                return {"error": "Empty or too short text"}
            
            text = text.strip().lower()
            
            # Normalize text
            normalized_text = self._normalize_hebrew_text(text)
            
            # Extract exercise information
            result = {
                "original_text": text,
                "normalized_text": normalized_text,
                "parsed_at": datetime.utcnow().isoformat(),
                "confidence": 0.0
            }
            
            # Find exercise type
            exercise_info = self._extract_exercise_type(normalized_text)
            if exercise_info:
                result.update(exercise_info)
                result["confidence"] += 0.3
            
            # Extract count/reps
            count_info = self._extract_count(normalized_text)
            if count_info:
                result.update(count_info)
                result["confidence"] += 0.3
            
            # Extract weight
            weight_info = self._extract_weight(normalized_text)
            if weight_info:
                result.update(weight_info)
                result["confidence"] += 0.2
            
            # Extract time/duration
            time_info = self._extract_time(normalized_text)
            if time_info:
                result.update(time_info)
                result["confidence"] += 0.1
            
            # Extract distance
            distance_info = self._extract_distance(normalized_text)
            if distance_info:
                result.update(distance_info)
                result["confidence"] += 0.1
            
            # Advanced pattern matching
            pattern_result = self._pattern_based_extraction(normalized_text)
            if pattern_result:
                result.update(pattern_result)
                result["confidence"] = max(result["confidence"], pattern_result.get("confidence", 0))
            
            # Generate response message
            if result["confidence"] > 0.5:
                result["response_message"] = self._generate_confirmation_message(result)
                result["requires_confirmation"] = True
                result["log_ready"] = True
            else:
                result["response_message"] = self._generate_clarification_request(text)
                result["requires_confirmation"] = False
                result["log_ready"] = False
            
            logger.info(f"✅ Parsed exercise command with confidence: {result['confidence']}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Exercise parsing error: {e}")
            return {
                "error": str(e),
                "original_text": text,
                "response_message": "לא הצלחתי להבין את הפקודה. נסה שוב עם פרטים ברורים יותר 🤔"
            }
    
    def _normalize_hebrew_text(self, text: str) -> str:
        """Normalize Hebrew text for better matching"""
        # Remove punctuation and extra spaces
        text = re.sub(r'[^\u0590-\u05FF\s\d\.]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        # Normalize common variations
        normalizations = {
            'ק״ג': 'קילו',
            'ק"ג': 'קילו',
            'קג': 'קילו',
            'דק׳': 'דקות',
            'דק״': 'דקות',
            'שנ׳': 'שניות'
        }
        
        for old, new in normalizations.items():
            text = text.replace(old, new)
        
        return text.strip()
    
    def _extract_exercise_type(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract exercise type from text"""
        best_match = None
        best_confidence = 0
        
        for hebrew_name, english_name in self.exercise_mappings.items():
            if hebrew_name in text:
                # Calculate confidence based on match quality
                confidence = len(hebrew_name) / len(text)
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match = {
                        "exercise": english_name,
                        "exercise_he": hebrew_name,
                        "match_confidence": confidence
                    }
        
        return best_match
    
    def _extract_count(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract repetition count from text"""
        # Look for numeric digits first
        numeric_matches = re.findall(r'\b(\d+)\b', text)
        
        if numeric_matches:
            # Take the first number as count, unless we find weight indicators
            count = int(numeric_matches[0])
            
            # Check if this number is associated with weight
            for weight_pattern in self.weight_patterns:
                if re.search(weight_pattern, text):
                    # If we have multiple numbers and one is weight, use the other
                    if len(numeric_matches) > 1:
                        count = int(numeric_matches[1] if numeric_matches[0] in re.search(weight_pattern, text).group() else numeric_matches[0])
                    break
            
            return {
                "count": count,
                "count_type": "reps"
            }
        
        # Look for Hebrew numbers
        for hebrew_num, value in self.hebrew_numbers.items():
            if hebrew_num in text:
                return {
                    "count": value,
                    "count_type": "reps",
                    "source": "hebrew_number"
                }
        
        return None
    
    def _extract_weight(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract weight information from text"""
        for pattern in self.weight_patterns:
            match = re.search(pattern, text)
            if match:
                weight_value = float(match.group(1))
                unit = "kg"  # Default to kg for Hebrew
                
                # Determine unit from the match
                if any(unit_marker in match.group(0) for unit_marker in ['פאונד', 'לבש״ח', 'lb']):
                    unit = "lb"
                elif any(unit_marker in match.group(0) for unit_marker in ['גרם', 'gr']):
                    unit = "g"
                
                return {
                    "weight": weight_value,
                    "weight_unit": unit
                }
        
        return None
    
    def _extract_time(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract time/duration information"""
        for pattern in self.time_patterns:
            match = re.search(pattern, text)
            if match:
                time_value = float(match.group(1))
                unit = "minutes"  # Default
                
                if any(unit_marker in match.group(0) for unit_marker in ['שניות', 'שנ', 'sec']):
                    unit = "seconds"
                elif any(unit_marker in match.group(0) for unit_marker in ['שעות', 'שע', 'hours']):
                    unit = "hours"
                
                return {
                    "duration": time_value,
                    "duration_unit": unit
                }
        
        return None
    
    def _extract_distance(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract distance information"""
        for pattern in self.distance_patterns:
            match = re.search(pattern, text)
            if match:
                distance_value = float(match.group(1))
                unit = "km"  # Default
                
                if any(unit_marker in match.group(0) for unit_marker in ['מטר', 'מ', 'm']):
                    unit = "m"
                elif any(unit_marker in match.group(0) for unit_marker in ['מיל', 'miles']):
                    unit = "miles"
                
                return {
                    "distance": distance_value,
                    "distance_unit": unit
                }
        
        return None
    
    def _pattern_based_extraction(self, text: str) -> Optional[Dict[str, Any]]:
        """Use pattern matching for complex commands"""
        for pattern in self.command_patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                
                # Analyze the groups to determine what they represent
                result = {"pattern_matched": True, "confidence": 0.7}
                
                # Try to identify exercise and count from groups
                for group in groups:
                    if group.isdigit():
                        if "count" not in result:
                            result["count"] = int(group)
                    elif any(ex_name in group for ex_name in self.exercise_mappings.keys()):
                        # Find the exercise
                        for hebrew_name, english_name in self.exercise_mappings.items():
                            if hebrew_name in group:
                                result["exercise"] = english_name
                                result["exercise_he"] = hebrew_name
                                break
                
                if "exercise" in result or "count" in result:
                    return result
        
        return None
    
    def _generate_confirmation_message(self, parsed_data: Dict[str, Any]) -> str:
        """Generate Hebrew confirmation message"""
        try:
            exercise_he = parsed_data.get("exercise_he", "תרגיל")
            exercise_en = parsed_data.get("exercise", "exercise")
            count = parsed_data.get("count", 0)
            weight = parsed_data.get("weight", None)
            duration = parsed_data.get("duration", None)
            distance = parsed_data.get("distance", None)
            
            # Build confirmation message
            message = f"מעולה! הבנתי ש"
            
            if count and count > 0:
                message += f"עשית {count} {exercise_he}"
            else:
                message += f"עשית {exercise_he}"
            
            if weight:
                unit = parsed_data.get("weight_unit", "ק״ג")
                message += f" עם {weight} {unit}"
            
            if duration:
                unit = parsed_data.get("duration_unit", "דקות")
                message += f" למשך {duration} {unit}"
            
            if distance:
                unit = parsed_data.get("distance_unit", "קמ")
                message += f" למרחק {distance} {unit}"
            
            message += ". האם זה נכון? 💪"
            
            return message
            
        except Exception:
            return "הבנתי את התרגיל! האם הפרטים נכונים? 💪"
    
    def _generate_clarification_request(self, original_text: str) -> str:
        """Generate Hebrew clarification request"""
        clarifications = [
            "לא הצלחתי להבין איזה תרגיל עשית. אפשר לנסות שוב? 🤔",
            "אפשר לספר שוב עם יותר פרטים? איזה תרגיל וכמה חזרות? 💭",
            "לא ברור לי מה עשית. תוכל לכתוב משהו כמו 'עשיתי 20 סקוואטים'? 🎯",
            "אני צריך עוד פרטים כדי להבין. איזה תרגיל וכמה? 📝"
        ]
        
        import random
        return random.choice(clarifications)
    
    async def get_supported_exercises(self) -> List[Dict[str, Any]]:
        """Get list of supported exercises"""
        exercises = []
        
        for exercise_type in ExerciseType:
            english_name, hebrew_variants = exercise_type.value
            exercises.append({
                "english_name": english_name,
                "hebrew_names": hebrew_variants,
                "primary_hebrew": hebrew_variants[0]
            })
        
        return exercises
    
    async def validate_parsed_data(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean parsed exercise data"""
        validation_result = {
            "valid": True,
            "warnings": [],
            "cleaned_data": parsed_data.copy()
        }
        
        # Validate count
        if "count" in parsed_data:
            count = parsed_data["count"]
            if count <= 0:
                validation_result["warnings"].append("Count should be positive")
                validation_result["cleaned_data"]["count"] = 1
            elif count > 1000:
                validation_result["warnings"].append("Unusually high count")
        
        # Validate weight
        if "weight" in parsed_data:
            weight = parsed_data["weight"]
            if weight <= 0:
                validation_result["warnings"].append("Weight should be positive")
            elif weight > 500:  # kg
                validation_result["warnings"].append("Unusually high weight")
        
        return validation_result

class PersonalFeedbackTracker:
    """
    Zero-budget personal feedback learning system
    Captures corrections from Noam and improves Hebrew parsing
    """
    
    def __init__(self):
        self.corrections_log = []
        self.learned_patterns = {}
        self.noam_preferences = {
            "preferred_exercise_names": {},
            "common_correction_patterns": [],
            "hebrew_style_preferences": {}
        }
    
    async def log_correction(
        self, 
        user_id: str, 
        original_text: str, 
        original_parse: Dict[str, Any], 
        correction_text: str,
        corrected_values: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Log user corrections for learning Hebrew patterns
        
        Args:
            user_id: User ID (typically "noam")
            original_text: Original Hebrew input
            original_parse: What the parser extracted
            correction_text: User's correction in Hebrew
            corrected_values: What the values should actually be
        """
        try:
            correction_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "original_text": original_text,
                "original_parse": original_parse,
                "correction_text": correction_text,
                "corrected_values": corrected_values,
                "correction_type": self._identify_correction_type(original_parse, corrected_values)
            }
            
            self.corrections_log.append(correction_entry)
            
            # Learn from this correction
            await self._learn_from_correction(correction_entry)
            
            logger.info(f"✅ Logged correction for user {user_id}: {correction_text}")
            
            return {
                "success": True,
                "correction_id": len(self.corrections_log) - 1,
                "learned_patterns": self._get_latest_learned_patterns(),
                "response_message": self._generate_correction_acknowledgment(correction_text)
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to log correction: {e}")
            return {
                "success": False,
                "error": str(e),
                "response_message": "תודה על התיקון! אני לומד מזה 📝"
            }
    
    def _identify_correction_type(self, original_parse: Dict, corrected_values: Dict) -> str:
        """Identify what type of correction was made"""
        if "count" in corrected_values and original_parse.get("count") != corrected_values["count"]:
            return "count_correction"
        elif "exercise" in corrected_values and original_parse.get("exercise") != corrected_values["exercise"]:
            return "exercise_name_correction"
        elif "weight" in corrected_values and original_parse.get("weight") != corrected_values["weight"]:
            return "weight_correction"
        else:
            return "general_correction"
    
    async def _learn_from_correction(self, correction_entry: Dict[str, Any]):
        """Learn patterns from user corrections"""
        correction_type = correction_entry["correction_type"]
        original_text = correction_entry["original_text"]
        correction_text = correction_entry["correction_text"]
        
        # Learn Hebrew correction patterns
        if correction_type == "count_correction":
            await self._learn_count_patterns(original_text, correction_text, correction_entry)
        elif correction_type == "exercise_name_correction":
            await self._learn_exercise_name_patterns(original_text, correction_text, correction_entry)
        elif correction_type == "weight_correction":
            await self._learn_weight_patterns(original_text, correction_text, correction_entry)
        
        # Store Noam's specific preferences
        user_id = correction_entry["user_id"]
        if user_id.lower() == "noam":
            await self._update_noam_preferences(correction_entry)
    
    async def _learn_count_patterns(self, original_text: str, correction_text: str, correction_entry: Dict):
        """Learn from count corrections like 'לא, עשיתי 30 לא 20'"""
        # Extract Hebrew number correction patterns
        hebrew_number_pattern = r'(\d+)\s*לא\s*(\d+)'
        match = re.search(hebrew_number_pattern, correction_text)
        
        if match:
            corrected_count = int(match.group(1))
            original_count = int(match.group(2))
            
            # Learn this correction pattern
            pattern = {
                "type": "count_correction",
                "original_count": original_count,
                "corrected_count": corrected_count,
                "hebrew_pattern": correction_text,
                "confidence_adjustment": -0.2  # Reduce confidence for similar patterns
            }
            
            if "count_corrections" not in self.learned_patterns:
                self.learned_patterns["count_corrections"] = []
            
            self.learned_patterns["count_corrections"].append(pattern)
            logger.info(f"📚 Learned count correction: {original_count} → {corrected_count}")
    
    async def _learn_exercise_name_patterns(self, original_text: str, correction_text: str, correction_entry: Dict):
        """Learn from exercise name corrections"""
        original_exercise = correction_entry["original_parse"].get("exercise")
        corrected_exercise = correction_entry["corrected_values"].get("exercise")
        
        if original_exercise and corrected_exercise:
            # Learn that this Hebrew text should map to the corrected exercise
            pattern = {
                "type": "exercise_name_mapping",
                "original_text": original_text,
                "original_exercise": original_exercise,
                "corrected_exercise": corrected_exercise,
                "hebrew_expression": correction_text
            }
            
            if "exercise_corrections" not in self.learned_patterns:
                self.learned_patterns["exercise_corrections"] = []
            
            self.learned_patterns["exercise_corrections"].append(pattern)
            logger.info(f"📚 Learned exercise correction: {original_exercise} → {corrected_exercise}")
    
    async def _learn_weight_patterns(self, original_text: str, correction_text: str, correction_entry: Dict):
        """Learn from weight corrections"""
        # Similar to count corrections but for weight values
        hebrew_weight_pattern = r'(\d+(?:\.\d+)?)\s*(?:קילו|ק״ג)?\s*לא\s*(\d+(?:\.\d+)?)'
        match = re.search(hebrew_weight_pattern, correction_text)
        
        if match:
            corrected_weight = float(match.group(1))
            original_weight = float(match.group(2))
            
            pattern = {
                "type": "weight_correction",
                "original_weight": original_weight,
                "corrected_weight": corrected_weight,
                "hebrew_pattern": correction_text
            }
            
            if "weight_corrections" not in self.learned_patterns:
                self.learned_patterns["weight_corrections"] = []
            
            self.learned_patterns["weight_corrections"].append(pattern)
            logger.info(f"📚 Learned weight correction: {original_weight} → {corrected_weight}")
    
    async def _update_noam_preferences(self, correction_entry: Dict):
        """Update Noam's specific Hebrew preferences and patterns"""
        correction_text = correction_entry["correction_text"]
        correction_type = correction_entry["correction_type"]
        
        # Track Noam's preferred way of making corrections
        if correction_type not in self.noam_preferences["common_correction_patterns"]:
            self.noam_preferences["common_correction_patterns"].append({
                "type": correction_type,
                "hebrew_pattern": correction_text,
                "frequency": 1
            })
        else:
            # Increment frequency if this pattern already exists
            for pattern in self.noam_preferences["common_correction_patterns"]:
                if pattern["type"] == correction_type and correction_text in pattern["hebrew_pattern"]:
                    pattern["frequency"] += 1
                    break
        
        # Learn Noam's preferred exercise names
        if "exercise" in correction_entry["corrected_values"]:
            exercise = correction_entry["corrected_values"]["exercise"]
            original_text = correction_entry["original_text"]
            
            if exercise not in self.noam_preferences["preferred_exercise_names"]:
                self.noam_preferences["preferred_exercise_names"][exercise] = []
            
            self.noam_preferences["preferred_exercise_names"][exercise].append(original_text)
    
    def _generate_correction_acknowledgment(self, correction_text: str) -> str:
        """Generate Hebrew acknowledgment for corrections"""
        acknowledgments = [
            "תודה על התיקון! אני לומד מזה 📚",
            "אוקיי, הבנתי! אני אזכור את זה בפעם הבאה 💡", 
            "נרשם! תודה שאתה עוזר לי להשתפר 🙏",
            "מצוין, עכשיו אני יודע יותר טוב איך אתה מעדיף לומר את זה 📝",
            "תיקנת אותי בצורה מושלמת! אני לומד מהטעויות שלי 🎯"
        ]
        
        import random
        return random.choice(acknowledgments)
    
    def _get_latest_learned_patterns(self) -> Dict[str, Any]:
        """Get summary of recently learned patterns"""
        return {
            "total_corrections": len(self.corrections_log),
            "pattern_types": list(self.learned_patterns.keys()),
            "noam_preferences": {
                "exercise_names_learned": len(self.noam_preferences["preferred_exercise_names"]),
                "correction_patterns": len(self.noam_preferences["common_correction_patterns"])
            }
        }
    
    async def apply_learned_patterns(self, text: str, user_id: str) -> Dict[str, Any]:
        """Apply learned patterns to improve parsing for specific user"""
        improvements = {"applied_patterns": [], "confidence_adjustments": 0}
        
        # Apply Noam-specific learned patterns
        if user_id.lower() == "noam":
            # Check for exercise name preferences
            for exercise, hebrew_variants in self.noam_preferences["preferred_exercise_names"].items():
                for variant in hebrew_variants:
                    if variant.lower() in text.lower():
                        improvements["applied_patterns"].append({
                            "type": "noam_exercise_preference",
                            "exercise": exercise,
                            "hebrew_variant": variant
                        })
                        improvements["confidence_adjustments"] += 0.1
            
            # Apply learned correction patterns to avoid previous mistakes
            for pattern in self.learned_patterns.get("count_corrections", []):
                # Adjust confidence if this looks like a pattern we've been corrected on
                if pattern["original_count"] and str(pattern["original_count"]) in text:
                    improvements["confidence_adjustments"] += pattern.get("confidence_adjustment", 0)
        
        return improvements
    
    def get_correction_statistics(self) -> Dict[str, Any]:
        """Get statistics about corrections for analysis"""
        if not self.corrections_log:
            return {"total_corrections": 0, "message": "No corrections logged yet"}
        
        correction_types = {}
        for correction in self.corrections_log:
            correction_type = correction["correction_type"]
            correction_types[correction_type] = correction_types.get(correction_type, 0) + 1
        
        return {
            "total_corrections": len(self.corrections_log),
            "correction_types": correction_types,
            "learned_patterns_count": {
                pattern_type: len(patterns) 
                for pattern_type, patterns in self.learned_patterns.items()
            },
            "noam_specific_data": {
                "preferred_exercises": len(self.noam_preferences["preferred_exercise_names"]),
                "correction_patterns": len(self.noam_preferences["common_correction_patterns"])
            },
            "latest_corrections": self.corrections_log[-5:] if len(self.corrections_log) >= 5 else self.corrections_log
        }

# Enhanced Hebrew Exercise Parser with feedback learning
class HebrewExerciseParserWithLearning(HebrewExerciseParser):
    """
    Extended Hebrew exercise parser with personal feedback learning
    Builds on existing parser while adding zero-budget learning capabilities
    """
    
    def __init__(self):
        super().__init__()
        self.feedback_tracker = PersonalFeedbackTracker()
    
    async def parse_exercise_command_with_learning(
        self, 
        text: str, 
        user_id: str = "noam"
    ) -> Dict[str, Any]:
        """
        Parse Hebrew exercise command with applied learning patterns
        """
        # Apply learned patterns before parsing
        learning_improvements = await self.feedback_tracker.apply_learned_patterns(text, user_id)
        
        # Use existing parsing logic
        result = await super().parse_exercise_command(text)
        
        # Apply learning improvements to result
        if learning_improvements["applied_patterns"]:
            result["learning_applied"] = learning_improvements
            result["confidence"] = min(1.0, result.get("confidence", 0) + learning_improvements["confidence_adjustments"])
        
        return result
    
    async def process_correction(
        self,
        user_id: str,
        original_text: str,
        original_parse: Dict[str, Any],
        correction_text: str,
        corrected_values: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process user correction and learn from it
        """
        return await self.feedback_tracker.log_correction(
            user_id, original_text, original_parse, correction_text, corrected_values
        )
    
    def get_learning_statistics(self) -> Dict[str, Any]:
        """Get learning statistics for analysis"""
        return self.feedback_tracker.get_correction_statistics()

# Singleton instances
hebrew_exercise_parser = HebrewExerciseParser()
hebrew_parser_with_learning = HebrewExerciseParserWithLearning()