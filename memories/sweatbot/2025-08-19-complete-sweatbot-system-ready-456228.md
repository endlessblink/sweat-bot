---
id: 1755611456142y87x7xzj6
timestamp: 2025-08-19T13:50:56.142Z
complexity: 4
category: code
project: sweatbot
tags: ["system-integration", "testing", "backend", "frontend", "voice", "preferences", "title:Complete SweatBot System Ready for Testing", "summary:Complete SweatBot System Ready for Testing:. Backend (Python) - Port 8000:."]
priority: medium
status: active
access_count: 0
last_accessed: 2025-08-19T13:50:56.142Z
metadata:
  content_type: text
  size: 970
  mermaid_diagram: false
---Complete SweatBot System Ready for Testing:

**Backend (Python) - Port 8000:**
- Hebrew Whisper model (5GB) for voice recognition
- FastAPI with voice transcription endpoints
- User preference management
- Exercise logging and stats tracking

**Frontend (Next.js) - Port 3001:**
- assistant-ui with Hebrew RTL support
- Per-user agents (Noam: no questions, Sarah: loves questions, New users: learning)
- Voice recording component
- Model selector (Gemini/Gemma3n/Vision)
- Statistics panel with achievements
- Preferences toggle for real-time updates

**Integration:**
- API route connects frontend to Mastra agents
- Voice recorder sends audio to Python Whisper backend
- User preferences dynamically control system prompts
- Exercise detection and logging working

**Testing Ready:**
1. Backend running on localhost:8000
2. Ready to start frontend on localhost:3001
3. Test different users (Noam/Sarah/New User)
4. Voice recording should work through browser to Python