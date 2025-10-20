# SweatBot Skills System - Complete Documentation

## Overview

The SweatBot Skills System is an advanced framework that extends the existing tool system with sophisticated AI-powered capabilities. Built following Anthropic's skills best practices, it provides composable, portable, and efficient fitness-focused skills that can work together seamlessly.

## Architecture

### Core Components

```
src/skills/
├── core/
│   ├── types.ts          # Core interfaces and types
│   ├── registry.ts       # Skill registration and discovery
│   ├── engine.ts         # Skill execution engine
│   └── index.ts          # Core exports
├── fitness/
│   ├── exerciseAnalyzer.ts    # Advanced exercise analysis
│   └── workoutPlanner.ts       # Personalized workout planning
├── health/
│   └── healthMonitor.ts        # Comprehensive health monitoring
├── nutrition/
│   └── nutritionTracker.ts      # Advanced nutrition tracking
└── index.ts               # Main entry point
```

### Key Design Principles

1. **Composable**: Skills can work together, with automatic identification and coordination
2. **Portable**: Same format across different Claude applications
3. **Efficient**: Only loads what's needed when needed
4. **Secure**: Maintains the existing secure backend proxy pattern
5. **TypeScript-First**: Full type safety and IntelliSense support

## Available Skills

### 1. Exercise Analyzer (`exercise_analyzer`)

**Purpose**: Provides deep analysis of exercise performance, form recommendations, and personalized insights.

**Key Features**:
- Historical performance analysis and trend identification
- Exercise-specific form recommendations
- Performance scoring and improvement tracking
- Personal record detection
- Muscle group activation visualization

**Input Schema**:
```typescript
{
  exerciseName: string,           // Exercise name
  performance?: {                // Optional performance metrics
    reps?: number,
    sets?: number,
    weight?: number,
    duration?: number,
    distance?: number,
    restTime?: number
  },
  goals?: string[],              // User goals
  equipment?: string[],          // Available equipment
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced',
  previousSessions?: Array<{     // Historical data
    date: string,
    performance: any
  }>
}
```

**Usage Examples**:
- "Analyze my squat performance from today"
- "Give me form recommendations for push-ups"
- "How am I progressing with my running?"
- "Check my personal records for this month"

### 2. Workout Planner (`workout_planner`)

**Purpose**: Creates personalized workout plans based on goals, equipment, and preferences.

**Key Features**:
- Goal-based workout generation
- Equipment-aware exercise selection
- Progressive overload planning
- Calorie and intensity estimation
- Warmup and cooldown integration
- Muscle group targeting

**Input Schema**:
```typescript
{
  goal: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness' | 'flexibility',
  duration: number,               // Workout duration in minutes (10-120)
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  equipment: string[],           // Available equipment
  focusAreas?: string[],         // Specific muscle groups
  workoutType?: 'full_body' | 'upper_body' | 'lower_body' | 'push_pull' | 'cardio' | 'hiit',
  intensity?: 'low' | 'moderate' | 'high',
  preferences?: {
    includeCardio?: boolean,
    includeWarmup?: boolean,
    includeCooldown?: boolean,
    exercisesPerWorkout?: number,
    restPreference?: 'short' | 'medium' | 'long'
  }
}
```

**Usage Examples**:
- "Create a 30-minute workout for weight loss"
- "Plan a strength workout with dumbbells"
- "Design a full-body routine for beginners"
- "Generate a HIIT workout with no equipment"

### 3. Health Monitor (`health_monitor`)

**Purpose**: Comprehensive health metrics tracking with insights and recommendations.

**Key Features**:
- Multi-metric health analysis (heart rate, blood pressure, sleep, stress, energy)
- Health scoring and trend analysis
- Personalized recommendations based on patterns
- Goal progress tracking
- Health alert system
- Visualization dashboards

**Input Schema**:
```typescript
{
  metrics: {
    heartRate?: number,           // BPM
    bloodPressure?: {             // Systolic/Diastolic
      systolic: number,
      diastolic: number
    },
    weight?: number,              // kg
    sleep?: {                     // Sleep data
      hours: number,
      quality: 'poor' | 'fair' | 'good' | 'excellent'
    },
    stress?: number,              // 1-10 scale
    energy?: number,              // 1-10 scale
    water?: number,               // Liters
    steps?: number                // Steps count
  },
  timeframe?: 'today' | 'week' | 'month',
  goals?: {
    targetWeight?: number,
    targetSleep?: number,
    targetSteps?: number,
    targetWater?: number
  }
}
```

