# 🏋️ Personal SweatBot - Your Hebrew Fitness AI Coach

A personal Hebrew fitness AI system built with Phidata, FastAPI, and assistant-ui for the best personal experience.

## ✨ What You Get

- **🎯 Personal Experience**: Designed specifically for your individual fitness journey
- **🇮🇱 Hebrew Native**: Full Hebrew language support with proper RTL interface
- **🤖 AI-Powered**: Uses Groq/OpenAI/Gemini for intelligent coaching
- **💬 Beautiful Chat**: Modern chat interface with assistant-ui
- **📊 Exercise Tracking**: Parse and log Hebrew exercise commands
- **🏆 Progress Tracking**: Monitor your fitness journey with stats

## 🏗️ Architecture

```
Personal UI (Next.js)     FastAPI Backend     Phidata Agent
http://localhost:4444  ←→ localhost:8765   ←→ PersonalSweatBot
                                                     ↓
                                            Hebrew Infrastructure
```

## 🚀 Quick Start

### 1. Start the Complete System
```bash
python start_personal_sweatbot.py
```
This starts both:
- **Backend**: http://localhost:8765 (FastAPI + PersonalSweatBot)
- **Frontend**: http://localhost:4444 (Next.js + assistant-ui)

### 2. Alternative: Start Components Separately

**Backend Only:**
```bash
python personal_sweatbot_server.py
```

**Frontend Only:**
```bash
cd personal-ui
npm install
npm run dev
```

**Python CLI Only:**
```bash
python personal_sweatbot_app.py
```

## 🎮 Usage Examples

### Chat Interface (Web)
1. Go to http://localhost:4444
2. Chat in Hebrew with your AI coach
3. Log exercises: "עשיתי 20 סקוואטים"
4. Ask for progress: "איך אני מתקדם?"

### API Usage
```bash
# Chat with SweatBot
curl -X POST http://localhost:8765/api/personal-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "שלום SweatBot!"}'

# Log an exercise  
curl -X POST http://localhost:8765/api/exercise \
  -H "Content-Type: application/json" \
  -d '{"exercise_text": "עשיתי 15 שכיבות סמיכה"}'
```

## 📁 Project Structure

```
sweatbot/
├── src/agents/
│   └── personal_sweatbot.py          # Core Phidata agent
├── personal-ui/                      # Next.js frontend
│   ├── app/
│   │   ├── page.tsx                 # Main chat interface
│   │   ├── components/
│   │   │   ├── PersonalSweatBotProvider.tsx
│   │   │   └── PersonalSweatBotConfig.tsx
│   │   └── api/personal-sweatbot/route.ts
│   └── package.json
├── backend/app/services/             # Hebrew infrastructure  
│   ├── hebrew_model_manager.py       # Hebrew AI models
│   ├── hebrew_exercise_parser.py     # Exercise parsing
│   └── hebrew_response_filter.py     # Response filtering
├── personal_sweatbot_app.py          # CLI interface
├── personal_sweatbot_server.py       # FastAPI server
└── start_personal_sweatbot.py        # Complete startup script
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Required (one of these)
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key  
GEMINI_API_KEY=your_gemini_key

# Optional
PYTHON_BACKEND_URL=http://localhost:8765
```

### Personal Settings
- **Language**: Hebrew (with RTL support)
- **AI Model Priority**: Groq > OpenAI > Gemini
- **Voice Input**: Available if Hebrew Whisper is loaded
- **Exercise Parsing**: Built-in Hebrew command recognition

## 🎯 Features

### ✅ Working Now
- **Personal Chat Agent**: Phidata-based with Hebrew instructions
- **Beautiful UI**: assistant-ui with Hebrew/RTL support
- **Exercise Logging**: Parse Hebrew commands like "עשיתי 20 סקוואטים"
- **API Integration**: FastAPI backend with auto-docs
- **Multi-Model Support**: Groq, OpenAI, Gemini fallback
- **Memory**: Agent remembers conversation context

### 🔜 Next Steps
- **Voice Input**: Hebrew Whisper integration
- **Statistics Dashboard**: Personal progress tracking
- **Exercise Database**: Store your workout history
- **Goal Setting**: Personal fitness targets

## 🧪 Testing

### Test the Agent
```bash
python personal_sweatbot_app.py
# Choose option 2 for exercise logging demo
```

### Test the API
```bash
# Start server
python personal_sweatbot_server.py

# Visit API docs
open http://localhost:8765/docs
```

### Test the Full System
```bash
python start_personal_sweatbot.py
# Visit http://localhost:4444
```

## 🛠️ Development

### Add New Features
1. **Agent**: Modify `src/agents/personal_sweatbot.py`
2. **Backend**: Add endpoints in `personal_sweatbot_server.py`
3. **Frontend**: Update components in `personal-ui/app/`

### Hebrew Language Support
- All Hebrew processing is handled by existing infrastructure
- Exercise parsing supports patterns like "עשיתי X תרגילים"
- Response filtering ensures Hebrew-only outputs
- RTL support in the UI with Noto Sans Hebrew font

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check API key
echo $GROQ_API_KEY

# Test agent directly
python -c "from src.agents.personal_sweatbot import PersonalSweatBot; bot = PersonalSweatBot(); print(bot.chat('test'))"
```

### Frontend Won't Load
```bash
cd personal-ui
npm install --force
npm run dev
```

### Hebrew Text Issues
- Ensure Noto Sans Hebrew font is loaded
- Check RTL settings in CSS
- Verify Hebrew text encoding (UTF-8)

## 📊 Example Interactions

**Exercise Logging:**
- You: "עשיתי 20 סקוואטים"
- SweatBot: "מעולה! 20 סקוואטים = **30 נקודות** 💪 **טיפ:** שמור על הגב ישר וירד עמוק."

**Progress Check:**
- You: "איך אני מתקדם?"  
- SweatBot: "אתה עושה עבודה מעולה! יש לך התקדמות נהדרת השבוע."

## 🎉 Success!

You now have a complete personal Hebrew fitness AI system! Enjoy your workouts with your personal SweatBot coach! 🏋️‍♂️💪