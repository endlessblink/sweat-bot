"""
Voice Service
Handles Hebrew voice transcription using OpenAI Whisper
"""

import asyncio
import io
import logging
import numpy as np
import wave
from typing import Optional, Union
from pathlib import Path
import tempfile
import os

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    logging.warning("pydub not available. Install with: pip install pydub")

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    logging.warning("Whisper not available. Install with: pip install openai-whisper")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logging.warning("PyTorch not available. Install with: pip install torch")

logger = logging.getLogger(__name__)

class VoiceService:
    """Service for voice transcription and processing"""
    
    def __init__(self, model_size: str = "base"):
        """
        Initialize voice service with Whisper model
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
        """
        self.model = None
        self.model_size = model_size
        self.supported_languages = ["he", "en", "ar"]
        
        # Audio processing settings
        self.sample_rate = 16000
        self.chunk_duration = 30  # seconds
        self.min_audio_length = 0.5  # minimum seconds
        
        # Model will be loaded on first use
        self._model_loaded = False
    
    async def _load_model(self):
        """Load Whisper model asynchronously"""
        if not WHISPER_AVAILABLE:
            logger.error("Whisper not available. Voice transcription disabled.")
            return
        
        try:
            # Load model in executor to avoid blocking
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(
                None, 
                whisper.load_model, 
                self.model_size
            )
            self._model_loaded = True
            logger.info(f"Whisper model '{self.model_size}' loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            self.model = None
            self._model_loaded = False
    
    async def transcribe_audio(
        self, 
        audio_data: Union[bytes, np.ndarray], 
        language: str = "he",
        format: str = "wav"
    ) -> Optional[str]:
        """
        Transcribe audio to text
        
        Args:
            audio_data: Raw audio bytes or numpy array
            language: Target language code (he, en, ar)
            format: Audio format (wav, mp3, etc.)
            
        Returns:
            Transcribed text or None if failed
        """
        # Load model on first use
        if not self._model_loaded:
            await self._load_model()
        
        if not self.model:
            logger.warning("Whisper model not loaded")
            return None
        
        if not audio_data:
            return None
        
        try:
            # Convert audio data to temporary file
            audio_file = await self._prepare_audio_file(audio_data, format)
            
            if not audio_file:
                return None
            
            # Transcribe using Whisper
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._transcribe_file,
                audio_file,
                language
            )
            
            # Clean up temporary file
            try:
                os.unlink(audio_file)
            except:
                pass
            
            if result and result.get("text"):
                text = result["text"].strip()
                
                # Post-process Hebrew text
                if language == "he":
                    text = self._post_process_hebrew(text)
                
                logger.info(f"Transcribed audio: '{text}' (confidence: {result.get('confidence', 'unknown')})")
                return text
            
            return None
            
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return None
    
    def _transcribe_file(self, audio_file: str, language: str) -> dict:
        """Transcribe audio file using Whisper (runs in executor)"""
        try:
            # Set language if supported
            whisper_language = None
            if language in self.supported_languages:
                whisper_language = language
            
            # Transcribe
            result = self.model.transcribe(
                audio_file,
                language=whisper_language,
                verbose=False,
                word_timestamps=False
            )
            
            return {
                "text": result["text"],
                "language": result.get("language"),
                "confidence": self._calculate_confidence(result)
            }
            
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")
            return {}
    
    async def _prepare_audio_file(self, audio_data: Union[bytes, np.ndarray], format: str) -> Optional[str]:
        """Prepare audio data as temporary file for Whisper"""
        try:
            if isinstance(audio_data, bytes):
                # Handle WebM format conversion
                if format.lower() == "webm":
                    return await self._convert_webm_to_wav(audio_data)
                
                # Create temporary file for other formats
                with tempfile.NamedTemporaryFile(suffix=f".{format}", delete=False) as temp_file:
                    temp_path = temp_file.name
                    
                    if format.lower() == "wav":
                        # Create proper WAV file
                        await self._create_wav_file(audio_data, temp_path)
                    else:
                        # Write raw data
                        temp_file.write(audio_data)
                        
            elif isinstance(audio_data, np.ndarray):
                # Convert numpy array to WAV
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    temp_path = temp_file.name
                await self._numpy_to_wav(audio_data, temp_path)
            else:
                logger.error(f"Unsupported audio data type: {type(audio_data)}")
                return None
            
            # Verify file size
            if os.path.getsize(temp_path) < 1000:  # Less than 1KB
                logger.warning("Audio file too small, skipping transcription")
                os.unlink(temp_path)
                return None
            
            return temp_path
            
        except Exception as e:
            logger.error(f"Error preparing audio file: {e}")
            return None
    
    async def _convert_webm_to_wav(self, webm_data: bytes) -> Optional[str]:
        """Convert WebM audio data to WAV format using pydub"""
        if not PYDUB_AVAILABLE:
            logger.error("pydub not available for WebM conversion")
            return None
            
        try:
            # Create temporary WebM file
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as webm_file:
                webm_path = webm_file.name
                webm_file.write(webm_data)
            
            # Convert WebM to WAV using pydub
            loop = asyncio.get_event_loop()
            wav_path = await loop.run_in_executor(
                None,
                self._pydub_convert_to_wav,
                webm_path
            )
            
            # Clean up WebM file
            try:
                os.unlink(webm_path)
            except:
                pass
            
            return wav_path
            
        except Exception as e:
            logger.error(f"Error converting WebM to WAV: {e}")
            return None
    
    def _pydub_convert_to_wav(self, webm_path: str) -> str:
        """Convert WebM to WAV using pydub (runs in executor)"""
        try:
            # Load WebM audio
            audio = AudioSegment.from_file(webm_path, format="webm")
            
            # Convert to mono, 16kHz sample rate
            audio = audio.set_channels(1)  # Mono
            audio = audio.set_frame_rate(self.sample_rate)  # 16kHz
            
            # Create WAV output path
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wav_file:
                wav_path = wav_file.name
            
            # Export as WAV
            audio.export(wav_path, format="wav")
            
            logger.info(f"Converted WebM to WAV: {webm_path} -> {wav_path}")
            return wav_path
            
        except Exception as e:
            logger.error(f"pydub conversion failed: {e}")
            raise
    
    async def _create_wav_file(self, audio_bytes: bytes, output_path: str):
        """Create proper WAV file from raw audio bytes"""
        try:
            # Assume 16-bit mono audio at 16kHz
            with wave.open(output_path, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(self.sample_rate)
                wav_file.writeframes(audio_bytes)
        except Exception as e:
            logger.error(f"Error creating WAV file: {e}")
            raise
    
    async def _numpy_to_wav(self, audio_array: np.ndarray, output_path: str):
        """Convert numpy array to WAV file"""
        try:
            # Normalize audio to 16-bit range
            if audio_array.dtype == np.float32 or audio_array.dtype == np.float64:
                audio_array = (audio_array * 32767).astype(np.int16)
            elif audio_array.dtype != np.int16:
                audio_array = audio_array.astype(np.int16)
            
            with wave.open(output_path, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(self.sample_rate)
                wav_file.writeframes(audio_array.tobytes())
        except Exception as e:
            logger.error(f"Error converting numpy to WAV: {e}")
            raise
    
    def _calculate_confidence(self, whisper_result: dict) -> float:
        """Calculate confidence score from Whisper result"""
        try:
            # Whisper doesn't provide direct confidence scores
            # Estimate based on text characteristics
            text = whisper_result.get("text", "")
            
            if not text:
                return 0.0
            
            confidence = 0.5  # Base confidence
            
            # Longer text generally more reliable
            if len(text) > 10:
                confidence += 0.2
            
            # No repeated characters
            if not any(char * 3 in text for char in "אבגדהוזחטיכלמנסעפצקרשת"):
                confidence += 0.1
            
            # Contains Hebrew letters
            if any(char in "אבגדהוזחטיכלמנסעפצקרשת" for char in text):
                confidence += 0.2
            
            return min(confidence, 1.0)
            
        except:
            return 0.5
    
    def _post_process_hebrew(self, text: str) -> str:
        """Post-process Hebrew transcription"""
        # Remove extra spaces
        text = " ".join(text.split())
        
        # Common Hebrew transcription fixes
        fixes = {
            "סקואט": "סקוואט",
            "סקוט": "סקוואט",
            "ברפיס": "ברפיז",
            "פולאפס": "פולאפ",
            "שכיבת": "שכיבות",
            "סמיכה": "סמיכה",
            "עליית": "עליות",
            "כפיפת": "כפיפות"
        }
        
        for wrong, correct in fixes.items():
            text = text.replace(wrong, correct)
        
        return text
    
    async def detect_language(self, audio_data: Union[bytes, np.ndarray]) -> str:
        """Detect the language of audio"""
        if not self.model:
            return "he"  # Default to Hebrew
        
        try:
            # Use a small sample to detect language
            audio_file = await self._prepare_audio_file(audio_data, "wav")
            if not audio_file:
                return "he"
            
            # Detect language
            loop = asyncio.get_event_loop()
            audio = await loop.run_in_executor(
                None,
                whisper.load_audio,
                audio_file
            )
            
            # Pad or trim to 30 seconds
            audio = whisper.pad_or_trim(audio)
            
            # Make log-Mel spectrogram
            mel = whisper.log_mel_spectrogram(audio).to(self.model.device)
            
            # Detect language
            _, probs = self.model.detect_language(mel)
            detected_language = max(probs, key=probs.get)
            
            # Clean up
            try:
                os.unlink(audio_file)
            except:
                pass
            
            return detected_language if detected_language in self.supported_languages else "he"
            
        except Exception as e:
            logger.error(f"Error detecting language: {e}")
            return "he"
    
    def is_available(self) -> bool:
        """Check if voice service is available"""
        return WHISPER_AVAILABLE and self.model is not None
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages"""
        return self.supported_languages.copy()
    
    async def health_check(self) -> dict:
        """Health check for voice service"""
        return {
            "available": self.is_available(),
            "model_loaded": self.model is not None,
            "model_size": self.model_size,
            "supported_languages": self.supported_languages,
            "whisper_available": WHISPER_AVAILABLE,
            "torch_available": TORCH_AVAILABLE
        }