**Usage Examples**:
- "Analyze my health metrics from today"
- "Check my sleep quality trends this week"
- "Am I drinking enough water?"
- "How's my overall health score?"

### 4. Nutrition Tracker (`nutrition_tracker`)

**Purpose**: Advanced nutrition tracking with meal analysis and dietary recommendations.

**Key Features**:
- Meal analysis with macro breakdown
- Calorie and macro goal tracking
- Food database integration
- Personalized meal suggestions
- Nutrition scoring and insights
- Dietary preference support (vegetarian, vegan, etc.)

**Input Schema**:
```typescript
{
  meal?: {                       // Meal to log
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'post_workout',
    foods: [{
      name: string,
      quantity: number,
      unit: string,
      calories?: number,
      protein?: number,
      carbs?: number,
      fat?: number,
      fiber?: number
    }],
    time?: string,               // HH:MM format
    rating?: number               // 1-10 satisfaction
  },
  dailyGoals?: {
    calories?: number,
    protein?: number,
    carbs?: number,
    fat?: number,
    fiber?: number,
    water?: number
  },
  timeframe?: 'today' | 'week' | 'month',
  preferences?: {
    diet?: 'omnivore' | 'vegetarian' | 'vegan' | 'paleo' | 'keto' | 'mediterranean',
    allergies?: string[],
    restrictions?: string[],
    favorites?: string[]
  }
}
```

**Usage Examples**:
- "Log my lunch: chicken salad with dressing"
- "Analyze my nutrition for today"
- "Am I getting enough protein?"
- "Suggest healthy snacks for my diet"

## Integration with Existing System

### Enhanced Agent

The `EnhancedSweatBotAgent` seamlessly integrates skills with the existing tool system:

```typescript
import { getEnhancedSweatBotAgent } from './agent/enhancedAgent';

const agent = getEnhancedSweatBotAgent({
  userId: 'user123',
  enableSkills: true,           // Enable skills system
  userPreferences: {
    fitnessLevel: 'intermediate',
    goals: ['muscle_gain', 'endurance'],
    equipment: ['dumbbells'],
    language: 'he'
  }
});
```

### Automatic Skill Selection

The agent automatically detects user intent and selects appropriate skills:

- Exercise analysis requests → `exercise_analyzer`
- Workout planning requests → `workout_planner`
- Health monitoring requests → `health_monitor`
- Nutrition tracking requests → `nutrition_tracker`

### Skill Chaining

Skills can work together for comprehensive analysis:

```typescript
// Example: Exercise analysis → Workout planning → Progress tracking
const exerciseResult = await skillEngine.executeSkill('exercise_analyzer', input, context);
const workoutResult = await skillEngine.executeSkill('workout_planner',
  { basedOnAnalysis: exerciseResult.data }, context);
```

## Usage Examples

### Example 1: Complete Workout Session

**User**: "Create a 45-minute strength workout and analyze my squat form"

**Agent Response**:
1. Activates `workout_planner` skill
2. Generates personalized 45-minute strength workout
3. Activates `exercise_analyzer` skill
4. Provides squat form recommendations
5. Integrates both results into comprehensive response

### Example 2: Health Check with Nutrition

**User**: "Check my health today and log my breakfast"

**Agent Response**:
1. Activates `health_monitor` skill
2. Analyzes today's health metrics
3. Activates `nutrition_tracker` skill
4. Logs breakfast meal
5. Provides combined health and nutrition insights

### Example 3: Progressive Planning

**User**: "Based on my progress this month, plan next week's workouts"

**Agent Response**:
1. Uses historical data analysis
2. Activates multiple skills as needed
3. Creates progressive workout plan
4. Provides recommendations for improvement

## Configuration

### Skill Registration

Skills are automatically registered on import:

```typescript
import { initializeSkills } from './skills';

// This registers all available skills
initializeSkills();
```

### Skill Configuration

Each skill has configurable options:

