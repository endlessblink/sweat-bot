# SweatBot Production Requirements - Beta Launch

**Document Purpose:** Define all features and systems required for production beta launch
**Last Updated:** October 11, 2025
**Status:** Requirements gathering phase

---

## 🎯 Core Production Features

### 0. Full Mobile Support (E2E)
**Status:** ❌ **NOT IMPLEMENTED**

**Requirements:**
- [ ] **Progressive Web App (PWA)** - Installable on mobile home screen
- [ ] **Responsive design** - Optimized layouts for mobile, tablet, desktop
- [ ] **Touch-optimized UI** - Large tap targets, swipe gestures
- [ ] **Offline support** - Core features work without internet
- [ ] **Mobile voice input** - Native mobile audio recording
- [ ] **Mobile notifications** - Push notifications for achievements, streaks
- [ ] **iOS support** - Tested and working on iPhone/iPad
- [ ] **Android support** - Tested and working on Android devices
- [ ] **Mobile performance** - Smooth 60fps animations on mobile
- [ ] **Mobile-first navigation** - Bottom navigation bar, swipe menus
- [ ] **App-like experience** - Full screen, no browser chrome
- [ ] **Mobile camera access** - (Optional) Photo tracking for meals/form
- [ ] **Landscape mode support** - Works in both portrait and landscape
- [ ] **Mobile keyboard handling** - Input fields work properly on mobile

**Current Implementation:**
- ✅ Basic responsive CSS (Tailwind utilities)
- ❌ Not tested on actual mobile devices
- ❌ No PWA manifest or service worker
- ❌ No mobile-specific optimizations
- ❌ No offline support

**Blockers/Dependencies:**
- Need PWA manifest.json and service worker
- Need mobile testing devices or emulators
- Need touch gesture library (optional)
- Need mobile notification system
- Need mobile performance testing

**Priority:** 🔴 **CRITICAL** (Fitness apps must work on mobile - users track workouts on their phones)

---

### 1. Voice Chat System
**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**Requirements:**
- [ ] **Real-time voice input** - Press-and-hold recording
- [ ] **Hebrew speech-to-text** - Whisper or equivalent Hebrew ASR
- [ ] **Voice output (TTS)** - Text-to-speech responses in Hebrew
- [ ] **Voice activity detection** - Auto-stop when user stops speaking
- [ ] **Noise cancellation** - Background noise filtering
- [ ] **Mobile support** - Voice recording on iOS/Android
- [ ] **Bluetooth headset support** - Works with wireless audio devices

**Current Implementation:**
- ✅ UI has microphone button
- ❌ Voice recording not fully implemented
- ❌ Speech-to-text not connected
- ❌ Text-to-speech not implemented

**Blockers/Dependencies:**
- Need to choose Hebrew STT provider (Whisper, Google Speech, Azure)
- Need to integrate TTS (Google TTS, Azure, ElevenLabs)
- Need WebRTC or MediaRecorder API implementation

**Priority:** 🔴 **CRITICAL** (Essential for fitness tracking - hands-free during workouts)

---

### 2. Nutrition Tracking System
**Status:** ❌ **NOT IMPLEMENTED**

**Requirements:**

#### 2.1 Calorie Intake Tracking
- [ ] **Manual calorie logging** - "אכלתי 500 קלוריות" (I ate 500 calories)
- [ ] **Food recognition** - "אכלתי פיצה" → Auto-calculate calories
- [ ] **Meal categories** - Breakfast, lunch, dinner, snacks
- [ ] **Daily calorie goal** - Set target (e.g., 2000 kcal/day)
- [ ] **Calorie balance** - Show consumed vs. goal
- [ ] **Calorie deficit/surplus** - Track for weight loss/gain
- [ ] **Food database** - Common Israeli foods with Hebrew names

#### 2.2 Protein Tracking
- [ ] **Daily protein goal** - Set target (e.g., 150g protein/day)
- [ ] **Protein per meal** - Track protein intake per meal
- [ ] **Protein sources** - Chicken, eggs, protein powder, etc.
- [ ] **Protein balance** - Show consumed vs. goal
- [ ] **Protein timing** - Recommendations for post-workout protein

