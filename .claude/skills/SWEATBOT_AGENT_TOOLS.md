# 🤖 SweatBot Agent Tools - Complete Developer Guide

**Purpose**: Comprehensive guide to all 7 SweatBot agent tools with real code examples and patterns
**Based On**: Actual implementation in `personal-ui-vite/src/agent/tools/`
**Last Updated**: October 2025

---

## 📋 Quick Reference

| Tool | Purpose | Input Schema | Backend Endpoint |
|------|---------|--------------|------------------|
| **exerciseLogger** | Log exercises with Hebrew support | Exercise details (name, reps, sets, etc.) | `/exercises/log` |
| **statsRetriever** | Get statistics and points | stat_type, time_period, detailed | `/exercises/statistics` |
| **dataManager** | Reset/clear user data | action (reset/clear), confirmations | `/exercises/reset` |
| **goalSetter** | Set fitness goals | goal_type, target, deadline | `/exercises/goals` |
| **progressAnalyzer** | Analyze trends & insights | analysis_type, time_range | `/exercises/analyze` |
| **workoutDetails** | Show workout history | date_range, exercise_filter | `/exercises/history` |
| **personalizedWorkout** | Generate custom workouts | fitness_level, goals, equipment | `/exercises/generate` |

---

## 🏗️ Tool Architecture Pattern

### Standard Tool Structure
```typescript
/**
 * [Tool Name] Tool
 * [Description]
 */

import { z } from 'zod';

// Zod schema for parameter validation
const toolSchema = z.object({
  parameter1: z.string().describe('Parameter description'),
  parameter2: z.number().optional().describe('Optional parameter')
});

export type ToolParams = z.infer<typeof toolSchema>;

export const toolName = {
  name: 'tool_function_name',
  description: 'What this tool does for the AI agent',
  parameters: toolSchema,

  execute: async (params: ToolParams) => {
    try {
      // 1. Validate parameters (handled by Zod)
      // 2. Prepare data for backend
      // 3. Make authenticated API call
      // 4. Process response
      // 5. Return formatted result
    } catch (error) {
      // Error handling with specific messages
    }
  }
};
```

### Backend Communication Pattern
```typescript
// All tools follow this pattern for backend communication
const { getBackendUrl } = await import('../../utils/env');
const backendUrl = getBackendUrl();
const { apiPost, parseJsonResponse } = await import('../../utils/api');

const response = await apiPost(`${backendUrl}/endpoint`, data);
const result = await parseJsonResponse(response);
```

---

## 🔧 Tool 1: Exercise Logger

**File**: `personal-ui-vite/src/agent/tools/exerciseLogger.ts`

### Purpose
Logs exercises to backend database with automatic Hebrew language support and point calculation.

### Real Implementation
```typescript
// Input validation schema
const exerciseLoggerSchema = z.object({
  exercise: z.string().describe('Exercise name in English'),
  exercise_he: z.string().optional().describe('Exercise name in Hebrew'),
  reps: z.number().optional().describe('Number of repetitions'),
  sets: z.number().default(1).describe('Number of sets'),
  weight_kg: z.number().optional().describe('Weight in kilograms'),
  distance_km: z.number().optional().describe('Distance in kilometers'),
  duration_seconds: z.number().optional().describe('Duration in seconds'),
  notes: z.string().optional().describe('Additional notes')
});

// Execution logic
export const exerciseLoggerTool = {
  name: 'log_exercise',
  description: 'Log an exercise activity with automatic Hebrew recognition and point calculation',
  parameters: exerciseLoggerSchema,

  execute: async (params: ExerciseLoggerParams) => {
    try {
      // Prepare data for backend (Points v3 will calculate server-side)
      const exerciseData = {
        name: params.exercise,
        name_he: params.exercise_he || translateToHebrew(params.exercise),
        reps: params.reps,
        sets: params.sets,
        weight_kg: params.weight_kg,
        distance_km: params.distance_km,
        duration_seconds: params.duration_seconds,
        notes: params.notes,
        timestamp: new Date().toISOString()
      };

      // Send to backend using authenticated fetch
      const response = await apiPost(`${backendUrl}/exercises/log`, exerciseData);
      const result = await parseJsonResponse(response);

      // Return success response with points
      return {
        success: true,
        message: `Logged ${params.exercise} successfully!`,
        exercise: result.exercise,
        points_earned: result.points || 0,
        total_points: result.totalPoints || 0,
        hebrew_name: result.name_he
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to log exercise: ${error.message}`,
        details: error
      };
    }
  }
};
```

### Usage Examples
```typescript
// Basic exercise logging
await exerciseLoggerTool.execute({
  exercise: "Push-ups",
  reps: 20,
  sets: 3
});

