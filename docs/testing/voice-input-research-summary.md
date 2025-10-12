# Voice Input (STT) Research Summary

**Date:** 2025-10-11
**Feature:** Speech-to-Text support for SweatBot
**Status:** Code complete, awaiting user testing

## Research Findings

### Supported Audio Formats

**Groq Whisper API:**
- Supported: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, **webm**
- File size limit: 25MB
- Downsamples to: 16KHz mono
- Model used: whisper-large-v3 (32 layers)

**OpenAI Whisper API:**
- Supported: mp3, mp4, mpeg, mpga, m4a, wav, **webm**
- Note: WebM with Opus codec supported in container format

**Browser MediaRecorder:**
- Native format: audio/webm;codecs=opus
- Perfect match for both APIs ✓

### Performance Metrics

**Groq Whisper:**
- Speed: 164x faster than real-time
- Example: 10 min audio → 3.7 seconds transcription
- WER (general): 10.3%
- Cost: $0.04/hour
- Free tier: Generous for testing

**OpenAI Whisper:**
- Cost: $0.36/hour (9x more expensive)
- Model: whisper-1
- Similar accuracy to Groq

### Hebrew Language Support

**Vanilla Whisper Large V3:**
- WER: ~10.3% (general languages)
- Hebrew: Expected higher WER due to limited training data
- Recommendation: Specify language='he' for better accuracy

**Hebrew-Optimized Alternative (Ivrit.ai):**
- Model: ivrit-ai/whisper-large-v3
- WER: ~3.1% (on FLEURS benchmark)
- Specifically fine-tuned for Hebrew
- Use if vanilla Whisper accuracy insufficient

## Implementation Details

### Architecture
- Provider abstraction pattern for easy switching
- Fallback chain: Groq → OpenAI → Web Speech API
- React hooks for state management
- Design system compliant UI

### Critical Bug Fixed
**Problem:** Recording as WebM but sending with .mp3 extension
**Solution:** Detect blob type and use correct extension
```typescript
const fileExt = audioBlob.type.includes('webm') ? 'webm' :
                audioBlob.type.includes('ogg') ? 'ogg' :
                audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
```

### UX Decision
**Changed from:** Press-and-hold (onMouseDown/Up)
**Changed to:** Click-to-toggle (onClick)
**Reason:** Button moves during errors, making press-and-hold impossible

## Next Steps

1. **User Testing Phase** (Current)
   - Hard refresh browser (Ctrl+Shift+R)
   - Test recording Hebrew phrases
   - Verify console logs show WebM format

2. **Hebrew Accuracy Testing**
   - Test 50+ fitness phrases
   - Evaluate transcription quality
   - Decide if Ivrit.ai model needed

3. **Mobile Optimization**
   - Test iOS Safari (may need different codec)
   - Test Android Chrome
   - Add touch event handling
   - Haptic feedback

4. **E2E Testing**
   - Playwright MCP testing
   - Multiple browsers
   - Error scenarios

## Files Modified

- `services/voiceInput.ts` - Provider implementations
- `hooks/useVoiceInput.ts` - State management
- `components/VoiceInputButton.tsx` - UI component
- `components/SweatBotChat.tsx` - Integration
- `.env` - Configuration

## Configuration

```bash
# .env
VITE_STT_PROVIDER=groq
VITE_STT_FALLBACK_CHAIN=openai,web-speech
VITE_GROQ_API_KEY=your_key_here
VITE_OPENAI_API_KEY=your_key_here
```

## Browser Cache Issue

**Problem:** Vite HMR doesn't always reload service/utility files
**Solution:** Hard refresh (Ctrl+Shift+R) after modifying non-component files
**Prevention:** Restart dev server or always hard refresh when testing service changes
