---
project: sweatbot
tags: []
updated: '2025-07-14T13:05:49.293Z'
manual_memories: []
memory_connections: []
---
# sweatbot Tasks

---
id: task-2025-07-14-397c864f
title: '🚨 🐛 Fix: Hebrew transcription accuracy'
serial: SWE-C0001
status: in_progress
priority: urgent
category: code
project: sweatbot
tags:
  - hebrew
  - voice-recognition
  - whisper
  - bug-fix
created: '2025-07-14T13:05:49.250Z'
updated: '2025-07-14T13:06:18.580Z'
manual_memories: []
memory_connections:
  - memory_id: 1752498336665kr8qbvoxb
    memory_serial: MEM-175249
    connection_type: research
    relevance: 0.675673076923077
    matched_terms:
      - project:sweatbot
      - category:code
      - tag:voice-recognition
      - hebrew
      - transcription
      - accuracy
      - voice
      - instead
      - proper
      - need
      - switch
      - ivrit
      - model
      - better
      - whisper
      - using
      - google
      - detection
      - tech:Fix
      - tech:Hebrew
      - tech:Need
      - tech:Google
      - tech:SK
      - tech:WO
      - time:0d
  - memory_id: 1752416474288bcuzx9z4f
    memory_serial: MEM-175241
    connection_type: research
    relevance: 0.43076923076923085
    matched_terms:
      - category:code
      - tag:hebrew
      - tag:voice-recognition
      - hebrew
      - voice
      - like
      - back
      - ivrit
      - model
      - whisper
      - using
      - google
      - speech
      - recognition
      - fallback
      - language
      - detection
      - tech:Hebrew
      - tech:Whisper
      - tech:Google
      - tech:Speech
      - tech:Recognition
      - time:1d
---
Hebrew voice transcription is producing gibberish like "חדשתיים שלוש" and "האם S-O-SK-WO-Z-M-K-A-R?" instead of proper Hebrew. Need to:
1. Switch back to ivrit.ai model for better Hebrew accuracy
2. Test different Whisper model sizes
3. Consider using Google Speech Recognition as fallback
4. Add proper Hebrew language detection


---
id: task-2025-07-14-fa209892
title: '⚠️ ⚡ Optimize: Real-time conversation speed'
serial: SWE-C0002
status: todo
priority: high
category: code
project: sweatbot
tags:
  - performance
  - real-time
  - voice-detection
  - optimization
created: '2025-07-14T13:06:01.023Z'
updated: '2025-07-14T13:06:01.225Z'
manual_memories: []
memory_connections:
  - memory_id: 1752498336665kr8qbvoxb
    memory_serial: MEM-175249
    connection_type: research
    relevance: 0.676
    matched_terms:
      - project:sweatbot
      - category:code
      - optimize
      - real
      - time
      - conversation
      - current
      - second
      - need
      - implement
      - proper
      - voice
      - activity
      - detection
      - transcription
      - instead
      - fixed
      - windows
      - tech:Real
      - tech:Current
      - tech:Need
      - tech:Implement
      - tech:Use
      - tech:VAD
      - tech:API
      - time:0d
  - memory_id: 1752416474288bcuzx9z4f
    memory_serial: MEM-175241
    connection_type: research
    relevance: 0.32800000000000007
    matched_terms:
      - category:code
      - voice
      - detection
      - optimization
      - tech:API
      - time:1d
---
Current conversation has 3-7 second delays. Need to:
1. Implement proper voice activity detection (VAD)
2. Use streaming transcription instead of fixed windows
3. Optimize API call timing (parallel processing)
4. Consider WebRTC for lower latency audio capture
5. Add visual feedback for voice detection state


---
id: task-2025-07-14-b70fda8a
title: '🚨 🧪 Test: And select best Hebrew ASR model'
serial: SWE-R0003
status: todo
priority: urgent
category: research
project: sweatbot
tags:
  - hebrew
  - asr
  - model-selection
  - testing
created: '2025-07-14T13:06:13.272Z'
updated: '2025-07-14T13:06:13.417Z'
manual_memories: []
memory_connections:
  - memory_id: 1752498336665kr8qbvoxb
    memory_serial: MEM-175249
    connection_type: research
    relevance: 0.505
    matched_terms:
      - project:sweatbot
      - hebrew
      - model
      - current
      - whisper
      - poor
      - need
      - ivrit
      - openai
      - google
      - azure
      - accuracy
      - tech:Hebrew
      - tech:Current
      - tech:Need
      - tech:Google
      - tech:Azure
      - tech:ASR
      - tech:API
      - time:0d
---
Current whisper model producing poor Hebrew results. Need to test:
1. ivrit.ai/whisper-v2-d3 model (original choice)
2. openai/whisper-large-v3 with Hebrew fine-tuning
3. Google Cloud Speech-to-Text API (Hebrew support)
4. Azure Speech Services (Hebrew support)
5. Local Vosk model with Hebrew language pack
Compare accuracy, speed, and cost for each option