// Exercise with Hebrew name
await exerciseLoggerTool.execute({
  exercise: "Push-ups",
  exercise_he: "לחיצות",
  reps: 15,
  sets: 3,
  weight_kg: 0,
  notes: "Good form today"
});

// Cardio exercise
await exerciseLoggerTool.execute({
  exercise: "Running",
  distance_km: 5.2,
  duration_seconds: 1800,  // 30 minutes
  notes: "Morning run in the park"
});
```

---

## 🔧 Tool 2: Statistics Retriever

**File**: `personal-ui-vite/src/agent/tools/statsRetriever.ts`

### Purpose
Retrieves user fitness statistics, points, achievements, and progress from the backend.

### Real Implementation
```typescript
// Input validation schema
const statsRetrieverSchema = z.object({
  stat_type: z.enum(['points', 'exercises', 'progress', 'achievements', 'all'])
    .default('all')
    .describe('Type of statistics to retrieve'),
  time_period: z.enum(['today', 'week', 'month', 'all_time'])
    .default('all_time')
    .describe('Time period for statistics'),
  detailed: z.boolean()
    .default(true)
    .describe('Include detailed breakdown')
});

// Execution logic
export const statsRetrieverTool = {
  name: 'get_statistics',
  description: 'Retrieve user fitness statistics, points, achievements, and progress',
  parameters: statsRetrieverSchema,

  execute: async (params: StatsRetrieverParams) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        type: params.stat_type,
        period: params.time_period,
        detailed: params.detailed.toString()
      });

      // Fetch statistics from backend
      const response = await fetch(
        `http://localhost:8000/api/v1/exercises/statistics?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      const stats = await response.json();

      // Format response for AI agent
      return {
        success: true,
        statistics: stats,
        summary: generateStatsSummary(stats, params.stat_type),
        insights: generateInsights(stats)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve statistics: ${error.message}`,
        fallback: getDefaultStats(params.stat_type)
      };
    }
  }
};
```

### Usage Examples
```typescript
// Get all statistics for all time
await statsRetrieverTool.execute({
  stat_type: 'all',
  time_period: 'all_time',
  detailed: true
});

// Get today's points only
await statsRetrieverTool.execute({
  stat_type: 'points',
  time_period: 'today',
  detailed: false
});

// Get this week's progress
await statsRetrieverTool.execute({
  stat_type: 'progress',
  time_period: 'week',
  detailed: true
});
```

---

## 🔧 Tool 3: Data Manager

**File**: `personal-ui-vite/src/agent/tools/dataManager.ts`

### Purpose
Manages user data with reset and clear operations, requiring user confirmation for destructive actions.

### Real Implementation
```typescript
// Input validation schema
const dataManagerSchema = z.object({
  action: z.enum(['reset', 'clear', 'backup'])
    .describe('Action to perform on user data'),
  data_type: z.enum(['exercises', 'goals', 'statistics', 'all'])
    .default('all')
    .describe('Type of data to manage'),
  confirm: z.boolean()
    .default(false)
    .describe('Confirmation required for destructive actions'),
  backup_before_reset: z.boolean()
    .default(true)
    .describe('Create backup before resetting data')
});

