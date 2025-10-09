# Adding New Exercises Standard Operating Procedure

## 🎯 Purpose

This SOP defines the standard procedure for adding new exercise types to the SweatBot system, ensuring they work properly with the Hebrew parser, points system, and user interface.

---

## 📋 Prerequisites

### Required Knowledge
- Exercise terminology and biomechanics
- Hebrew language basics for exercise names
- Database schema understanding
- API design principles
- Testing methodologies

### Required Files to Modify
- `backend/app/services/hebrew_exercise_parser.py`
- `backend/app/services/gamification_service.py`  
- Database (PostgreSQL exercises table)
- Frontend exercise selection components
- Test files for exercise recognition

---

## 🔍 Exercise Analysis Phase

### Step 1: Exercise Classification
```python
# Determine exercise properties
exercise_info = {
    "name_english": "Burpees",
    "name_hebrew": "ברפים", 
    "exercise_type": "strength",  # strength, cardio, flexibility, functional
    "muscle_groups": ["full_body", "core", "legs", "chest", "arms"],
    "difficulty_level": 7,  # 1-10 scale
    "calories_per_minute": 10,
    "base_points": 15,  # Points for standard execution
    "supports_variations": True,
    "common_units": ["reps", "time"],
    "hebrew_variations": [
        "ברפי", "ברפים", "בורפי", "בורפים"
    ],
    "recognition_patterns": [
        "עשיתי {num} ברפים",
        "ביצעתי {num} ברפי", 
        "עבדתי על ברפים",
        "סיימתי {num} חזרות של ברפים"
    ]
}
```

### Step 2: Points Calculation Logic
```python
# In backend/app/services/gamification_service.py
def calculate_exercise_points(exercise_data: ExerciseCreate) -> int:
    """Calculate points based on exercise type and metrics."""
    
    base_points = get_exercise_base_points(exercise_data.exercise_name)
    
    # Apply multipliers
    points = base_points
    
    # Repetition bonus
    if exercise_data.repetitions:
        if exercise_data.repetitions > 20:
            points *= 1.5  # High volume bonus
        elif exercise_data.repetitions > 10:
            points *= 1.2  # Medium volume bonus
    
    # Weight bonus
    if exercise_data.amount and exercise_data.unit == 'kg':
        weight_multiplier = min(1 + (exercise_data.amount / 50), 2.0)
        points *= weight_multiplier
    
    # Duration bonus for time-based exercises
    if exercise_data.duration_seconds:
        duration_minutes = exercise_data.duration_seconds / 60
        points *= min(1 + duration_minutes / 10, 2.0)
    
    # Difficulty bonus
    difficulty_multiplier = 1 + (exercise_data.difficulty_level - 5) * 0.1
    points *= difficulty_multiplier
    
    return int(points)
```

---

## 🗄️ Database Integration

### Step 3: Add Exercise to Database
```sql
-- Add to exercises_lookup table (reference table)
INSERT INTO exercises_lookup (
    name_english, 
    name_hebrew, 
    exercise_type, 
    muscle_groups, 
    difficulty_level,
    base_points,
    supports_weight,
    supports_reps,
    supports_duration,
    hebrew_variations,
    recognition_patterns,
    is_active
) VALUES (
    'Burpees',
    'ברפים',
    'strength',
    ARRAY['full_body', 'core', 'legs', 'chest', 'arms'],
    7,
    15,
    false,
    true,
    true,
    ARRAY['ברפי', 'ברפים', 'בורפי', 'בורפים'],
    ARRAY['עשיתי {} ברפים', 'ביצעתי {} ברפי'],
    true
);
```