#### 2.3 Nutrition Tools
- [ ] **Food logger tool** - AI tool for logging meals
- [ ] **Nutrition stats tool** - Retrieve daily/weekly nutrition data
- [ ] **Macro breakdown** - Calories, protein, carbs, fats

**Current Implementation:**
- ❌ No nutrition tracking exists
- ❌ No food database
- ❌ No calorie/protein tools

**Blockers/Dependencies:**
- Need Israeli food database (Hebrew names, local foods)
- Need macro calculation logic
- Need nutrition data models in database

**Priority:** 🔴 **CRITICAL** (Core fitness tracking feature)

---

### 3. Extensive Gamification System
**Status:** 🟡 **BASIC IMPLEMENTATION**

**Requirements:**

#### 3.1 Points System (Robust & Clear)
- [ ] **Clear point calculation rules** - Documented formula per exercise
- [ ] **Exercise-based points** - Different points per exercise type
- [ ] **Nutrition-based points** - Points for hitting calorie/protein goals
- [ ] **Streak bonuses** - Multiplier for consecutive workout days
- [ ] **Personal record bonuses** - Extra points for beating PRs
- [ ] **Challenge completion points** - Bonus for completing challenges
- [ ] **Point history transparency** - Users can see exactly how points were earned
- [ ] **Point audit log** - Full history of point gains/losses

#### 3.2 Levels & Progression
- [ ] **Experience points (XP)** - Separate from points for leveling up
- [ ] **Level tiers** - מתחיל → חובב → מתקדם → מומחה → אלוף → אגדה
- [ ] **Level requirements** - Clear XP thresholds per level
- [ ] **Level rewards** - Unlock features, badges, or titles
- [ ] **Progress bars** - Visual XP progress to next level
- [ ] **Level celebrations** - Animations/sounds on level up

#### 3.3 Achievements & Badges
- [ ] **Achievement categories** - Strength, cardio, consistency, nutrition
- [ ] **Milestone achievements** - First workout, 100 workouts, etc.
- [ ] **Rare achievements** - 30-day streak, 1000 total exercises
- [ ] **Hidden achievements** - Secret unlockables
- [ ] **Achievement showcase** - Display earned badges on profile
- [ ] **Achievement notifications** - Celebrate unlocks with animations

#### 3.4 Challenges & Competitions
- [ ] **Daily challenges** - "Do 50 push-ups today"
- [ ] **Weekly challenges** - "Complete 5 workouts this week"
- [ ] **Monthly challenges** - "Burn 10,000 calories this month"
- [ ] **Personal challenges** - User-created custom goals
- [ ] **Leaderboards** - Compare with other users (optional)
- [ ] **Challenge rewards** - Bonus points, badges, or titles

#### 3.5 Streaks & Consistency
- [ ] **Workout streaks** - Days in a row with exercise
- [ ] **Nutrition streaks** - Days hitting calorie/protein goals
- [ ] **Streak recovery** - Grace period for missed days
- [ ] **Streak milestones** - Special badges for 7, 30, 100 day streaks
- [ ] **Streak leaderboard** - Top users by streak length

**Current Implementation:**
- ✅ Basic points system (75 points for 20 squats)
- ✅ Personal record detection
- ⚠️ Points calculation exists but not documented
- ❌ No levels/XP system
- ❌ No achievements/badges
- ❌ No challenges
- ❌ No streaks

**Blockers/Dependencies:**
- Need gamification database tables (achievements, challenges, streaks)
- Need point calculation documentation
- Need UI components for badges, progress bars, leaderboards

**Priority:** 🔴 **CRITICAL** (Core engagement/retention feature)

---

### 4. Data Visualization & Analytics
**Status:** ❌ **NOT IMPLEMENTED**

**Requirements:**