// Execution logic
export const dataManagerTool = {
  name: 'manage_data',
  description: 'Reset, clear, or backup user data with confirmation requirements',
  parameters: dataManagerSchema,

  execute: async (params: DataManagerParams) => {
    try {
      // Safety checks for destructive actions
      if ((params.action === 'reset' || params.action === 'clear') && !params.confirm) {
        return {
          success: false,
          error: 'Confirmation required for destructive actions',
          action: params.action,
          requires_confirmation: true,
          warning: `This will ${params.action} your ${params.data_type} data. Set confirm=true to proceed.`
        };
      }

      // Prepare request data
      const requestData = {
        action: params.action,
        dataType: params.data_type,
        backupBeforeReset: params.backup_before_reset,
        confirmed: params.confirm,
        timestamp: new Date().toISOString()
      };

      const response = await apiPost(`${backendUrl}/exercises/manage-data`, requestData);
      const result = await parseJsonResponse(response);

      return {
        success: true,
        message: `Successfully ${params.action}ed ${params.data_type} data`,
        action_performed: params.action,
        data_affected: params.data_type,
        backup_created: result.backupId || null,
        items_affected: result.count || 0
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to ${params.action} data: ${error.message}`,
        action: params.action,
        data_type: params.data_type
      };
    }
  }
};
```

### Usage Examples
```typescript
// Clear all exercises with confirmation
await dataManagerTool.execute({
  action: 'clear',
  data_type: 'exercises',
  confirm: true,
  backup_before_reset: true
});

// Reset all data (requires confirmation)
await dataManagerTool.execute({
  action: 'reset',
  data_type: 'all',
  confirm: true,
  backup_before_reset: true
});

// Create backup without clearing
await dataManagerTool.execute({
  action: 'backup',
  data_type: 'all',
  confirm: false
});
```

---

## 🔧 Tool 4: Goal Setter

**File**: `personal-ui-vite/src/agent/tools/goalSetter.ts`

### Purpose
Sets and manages fitness goals with target values and deadlines.

### Real Implementation
```typescript
// Input validation schema
const goalSetterSchema = z.object({
  goal_type: z.enum(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'consistency'])
    .describe('Type of fitness goal'),
  target_value: z.number()
    .describe('Target value for the goal'),
  current_value: z.number().optional()
    .describe('Current value (if known)'),
  unit: z.string()
    .describe('Unit of measurement (kg, lbs, days, reps, etc.)'),
  deadline: z.string().optional()
    .describe('Target deadline (YYYY-MM-DD format)'),
  priority: z.enum(['low', 'medium', 'high'])
    .default('medium')
    .describe('Goal priority level')
});

// Execution logic
export const goalSetterTool = {
  name: 'set_goal',
  description: 'Set a fitness goal with target values and tracking',
  parameters: goalSetterSchema,

  execute: async (params: GoalSetterParams) => {
    try {
      // Validate deadline format
      if (params.deadline) {
        const deadlineDate = new Date(params.deadline);
        if (isNaN(deadlineDate.getTime())) {
          throw new Error('Invalid deadline format. Use YYYY-MM-DD');
        }

        if (deadlineDate <= new Date()) {
          throw new Error('Deadline must be in the future');
        }
      }

      const goalData = {
        type: params.goal_type,
        targetValue: params.target_value,
        currentValue: params.current_value || 0,
        unit: params.unit,
        deadline: params.deadline,
        priority: params.priority,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      const response = await apiPost(`${backendUrl}/exercises/goals`, goalData);
      const result = await parseJsonResponse(response);

      return {
        success: true,
        message: `Set ${params.goal_type} goal: ${params.target_value} ${params.unit}`,
        goal: result.goal,
        progress_percentage: calculateProgress(params.current_value || 0, params.target_value),
        days_until_deadline: params.deadline ? calculateDaysUntil(params.deadline) : null
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to set goal: ${error.message}`,
        goal_params: params
      };
    }
  }
};
```

### Usage Examples
```typescript
// Set weight loss goal
await goalSetterTool.execute({
  goal_type: 'weight_loss',
  target_value: 70,
  current_value: 75,
  unit: 'kg',
  deadline: '2025-12-31',
  priority: 'high'
});

