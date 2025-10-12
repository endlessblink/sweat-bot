# Points System v4.0 - E2E Test Plan

**Purpose**: End-to-end testing strategy for Points System v4.0
**Tools**: Playwright MCP + pytest + real database
**Status**: 📋 Planning Phase
**Priority**: P0 (Critical - No deployment without tests)

---

## 🎯 Testing Philosophy

**From CLAUDE.md**:
> "NEVER claim functionality works without ACTUAL E2E TESTING"
> "Test with real data (NO demo data)"
> "Verify responses are NOT hardcoded (test multiple times)"

**Our Approach:**
1. **Real Database**: Use PostgreSQL with v4 schema
2. **Real Backend**: FastAPI with v4 calculation engine
3. **Real Frontend**: Vite + React (when integrated)
4. **Playwright MCP**: Browser automation for user flows
5. **Clean Data**: Reset database before each test suite

---

## 🧪 Test Scenarios (15 total)

### **Scenario 1: First-Time User Journey** 🟢 CRITICAL
**User Story**: New user logs first exercise, earns points, unlocks achievement

**Steps:**
1. Navigate to http://localhost:8005
2. Register new user (`test_user_001`)
3. Log exercise via chat: "I did 10 squats"
4. Wait for AI response
5. Verify points earned message shown
6. Verify "First Steps" achievement unlocked (25 points)
7. Navigate to achievements page
8. Verify achievement badge displayed
9. Take screenshot: `first-user-journey.png`

**Expected Results:**
- Points: ~12-15 (base + set bonus)
- Achievement: "First Steps" unlocked
- Progress bar: Other achievements show 10-25% progress
- Display text: "You earned X points: Y base + Z bonuses"

**Pass Criteria:**
- ✅ Points calculated correctly
- ✅ Achievement unlocked
- ✅ Breakdown shown to user
- ✅ No hardcoded responses (run twice, different values)

---

### **Scenario 2: Streak Building** 🟡 HIGH
**User Story**: User builds streak over 7 days, unlocks streak achievement

**Steps:**
1. Day 1: Log exercise → verify 0-day streak (no multiplier)
2. Day 2: Log exercise → verify 1-day streak (no multiplier yet)
3. Day 3: Log exercise → verify 3-day streak (1.02x multiplier)
4. Day 4-7: Log exercises → verify streak increments
5. Day 7: Verify "Week Warrior" achievement unlocked (30 points)
6. Check streak multiplier applied (1.05x for 7 days)

**Expected Results:**
- Day 1-2: Points × 1.00 (no multiplier)
- Day 3-6: Points × 1.02 (3-6 day streak)
- Day 7: Points × 1.05 (7-day streak) + achievement unlock

**Pass Criteria:**
- ✅ Streak increments daily
- ✅ Multipliers apply correctly
- ✅ Achievement unlocks at day 7
- ✅ Grace period system works (test missing one day)

---

### **Scenario 3: Progressive Overload Detection** 🟡 HIGH
**User Story**: User gradually increases weight, earns overload bonus

**Steps:**
1. Week 1-4: Log squats at 40kg (establish baseline)
2. Week 5: Log squats at 50kg
3. Verify progressive overload bonus applied (+10%)
4. Check breakdown shows "Volume +25% vs 4-week avg"

**Expected Results:**
- Weeks 1-4: No overload bonus
- Week 5: +10% bonus (base = 120, bonus = 12)
- Display text mentions overload

**Pass Criteria:**
- ✅ 4-week average calculated correctly
- ✅ Bonus triggers when volume > average
- ✅ Percentage shown in breakdown
- ✅ No bonus when volume same/lower

---

### **Scenario 4: Personal Record Tracking** 🟢 CRITICAL
**User Story**: User beats previous best, unlocks PR achievement

**Steps:**
1. Log 3×5 @ 80kg squat (establishes 1RM ~92kg)
2. Log 3×5 @ 90kg squat (new 1RM ~103kg)
3. Verify PR bonus applied (+15 points)
4. Verify "First PR" achievement unlocked (30 points)
5. Check user_personal_record table updated