```typescript
const skillConfig = {
  timeout: 8000,              // Execution timeout
  retryAttempts: 2,           // Retry attempts on failure
  requiresBackend: true,       // Whether backend calls are needed
  cacheable: true,            // Whether results can be cached
  memoryUsage: 'medium',      // Memory usage level
  requiresAuth: true,         // Authentication required
  compatibleSkills: ['other_skill_id'],
  conflictsWith: []
};
```

## Error Handling

### Skill Execution Errors

```typescript
try {
  const result = await skillEngine.executeSkill('exercise_analyzer', input, context);
  if (result.success) {
    // Handle successful result
    console.log('Analysis completed:', result.data);
  } else {
    // Handle skill failure
    console.error('Skill failed:', result.error);
  }
} catch (error) {
  console.error('Skill execution error:', error);
}
```

### Graceful Degradation

The system gracefully degrades to tools-only mode if skills fail:

```typescript
// If skills system fails, continue with basic tools
if (skillsEnabled && skillError) {
  console.warn('Skills unavailable, using tools only');
  // Continue with original tool-based responses
}
```

## Performance Considerations

### Caching

- Skill results are cached for 5 minutes by default
- Cache key includes user ID, input hash, and preferences
- Cache automatically clears on system restart

### Memory Usage

- Skills are loaded on-demand
- Large analysis results are streamed
- Memory usage monitored and limited

### Execution Time

- Average skill execution: 2-8 seconds
- Complex analysis: up to 15 seconds
- Timeout protection prevents hanging

## Security Considerations

### Backend Integration

- All skills use the existing secure backend proxy
- No API keys or sensitive data in frontend
- Authentication tokens managed centrally

### Data Privacy

- Health and nutrition data processed securely
- Personal preferences stored encrypted
- Audit trail for all skill executions

## Extending the System

### Creating New Skills

1. Extend `BaseSkill` class:

```typescript
export class MyCustomSkill extends BaseSkill {
  public readonly id = 'my_custom_skill';
  public readonly name = 'My Custom Skill';
  public readonly category = SkillCategory.CUSTOM;

  public validate(input: any): ValidationResult {
    // Validate input
  }

  public async execute(input: any, context: SkillContext): Promise<SkillResult> {
    // Execute skill logic
  }
}
```

2. Register the skill:

```typescript
skillRegistry.register(new MyCustomSkill());
```

### Custom Categories

Add new categories to the `SkillCategory` enum:

```typescript
export enum SkillCategory {
  // Existing categories...
  CUSTOM = 'custom',
  SPECIALIZED = 'specialized'
}
```

## Troubleshooting

### Common Issues

1. **Skill not found**: Check if skill is registered
2. **Timeout errors**: Increase timeout in skill config
3. **Authentication errors**: Verify backend connection
4. **Memory issues**: Reduce skill complexity or data size

### Debug Mode

Enable debug logging:

```typescript
// In skill constructor
this.debugMode = true;

// In skill execution
if (this.debugMode) {
  console.log('Skill execution started:', skillId, input);
}
```

### Performance Monitoring

Monitor skill performance:

```typescript
const stats = skillEngine.getCacheStats();
console.log('Cache stats:', stats);
```

## Best Practices

### For Developers

1. Always validate input before processing
2. Use proper TypeScript types
3. Handle errors gracefully
4. Provide meaningful error messages
5. Include performance metrics

### For Users

1. Provide specific and detailed input
2. Use natural language for requests
3. Follow skill recommendations
4. Track progress consistently
5. Update preferences regularly

## Future Enhancements

### Planned Features

1. **Real-time biometric integration**
2. **AI-powered meal recognition from photos**
3. **Social sharing and community features**
4. **Integration with fitness trackers**
5. **Voice input support**

### Advanced Analytics

1. **Machine learning for personalization**
2. **Predictive health insights**
3. **Automated workout optimization**
4. **Nutrition pattern recognition**

## Support

For issues, questions, or feature requests:

1. Check the troubleshooting section above
2. Review the skill-specific documentation
3. Enable debug mode for detailed logs
4. Contact the development team

---

*Last Updated: October 2025*
*Version: 1.0.0*
*Framework: SweatBot Skills System*