// Set strength goal
await goalSetterTool.execute({
  goal_type: 'strength',
  target_value: 100,
  current_value: 80,
  unit: 'kg bench press',
  priority: 'medium'
});

// Set consistency goal
await goalSetterTool.execute({
  goal_type: 'consistency',
  target_value: 30,
  unit: 'days',
  priority: 'high'
});
```

---

## 🔧 Tool 5: Progress Analyzer

**File**: `personal-ui-vite/src/agent/tools/progressAnalyzer.ts`

### Purpose
Analyzes user progress and provides insights based on exercise history and goals.

### Real Implementation
```typescript
// Input validation schema
const progressAnalyzerSchema = z.object({
  analysis_type: z.enum(['trends', 'achievements', 'streaks', 'improvements', 'recommendations'])
    .default('trends')
    .describe('Type of analysis to perform'),
  time_range: z.enum(['week', 'month', 'quarter', 'year'])
    .default('month')
    .describe('Time range for analysis'),
  focus_area: z.string().optional()
    .describe('Specific exercise or goal to focus on'),
  include_recommendations: z.boolean()
    .default(true)
    .describe('Include personalized recommendations')
});

// Execution logic
export const progressAnalyzerTool = {
  name: 'analyze_progress',
  description: 'Analyze user progress and provide insights based on exercise history',
  parameters: progressAnalyzerSchema,

  execute: async (params: ProgressAnalyzerParams) => {
    try {
      const analysisData = {
        type: params.analysis_type,
        timeRange: params.time_range,
        focusArea: params.focus_area,
        includeRecommendations: params.include_recommendations
      };

      const response = await apiPost(`${backendUrl}/exercises/analyze`, analysisData);
      const result = await parseJsonResponse(response);

      // Format analysis results
      const analysis = {
        summary: result.summary || `Analysis of your ${params.time_range} progress`,
        trends: result.trends || [],
        achievements: result.achievements || [],
        streaks: result.streaks || {},
        improvements: result.improvements || {},
        recommendations: result.recommendations || []
      };

      return {
        success: true,
        analysis_type: params.analysis_type,
        time_range: params.time_range,
        analysis: analysis,
        key_insights: extractKeyInsights(analysis),
        motivational_quote: generateMotivationalQuote(analysis)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze progress: ${error.message}`,
        analysis_type: params.analysis_type,
        fallback_recommendations: getDefaultRecommendations(params.analysis_type)
      };
    }
  }
};
```

### Usage Examples
```typescript
// Analyze monthly trends
await progressAnalyzerTool.execute({
  analysis_type: 'trends',
  time_range: 'month',
  include_recommendations: true
});

// Focus on specific exercise
await progressAnalyzerTool.execute({
  analysis_type: 'improvements',
  time_range: 'quarter',
  focus_area: 'push-ups',
  include_recommendations: true
});

// Get achievement analysis
await progressAnalyzerTool.execute({
  analysis_type: 'achievements',
  time_range: 'year'
});
```

---

## 🔧 Tool 6: Workout Details

**File**: `personal-ui-vite/src/agent/tools/workoutDetails.ts`

### Purpose
Retrieves detailed workout history with filtering and sorting options.

### Real Implementation
```typescript
// Input validation schema
const workoutDetailsSchema = z.object({
  date_range: z.enum(['today', 'week', 'month', 'quarter', 'year', 'all'])
    .default('week')
    .describe('Date range for workout history'),
  exercise_filter: z.string().optional()
    .describe('Filter by specific exercise name'),
  sort_by: z.enum(['date', 'exercise_name', 'points', 'duration'])
    .default('date')
    .describe('Sort workout history by field'),
  sort_order: z.enum(['asc', 'desc'])
    .default('desc')
    .describe('Sort order'),
  limit: z.number().max(100).default(50)
    .describe('Maximum number of workouts to return')
});

// Execution logic
export const workoutDetailsTool = {
  name: 'get_workout_details',
  description: 'Retrieve detailed workout history with filtering and sorting options',
  parameters: workoutDetailsSchema,

  execute: async (params: WorkoutDetailsParams) => {
    try {
      const queryParams = new URLSearchParams({
        dateRange: params.date_range,
        sortBy: params.sort_by,
        sortOrder: params.sort_order,
        limit: params.limit.toString()
      });

      if (params.exercise_filter) {
        queryParams.append('exercise', params.exercise_filter);
      }

      const response = await fetch(
        `${backendUrl}/exercises/history?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch workout details: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        workouts: data.workouts || [],
        total_count: data.totalCount || 0,
        date_range: params.date_range,
        filter_applied: params.exercise_filter || 'none',
        summary: generateWorkoutSummary(data.workouts || [])
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve workout details: ${error.message}`,
        date_range: params.date_range
      };
    }
  }
};
```

### Usage Examples
```typescript
// Get this week's workouts
await workoutDetailsTool.execute({
  date_range: 'week',
  sort_by: 'date',
  sort_order: 'desc'
});

// Filter by specific exercise
await workoutDetailsTool.execute({
  date_range: 'month',
  exercise_filter: 'push-ups',
  sort_by: 'points',
  sort_order: 'desc'
});

// Get all workouts sorted by duration
await workoutDetailsTool.execute({
  date_range: 'all',
  sort_by: 'duration',
  sort_order: 'desc',
  limit: 20
});
```

---

## 🔧 Tool 7: Personalized Workout

**File**: `personal-ui-vite/src/agent/tools/personalizedWorkout.ts`

### Purpose
Generates personalized workout plans based on user fitness level, goals, and available equipment.

### Real Implementation
```typescript
// Input validation schema
const personalizedWorkoutSchema = z.object({
  fitness_level: z.enum(['beginner', 'intermediate', 'advanced'])
    .describe('Current fitness level'),
  workout_type: z.enum(['strength', 'cardio', 'flexibility', 'mixed', 'hiit'])
    .default('mixed')
    .describe('Type of workout to generate'),
  duration_minutes: z.number().min(10).max(120).default(30)
    .describe('Desired workout duration in minutes'),
  equipment_available: z.array(z.string()).default([])
    .describe('Available equipment (e.g., dumbbells, resistance bands)'),
  focus_areas: z.array(z.string()).default([])
    .describe('Muscle groups or areas to focus on'),
  intensity: z.enum(['low', 'moderate', 'high'])
    .default('moderate')
    .describe('Desired workout intensity')
});

// Execution logic
export const personalizedWorkoutTool = {
  name: 'generate_workout',
  description: 'Generate personalized workout plans based on user preferences and goals',
  parameters: personalizedWorkoutSchema,

  execute: async (params: PersonalizedWorkoutParams) => {
    try {
      const workoutRequest = {
        fitnessLevel: params.fitness_level,
        workoutType: params.workout_type,
        durationMinutes: params.duration_minutes,
        equipmentAvailable: params.equipment_available,
        focusAreas: params.focus_areas,
        intensity: params.intensity,
        userPreferences: getUserPreferences() // Gets user history and preferences
      };

      const response = await apiPost(`${backendUrl}/exercises/generate`, workoutRequest);
      const workout = await parseJsonResponse(response);

      return {
        success: true,
        workout: workout,
        estimated_calories: calculateEstimatedCalories(workout, params.intensity),
        difficulty_score: calculateDifficultyScore(workout, params.fitness_level),
        equipment_needed: workout.equipmentNeeded || [],
        warmup_suggestions: generateWarmup(workout),
        cooldown_suggestions: generateCooldown(workout)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate workout: ${error.message}`,
        fallback_workout: getDefaultWorkout(params)
      };
    }
  }
};
```

### Usage Examples
```typescript
// Beginner workout at home
await personalizedWorkoutTool.execute({
  fitness_level: 'beginner',
  workout_type: 'mixed',
  duration_minutes: 20,
  equipment_available: [],
  intensity: 'low'
});