**Expected Results:**
- First log: No PR bonus
- Second log: +15 PR bonus
- Achievement: "first_pr" unlocked
- Database: user_personal_record row created

**Pass Criteria:**
- ✅ 1RM estimated correctly (Epley formula)
- ✅ PR detected when 1RM improves
- ✅ Achievement unlocks
- ✅ PR tracked in database

---

### **Scenario 5: Achievement Progress Bars** 🟢 CRITICAL
**User Story**: User sees progress toward next achievement

**Steps:**
1. Log 50km running (over multiple sessions)
2. Navigate to achievements page
3. Verify "Century Runner" (100km) shows:
   - Progress: 50.0 / 100.0 km
   - Percentage: 50%
   - ETA: Based on recent pace
4. Log another 10km
5. Refresh → verify progress updated to 60%

**Expected Results:**
- Progress bar updates in real-time
- Percentage accurate
- ETA calculation reasonable
- Multiple achievements shown

**Pass Criteria:**
- ✅ Progress value correct
- ✅ Percentage matches calculation
- ✅ ETA based on 14-day trend
- ✅ Progress updates after new activity

---

### **Scenario 6: Variety Bonus** 🟡 HIGH
**User Story**: User logs 3 different exercises in one day

**Steps:**
1. Log squat (strength)
2. Log running (cardio)
3. Log plank (core)
4. Verify 3rd exercise gets +5 variety bonus
5. Check breakdown shows "3 different exercises today"

**Expected Results:**
- Exercise 1-2: No variety bonus
- Exercise 3: +5 variety bonus
- Display text mentions variety

**Pass Criteria:**
- ✅ Bonus triggers on 3rd unique exercise
- ✅ Bonus applies to all subsequent exercises same day
- ✅ Resets next day

---

### **Scenario 7: Multiplier Stacking & Cap** 🟡 HIGH
**User Story**: Multiple multipliers stack then cap at 1.25

**Steps:**
1. Achieve 14-day streak (1.10x)
2. Join 2 active challenges (1.05x each = 1.1025x)
3. During seasonal event (1.08x)
4. Log exercise
5. Verify total multiplier capped at 1.25 (not 1.31x)

**Expected Results:**
- Individual mults: 1.10 × 1.1025 × 1.08 = 1.308
- Capped: 1.25
- Display: "× 1.25 streak+challenge+seasonal (capped)"

**Pass Criteria:**
- ✅ Multipliers stack correctly
- ✅ Global cap applied at 1.25
- ✅ Warning shown when capped
- ✅ Breakdown lists all multipliers

---

### **Scenario 8: Fraud Detection - Unrealistic Values** 🔴 CRITICAL
**User Story**: User enters absurd values, system flags activity

**Steps:**
1. Try to log: 1000kg squat
2. Verify system flags as "unrealistic weight"
3. Try to log: 5km run in 600 seconds (2:00/km pace)
4. Verify system flags as "unrealistic pace"
5. Check is_valid = false, activity not counted

**Expected Results:**
- Activity flagged, not processed
- Clear error message to user
- Not counted in stats or leaderboards
- Logged for admin review

**Pass Criteria:**
- ✅ Weight > 500kg flagged
- ✅ Pace < 2:30/km flagged
- ✅ User sees error, not points
- ✅ Activity marked is_valid=false

---

### **Scenario 9: Soft Cap Application** 🟡 HIGH
**User Story**: High-volume workout hits soft cap

**Steps:**
1. Log massive workout: 10×20 @ 100kg squat
2. Calculate: base = 0.1 × 100 × 200 = 2000
3. Verify soft cap at 250 applies
4. Excess = 2000 - 250 = 1750
5. Reduced: 1750 × 0.5 = 875
6. Final: 250 + 875 = 1125 (then hard cap at 350)

**Expected Results:**
- Base: 2000
- After soft cap: 350 (hard capped)
- Warning: "Soft cap applied: reduced 1775 points"
- Display shows cap message

