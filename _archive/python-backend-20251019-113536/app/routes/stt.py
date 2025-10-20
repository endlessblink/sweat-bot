"""
Speech-to-Text (STT) Routes using Groq Whisper
Uses official Groq SDK for maximum compatibility and accuracy
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from groq import Groq
import os
import tempfile
from typing import Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/stt", tags=["Speech-to-Text"])

# Mobile debug logging endpoint
@router.post("/debug-log")
async def mobile_debug_log(request: dict):
    """Receive debug logs from mobile client"""
    try:
        log_level = request.get('level', 'info')
        message = request.get('message', '')
        data = request.get('data', {})
        source = request.get('source', 'mobile')

        # Log with mobile source indicator
        if log_level == 'error':
            logger.error(f"[MOBILE] ❌ {message}")
        elif log_level == 'warn':
            logger.warning(f"[MOBILE] ⚠️ {message}")
        elif log_level == 'info':
            logger.info(f"[MOBILE] ℹ️ {message}")
        else:
            logger.info(f"[MOBILE] 📱 {message}")

        if data:
            logger.info(f"[MOBILE] 📊 Data: {data}")

        return {"status": "logged"}
    except Exception as e:
        logger.error(f"[MOBILE] Debug log error: {e}")
        return {"status": "error", "message": str(e)}

# Initialize Groq client lazily (only when needed)
groq_client = None

def get_groq_client():
    global groq_client
    if groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        groq_client = Groq(api_key=api_key)
    return groq_client


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("he"),
    model: str = Form("whisper-large-v3"),
    temperature: float = Form(0),
    prompt: Optional[str] = Form(None),
):
    """
    Transcribe audio file using Groq Whisper API (official SDK)

    Args:
        file: Audio file (webm, mp3, m4a, wav, etc.)
        language: Language code (default: 'he' for Hebrew)
        model: Whisper model (default: whisper-large-v3)
        temperature: Sampling temperature 0-1 (default: 0 for most accurate)
        prompt: Optional Hebrew prompt for guiding transcription

    Returns:
        JSON with transcript text and metadata
    """
    try:
        logger.info(f"[STT] 🎤 Starting transcription request")
        logger.info(f"[STT] 📁 File details: filename={file.filename}, content_type={file.content_type}")

        # Read uploaded file
        audio_bytes = await file.read()
        logger.info(f"[STT] 📊 Read {len(audio_bytes)} bytes from uploaded file")

        # Save to temporary file (Groq SDK needs file path)
        file_extension = file.filename.split('.')[-1] if file.filename and '.' in file.filename else 'webm'
        logger.info(f"[STT] 💾 Creating temp file with extension: {file_extension}")

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=f".{file_extension}"
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
            logger.info(f"[STT] 📄 Temp file created: {temp_file_path}")

        logger.info(f"[STT] 🎯 Transcription params: language={language}, model={model}, temperature={temperature}, prompt={prompt}")

        try:
            # Get Groq client (lazy initialization)
            logger.info(f"[STT] 🔑 Getting Groq client...")
            client = get_groq_client()
            logger.info(f"[STT] ✅ Groq client obtained successfully")

            # Use official Groq SDK (exactly like user's working Python code)
            logger.info(f"[STT] 🚀 Starting Groq transcription API call...")
            with open(temp_file_path, "rb") as audio_file:
                audio_data = audio_file.read()
                logger.info(f"[STT] 📊 Audio file size for Groq: {len(audio_data)} bytes")

                transcription = client.audio.transcriptions.create(
                    file=(file.filename or "audio.webm", audio_data),
                    model=model,
                    language=language,
                    temperature=temperature,
                    response_format="verbose_json",
                    prompt=prompt,  # Hebrew fitness terms for spelling guidance
                )

            logger.info(f"[STT] 🎉 Transcription successful!")
            logger.info(f"[STT] 📝 Transcription text: '{transcription.text[:100]}...'")
            logger.info(f"[STT] 📊 Detected language: {getattr(transcription, 'language', 'unknown')}")
            logger.info(f"[STT] ⏱️ Duration: {getattr(transcription, 'duration', 'unknown')} seconds")

            # Return response in same format as verbose_json
            response_data = {
                "text": transcription.text,
                "language": transcription.language if hasattr(transcription, 'language') else language,
                "duration": transcription.duration if hasattr(transcription, 'duration') else None,
                "model": model,
            }
            logger.info(f"[STT] 📤 Returning response: {response_data}")
            return JSONResponse(content=response_data)

        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                logger.info(f"[STT] 🗑️ Temp file cleaned up: {temp_file_path}")

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"[STT] ❌ ERROR DETAILS:")
        logger.error(f"[STT] ❌ Exception type: {type(e).__name__}")
        logger.error(f"[STT] ❌ Exception message: {str(e)}")
        logger.error(f"[STT] ❌ Exception args: {e.args}")
        import traceback
        logger.error(f"[STT] ❌ Traceback: {traceback.format_exc()}")

        # Check for common issues
        error_msg = str(e).lower()
        if "api key" in error_msg:
            logger.error(f"[STT] 🔑 API KEY ISSUE DETECTED")
        elif "file" in error_msg or "temp" in error_msg:
            logger.error(f"[STT] 📁 FILE HANDLING ISSUE DETECTED")
        elif "network" in error_msg or "connection" in error_msg:
            logger.error(f"[STT] 🌐 NETWORK ISSUE DETECTED")
        elif "groq" in error_msg:
            logger.error(f"[STT] 🤖 GROQ API ISSUE DETECTED")

        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Check if Groq API key is configured"""
    api_key = os.getenv("GROQ_API_KEY")
    return {
        "status": "healthy" if api_key else "error",
        "groq_configured": bool(api_key),
        "model": "whisper-large-v3",
    }

@router.post("/test-mobile-debug")
async def test_mobile_debug():
    """Test endpoint to verify mobile debugging is working"""
    logger.info("[TEST] 🧪 Mobile debug test endpoint called")
    return {"status": "test_received", "timestamp": datetime.utcnow().isoformat()}
