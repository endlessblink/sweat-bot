# Product Requirements Document: Points System v4.0

**Project**: SweatBot
**Feature**: Gamification & Points System v4.0 (Complete Rebuild)
**Status**: 📋 Planning
**Priority**: P0 (Critical - Current system broken)
**Target Release**: Q1 2026
**Owner**: Engineering Team
**Last Updated**: October 12, 2025

---

## Executive Summary

SweatBot's current points system (v3) is fundamentally broken with 3 conflicting implementations, missing metrics for achievements, security vulnerabilities (eval()), poor UX, and zero testing. This PRD outlines a complete rebuild (v4.0) based on industry best practices from Strava, Fitbit, Duolingo, and Nike Run Club.

**Success Metrics**:
- **User Trust**: 100% calculation transparency with breakdown explanations
- **Performance**: <50ms point calculations, <100ms leaderboard queries
- **Engagement**: 40% increase in daily active users through achievements
- **Technical**: >90% test coverage, zero eval() security risks
- **Scale**: Handle 10,000+ concurrent users

---

## 1. Problem Statement

### 1.1 Current State (v3 System)

**Critical Issues**:
1. **Architecture Chaos**: 3 different implementations (Python v1, v2, v3) produce different points for same exercises
2. **Missing Data Model**: Achievements require metrics (`max_reps`, `total_distance`, `current_streak`) that aren't tracked
3. **Security Vulnerability**: Using Python `eval()` for rule conditions
4. **Poor Gamification Design**: Arbitrary point values (sit-up=5pts, running=50pts) with no rationale
5. **Zero Testing**: No unit, integration, or E2E tests despite "production ready" claims
6. **Performance Issues**: JSONB aggregations, no caching, manual view refreshes
7. **Frontend Disconnect**: exerciseLogger tool may still use old hardcoded calculations

### 1.2 User Impact

**Frustrations**:
- "Why did I get 397 points?" - No transparency
- "I logged same exercise twice, got different points" - Inconsistency
- "Achievement progress stuck at 60%" - Broken tracking
- "My friend has more points for less work" - Unfair calculations
- "Leaderboard never updates" - Performance issues

**Business Impact**:
- Low engagement: Users abandon app after 1-2 weeks
- No monetization path: Can't charge for broken system
- Poor retention: Gamification should drive habit formation, currently drives churn
- Reputation risk: "SweatBot points are broken" in app store reviews

### 1.3 Root Causes

1. **No clear design philosophy**: Points assigned arbitrarily without formula rationale
2. **Technical debt**: Multiple rewrites without deprecating old code
3. **Lack of testing**: Features deployed without validation
4. **Missing product requirements**: Built without understanding what makes gamification work

---

## 2. Goals & Success Criteria

### 2.1 User Goals

**Primary Goals**:
1. **Understand**: "Why did I earn X points?" with clear breakdown
2. **Progress**: See progress toward next achievement with ETA
3. **Compete**: Compare with friends on fair, real-time leaderboards
4. **Achieve**: Unlock meaningful milestones that recognize effort

**Secondary Goals**:
5. **Discover**: Find new exercises and challenges
6. **Collaborate**: Join teams and complete group challenges
7. **Celebrate**: Share achievements and PRs

### 2.2 Business Goals

1. **Engagement**: Increase DAU by 40% through better gamification
2. **Retention**: Improve 30-day retention from 25% to 60%
3. **Monetization**: Enable premium tiers (leaderboard boosts, exclusive achievements)
4. **Scale**: Support 10K+ concurrent users without performance degradation
5. **Trust**: Achieve 4.5+ star rating with "fair points" as top positive review theme

### 2.3 Technical Goals

1. **Performance**: <50ms point calculations, <100ms leaderboard queries
2. **Reliability**: 99.9% uptime for points calculation service
3. **Security**: Zero eval() or code injection risks
4. **Scalability**: Event-driven architecture supporting horizontal scaling
5. **Maintainability**: Add new exercises/achievements without code changes
6. **Quality**: >90% test coverage on calculation engine

### 2.4 Success Metrics

**Quantitative**:
| Metric | Current (v3) | Target (v4) | Measurement |
|--------|-------------|-------------|-------------|
| Point calculation time | ~200ms | <50ms | p95 latency |
| Leaderboard query time | ~500ms | <100ms | p95 latency |
| Achievement unlock rate | 15% | 60% | % users with ≥1 achievement |
| Daily active users | 1,000 | 1,400 | +40% |
| 30-day retention | 25% | 60% | Cohort analysis |
| API error rate | 5% | <0.1% | Error logs |
| Test coverage | 0% | >90% | pytest/jest |

**Qualitative**:
- User feedback: "I finally understand how points work!"
- App store reviews: "Fair and motivating" vs "points are broken"
- Support tickets: 80% reduction in "wrong points" complaints

---

## 3. Solution Overview

### 3.1 Design Principles

1. **Fairness**: Same exercise = same points, always
2. **Transparency**: Show complete breakdown for every calculation
3. **Scientific**: Formulas based on measurable work (force × distance, energy expenditure)
4. **Progressive**: Easy early wins, sustained challenges, elite long-term goals
5. **Social**: Cooperative and competitive features balanced
6. **Secure**: Declarative rules, zero code execution
7. **Tested**: Comprehensive test coverage before production

### 3.2 Gamification Psychology

**Motivation Framework** (Self-Determination Theory):
- **Competence**: Clear progression (beginner → elite), PR tracking
- **Autonomy**: Choose exercises, set personal goals
- **Relatedness**: Team challenges, friend leaderboards

