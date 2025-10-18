# SweatBot - Hebrew Fitness Assistant 🏋️‍♂️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/endlessblink/sweat-bot?style=social)](https://github.com/endlessblink/sweat-bot/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/endlessblink/sweat-bot?style=social)](https://github.com/endlessblink/sweat-bot/network)

**SweatBot** is an open-source Hebrew fitness assistant with voice interaction, gamification, and personalized workout recommendations. Perfect for Hebrew-speaking fitness enthusiasts who want a smart, conversational workout companion.

## ✨ Features

### 🎯 Core Functionality
- **🗣️ Voice Interaction** - Log workouts naturally using your voice in Hebrew or English
- **🏆 Points System** - Gamified fitness tracking with achievements and progress levels
- **📱 Progressive Web App** - Works on all devices with native mobile app experience
- **🧠 AI-Powered** - Smart exercise recognition and personalized recommendations
- **📊 Analytics Dashboard** - Track your progress with detailed insights and trends

### 🌟 Advanced Features
- **💪 Hebrew Exercise Database** - Comprehensive catalog with Hebrew terminology
- **🎯 Personalized Workouts** - AI-generated routines based on your goals and preferences
- **📈 Progress Tracking** - Visual charts and achievement milestones
- **🔧 Self-Hostable** - Complete control over your data with Docker deployment
- **🌐 Multilingual** - Full Hebrew and English support

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 🐳 One-Click Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/endlessblink/sweat-bot.git
cd sweat-bot

# Copy environment template
cp .env.example .env

# Add your API keys (see Configuration section)
# Edit .env with your preferred API keys

# Start everything with Docker Compose
docker-compose up -d

# Access at http://localhost:8005
```

### 🔧 Manual Setup

```bash
# Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend Setup
cd ../personal-ui-vite
npm install
npm run dev

# Access at http://localhost:8005
```

## ⚙️ Configuration

### Required API Keys

Add these to your `.env` file or Docker environment:

```bash
# AI Services (choose one or more)
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=AIzaSy-your-gemini-key-here
GROQ_API_KEY=gsk_your-groq-key-here

# Database (if not using Docker Compose)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/sweatbot
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
```

### API Key Setup

1. **OpenAI** - Get keys at [platform.openai.com](https://platform.openai.com/api-keys)
2. **Gemini** - Get keys at [makersuite.google.com](https://makersuite.google.com/app/apikey)
3. **Groq** - Get keys at [console.groq.com](https://console.groq.com/keys)

## 🏗️ Architecture

```
sweatbot/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── api/               # REST API endpoints
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   └── core/              # Configuration
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Backend container
├── personal-ui-vite/           # React TypeScript frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Application pages
│   │   ├── agent/            # Voice AI agent
│   │   └── utils/            # Helper functions
│   ├── package.json          # Node.js dependencies
│   └── Dockerfile           # Frontend container
├── config/
│   └── docker-compose.yml    # Complete development setup
├── docs/                    # Comprehensive documentation
└── render.yaml             # Render deployment configuration
```

## 📱 Usage

### Voice Commands (Hebrew)
- **"ביצעתי הליכה של 30 דקות"** - "I did a 30-minute walk"
- **"הרמתי משקולות 10 פעמים"** - "I lifted weights 10 times"
- **"סיימתי אימון ריצה"** - "I finished a running workout"

### Voice Commands (English)
- **"I did a 30-minute walk"** - Log cardio exercise
- **"I lifted weights for 45 minutes"** - Log strength training
- **"I finished my yoga session"** - Log flexibility workout

### Features
- **🏠 Dashboard** - Overview of your fitness progress
- **📊 Statistics** - Detailed analytics and insights
- **🎯 Goals** - Set and track fitness objectives
- **🏆 Achievements** - Unlock badges and milestones
- **💬 Chat** - Conversational fitness assistant

## 🌐 Deployment Options

### 🟢 SweatBot Cloud (Hosted)
- **Starter** - $9.99/month - Fully hosted with basic features
- **Pro** - $19.99/month - Advanced AI and analytics
- **Business** - $49.99/month - Teams and premium support

[**Sign up for SweatBot Cloud**](https://sweat-bot.com) - Coming soon!

### 🔧 Self-Hosting

#### Render (Recommended)
```bash
# Connect repository to Render
# Environment variables auto-configured from render.yaml
# Automatic deployments on main branch pushes
```

#### Docker Production
```bash
# Production deployment
docker-compose -f config/docker-compose.prod.yml up -d
```

#### Manual Cloud Deployment
See [Deployment Guide](docs/DEPLOYMENT-GUIDE.md) for:
- AWS EC2 + RDS
- Google Cloud Run + Cloud SQL
- Azure Container Instances + Database
- DigitalOcean App Platform

## 🧪 Development

### Local Development Setup
```bash
# Install dependencies
npm install          # Frontend
pip install -r backend/requirements.txt  # Backend

