#!/usr/bin/env python3
"""
Voice Recorder Module for PersonalSweatBot
Enables real-time Hebrew voice recording and processing
"""

import asyncio
import logging
import numpy as np
import sounddevice as sd
import soundfile as sf
import threading
import time
from typing import Optional, Callable, Dict, Any
from pathlib import Path
import tempfile
import queue

logger = logging.getLogger(__name__)

class VoiceRecorder:
    """Real-time voice recorder for Hebrew fitness commands"""
    
    def __init__(
        self,
        sample_rate: int = 16000,
        channels: int = 1,
        chunk_duration: float = 0.1,  # 100ms chunks
        silence_threshold: float = 0.02,
        silence_duration: float = 1.5,  # Stop recording after 1.5s of silence
        max_recording_time: float = 10.0,  # Max 10 seconds per recording
        audio_format: str = 'float32'
    ):
        """Initialize voice recorder with Hebrew-optimized settings"""
        
        self.sample_rate = sample_rate
        self.channels = channels
        self.chunk_duration = chunk_duration
        self.chunk_size = int(sample_rate * chunk_duration)
        self.silence_threshold = silence_threshold
        self.silence_duration = silence_duration
        self.max_recording_time = max_recording_time
        self.audio_format = audio_format
        
        # Recording state
        self.is_recording = False
        self.audio_buffer = []
        self.recording_thread = None
        self.audio_queue = queue.Queue()
        
        # Callbacks
        self.on_audio_data: Optional[Callable[[np.ndarray], None]] = None
        self.on_recording_start: Optional[Callable[[], None]] = None
        self.on_recording_stop: Optional[Callable[[np.ndarray], None]] = None
        self.on_silence_detected: Optional[Callable[[float], None]] = None
        self.on_error: Optional[Callable[[Exception], None]] = None
        
        # Silence detection
        self.silence_start_time = None
        self.last_audio_level = 0.0
        
        # Device info
        self.input_device = None
        self._check_audio_devices()
    
    def _check_audio_devices(self):
        """Check and select the best input device"""
        try:
            devices = sd.query_devices()
            
            # Find default input device
            default_input = sd.query_devices(kind='input')
            if default_input:
                self.input_device = default_input['name']
                logger.info(f"Using input device: {self.input_device}")
            else:
                logger.warning("No input device found")
                
        except Exception as e:
            logger.error(f"Error checking audio devices: {e}")
    
    def start_recording(self) -> bool:
        """Start recording voice input"""
        if self.is_recording:
            logger.warning("Recording already in progress")
            return False
        
        try:
            self.is_recording = True
            self.audio_buffer = []
            self.silence_start_time = None
            
            # Start recording thread
            self.recording_thread = threading.Thread(target=self._recording_loop, daemon=True)
            self.recording_thread.start()
            
            if self.on_recording_start:
                self.on_recording_start()
            
            logger.info("🎤 Started voice recording")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            self.is_recording = False
            if self.on_error:
                self.on_error(e)
            return False
    
    def stop_recording(self) -> Optional[np.ndarray]:
        """Stop recording and return audio data"""
        if not self.is_recording:
            return None
        
        self.is_recording = False
        
        # Wait for recording thread to finish
        if self.recording_thread and self.recording_thread.is_alive():
            self.recording_thread.join(timeout=1.0)
        
        # Combine audio buffer
        if self.audio_buffer:
            audio_data = np.concatenate(self.audio_buffer, axis=0)
            
            if self.on_recording_stop:
                self.on_recording_stop(audio_data)
            
            logger.info(f"🛑 Stopped recording: {len(audio_data)} samples ({len(audio_data)/self.sample_rate:.2f}s)")
            return audio_data
        
        logger.warning("No audio data recorded")
        return None
    
    def _recording_loop(self):
        """Main recording loop running in separate thread"""
        try:
            start_time = time.time()
            
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype=self.audio_format,
                blocksize=self.chunk_size,
                callback=self._audio_callback
            ):
                
                while self.is_recording:
                    current_time = time.time()
                    elapsed = current_time - start_time
                    
                    # Check maximum recording time
                    if elapsed > self.max_recording_time:
                        logger.info("Maximum recording time reached")
                        break
                    
                    # Process audio queue
                    try:
                        while True:
                            chunk = self.audio_queue.get_nowait()
                            self._process_audio_chunk(chunk, current_time)
                    except queue.Empty:
                        pass
                    
                    time.sleep(0.01)  # Small delay
                    
        except Exception as e:
            logger.error(f"Recording loop error: {e}")
            if self.on_error:
                self.on_error(e)
        finally:
            self.is_recording = False
    
    def _audio_callback(self, indata: np.ndarray, frames: int, time_info, status):
        """Called by sounddevice for each audio chunk"""
        if status:
            logger.warning(f"Audio callback status: {status}")
        
        if self.is_recording:
            # Copy data and add to queue for processing
            audio_chunk = indata.copy().flatten()
            self.audio_queue.put(audio_chunk)
    
    def _process_audio_chunk(self, chunk: np.ndarray, current_time: float):
        """Process individual audio chunk"""
        # Add to buffer
        self.audio_buffer.append(chunk)
        
        # Calculate audio level (RMS)
        audio_level = np.sqrt(np.mean(chunk ** 2))
        self.last_audio_level = audio_level
        
        # Silence detection
        if audio_level < self.silence_threshold:
            if self.silence_start_time is None:
                self.silence_start_time = current_time
            else:
                silence_duration = current_time - self.silence_start_time
                
                if self.on_silence_detected:
                    self.on_silence_detected(silence_duration)
                
                # Stop recording after prolonged silence
                if silence_duration >= self.silence_duration and len(self.audio_buffer) > 10:
                    logger.info(f"Silence detected for {silence_duration:.1f}s, stopping recording")
                    self.is_recording = False
        else:
            # Reset silence detection
            self.silence_start_time = None
        
        # Callback for real-time audio data
        if self.on_audio_data:
            self.on_audio_data(chunk)
    
    def save_audio_file(self, audio_data: np.ndarray, filename: Optional[str] = None) -> str:
        """Save audio data to file"""
        if filename is None:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            filename = temp_file.name
            temp_file.close()
        
        try:
            sf.write(filename, audio_data, self.sample_rate)
            logger.info(f"Audio saved to: {filename}")
            return filename
        except Exception as e:
            logger.error(f"Failed to save audio: {e}")
            raise
    
    def get_recording_info(self) -> Dict[str, Any]:
        """Get current recording information"""
        return {
            "is_recording": self.is_recording,
            "sample_rate": self.sample_rate,
            "channels": self.channels,
            "input_device": self.input_device,
            "buffer_length": len(self.audio_buffer) if self.audio_buffer else 0,
            "last_audio_level": self.last_audio_level,
            "silence_threshold": self.silence_threshold
        }
    
    def test_microphone(self, duration: float = 2.0) -> Dict[str, Any]:
        """Test microphone functionality"""
        logger.info(f"Testing microphone for {duration} seconds...")
        
        try:
            # Record test audio
            test_audio = sd.rec(
                int(duration * self.sample_rate),
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype=self.audio_format
            )
            sd.wait()  # Wait for recording to finish
            
            # Analyze audio
            audio_level = np.sqrt(np.mean(test_audio ** 2))
            max_level = np.max(np.abs(test_audio))
            
            result = {
                "success": True,
                "duration": duration,
                "audio_level": float(audio_level),
                "max_level": float(max_level),
                "samples": len(test_audio),
                "working": audio_level > 0.001  # Basic threshold for working mic
            }
            
            status = "✅ Working" if result["working"] else "❌ Not detecting audio"
            logger.info(f"Microphone test: {status} (level: {audio_level:.4f})")
            
            return result
            
        except Exception as e:
            logger.error(f"Microphone test failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "working": False
            }
    
    def set_callbacks(
        self,
        on_start: Optional[Callable[[], None]] = None,
        on_stop: Optional[Callable[[np.ndarray], None]] = None,
        on_audio: Optional[Callable[[np.ndarray], None]] = None,
        on_silence: Optional[Callable[[float], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None
    ):
        """Set callback functions for recording events"""
        if on_start:
            self.on_recording_start = on_start
        if on_stop:
            self.on_recording_stop = on_stop
        if on_audio:
            self.on_audio_data = on_audio
        if on_silence:
            self.on_silence_detected = on_silence
        if on_error:
            self.on_error = on_error
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        if self.is_recording:
            self.stop_recording()

# Helper functions for easy integration
def create_voice_recorder(**kwargs) -> VoiceRecorder:
    """Create a VoiceRecorder with sensible defaults"""
    return VoiceRecorder(**kwargs)

def quick_record(duration: float = 5.0, output_file: Optional[str] = None) -> str:
    """Quick voice recording function"""
    recorder = VoiceRecorder()
    
    print(f"🎤 Recording for {duration} seconds... (speak now)")
    
    # Record audio
    audio_data = sd.rec(
        int(duration * recorder.sample_rate),
        samplerate=recorder.sample_rate,
        channels=recorder.channels,
        dtype=recorder.audio_format
    )
    sd.wait()
    
    # Save to file
    audio_file = recorder.save_audio_file(audio_data.flatten(), output_file)
    print(f"✅ Recording saved to: {audio_file}")
    
    return audio_file

if __name__ == "__main__":
    # Test voice recorder
    import sys
    
    logging.basicConfig(level=logging.INFO)
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test microphone
        recorder = VoiceRecorder()
        test_result = recorder.test_microphone()
        print(f"Microphone test result: {test_result}")
    
    elif len(sys.argv) > 1 and sys.argv[1] == "record":
        # Quick recording test
        duration = float(sys.argv[2]) if len(sys.argv) > 2 else 3.0
        audio_file = quick_record(duration)
        print(f"Recorded audio saved to: {audio_file}")
    
    else:
        # Interactive recording test
        recorder = VoiceRecorder()
        
        def on_start():
            print("🎤 Recording started... (speak Hebrew exercise commands)")
        
        def on_stop(audio):
            print(f"🛑 Recording stopped: {len(audio)} samples")
            
        def on_silence(duration):
            if duration > 1.0:
                print(f"🔇 Silence: {duration:.1f}s")
        
        recorder.set_callbacks(on_start=on_start, on_stop=on_stop, on_silence=on_silence)
        
        print("Voice Recorder Test")
        print("Press ENTER to start recording, 's' to stop, 'q' to quit")
        
        while True:
            key = input("> ").lower().strip()
            
            if key == 'q':
                break
            elif key == 's':
                audio_data = recorder.stop_recording()
                if audio_data is not None:
                    filename = recorder.save_audio_file(audio_data)
                    print(f"Audio saved: {filename}")
            elif key == '':
                recorder.start_recording()
            else:
                print("Unknown command. Use ENTER (start), 's' (stop), 'q' (quit)")
        
        print("Voice recorder test completed")