**Reward Cadence**:
- **Immediate**: Points earned instantly with breakdown
- **Daily**: Streak increments, daily goal completion
- **Weekly**: League placement, team challenge contributions
- **Monthly**: Tier badges (Bronze/Silver/Gold)
- **Lifetime**: Milestone achievements (1K points, 100km run)

**Reference Systems**:
- **Strava**: Segments, KOMs, monthly challenges
- **Fitbit**: Badges, lifetime stats, zone-based rewards
- **Duolingo**: XP, streaks, leagues, transparent formulas
- **Nike Run Club**: Trophies, guided challenges, PRs

### 3.3 Architecture Overview

```
EVENT-DRIVEN FLOW:

User logs exercise
    ↓ (sync, <50ms)
Calculate points deterministically
    ↓
Return breakdown JSON + total
    ↓
Publish event → Redis Queue (Celery)
                    ↓
            [Async Workers]
            ├── Update daily stats
            ├── Update streak (with grace)
            ├── Check achievements
            ├── Refresh leaderboards
            └── Detect anomalies
                    ↓
            WebSocket push notifications
                    ↓
            User sees: "Achievement Unlocked!"
```

**Tech Stack**:
- **API**: FastAPI (Python 3.11) with Pydantic validation
- **Database**: PostgreSQL 15 (normalized schema with proper indexes)
- **Cache**: Redis 7 (leaderboards, summaries, achievement progress)
- **Queue**: Celery with Redis broker
- **Real-time**: FastAPI WebSocket for live updates
- **Testing**: pytest (unit), pytest-asyncio (integration), Playwright (E2E)

---

## 4. Detailed Requirements

### 4.1 Point Calculation System

#### 4.1.1 Formula Design

**Strength Exercises** (squat, push_up, pull_up, deadlift, bench_press, rope_climb):
```
base = Σ over sets (weight_factor × weight_kg × reps)
     + bodyweight_factor × reps (for bodyweight exercises)

bonuses:
- set_completion: +2 per set with reps ≥ 5
- progressive_overload: +10% if volume > 4-week average
- variety: +5 if 3+ different exercises in one day
- PR: +15 when improving estimated 1RM
- RPE: +1 per set for RPE ≥ 8

multipliers:
- streak: 1.02 (3-6 days), 1.05 (7-13), 1.10 (14+)
- challenge: 1.05-1.15 (per challenge)
- global cap: 1.25 max multiplier

caps:
- soft cap at 250 points (apply 0.5x to additional)
- hard cap at 350 points per activity

Example: 3 sets × 10 reps × 50kg squat
- Base: 0.1 × 50 × 30 = 150
- Sets bonus: 3 × 2 = 6
- Weight bonus: 30
- Heavy weight multiplier: 1.5x (≥50kg)
- Total: (150 + 6 + 30) × 1.5 = 279 points
```

**Cardio Exercises** (running, cycling, walking):
```
base = distance_km × pace_factor × coefficient

pace_factor = clamp(reference_pace / actual_pace, 0.6, 1.4)
reference_pace = user fitness band baseline (default 6:00/km)

bonuses:
- elevation: +1 per 50m for running, +1 per 100m for cycling
- zone: +10 if avg HR in Zone 2-3 for ≥80% duration
        +15 if Zone 4 (with safety limits)
- milestone: +10 for first 10K in a week

caps:
- running: 400 (soft at 300)
- cycling: 450 (soft at 350)
- walking: 250

Example: 5km run in 27:30 (5:30/km), 80m elevation, Zone 3
- Base: 5 × 1.09 × 40 = 218
- Elevation: 80/50 = 2
- Zone bonus: 10
- Streak multiplier: 1.05 (8-day streak)
- Total: (218 + 12) × 1.05 = 242 points
```

**Core Exercises** (plank, sit_up, abs):
```
duration-based:
- plank: base = duration_sec × 0.1
- PR bonus: +10 for longest hold

reps-based:
- sit-up/abs: base = reps × 0.2

synergy bonus: +5 if both duration and reps core exercises same day

caps: 250 per activity
```

#### 4.1.2 Breakdown Transparency

**Breakdown JSON** (stored in `points_calculation.breakdown_json`):
```json
{
  "exercise_key": "running",
  "components": {
    "base": 220,
    "distance_component": 180,
    "pace_factor": 1.09,
    "elevation_bonus": 2,
    "zone_bonus": 10,
    "variety_bonus": 0
  },
  "multipliers": {
    "streak": 1.05,
    "challenge": 1.00,
    "seasonal": 1.00,
    "total": 1.05,
    "cap_applied": false
  },
  "caps": {
    "soft_cap_after": 300,
    "hard_cap": 400,
    "reduction_applied": 0
  },
  "total_points": 242,
  "display_text_en": "You earned 242 points: 220 base + 12 bonuses × 1.05 streak",
  "display_text_he": "השגת 242 נקודות: 220 בסיס + 12 בונוסים × 1.05 רצף"
}
```

#### 4.1.3 Fraud Prevention

**Validation Rules**:
1. **Reasonable limits per exercise**:
   - Running: max pace 2:30/km without elite track verification
   - Strength: max weight 3× user's estimated 1RM
   - Core: max plank 600 seconds

2. **Duplicate detection**:
   - Same start/end time + exercise = flag
   - Overlapping activities from same source = soft reject

3. **Device consistency**:
   - HR data present for claimed high-intensity = verify
   - GPS data for outdoor cardio = validate route

