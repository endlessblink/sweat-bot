---
id: 1755611005702eribt8xq3
timestamp: 2025-08-19T13:43:25.702Z
complexity: 4
category: code
project: sweatbot
tags: ["mastra", "agents", "user-preferences", "behavior-analysis", "exercise-tracking", "title:Mastra Core Implementation Completed", "summary:Mastra Core Implementation Completed:.  Three specialized agents created:."]
priority: medium
status: active
access_count: 0
last_accessed: 2025-08-19T13:43:25.702Z
metadata:
  content_type: text
  size: 925
  mermaid_diagram: false
---Mastra Core Implementation Completed:
1. Three specialized agents created:
   - SweatBot-NoQuestions: For Noam and users who hate questions
   - SweatBot-Engaging: For Sarah and users who love detailed coaching
   - SweatBot-Adaptive: For new users in learning mode
   
2. User Preferences System:
   - Dynamic preferences per user (avoidQuestions, responseStyle, etc.)
   - Pre-configured: Noam (no questions), Sarah (loves questions)
   - Agent selection based on preferences
   
3. Behavior Analyzer:
   - Detects Hebrew complaint patterns ("אל תשאל", "מספיק שאלות")
   - Tracks if user ignores or engages with questions
   - Automatically updates preferences based on behavior
   
4. Exercise Logger:
   - Hebrew to English exercise mapping
   - Points and calorie calculation
   - Streak tracking
   
5. Stats Tracker:
   - Period-based stats (today/week/month/all)
   - Exercise breakdown
   - Formatted Hebrew messages