---
id: 1755588628604y2ijhtnnd
timestamp: 2025-08-19T07:30:28.604Z
complexity: 4
category: code
project: sweatbot
tags: ["critical-fix", "async-bug", "anti-questioning", "phases-restored", "title:SweatBot Critical Bug Fix - Async/Sync Issue Resolved", "summary:SweatBot Critical Bug Fix - Async/Sync Issue Resolved"]
priority: medium
status: active
access_count: 0
last_accessed: 2025-08-19T07:30:28.604Z
metadata:
  content_type: code
  size: 2263
  mermaid_diagram: false
---# SweatBot Critical Bug Fix - Async/Sync Issue Resolved

## PROBLEM DISCOVERED
The entire enhancement system (Phases 1-3) was implemented but NOT WORKING because:
- `_build_system_prompt` was a regular function trying to use `await` on line 444
- This caused the onboarding preferences to NEVER load
- The anti-questioning rules were never applied
- The AI was using default prompts without any of our enhancements

## ROOT CAUSE
```python
# BROKEN CODE:
def _build_system_prompt(self, context):  # NOT ASYNC
    ...
    await user_onboarding_service.get_personalized_system_prompt_addition()  # CAN'T AWAIT!
```

## FIXES APPLIED

### 1. Fixed Async/Sync Mismatch
- Changed `_build_system_prompt` to `async def`
- Updated all callers to use `await`
- Now onboarding preferences can load properly

### 2. Added Debug Logging
- System prompt building logs user and preferences
- Gemini API calls log the prompt being sent
- Response analysis logs question count
- Can now track if anti-questioning rules are applied

### 3. Auto-Configure User Noam
- Added special handling in `user_context_manager.py`
- When username is "noam", automatically sets:
  - `avoid_excessive_questions: true`
  - `communication_style: concise`
  - `auto_log_exercises: true`
- No onboarding flow needed for Noam

### 4. Enhanced Onboarding Service
- Better logging of preference loading
- Proper async handling throughout
- Verification of context availability

## TEST SCRIPT CREATED
`test_anti_questioning.py` - Verifies:
- Short responses without questions
- Hebrew-only output
- Exercise recognition
- Proper context loading

## EXPECTED BEHAVIOR NOW
**User:** "היי, מה שלומך?"
**AI:** "היי נועם! מוכן לתעד תרגילים? 💪" (1-2 sentences max)

**User:** "עשיתי 20 סקוואטים"
**AI:** "מעולה! 20 סקוואטים נרשמו! 💪" (no questions)

## FILES MODIFIED
- `backend/app/services/hebrew_model_manager.py` - Made async, added logging
- `backend/app/services/user_context_manager.py` - Auto-config for Noam
- `backend/app/services/user_onboarding_service.py` - Better preference loading
- `backend/test_anti_questioning.py` - Test script created

## STATUS
All phases (1, 2, 3A) were already implemented but broken due to this bug. 
Now they should work as intended once the server is restarted.