4. **Spike detection**:
   - Z-score against user's 8-week baseline
   - Flag if z-score > 3, exclude from leaderboards until reviewed

5. **Trust tiers**:
   - Verified devices (Strava, Fitbit) = fewer checks
   - Manual entry = more conservative caps

### 4.2 Achievement System

#### 4.2.1 Achievement Catalog (40 Total)

**Milestone Achievements** (Points Earned):
| Key | Name | Target | Reward | Tier |
|-----|------|--------|--------|------|
| points_1k | Point Starter | 1,000 | +50 | 1 |
| points_5k | Point Earner | 5,000 | +75 | 2 |
| points_10k | Point Master | 10,000 | +100 | 3 |
| points_25k | Point Champion | 25,000 | +125 | 4 |
| points_50k | Point Legend | 50,000 | +150 | 5 |

**Running Distance** (Lifetime):
| Key | Name | Target | Reward | Tier |
|-----|------|--------|--------|------|
| run_50k | First 50K | 50 km | +50 | 1 |
| run_100k | Century Runner | 100 km | +75 | 2 |
| run_250k | Marathon Veteran | 250 km | +100 | 3 |
| run_500k | Ultra Runner | 500 km | +125 | 4 |
| run_1000k | Endurance Elite | 1000 km | +150 | 5 |

**Cycling Distance** (Lifetime):
| Key | Name | Target | Reward | Tier |
|-----|------|--------|--------|------|
| ride_200k | Cycling Beginner | 200 km | +50 | 1 |
| ride_500k | Cyclist | 500 km | +75 | 2 |
| ride_1000k | Cycling Champion | 1000 km | +100 | 3 |

**Strength Volume** (Lifetime weight × reps):
| Key | Name | Target | Reward | Tier |
|-----|------|--------|--------|------|
| strength_50k_kg | Strength Starter | 50,000 kg | +50 | 1 |
| strength_200k_kg | Strength Builder | 200,000 kg | +75 | 2 |
| strength_500k_kg | Strength Master | 500,000 kg | +100 | 3 |
| strength_1m_kg | Strength Legend | 1,000,000 kg | +125 | 4 |

**Streaks**:
| Key | Name | Target | Reward | Tier |
|-----|------|--------|--------|------|
| streak_3d | Consistency Start | 3 days | +20 | 1 |
| streak_7d | Week Warrior | 7 days | +30 | 2 |
| streak_14d | Fortnight Fighter | 14 days | +50 | 3 |
| streak_30d | Monthly Master | 30 days | +80 | 4 |
| streak_100d | Hundred Day Hero | 100 days | +200 | 5 |

**Skill/PR**:
| Key | Name | Condition | Reward |
|-----|------|-----------|--------|
| 5k_sub_30 | Speedy 5K | 5K under 30:00 | +60 |
| 5k_sub_25 | Fast 5K | 5K under 25:00 | +80 |
| squat_1rm_100kg | Century Squatter | 100kg estimated 1RM | +80 |
| bench_1rm_80kg | Bench Beast | 80kg estimated 1RM | +60 |
| deadlift_1rm_140kg | Deadlift Demon | 140kg estimated 1RM | +100 |
| plank_2min_once | Plank Pro | 2-minute plank | +40 |
| plank_5min_once | Plank Master | 5-minute plank | +80 |

**Social**:
| Key | Name | Target | Reward |
|-----|------|--------|--------|
| first_friend | Social Starter | Add 1 friend | +10 |
| team_player | Team Member | Join team | +20 |
| high_five | Team Spirit | 5 team sessions | +40 |
| challenger | Challenge Accepted | Complete 1 challenge | +30 |
| challenger_5 | Challenge Master | Complete 5 challenges | +80 |

**Variety/Consistency**:
| Key | Name | Condition | Reward |
|-----|------|-----------|--------|
| triple_play_week | Tri-Athlete | Strength + Cardio + Core in one week | +50 |
| weekly_warrior_4 | Monthly Warrior | Hit weekly goal 4 weeks in row | +100 |
| core_5k_reps | Core Champion | 5,000 lifetime core reps | +75 |

**Special/Seasonal**:
| Key | Name | Condition | Reward |
|-----|------|-----------|--------|
| early_bird | Morning Warrior | Workout before 7 AM | +15 |
| night_owl | Night Fighter | Workout after 10 PM | +15 |
| walking_50k | Walker | 50km lifetime walking | +30 |
| walking_200k | Super Walker | 200km lifetime walking | +60 |

#### 4.2.2 Declarative Conditions

**Condition JSON Schema** (NO eval!):
```json
{
  "type": "sum",
  "metric": "distance_km",
  "filters": {
    "exercise_key": ["running"],
    "period": "lifetime"
  },
  "target": 100.0
}
```

**Supported Operators**:
- `sum`: Aggregate metric (distance, volume, points)
- `count`: Count activities
- `max`: Maximum value (longest plank, fastest 5K)
- `streak`: Consecutive days active
- `pr`: Personal record improvement
- `pace`: Time-based pace target
- `distance_once`: Single activity distance + time
- `challenges_completed`: Count of completed challenges

