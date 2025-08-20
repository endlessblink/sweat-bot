#!/usr/bin/env python3
"""
Voice-Enabled PersonalSweatBot
Complete voice interface for Hebrew fitness tracking with conversation persistence
"""

import sys
import os
import asyncio
import logging
import signal
import threading
import time
from typing import Optional
from datetime import datetime
from pathlib import Path

# Add project root to Python path
sys.path.append(os.path.dirname(__file__))
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('voice_sweatbot.log')
    ]
)
logger = logging.getLogger(__name__)

class VoiceSweatBot:
    """Voice-enabled PersonalSweatBot with Hebrew recognition"""
    
    def __init__(self):
        self.running = False
        self.voice_recorder = None
        self.sweatbot = None
        self.voice_service = None
        self.current_recording = None
        
        print("🚀 Initializing Voice SweatBot...")
        self._initialize_components()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _initialize_components(self):
        """Initialize all SweatBot components"""
        try:
            # Import after path setup
            from agents.voice_recorder import VoiceRecorder
            from agents.personal_sweatbot_enhanced import PersonalSweatBotEnhanced
            
            # Initialize voice recorder
            print("🎤 Setting up voice recorder...")
            self.voice_recorder = VoiceRecorder(
                silence_duration=2.0,  # Wait 2s of silence before stopping
                max_recording_time=15.0  # Max 15 seconds per command
            )
            
            # Test microphone
            mic_test = self.voice_recorder.test_microphone(duration=1.0)
            if not mic_test.get('working', False):
                print("⚠️ WARNING: Microphone may not be working properly")
                print(f"   Audio level: {mic_test.get('audio_level', 0):.4f}")
            else:
                print(f"✅ Microphone working (level: {mic_test.get('audio_level', 0):.4f})")
            
            # Initialize PersonalSweatBot with MongoDB memory
            print("🤖 Setting up PersonalSweatBot with conversation memory...")
            self.sweatbot = PersonalSweatBotEnhanced()
            
            # Test backend connection
            backend_test = self.sweatbot.test_backend_connection()
            if backend_test['success']:
                print("✅ Backend connection successful")
                if backend_test.get('authentication'):
                    print("✅ Authentication working")
                else:
                    print("⚠️ Authentication issues detected")
            else:
                print(f"❌ Backend connection failed: {backend_test.get('error', 'Unknown')}")
            
            # Initialize voice service for transcription
            try:
                sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'app', 'services'))
                from voice_service import VoiceService
                
                print("🎧 Setting up Hebrew voice transcription...")
                self.voice_service = VoiceService(model_size="base")
                
            except ImportError as e:
                print(f"⚠️ Voice transcription service not available: {e}")
                print("   Voice commands will be simulated with text input")
            
            # Setup voice recorder callbacks
            self._setup_voice_callbacks()
            
            print("✅ Voice SweatBot initialization complete!")
            
        except Exception as e:
            logger.error(f"Failed to initialize components: {e}")
            print(f"❌ Initialization failed: {e}")
            sys.exit(1)
    
    def _setup_voice_callbacks(self):
        """Setup callbacks for voice recording events"""
        def on_recording_start():
            print("🎤 Recording... (speak Hebrew exercise commands)")
            print("   Examples: 'עשיתי 20 סקוואטים', 'כמה נקודות יש לי?'")
        
        def on_recording_stop(audio_data):
            print("🔄 Processing voice command...")
            # Process in separate thread to avoid blocking
            threading.Thread(target=self._process_voice_command, args=(audio_data,), daemon=True).start()
        
        def on_silence_detected(duration):
            if duration > 1.0:
                print(f"🔇 Silence detected: {duration:.1f}s")
        
        def on_error(error):
            logger.error(f"Voice recording error: {error}")
            print(f"❌ Voice recording error: {error}")
        
        self.voice_recorder.set_callbacks(
            on_start=on_recording_start,
            on_stop=on_recording_stop,
            on_silence=on_silence_detected,
            on_error=on_error
        )
    
    def _process_voice_command(self, audio_data):
        """Process voice command asynchronously"""
        try:
            # Transcribe audio to text
            if self.voice_service:
                # Use Whisper for Hebrew transcription
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                text = loop.run_until_complete(
                    self.voice_service.transcribe_audio(
                        audio_data, 
                        language="he",
                        format="wav"
                    )
                )
                loop.close()
                
                if text and text.strip():
                    print(f"🎯 Transcribed: \"{text}\"")
                    
                    # Send to SweatBot for processing
                    print("🤖 SweatBot is thinking...")
                    response = self.sweatbot.chat(text)
                    
                    print(f"💬 SweatBot: {response}")
                    
                else:
                    print("❌ Could not understand speech. Please try again.")
            else:
                # Fallback: simulate transcription
                print("🎯 [Simulated] Voice detected but transcription unavailable")
                print("   Please type your command instead:")
                
        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            print(f"❌ Error processing voice: {e}")
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n🛑 Received signal {signum}, shutting down gracefully...")
        self.stop()
    
    def start_interactive_mode(self):
        """Start interactive voice mode"""
        self.running = True
        
        print("\n" + "="*50)
        print("🎤 VOICE SWEATBOT - INTERACTIVE MODE")
        print("="*50)
        print("Commands:")
        print("  SPACE or ENTER - Start voice recording")
        print("  't' + ENTER    - Text mode (type command)")
        print("  'q' + ENTER    - Quit")
        print("  's' + ENTER    - Show statistics")
        print("  'h' + ENTER    - Show help")
        print("\nExamples of Hebrew commands:")
        print("  • עשיתי 20 סקוואטים")
        print("  • בק סקווט 50 קילו 5 חזרות") 
        print("  • כמה נקודות יש לי?")
        print("  • רצתי 5 קילומטר")
        print("="*50)
        
        try:
            while self.running:
                try:
                    command = input("\n🎤 SweatBot> ").strip().lower()
                    
                    if command in ['q', 'quit', 'exit']:
                        break
                    elif command in ['', ' ']:
                        # Start voice recording
                        self._start_voice_command()
                    elif command == 't':
                        # Text mode
                        self._handle_text_input()
                    elif command == 's':
                        # Show statistics
                        self._show_statistics()
                    elif command == 'h':
                        # Show help
                        self._show_help()
                    else:
                        print("Unknown command. Press 'h' for help.")
                        
                except KeyboardInterrupt:
                    break
                except Exception as e:
                    logger.error(f"Error in interactive mode: {e}")
                    print(f"❌ Error: {e}")
        
        finally:
            self.stop()
    
    def _start_voice_command(self):
        """Start voice recording for a command"""
        if not self.voice_recorder:
            print("❌ Voice recorder not available")
            return
        
        if self.voice_recorder.is_recording:
            print("⚠️ Already recording. Please wait...")
            return
        
        print("🎤 Starting voice recording...")
        success = self.voice_recorder.start_recording()
        
        if success:
            # Wait for recording to complete (handled by callbacks)
            pass
        else:
            print("❌ Failed to start voice recording")
    
    def _handle_text_input(self):
        """Handle text input mode"""
        print("💬 Text mode - Enter your Hebrew command:")
        text_input = input("Hebrew> ").strip()
        
        if text_input:
            print("🤖 SweatBot is thinking...")
            response = self.sweatbot.chat(text_input)
            print(f"💬 SweatBot: {response}")
        else:
            print("No text entered.")
    
    def _show_statistics(self):
        """Show current statistics"""
        try:
            print("📊 Getting your fitness statistics...")
            response = self.sweatbot.chat("כמה נקודות יש לי? תן לי סיכום של ההתקדמות שלי")
            print(f"📈 Statistics:\n{response}")
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            print(f"❌ Error getting statistics: {e}")
    
    def _show_help(self):
        """Show help information"""
        print("\n" + "="*40)
        print("🤖 VOICE SWEATBOT HELP")
        print("="*40)
        print("Voice Commands (Hebrew):")
        print("  • עשיתי [מספר] [תרגיל]    - Log exercise")
        print("  • כמה נקודות יש לי?        - Get points")
        print("  • מה ההתקדמות שלי?         - Get progress")
        print("  • רצתי [מספר] קילומטר    - Log running")
        print("\nKeyboard Commands:")
        print("  • ENTER/SPACE - Start voice recording")
        print("  • t + ENTER   - Switch to text mode")
        print("  • s + ENTER   - Show statistics")
        print("  • q + ENTER   - Quit")
        print("="*40)
    
    def stop(self):
        """Stop the voice SweatBot"""
        self.running = False
        
        if self.voice_recorder and self.voice_recorder.is_recording:
            print("🛑 Stopping voice recording...")
            self.voice_recorder.stop_recording()
        
        print("✅ Voice SweatBot stopped")

def main():
    """Main entry point"""
    print("🏋️ Voice SweatBot - Hebrew Fitness AI")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check requirements
    try:
        import sounddevice
        import soundfile  
        import numpy
    except ImportError as e:
        print(f"❌ Missing required dependency: {e}")
        print("Please install with: pip install sounddevice soundfile numpy")
        sys.exit(1)
    
    # Initialize and start
    voice_bot = VoiceSweatBot()
    
    try:
        voice_bot.start_interactive_mode()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print(f"❌ Fatal error: {e}")
    finally:
        voice_bot.stop()
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()