### Step 4: Update Exercise Model
```python
# backend/app/models/models.py
class ExerciseLookup(Base):
    __tablename__ = "exercises_lookup"
    
    id = Column(Integer, primary_key=True, index=True)
    name_english = Column(String(100), nullable=False)
    name_hebrew = Column(String(100), nullable=False)
    exercise_type = Column(String(50), nullable=False)
    muscle_groups = Column(ARRAY(String))
    difficulty_level = Column(Integer, default=5)
    base_points = Column(Integer, default=10)
    supports_weight = Column(Boolean, default=False)
    supports_reps = Column(Boolean, default=True)
    supports_duration = Column(Boolean, default=False)
    hebrew_variations = Column(ARRAY(String))
    recognition_patterns = Column(ARRAY(String))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## 🧠 Hebrew Parser Integration

### Step 5: Update Hebrew Exercise Parser
```python
# backend/app/services/hebrew_exercise_parser.py
class HebrewExerciseParser:
    def __init__(self):
        self.exercise_variations = {
            # Existing exercises...
            "burpees": {
                "names": ["ברפים", "ברפי", "בורפי", "בורפים", "burpee", "burpees"],
                "patterns": [
                    r"עשיתי (\d+)\s*(ברפים|ברפי|בורפי|בורפים)",
                    r"ביצעתי (\d+)\s*(ברפים|ברפי|בורפי|בורפים)",
                    r"(\d+)\s*(ברפים|ברפי|בורפי|בורפים)",
                    r"עבדתי על (\d+)\s*(ברפים|ברפי|בורפי|בורפים)",
                ],
                "units": ["reps"],
                "default_values": {"reps": 10}
            }
        }
    
    def parse_exercise_from_text(self, text: str) -> Optional[ExerciseData]:
        """Parse exercise information from Hebrew text."""
        text = text.lower().strip()
        
        # Check for burpees
        for pattern in self.exercise_variations["burpees"]["patterns"]:
            match = re.search(pattern, text)
            if match:
                reps = int(match.group(1))
                return ExerciseData(
                    exercise_name="Burpees",
                    exercise_name_he="ברפים",
                    exercise_type="strength",
                    muscle_groups=["full_body", "core", "legs", "chest", "arms"],
                    repetitions=reps,
                    sets=1,
                    difficulty_level=7,
                    unit="reps"
                )
        
        # Try other exercises...
        return None
```

### Step 6: Add Context-Aware Recognition
```python
# Add contextual understanding for compound exercises
def parse_compound_exercises(self, text: str) -> Optional[ExerciseData]:
    """Handle compound exercise descriptions."""
    
    # Example: "עשיתי 5 ברפים עם קפיצות" (5 burpees with jumps)
    if "ברפים" in text and ("קפיצות" in text or "קפיצה" in text):
        match = re.search(r"(\d+)\s*ברפים", text)
        if match:
            reps = int(match.group(1))
            return ExerciseData(
                exercise_name="Burpees with Jumps",
                exercise_name_he="ברפים עם קפיצות",
                exercise_type="strength",
                repetitions=reps,
                difficulty_level=8,  # Higher difficulty
                points_multiplier=1.3
            )
    
    return None
```

---

## 🎨 Frontend Integration

### Step 7: Update Exercise Selection Components
```typescript
// personal-ui-vite/src/components/ExerciseSelector.tsx
const EXERCISE_OPTIONS = [
  // Existing exercises...
  {
    id: 'burpees',
    name: 'Burpees',
    nameHe: 'ברפים',
    category: 'strength',
    muscleGroups: ['full_body', 'core', 'legs', 'chest', 'arms'],
    difficulty: 7,
    icon: '💪',
    supportedUnits: ['reps', 'time'],
    description: 'Full-body exercise combining squat, push-up, and jump',
    descriptionHe: 'תרגיל לכל הגוף המשלב סקווט, שכיבת סמיכה וקפיצה'
  }
];