**Example Conditions**:
```json
// run_100k
{
  "type": "sum",
  "metric": "distance_km",
  "filters": {"exercise_key": ["running"], "period": "lifetime"},
  "target": 100.0
}

// streak_14d
{
  "type": "streak",
  "metric": "days_active",
  "filters": {"grace_tokens": 1},
  "target": 14
}

// 5k_sub_30
{
  "type": "distance_once",
  "metric": "time_for_5k_sec",
  "filters": {"exercise_key": ["running"]},
  "target_lt": 1800
}

// squat_1rm_100kg
{
  "type": "max",
  "metric": "estimated_1rm_kg",
  "filters": {"exercise_key": ["squat"]},
  "target": 100.0
}
```

#### 4.2.3 Progress Tracking

**Real-time Progress**:
- Table: `user_achievement_progress`
- Updated by Celery workers after each activity
- Shows: `progress_value / target` with percentage
- ETA calculation: Based on 14-day trend, show "~3 weeks remaining"

**Progress Display**:
```
Achievement: Century Runner (100km total running)
Progress: 60.2 / 100 km (60%)
[████████████░░░░░░░░]
ETA: ~3 weeks (based on last 14 days: 2.8 km/day average)
Next milestone: Ultra Runner (500km) - 5 more months
```

### 4.3 Level & Rank System

#### 4.3.1 XP Curve

**XP Calculation**:
```
XP = floor(total_points × 0.8)
```

**Level Thresholds**:
- Levels 1-10: 200 × level per level (fast early progression)
- Levels 11-50: 300 × level per level
- Levels 51-100: 350 × level × 1.05^(level-50) (exponential elite grind)

**Example Cumulative XP**:
| Level | Cumulative XP | Time to Reach (est.) |
|-------|---------------|---------------------|
| 1 | 0 | Start |
| 5 | 3,000 | 1 week |
| 10 | 10,000 | 3 weeks |
| 20 | 43,000 | 2 months |
| 50 | 405,000 | 1 year |
| 100 | 3,500,000 | 5+ years |

#### 4.3.2 Rank Tiers

| Rank | Levels | Badge | Meaning |
|------|--------|-------|---------|
| Bronze | 1-10 | 🥉 | Beginner (habit formation) |
| Silver | 11-25 | 🥈 | Intermediate (building consistency) |
| Gold | 26-50 | 🥇 | Advanced (dedicated athlete) |
| Platinum | 51-75 | 💎 | Expert (elite fitness) |
| Diamond | 76-100 | 💠 | Legend (multi-year mastery) |

### 4.4 Leaderboard System

#### 4.4.1 Leaderboard Types

**Scopes**:
1. **All-Time**: Lifetime points, never resets
2. **Weekly**: Mon 00:00 → Sun 23:59 in user's timezone
3. **Monthly**: 1st 00:00 → last day 23:59
4. **Friends**: Filtered to user's friend connections

#### 4.4.2 Implementation

**Redis ZSET**:
```
leaderboard:all_time        → sorted set (user_id → lifetime_points)
leaderboard:weekly:2025-W42 → sorted set (user_id → weekly_points)
leaderboard:monthly:2025-10 → sorted set (user_id → monthly_points)
leaderboard:friends:{user_id} → filtered subset
```

**Snapshot Generation**:
- Batch job every 60 seconds
- Store top 100 + user's position + neighbors in PostgreSQL
- Cache in Redis with 5-minute TTL
- Friends leaderboard: real-time via Redis ZSET intersection

**Real-time Updates**:
- WebSocket push when user moves up/down ranks
- Broadcast to friends when someone levels up
- "Your friend John just passed you!" notifications

### 4.5 Social Features

#### 4.5.1 Friends System

**Features**:
- Send/accept friend requests
- Friends-only leaderboards
- Activity feed (see friend PRs and achievements)
- "High five" reactions on friend activities

**Privacy**:
- Optional: hide exact workout details, show only points
- Opt-out of leaderboards (still earn points, not publicly ranked)

#### 4.5.2 Teams

**Team Features**:
- Create/join teams (up to 50 members)
- Team total points leaderboard
- Team challenges (collaborative goals: "Team runs 500km this month")
- Team streak bonuses (+3% when all members active same day)

#### 4.5.3 Challenges

**Challenge Types**:
1. **Distance**: "Run 100km in October"
2. **Points**: "Earn 5,000 points this month"
3. **Streak**: "30-day streak challenge"
4. **Volume**: "Lift 50,000 kg total"

**Challenge Mechanics**:
- Public challenges (open to all)
- Team challenges (team members only)
- Friend challenges (1v1 or group)
- Time-bound (start/end dates)
- Progress tracking in real-time
- Completion badges + bonus points

### 4.6 Database Schema

**Core Tables** (15 total):

```sql
-- Activity logging
activity_log (id, user_id, exercise_type_id, started_at, ended_at, source, is_valid, notes)
activity_strength_set (id, activity_id, set_index, reps, weight_kg, rpe, tempo)
activity_cardio (activity_id, distance_km, duration_sec, avg_hr, elevation_gain_m)
activity_core (activity_id, reps, duration_sec, variant)

-- Points calculation
points_calculation (id, activity_id, user_id, exercise_type_id, base_points, bonus_points, multiplier, total_points [computed], breakdown_json, calculated_at)

-- Aggregations
user_stats_daily (user_id, date, total_points, total_distance_km, total_duration_sec, strength_volume_kg, sets_completed, core_reps, activities_count)
user_stats_summary (user_id, lifetime_points, lifetime_distance_km, lifetime_duration_sec, lifetime_strength_kg, weekly_points, monthly_points, updated_at)
user_personal_record (id, user_id, exercise_type_id, metric_key, metric_value, achieved_at)
user_streak (user_id, current_streak, best_streak, last_active_date, grace_tokens, updated_at)

-- Gamification
achievement_definition (id, key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, is_active, condition_json)
user_achievement (id, user_id, achievement_id, unlocked_at, progress_value, progress_target)
user_achievement_progress (user_id, achievement_id, progress_value, progress_target, updated_at)
leaderboard_entry (id, scope, period_start, period_end, user_id, rank, points, generated_at)

-- Social
social_friend (user_id, friend_user_id, status, created_at, updated_at)
team (id, name, owner_user_id, created_at)
team_member (team_id, user_id, role, joined_at)
challenge (id, name, description, type, target_value, start_at, end_at, team_id, is_public)
challenge_participant (challenge_id, user_id, progress_value, completed_at)
```

