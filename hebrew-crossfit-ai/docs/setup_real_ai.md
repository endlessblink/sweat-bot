# Setup Real AI for Hebrew CrossFit Bot

Choose one of these options to get **real AI responses** instead of templates:

## Option 1: Ollama (Local AI) - RECOMMENDED

### Install Ollama:
1. **Download**: Go to [ollama.com](https://ollama.com) and download for Windows
2. **Install**: Run the installer
3. **Start**: Open Command Prompt and run:
   ```bash
   ollama serve
   ```

### Install Hebrew-capable models:
```bash
# Best for Hebrew (4GB)
ollama pull llama3.1:8b

# Alternative (lighter, 4GB)
ollama pull llama3:8b

# Good for Hebrew (4GB)
ollama pull qwen2:7b
```

### ✅ Benefits:
- **FREE forever**
- **No API keys needed**
- **Works offline**
- **Good Hebrew support**
- **Fast responses**

---

## Option 2: Google Gemini (Free API)

### Get FREE Gemini API key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

### Set environment variable:
**Windows:**
```cmd
setx GEMINI_API_KEY "your-key-here"
```

**Or add to your batch file:**
```batch
set GEMINI_API_KEY=your-key-here
python main_ui_simple.py
```

### ✅ Benefits:
- **FREE 15 requests/minute**
- **Excellent Hebrew support**
- **Fast cloud responses**
- **No local storage needed**

---

## Test Real AI:

1. **Choose your option** (Ollama or Gemini)
2. **Restart the app**: `python main_ui_simple.py`
3. **Test conversation**: Say "מה שלומך?" (How are you?)
4. **You should get**: Real AI response, not template!

## Priority Order:
The app will try:
1. **Groq** (if API key set)
2. **OpenAI** (if API key set)
3. **Ollama** (if running locally) ⭐
4. **Gemini** (if API key set) ⭐
5. **Hugging Face** (backup)
6. **Template responses** (last resort)

## Recommended Setup:
**For best experience**: Install Ollama + one Hebrew model (llama3.1:8b)