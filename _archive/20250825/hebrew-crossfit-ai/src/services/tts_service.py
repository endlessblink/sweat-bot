"""
Hebrew Text-to-Speech Module
Provides free Hebrew TTS using multiple services with fallback options
"""

import os
import requests
import json
import base64
import logging
from typing import Optional, Dict, Any, List
import pygame
from gtts import gTTS
import tempfile
import threading
import queue

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HebrewTTSService:
    """
    Hebrew TTS with multiple free service options
    Priority: ElevenLabs free tier -> gTTS -> Edge TTS -> Narakeet free
    """
    
    def __init__(self, default_voice: str = "Hila"):
        self.default_voice = default_voice
        pygame.mixer.init()
        self.tts_queue = queue.Queue()
        self.is_playing = False
        
        # Hebrew voice mappings
        self.hebrew_voices = {
            "male": ["Shaul", "Yossi", "Avraham"],
            "female": ["Hila", "Rachel", "Miriam", "Tamar"],
            "energetic": ["Hila", "Yossi"],
            "calm": ["Rachel", "Avraham"]
        }
        
    def synthesize(self, text: str, voice: Optional[str] = None, 
                   language: str = "he", save_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesize Hebrew text to speech
        
        Args:
            text: Text to synthesize
            voice: Voice name or type (male/female/energetic/calm)
            language: Language code
            save_path: Optional path to save audio file
            
        Returns:
            Dictionary with audio data and metadata
        """
        voice = voice or self.default_voice
        
        # Try different TTS services in order
        result = None
        
        # Try ElevenLabs free tier
        try:
            result = self._synthesize_elevenlabs(text, voice, language)
            if result["success"]:
                logger.info("Successfully synthesized with ElevenLabs")
                if save_path:
                    self._save_audio(result["audio_data"], save_path)
                return result
        except Exception as e:
            logger.error(f"ElevenLabs TTS failed: {e}")
        
        # Try gTTS (Google Text-to-Speech)
        try:
            result = self._synthesize_gtts(text, language)
            if result["success"]:
                logger.info("Successfully synthesized with gTTS")
                if save_path:
                    self._save_audio(result["audio_data"], save_path)
                return result
        except Exception as e:
            logger.error(f"gTTS failed: {e}")
        
        # Try Edge TTS
        try:
            result = self._synthesize_edge_tts(text, voice, language)
            if result["success"]:
                logger.info("Successfully synthesized with Edge TTS")
                if save_path:
                    self._save_audio(result["audio_data"], save_path)
                return result
        except Exception as e:
            logger.error(f"Edge TTS failed: {e}")
        
        # Fallback response
        return {
            "success": False,
            "audio_data": None,
            "method": "none",
            "error": "All TTS services failed"
        }
    
    def _synthesize_elevenlabs(self, text: str, voice: str, language: str) -> Dict[str, Any]:
        """Synthesize using ElevenLabs free tier"""
        # Note: In production, use environment variable for API key
        api_key = os.getenv("ELEVENLABS_API_KEY", "free_tier_key")
        
        url = "https://api.elevenlabs.io/v1/text-to-speech/21eOLYPPZUH6YqxwKfJm"  # Hebrew voice ID
        
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            return {
                "success": True,
                "audio_data": response.content,
                "method": "elevenlabs",
                "format": "mp3"
            }
        else:
            raise Exception(f"ElevenLabs API error: {response.status_code}")
    
    def _synthesize_gtts(self, text: str, language: str) -> Dict[str, Any]:
        """Synthesize using Google Text-to-Speech (gTTS)"""
        # gTTS doesn't have native Hebrew support, but we can try
        lang_code = "iw" if language == "he" else language  # Hebrew code for gTTS
        
        tts = gTTS(text=text, lang=lang_code, slow=False)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tts.save(tmp_file.name)
            with open(tmp_file.name, "rb") as f:
                audio_data = f.read()
            os.unlink(tmp_file.name)
        
        return {
            "success": True,
            "audio_data": audio_data,
            "method": "gtts",
            "format": "mp3"
        }
    
    def _synthesize_edge_tts(self, text: str, voice: str, language: str) -> Dict[str, Any]:
        """Synthesize using Edge TTS (free Microsoft service)"""
        try:
            import edge_tts
            import asyncio
            
            # Hebrew voice for Edge TTS
            voice_name = "he-IL-AvriNeural" if "male" in voice.lower() else "he-IL-HilaNeural"
            
            async def generate():
                tts = edge_tts.Communicate(text, voice_name)
                audio_data = b""
                
                async for chunk in tts.stream():
                    if chunk["type"] == "audio":
                        audio_data += chunk["data"]
                
                return audio_data
            
            # Run async function
            audio_data = asyncio.run(generate())
            
            return {
                "success": True,
                "audio_data": audio_data,
                "method": "edge_tts",
                "format": "mp3"
            }
        except ImportError:
            logger.warning("edge-tts not installed. Install with: pip install edge-tts")
            raise
    
    def play_audio(self, audio_data: bytes, format: str = "mp3"):
        """Play audio data directly"""
        try:
            with tempfile.NamedTemporaryFile(suffix=f".{format}", delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_file.flush()
                tmp_file.close()  # Close before loading
                
                pygame.mixer.music.load(tmp_file.name)
                pygame.mixer.music.play()
                
                # Wait for playback to complete
                while pygame.mixer.music.get_busy():
                    pygame.time.Clock().tick(10)
                
                # Clean up
                try:
                    os.unlink(tmp_file.name)
                except:
                    pass  # Ignore cleanup errors
        except Exception as e:
            logger.error(f"Audio playback failed: {e}")
    
    def queue_speech(self, text: str, voice: Optional[str] = None, 
                     language: str = "he", priority: int = 0):
        """Add speech to queue for sequential playback"""
        self.tts_queue.put((priority, text, voice, language))
        
        if not self.is_playing:
            threading.Thread(target=self._process_queue, daemon=True).start()
    
    def _process_queue(self):
        """Process TTS queue"""
        self.is_playing = True
        
        while not self.tts_queue.empty():
            _, text, voice, language = self.tts_queue.get()
            
            result = self.synthesize(text, voice, language)
            if result["success"]:
                self.play_audio(result["audio_data"], result["format"])
        
        self.is_playing = False
    
    def _save_audio(self, audio_data: bytes, path: str):
        """Save audio data to file"""
        with open(path, "wb") as f:
            f.write(audio_data)
    
    def get_motivational_responses(self, context: str, language: str = "he") -> List[str]:
        """Get contextual motivational responses in Hebrew"""
        responses = {
            "he": {
                "pr_achieved": [
                    "וואו! שיא אישי חדש! אתה מתקדם בצורה מדהימה!",
                    "מעולה! שברת את השיא הקודם! המשך כך!",
                    "איזה חיה! שיא חדש! אתה מוכיח שאין גבולות!"
                ],
                "workout_complete": [
                    "סיימת את האימון! אתה אלוף!",
                    "עבודה מצוינת! עוד אימון מוצלח בדרך למטרה!",
                    "כל הכבוד! האימון הזה יקדם אותך!"
                ],
                "round_complete": [
                    "סיבוב הושלם! תמשיך חזק!",
                    "יפה! עוד סיבוב בכיס!",
                    "מעולה! ממשיך לדחוף קדימה!"
                ],
                "encouragement": [
                    "יאללה! אתה יכול!",
                    "תמשיך! אתה חזק!",
                    "אל תוותר! עוד קצת!"
                ]
            },
            "en": {
                "pr_achieved": [
                    "Amazing! New personal record! You're crushing it!",
                    "Excellent! You beat your previous best!",
                    "What a beast! New PR! You're unstoppable!"
                ],
                "workout_complete": [
                    "Workout complete! You're a champion!",
                    "Great work! Another successful session!",
                    "Well done! This workout brings you closer!"
                ],
                "round_complete": [
                    "Round complete! Keep going strong!",
                    "Nice! Another round done!",
                    "Excellent! Keep pushing forward!"
                ],
                "encouragement": [
                    "Come on! You got this!",
                    "Keep going! You're strong!",
                    "Don't give up! Almost there!"
                ]
            }
        }
        
        return responses.get(language, responses["he"]).get(context, [])


class HebrewVoicePersonality:
    """Manage different Hebrew voice personalities for the AI coach"""
    
    def __init__(self):
        self.personalities = {
            "drill_sergeant": {
                "name": "Yossi",
                "style": "aggressive",
                "pitch": 0.8,
                "speed": 1.2,
                "responses": {
                    "he": {
                        "greeting": "יאללה חייל! בוא נתחיל לעבוד!",
                        "encouragement": "תזוז! אין זמן למנוחה!",
                        "completion": "טוב! אבל מחר אני רוצה יותר!"
                    }
                }
            },
            "supportive_friend": {
                "name": "Rachel",
                "style": "gentle",
                "pitch": 1.1,
                "speed": 0.9,
                "responses": {
                    "he": {
                        "greeting": "היי! איזה כיף לראות אותך! בוא נתחיל?",
                        "encouragement": "אתה מדהים! המשך ככה!",
                        "completion": "כל הכבוד! אני גאה בך!"
                    }
                }
            },
            "professional_coach": {
                "name": "Avraham",
                "style": "balanced",
                "pitch": 1.0,
                "speed": 1.0,
                "responses": {
                    "he": {
                        "greeting": "שלום. מוכן לאימון היום?",
                        "encouragement": "טכניקה טובה. תמשיך בקצב הזה.",
                        "completion": "אימון מצוין. נתראה בפעם הבאה."
                    }
                }
            }
        }


# Example usage
if __name__ == "__main__":
    # Initialize Hebrew TTS
    hebrew_tts = HebrewTTSService(default_voice="Hila")
    
    # Example: Synthesize and play Hebrew text
    text = "שלום! ברוכים הבאים לאימון קרוספיט. בוא נתחיל!"
    result = hebrew_tts.synthesize(text, language="he")
    
    if result["success"]:
        print(f"Synthesized using: {result['method']}")
        # hebrew_tts.play_audio(result["audio_data"], result["format"])
    
    # Example: Queue multiple speeches
    # hebrew_tts.queue_speech("סט ראשון!", priority=1)
    # hebrew_tts.queue_speech("עשר חזרות!", priority=2)
    # hebrew_tts.queue_speech("יאללה!", priority=3)