**Indexes** (20+ critical paths):
```sql
-- Activity queries
idx_activity_user_exercise_time (user_id, exercise_type_id, started_at DESC)
idx_points_user_calculated_at (user_id, calculated_at DESC)
idx_points_total_points (total_points DESC)

-- Stats queries
idx_user_stats_daily_points (user_id, total_points DESC)
idx_summary_user (user_id UNIQUE)

-- Achievement queries
idx_achieve_user (user_id)
idx_achieve_earned (earned_at DESC)
idx_achieve_progress_user (user_id, updated_at DESC)

-- Leaderboard queries
idx_leaderboard_scope_rank (scope, period_start, period_end, rank)
idx_leaderboard_scope_points (scope, period_start, period_end, points DESC)

-- Social queries
idx_social_friend_status (user_id, status)
idx_team_member_user (user_id)
idx_challenge_period (start_at, end_at)
```

### 4.7 API Endpoints

**Activity Logging**:
```
POST /v1/activities
Request:
{
  "exercise_key": "running",
  "started_at": "2025-10-12T06:01:00Z",
  "ended_at": "2025-10-12T06:31:00Z",
  "metrics": {
    "distance_km": 5.1,
    "avg_hr": 152,
    "elevation_gain_m": 60
  },
  "source": "device:strava"
}

Response:
{
  "activity_id": 12345,
  "points": {
    "base": 220,
    "bonus": 12,
    "multiplier": 1.05,
    "total": 242,
    "breakdown": { ... }
  },
  "streak": {
    "current": 8,
    "best": 22
  },
  "achievements_unlocked": [
    {
      "key": "streak_7d",
      "name_en": "Week Warrior",
      "name_he": "לוחם שבוע",
      "points_reward": 30
    }
  ],
  "display_text": "You earned 242 points: 220 base + 12 bonuses × 1.05 streak"
}
```

**User Stats**:
```
GET /v1/users/{id}/summary
Response:
{
  "lifetime_points": 12450,
  "weekly_points": 842,
  "monthly_points": 3120,
  "level": 18,
  "rank": "Silver",
  "next_level_xp": 5400,
  "current_xp": 9960,
  "streak": {
    "current": 8,
    "best": 22,
    "grace_tokens": 1
  },
  "last_activity": "2025-10-12T06:31:00Z"
}
```

**Achievements**:
```
GET /v1/users/{id}/achievements?status=locked&category=milestone
Response:
{
  "achievements": [
    {
      "key": "run_100k",
      "name_en": "Century Runner",
      "name_he": "רץ מאה",
      "category": "milestone",
      "tier": 2,
      "points_reward": 75,
      "progress": {
        "current": 60.2,
        "target": 100.0,
        "percentage": 60,
        "eta_days": 21,
        "eta_text": "~3 weeks"
      },
      "condition": {
        "type": "sum",
        "metric": "distance_km",
        "filters": {"exercise_key": ["running"]}
      }
    }
  ]
}
```

**Leaderboards**:
```
GET /v1/leaderboards?scope=weekly&period=2025-W42&cursor=user_position
Response:
{
  "scope": "weekly",
  "period_start": "2025-10-06",
  "period_end": "2025-10-12",
  "user_position": {
    "rank": 42,
    "points": 842,
    "user_id": "uuid",
    "display_name": "John"
  },
  "top_10": [
    {"rank": 1, "points": 2450, "display_name": "Alice"},
    {"rank": 2, "points": 2100, "display_name": "Bob"},
    ...
  ],
  "neighbors": [
    {"rank": 41, "points": 850, "display_name": "Eve"},
    {"rank": 42, "points": 842, "display_name": "John"}, // user
    {"rank": 43, "points": 835, "display_name": "Frank"}
  ]
}
```

**Friends**:
```
POST /v1/friends/requests
GET /v1/friends
POST /v1/friends/{id}/accept
DELETE /v1/friends/{id}
GET /v1/leaderboards?scope=friends
```

**Teams**:
```
POST /v1/teams
GET /v1/teams/{id}
POST /v1/teams/{id}/join
GET /v1/teams/{id}/leaderboard
```

**Challenges**:
```
POST /v1/challenges
GET /v1/challenges?status=active
POST /v1/challenges/{id}/join
GET /v1/challenges/{id}/progress
```

**WebSocket**:
```
WS /v1/realtime
Subscriptions:
- user:{id}              → points_earned, achievement_unlocked, level_up
- leaderboard:{scope}    → rank_changed, top_10_changed
- team:{id}              → member_activity, team_milestone
- challenge:{id}         → participant_progress, challenge_completed

Messages:
{
  "type": "achievement_unlocked",
  "data": {
    "achievement_key": "run_100k",
    "name_en": "Century Runner",
    "points_reward": 75
  }
}
```

