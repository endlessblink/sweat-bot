---
id: 17556096113896so0ie2u3
timestamp: 2025-08-19T13:20:11.389Z
complexity: 4
category: code
project: sweatbot
tags: ["architecture", "mastra", "assistant-ui", "per-user-preferences", "hebrew", "title:SweatBot Complete Transformation Plan", "summary:SweatBot Complete Transformation Plan:. - Moving from fragmented architecture to unified Mastra + assistant-ui solution."]
priority: medium
status: active
access_count: 0
last_accessed: 2025-08-19T13:20:11.389Z
metadata:
  content_type: text
  size: 624
  mermaid_diagram: false
---SweatBot Complete Transformation Plan:
- Moving from fragmented architecture to unified Mastra + assistant-ui solution
- Key requirement: Per-user preferences (Noam wants NO questions, Sarah might like them)
- Using hybrid architecture: TypeScript/Mastra for orchestration + Python backend for Hebrew Whisper model (5GB)
- Voice must work on desktop AND phone via Cloudflare tunnel
- Model flexibility: Gemini API (default), local Gemma3n (offline), Vision model for images
- Budget: $0 (using free tiers and local models)
- Timeline: 2-3 days for complete solution
- 40-step implementation plan created covering all aspects