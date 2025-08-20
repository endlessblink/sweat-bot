# Product Requirements Document (PRD)
# SweatBot - Hebrew Fitness AI Tracker

## Version: 1.0.0
## Date: 2025-08-17
## Status: In Development

---

## Executive Summary

SweatBot is an AI-powered fitness tracking application designed specifically for Hebrew-speaking users. It combines voice recognition, real-time exercise tracking, gamification, and personalized AI coaching to create a comprehensive fitness companion that understands and responds in Hebrew.

The project addresses the fragmented experience of using multiple disconnected fitness and nutrition apps by providing a unified, chat-first interface that consolidates exercise tracking, nutrition management, and social engagement features into a single, fluid conversational platform.

### Key Value Propositions
1. **Native Hebrew Support**: First fitness app with accurate Hebrew voice recognition
2. **Hands-Free Operation**: Voice commands during workouts
3. **AI Personal Trainer**: Adaptive coaching in Hebrew
4. **Community Driven**: Gamification and social features
5. **Cross-Platform**: Works on mobile, desktop, and web

---

## Problem Statement

### User Problems
1. **Language Barrier**: Existing fitness apps don't support Hebrew voice commands
2. **Workout Interruption**: Manual logging disrupts exercise flow
3. **Lack of Motivation**: Working out alone without feedback
4. **Generic Programs**: One-size-fits-all workout plans
5. **Progress Tracking**: Difficult to track personal records and improvements

### Market Gap
- No Hebrew-first fitness tracking solution
- Limited voice-controlled fitness apps
- Lack of culturally aware AI coaching
- Missing integration of Israeli fitness culture (military fitness, Krav Maga)

---

## Product Goals & Objectives

### Primary Goals
1. **Achieve 90% Hebrew voice recognition accuracy**
2. **Reach 1,000 active users within 3 months**
3. **Maintain 60% user retention after 30 days**
4. **Generate 4.5+ app store rating**

### Success Metrics
- **User Engagement**: 3+ workouts per week per user
- **Voice Usage**: 70% of exercises logged via voice
- **Gamification**: 80% of users earning weekly achievements
- **Community**: 50% of users engaging with social features

---

## User Personas

### Persona 1: The Hebrew Native (יעל, 28)
**Background**: Marketing professional, CrossFit enthusiast  
**Goals**: Track WODs, compete with friends, improve PRs  
**Pain Points**: English-only apps, manual logging during workouts  
**Needs**: Quick Hebrew voice logging, social competition  

### Persona 2: The Beginner (דוד, 35)
**Background**: Software developer, starting fitness journey  
**Goals**: Build healthy habits, lose weight, gain strength  
**Pain Points**: Intimidation, lack of guidance, no motivation  
**Needs**: Personalized coaching, progress tracking, encouragement  

### Persona 3: The Athlete (מיכל, 24)
**Background**: IDF fitness instructor, competitive athlete  
**Goals**: Optimize training, track detailed metrics  
**Pain Points**: Lack of advanced analytics, no Hebrew commands  
**Needs**: Precise tracking, form analysis, performance insights  

---

## Feature Requirements

### Core Features (MVP)

#### 1. Hebrew Voice Recognition
**Description**: Accurate speech-to-text for Hebrew exercise commands  
**Requirements**:
- Support 20+ common exercises in Hebrew
- Handle numbers in Hebrew and English
- Recognize weight specifications (קילו/kg)
- Work with background noise (gym environment)
- Provide audio confirmation feedback

**Acceptance Criteria**:
- [ ] 90% accuracy for common commands
- [ ] <2 second processing time
- [ ] Handles accents and variations
- [ ] Works offline for basic commands

#### 2. Exercise Tracking
**Description**: Comprehensive workout logging and history  
**Requirements**:
- Log exercises with reps, sets, weight, duration
- Auto-detect personal records
- Calculate calories burned
- Track workout duration
- Export data capability

**Database Schema**:
```sql
exercises: {
  id, user_id, name, name_he,
  reps, sets, weight, duration,
  calories, points, timestamp
}
```

#### 3. Gamification System
**Description**: Points, achievements, and leaderboards  
**Requirements**:
- Point calculation per exercise
- Achievement badges (first workout, PR, streak)
- Weekly/monthly challenges
- Friend leaderboards
- Progress levels (beginner → expert)

**Point System**:
```yaml
exercises:
  pushup: 2 points/rep
  squat: 3 points/rep
  burpee: 5 points/rep
  running: 10 points/km
```

#### 4. AI Coaching
**Description**: Personalized guidance and motivation  
**Requirements**:
- Generate workout suggestions
- Provide form corrections
- Motivational messages in Hebrew
- Adapt to user fitness level
- Answer fitness questions

**Example Interactions**:
```
User: "מה כדאי לי לעשות היום?"
AI: "בוא נעשה אימון פלג גוף עליון! נתחיל עם 3 סטים של 10 שכיבות סמיכה"
```