### 4.8 Testing Requirements

#### 4.8.1 Unit Tests

**Formula Tests**:
```python
# test_strength_formula.py
def test_squat_base_calculation():
    result = calculate_strength_points(
        exercise="squat",
        sets=3,
        reps=10,
        weight_kg=50
    )
    assert result.base_points == 150  # 0.1 × 50 × 30

def test_progressive_overload_bonus():
    # Given user's 4-week average is 120 points
    result = calculate_with_bonuses(
        base=150,
        user_history_avg=120
    )
    assert result.bonus_points == 15  # 10% bonus

def test_multiplier_cap():
    result = apply_multipliers(
        points=200,
        streak_mult=1.10,
        challenge_mult=1.15,
        seasonal_mult=1.10
    )
    # Would be 1.10 × 1.15 × 1.10 = 1.39, but capped at 1.25
    assert result.multiplier == 1.25
    assert result.total == 250
```

**Bonus System Tests**:
```python
def test_variety_bonus():
    activities = ["squat", "running", "plank"]  # 3 different
    result = check_variety_bonus(activities, date="2025-10-12")
    assert result.bonus == 5

def test_pr_detection():
    old_1rm = 80
    new_1rm = 85
    result = check_pr_bonus(old_1rm, new_1rm)
    assert result.bonus == 15
    assert result.is_pr == True
```

**Fraud Detection Tests**:
```python
def test_unrealistic_pace_flagged():
    result = validate_running(
        distance_km=5.0,
        duration_sec=600  # 2:00/km = unrealistic
    )
    assert result.is_valid == False
    assert "unrealistic pace" in result.warnings

def test_duplicate_activity_detected():
    activity1 = {"started_at": "2025-10-12T06:00:00Z", "ended_at": "2025-10-12T06:30:00Z"}
    activity2 = {"started_at": "2025-10-12T06:00:00Z", "ended_at": "2025-10-12T06:30:00Z"}
    result = check_duplicate(activity1, activity2)
    assert result.is_duplicate == True
```

#### 4.8.2 Integration Tests

**API Endpoint Tests**:
```python
async def test_log_activity_and_calculate_points(client):
    response = await client.post("/v1/activities", json={
        "exercise_key": "running",
        "started_at": "2025-10-12T06:00:00Z",
        "ended_at": "2025-10-12T06:30:00Z",
        "metrics": {"distance_km": 5.0, "elevation_gain_m": 80}
    })
    assert response.status_code == 201
    data = response.json()
    assert data["points"]["total"] > 0
    assert "breakdown" in data["points"]
    assert len(data["achievements_unlocked"]) >= 0
```

**Achievement Unlock Flow**:
```python
async def test_achievement_unlock_on_threshold(client, db):
    # User has 99.5km running, needs 0.5km more for "run_100k"
    await log_activity(user_id="uuid", exercise="running", distance=0.6)

    # Wait for Celery worker to process
    await asyncio.sleep(2)

    achievements = await get_user_achievements(user_id="uuid")
    assert any(a["key"] == "run_100k" for a in achievements)
    assert achievements[0]["unlocked_at"] is not None
```

#### 4.8.3 E2E Tests (Playwright)

**Complete User Flow**:
```typescript
test('user logs exercise, earns points, unlocks achievement, sees leaderboard update', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:8005');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // 2. Log exercise via chat
  await page.fill('textarea[placeholder="Type a message..."]', 'I ran 5km in 27 minutes');
  await page.click('button[aria-label="Send"]');

  // 3. Wait for AI response with points
  await page.waitForSelector('text=/You earned \\d+ points/');
  const pointsText = await page.textContent('.points-earned');
  expect(pointsText).toContain('242 points');

  // 4. Check for achievement unlock notification
  const achievementToast = page.locator('.achievement-toast');
  if (await achievementToast.isVisible()) {
    expect(await achievementToast.textContent()).toContain('Achievement Unlocked');
  }

  // 5. Navigate to leaderboard
  await page.click('a[href="/leaderboard"]');
  await page.waitForSelector('.leaderboard-entry');

  // 6. Verify user appears in leaderboard
  const userEntry = page.locator('.leaderboard-entry.user-highlight');
  expect(await userEntry.isVisible()).toBe(true);

  // 7. Take screenshot for documentation
  await page.screenshot({ path: 'docs/screenshots-debug/points-earned-e2e.png' });
});
```

#### 4.8.4 Load Testing (Locust)

**Scenarios**:
```python
from locust import HttpUser, task, between

class SweatBotUser(HttpUser):
    wait_time = between(1, 5)

    @task(10)
    def log_activity(self):
        self.client.post("/v1/activities", json={
            "exercise_key": "running",
            "started_at": "2025-10-12T06:00:00Z",
            "ended_at": "2025-10-12T06:30:00Z",
            "metrics": {"distance_km": 5.0}
        }, headers={"Authorization": f"Bearer {self.token}"})

    @task(5)
    def get_leaderboard(self):
        self.client.get("/v1/leaderboards?scope=weekly")

    @task(2)
    def get_achievements(self):
        self.client.get(f"/v1/users/{self.user_id}/achievements?status=all")

# Run: locust -f load_test.py --users 10000 --spawn-rate 100 --host http://localhost:8000
```

**Performance Targets**:
- 10,000 concurrent users
- 500 activities/second sustained
- p95 latency: <50ms (points calc), <100ms (leaderboards)
- 0.1% error rate maximum

### 4.9 Migration Strategy