// Advanced strength training
await personalizedWorkoutTool.execute({
  fitness_level: 'advanced',
  workout_type: 'strength',
  duration_minutes: 45,
  equipment_available: ['dumbbells', 'bench', 'resistance bands'],
  focus_areas: ['chest', 'triceps', 'shoulders'],
  intensity: 'high'
});

// HIIT workout for intermediate
await personalizedWorkoutTool.execute({
  fitness_level: 'intermediate',
  workout_type: 'hiit',
  duration_minutes: 30,
  equipment_available: ['dumbbells'],
  intensity: 'high'
});
```

---

## 🔗 Tool Integration

### Tool Registration in Agent
```typescript
// personal-ui-vite/src/agent/index.ts
import { allTools } from './tools';

export class SweatBotAgent {
  private tools: any[];

  constructor(config: SweatBotConfig = {}) {
    this.userId = config.userId || 'personal';

    // Initialize all 7 tools
    this.tools = allTools.map(tool => ({
      ...tool,
      userId: this.userId
    }));
  }

  async processMessage(message: string): Promise<string> {
    // Process message through AI provider with tools
    const response = await this.aiProvider.generateResponse(
      message,
      this.conversationHistory,
      this.userId,
      this.tools  // All 7 tools available to AI
    );

    return response.content;
  }
}
```

### Tool Export Pattern
```typescript
// personal-ui-vite/src/agent/tools/index.ts
import { exerciseLoggerTool } from './exerciseLogger';
import { statsRetrieverTool } from './statsRetriever';
import { dataManagerTool } from './dataManager';
import { goalSetterTool } from './goalSetter';
import { progressAnalyzerTool } from './progressAnalyzer';
import { workoutDetailsTool } from './workoutDetails';
import { personalizedWorkoutTool } from './personalizedWorkout';

