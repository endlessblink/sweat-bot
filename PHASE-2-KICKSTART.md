# 🚀 Points System v4.0 - Phase 2 Kickstart Prompt

**Use this prompt to start the next session:**

---

## 📋 **KICKSTART PROMPT FOR NEXT SESSION**

```
Continue Points System v4.0 - Phase 2: API Integration & Testing

CONTEXT:
Phase 1 is complete (49% of total project). I have:
✅ Database schema deployed (18 tables, 50 achievements, 13 exercises)
✅ Calculation engine built (formulas, bonuses, multipliers, fraud detection)
✅ Achievement system ready (JSON condition parser, NO eval!)
✅ Comprehensive PRD and E2E test plan
✅ All code committed (6 commits on branch: feature/points-system-v3-rebuild)

WHAT'S WORKING:
- Database: SELECT COUNT(*) FROM achievement_definition; returns 50
- Calculation Engine: backend/app/services/points_v4/engine.py (ready to use)
- Formulas: All 3 types (strength, cardio, core) implemented
- Models: backend/app/models/points_models_v4.py (SQLAlchemy)

REQUIRED READING BEFORE YOU START:
1. SESSION-SUMMARY-2025-10-12.md (complete Phase 1 context)
2. docs/main-docs/POINTS_SYSTEM_V4_PRD.md (Section 4.7: API specifications)
3. backend/app/services/points_v4/README.md (usage examples)
4. docs/testing/POINTS_V4_E2E_TEST_PLAN.md (15 test scenarios)

YOUR MISSION - PHASE 2 (22 tasks remaining):
Build the integration layer that connects the calculation engine to users:

PRIORITY 1: API Endpoints (Week 2)
- POST /v1/activities (log exercise, calculate points, save to DB)
- GET /v1/users/{id}/summary (stats with current level, streak, points)
- GET /v1/users/{id}/achievements (with progress bars and ETA)
- GET /v1/leaderboards (all scopes: all_time, weekly, monthly, friends)

PRIORITY 2: Unit Tests (Week 2)
- test_strength_formulas.py (edge cases: zero reps, 500kg weight)
- test_cardio_formulas.py (pace clamps 0.6-1.4, elevation bonuses)
- test_bonus_system.py (variety, overload, PR detection)
- test_multiplier_system.py (stacking, 1.25 global cap)
- test_fraud_detection.py (unrealistic values flagged)
- test_conditions.py (all 8 condition types)
Target: >90% coverage on calculation engine

PRIORITY 3: Event-Driven Architecture (Week 2-3)
- Setup Celery with Redis broker
- Define domain events (activity.logged, points.calculated, achievement.unlocked)
- Celery workers: update_stats, update_streak, check_achievements, refresh_leaderboards
- Event publisher to Redis queue

PRIORITY 4: Integration Tests (Week 3)
- test_api_activities.py (POST /v1/activities validates correctly)
- test_achievement_unlock.py (threshold triggers unlock)
- Verify database state after operations

PRIORITY 5: E2E Tests with Playwright (Week 3)
- Scenario 1: First-time user journey
- Scenario 4: Personal record tracking
- Scenario 5: Achievement progress bars
- Scenario 8: Fraud detection
- Scenario 15: Complete user flow
(Reference: docs/testing/POINTS_V4_E2E_TEST_PLAN.md for all 15 scenarios)

CRITICAL RULES (from CLAUDE.md):
1. NEVER claim functionality works without ACTUAL E2E TESTING
2. NO demo data - test with real user input only
3. Update Like I Said tasks as you progress
4. Use Doppler for all secrets: doppler run -- ...
5. Follow infrastructure-first debugging if issues arise

TECH STACK REMINDER:
- Backend: FastAPI (Python 3.11) on port 8000
- Database: PostgreSQL (port 8001), MongoDB (port 8002), Redis (port 8003)
- Frontend: Vite + React (port 8005)
- Testing: pytest (unit/integration) + Playwright MCP (E2E)
- Queue: Celery with Redis broker

EXAMPLE API ENDPOINT TO BUILD:
POST /v1/activities
Request:
{
  "exercise_key": "squat",
  "started_at": "2025-10-12T10:00:00Z",
  "ended_at": "2025-10-12T10:15:00Z",
  "metrics": {
    "sets": 3,
    "reps": [10, 8, 8],
    "weights": [50, 55, 55]
  }
}

Response:
{
  "activity_id": 12345,
  "points": {
    "total": 195,
    "breakdown": {
      "base_points": 150,
      "bonuses": {"set_completion": 6, "weight": 30},
      "multipliers": {"streak": 1.05, "total": 1.05}
    },
    "display_text": "You earned 195 points: 150 base + 36 bonuses × 1.05 streak"
  },
  "streak": {"current": 8, "best": 22},
  "achievements_unlocked": [
    {"key": "first_workout", "name_en": "First Steps", "points_reward": 25}
  ]
}

HOW TO USE THE CALCULATION ENGINE:
from app.services.points_v4.engine import PointsEngine

result = await PointsEngine.calculate_activity_points(
    user_id="uuid",
    exercise_key="squat",
    activity_data={"sets": 3, "reps": [10,8,8], "weights": [50,55,55]},
    user_context={"streak_days": 8}
)

# Save to database
calculation = PointsCalculation(
    activity_id=activity.id,
    user_id=user_id,
    exercise_type_id=exercise_type_id,
    base_points=result.breakdown.base_points,
    bonus_points=sum(result.breakdown bonuses),
    multiplier=result.breakdown.total_multiplier,
    breakdown_json=PointsEngine.generate_breakdown_json(result)
)
db.add(calculation)
await db.commit()

DATABASE VERIFICATION BEFORE YOU START:
Run these to confirm Phase 1 is deployed:
```
psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness
SELECT COUNT(*) FROM exercise_type;           -- Should return 13
SELECT COUNT(*) FROM achievement_definition;  -- Should return 50
SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'activity_%';  -- Should return 4
\q
```

TESTING REQUIREMENTS:
- Write unit tests ALONGSIDE implementation (not after!)
- Use pytest with async support
- Test edge cases: zero reps, massive weights, unrealistic paces
- Verify fraud detection flags correctly
- E2E tests use Playwright MCP with real browser
- Take screenshots and save to docs/screenshots-debug/points-v4-tests/

SUCCESS CRITERIA FOR PHASE 2:
✅ API endpoints implemented and tested
✅ >90% test coverage on calculation engine
✅ Celery workers processing events asynchronously
✅ At least 5 E2E scenarios passing with Playwright
✅ No eval() anywhere (maintain security)
✅ Performance: <50ms point calculations verified

BLOCKED BY:
- Nothing! Foundation is solid, ready to build on

IMPORTANT FILES:
- PRD: docs/main-docs/POINTS_SYSTEM_V4_PRD.md
- Engine: backend/app/services/points_v4/engine.py
- Models: backend/app/models/points_models_v4.py
- Test Plan: docs/testing/POINTS_V4_E2E_TEST_PLAN.md
- Summary: SESSION-SUMMARY-2025-10-12.md

START WITH:
1. Read SESSION-SUMMARY-2025-10-12.md for full context
2. Verify database schema deployed (run SQL queries above)
3. Create first API endpoint: POST /v1/activities
4. Write unit tests for StrengthFormulaCalculator
5. Test end-to-end with Playwright MCP

Let's build the API layer and comprehensive tests! 🚀
```