#### 4.9.1 Phase 1: Schema Side-by-Side (Week 1)

**Actions**:
1. Deploy new v4 tables alongside v3 tables
2. Backfill exercise_type mapping
3. Create feature flag: `points_system_version` (default: "v3")
4. No user impact, all traffic still on v3

**Deliverables**:
- 15 new PostgreSQL tables created
- 40 achievements seeded
- 13 exercise types seeded
- Feature flag infrastructure deployed

#### 4.9.2 Phase 2: Backend Implementation (Week 2)

**Actions**:
1. Implement v4 calculation engine (all formulas)
2. Build Celery workers for aggregations
3. Create v4 API endpoints (`/v1/activities`, `/v1/users/{id}/summary`)
4. Deploy behind feature flag (still 0% traffic)

**Deliverables**:
- Point calculation engine with 100% test coverage
- Achievement system with condition parser
- Celery workers for stats/streak/achievements
- Full API suite implemented

#### 4.9.3 Phase 3: 5% Rollout (Week 3)

**Actions**:
1. Enable v4 for 5% of users (random selection)
2. Monitor metrics: error rate, latency, achievement unlock rate
3. Collect user feedback via in-app survey
4. A/B test metrics dashboard

**Success Criteria**:
- Error rate <0.1%
- p95 latency <50ms (points), <100ms (leaderboards)
- No significant user complaints
- Achievement unlock rate ≥ v3 baseline

#### 4.9.4 Phase 4: Gradual Ramp (Week 4)

**Actions**:
- 5% → 25% → 50% → 100% over 2 weeks
- Kill switch ready if metrics degrade
- Monitor telemetry continuously

**Rollback Plan**:
- If error rate >1%: immediate rollback to v3
- If user complaints spike: pause at current %
- If latency p95 >100ms: investigate before continuing

#### 4.9.5 Phase 5: v3 Deprecation (Week 6+)

**Actions**:
1. 100% traffic on v4 for 2 weeks (stable)
2. Announce v3 deprecation (30-day notice)
3. Make v3 tables read-only
4. Archive v3 data to `points_v3_archive.*` tables
5. Drop v3 tables after 90 days

**User Communication**:
- In-app banner: "New points system is live! See how it works →"
- Blog post: "SweatBot Points 2.0: Fair, Transparent, and Motivating"
- FAQ: "Why did my points change?" with comparison calculator

---

## 5. Non-Goals (Out of Scope)

**Explicitly NOT included in v4.0**:
1. ❌ Paid boosts or pay-to-win mechanics
2. ❌ NFT/crypto integration
3. ❌ Video recording of exercises
4. ❌ Live streaming workouts
5. ❌ Coaching marketplace
6. ❌ Equipment purchase recommendations
7. ❌ Nutrition tracking integration
8. ❌ Sleep tracking
9. ❌ Wearable device SDK (only API integrations)
10. ❌ Multi-language support beyond Hebrew/English

---

## 6. Success Metrics & KPIs

### 6.1 Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Latency (p95) | <50ms | Datadog APM |
| Error Rate | <0.1% | Error logs |
| Test Coverage | >90% | pytest, jest |
| Uptime | 99.9% | Pingdom |
| Cache Hit Rate | >80% | Redis stats |

### 6.2 Product KPIs

| Metric | Baseline (v3) | Target (v4) | Timeline |
|--------|--------------|-------------|----------|
| DAU | 1,000 | 1,400 (+40%) | 3 months |
| 30-day retention | 25% | 60% | 6 months |
| Achievement unlock rate | 15% | 60% | 1 month |
| Avg session length | 8 min | 12 min | 3 months |
| Weekly active users | 3,500 | 5,000 (+43%) | 6 months |

### 6.3 Business KPIs

| Metric | Target | Timeline |
|--------|--------|----------|
| App Store rating | 4.5+ stars | 6 months |
| Support tickets ("wrong points") | -80% | 3 months |
| Premium conversion | 5% of active users | 12 months |
| User NPS | >50 | 6 months |

---

## 7. Risks & Mitigation

### 7.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Performance regression | Medium | High | Load testing before rollout, kill switch ready |
| Data migration errors | Medium | Critical | Side-by-side validation, rollback plan |
| Celery queue bottleneck | Low | Medium | Auto-scaling workers, queue monitoring |
| Redis cache inconsistency | Low | Medium | TTL + invalidation strategy |

### 7.2 Product Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Users prefer old points | Low | High | A/B test, gradual rollout, communication |
| Achievement inflation | Medium | Medium | Monitor unlock rates, adjust thresholds |
| Fraud/gaming system | Medium | High | Fraud detection, manual review for top 100 |
| Social features unused | Medium | Low | In-app education, onboarding flow |

### 7.3 Rollback Plan

**Trigger Conditions**:
- Error rate >1% for 10 minutes
- p95 latency >100ms for 30 minutes
- >10 support tickets in 1 hour
- Critical bug discovered

**Rollback Steps**:
1. Set feature flag `points_system_version = "v3"`
2. Drain Celery queues
3. Verify v3 endpoints responding
4. Post-mortem within 24 hours

---

## 8. Timeline & Milestones

### Phase 1: Foundation (Weeks 1-2)
- [ ] Week 1: Database migrations + seed data
- [ ] Week 2: Calculation engine + formulas

### Phase 2: Core Features (Weeks 3-4)
- [ ] Week 3: Achievement system + conditions
- [ ] Week 4: Celery workers + aggregations