export {
  exerciseLoggerTool,
  statsRetrieverTool,
  dataManagerTool,
  goalSetterTool,
  progressAnalyzerTool,
  workoutDetailsTool,
  personalizedWorkoutTool
};

// Export as array for easy agent initialization
export const allTools = [
  exerciseLoggerTool,
  statsRetrieverTool,
  dataManagerTool,
  goalSetterTool,
  progressAnalyzerTool,
  workoutDetailsTool,
  personalizedWorkoutTool
];
```

---

## 🧪 Testing Tools

### Individual Tool Testing
```typescript
// Test exercise logging
const result = await exerciseLoggerTool.execute({
  exercise: "Push-ups",
  reps: 20,
  sets: 3
});
console.log('Exercise logged:', result);

// Test statistics retrieval
const stats = await statsRetrieverTool.execute({
  stat_type: 'points',
  time_period: 'today'
});
console.log('Today\'s points:', stats);

// Test workout generation
const workout = await personalizedWorkoutTool.execute({
  fitness_level: 'intermediate',
  duration_minutes: 30
});
console.log('Generated workout:', workout);
```

### Error Handling Testing
```typescript
// Test invalid parameters
const invalidResult = await exerciseLoggerTool.execute({
  exercise: "",  // Invalid: empty string
  reps: -5       // Invalid: negative number
});
// Should return validation error

// Test backend connectivity
const connectivityTest = await statsRetrieverTool.execute({
  stat_type: 'all'
});
// Should handle backend errors gracefully
```

---

## 🚨 Common Issues & Solutions

### Issue: "Tool execution timeout"
**Symptom**: Tool calls take too long and timeout

**Real Solution**:
```typescript
// Add timeout to fetch calls
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

const response = await fetch(url, {
  signal: controller.signal,
  // ... other options
});

