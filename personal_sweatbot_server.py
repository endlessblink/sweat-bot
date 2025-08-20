#!/usr/bin/env python3
"""
Personal SweatBot Server - FastAPI Backend
Serves your personal Hebrew fitness AI coach via REST API
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import sys
import os
from pathlib import Path
import uvicorn
from contextlib import asynccontextmanager

# Add paths for imports
sys.path.append(str(Path(__file__).parent / "src" / "agents"))
sys.path.append(str(Path(__file__).parent / "backend" / "app" / "services"))

from personal_sweatbot import PersonalSweatBot

# Try to import VoiceService for Whisper integration
try:
    from voice_service import VoiceService
    VOICE_SERVICE_AVAILABLE = True
except ImportError:
    print("⚠️ VoiceService not available - voice transcription disabled")
    VoiceService = None
    VOICE_SERVICE_AVAILABLE = False

class ChatMessage(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    response: str
    success: bool
    parsed_data: Optional[Dict[str, Any]] = None

class ExerciseRequest(BaseModel):
    exercise_text: str

# Global instances
sweatbot_instance = None
voice_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global sweatbot_instance, voice_service
    print("🏋️ Starting Personal SweatBot Server...")
    
    # Initialize SweatBot
    sweatbot_instance = PersonalSweatBot()
    print("✅ Personal SweatBot initialized!")
    
    # Initialize Voice Service (Hebrew Whisper)
    if VOICE_SERVICE_AVAILABLE:
        print("🎤 Loading Hebrew Whisper model (this may take a moment)...")
        voice_service = VoiceService(model_size="base")  # Use base model for faster loading
        print("✅ Voice Service initialized!")
    else:
        print("⚠️ Voice Service skipped - dependencies not available")
    
    yield
    
    # Shutdown
    print("🏋️ Shutting down Personal SweatBot Server...")

app = FastAPI(
    title="Personal SweatBot API",
    description="Your Hebrew Fitness AI Coach - Personal API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "🏋️ Personal SweatBot API is running!",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "sweatbot_ready": sweatbot_instance is not None,
        "message": "Personal SweatBot is ready!" if sweatbot_instance else "SweatBot not initialized"
    }

@app.post("/api/personal-chat", response_model=ChatResponse)
async def personal_chat(request: ChatMessage):
    """Chat with your personal SweatBot"""
    if not sweatbot_instance:
        raise HTTPException(status_code=500, detail="SweatBot not initialized")
    
    try:
        # Pass both message and conversation history to the AI
        if hasattr(sweatbot_instance, 'chat_with_history'):
            response = sweatbot_instance.chat_with_history(request.message, request.history)
        else:
            # Fallback to basic chat if history method doesn't exist
            response = sweatbot_instance.chat(request.message)
        
        return ChatResponse(
            response=response,
            success=True
        )
    
    except Exception as e:
        print(f"Chat error: {e}")
        return ChatResponse(
            response=f"שגיאה: {str(e)}",
            success=False
        )

@app.post("/api/exercise", response_model=ChatResponse)
async def log_exercise(request: ExerciseRequest):
    """Log an exercise with your personal SweatBot"""
    if not sweatbot_instance:
        raise HTTPException(status_code=500, detail="SweatBot not initialized")
    
    try:
        result = await sweatbot_instance.process_exercise(request.exercise_text)
        
        return ChatResponse(
            response=result.get('response', 'תרגיל נרשם'),
            success=result.get('success', True),
            parsed_data=result.get('parsed_data')
        )
    
    except Exception as e:
        print(f"Exercise processing error: {e}")
        return ChatResponse(
            response=f"שגיאה בעיבוד התרגיל: {str(e)}",
            success=False
        )

@app.post("/api/voice")
async def process_voice(audio: UploadFile = File(...)):
    """Process voice input using Hebrew Whisper model"""
    global voice_service, sweatbot_instance
    
    if not voice_service:
        return {
            "success": False,
            "error": "Voice service not available", 
            "text": "זיהוי קול לא זמין כרגע - Whisper לא מותקן"
        }
    
    try:
        print(f"🎤 Processing audio file: {audio.filename} ({audio.size} bytes)")
        
        # Read audio data from the uploaded file
        audio_data = await audio.read()
        
        if len(audio_data) < 1000:  # Less than 1KB
            return {
                "success": False,
                "error": "Audio too short",
                "text": "האודיו קצר מדי לעיבוד"
            }
        
        # Detect format from filename or content type
        audio_format = "wav"  # Default
        if audio.filename:
            if audio.filename.endswith('.webm'):
                audio_format = "webm"
            elif audio.filename.endswith('.mp3'):
                audio_format = "mp3"
        
        print(f"🎵 Detected audio format: {audio_format}")
        
        # Transcribe using Hebrew Whisper
        transcribed_text = await voice_service.transcribe_audio(
            audio_data=audio_data,
            language="he",  # Hebrew
            format=audio_format
        )
        
        if not transcribed_text:
            return {
                "success": False,
                "error": "Transcription failed",
                "text": "לא הצלחתי להבין את האודיו"
            }
        
        print(f"🗣️ Transcribed: '{transcribed_text}'")
        
        # Process the transcribed text through SweatBot if available
        bot_response = None
        if sweatbot_instance:
            try:
                if hasattr(sweatbot_instance, 'chat_with_history'):
                    bot_response = sweatbot_instance.chat_with_history(transcribed_text, [])
                else:
                    bot_response = sweatbot_instance.chat(transcribed_text)
            except Exception as e:
                print(f"⚠️ SweatBot processing failed: {e}")
        
        return {
            "success": True,
            "text": transcribed_text,
            "transcription": transcribed_text,
            "response": bot_response or f"שמעתי: {transcribed_text}",
            "language": "he"
        }
    
    except Exception as e:
        print(f"❌ Voice processing error: {e}")
        return {
            "success": False,
            "error": str(e),
            "text": "שגיאה בעיבוד קול"
        }

@app.get("/api/stats")
async def get_personal_stats():
    """Get your personal workout statistics"""
    # This would connect to your personal database/storage
    # For now, return mock data
    return {
        "total_workouts": 12,
        "total_exercises": 156,
        "total_points": 890,
        "streak_days": 5,
        "favorite_exercise": "סקוואטים",
        "this_week": {
            "workouts": 3,
            "exercises": 45,
            "points": 180
        }
    }

if __name__ == "__main__":
    print("🏋️ Starting Personal SweatBot Server...")
    print("📍 Server will be available at: http://localhost:8765")
    print("📖 API docs at: http://localhost:8765/docs")
    print("🔍 Health check at: http://localhost:8765/health")
    
    uvicorn.run(
        "personal_sweatbot_server:app",
        host="0.0.0.0",
        port=8765,
        reload=True,
        log_level="info"
    )