#### 4.1 Graphs Per Exercise
- [ ] **Exercise volume over time** - Line chart of total reps/weight
- [ ] **Personal record progression** - Chart showing PR improvements
- [ ] **Frequency analysis** - How often you do each exercise
- [ ] **Intensity trends** - Weight/reps progression over weeks/months
- [ ] **Comparison view** - Compare multiple exercises side-by-side

#### 4.2 Performance Tables
- [ ] **Exercise history table** - All logged exercises with filters
- [ ] **Personal records table** - Best performance per exercise
- [ ] **Workout summary table** - Sessions with date, duration, points
- [ ] **Nutrition table** - Daily calorie/protein intake log
- [ ] **Points history table** - All point transactions with reasons

#### 4.3 Dashboard Analytics
- [ ] **Weekly summary** - Total workouts, points, calories burned
- [ ] **Monthly summary** - Trends, improvements, achievements
- [ ] **Muscle group breakdown** - Which muscles trained most
- [ ] **Workout type distribution** - Cardio vs. strength vs. flexibility
- [ ] **Time-of-day analysis** - When you work out most

#### 4.4 Export & Reports
- [ ] **PDF workout reports** - Downloadable monthly summaries
- [ ] **CSV data export** - Export all data for external analysis
- [ ] **Share achievements** - Social media sharing (optional)

**Current Implementation:**
- ✅ Basic "📊 סטטיסטיקות" button exists in UI
- ❌ No actual graphs implemented
- ❌ No tables beyond database records
- ❌ No analytics dashboard

**Blockers/Dependencies:**
- Need charting library (Chart.js, Recharts, or similar)
- Need data aggregation queries
- Need UI components for graphs and tables

**Priority:** 🟡 **HIGH** (Important for user engagement and progress tracking)

---

### 5. Point Management System (Clear & Robust)
**Status:** 🟡 **BASIC IMPLEMENTATION**

**Requirements:**

#### 5.1 Point Calculation Transparency
- [ ] **Documented formulas** - Clear rules for each exercise type
- [ ] **Base points** - Standard points per exercise (e.g., 1 point per rep)
- [ ] **Weight multipliers** - Extra points for weighted exercises
- [ ] **Distance multipliers** - Points for running/cycling distance
- [ ] **Duration multipliers** - Points for time-based exercises
- [ ] **Form score bonuses** - Extra points for perfect form (if tracked)
- [ ] **Difficulty modifiers** - Harder exercises worth more points

#### 5.2 Point Modifiers & Bonuses
- [ ] **Streak multipliers** - 1.1x for 7-day streak, 1.2x for 30-day, etc.
- [ ] **Personal record bonuses** - 2x points for new PRs
- [ ] **Challenge bonuses** - Extra points for challenge completion
- [ ] **Nutrition bonuses** - Points for hitting calorie/protein goals
- [ ] **Consistency bonuses** - Extra points for regular workouts
- [ ] **Time-of-day bonuses** - (Optional) More points for morning workouts

#### 5.3 Point History & Auditing
- [ ] **Point transaction log** - Every point gain/loss with timestamp
- [ ] **Reason field** - Why points were awarded (e.g., "20 squats + PR bonus")
- [ ] **Point adjustments** - Admin ability to correct errors
- [ ] **Point breakdown view** - Show user exactly how their points were calculated
- [ ] **Daily/weekly point summaries** - Total points earned per period

#### 5.4 Point Reset & Management
- [ ] **Lifetime points** - Never reset, track total career points
- [ ] **Season points** - Optional: Reset points quarterly/yearly for competitions
- [ ] **Point decay** - (Optional) Reduce points for inactivity
- [ ] **Point refunds** - Undo points if exercise deleted/corrected
- [ ] **Point cap** - (Optional) Max points per day to prevent gaming

**Current Implementation:**
- ✅ Basic point calculation (75 points for 20 squats)
- ✅ Points stored in database (points_earned field)
- ⚠️ Calculation logic exists but not documented
- ❌ No point history table
- ❌ No modifier system visible to user
- ❌ No transparency/breakdown UI