**Pass Criteria:**
- ✅ Soft cap applies at threshold
- ✅ Hard cap prevents abuse
- ✅ Warning shown to user
- ✅ Breakdown explains reduction

---

### **Scenario 10: Leaderboard Ranking** 🟢 CRITICAL
**User Story**: User earns points, appears in leaderboard

**Steps:**
1. Create 5 test users
2. Each logs different point totals
3. Navigate to leaderboard page
4. Verify users ranked by points (descending)
5. Verify current user highlighted
6. Check weekly leaderboard shows this week only

**Expected Results:**
- Users ranked correctly
- Points displayed accurately
- Current user highlighted
- Weekly vs all-time scopes work

**Pass Criteria:**
- ✅ Rankings correct
- ✅ Points match calculations
- ✅ Scopes filter properly
- ✅ Real-time updates (within 60s)

---

### **Scenario 11: Early Bird / Night Owl Bonuses** 🟢 MEDIUM
**User Story**: Time-of-day bonuses apply correctly

**Steps:**
1. Set system time to 6:30 AM
2. Log exercise
3. Verify +10 early bird bonus
4. Set system time to 10:30 PM
5. Log exercise
6. Verify +10 night owl bonus

**Expected Results:**
- Before 7 AM: +10 early bird
- After 10 PM: +10 night owl
- Between: no time bonus

**Pass Criteria:**
- ✅ Time checked correctly
- ✅ Bonus applied at right times
- ✅ Achievement "early_bird" unlocks

---

### **Scenario 12: Duplicate Activity Detection** 🔴 CRITICAL
**User Story**: User tries to log same activity twice

**Steps:**
1. Log 5km run (6:00-6:30 AM)
2. Try to log 5km run (6:00-6:30 AM) again
3. Verify duplicate detected
4. Try to log overlapping run (6:15-6:45 AM)
5. Verify overlap detected

**Expected Results:**
- Exact duplicate: Rejected
- Overlapping: Rejected
- Clear error message
- Original activity preserved

**Pass Criteria:**
- ✅ Exact duplicates blocked
- ✅ Overlaps detected
- ✅ User notified clearly
- ✅ No double-counting

---

### **Scenario 13: Multi-Exercise Bulk Calculation** 🟡 HIGH
**User Story**: User logs entire workout at once

**Steps:**
1. Submit bulk request:
   - 3×10 squats @ 50kg
   - 5km run
   - 2min plank
2. Verify all 3 calculated correctly
3. Verify variety bonus applied
4. Check total points = sum of all
5. Verify all saved to database

**Expected Results:**
- Squat: ~186 points
- Run: ~230 points
- Plank: ~22 points
- Variety bonus: +5 on each
- Total: ~453 points

**Pass Criteria:**
- ✅ All exercises calculated
- ✅ Variety bonus applies
- ✅ Total correct
- ✅ All in database

---

### **Scenario 14: Achievement Unlock Notification** 🟢 CRITICAL
**User Story**: User unlocks achievement mid-workout

**Steps:**
1. User at 99km running total
2. Log 2km run
3. Verify:
   - Points calculated
   - "Century Runner" unlocks
   - Toast notification shown
   - +75 reward points added
4. Navigate to achievements
5. Verify badge shows "unlocked" with timestamp

**Expected Results:**
- Achievement unlocks at threshold
- Notification immediate
- Reward points added to total
- Progress bar shows 100%

**Pass Criteria:**
- ✅ Unlock triggers at exact threshold
- ✅ User notified immediately
- ✅ Reward points counted
- ✅ Can't unlock twice

---

### **Scenario 15: Complete User Flow (Full E2E)** 🔴 CRITICAL
**User Story**: New user → regular user → achievement unlocks → leaderboard

