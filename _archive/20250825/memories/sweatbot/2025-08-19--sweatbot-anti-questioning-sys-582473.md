---
id: 17555865823452audgi2vu
timestamp: 2025-08-19T06:56:22.345Z
complexity: 4
category: work
project: sweatbot
tags: ["sweatbot", "ux-fix", "hebrew-ai", "anti-questioning", "onboarding", "user-preferences", "title:SweatBot Anti-Questioning System Implementation", "summary:SweatBot Anti-Questioning System Implementation"]
priority: medium
status: active
access_count: 0
last_accessed: 2025-08-19T06:56:22.345Z
metadata:
  content_type: text
  size: 2041
  mermaid_diagram: false
---# SweatBot Anti-Questioning System Implementation

## Problem Solved
Fixed critical UX issue where AI asked excessive questions ("איזה קבוצת שרירים ריכזת? איך הרגשת? באיזה רמת קושי?") when user just wanted to log simple workout like "עשיתי 20 סקוואטים".

## Solution Components

### 1. Enhanced System Prompts (hebrew_model_manager.py)
- Added explicit rule: "🚨 אל תשאל שאלות מיותרות - פשוט תאשר ותעודד!"
- Exercise-specific behavior: "כשמישהו אומר 'עשיתי X תרגילים' - פשוט תעודד ותאשר"
- Forbidden examples with exact patterns to avoid
- Response examples: "מעולה! 20 סקוואטים נרשמו! 💪"

### 2. One-Time Setup Flow
- UserOnboardingService with 6 quick questions
- Captures communication style preferences
- Sets `avoid_excessive_questions: true` for users who prefer concise responses
- Skip option available with anti-questioning defaults

### 3. Personalized Integration
- System prompts now include user onboarding preferences
- Critical addition: "המשתמש לא אוהב שאלות מיותרות - תאשר פעולות מיד!"
- Communication style customization (concise/detailed/energetic/supportive)

### 4. Frontend Components
- OnboardingFlow.tsx with Hebrew UI and progress tracking
- Main page integration with onboarding status checking
- Seamless user experience: setup once, personalized forever

### 5. API Infrastructure
- Complete onboarding endpoints: /status, /next-question, /answer, /skip
- Integrated into main FastAPI application
- Persistent preferences stored in Redis user context

## Expected Impact
- Before: Complex questioning that frustrated users
- After: Simple confirmations that respect user intent
- Addresses core feedback: "I just want to add a workout to document progress"

## Files Modified
- backend/app/services/hebrew_model_manager.py
- backend/app/services/user_onboarding_service.py  
- backend/app/api/v1/onboarding.py
- frontend/components/OnboardingFlow.tsx
- frontend/app/page.tsx
- backend/app/main.py

Zero-budget approach: Uses existing infrastructure with intelligent preference capture to eliminate user friction.