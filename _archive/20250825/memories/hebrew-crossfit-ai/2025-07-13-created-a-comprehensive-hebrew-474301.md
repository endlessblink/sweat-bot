---
id: 1752416474288bcuzx9z4f
timestamp: 2025-07-13T14:21:14.288Z
complexity: 4
category: code
project: hebrew-crossfit-ai
tags: ["hebrew", "ai", "crossfit", "voice-recognition", "tts", "gamification", "miniconda", "pinokio", "title:[object Promise]", "summary:Created a comprehensive Hebrew-enabled CrossFit AI automation system with the following key components:.  Hebrew Voice Recognition - Using ivrit."]
priority: high
status: active
access_count: 0
last_accessed: 2025-07-13T14:21:14.289Z
metadata:
  content_type: text
  size: 1261
  mermaid_diagram: false
---Created a comprehensive Hebrew-enabled CrossFit AI automation system with the following key components:

1. **Hebrew Voice Recognition** - Using ivrit.ai Whisper model (free) with fallbacks to OpenAI Whisper and Google Speech-to-Text
2. **Hebrew TTS** - Multiple providers: ElevenLabs, gTTS, Edge TTS with Hebrew voice personalities
3. **Bilingual AI Coach** - Groq API (free tier) and OpenAI fallback with supportive, drill sergeant, and professional personalities
4. **Hebrew Workout Parser** - Parses Hebrew commands like "עשיתי 20 שכיבות סמיכה" and logs to Google Sheets
5. **Hebrew Gamification** - Achievements system with Hebrew names, levels from "מתחיל" to "אל האימונים"
6. **Main Application** - Voice-activated (Ctrl+Space), language auto-detection, food photo analysis
7. **Miniconda Integration** - Configured to work exclusively from Pinokio's miniconda at C:\pinokio\bin\miniconda

Cost optimization:
- Completely free setup: $0/month (ivrit.ai, Groq, gTTS)
- Enhanced setup: $2-5/month (ElevenLabs, OpenAI)

Key files created:
- hebrew_voice_recognition.py
- hebrew_tts.py
- hebrew_ai_coach.py
- hebrew_workout_parser.py
- hebrew_gamification.py
- main.py
- setup_miniconda.py (for Pinokio environment)
- requirements.txt, config.json, README.md