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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/stt", tags=["Speech-to-Text"])

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
        # Read uploaded file
        audio_bytes = await file.read()

        # Save to temporary file (Groq SDK needs file path)
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=f".{file.filename.split('.')[-1]}"
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        logger.info(f"[STT] Transcribing {len(audio_bytes)} bytes, language={language}, temp={temperature}")

        try:
            # Get Groq client (lazy initialization)
            client = get_groq_client()

            # Use official Groq SDK (exactly like user's working Python code)
            with open(temp_file_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=(file.filename, audio_file.read()),
                    model=model,
                    language=language,
                    temperature=temperature,
                    response_format="verbose_json",
                    prompt=prompt,  # Hebrew fitness terms for spelling guidance
                )

            logger.info(f"[STT] Success: {transcription.text[:50]}...")

            # Return response in same format as verbose_json
            return JSONResponse(content={
                "text": transcription.text,
                "language": transcription.language if hasattr(transcription, 'language') else language,
                "duration": transcription.duration if hasattr(transcription, 'duration') else None,
                "model": model,
            })

        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        logger.error(f"[STT] Error: {str(e)}")
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