**Blockers/Dependencies:**
- Need to document existing point formulas
- Need point_history database table
- Need UI components to show point breakdown

**Priority:** 🔴 **CRITICAL** (Core to gamification, must be clear and fair)

---

## 📊 Current System Status

### ✅ What's Working (Verified October 11, 2025)
1. **Backend AI Proxy** - Secure, operational, tested in browser
2. **Tool Calling** - Exercise logging works end-to-end
3. **Guest Authentication** - Automatic, seamless
4. **Database Persistence** - PostgreSQL + MongoDB operational
5. **Basic Exercise Logging** - Can log exercises with reps/sets/weight
6. **Basic Points** - Points calculated and stored (formula unclear)
7. **WebSocket Real-time** - Connection established
8. **Hebrew Support** - UI and text input fully support Hebrew

### ⚠️ Partially Implemented
1. **Voice Input** - UI exists, but not fully functional
2. **Statistics View** - Button exists, but no actual graphs/tables
3. **Points System** - Works but lacks transparency and documentation
4. **Gamification** - Basic points exist, but no levels/achievements/challenges

### ❌ Not Yet Implemented
1. **Full Mobile Support** - Not tested on real devices, no PWA
2. **Voice Output (TTS)** - No speech responses
3. **Nutrition Tracking** - No calorie or protein logging
4. **Graphs & Charts** - No data visualization
5. **Achievements System** - No badges or milestones
6. **Challenges System** - No daily/weekly challenges
7. **Streaks System** - No consistency tracking
8. **Levels/XP System** - No progression tiers
9. **Point History** - No audit log or breakdown view
10. **Export/Reports** - No data export features

---

## 🎯 Recommended Implementation Order

### Phase 0: Mobile Foundation (1-2 weeks) **← START HERE**
**Goal:** Make the app work properly on mobile devices (CRITICAL)

1. **PWA Setup** (2-3 days)
   - Create manifest.json with app metadata
   - Implement service worker for offline support
   - Add install prompt for home screen
   - Test PWA installation on iOS and Android

2. **Mobile-First Responsive Design** (3-4 days)
   - Audit current mobile layout issues
   - Fix touch target sizes (min 44x44px)
   - Optimize layouts for mobile screens
   - Test on real devices (iPhone, Android)
   - Add mobile keyboard handling

3. **Mobile Voice Input** (2-3 days)
   - Test MediaRecorder API on mobile browsers
   - Add mobile-specific audio permissions
   - Test with Bluetooth headsets
   - Add mobile voice recording UI feedback

### Phase 1: Core Fitness Tracking (2-3 weeks)
**Goal:** Complete exercise and nutrition tracking foundation

4. **Voice Chat System** (1 week)
   - Implement Hebrew speech-to-text (Whisper integration)
   - Implement text-to-speech (Google TTS or Azure)
   - Add voice recording UI/UX improvements

5. **Nutrition Tracking** (1 week)
   - Build food database (Israeli foods with Hebrew names)
   - Create calorie/protein logging tools
   - Add nutrition stats retrieval
   - Create daily nutrition goals system

6. **Point System Documentation** (2-3 days)
   - Document all existing point formulas
   - Create point history table and API
   - Build point breakdown UI
   - Add modifier system (streaks, PRs, etc.)

### Phase 2: Gamification & Engagement (3-4 weeks)
**Goal:** Complete extensive gamification system

7. **Levels & XP System** (1 week)
   - Define level tiers and XP thresholds
   - Create XP calculation logic
   - Build level progression UI
   - Add level-up celebrations

8. **Achievements & Badges** (1 week)
   - Design achievement categories and milestones
   - Create achievements database schema
   - Implement achievement detection logic
   - Build achievement showcase UI

9. **Challenges System** (1 week)
   - Create daily/weekly/monthly challenges
   - Build challenge progress tracking
   - Add challenge completion detection
   - Create leaderboards (optional)

10. **Streaks System** (3-4 days)
    - Implement workout streak tracking
    - Add nutrition streak tracking
    - Create streak milestones and rewards
    - Build streak UI components

