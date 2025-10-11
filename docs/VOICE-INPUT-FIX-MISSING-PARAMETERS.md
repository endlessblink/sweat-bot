# Voice Input Fix: Missing Groq API Parameters

**Date:** 2025-10-11
**Issue:** Hebrew transcription accuracy was poor compared to Groq's website
**Root Cause:** Missing critical API parameters in our implementation

## Problem Discovery

User tested voice input on Groq's website and got significantly better Hebrew transcription than in our SweatBot app. This revealed our implementation was missing key parameters.

## Analysis

**Working Python code from Groq docs:**
```python
transcription = client.audio.transcriptions.create(
    file=(filename, file.read()),
    model="whisper-large-v3",
    temperature=0,              # ← MISSING in our code!
    response_format="verbose_json",  # ← We used "json"
)
```

**Our original code (voiceInput.ts):**
```typescript
formData.append('model', 'whisper-large-v3');
formData.append('language', language);
formData.append('response_format', 'json');
// Missing: temperature, prompt parameters!
```

## Missing Parameters Explained

### 1. temperature=0 (CRITICAL)
**What it does:** Controls randomness in transcription
- `0` = Most deterministic, accurate transcription
- Higher values = More creative/random outputs
- **Impact:** Without this, API uses default (likely 0.2-0.8), reducing accuracy

**Why it matters for Hebrew:**
- Hebrew has limited training data in Whisper
- Higher temperature increases errors in unfamiliar languages
- temperature=0 forces most confident predictions

### 2. prompt (Hebrew fitness terms)
**What it does:** Guides model with expected vocabulary
- Whisper uses prompt as "spelling guide" for proper nouns and terminology
- **Critical:** Only last ~5 words of prompt are reliably considered
- Must be in Hebrew for Hebrew audio

**Our prompt:**
```typescript
const hebrewPrompt = 'תרגילים: סקוואטים, שכיבות סמיכה, מתיחות, ברפיס, דדליפט, ספסל, קילו, חזרות';
// Exercises: squats, pushups, pullups, burpees, deadlift, bench, kilo, reps
```

**Why it matters:**
- Fitness terms like "סקוואטים" have multiple possible spellings
- Without prompt: "סקוטאים", "סקווטים", "squats" (wrong language)
- With prompt: Consistent "סקוואטים" spelling

### 3. response_format="verbose_json"
**What it does:** Returns detailed metadata with transcription
- Standard "json": `{ "text": "..." }`
- Verbose "json": `{ "text": "...", "task": "transcribe", "language": "he", "duration": 2.5, ... }`

**Benefits:**
- Language detection confirmation
- Duration metadata
- Confidence scores (in some implementations)
- Useful for debugging

## Implementation Fix

### Groq Provider (Primary)
```typescript
// voiceInput.ts - GroqWhisperProvider
formData.append('model', 'whisper-large-v3');
formData.append('language', language);

// ✅ NEW: temperature=0 for accuracy
formData.append('temperature', '0');

// ✅ NEW: Hebrew fitness prompt
const hebrewPrompt = 'תרגילים: סקוואטים, שכיבות סמיכה, מתיחות, ברפיס, דדליפט, ספסל, קילו, חזרות';
formData.append('prompt', hebrewPrompt);

// ✅ CHANGED: verbose_json instead of json
formData.append('response_format', 'verbose_json');
```

### OpenAI Provider (Fallback)
Applied same improvements for consistency:
```typescript
// Same temperature=0, prompt, and verbose_json
```

## Expected Improvements

**Before fix:**
- Hebrew WER: ~10-15% (vanilla Whisper)
- Inconsistent fitness term spelling
- Occasional language mixing (Hebrew + English)
- Random/creative transcriptions

**After fix:**
- Hebrew WER: ~8-12% (expected 2-3% improvement)
- Consistent fitness term spelling (guided by prompt)
- Deterministic transcriptions (temperature=0)
- Better number recognition

## Testing Instructions

1. **Hard refresh browser:** Ctrl+Shift+R
2. **Record test phrase:** "עשיתי עשרים סקוואטים"
3. **Check console logs:**
   ```
   [Groq] Response format: transcribe language: he
   [VoiceInput] Transcript: "עשיתי עשרים סקוואטים"
   ```
4. **Verify:** Exact spelling match, no English mixing

## If Still Not Accurate Enough

**Next step:** Switch to Ivrit.ai Hebrew-optimized Whisper
- Model: `ivrit-ai/whisper-large-v3`
- Expected WER: 3.1% (vs vanilla 10.3%)
- Fine-tuned specifically for Hebrew

**How to switch:**
- Update backend to use Hugging Face model
- Or use hosted Ivrit.ai API if available
- Keep same temperature=0 and prompt parameters

## Research Sources

1. **Whisper Prompting Guide (OpenAI):** https://cookbook.openai.com/examples/whisper_prompting_guide
2. **Groq API Reference:** https://console.groq.com/docs/speech-to-text
3. **Hebrew Whisper Comparison:** https://medium.com/@DormanDaniel/comparing-whisper-whisper-ft-and-amazon-transcribe-for-hebrew

## Key Takeaways

1. **Temperature matters:** Always use 0 for transcription accuracy
2. **Prompts guide spelling:** Place key terms at END of prompt
3. **Match language:** Prompt language must match audio language
4. **Test against reference:** Compare with official implementation (Groq's website)
5. **Verbose is better:** More metadata helps debugging

---

**Files Modified:**
- `personal-ui-vite/src/services/voiceInput.ts` (Groq + OpenAI providers)

**Status:** ✅ Fixed and ready for testing
