"""
Hebrew Response Filter Service
Multi-layer validation and filtering to ensure clean Hebrew-only responses
Solves the mixed language chaos in AI responses
"""

import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

class HebrewResponseFilter:
    """
    Advanced Hebrew response filtering system
    Removes English content and validates Hebrew quality
    """
    
    def __init__(self):
        # Hebrew Unicode range
        self.hebrew_pattern = re.compile(r'[\u0590-\u05FF]+')
        self.english_pattern = re.compile(r'[A-Za-z]+')
        
        # Common English patterns that AI models inject
        self.english_removal_patterns = [
            # Questions and phrases
            r'\bDo you want.*?\?',
            r'\bWhat.*?\?', 
            r'\bHow.*?\?',
            r'\bWhy.*?\?',
            r'\bWhen.*?\?',
            r'\bWhere.*?\?',
            r'\bGreat!\b',
            r'\bGood!\b',
            r'\bExcellent!\b',
            r'\bAwesome!\b',
            r'\bAmazing!\b',
            
            # Common AI phrases
            r'\bI\'m here.*?\.?',
            r'\bI can help.*?\.?',
            r'\bTell me.*?\.?',
            r'\bLet\'s.*?!?',
            r'\bYou can.*?\.?',
            r'\bFeel free.*?\.?',
            r'\bDon\'t hesitate.*?\.?',
            
            # Fitness-specific English
            r'\bexercising\??',
            r'\bworkout.*?\b',
            r'\bfitness.*?\b',
            r'\bnutrition tips.*?\b',
            r'\bgym.*?\b',
            r'\btraining.*?\b',
            r'\bstart\??',
            r'\bgoal\??',
            
            # Parenthetical English
            r'\([^)]*[a-zA-Z][^)]*\)',
            
            # Common transitions
            r'\bWhat do you think\??',
            r'\bLet\'s start\b',
            r'\bReady\??'
        ]
        
        # Hebrew fitness vocabulary for validation
        self.hebrew_fitness_terms = [
            'אימון', 'אימונים', 'תרגיל', 'תרגילים', 'כושר', 'חוזק', 
            'סקוואט', 'סקוואטים', 'שכיבות', 'דדליפט', 'ברפי', 'פלאנק',
            'ריצה', 'הליכה', 'שחייה', 'רכיבה', 'משקל', 'קילו', 'חזרות',
            'סטים', 'נקודות', 'הישג', 'שיא', 'התקדמות', 'מטרה', 'יעד'
        ]
        
    async def filter_response(self, response: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Main filtering method - clean and validate Hebrew response
        
        Args:
            response: Raw AI response
            context: Optional context for content validation
            
        Returns:
            Clean Hebrew response
        """
        try:
            if not response or len(response.strip()) < 3:
                return self._get_fallback_response(context)
            
            # Step 1: Remove obvious English patterns
            cleaned = self._remove_english_patterns(response)
            
            # Step 2: Sentence-level filtering
            cleaned = self._filter_sentences_by_language(cleaned)
            
            # Step 3: Clean up formatting and spacing
            cleaned = self._clean_formatting(cleaned)
            
            # Step 4: Validate Hebrew quality
            if not self._validate_hebrew_quality(cleaned):
                logger.warning("Response failed Hebrew quality validation")
                return self._get_fallback_response(context)
            
            # Step 5: Ensure proper ending
            cleaned = self._ensure_proper_ending(cleaned)
            
            logger.debug(f"✅ Filtered response: {len(response)} -> {len(cleaned)} chars")
            return cleaned
            
        except Exception as e:
            logger.error(f"❌ Response filtering error: {e}")
            return self._get_fallback_response(context)
    
    def _remove_english_patterns(self, text: str) -> str:
        """Remove known English patterns"""
        cleaned = text
        
        for pattern in self.english_removal_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        return cleaned
    
    def _filter_sentences_by_language(self, text: str) -> str:
        """Filter sentences to keep only Hebrew-dominant ones"""
        # Split by common sentence endings
        sentences = re.split(r'[.!?]\s*', text)
        hebrew_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # Count character types
            hebrew_chars = len(self.hebrew_pattern.findall(sentence))
            english_chars = len(self.english_pattern.findall(sentence))
            total_chars = len(sentence)
            
            # Keep sentence if:
            # 1. Has significant Hebrew content (>5 chars)
            # 2. Hebrew chars > English chars
            # 3. OR English is minimal (<20% of total)
            if (hebrew_chars > 5 and 
                (hebrew_chars > english_chars or 
                 english_chars / total_chars < 0.2)):
                hebrew_sentences.append(sentence)
        
        return '. '.join(hebrew_sentences)
    
    def _clean_formatting(self, text: str) -> str:
        """Clean up spacing, punctuation, and formatting"""
        # Remove multiple spaces
        cleaned = re.sub(r'\s+', ' ', text)
        
        # Remove orphaned punctuation
        cleaned = re.sub(r'\s+[.!?]\s*', '. ', cleaned)
        
        # Fix spacing around emojis
        cleaned = re.sub(r'\s*([💪🔥⭐🌟🎯🏋️‍♂️🏃‍♂️🚴‍♂️🏊‍♂️])\s*', r' \1 ', cleaned)
        
        # Remove extra dots
        cleaned = re.sub(r'\.{2,}', '.', cleaned)
        
        return cleaned.strip()
    
    def _validate_hebrew_quality(self, text: str) -> bool:
        """Validate that the response has good Hebrew quality"""
        if len(text) < 5:
            return False
        
        # Count Hebrew characters
        hebrew_chars = len(self.hebrew_pattern.findall(text))
        english_chars = len(self.english_pattern.findall(text))
        total_chars = len(text)
        
        # Quality checks
        hebrew_ratio = hebrew_chars / total_chars if total_chars > 0 else 0
        
        # Must have at least 30% Hebrew characters
        if hebrew_ratio < 0.3:
            return False
        
        # Hebrew must be more than English
        if english_chars > hebrew_chars and english_chars > 10:
            return False
        
        # Check for fitness vocabulary if it's a fitness response
        has_fitness_terms = any(term in text for term in self.hebrew_fitness_terms)
        
        return True
    
    def _ensure_proper_ending(self, text: str) -> str:
        """Ensure response ends properly"""
        if not text:
            return text
        
        # Add proper ending if missing
        if not text.endswith(('.', '!', '?')):
            text += '.'
        
        # Add encouraging emoji if appropriate
        if any(word in text for word in ['מעולה', 'כל הכבוד', 'נהדר', 'אלוף']):
            if '💪' not in text and '🔥' not in text:
                text += ' 💪'
        
        return text
    
    def _get_fallback_response(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate appropriate fallback response"""
        if not context:
            return "אני כאן כדי לעזור לך! איך אני יכול לתמוך בך היום? 💪"
        
        # Context-aware fallbacks
        username = context.get("username", "")
        today_exercises = context.get("today_exercises", 0)
        
        if username == "noam" or username == "נועם":
            if today_exercises > 0:
                return "נועם, כל הכבוד על האימונים היום! איך אתה מרגיש? 🔥"
            else:
                return "נועם, איך אתה מרגיש היום? מוכן לאימון? 💪"
        
        # General fallbacks
        fallbacks = [
            "איך אני יכול לעזור לך היום? 💪",
            "ספר לי על האימון שלך! 🔥",
            "איך אתה מרגיש היום? 🌟",
            "מוכן להמשיך באימונים? 💪"
        ]
        
        import random
        return random.choice(fallbacks)
    
    def validate_response_quality(self, response: str) -> Dict[str, Any]:
        """
        Validate response quality and return metrics
        
        Returns:
            Dictionary with quality metrics
        """
        if not response:
            return {"valid": False, "reason": "empty_response"}
        
        hebrew_chars = len(self.hebrew_pattern.findall(response))
        english_chars = len(self.english_pattern.findall(response))
        total_chars = len(response)
        
        hebrew_ratio = hebrew_chars / total_chars if total_chars > 0 else 0
        english_ratio = english_chars / total_chars if total_chars > 0 else 0
        
        has_fitness_terms = any(term in response for term in self.hebrew_fitness_terms)
        
        # Quality score calculation
        quality_score = 0
        if hebrew_ratio > 0.5:
            quality_score += 40
        if english_ratio < 0.2:
            quality_score += 30
        if has_fitness_terms:
            quality_score += 20
        if len(response) > 10:
            quality_score += 10
        
        return {
            "valid": quality_score >= 70,
            "quality_score": quality_score,
            "hebrew_ratio": hebrew_ratio,
            "english_ratio": english_ratio,
            "has_fitness_terms": has_fitness_terms,
            "hebrew_chars": hebrew_chars,
            "english_chars": english_chars,
            "total_chars": total_chars
        }
    
    async def filter_and_validate(self, response: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Filter response and return with validation metrics
        
        Returns:
            Dictionary with filtered response and quality metrics
        """
        original_response = response
        filtered_response = await self.filter_response(response, context)
        
        # Get quality metrics for both
        original_quality = self.validate_response_quality(original_response)
        filtered_quality = self.validate_response_quality(filtered_response)
        
        return {
            "original_response": original_response,
            "filtered_response": filtered_response,
            "improvement": filtered_quality["quality_score"] - original_quality["quality_score"],
            "original_quality": original_quality,
            "filtered_quality": filtered_quality,
            "filter_applied": original_response != filtered_response
        }

# Singleton instance
hebrew_filter = HebrewResponseFilter()