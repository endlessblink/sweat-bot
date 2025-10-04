"""
Hebrew Voice Recognition Module using ivrit.ai Whisper and fallback options
Provides free Hebrew speech-to-text capabilities
"""

import torch
import numpy as np
from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
import whisper
import speech_recognition as sr
from typing import Optional, Dict, Any
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HebrewVoiceRecognition:
    """
    Hebrew voice recognition with multiple fallback options
    Priority: ivrit.ai Whisper -> OpenAI Whisper -> Google Speech Recognition
    """
    
    def __init__(self, model_preference: str = "ivrit"):
        self.model_preference = model_preference
        self.processor = None
        self.model = None
        self.whisper_model = None
        self.recognizer = sr.Recognizer()
        
        # Initialize based on preference
        if model_preference == "ivrit":
            self._init_ivrit_model()
        elif model_preference == "whisper":
            self._init_whisper_model()
    
    def _init_ivrit_model(self):
        """Initialize ivrit.ai Hebrew Whisper model (free)"""
        try:
            logger.info("Loading ivrit.ai Hebrew Whisper model...")
            self.processor = AutoProcessor.from_pretrained("ivrit-ai/whisper-large-v3")
            self.model = AutoModelForSpeechSeq2Seq.from_pretrained("ivrit-ai/whisper-large-v3")
            
            # Move to GPU if available
            if torch.cuda.is_available():
                self.model = self.model.cuda()
            
            logger.info("ivrit.ai model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load ivrit.ai model: {e}")
            logger.info("Falling back to OpenAI Whisper")
            self._init_whisper_model()
    
    def _init_whisper_model(self):
        """Initialize OpenAI Whisper with Hebrew support"""
        try:
            logger.info("Loading OpenAI Whisper model...")
            self.whisper_model = whisper.load_model("base")
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
    
    def transcribe_audio(self, audio_path: str, language: str = "he") -> Dict[str, Any]:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio file
            language: Language code (he for Hebrew, en for English)
            
        Returns:
            Dictionary with transcription and metadata
        """
        result = {
            "text": "",
            "language": language,
            "confidence": 0.0,
            "method": "none"
        }
        
        # Try ivrit.ai model first
        if self.model and self.processor:
            try:
                result = self._transcribe_with_ivrit(audio_path)
                if result["text"]:
                    return result
            except Exception as e:
                logger.error(f"ivrit.ai transcription failed: {e}")
        
        # Try OpenAI Whisper
        if self.whisper_model:
            try:
                result = self._transcribe_with_whisper(audio_path, language)
                if result["text"]:
                    return result
            except Exception as e:
                logger.error(f"Whisper transcription failed: {e}")
        
        # Fallback to Google Speech Recognition
        try:
            result = self._transcribe_with_google(audio_path, language)
        except Exception as e:
            logger.error(f"Google transcription failed: {e}")
        
        return result
    
    def _transcribe_with_ivrit(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe using ivrit.ai Hebrew Whisper"""
        # Load audio
        import librosa
        audio, sr = librosa.load(audio_path, sr=16000)
        
        # Process audio
        inputs = self.processor(audio, sampling_rate=sr, return_tensors="pt")
        
        # Move to GPU if available
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # Generate transcription
        with torch.no_grad():
            generated_ids = self.model.generate(inputs["input_features"])
        
        transcription = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return {
            "text": transcription,
            "language": "he",
            "confidence": 0.95,  # ivrit.ai typically has high confidence
            "method": "ivrit.ai"
        }
    
    def _transcribe_with_whisper(self, audio_path: str, language: str) -> Dict[str, Any]:
        """Transcribe using OpenAI Whisper"""
        result = self.whisper_model.transcribe(
            audio_path,
            language=language,
            task="transcribe"
        )
        
        return {
            "text": result["text"],
            "language": result.get("language", language),
            "confidence": 0.9,
            "method": "whisper"
        }
    
    def _transcribe_with_google(self, audio_path: str, language: str) -> Dict[str, Any]:
        """Transcribe using Google Speech Recognition (free tier)"""
        # Convert language code to Google format
        lang_map = {
            "he": "he-IL",
            "en": "en-US"
        }
        google_lang = lang_map.get(language, "he-IL")
        
        # Load audio file
        with sr.AudioFile(audio_path) as source:
            audio = self.recognizer.record(source)
        
        # Transcribe
        try:
            text = self.recognizer.recognize_google(audio, language=google_lang)
            return {
                "text": text,
                "language": language,
                "confidence": 0.8,
                "method": "google"
            }
        except sr.UnknownValueError:
            return {
                "text": "",
                "language": language,
                "confidence": 0.0,
                "method": "google"
            }
    
    def transcribe_microphone(self, duration: int = 5, language: str = "he") -> Dict[str, Any]:
        """
        Transcribe from microphone input
        
        Args:
            duration: Recording duration in seconds
            language: Language code
            
        Returns:
            Transcription result
        """
        import tempfile
        import sounddevice as sd
        import soundfile as sf
        
        # Record audio
        logger.info(f"Recording for {duration} seconds...")
        audio_data = sd.rec(int(duration * 16000), samplerate=16000, channels=1)
        sd.wait()
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            sf.write(tmp_file.name, audio_data, 16000)
            result = self.transcribe_audio(tmp_file.name, language)
        
        # Clean up
        os.unlink(tmp_file.name)
        
        return result
    
    def detect_language(self, audio_path: str) -> str:
        """
        Detect language from audio
        
        Returns:
            Language code (he or en)
        """
        if self.whisper_model:
            # Use Whisper's language detection
            audio = whisper.load_audio(audio_path)
            audio = whisper.pad_or_trim(audio)
            mel = whisper.log_mel_spectrogram(audio).to(self.whisper_model.device)
            
            _, probs = self.whisper_model.detect_language(mel)
            detected_lang = max(probs, key=probs.get)
            
            return "he" if detected_lang == "he" else "en"
        
        # Default to Hebrew
        return "he"


# Example usage
if __name__ == "__main__":
    # Initialize Hebrew voice recognition
    hebrew_asr = HebrewVoiceRecognition(model_preference="ivrit")
    
    # Example: Transcribe from file
    # result = hebrew_asr.transcribe_audio("workout_audio.wav", language="he")
    # print(f"Transcription: {result['text']}")
    # print(f"Method used: {result['method']}")
    
    # Example: Record from microphone
    # result = hebrew_asr.transcribe_microphone(duration=5, language="he")
    # print(f"You said: {result['text']}")