**Steps:**
1. **Day 1**: Register → log first workout → "First Steps" achievement
2. **Day 2-3**: Build streak → variety bonus → "Consistency Start" (3d streak)
3. **Day 7**: Hit 7-day streak → "Week Warrior" achievement
4. **Day 14**: Log 100th km → "Century Runner" achievement
5. **Check Leaderboard**: User appears in rankings
6. **Add Friend**: Check friends leaderboard
7. **Join Challenge**: Verify challenge multiplier applies
8. **Complete Challenge**: Unlock "Challenge Accepted"

**Expected Results:**
- 8 achievements unlocked over journey
- 1000+ total points earned
- Leaderboard rank assigned
- Friends system working
- Challenge progress tracked

**Pass Criteria:**
- ✅ All achievements unlock correctly
- ✅ Points accumulate properly
- ✅ Leaderboard updates
- ✅ Social features functional
- ✅ NO demo data, all real user input

---

## 🛠️ Test Infrastructure

### **Setup Requirements**
```bash
# 1. Reset database to clean state
python backend/scripts/reset_all_data.py

# 2. Run v4 migrations
psql -f backend/migrations/001_points_v4_complete_schema.sql
psql -f backend/migrations/002_seed_exercise_types.sql
psql -f backend/migrations/003_seed_achievements.sql

# 3. Start backend with Doppler
cd backend && doppler run -- python -m uvicorn app.main:app --port 8000

# 4. Start frontend
cd personal-ui-vite && doppler run -- npm run dev

# 5. Run Playwright tests
pytest tests/e2e/test_points_v4_complete_flow.py --headed
```

### **Test Data**
```python
# Test users (created programmatically)
test_users = [
    {"username": "test_beginner", "level": 0, "points": 0},
    {"username": "test_intermediate", "level": 15, "points": 5000},
    {"username": "test_advanced", "level": 35, "points": 25000}
]

# Test exercises (realistic values)
test_exercises = {
    "beginner_squat": {"sets": 1, "reps": [10], "weights": [0]},  # Bodyweight
    "intermediate_squat": {"sets": 3, "reps": [10, 8, 8], "weights": [50, 55, 55]},
    "advanced_deadlift": {"sets": 5, "reps": [5, 5, 5, 5, 5], "weights": [100, 110, 120, 120, 125]},
    "cardio_run_5k": {"distance_km": 5.0, "duration_sec": 1650, "elevation_gain_m": 50},
    "core_plank": {"duration_sec": 120}
}
```

### **Validation Helpers**
```python
async def verify_points_calculation(
    expected_min: int,
    expected_max: int,
    actual: int,
    breakdown: Dict
):
    """Verify points in reasonable range"""
    assert expected_min <= actual <= expected_max, \
        f"Points {actual} outside range [{expected_min}, {expected_max}]"

    # Verify breakdown components sum correctly
    total_from_breakdown = (
        breakdown["base_points"] +
        sum(breakdown["bonuses"].values())
    ) * breakdown["multipliers"]["total"]

    assert abs(total_from_breakdown - actual) < 2, \
        "Breakdown doesn't match total"
```

---

## 📊 Test Coverage Goals

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| **Formulas** | 100% | 0% | ⏳ Pending |
| **Bonuses** | 100% | 0% | ⏳ Pending |
| **Multipliers** | 100% | 0% | ⏳ Pending |
| **Fraud Detection** | 100% | 0% | ⏳ Pending |
| **Conditions** | 100% | 0% | ⏳ Pending |
| **Achievements** | 90% | 0% | ⏳ Pending |
| **API Endpoints** | 80% | 0% | ⏳ Pending |
| **E2E Flows** | 5 scenarios | 0 | ⏳ Pending |

**Overall Target**: >90% coverage on calculation engine

---

## 🏃 Test Execution Plan