---

## 🎯 **Copy-Paste Prompt for Next Session**

**When starting next session, simply paste:**

```
Continue Points System v4.0 - Phase 2: API Integration & Testing

Phase 1 complete (49%). Read SESSION-SUMMARY-2025-10-12.md first, then:
1. Verify database: SELECT COUNT(*) FROM achievement_definition; (expect 50)
2. Build POST /v1/activities endpoint using PointsEngine
3. Write unit tests alongside (target >90% coverage)
4. Test with Playwright MCP (NO demo data, real inputs only)

Reference:
- PRD: docs/main-docs/POINTS_SYSTEM_V4_PRD.md (Section 4.7 for API specs)
- Engine: backend/app/services/points_v4/engine.py (import PointsEngine)
- Tests: docs/testing/POINTS_V4_E2E_TEST_PLAN.md (15 scenarios)

Goal: API endpoints + comprehensive tests + Celery workers
Timeline: 2-3 sessions to complete Phase 2
```

---

## 📊 **Quick Reference**

**What's Done** (21 tasks):
- Database, formulas, bonuses, multipliers, fraud detection, JSON parser, achievement tracker

**What's Next** (22 tasks):
- API endpoints, Celery workers, Redis leaderboards, tests (unit/integration/E2E), docs, admin UI

**Files to Know**:
- `backend/app/services/points_v4/engine.py` - Main calculation entry point
- `docs/main-docs/POINTS_SYSTEM_V4_PRD.md` - Complete specification
- `docs/testing/POINTS_V4_E2E_TEST_PLAN.md` - Testing strategy

---

**This dropoff ensures smooth handoff with all context preserved! 🎯**
