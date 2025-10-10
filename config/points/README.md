# Points System Configuration Guide

## Overview

The SweatBot Points System v3 uses YAML-based configuration for maximum flexibility and maintainability. All configuration files are version-controlled and sync to the database on startup.

## Configuration Files

### 📋 exercises.yaml
Defines base points and multipliers for all exercises.

**Structure:**
```yaml
exercise_key:
  name: "English Name"
  name_he: "שם בעברית"
  category: strength|cardio|core
  base_points: 10
  multipliers:
    reps: 1.0           # Points per repetition
    sets: 5.0           # Points per set
    weight: 0.1         # Points per kg
    distance_km: 10.0   # Points per km (for cardio)
    duration_min: 2.0   # Points per minute
    duration_sec: 0.5   # Points per second
  enabled: true
  description: "Description of exercise"
```

**Example Calculation:**
- Exercise: Squat with 10 reps, 3 sets, 50kg
- Points = base_points + (reps × reps_multiplier × base_points) + (sets × sets_multiplier × base_points) + (weight × weight_multiplier)
- Points = 10 + (10 × 1.0 × 10) + (3 × 5.0 × 10) + (50 × 0.1)
- Points = 10 + 100 + 150 + 5 = **265 points**

### 🎯 rules.yaml
Defines bonus points and multipliers based on conditions.

**Rule Types:**
- **bonus**: Adds fixed points when condition is met
- **multiplier**: Multiplies current points when condition is met

**Structure:**
```yaml
rule_id:
  id: "unique_rule_id"
  name: "Rule Name"
  name_he: "שם החוק"
  description: "What this rule does"
  rule_type: bonus|multiplier
  condition: "Python-like expression"
  value: 50  # Points to add (bonus) or multiply by (multiplier)
  enabled: true
  priority: 1  # Lower = evaluated first
```

**Condition Syntax:**
Available variables:
- `reps`, `sets`, `weight_kg`
- `distance_km`, `duration_seconds`, `duration_minutes`
- `is_personal_record` (boolean)
- `streak_days` (user's current streak)
- `session_exercise_count` (exercises in current session)
- `workout_hour` (0-23)
- `total_points`, `total_workouts`

**Examples:**
```yaml
# Bonus 50 points for 20+ reps
condition: "reps >= 20"
value: 50

# 1.5x multiplier for heavy weights
condition: "weight_kg >= 50"
value: 1.5

# Combo bonus for multiple exercises
condition: "session_exercise_count >= 5"
value: 1.3
```

### 🏆 achievements.yaml
Defines unlockable achievements and rewards.

**Structure:**
```yaml
achievement_id:
  id: "unique_achievement_id"
  name: "Achievement Name"
  name_he: "שם ההישג"
  description: "How to unlock this"
  description_he: "איך לפתוח את זה"
  points: 100  # Points awarded
  icon: "🏆"   # Display icon
  category: beginner|intermediate|advanced|special
  condition: "Python-like expression"
  enabled: true
```

**Categories:**
- **beginner**: First workout, first week, etc.
- **intermediate**: 1000 points, specific milestones
- **advanced**: Long streaks, high totals
- **special**: Time-based, unique accomplishments

## How Configuration Works

### 1. File-Based Configuration (YAML)
- Human-readable and editable
- Version-controlled in Git
- Easy to review changes (git diff)
- Can be edited directly or via admin UI

### 2. Database Sync
- On server startup, YAML files are parsed
- Configuration is synced to `points_configuration` table
- Database becomes the active source during runtime
- YAML files are the "source of truth" for deployments

### 3. Caching
- Active configurations cached in Redis (1 hour TTL)
- First calculation fetches from cache
- Cache invalidated when admin updates config
- Fallback to database if Redis unavailable

### 4. Admin UI Updates
- Admin can edit via web interface
- Changes save to database immediately
- Background job updates YAML files
- Git commit created automatically

## Configuration Best Practices

### 1. Exercise Points
- **Base points** should reflect exercise difficulty
- **Multipliers** should reward volume (reps/sets)
- **Weight multiplier** typically 0.05-0.15
- Balance cardio distance/time points

### 2. Rules Design
- Use **bonuses** for specific achievements
- Use **multipliers** for exceptional performance
- Set appropriate **priorities** (bonuses before multipliers)
- Test calculations with real data

### 3. Achievements
- **Beginner** achievements encourage new users
- **Intermediate** maintain engagement
- **Advanced** create long-term goals
- **Special** add fun and variety

### 4. Version Control
- Always commit configuration changes
- Use descriptive commit messages
- Tag major point system updates
- Document breaking changes

## Updating Configuration

### Method 1: Direct YAML Edit
```bash
# Edit the file
nano config/points/exercises.yaml

# Restart server to apply
docker-compose restart backend
```

### Method 2: Admin Dashboard
1. Navigate to `/admin/points`
2. Click "Edit Configuration"
3. Make changes in visual editor
4. Preview calculation
5. Save and deploy

### Method 3: API Import
```bash
curl -X POST http://localhost:8000/api/v3/points/admin/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d @config/points/exercises.yaml
```

## Troubleshooting

### Points Calculation Inconsistency
- Check if exercise exists in `exercises.yaml`
- Verify multipliers are numeric (not strings)
- Check rule conditions for syntax errors
- Review cache status (may need invalidation)

### Configuration Not Applying
- Ensure server restart after YAML changes
- Check logs for parsing errors
- Verify database sync completed
- Clear Redis cache: `redis-cli FLUSHDB`

### Achievement Not Unlocking
- Verify condition syntax is correct
- Check if achievement is `enabled: true`
- Review user stats for condition variables
- Test condition in admin calculator

## API Reference

### Get Exercise Configuration
```bash
GET /api/v3/points/config/exercises
```

### Calculate Points
```bash
POST /api/v3/points/calculate
{
  "exercise": "squat",
  "reps": 10,
  "sets": 3,
  "weight_kg": 50
}
```

### Update Configuration (Admin)
```bash
POST /api/v3/points/config/exercises
Authorization: Bearer <admin_token>
{
  "squat": {
    "base_points": 12,
    ...
  }
}
```

## Migration from v1/v2

If migrating from older points systems:

```bash
# Export old configuration
python scripts/export_old_points_config.py > config/points/legacy.json

# Convert to YAML
python scripts/convert_to_v3.py config/points/legacy.json

# Review and test
python scripts/test_points_calculation.py

# Deploy
git add config/points/*.yaml
git commit -m "Migrate to points system v3"
docker-compose restart
```

## Support

For questions or issues:
- Check server logs: `docker-compose logs backend`
- Test calculations: `/admin/points/calculator`
- Review audit log: `/admin/points/history`
- Contact dev team: #sweatbot-dev on Slack