export const ExerciseSelector: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  
  return (
    <div className="exercise-selector">
      <h3>בחר תרגיל / Choose Exercise</h3>
      <div className="exercise-grid">
        {EXERCISE_OPTIONS.map(exercise => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isSelected={selectedExercise === exercise.id}
            onSelect={() => setSelectedExercise(exercise.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Step 8: Update Exercise Display Components
```typescript
// personal-ui-vite/src/components/ExerciseCard.tsx
interface ExerciseCardProps {
  exercise: ExerciseOption;
  isSelected: boolean;
  onSelect: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isSelected,
  onSelect
}) => {
  return (
    <Card 
      className={`exercise-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{
        backgroundColor: isSelected 
          ? designTokens.colors.primary.light 
          : designTokens.colors.background.secondary
      }}
    >
      <div className="exercise-icon">{exercise.icon}</div>
      <div className="exercise-info">
        <h4>{exercise.name}</h4>
        <h5>{exercise.nameHe}</h5>
        <p>{exercise.description}</p>
        <div className="exercise-meta">
          <Badge variant={getDifficultyVariant(exercise.difficulty)}>
            רמת קושי: {exercise.difficulty}/10
          </Badge>
          <div className="muscle-groups">
            {exercise.muscleGroups.map(group => (
              <span key={group} className="muscle-tag">
                {group}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
```

---

## 🧪 Testing Phase

### Step 9: Create Comprehensive Tests
```python
# tests/test_burpees_integration.py
import pytest
from app.services.hebrew_exercise_parser import HebrewExerciseParser
from app.services.gamification_service import GamificationService

class TestBurpeesIntegration:
    
    def test_heburpees_recognition_variations(self):
        """Test various Hebrew ways to say burpees."""
        parser = HebrewExerciseParser()
        
        test_cases = [
            ("עשיתי 10 ברפים", 10, "reps"),
            ("ביצעתי 15 ברפי", 15, "reps"), 
            ("20 בורפים", 20, "reps"),
            ("עבדתי על 8 בורפי", 8, "reps"),
            ("סיימתי 12 חזרות של ברפים", 12, "reps"),
        ]
        
        for text, expected_reps, expected_unit in test_cases:
            result = parser.parse_exercise_from_text(text)
            assert result is not None, f"Failed to parse: {text}"
            assert result.exercise_name_he == "ברפים"
            assert result.repetitions == expected_reps
            assert result.unit == expected_unit
    
    def test_burpees_points_calculation(self):
        """Test points calculation for burpees."""
        gamification = GamificationService()
        
        # Test different rep counts
        test_cases = [
            ({"repetitions": 5, "exercise_name": "Burpees"}, 15),   # Base
            ({"repetitions": 15, "exercise_name": "Burpees"}, 18),  # 20% bonus
            ({"repetitions": 25, "exercise_name": "Burpees"}, 22),  # 50% bonus
        ]
        
        for exercise_data, expected_points in test_cases:
            points = gamification.calculate_exercise_points(exercise_data)
            assert points >= expected_points, f"Expected at least {expected_points}, got {points}"
    
    def test_compound_burpee_recognition(self):
        """Test recognition of burpee variations."""
        parser = HebrewExerciseParser()
        
        test_cases = [
            ("עשיתי 5 ברפים עם קפיצות", "Burpees with Jumps", 5),
            ("ברפים עם פושאפים", "Burpees with Push-ups", None),  # Should detect
            ("ברפים עם משקולות", "Weighted Burpees", None),  # Should detect
        ]
        
        for text, expected_name, expected_reps in test_cases:
            result = parser.parse_exercise_from_text(text)
            if expected_name:
                assert result is not None, f"Failed to parse: {text}"
                assert expected_name in result.exercise_name
                if expected_reps:
                    assert result.repetitions == expected_reps
```

### Step 10: Frontend Testing
```typescript
// personal-ui-vite/src/components/__tests__/ExerciseCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseCard } from '../ExerciseCard';

describe('ExerciseCard - Burpees', () => {
  const burpeeExercise = {
    id: 'burpees',
    name: 'Burpees',
    nameHe: 'ברפים',
    category: 'strength',
    difficulty: 7,
    icon: '💪',
    description: 'Full-body exercise',
    descriptionHe: 'תרגיל לכל הגוף'
  };
  
  test('displays burpee information correctly', () => {
    render(<ExerciseCard exercise={burpeeExercise} isSelected={false} onSelect={jest.fn()} />);
    
    expect(screen.getByText('Burpees')).toBeInTheDocument();
    expect(screen.getByText('ברפים')).toBeInTheDocument();
    expect(screen.getByText('רמת קושי: 7/10')).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
  });
  
  test('handles selection correctly', () => {
    const onSelect = jest.fn();
    render(<ExerciseCard exercise={burpeeExercise} isSelected={true} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🚀 End-to-End Testing

### Step 11: E2E Flow Testing
```typescript
// tests/e2e/exercise_logging.test.ts
import { test, expect } from '@playwright/test';

test.describe('Burpees Exercise Logging', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8005');
  });
  
  test('should log burpees via Hebrew chat', async ({ page }) => {
    // Send Hebrew message
    await page.fill('[data-testid="chat-input"]', 'עשיתי 15 ברפים');
    await page.click('[data-testid="send-button"]');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
    
    // Verify exercise was logged
    await page.click('[data-testid="stats-button"]');
    await expect(page.locator('text=15 ברפים')).toBeVisible();
    await expect(page.locator('text=Total Points:')).toContainText(/\d+/);
  });
  
  test('should recognize burpee variations', async ({ page }) => {
    const variations = [
      'ביצעתי 10 ברפי',
      '20 בורפים',
      'עבדתי על 8 בורפי'
    ];
    
    for (const message of variations) {
      await page.fill('[data-testid="chat-input"]', message);
      await page.click('[data-testid="send-button"]');
      
      await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="ai-message"]')).toContainText(/ברפים|בורפי/);
      
      // Clear for next test
      await page.click('[data-testid="new-chat"]');
    }
  });
});
```

---

## 📊 Monitoring and Validation

### Step 12: Add Exercise Metrics
```python
# backend/app/services/exercise_analytics.py
class ExerciseAnalytics:
    
    def track_exercise_usage(self, exercise_name: str, user_id: int):
        """Track exercise usage for analytics."""
        # Log to analytics table
        analytics_data = {
            "exercise_name": exercise_name,
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "recognition_confidence": 0.95,  # From parser
            "user_input_language": "he"
        }
        
        # Store in analytics database or send to analytics service
    
    def get_exercise_popularity(self, days: int = 30) -> List[Dict]:
        """Get most popular exercises in the last N days."""
        query = """
        SELECT exercise_name, COUNT(*) as usage_count
        FROM exercises 
        WHERE created_at >= NOW() - INTERVAL '%s days'
        GROUP BY exercise_name 
        ORDER BY usage_count DESC 
        LIMIT 10
        """
        return self.db.execute(query % days).fetchall()
```

---

## ✅ Final Validation Checklist

### Before Release
- [ ] Exercise added to database with correct metadata
- [ ] Hebrew parser recognizes all variations
- [ ] Points calculation logic implemented and tested
- [ ] Frontend components updated
- [ ] All tests pass (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Analytics tracking implemented

### After Release
- [ ] Monitor exercise recognition accuracy
- [ ] Check user feedback on exercise logging
- [ ] Validate points calculation in production
- [ ] Monitor performance impact
- [ ] Update exercise documentation based on usage

---

## 🔧 Common Issues and Solutions

### Issue: Exercise Not Recognized
**Solution**: 
1. Check spelling variations in parser
2. Add more regex patterns
3. Update recognition_patterns in database

### Issue: Wrong Points Calculation
**Solution**:
1. Verify base_points in database
2. Check multipliers in gamification service
3. Test edge cases (high reps, heavy weights)

### Issue: Frontend Not Displaying Exercise
**Solution**:
1. Check exercise options array
2. Verify category and filtering logic
3. Test RTL display for Hebrew text

### Issue: Performance Issues
**Solution**:
1. Add database indexes for exercise queries
2. Optimize regex patterns
3. Cache exercise lookup data

---

This SOP ensures new exercises are properly integrated across the entire SweatBot system with full Hebrew language support and accurate point calculation.