# Hebrew CrossFit AI 🏋️

> **AI-powered Hebrew CrossFit coaching with advanced voice interaction**

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hebrew Support](https://img.shields.io/badge/language-Hebrew-green.svg)](https://en.wikipedia.org/wiki/Hebrew_language)

Hebrew CrossFit AI is an intelligent fitness coaching application that provides personalized workout guidance, exercise tracking, and motivational coaching entirely in Hebrew. The app features advanced voice recognition, real-time coaching, and comprehensive fitness analytics.

## ✨ Features

### 🗣️ Voice Interaction
- **Full Hebrew Voice Recognition**: Speak naturally in Hebrew to log exercises
- **AI Voice Responses**: The coach speaks back in Hebrew with personality
- **Mobile-Optimized**: Perfect voice experience on Android phones
- **Offline Capable**: Basic functionality works without internet

### 🤖 Intelligent Coaching
- **Personalized AI Coach**: Adapts to your fitness level and goals
- **Real-time Motivation**: Dynamic encouragement during workouts
- **Form Correction**: Audio feedback on exercise technique
- **Progress-based Advice**: Recommendations based on your history

### 📊 Comprehensive Tracking
- **Exercise Logging**: Automatic tracking via voice or manual input
- **Progress Analytics**: Detailed charts and statistics
- **Achievement System**: Points, levels, and milestone celebrations
- **Workout History**: Complete exercise database with timestamps

### 📱 Multi-Platform Support
- **Desktop Application**: Full-featured tkinter interface
- **Web Application**: Browser-based with mobile optimization
- **Mobile PWA**: Progressive Web App for Android/iOS
- **Voice-First Design**: Optimized for hands-free interaction

## 🚀 Quick Start

### Prerequisites
- Python 3.9 or higher
- Microphone for voice input
- Internet connection for AI services
- Google Gemini API key (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hebrew-crossfit-ai/hebrew-crossfit-ai.git
cd hebrew-crossfit-ai
```

2. **Install dependencies**
```bash
pip install -e .
```

3. **Configure API keys**
```bash
cp .env.example .env
# Edit .env file with your API keys
```

4. **Run the application**
```bash
# Desktop app
hebrew-crossfit-desktop

# Web app
hebrew-crossfit-web

# Mobile app
hebrew-crossfit-mobile
```

### Quick Setup with Scripts

**Windows:**
```batch
setup.bat
run_desktop.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
./scripts/run_desktop.sh
```

## 🎯 Usage Examples

### Voice Commands (Hebrew)
```
עשיתי 20 שכיבות סמיכה
ביצעתי 15 סקוואטים ו-10 ברפיז
התחלתי עם 30 שניות פלאנק
רצתי 15 דקות
```

### AI Responses
```
User: "אני עייף היום"
AI: "אני מבין. בוא נעשה אימון קל יותר היום - 10 דקות stretching ותרגילי נשימה?"

User: "כואב לי הגב"
AI: "חשוב לא להתעלם מכאב. בוא נתמקד בחיזוק הליבה ותרגילי גמישות לגב."
```

## 📋 Supported Exercises

| Exercise (Hebrew) | Exercise (English) | Points per Rep |
|------------------|-------------------|----------------|
| שכיבות סמיכה | Push-ups | 2 |
| סקוואטים | Squats | 3 |
| ברפיז/בורפיס | Burpees | 5 |
| כפיפות בטן | Sit-ups | 2 |
| משיכות | Pull-ups | 4 |
| לחיצות | Overhead Press | 3 |
| סקווט ג'אמפ | Jump Squats | 4 |
| פלאנק | Plank | 1 per second |
| ריצה | Running | 1 per minute |

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Required
GEMINI_API_KEY=your_gemini_key_here

# Optional
GROQ_API_KEY=your_groq_key_here
VOICE_LANGUAGE=he-IL
UI_THEME=light
ENABLE_ANALYTICS=true
```

### Voice Settings
```python
# Customize voice recognition
VOICE_TIMEOUT=5  # seconds
PHRASE_TIMEOUT=1  # seconds
TTS_VOICE=avri  # Hebrew voice name
```

## 🏗️ Architecture

```
src/
├── core/           # Core business logic
│   ├── exercise_tracker.py
│   ├── ai_coach.py
│   ├── voice_recognition.py
│   └── gamification.py
├── ui/             # User interfaces
│   ├── desktop_app.py
│   ├── web_app.py
│   └── mobile_app.py
├── services/       # External services
│   └── tts_service.py
└── utils/          # Utilities and config
    ├── config.py
    └── database.py
```

## 🧪 Testing

```bash
# Run all tests
pytest tests/

# Test voice recognition
python -m pytest tests/test_voice_recognition.py -v

# Test exercise tracking
python -m pytest tests/test_exercise_tracking.py -v
```

## 📱 Mobile Setup

### Android Chrome
1. Open the web app in Chrome
2. Tap "Add to Home Screen"
3. Grant microphone permissions
4. Use voice button for interaction

### PWA Installation
The app automatically prompts for installation on supported browsers.

## 🔒 Privacy & Security

- **Local Data**: Exercise data stored locally by default
- **Encrypted Storage**: Sensitive data encrypted at rest
- **Anonymous Analytics**: No personal data in usage statistics
- **GDPR Compliant**: Full data export and deletion support

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Install development dependencies
pip install -e ".[dev]"

# Run code formatting
black src/ tests/
flake8 src/ tests/

# Run type checking
mypy src/
```

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md) - Complete usage instructions
- [API Documentation](docs/API.md) - Developer API reference
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Voice Integration](docs/VOICE.md) - Voice feature details

## 🐛 Troubleshooting

### Common Issues

**Voice recognition not working:**
```bash
# Check microphone permissions
# Ensure browser supports Web Speech API
# Verify internet connection for cloud services
```

**API key errors:**
```bash
# Verify .env file exists and contains valid keys
# Check API key permissions and quotas
```

**Audio playback issues:**
```bash
# Install audio dependencies
pip install pyaudio sounddevice

# On Ubuntu/Debian
sudo apt-get install portaudio19-dev python3-pyaudio
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ivrit.ai](https://ivrit.ai/) for Hebrew Whisper models
- [Google Gemini](https://ai.google.dev/) for AI conversation capabilities
- [Streamlit](https://streamlit.io/) for web application framework
- Hebrew CrossFit community for feedback and testing

## 📞 Support

- 🐛 [Report Issues](https://github.com/hebrew-crossfit-ai/hebrew-crossfit-ai/issues)
- 💬 [Discussions](https://github.com/hebrew-crossfit-ai/hebrew-crossfit-ai/discussions)
- 📧 [Contact](mailto:support@hebrew-crossfit-ai.com)

---

<div align="center">

**Built with ❤️ for the Hebrew-speaking fitness community**

[🏠 Home](/) • [📖 Docs](docs/) • [🚀 Demo](https://hebrew-crossfit-ai.streamlit.app)

</div>