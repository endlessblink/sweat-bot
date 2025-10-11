# Voice Input Testing Guide

**Status:** Awaiting user testing with browser cache refresh
**Last Updated:** 2025-10-11

## Quick Test Instructions

### 1. Prepare Browser
```bash
# Make sure frontend is running
cd personal-ui-vite
npm run dev  # Should be on http://localhost:8005
```

**CRITICAL:** Press **Ctrl+Shift+R** to hard refresh and clear cached JavaScript

### 2. Test Basic Recording

1. Navigate to `http://localhost:8005`
2. Click microphone button (should turn red with pulse)
3. Speak Hebrew phrase: **"עשיתי עשרים סקוואטים"**
4. Click button again to stop (should turn blue while processing)

### 3. Verify Console Logs

**You MUST see these logs:**
```
🎤 [useVoiceInput] ===== START RECORDING CALLED =====
✅ [useVoiceInput] Permission granted
✅ [AudioRecorder] Recording started with audio/webm;codecs=opus
🛑 [useVoiceInput] ===== STOP RECORDING CALLED =====
[Groq] Sending audio as audio.webm, type: audio/webm;codecs=opus  ← KEY MESSAGE
[VoiceInput] ✓ Groq Whisper succeeded in 2847ms
[VoiceInput] Transcript: "עשיתי עשרים סקוואטים"
```

**If you DON'T see emoji logs (🎤 ✅ 🛑):**
- Cache didn't refresh properly
- Close browser tab completely
- Reopen and try again
- Or restart dev server: `npm run dev`

### 4. Test Exercise Logging

Speak these phrases and verify they log correctly:

**Basic Exercises:**
- "עשיתי עשרים סקוואטים" → Should log 20 squats
- "רצתי חמישה קילומטר" → Should log 5km run
- "ארבעים שכיבות סמיכה" → Should log 40 pushups
- "עשר מתיחות" → Should log 10 pullups

**With Weights:**
- "בק סקווט חמישים קילו חמש חזרות" → Back squat 50kg, 5 reps
- "ספסל מאה קילו עשר חזרות" → Bench press 100kg, 10 reps

**Cardio:**
- "רצתי שלושה קילומטר ב-חמש עשרה דקות" → 3km in 15 min

## Expected Results

### ✅ Success Indicators
- Button turns red during recording
- Button turns blue during processing
- Transcript appears in input field
- Exercise logs to database
- Console shows WebM format sent
- No "invalid media file" errors

### ❌ Failure Indicators
- No emoji logs in console
- "Invalid media file" error from APIs
- "Failed to stop recording" error
- Button doesn't change color
- No transcript appears

## Troubleshooting

### Problem: No emoji logs
**Solution:** Cache not refreshed
1. Close browser tab
2. Press Ctrl+Shift+R when reopening
3. Or restart: `pkill -f "vite" && npm run dev`

### Problem: "Invalid media file"
**Solution:** Old code still running (WebM → .mp3 bug)
1. Verify console shows: `[Groq] Sending audio as audio.webm`
2. If not, hard refresh didn't work
3. Try restarting dev server

### Problem: Microphone permission denied
**Solution:** Grant browser permission
1. Click lock icon in address bar
2. Allow microphone access
3. Refresh page

### Problem: Hebrew transcription wrong
**Solution:** May need Hebrew-optimized model
1. Document accuracy issues
2. Note which phrases fail
3. Consider switching to Ivrit.ai model

## Next Steps After Testing

### If Working ✅
1. Test 50+ Hebrew phrases (see HEBREW-TEST-PHRASES.md)
2. Evaluate accuracy percentage
3. Test on mobile devices
4. Run E2E tests with Playwright

### If Not Working ❌
1. Share console logs with full error messages
2. Check network tab for API responses
3. Verify API keys in .env
4. Check browser compatibility

## Performance Benchmarks

**Target Metrics:**
- Recording start latency: < 500ms
- Transcription time: < 3 seconds (for 10 second audio)
- Hebrew accuracy: > 90% for basic phrases
- Hebrew accuracy: > 80% for complex phrases

## Browser Compatibility

**Tested:**
- Chrome: ✅ Should work
- Firefox: ✅ Should work
- Safari: ⚠️ May need different codec

**Not Tested Yet:**
- Mobile Chrome
- Mobile Safari
- Mobile Firefox

## API Keys Required

Make sure these are in `.env`:
```bash
VITE_GROQ_API_KEY=your_groq_key_here
VITE_OPENAI_API_KEY=your_openai_key_here  # Fallback
```

## Support

**If issues persist:**
1. Document exact error messages
2. Screenshot console logs
3. Note browser version
4. Share audio blob size from console