#### 5. Mobile Web App
**Description**: Progressive Web App for mobile access  
**Requirements**:
- Responsive design for all screen sizes
- Offline capability
- Push notifications
- Install to home screen
- Camera/microphone access

---

## Technical Requirements

### Performance
- **Response Time**: <2 seconds for voice commands
- **Model Loading**: <30 seconds initial load
- **Offline Mode**: Core features work without internet
- **Battery Usage**: <10% drain per hour of use

### Compatibility
- **Browsers**: Chrome 90+, Safari 14+, Firefox 88+
- **Mobile OS**: iOS 14+, Android 10+
- **Desktop**: Windows 10+, macOS 11+, Ubuntu 20+

### Security & Privacy
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: JWT with refresh tokens
- **GDPR Compliance**: Data export and deletion
- **Anonymous Analytics**: No PII in metrics

### Accessibility
- **Hebrew RTL**: Full right-to-left support
- **Screen Readers**: ARIA labels and roles
- **Keyboard Navigation**: Full keyboard support
- **High Contrast**: Alternative color schemes
- **Large Targets**: Minimum 44px touch targets

---

## User Journeys

### Journey 1: First-Time User
```
1. Lands on website → Sees Hebrew welcome
2. Signs up with email → Quick onboarding
3. Grants microphone permission → Test voice
4. Says first exercise → Sees it logged
5. Completes workout → Earns first achievement
6. Views summary → Shares with friends
```

### Journey 2: Daily Workout
```
1. Opens app → Sees daily challenge
2. Starts workout → Voice: "התחלתי אימון"
3. Logs exercises → Voice commands throughout
4. Gets PR notification → Celebration animation
5. Completes workout → Points and summary
6. Checks leaderboard → Sees ranking
```

---

## Design Requirements

### Visual Design
- **Theme**: Modern, energetic, motivating
- **Colors**: Blue/white (Israeli colors) with energy accents
- **Typography**: Hebrew-friendly fonts (Rubik, Assistant)
- **Icons**: Exercise illustrations, achievement badges
- **Animations**: Smooth transitions, celebration effects

### Voice UI Design
- **Wake Word**: "סוויטבוט" (SweatBot)
- **Confirmation**: Audio + visual feedback
- **Error Handling**: "לא הבנתי, תנסה שוב"
- **Processing**: Waveform animation
- **Success**: Chime sound + visual confirmation

---

## Release Plan

### Phase 1: MVP (Current - Q1 2025)
- ✅ Hebrew voice recognition
- ✅ Basic exercise tracking
- ✅ Simple gamification
- 🔄 Mobile web app
- 🔄 AI coaching basics

### Phase 2: Enhancement (Q2 2025)
- [ ] Video form analysis
- [ ] Social features
- [ ] Nutrition tracking
- [ ] Wearable integration
- [ ] Advanced analytics

### Phase 3: Scale (Q3 2025)
- [ ] Multi-language support
- [ ] B2B gym partnerships
- [ ] Virtual coach marketplace
- [ ] AR demonstrations
- [ ] Health provider integration

---

## Risk Analysis

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Model size (5GB) | High | Cloud inference, model optimization |
| Voice accuracy | High | More training data, fallback to text |
| Scalability | Medium | Microservices, caching, CDN |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| User adoption | High | Free tier, influencer marketing |
| Competition | Medium | Focus on Hebrew niche |
| Monetization | Medium | Freemium model validation |

---

## Dependencies

### External Services
- **Whisper API**: Hebrew voice recognition
- **Gemini/GPT-4**: AI coaching responses
- **Google TTS**: Hebrew speech synthesis
- **PostgreSQL**: Primary database
- **Redis**: Caching and real-time

### Internal Dependencies
- Squad Engineering team coordination
- Hebrew language training data
- Fitness expert validation
- User testing feedback

---

## Success Criteria

### Launch Criteria
- [ ] 90% voice recognition accuracy achieved
- [ ] 100 beta users tested successfully
- [ ] All P0 features implemented
- [ ] Performance targets met
- [ ] Security audit passed

### Post-Launch Success
- [ ] 1,000 users in 3 months
- [ ] 60% retention after 30 days
- [ ] 4.5+ app store rating
- [ ] 50+ daily active users
- [ ] Positive user testimonials

---

## Appendices

### A. Competitive Analysis
- MyFitnessPal: No Hebrew, manual entry
- Strava: Social but no Hebrew voice
- Freeletics: AI coach but English only

### B. Hebrew Exercise Vocabulary
```yaml
hebrew_exercises:
  שכיבות_סמיכה: [pushup, pushups]
  סקוואטים: [squat, squats]
  ברפיז: [burpee, burpees]
  כפיפות_בטן: [situp, situps]
  משיכות: [pullup, pullups]
```

### C. Technical Architecture
See `.bmad-core/agents/architect.md` for detailed architecture

---

*This PRD is a living document and will be updated as the product evolves.*