# Start development servers
npm run dev          # Frontend (port 8005)
python -m uvicorn backend.app.main:app --reload  # Backend (port 8000)
```

### Running Tests
```bash
# Backend tests
cd backend && python -m pytest

# Frontend tests
cd personal-ui-vite && npm test

# E2E tests
cd tests && npm run test:e2e
```

### Project Structure
- **`backend/app/api/`** - REST API endpoints
- **`personal-ui-vite/src/agent/`** - Voice AI and natural language processing
- **`backend/app/services/`** - Business logic and data processing
- **`docs/`** - Comprehensive documentation and guides

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/amazing-feature`
3. **Make your changes** with tests
4. **Commit your changes** - `git commit -m 'Add amazing feature'`
5. **Push to branch** - `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

### Areas for Contribution
- 🌍 **Additional Languages** - Add support for more languages
- 🎯 **New Exercises** - Expand the exercise database
- 📊 **Analytics Features** - Advanced fitness insights
- 📱 **Mobile Features** - Enhanced PWA functionality
- 🔧 **Integrations** - Connect with fitness trackers and services

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** - For GPT models powering natural language understanding
- **Google** - For Gemini AI models and speech recognition
- **Groq** - For fast AI inference
- **FastAPI** - For the high-performance Python backend
- **React** - For the responsive frontend interface

## 📞 Support

### 🆓 Community Support (Free)
- [GitHub Issues](https://github.com/endlessblink/sweat-bot/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/endlessblink/sweat-bot/discussions) - Community discussions
- [Discord Community](https://discord.gg/sweatbot) - Chat with other users (Coming soon)

### 💬 Premium Support (Paid)
- Email support with 24-hour response time
- Priority bug fixes and feature requests
- Custom integration assistance
- See [Business Model](docs/BUSINESS-MODEL.md) for details

## 🗺️ Roadmap

### v1.0 (Current)
- ✅ Basic workout tracking
- ✅ Voice input (Hebrew/English)
- ✅ Points system and gamification
- ✅ PWA with mobile experience

### v1.1 (Coming Soon)
- 🎯 Advanced AI workout recommendations
- 📊 Enhanced analytics dashboard
- 🥗 Nutrition tracking integration
- 📱 Offline mode support

### v2.0 (Future)
- 👥 Multi-user family accounts
- 🔗 Wearable device integrations
- 🏢 Team and business features
- 🌍 Additional language support

## 📈 Analytics & Telemetry

SweatBot collects anonymous usage data to improve the product:
- Feature usage statistics
- Performance metrics
- Error reports
- Aggregate user behavior patterns

**No personal data or workout information is collected** in the open source version. See [Privacy Policy](docs/PRIVACY.md) for details.

---

**Made with ❤️ for the Hebrew-speaking fitness community**

⭐ **Star this repository** to support the project!

🚀 **Try SweatBot Cloud** for a fully hosted experience: [sweat-bot.com](https://sweat-bot.com) (Coming soon!)