### Phase 3: Analytics & Visualization (2-3 weeks)
**Goal:** Complete data visualization and reporting

11. **Graphs & Charts** (1 week)
    - Implement exercise progression charts
    - Add nutrition tracking graphs
    - Create dashboard analytics view
    - Build muscle group breakdown charts

12. **Tables & History** (3-4 days)
    - Create exercise history table with filters
    - Build personal records table
    - Add workout summary table
    - Create points history table

13. **Export & Reports** (3-4 days)
    - Implement PDF report generation
    - Add CSV data export
    - Create monthly summary reports
    - (Optional) Add social sharing

### Phase 4: Polish & Production Prep (2-3 weeks)
**Goal:** Production-ready system with OAuth2, testing, monitoring

14. **OAuth2 Authentication** (1 week - TASK-82150)
    - Implement user registration/login
    - Add password reset flow
    - Email verification (optional)

15. **Testing & Quality** (1-2 weeks)
    - Backend test suite (TASK-13446)
    - Frontend test suite (TASK-90170)
    - E2E testing automation
    - Performance testing

16. **Production Infrastructure** (3-5 days)
    - CI/CD pipeline (TASK-61690)
    - Error monitoring (Sentry or similar)
    - Analytics tracking
    - Backup/recovery procedures

---

## 📋 Acceptance Criteria for Beta Launch

Once all features above are implemented, beta launch requires:

### Functional Requirements
- [x] Users can log exercises (text only, voice incomplete)
- [ ] Users can log exercises via voice (Hebrew STT + TTS)
- [ ] Users can log nutrition (calories and protein)
- [ ] Users can see their points with clear breakdown
- [ ] Users can earn achievements and badges
- [ ] Users can complete challenges
- [ ] Users can track streaks
- [ ] Users can level up and see progression
- [ ] Users can view graphs per exercise
- [ ] Users can export their data

### Technical Requirements
- [x] Backend API operational with secure AI proxy
- [ ] **App works perfectly on mobile devices (PWA)**
- [ ] OAuth2 authentication for user accounts
- [ ] Database backups automated
- [ ] Error monitoring active
- [ ] Performance meets benchmarks (TBD)
- [ ] Test coverage > 70% (backend and frontend)
- [ ] CI/CD pipeline operational

### UX Requirements
- [x] Hebrew UI with RTL support (desktop only)
- [ ] **Full mobile support (iOS + Android tested)**
- [ ] **PWA installable on home screen**
- [ ] Voice input and output working (desktop + mobile)
- [ ] Mobile-responsive design with touch optimization
- [ ] Smooth animations and transitions (60fps mobile)
- [ ] Clear onboarding flow
- [ ] Help documentation

---

## 🚀 Estimated Timeline

**Total Development Time:** 10-14 weeks (2.5-3.5 months)

- **Phase 0 (Mobile Foundation):** 1-2 weeks ← **START HERE**
- **Phase 1 (Core Fitness):** 2-3 weeks
- **Phase 2 (Gamification):** 3-4 weeks
- **Phase 3 (Analytics):** 2-3 weeks
- **Phase 4 (Production Prep):** 2-3 weeks

**Beta Launch Target:** ~14 weeks from now (Mid-January 2026)

---

## 📝 Next Steps

1. **Review this document** - Confirm these are the correct requirements
2. **Prioritize features** - Decide which are must-have vs. nice-to-have
3. **Choose next task** - Start with Phase 1 (Voice Chat or Nutrition Tracking?)
4. **Create detailed specs** - Break down each feature into specific tasks
5. **Begin development** - Start building toward beta launch

---

**Questions to Answer:**
1. Are these the complete requirements, or is anything missing?
2. Which feature should we start with? (Voice chat vs. nutrition tracking vs. gamification)
3. Are there any hard deadlines for beta launch?
4. Do you have specific performance benchmarks in mind?
5. Do you want leaderboards and social features, or is this purely personal tracking?

---

**Document Status:** 🟡 **DRAFT** - Awaiting your review and approval
