# Hebrew-Enabled CrossFit AI Automation System 🏋️‍♂️

A comprehensive bilingual (Hebrew/English) AI-powered CrossFit automation system with voice control, intelligent coaching, gamification, and social features.

## 🌟 Features

### 🎤 Hebrew Voice Recognition
- **ivrit.ai Whisper Model** - Free Hebrew-optimized speech recognition
- **Multiple Fallbacks** - OpenAI Whisper, Google Speech-to-Text
- **Real-time Processing** - Voice-activated workout logging
- **Bilingual Support** - Automatic language detection

### 🔊 Hebrew Text-to-Speech
- **Multiple TTS Providers** - ElevenLabs, gTTS, Edge TTS
- **Natural Hebrew Voices** - Male/female options with personalities
- **Queue Management** - Sequential speech playback
- **Contextual Responses** - Motivational messages in Hebrew

### 🤖 AI Coaching
- **Bilingual AI Coach** - Responses in Hebrew and English
- **Multiple Personalities** - Supportive, Drill Sergeant, Professional
- **Free AI Options** - Groq API (free tier), OpenAI fallback
- **Contextual Advice** - Exercise-specific tips and feedback

### 📊 Workout Tracking
- **Hebrew Exercise Recognition** - Parse Hebrew workout commands
- **Google Sheets Integration** - Automatic data logging
- **Personal Records** - Track PRs and improvements
- **History Analysis** - Workout trends and insights

### 🏆 Gamification
- **Hebrew Achievements** - Culturally relevant badges
- **Point System** - Earn points for workouts and streaks
- **Leaderboards** - Compete with friends
- **Level Progression** - From מתחיל (Beginner) to אל האימונים (Training God)

### 📱 Additional Features
- **Food Photo Analysis** - Log nutrition with camera
- **Instagram Integration** - Auto-post achievements
- **Daily Reminders** - Motivational messages
- **Weekly Summaries** - Progress reports

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Microphone for voice input
- Google account (for Sheets integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hebrew-crossfit-ai.git
cd hebrew-crossfit-ai
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up API keys:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Configure Google Sheets:
   - Create a service account in Google Cloud Console
   - Download credentials JSON
   - Save as `credentials.json` in project root

5. Run the application:
```bash
python main.py
```

## 🎮 Usage

### Voice Commands (Hebrew)
- **Log Workout**: "עשיתי 20 שכיבות סמיכה" (I did 20 push-ups)
- **With Weight**: "דדליפט 5 חזרות 150 קילו" (Deadlift 5 reps 150 kg)
- **Sets**: "3 סטים של 10 סקוואט עם 100 קילו" (3 sets of 10 squats with 100 kg)
- **Cardio**: "רצתי 5 קילומטר" (I ran 5 kilometers)

### Hotkeys
- **Ctrl+Space**: Activate voice recording
- **Ctrl+C**: Exit application

## 💰 Cost Optimization

### Completely Free Setup
- **ivrit.ai Whisper**: Free Hebrew speech recognition
- **gTTS**: Free text-to-speech
- **Groq API**: Free tier for AI responses
- **Google Sheets**: Free storage
- **Total Cost**: $0/month

### Enhanced Setup
- **ElevenLabs**: Better Hebrew voices (free tier available)
- **OpenAI API**: Advanced AI responses ($2-5/month)
- **Total Cost**: $2-5/month

## 🔧 Configuration

Edit `config.json` to customize:

```json
{
  "default_language": "he",
  "coach_personality": "supportive",
  "voice_personality": "Hila",
  "notifications": {
    "daily_reminders": true,
    "reminder_times": ["08:00", "18:00"]
  }
}
```

## 📋 Supported Hebrew Exercises

| Hebrew | English |
|--------|---------|
| שכיבות סמיכה | Push-ups |
| מתח | Pull-ups |
| סקוואט | Squats |
| דדליפט | Deadlift |
| ברפיז | Burpees |
| קפיצות קופסה | Box jumps |
| כדור קיר | Wall balls |

## 🏗️ Architecture

```
hebrew-crossfit-ai/
├── hebrew_voice_recognition.py  # ivrit.ai Whisper integration
├── hebrew_tts.py               # Multi-provider TTS service
├── hebrew_ai_coach.py          # Bilingual AI coaching
├── hebrew_workout_parser.py    # Hebrew command parsing
├── hebrew_gamification.py      # Achievement system
├── main.py                     # Main application
├── config.json                 # Configuration
└── requirements.txt            # Dependencies
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add Hebrew language tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- **ivrit.ai** - Hebrew Whisper model
- **Groq** - Free LLM API
- **Hebrew NLP Community** - Language resources

---

Made with 💪 and ❤️ for the Hebrew CrossFit community