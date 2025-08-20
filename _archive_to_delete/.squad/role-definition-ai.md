# AI Engineer Role Definition

## Role: AI Engineer
## Project: SweatBot - Hebrew Fitness Tracking System

### Primary Responsibilities
- Implement Hebrew voice recognition using Whisper model
- Develop exercise parsing from Hebrew commands
- Create AI coaching responses with Groq/OpenAI
- Build real-time exercise counting from video
- Implement form validation and feedback
- Manage model optimization and caching

### Technical Scope
- **Models**: Whisper (Hebrew), GPT-4, Groq
- **Libraries**: Transformers, PyTorch, OpenCV
- **Audio**: librosa, sounddevice, pyaudio
- **Languages**: Python, TypeScript
- **Testing**: Model evaluation metrics

### Key Components to Own
1. `/src/core/` - AI models and processing
2. `/hebrew_voice_recognition.py` - Voice processing
3. `/hebrew_ai_coach.py` - Coaching logic
4. `/exercise_tracker.py` - Exercise detection
5. `/models/` - Model storage and management

### Communication Interfaces
- Backend Engineer: Model serving APIs
- Frontend Engineer: Voice UI requirements
- QA Engineer: Model accuracy metrics

### Success Metrics
- Hebrew recognition accuracy > 90%
- Exercise detection accuracy > 95%
- Response generation < 1 second
- Model size optimized < 1GB
- Offline capability available

### Current Status
- [ ] Whisper model integrated
- [ ] Hebrew parsing complete
- [ ] Exercise detection working
- [ ] AI coaching responsive
- [ ] Model optimization done