### **Phase 1: Unit Tests** (Week 2)
```bash
# Run all unit tests
pytest tests/unit/points_v4/ -v

# Expected output:
# test_strength_formulas.py::test_basic_squat PASSED
# test_strength_formulas.py::test_progressive_overload PASSED
# test_strength_formulas.py::test_pr_detection PASSED
# test_cardio_formulas.py::test_running_pace_factor PASSED
# test_cardio_formulas.py::test_elevation_bonus PASSED
# test_bonus_system.py::test_variety_bonus PASSED
# test_multiplier_system.py::test_streak_tiers PASSED
# test_multiplier_system.py::test_global_cap PASSED
# test_fraud_detection.py::test_unrealistic_weight PASSED
# test_fraud_detection.py::test_unrealistic_pace PASSED
# test_conditions.py::test_sum_condition PASSED
# test_conditions.py::test_streak_condition PASSED
#
# ========== 47 passed in 2.34s ==========
```

### **Phase 2: Integration Tests** (Week 2-3)
```bash
# Test API endpoints
pytest tests/integration/test_api_points_v4.py -v

# Expected:
# test_log_strength_activity PASSED
# test_log_cardio_activity PASSED
# test_achievement_unlock_flow PASSED
# test_leaderboard_update PASSED
#
# ========== 23 passed in 8.12s ==========
```

### **Phase 3: E2E Tests** (Week 3)
```bash
# Full user flows with Playwright
pytest tests/e2e/test_points_v4_flows.py --headed

# Runs all 15 scenarios
# Takes screenshots at key points
# Saves to docs/screenshots-debug/points-v4-tests/
#
# ========== 15 passed in 124.56s ==========
```

---

## 📸 Screenshot Checklist

**Required Screenshots** (saved to `docs/screenshots-debug/points-v4-tests/`):
1. `01-first-workout-points.png` - First exercise logged, points shown
2. `02-achievement-unlocked-toast.png` - Achievement notification
3. `03-achievement-progress-bars.png` - Progress toward locked achievements
4. `04-breakdown-transparency.png` - Complete point breakdown
5. `05-leaderboard-with-user.png` - User in leaderboard rankings
6. `06-streak-multiplier-applied.png` - Streak bonus showing
7. `07-variety-bonus.png` - 3 exercises, variety bonus active
8. `08-pr-detection.png` - PR detected, bonus applied
9. `09-fraud-flagged.png` - Unrealistic value flagged
10. `10-complete-flow.png` - Final state after all tests

---

## ⚠️ Common Test Failures & Solutions

### **Issue 1: "Points don't match expected"**
**Cause**: Multipliers or bonuses not accounted for
**Solution**: Check user_context for streak, challenges
**Fix**: Always pass complete context in tests

### **Issue 2: "Achievement not unlocking"**
**Cause**: Progress value not reaching threshold exactly
**Solution**: Check floating point precision
**Fix**: Use `>=` not `>` in conditions

### **Issue 3: "Leaderboard not updating"**
**Cause**: Redis cache stale or job queue delayed
**Solution**: Wait for async workers to complete
**Fix**: Add `await asyncio.sleep(2)` after activity log

### **Issue 4: "Breakdown JSON missing fields"**
**Cause**: Not all bonuses/multipliers included
**Solution**: Check engine.generate_breakdown_json()
**Fix**: Ensure all fields populated, use defaults

---

## ✅ **Definition of Done**

A test scenario is **PASSED** when:
1. ✅ All assertions pass
2. ✅ Screenshot saved (for visual verification)
3. ✅ Database state correct (verify with queries)
4. ✅ No console errors (check browser console)
5. ✅ Can repeat test (deterministic)

A test suite is **COMPLETE** when:
1. ✅ All scenarios pass
2. ✅ Edge cases covered
3. ✅ Error cases tested
4. ✅ Performance acceptable (<50ms for calcs)
5. ✅ Documentation updated

The **SYSTEM IS PRODUCTION-READY** when:
1. ✅ >90% test coverage on calculation engine
2. ✅ All 15 E2E scenarios pass
3. ✅ Load testing confirms 10K concurrent users
4. ✅ Zero eval() security risks verified
5. ✅ User documentation complete

---

**Test Plan Version**: 1.0
**Created**: October 12, 2025
**Status**: 📋 Ready for Implementation
**Next**: Write unit tests (Week 2)