### Phase 3: Performance (Weeks 5-6)
- [ ] Week 5: Leaderboards + Redis caching
- [ ] Week 6: Testing (unit + integration + E2E)

### Phase 4: Migration (Weeks 7-8)
- [ ] Week 7: Feature flags + 5% rollout
- [ ] Week 8: Gradual ramp to 100%

### Phase 5: Refinement (Weeks 9-12)
- [ ] Week 9-10: Social features (friends, teams)
- [ ] Week 11-12: Challenges + seasonal content

**Total Timeline**: 12 weeks (3 months)

---

## 9. Documentation Requirements

### 9.1 Technical Documentation

- [ ] Database schema reference (all tables + indexes)
- [ ] API endpoint specifications (OpenAPI/Swagger)
- [ ] Calculation formula documentation (all exercises)
- [ ] Achievement condition schema reference
- [ ] Celery worker architecture diagram
- [ ] Redis caching strategy
- [ ] Testing guide (how to run tests, add new tests)
- [ ] Deployment guide (feature flags, rollout process)

### 9.2 User-Facing Documentation

- [ ] "How Points Work" page with examples
- [ ] Achievement catalog with progress tips
- [ ] Leaderboard FAQ
- [ ] Social features guide (friends, teams, challenges)
- [ ] "Why did my points change?" v3 → v4 migration explainer

### 9.3 Admin Documentation

- [ ] How to add new exercises
- [ ] How to create new achievements
- [ ] How to adjust formula coefficients
- [ ] How to investigate fraud reports
- [ ] How to run backfill scripts

---

## 10. Open Questions

### 10.1 Product Questions

1. **Streak grace tokens**: Replenish monthly or fixed allowance?
   - **Proposal**: 1 token, replenish on 1st of each month

2. **Personal record detection**: Require 5% improvement or any improvement?
   - **Proposal**: Any improvement for motivation, but bonus scales with magnitude

3. **Social features priority**: Friends vs Teams vs Challenges?
   - **Proposal**: Phase 1 = Friends, Phase 2 = Challenges, Phase 3 = Teams

4. **Seasonal events frequency**: Monthly? Quarterly?
   - **Proposal**: Quarterly themed challenges (Spring Sprint, Summer Endurance, etc.)

### 10.2 Technical Questions

1. **Job queue tech**: Celery vs RQ vs Redis Streams?
   - **Decision**: Celery (mature, well-documented, battle-tested)

2. **Real-time push**: WebSocket vs SSE vs long polling?
   - **Decision**: WebSocket (FastAPI native support, bidirectional)

3. **Leaderboard refresh frequency**: Every minute vs on-demand?
   - **Decision**: Every 60 seconds batch + real-time for friends

4. **Achievement progress storage**: PostgreSQL vs Redis vs both?
   - **Decision**: Both (PostgreSQL source of truth, Redis cache)

---

## 11. Appendix

### 11.1 Glossary

- **Activity**: Single exercise session (e.g., one 5K run)
- **Base Points**: Points earned from primary metrics (distance, weight, reps)
- **Bonus**: Fixed point addition for specific conditions
- **Breakdown**: Detailed explanation of point calculation
- **Condition**: Declarative rule for achievement unlock
- **Grace Period**: Missed day that doesn't break streak (limited tokens)
- **Multiplier**: Percentage increase applied to base + bonus
- **Personal Record (PR)**: Best performance for specific metric
- **Streak**: Consecutive days with at least one activity
- **Volume**: Total work performed (weight × reps for strength)
- **XP**: Experience points used for leveling (0.8 × total_points)

### 11.2 Reference Implementations

**Strava**:
- Segments with leaderboards
- KOM/QOM (King/Queen of Mountain)
- Monthly distance challenges
- Social kudos system

**Fitbit**:
- Badges for milestones (10K steps, 100 miles, etc.)
- Daily/weekly goals with push notifications
- Challenges with friends
- Lifetime statistics dashboard

**Duolingo**:
- XP per lesson (transparent formula)
- Streak system with repair option
- Leagues (competitive weekly tiers)
- Achievement badges with clear progress

**Nike Run Club**:
- Trophies for achievements
- Guided run challenges
- Audio feedback during runs
- Social activity feed

### 11.3 Formulas Quick Reference

**Strength**:
```
points = floor(((base + bonuses) × multiplier) capped at 350)
base = 0.1 × Σ(weight_kg × reps)
bonuses = set_completion + overload + variety + PR + RPE
multiplier = streak × challenge (max 1.25)
```

**Cardio**:
```
points = floor(((base + bonuses) × multiplier) capped at 400/450)
base = distance_km × pace_factor × coefficient
bonuses = elevation + zone + milestone
multiplier = streak × challenge (max 1.25)
```

**Core**:
```
points = floor((base + bonuses) capped at 250)
base = duration_sec × 0.1 OR reps × 0.2
bonuses = PR + synergy
```

---

## 12. Approval & Sign-off

| Stakeholder | Role | Status | Date |
|-------------|------|--------|------|
| Product Manager | Feature Owner | ⏳ Pending | - |
| Engineering Lead | Technical Owner | ⏳ Pending | - |
| UX Designer | User Experience | ⏳ Pending | - |
| Data Scientist | Analytics | ⏳ Pending | - |
| QA Lead | Testing Strategy | ⏳ Pending | - |

---

**Document Version**: 1.0
**Created**: October 12, 2025
**Author**: Engineering Team (via Perplexity AI analysis)
**Next Review**: After Phase 1 completion (Week 2)
**Status**: 📋 Ready for Review