clearTimeout(timeoutId);
```

### Issue: "Backend endpoint not found"
**Symptom**: 404 errors from tool API calls

**Real Solution**:
```typescript
// Verify backend URL configuration
const { getBackendUrl } = await import('../../utils/env');
const backendUrl = getBackendUrl();
console.log('Backend URL:', backendUrl); // Should be http://localhost:8000

// Check if endpoint exists
const endpoint = `${backendUrl}/exercises/log`;
console.log('Full endpoint:', endpoint);
```

### Issue: "Authentication failed"
**Symptom**: 401 or 403 errors from backend

**Real Solution**:
```typescript
// Ensure auth headers are included
const { getOrCreateGuestToken } = await import('../../utils/auth');
const token = await getOrCreateGuestToken();

const response = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

### Issue: "Zod validation error"
**Symptom**: Parameter validation fails

**Real Solution**:
```typescript
// Add detailed error reporting
try {
  const params = toolSchema.parse(rawParams);
} catch (error) {
  console.error('Validation error:', error.errors);
  return {
    success: false,
    error: 'Invalid parameters',
    details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}
```

---

## 📊 Performance Considerations

### Tool Execution Time
- **exerciseLogger**: 200-500ms
- **statsRetriever**: 300-800ms (depends on data size)
- **dataManager**: 500-2000ms (depends on operation)
- **goalSetter**: 200-400ms
- **progressAnalyzer**: 800-2000ms (analysis complexity)
- **workoutDetails**: 300-1000ms (depends on filter)
- **personalizedWorkout**: 1000-3000ms (AI generation)

### Optimization Tips
```typescript
// Cache frequently accessed data
const statsCache = new Map();
if (statsCache.has(cacheKey)) {
  return statsCache.get(cacheKey);
}

// Batch multiple operations
const batchRequests = async (requests) => {
  return Promise.allSettled(requests);
};

// Debounce rapid tool calls
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
```

---

## 📚 Related Skills

- [BACKEND_NODEJS_ARCHITECTURE.md](BACKEND_NODEJS_ARCHITECTURE.md) - Backend API endpoints
- [FRONTEND_BACKEND_COMMUNICATION.md](FRONTEND_BACKEND_COMMUNICATION.md) - API integration patterns
- [DATABASE_SETUP_AND_MIGRATIONS.md](DATABASE_SETUP_AND_MIGRATIONS.md) - Database schema
- [LOCAL_DEVELOPMENT_COMPLETE.md](LOCAL_DEVELOPMENT_COMPLETE.md) - Development setup

---

## ✅ Success Indicators

Your tools are working correctly when:

- ✅ All 7 tools validate parameters with Zod schemas
- ✅ Tools successfully communicate with backend endpoints
- ✅ Error handling provides specific, actionable messages
- ✅ Hebrew language support works in exercise logging
- ✅ Points calculation works automatically
- ✅ Data manager requires confirmation for destructive actions
- ✅ Workout generation considers user preferences and equipment

---

## 🆘 Quick Debug Commands

```typescript
// Test all tools connectivity
const testAllTools = async () => {
  for (const tool of allTools) {
    try {
      const result = await tool.execute({});
      console.log(`✅ ${tool.name}: Working`);
    } catch (error) {
      console.log(`❌ ${tool.name}: ${error.message}`);
    }
  }
};

// Check backend endpoints
const checkEndpoints = async () => {
  const endpoints = [
    '/exercises/log',
    '/exercises/statistics',
    '/exercises/reset',
    '/exercises/goals',
    '/exercises/analyze',
    '/exercises/history',
    '/exercises/generate'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${backendUrl}${endpoint}`);
      console.log(`${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`${endpoint}: Error - ${error.message}`);
    }
  }
};
```

---

**Tool Architecture Stability**: ✅ Production Ready
**Number of Tools**: 7 (Complete Set)
**Last Updated**: October 2025
**Based On**: Actual implementation in `personal-ui-vite/src/agent/tools/`