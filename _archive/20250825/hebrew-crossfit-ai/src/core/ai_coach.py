"""
Bilingual AI Coach with Hebrew Support
Provides intelligent coaching responses in Hebrew and English using free/low-cost LLMs
"""

import os
import json
import random
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import requests
from groq import Groq
import openai

# Load environment variables from .env file
def load_env_file():
    """Load environment variables from .env file"""
    try:
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        if key and value:
                            os.environ[key] = value
    except Exception as e:
        # Don't crash if .env file has issues
        pass

# Load .env file at import
try:
    load_env_file()
except:
    pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HebrewAICoach:
    """
    Bilingual AI coach with personality and context awareness
    Uses Groq (free tier) as primary, with OpenAI as fallback
    """
    
    def __init__(self, personality: str = "supportive", api_preference: str = "groq"):
        self.personality = personality
        self.api_preference = api_preference
        self.conversation_history = []
        self.workout_context = {}
        
        # Initialize API clients
        self.groq_client = None
        self.openai_client = None
        
        if api_preference in ["groq", "both"]:
            self._init_groq()
        if api_preference in ["openai", "both"]:
            self._init_openai()
        
        # Coach personalities
        self.personalities = {
            "supportive": {
                "he": {
                    "system": """אתה מאמן כושר תומך ומעודד. אתה חיובי, סבלני ומתמקד בהתקדמות האישית של המתאמן.
                    השתמש בשפה חמה ומעודדת. תן משוב בונה וחגוג כל הישג, קטן כגדול.""",
                    "tone": "חם ומעודד"
                },
                "en": {
                    "system": """You are a supportive and encouraging fitness coach. You are positive, patient, and focus on personal progress.
                    Use warm and encouraging language. Give constructive feedback and celebrate every achievement.""",
                    "tone": "warm and encouraging"
                }
            },
            "drill_sergeant": {
                "he": {
                    "system": """אתה מאמן צבאי קשוח. אתה תקיף, דורש ולא מקבל תירוצים.
                    השתמש בשפה ישירה וחדה. דחוף את המתאמן לגבולות שלו.""",
                    "tone": "תקיף וישיר"
                },
                "en": {
                    "system": """You are a tough military drill sergeant coach. You are assertive, demanding, and don't accept excuses.
                    Use direct and sharp language. Push the trainee to their limits.""",
                    "tone": "assertive and direct"
                }
            },
            "professional": {
                "he": {
                    "system": """אתה מאמן כושר מקצועי. אתה מדויק, ממוקד בטכניקה ומבוסס על מדע הספורט.
                    השתמש במונחים מקצועיים והסבר את הלוגיקה מאחורי ההנחיות.""",
                    "tone": "מקצועי ומדויק"
                },
                "en": {
                    "system": """You are a professional fitness coach. You are precise, technique-focused, and based on sports science.
                    Use professional terms and explain the logic behind your guidance.""",
                    "tone": "professional and precise"
                }
            }
        }
    
    def _init_groq(self):
        """Initialize Groq client (free tier)"""
        try:
            api_key = os.getenv("GROQ_API_KEY")
            if api_key:
                self.groq_client = Groq(api_key=api_key)
                logger.info("Groq client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Groq: {e}")
    
    def _init_openai(self):
        """Initialize OpenAI client"""
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                openai.api_key = api_key
                self.openai_client = openai
                logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI: {e}")
    
    def generate_response(self, user_input: str, language: str = "he", 
                         context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generate AI coaching response
        
        Args:
            user_input: User's message
            language: Language code (he/en)
            context: Additional context (workout data, achievements, etc.)
            
        Returns:
            Dictionary with response and metadata
        """
        # Update workout context
        if context:
            self.workout_context.update(context)
        
        # Build conversation
        system_prompt = self._get_system_prompt(language)
        messages = self._build_messages(system_prompt, user_input, language)
        
        # Try Groq first (free and fast)
        if self.groq_client:
            try:
                response = self._generate_groq_response(messages)
                if response:
                    return response
            except Exception as e:
                logger.error(f"Groq generation failed: {e}")
        
        # Fallback to OpenAI
        if self.openai_client:
            try:
                response = self._generate_openai_response(messages, language)
                if response:
                    return response
            except Exception as e:
                logger.error(f"OpenAI generation failed: {e}")
        
        # Try free Gemini API first (excellent Hebrew support)
        try:
            response = self._generate_gemini_response(messages, language)
            if response:
                return response
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
        
        # Try Ollama (local AI)
        try:
            response = self._generate_ollama_response(messages, language)
            if response:
                return response
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
        
        # Try free Hugging Face API
        try:
            response = self._generate_huggingface_response(messages, language)
            if response:
                return response
        except Exception as e:
            logger.error(f"Hugging Face generation failed: {e}")
        
        # Fallback to predefined responses
        return self._get_fallback_response(user_input, language)
    
    def _get_system_prompt(self, language: str) -> str:
        """Get personality-based system prompt"""
        personality_data = self.personalities.get(self.personality, self.personalities["supportive"])
        base_prompt = personality_data[language]["system"]
        
        # Add conciseness instruction
        concise_instruction = "\n\nIMPORTANT: Keep responses VERY SHORT. Maximum 1-2 sentences only! Answer the specific question directly. No encouragement unless asked."
        if language == "he":
            concise_instruction = "\n\nחשוב מאוד: תשובות קצרות מאוד! מקסימום משפט אחד או שניים! ענה ישירות על השאלה הספציפית. בלי עידודים אלא אם ביקשו."
        
        # Add context to prompt
        context_prompt = ""
        if self.workout_context:
            if language == "he":
                context_prompt = f"\n\nהקשר נוכחי: {json.dumps(self.workout_context, ensure_ascii=False)}"
            else:
                context_prompt = f"\n\nCurrent context: {json.dumps(self.workout_context)}"
        
        return base_prompt + concise_instruction + context_prompt
    
    def _build_messages(self, system_prompt: str, user_input: str, language: str) -> List[Dict]:
        """Build conversation messages"""
        # Add direct answer examples for common questions
        examples = ""
        if language == "he":
            examples = "\n\nדוגמאות לתשובות ישירות:\nשאלה: האם 10 שכיבות סמיכה זה הרבה?\nתשובה: 10 שכיבות סמיכה זה התחלה טובה. רוב המתחילים עושים 5-15.\n\nשאלה: איך להשתפר?\nתשובה: הוסף 2-3 חזרות כל שבוע או שפר את הטכניקה."
        
        messages = [{"role": "system", "content": system_prompt + examples}]
        
        # Add conversation history (last 5 exchanges)
        for msg in self.conversation_history[-10:]:
            messages.append(msg)
        
        # Add current user input
        messages.append({"role": "user", "content": user_input})
        
        return messages
    
    def _generate_groq_response(self, messages: List[Dict]) -> Optional[Dict[str, Any]]:
        """Generate response using Groq (free tier)"""
        response = self.groq_client.chat.completions.create(
            model="llama3-8b-8192",  # Free model
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        
        # Update conversation history
        self.conversation_history.append({"role": "assistant", "content": content})
        
        return {
            "text": content,
            "model": "groq-llama3",
            "tokens_used": response.usage.total_tokens if hasattr(response, 'usage') else 0
        }
    
    def _generate_openai_response(self, messages: List[Dict], language: str) -> Optional[Dict[str, Any]]:
        """Generate response using OpenAI"""
        response = self.openai_client.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Cheaper model
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        content = response.choices[0].message.content
        
        # Update conversation history
        self.conversation_history.append({"role": "assistant", "content": content})
        
        return {
            "text": content,
            "model": "gpt-3.5-turbo",
            "tokens_used": response.usage.total_tokens
        }
    
    def _generate_ollama_response(self, messages: List[Dict], language: str) -> Optional[Dict[str, Any]]:
        """Generate response using Ollama (local AI)"""
        try:
            import requests
            
            # Check if Ollama is running
            try:
                status_response = requests.get("http://localhost:11434/api/tags", timeout=2)
                if status_response.status_code != 200:
                    return None
            except:
                return None
            
            # Build prompt from messages
            prompt = ""
            for msg in messages:
                if msg["role"] == "system":
                    prompt += f"System: {msg['content']}\n"
                elif msg["role"] == "user":
                    prompt += f"User: {msg['content']}\n"
                elif msg["role"] == "assistant":
                    prompt += f"Assistant: {msg['content']}\n"
            
            prompt += "Assistant:"
            
            # Use different models based on language
            if language == "he":
                # Models that work well with Hebrew
                models = ["llama3.1:8b", "llama3:8b", "mistral:7b", "qwen2:7b"]
            else:
                models = ["llama3.1:8b", "llama3:8b", "mistral:7b"]
            
            # Try each model
            for model in models:
                try:
                    payload = {
                        "model": model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "stop": ["\nUser:", "\nSystem:"]
                        }
                    }
                    
                    response = requests.post("http://localhost:11434/api/generate", 
                                           json=payload, timeout=30)
                    
                    if response.status_code == 200:
                        result = response.json()
                        generated_text = result.get("response", "").strip()
                        if generated_text:
                            return {
                                "text": generated_text,
                                "model": f"ollama-{model}",
                                "tokens_used": 0
                            }
                except Exception as e:
                    logger.debug(f"Ollama model {model} failed: {e}")
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return None
    
    def _generate_gemini_response(self, messages: List[Dict], language: str) -> Optional[Dict[str, Any]]:
        """Generate response using free Gemini API"""
        try:
            import requests
            
            # Check for Gemini API key
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return None
            
            # Build conversation text
            conversation_text = ""
            for msg in messages:
                if msg["role"] == "system":
                    conversation_text += f"System: {msg['content']}\n"
                elif msg["role"] == "user":
                    conversation_text += f"User: {msg['content']}\n"
                elif msg["role"] == "assistant":
                    conversation_text += f"Assistant: {msg['content']}\n"
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": conversation_text
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 1,
                    "topP": 1,
                    "maxOutputTokens": 50,
                    "stopSequences": []
                }
            }
            
            response = requests.post(url, json=payload, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                if "candidates" in result and len(result["candidates"]) > 0:
                    candidate = result["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        generated_text = candidate["content"]["parts"][0]["text"].strip()
                        if generated_text:
                            return {
                                "text": generated_text,
                                "model": "gemini-1.5-flash",
                                "tokens_used": 0
                            }
            
            return None
            
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return None
    
    def _generate_huggingface_response(self, messages: List[Dict], language: str) -> Optional[Dict[str, Any]]:
        """Generate response using free Hugging Face API"""
        try:
            # Use free Hugging Face Inference API
            api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
            
            # Convert messages to simple text
            conversation_text = ""
            for msg in messages:
                if msg["role"] == "user":
                    conversation_text += f"User: {msg['content']}\n"
                elif msg["role"] == "assistant":
                    conversation_text += f"Assistant: {msg['content']}\n"
            
            conversation_text += "Assistant:"
            
            headers = {"Authorization": f"Bearer hf_demo"}  # Demo token
            payload = {
                "inputs": conversation_text,
                "parameters": {
                    "max_new_tokens": 100,
                    "temperature": 0.7,
                    "do_sample": True,
                    "return_full_text": False
                }
            }
            
            response = requests.post(api_url, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get("generated_text", "").strip()
                    if generated_text:
                        return {
                            "text": generated_text,
                            "model": "huggingface-free",
                            "tokens_used": 0
                        }
            
            return None
            
        except Exception as e:
            logger.error(f"Hugging Face API error: {e}")
            return None
    
    def _generate_local_response(self, user_input: str, language: str) -> Optional[Dict[str, Any]]:
        """Generate response using local transformer model"""
        try:
            # Use a simple local AI approach
            from transformers import pipeline
            
            # Use a small, fast model for conversation
            generator = pipeline('text-generation', 
                               model='microsoft/DialoGPT-small',
                               tokenizer='microsoft/DialoGPT-small')
            
            # Create contextual prompt
            if language == "he":
                context = f"אתה מאמן כושר תומך. המשתמש אמר: {user_input}. תענה בעברית באופן מעודד ומועיל:"
            else:
                context = f"You are a supportive fitness coach. The user said: {user_input}. Respond helpfully:"
            
            # Generate response
            response = generator(context, 
                               max_length=len(context) + 50,
                               num_return_sequences=1,
                               temperature=0.7,
                               do_sample=True,
                               pad_token_id=generator.tokenizer.eos_token_id)
            
            if response and len(response) > 0:
                generated_text = response[0]['generated_text']
                # Extract only the new part
                new_text = generated_text[len(context):].strip()
                if new_text:
                    return {
                        "text": new_text,
                        "model": "local-transformer",
                        "tokens_used": 0
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Local generation error: {e}")
            return None
    
    def _get_fallback_response(self, user_input: str, language: str) -> Dict[str, Any]:
        """Get contextual fallback response"""
        responses = self._get_predefined_responses(language)
        
        # Simple keyword matching
        user_input_lower = user_input.lower()
        
        # Detect context with better pattern matching
        if any(word in user_input_lower for word in ["סיימתי", "finished", "done", "complete"]):
            category = "workout_complete"
        elif any(word in user_input_lower for word in ["שיא", "record", "pr", "best"]):
            category = "pr_achieved"
        elif any(word in user_input_lower for word in ["קשה", "hard", "tired", "עייף"]):
            category = "motivation"
        elif any(word in user_input_lower for word in ["איך", "מה", "איזה", "how", "what", "which"]):
            category = "question"
        elif any(word in user_input_lower for word in ["תודה", "thanks", "thank"]):
            category = "thanks"
        elif any(word in user_input_lower for word in ["שכיבות", "push", "מתח", "pull", "סקוואט", "squat"]):
            category = "exercise_advice"
        else:
            category = "general"
        
        response_list = responses.get(category, responses["general"])
        
        # Add user input context to response
        selected_response = random.choice(response_list)
        if category == "question" and language == "he":
            selected_response = f"לגבי השאלה שלך: {selected_response}"
        elif category == "question" and language == "en":
            selected_response = f"Regarding your question: {selected_response}"
        
        return {
            "text": selected_response,
            "model": "fallback",
            "tokens_used": 0
        }
    
    def _get_predefined_responses(self, language: str) -> Dict[str, List[str]]:
        """Get predefined responses by category"""
        if language == "he":
            return {
                "workout_complete": [
                    "מעולה! סיימת את האימון! איך אתה מרגיש?",
                    "כל הכבוד! עוד אימון מוצלח בדרך למטרה!",
                    "אלוף! תמיד כיף לראות אותך מסיים חזק!"
                ],
                "pr_achieved": [
                    "וואו! שיא אישי חדש! אני גאה בך!",
                    "מדהים! שברת את השיא! זה מה שאני אוהב לראות!",
                    "איזה אלוף! שיא חדש זה תמיד סיבה לחגוג!"
                ],
                "motivation": [
                    "אני מבין שקשה, אבל אתה חזק יותר! תמשיך!",
                    "כל אלוף עבר רגעים קשים. זה הזמן שלך להוכיח!",
                    "קשה היום, חזק מחר! אל תוותר!"
                ],
                "question": [
                    "שאלה מעניינת! אני אשמח לעזור לך עם זה.",
                    "בטח! אני כאן בשביל לענות על שאלות כושר.",
                    "זו שאלה חשובה. בוא נדבר על זה."
                ],
                "thanks": [
                    "תמיד לשירותך! אני פה לעזור!",
                    "בכיף! זה מה שאני פה בשבילו!",
                    "אין בעד מה! תמיד שמח לעזור!"
                ],
                "exercise_advice": [
                    "בוא נדבר על התרגיל הזה! יש לי המון טיפים.",
                    "תרגיל נהדר! אני אוכל להדריך אותך איך לשפר.",
                    "זה תרגיל מעולה! רוצה עצות איך לעשות אותו טוב יותר?"
                ],
                "general": [
                    "איך אני יכול לעזור לך עם האימון שלך?",
                    "יש לי הרבה טיפים לכושר! על מה תרצה לדבר?",
                    "מה מעניין אותך באימון היום?"
                ]
            }
        else:
            return {
                "workout_complete": [
                    "Excellent! You finished the workout! How do you feel?",
                    "Well done! Another successful workout on the way to your goal!",
                    "Champion! Always great to see you finishing strong!"
                ],
                "pr_achieved": [
                    "Wow! New personal record! I'm proud of you!",
                    "Amazing! You broke the record! That's what I love to see!",
                    "What a beast! A new PR is always a reason to celebrate!"
                ],
                "motivation": [
                    "I understand it's hard, but you're stronger! Keep going!",
                    "Every champion went through tough moments. It's your time to prove!",
                    "Hard today, strong tomorrow! Don't give up!"
                ],
                "question": [
                    "Interesting question! I'd be happy to help with that.",
                    "Absolutely! I'm here to answer fitness questions.",
                    "That's an important question. Let's talk about it."
                ],
                "thanks": [
                    "Always at your service! I'm here to help!",
                    "My pleasure! That's what I'm here for!",
                    "No problem! Always happy to help!"
                ],
                "exercise_advice": [
                    "Let's talk about that exercise! I have tons of tips.",
                    "Great exercise! I can guide you on how to improve.",
                    "That's an excellent exercise! Want advice on doing it better?"
                ],
                "general": [
                    "How can I help you with your workout?",
                    "I have lots of fitness tips! What would you like to discuss?",
                    "What interests you about training today?"
                ]
            }
    
    def get_contextual_advice(self, exercise: str, performance_data: Dict, 
                             language: str = "he") -> str:
        """Get specific advice based on exercise and performance"""
        prompt = self._build_advice_prompt(exercise, performance_data, language)
        
        response = self.generate_response(prompt, language, {"requesting_advice": True})
        return response["text"]
    
    def _build_advice_prompt(self, exercise: str, performance_data: Dict, 
                           language: str) -> str:
        """Build prompt for specific advice"""
        if language == "he":
            return f"""
            התרגיל: {exercise}
            ביצועים: {performance_data.get('reps', 0)} חזרות, {performance_data.get('weight', 0)} ק"ג
            ביצועים קודמים: {performance_data.get('previous_best', 'אין')}
            
            תן עצה קצרה וממוקדת לשיפור הטכניקה או הביצועים.
            """
        else:
            return f"""
            Exercise: {exercise}
            Performance: {performance_data.get('reps', 0)} reps, {performance_data.get('weight', 0)} kg
            Previous best: {performance_data.get('previous_best', 'None')}
            
            Give brief and focused advice for improving technique or performance.
            """
    
    def analyze_workout_trends(self, workout_history: List[Dict], 
                             language: str = "he") -> Dict[str, Any]:
        """Analyze workout trends and provide insights"""
        # Calculate basic statistics
        total_workouts = len(workout_history)
        exercises = {}
        
        for workout in workout_history:
            exercise = workout.get("exercise", "")
            if exercise not in exercises:
                exercises[exercise] = []
            exercises[exercise].append(workout)
        
        # Generate analysis
        analysis_prompt = self._build_analysis_prompt(exercises, total_workouts, language)
        response = self.generate_response(analysis_prompt, language, {"analyzing_trends": True})
        
        return {
            "analysis": response["text"],
            "total_workouts": total_workouts,
            "unique_exercises": len(exercises),
            "most_frequent": max(exercises.items(), key=lambda x: len(x[1]))[0] if exercises else None
        }
    
    def _build_analysis_prompt(self, exercises: Dict, total_workouts: int, 
                             language: str) -> str:
        """Build prompt for workout analysis"""
        if language == "he":
            return f"""
            נתח את מגמות האימון הבאות:
            סך אימונים: {total_workouts}
            תרגילים ייחודיים: {len(exercises)}
            
            תן תובנות קצרות לגבי:
            1. התקדמות כללית
            2. נקודות חוזק
            3. המלצות לשיפור
            """
        else:
            return f"""
            Analyze the following workout trends:
            Total workouts: {total_workouts}
            Unique exercises: {len(exercises)}
            
            Provide brief insights about:
            1. Overall progress
            2. Strengths
            3. Recommendations for improvement
            """


# Example usage
if __name__ == "__main__":
    # Initialize Hebrew AI Coach
    coach = HebrewAICoach(personality="supportive", api_preference="groq")
    
    # Example: Generate response
    response = coach.generate_response(
        "סיימתי 20 חזרות של סקוואט עם 100 קילו!",
        language="he",
        context={"exercise": "squat", "reps": 20, "weight": 100}
    )
    print(f"Coach response: {response['text']}")
    
    # Example: Get contextual advice
    advice = coach.get_contextual_advice(
        "דדליפט",
        {"reps": 5, "weight": 150, "previous_best": "5x140kg"},
        language="he"
    )
    print(f"Advice: {advice}")