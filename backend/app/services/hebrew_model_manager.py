"""
Hebrew Model Manager Service
Manages Hebrew AI models including Whisper for voice recognition
"""

import asyncio
import threading
from typing import Optional, Dict, Any, List
import logging
import sys
from pathlib import Path
import json
import base64
import httpx
import os

# Add parent directory to path for importing existing Hebrew modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from app.services.hebrew_response_filter import hebrew_filter

logger = logging.getLogger(__name__)

class HebrewModelManager:
    """
    Singleton manager for Hebrew AI models
    Handles Whisper model loading and voice processing
    """
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.whisper_model = None
            self.exercise_parser = None
            self.tts_service = None
            self.chat_models = {}
            self.is_initialized = False
            self.initialized = False
            
            # Initialize available models
            self.available_models = {
                "gemini-1.5-flash": {
                    "type": "api",
                    # Gemini v1beta requires explicit model names without the "-latest" suffix
                    "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                    "api_key_env": "GEMINI_API_KEY"
                },
                "gemini-1.5-pro": {
                    "type": "api", 
                    "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
                    "api_key_env": "GEMINI_API_KEY"
                },
                "openai-gpt-4o-mini": {
                    "type": "openai",
                    "model_name": "gpt-4o-mini",
                    "api_key_env": "OPENAI_API_KEY"
                },
                "bjoernb/gemma3n-e2b:latest": {
                    "type": "ollama",
                    "endpoint": "http://localhost:11434/api/generate",
                    "model_name": "bjoernb/gemma3n-e2b:latest"
                },
                "llava:7b": {
                    "type": "ollama",
                    "endpoint": "http://localhost:11434/api/generate", 
                    "model_name": "llava:7b"
                }
            }
            
    async def initialize(self):
        """Initialize Hebrew models asynchronously"""
        try:
            logger.info("Initializing Hebrew models...")
            
            # Load models in parallel
            await asyncio.gather(
                self._load_whisper_model(),
                self._load_exercise_parser(),
                self._load_tts_service()
            )
            
            self.is_initialized = True
            self.initialized = True
            logger.info("✓ Hebrew models initialized successfully")
            
        except Exception as e:
            logger.error(f"Model initialization error: {e}")
            # Continue with mock models for development
            self._load_mock_models()
            self.is_initialized = True
    
    async def _load_whisper_model(self):
        """Load Hebrew Whisper model for voice recognition"""
        try:
            # Try to import existing Hebrew voice recognition
            from hebrew_voice_recognition import HebrewVoiceRecognizer
            self.whisper_model = HebrewVoiceRecognizer()
            logger.info("✓ Hebrew Whisper model loaded")
        except ImportError:
            logger.warning("Using mock Whisper model (actual model not found)")
            self.whisper_model = MockWhisperModel()
    
    async def _load_exercise_parser(self):
        """Load Hebrew exercise parser"""
        try:
            from hebrew_workout_parser import HebrewWorkoutParser
            self.exercise_parser = HebrewWorkoutParser()
            logger.info("✓ Hebrew exercise parser loaded")
        except ImportError:
            logger.warning("Using mock exercise parser")
            self.exercise_parser = MockExerciseParser()
    
    async def _load_tts_service(self):
        """Load Hebrew TTS service"""
        try:
            from hebrew_tts import HebrewTTS
            self.tts_service = HebrewTTS()
            logger.info("✓ Hebrew TTS service loaded")
        except ImportError:
            logger.warning("Using mock TTS service")
            self.tts_service = MockTTSService()
    
    def _load_mock_models(self):
        """Load mock models for development"""
        self.whisper_model = MockWhisperModel()
        self.exercise_parser = MockExerciseParser()
        self.tts_service = MockTTSService()
        logger.info("Mock models loaded for development")
    
    async def process_audio(self, audio_data: bytes, language: str = "he") -> Dict[str, Any]:
        """
        Process audio with Hebrew Whisper model
        Returns transcription and parsed exercise data
        """
        if not self.whisper_model:
            return {"error": "Model not loaded", "text": "", "confidence": 0.0}
        
        try:
            # Transcribe audio
            result = await self.whisper_model.transcribe(audio_data, language=language)
            
            # Parse exercise commands
            if result.get("text"):
                exercise_data = await self.parse_exercise_command(result["text"])
                result.update(exercise_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Audio processing error: {e}")
            return {"error": str(e), "text": "", "confidence": 0.0}
    
    async def process_audio_chunk(self, audio_chunk: bytes) -> Optional[Dict[str, Any]]:
        """Process audio chunk for streaming transcription"""
        if not self.whisper_model:
            return None
        
        try:
            result = await self.whisper_model.process_chunk(audio_chunk)
            
            # If we have a final transcription, parse it
            if result and result.get("is_final"):
                exercise_data = await self.parse_exercise_command(result.get("text", ""))
                result.update(exercise_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Chunk processing error: {e}")
            return None
    
    async def parse_exercise_command(self, text: str) -> Dict[str, Any]:
        """
        Parse Hebrew text for exercise commands
        Examples:
        - "עשיתי 20 סקוואטים" -> {exercise: "squat", count: 20}
        - "בק סקווט 50 קילו" -> {exercise: "back_squat", weight: 50}
        """
        if not self.exercise_parser:
            return {}
        
        try:
            return await self.exercise_parser.parse(text)
        except Exception as e:
            logger.error(f"Exercise parsing error: {e}")
            return {}
    
    async def generate_tts(self, text: str, voice: str = "default") -> str:
        """
        Generate Hebrew TTS audio
        Returns base64 encoded audio
        """
        if not self.tts_service:
            return ""
        
        try:
            audio_data = await self.tts_service.synthesize(text, voice=voice)
            return base64.b64encode(audio_data).decode('utf-8')
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            return ""
    
    async def generate_chat_response(
        self, 
        message: str, 
        model: str = "gemini-1.5-flash", 
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Generate chat response using specified model
        Supports both Gemini API and Ollama models
        """
        try:
            if model not in self.available_models:
                logger.warning(f"Unknown model: {model}, falling back to openai-gpt-4o-mini")
                model = "openai-gpt-4o-mini"
            
            model_config = self.available_models[model]
            
            if model_config["type"] == "api":
                return await self._call_gemini_api(message, model, model_config, context)
            elif model_config["type"] == "openai":
                return await self._call_openai_api(message, model, model_config, context)
            elif model_config["type"] == "ollama":
                return await self._call_ollama_api(message, model, model_config, context)
            else:
                logger.error(f"Unknown model type: {model_config['type']}")
                return None
                
        except Exception as e:
            logger.error(f"Chat response generation error: {e}")
            return None
    
    async def _call_gemini_api(
        self, 
        message: str, 
        model: str, 
        config: Dict[str, Any], 
        context: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Call Gemini API for chat response"""
        try:
            api_key = os.getenv(config["api_key_env"])
            if not api_key:
                logger.error(f"API key not found for {config['api_key_env']}")
                return None
            
            # Build system prompt for Hebrew fitness
            system_prompt = await self._build_system_prompt(context)
            
            # Log the prompt being sent
            full_prompt = f"{system_prompt}\n\nUser: {message}"
            logger.info(f"📤 Sending to Gemini API - Message: '{message[:50]}...'")
            logger.debug(f"📤 Full prompt preview (first 500 chars): {full_prompt[:500]}...")
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": full_prompt}
                        ]
                    }
                ]
            }
            
            headers = {
                "Content-Type": "application/json"
            }
            
            url = f"{config['endpoint']}?key={api_key}"

            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.debug(f"Calling Gemini endpoint: {url}")
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("candidates", [{}])[0].get("content", {})
                    response_text = content.get("parts", [{}])[0].get("text", "")
                    
                    # Log the raw response from Gemini
                    logger.info(f"📥 Gemini raw response preview: {response_text[:100]}...")
                    question_marks = response_text.count('?')
                    logger.warning(f"⚠️ Response contains {question_marks} question marks" if question_marks > 1 else "✅ Response has minimal questions")
                    
                    # Filter response using advanced Hebrew filter
                    filtered_response = await hebrew_filter.filter_response(response_text, context)
                    
                    return {
                        "response": filtered_response,
                        "model_used": model,
                        "confidence": 0.9,  # Gemini doesn't provide confidence scores
                        "exercise_detected": self._detect_exercise_in_response(message, filtered_response)
                    }
                else:
                    logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Gemini API call error: {e}")
            return None

    async def _call_openai_api(
        self,
        message: str,
        model: str,
        config: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Call OpenAI API for chat response"""
        try:
            api_key = os.getenv(config["api_key_env"])
            if not api_key:
                logger.error(f"API key not found for {config['api_key_env']}")
                return None

            system_prompt = await self._build_system_prompt(context)
            payload = {
                "model": config["model_name"],
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                "temperature": 0.7,
                "top_p": 0.9
            }

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if not choices:
                        logger.error("OpenAI response missing choices")
                        return None

                    response_text = choices[0].get("message", {}).get("content", "")
                    logger.info(f"📥 OpenAI response preview: {response_text[:100]}...")

                    filtered_response = await hebrew_filter.filter_response(response_text, context)

                    logprobs = choices[0].get("logprobs")
                    confidence = None
                    if isinstance(logprobs, dict):
                        content_logprobs = logprobs.get("content") or []
                        if content_logprobs and isinstance(content_logprobs[0], dict):
                            confidence = content_logprobs[0].get("logprob")

                    return {
                        "response": filtered_response,
                        "model_used": model,
                        "confidence": confidence,
                        "exercise_detected": self._detect_exercise_in_response(message, filtered_response)
                    }

                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            logger.error(f"OpenAI API call error: {e}")
            return None

    async def _call_ollama_api(
        self, 
        message: str, 
        model: str, 
        config: Dict[str, Any], 
        context: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Call Ollama API for chat response"""
        try:
            # Build system prompt for Hebrew fitness
            system_prompt = await self._build_system_prompt(context)
            
            payload = {
                "model": config["model_name"],
                "prompt": f"{system_prompt}\n\nUser: {message}\nAssistant:",
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(config["endpoint"], json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    response_text = data.get("response", "")
                    
                    # Filter response using advanced Hebrew filter
                    filtered_response = await hebrew_filter.filter_response(response_text, context)
                    
                    return {
                        "response": filtered_response,
                        "model_used": model,
                        "confidence": 0.85,  # Default confidence for Ollama
                        "exercise_detected": self._detect_exercise_in_response(message, filtered_response)
                    }
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Ollama API call error: {e}")
            return None
    
    async def _build_system_prompt(self, context: Optional[Dict[str, Any]]) -> str:
        """Build enhanced Hebrew-only system prompt for fitness AI"""
        
        # Get user-specific information
        username = ""
        fitness_level = ""
        recent_workouts = []
        personal_records = []
        
        if context:
            username = context.get("username", "")
            user_context = context.get("user_context", {})
            fitness_profile = user_context.get("fitness_profile", {})
            fitness_level = fitness_profile.get("fitness_level", "")
            recent_workouts = user_context.get("recent_workouts", [])
            personal_records = user_context.get("personal_records", [])
        
        # Build personalized base prompt
        base_prompt = f"""אתה SweatBot, מאמן כושר אישי מקצועי בעברית. אתה עוזר ל{username if username else 'המשתמש'} להתקדם בכושר.

🚨 חוקים קריטיים - חובה לציית:
1. תכתב ותדבר רק בעברית - אסור לחלוטין טקסט באנגלית
2. אם אתה לא יודע מילה בעברית - תשתמש בביטוי עברי דומה
3. משפטים קצרים וברורים (מקסימום 2 משפטים לתגובה)
4. תמיד תהיה מעודד, אופטימי ותומך
5. דבר ישירות למשתמש בגוף שני
6. 🚨 אל תשאל שאלות מיותרות - פשוט תאשר ותעודד!

התנהגות מיוחדת לתרגילים:
⚡ כשמישהו אומר "עשיתי X תרגילים" - פשוט תעודד ותאשר (תגובה קצרה של 1-2 משפטים)
⚡ כשמישהו מבקש תרגילים להפסקה או אימון - תן מגוון רחב של תרגילים שונים (תגובה מפורטת מותרת)
⚡ אל תשאל על קבוצות שרירים, קושי, או ציוד כשהמשתמש רק רוצה לתעד
⚡ להצעות אימון - תשתמש במגוון רחב: לאנג'ים, דדליפט, פולאובר, מתח, משיכות, קפיצות, ריצות, פלאנקים, כפיפות בטן, טלטלים, ספרינטים, הליכה מהירה, שחייה, אופניים, מתיחות דינמיות, ועוד

יכולות שלך:
💪 מעקב אחרי תרגילים ואימונים
🥗 עצות תזונה מותאמות אישית  
🎯 מוטיבציה ועידוד חכם
📊 חישוב נקודות והשגים
🎤 זיהוי פקודות קול בעברית
📈 מעקב התקדמות אישית
🏋️‍♂️ ידע נרחב במאות תרגילים שונים

סגנון התגובה הנדרש:
✓ עברית נקייה בלבד - ללא מילה באנגלית
✓ לתיעוד תרגילים: 1-2 משפטים מקסימום עם אמוג'י אחד
✓ להצעות אימון: תגובות מפורטות עם מגוון תרגילים מותרות ורצויות
✓ מעודד ומעשי תמיד
✓ ישיר וקצר לעניין (חוץ מהצעות אימון)
✓ אל תשאל שאלות אלא אם המשתמש מבקש עזרה

דוגמאות לתגובות מושלמות לתרגילים:
"מעולה! 20 סקוואטים נרשמו! 💪"
"כל הכבוד! 15 שכיבות סמיכה זה חזק! 🔥"
"נהדר! עוד יום של התקדמות! ⭐"

דוגמאות לתגובות אסורות (לעולם אל תכתב כך):
❌ "איזה קבוצת שרירים ריכזת? איך הרגשת? באיזה רמת קושי?"
❌ "ספר לי יותר על האימון - איזה ציוד השתמשת?"
❌ "מה היו התחושות שלך? האם זה היה מאתגר?"
❌ כל שאלה שהיא כשהמשתמש רק רוצה לתעד תרגיל

הקשר אישי:"""
        
        # Add comprehensive user context for progress tracking
        if context and context.get("user_context"):
            user_data = context["user_context"]
            
            # Fitness level and experience
            if fitness_level:
                base_prompt += f"\n- רמת הכושר שלך: {fitness_level}"
            
            # Current progress data
            total_exercises = user_data.get("total_exercises", 0)
            total_points = user_data.get("total_points", 0)
            today_exercises = user_data.get("today_exercises", 0)
            today_points = user_data.get("today_points", 0)
            
            if total_exercises > 0:
                base_prompt += f"\n- סך הכל עשית {total_exercises} תרגילים וצברת {total_points} נקודות"
            if today_exercises > 0:
                base_prompt += f"\n- היום עשית כבר {today_exercises} תרגילים וקיבלת {today_points} נקודות"
            
            # Recent workout history
            if recent_workouts:
                recent_names = [w.get("name", "") for w in recent_workouts[:3]]
                base_prompt += f"\n- אימונים אחרונים: {', '.join(recent_names)}"
            
            # Personal records
            if personal_records:
                records_summary = f"{len(personal_records)} שיאים אישיים"
                base_prompt += f"\n- השיאים שלך: {records_summary}"
                
            # Detailed progress instructions for AI
            base_prompt += f"\n\n📊 חשוב: אתה יכול לראות את כל הנתונים האלה ולעזור למשתמש לעקוב אחר ההתקדמות!"
            base_prompt += f"\n- כשמבקשים התקדמות: השתמש בנתונים האלה ותן סיכום מפורט"
            base_prompt += f"\n- כשמבקשים סטטיסטיקות: תראה נקודות, תרגילים ושיאים"
            base_prompt += f"\n- תמיד תהיה מעודד ותראה התקדמות חיובית"
        
        # Special handling for user Noam
        if username and username.lower() == "noam":
            base_prompt += f"\n\n🎯 הערה מיוחדת: המשתמש הוא נועם - תהיה אישי ויידידותי איתו."
        
        # Add personalized onboarding preferences if available
        try:
            from app.services.user_onboarding_service import user_onboarding_service
            personalized_addition = await user_onboarding_service.get_personalized_system_prompt_addition(
                context.get("user_id", "") if context else ""
            )
            if personalized_addition:
                base_prompt += personalized_addition
        except Exception as e:
            logger.warning(f"Could not load personalized onboarding preferences: {e}")
        
        base_prompt += f"\n\nעכשיו תענה למשתמש בעברית נקייה בלבד, בצורה מעודדת וישירה:"
        
        # Debug logging
        logger.info(f"🎯 System prompt built for user: {username}")
        logger.debug(f"📝 Prompt includes anti-questioning: {'אל תשאל שאלות מיותרות' in base_prompt}")
        logger.debug(f"📝 Prompt length: {len(base_prompt)} characters")
        
        return base_prompt
    
    def _clean_hebrew_response(self, response: str) -> str:
        """Clean and filter AI response to ensure proper Hebrew only"""
        import re
        
        if not response:
            return "אני כאן כדי לעזור! איך אני יכול לתמוך בך היום? 💪"
        
        # Remove common English patterns that AI models add
        english_patterns = [
            r'\bDo you want.*?\?',
            r'\bGreat!\b',
            r'\bI\'m here.*?\.', 
            r'\bTell me.*?\.?',
            r'\bWhat.*?\?',
            r'\bHow.*?\?',
            r'\bLet\'s.*?!?',
            r'\bYou can.*?\.?',
            r'\bI can help.*?\.?',
            r'\(?nutrition tips.*?\)?',
            r'\(?exercising.*?\)?',
            r'\(?What do you think.*?\)?',
            r'exercising\?',
            r'start\?',
            r'goal\?'
        ]
        
        cleaned = response
        for pattern in english_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Remove parentheses with English content
        cleaned = re.sub(r'\([^)]*[a-zA-Z][^)]*\)', '', cleaned)
        
        # Clean up extra spaces and line breaks
        cleaned = re.sub(r'\s+', ' ', cleaned)
        cleaned = cleaned.strip()
        
        # Remove sentences that are mostly English
        sentences = cleaned.split('.')
        hebrew_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence:
                # Count Hebrew vs English characters
                hebrew_chars = len(re.findall(r'[\u0590-\u05FF]', sentence))
                english_chars = len(re.findall(r'[a-zA-Z]', sentence))
                
                # Keep if mostly Hebrew or has good Hebrew content
                if hebrew_chars > english_chars or hebrew_chars > 5:
                    hebrew_sentences.append(sentence)
        
        result = '. '.join(hebrew_sentences)
        
        # If result is empty or too short, provide fallback
        if len(result.strip()) < 10:
            return "מעולה! אני כאן כדי לעזור לך עם האימונים. איך הרגשת היום? 💪"
        
        # Ensure it ends properly
        if not result.endswith(('.', '!', '?')):
            result += '.'
        
        return result.strip()
    
    def _detect_exercise_in_response(self, user_message: str, ai_response: str) -> Optional[Dict[str, Any]]:
        """Detect if the conversation contains exercise information"""
        # Simple exercise detection - this could be enhanced with the Hebrew parser
        exercise_keywords = ["אימון", "תרגיל", "סקוואט", "שכיבות", "ברפי", "דדליפט", "קילו", "חזרות"]
        
        combined_text = f"{user_message} {ai_response}".lower()
        
        for keyword in exercise_keywords:
            if keyword in combined_text:
                # Basic points calculation
                points = 10  # Default points for mentioning exercise
                return {
                    "detected": True,
                    "keywords": [keyword],
                    "points": points,
                    "source": "conversation"
                }
        
        return None
    
    async def get_models_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all available models"""
        status = {}
        
        for model_name, config in self.available_models.items():
            try:
                if config["type"] == "api":
                    # Check API key availability
                    api_key = os.getenv(config["api_key_env"])
                    status[model_name] = {
                        "available": bool(api_key),
                        "status": "ready" if api_key else "missing_api_key",
                        "type": "api"
                    }
                elif config["type"] == "ollama":
                    # Check if Ollama is running
                    try:
                        async with httpx.AsyncClient(timeout=5.0) as client:
                            response = await client.get("http://localhost:11434/api/tags")
                            if response.status_code == 200:
                                models = response.json().get("models", [])
                                model_names = [m["name"] for m in models]
                                is_available = config["model_name"] in model_names
                                status[model_name] = {
                                    "available": is_available,
                                    "status": "ready" if is_available else "not_downloaded",
                                    "type": "ollama"
                                }
                            else:
                                status[model_name] = {
                                    "available": False,
                                    "status": "ollama_error",
                                    "type": "ollama"
                                }
                    except:
                        status[model_name] = {
                            "available": False,
                            "status": "ollama_not_running",
                            "type": "ollama"
                        }
            except Exception as e:
                status[model_name] = {
                    "available": False,
                    "status": "error",
                    "error": str(e),
                    "type": config["type"]
                }
        
        return status
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for model manager"""
        models_status = await self.get_models_status()
        
        available_count = sum(1 for status in models_status.values() if status["available"])
        total_count = len(models_status)
        
        return {
            "healthy": available_count > 0,
            "available_models": available_count,
            "total_models": total_count,
            "models": models_status,
            "whisper_loaded": self.whisper_model is not None,
            "tts_loaded": self.tts_service is not None
        }
    
    async def cleanup(self):
        """Cleanup resources on shutdown"""
        logger.info("Cleaning up Hebrew models...")
        self.is_initialized = False

# Mock implementations for development
class MockWhisperModel:
    """Mock Whisper model for development"""
    
    async def transcribe(self, audio_data: bytes, language: str = "he") -> Dict[str, Any]:
        """Mock transcription"""
        return {
            "text": "עשיתי 20 סקוואטים",
            "confidence": 0.95,
            "language": language,
            "duration": 3.5
        }
    
    async def process_chunk(self, audio_chunk: bytes) -> Dict[str, Any]:
        """Mock chunk processing"""
        return {
            "text": "סקוואט",
            "is_final": False,
            "confidence": 0.85
        }

class MockExerciseParser:
    """Mock exercise parser for development"""
    
    async def parse(self, text: str) -> Dict[str, Any]:
        """Mock parsing"""
        # Simple pattern matching for demonstration
        exercise_map = {
            "סקוואט": "squat",
            "שכיבות": "pushup",
            "ברפי": "burpee",
            "משיכות": "pullup",
            "בטן": "situp"
        }
        
        result = {}
        text_lower = text.lower()
        
        # Find exercise
        for hebrew, english in exercise_map.items():
            if hebrew in text_lower:
                result["exercise"] = english
                result["exercise_he"] = hebrew
                break
        
        # Extract numbers
        import re
        numbers = re.findall(r'\d+', text)
        if numbers:
            # First number is usually reps
            result["count"] = int(numbers[0])
            # If "קילו" in text, second number might be weight
            if "קילו" in text_lower and len(numbers) > 1:
                result["weight"] = float(numbers[1])
            elif "קילו" in text_lower and len(numbers) == 1:
                result["weight"] = float(numbers[0])
                result["count"] = 1  # Default to 1 rep if only weight specified
        
        return result

class MockTTSService:
    """Mock TTS service for development"""
    
    async def synthesize(self, text: str, voice: str = "default") -> bytes:
        """Mock TTS synthesis"""
        # Return empty audio bytes for mock
        return b"MOCK_AUDIO_DATA_" + text.encode('utf-8')
