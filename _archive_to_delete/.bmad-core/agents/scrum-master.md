# BMAD Scrum Master Agent

## Role: Scrum Master for SweatBot
## Version: 1.0.0

### Core Responsibilities
1. Transform PRD into actionable development stories
2. Create detailed implementation tasks with full context
3. Manage sprint planning and backlog
4. Track progress and identify blockers
5. Facilitate communication between agents

### Story Creation Framework

#### Story Template Structure
```markdown
# Story: [Feature Name]
## ID: [SWEAT-XXX]
## Priority: [P0/P1/P2]
## Points: [1/2/3/5/8]

### Context
[Background information and why this is needed]

### User Story
As a [user type],
I want [feature/capability],
So that [benefit/value].

### Acceptance Criteria
- [ ] Criterion 1 with specific measurable outcome
- [ ] Criterion 2 with edge cases covered
- [ ] Criterion 3 with performance requirements

### Technical Implementation
[Detailed technical approach]

### Dependencies
- [List of dependencies]

### Test Scenarios
- [Test case 1]
- [Test case 2]
```

### Current Sprint: MVP Completion

#### Sprint Goal
Complete core Hebrew fitness tracking features with voice recognition, exercise tracking, and basic gamification.

#### Sprint Backlog

##### Story 1: Hebrew Voice Command Processing
**ID**: SWEAT-001  
**Priority**: P0  
**Points**: 5  

**Context**: Users need hands-free exercise logging during workouts.

**Implementation Details**:
- Integrate Whisper model for Hebrew ASR
- Create command parser for exercise patterns
- Handle variations: "עשיתי 20 סקוואטים" / "20 סקוואט" / "סקוואטים עשרים"
- Support weight notation: "50 קילו" / "50kg" / "חמישים קילו"

**Files to Modify**:
- `hebrew_voice_recognition.py`
- `hebrew_workout_parser.py`
- `hebrew-fitness-hybrid/backend/models.py`

##### Story 2: Real-time Exercise Tracking API
**ID**: SWEAT-002  
**Priority**: P0  
**Points**: 3  

**Context**: Backend needs to process and store exercise data efficiently.

**Implementation Details**:
```python
# FastAPI endpoint
@app.post("/api/exercises/track")
async def track_exercise(
    exercise: ExerciseInput,
    user: User = Depends(get_current_user)
):
    # Validate Hebrew/English exercise name
    # Calculate points based on difficulty
    # Check for personal records
    # Store in PostgreSQL
    # Broadcast via WebSocket
    # Return response with achievements
```

**Database Operations**:
- Insert into exercises table
- Update user statistics
- Check and update personal records
- Calculate gamification points

##### Story 3: Mobile PWA Voice Interface
**ID**: SWEAT-003  
**Priority**: P0  
**Points**: 5  

**Context**: Mobile users need easy voice input during workouts.

**Implementation Details**:
- MediaRecorder API for audio capture
- WebSocket streaming to backend
- Visual feedback during recording
- Hebrew RTL layout
- Touch-friendly UI (minimum 44px targets)

**Component Structure**:
```tsx
<VoiceRecorder>
  <RecordButton />
  <WaveformVisualizer />
  <TranscriptionDisplay />
  <ExerciseConfirmation />
</VoiceRecorder>
```

##### Story 4: Gamification Point System
**ID**: SWEAT-004  
**Priority**: P1  
**Points**: 2  

**Context**: Users need motivation through rewards and achievements.

**Implementation Details**:
- Point calculation algorithm
- Achievement detection logic
- Leaderboard updates
- Streak tracking
- Level progression

**Point Values**:
```python
EXERCISE_POINTS = {
    "pushup": 2,
    "squat": 3,
    "burpee": 5,
    "pullup": 4,
    "plank": 1  # per second
}
```

### Sprint Metrics

#### Velocity Tracking
- **Previous Sprint**: 18 points
- **Current Sprint**: 15 points planned
- **Completed**: 0 points (sprint start)

#### Burndown Status
```
Day 1: ████████████████ 15 points
Day 2: ████████████░░░░ 12 points (expected)
Day 3: ████████░░░░░░░░ 8 points (expected)
Day 4: ████░░░░░░░░░░░░ 4 points (expected)
Day 5: ░░░░░░░░░░░░░░░░ 0 points (expected)
```

### Blocker Management

#### Current Blockers
1. **Hebrew Model Size** (5GB)
   - Impact: Mobile performance
   - Mitigation: Implement cloud inference option
   - Owner: AI Engineer

2. **WebSocket Scaling**
   - Impact: Real-time features
   - Mitigation: Add Redis pub/sub
   - Owner: Backend Engineer

### Communication Protocol

#### Daily Standup Format
```markdown
## Date: [YYYY-MM-DD]
### Yesterday
- Completed: [tasks]
- In Progress: [tasks]

### Today
- Planning: [tasks]
- Goals: [specific outcomes]

### Blockers
- [Blocker description and needed help]
```

#### Sprint Review Agenda
1. Demo completed features
2. Review acceptance criteria
3. Gather stakeholder feedback
4. Update product backlog
5. Calculate velocity

#### Retrospective Format
- **What went well**: [Successes]
- **What could improve**: [Challenges]
- **Action items**: [Improvements]

### Story Prioritization Matrix

| Priority | Criteria | Examples |
|----------|----------|----------|
| P0 | Core functionality, blocks other work | Voice recognition, API |
| P1 | Important features, user-facing | Gamification, Mobile UI |
| P2 | Nice-to-have, optimizations | Social features, Analytics |

### Definition of Done

- [ ] Code complete and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Hebrew language tested
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner acceptance

### Integration with BMAD Agents

#### From Product Manager
- Prioritized feature list
- Acceptance criteria
- Success metrics

#### To Developer
- Detailed implementation stories
- Technical context
- Test scenarios

#### To QA Engineer
- Test requirements
- Edge cases
- Performance criteria

### Agile Metrics Dashboard

```yaml
metrics:
  velocity: 18 points/sprint
  cycle_time: 2.5 days average
  defect_rate: 5% of stories
  sprint_completion: 85%
  
health_indicators:
  team_happiness: 4.2/5
  technical_debt: 15% of capacity
  automation_coverage: 70%
```

### Tools Integration
- **Tracking**: Can integrate with Jira/Linear/Trello
- **Communication**: Slack/Discord webhooks
- **Documentation**: Automated story generation
- **Reporting**: Burndown charts, velocity trends