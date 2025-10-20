/**
 * Workout Planner Skill
 * Creates personalized workout plans based on user goals, preferences, and available equipment
 */

import { z } from 'zod';
import {
  BaseSkill,
  SkillCategory,
  SkillContext,
  SkillResult,
  ValidationResult
} from '../core/types';

// Schema for workout planning input
const workoutPlannerSchema = z.object({
  goal: z.enum(['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness', 'flexibility']).describe('Primary fitness goal'),
  duration: z.number().min(10).max(120).describe('Workout duration in minutes'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('Current fitness level'),
  equipment: z.array(z.string()).default([]).describe('Available equipment'),
  focusAreas: z.array(z.string()).optional().describe('Specific muscle groups or areas to focus on'),
  workoutType: z.enum(['full_body', 'upper_body', 'lower_body', 'push_pull', 'cardio', 'hiit', 'flexibility']).optional().describe('Type of workout structure'),
  intensity: z.enum(['low', 'moderate', 'high']).optional().describe('Desired workout intensity'),
  preferences: z.object({
    includeCardio: z.boolean().default(true),
    includeWarmup: z.boolean().default(true),
    includeCooldown: z.boolean().default(true),
    exercisesPerWorkout: z.number().min(3).max(12).default(6),
    restPreference: z.enum(['short', 'medium', 'long']).default('medium')
  }).optional().describe('Workout preferences')
});

export type WorkoutPlannerParams = z.infer<typeof workoutPlannerSchema>;

export class WorkoutPlannerSkill extends BaseSkill {
  public readonly id = 'workout_planner';
  public readonly name = 'Intelligent Workout Planner';
  public readonly description = 'Creates personalized, structured workout plans based on goals, equipment, and preferences';
  public readonly version = '1.0.0';
  public readonly category = SkillCategory.WORKOUT_PLANNING;

  public readonly tags = ['planning', 'workout', 'personalized', 'structure', 'goals', 'he', 'en'];
  public readonly dependencies = [];

  public readonly config = {
    timeout: 10000,
    retryAttempts: 2,
    requiresBackend: true,
    cacheable: true,
    memoryUsage: 'medium' as const,
    cpuUsage: 'high' as const,
    requiresAuth: true,
    permissions: ['read_user_profile', 'read_exercises', 'write_workout_plans'],
    compatibleSkills: ['exercise_analyzer', 'progress_tracker', 'motivation_booster'],
    conflictsWith: []
  };

  public validate(input: any): ValidationResult {
    try {
      const parsed = workoutPlannerSchema.parse(input);
      return {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedInput: parsed
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: []
        };
      }
      return {
        isValid: false,
        errors: ['Invalid input format'],
        warnings: []
      };
    }
  }

  public getSchema(): z.ZodSchema {
    return workoutPlannerSchema;
  }

  public async execute(input: WorkoutPlannerParams, context: SkillContext): Promise<SkillResult> {
    try {
      // Get user's exercise history for personalization
      const exerciseHistory = await this.getExerciseHistory(context);

      // Generate workout plan
      const workoutPlan = this.generateWorkoutPlan(input, exerciseHistory, context);

      // Calculate estimated calories and intensity
      const metrics = this.calculateWorkoutMetrics(workoutPlan, input);

      // Create progress tracking recommendations
      const trackingRecommendations = this.generateTrackingRecommendations(workoutPlan);

      // Create workout visualizations
      const visualizations = this.createWorkoutVisualizations(workoutPlan, metrics);

      return this.createSuccessResult({
        workoutPlan,
        metrics,
        estimatedCalories: metrics.calories,
        difficulty: this.assessDifficulty(workoutPlan, input),
        muscleGroups: this.getMuscleGroups(workoutPlan),
        equipmentNeeded: this.getEquipmentNeeded(workoutPlan),
        progressionPath: this.createProgressionPath(input, workoutPlan)
      }, [
        `Generated ${workoutPlan.exercises.length}-exercise workout plan`,
        `Estimated duration: ${workoutPlan.totalDuration} minutes`,
        `Target intensity: ${input.intensity || 'moderate'}`,
        `Personalized for ${input.fitnessLevel} fitness level`
      ], [
        'Follow the exercise order for optimal performance',
        'Rest periods are designed for your fitness level',
        'Track your performance to enable progressive overload'
      ], [
        'Complete this workout 2-3 times per week',
        'Track weights, reps, and perceived exertion',
        'Gradually increase intensity as you progress'
      ], visualizations);

    } catch (error) {
      console.error('Workout planning error:', error);
      return this.createErrorResult('Failed to generate workout plan. Please try again.');
    }
  }

  private async getExerciseHistory(context: SkillContext): Promise<any[]> {
    try {
      const response = await this.callBackend('/api/v1/exercises/history', {
        userId: context.userId,
        limit: 20
      }, context);
      return response.exercises || [];
    } catch (error) {
      console.warn('Could not fetch exercise history:', error);
      return [];
    }
  }

  private generateWorkoutPlan(input: WorkoutPlannerParams, exerciseHistory: any[], context: SkillContext) {
    const workoutPlan = {
      name: this.generateWorkoutName(input),
      goal: input.goal,
      duration: input.duration,
      exercises: [] as any[],
      totalDuration: 0,
      sections: {
        warmup: { duration: 0, exercises: [] as any[] },
        main: { duration: 0, exercises: [] as any[] },
        cooldown: { duration: 0, exercises: [] as any[] }
      }
    };

    const preferences = input.preferences || {};

    // Generate warmup
    if (preferences.includeWarmup) {
      const warmupExercises = this.generateWarmup(input);
      workoutPlan.sections.warmup = {
        duration: warmupExercises.reduce((sum, ex) => sum + ex.duration, 0),
        exercises: warmupExercises
      };
    }

    // Generate main workout
    const mainExercises = this.generateMainWorkout(input, exerciseHistory);
    workoutPlan.sections.main = {
      duration: mainExercises.reduce((sum, ex) => sum + (ex.duration + (ex.rest || 0)), 0),
      exercises: mainExercises
    };

    // Generate cooldown
    if (preferences.includeCooldown) {
      const cooldownExercises = this.generateCooldown(input);
      workoutPlan.sections.cooldown = {
        duration: cooldownExercises.reduce((sum, ex) => sum + ex.duration, 0),
        exercises: cooldownExercises
      };
    }

    // Calculate total duration
    workoutPlan.totalDuration = Object.values(workoutPlan.sections)
      .reduce((sum, section) => sum + section.duration, 0);

    // Flatten exercises for easier access
    workoutPlan.exercises = [
      ...workoutPlan.sections.warmup.exercises,
      ...workoutPlan.sections.main.exercises,
      ...workoutPlan.sections.cooldown.exercises
    ];

    return workoutPlan;
  }

  private generateWorkoutName(input: WorkoutPlannerParams): string {
    const goalNames = {
      weight_loss: 'Fat Burning',
      muscle_gain: 'Muscle Building',
      strength: 'Strength Training',
      endurance: 'Endurance Builder',
      general_fitness: 'Full Body Fitness',
      flexibility: 'Flexibility & Mobility'
    };

    const intensity = input.intensity ? ` ${input.intensity.charAt(0).toUpperCase() + input.intensity.slice(1)}` : '';
    return `${goalNames[input.goal]}${intensity} Workout`;
  }

  private generateWarmup(input: WorkoutPlannerParams): any[] {
    const warmupExercises = [
      {
        name: 'Light Cardio',
        hebrewName: 'קרדיו קל',
        type: 'cardio',
        duration: Math.min(5, input.duration * 0.1),
        intensity: 'low',
        instructions: 'Start with light jogging, jumping jacks, or cycling'
      },
      {
        name: 'Dynamic Stretching',
        hebrewName: 'מתיחות דינמי',
        type: 'stretching',
        duration: Math.min(5, input.duration * 0.1),
        intensity: 'low',
        instructions: 'Arm circles, leg swings, torso twists, hip circles'
      }
    ];

    return warmupExercises.filter(ex => ex.duration > 0);
  }

  private generateMainWorkout(input: WorkoutPlannerParams, exerciseHistory: any[]): any[] {
    const exerciseDatabase = this.getExerciseDatabase(input.equipment);
    const exercises = [];

    // Select exercises based on goal and workout type
    const selectedExercises = this.selectExercisesForGoal(input, exerciseDatabase);

    // Personalize based on exercise history
    const personalizedExercises = this.personalizeExercises(selectedExercises, exerciseHistory, input.fitnessLevel);

    // Calculate sets, reps, and rest
    personalizedExercises.forEach(exercise => {
      const exercisePlan = this.calculateExerciseParameters(exercise, input, exerciseHistory);
      exercises.push(exercisePlan);
    });

    // Adjust for total duration
    return this.adjustForDuration(exercises, input.duration, input.preferences);
  }

  private generateCooldown(input: WorkoutPlannerParams): any[] {
    const cooldownExercises = [
      {
        name: 'Static Stretching',
        hebrewName: 'מתיחות סטטיות',
        type: 'stretching',
        duration: Math.min(5, input.duration * 0.1),
        intensity: 'low',
        instructions: 'Hold each stretch for 20-30 seconds, focus on major muscle groups'
      },
      {
        name: 'Breathing & Recovery',
        hebrewName: 'נשימות והתאושרות',
        type: 'recovery',
        duration: Math.min(3, input.duration * 0.05),
        intensity: 'low',
        instructions: 'Deep breathing exercises, light walking'
      }
    ];

    return cooldownExercises.filter(ex => ex.duration > 0);
  }

  private getExerciseDatabase(equipment: string[]): any[] {
    const allExercises = [
      // Bodyweight exercises
      { name: 'Push-ups', hebrewName: 'לחיצות', type: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'], equipment: [], difficulty: 'intermediate' },
      { name: 'Squats', hebrewName: 'סקוואטים', type: 'strength', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipment: [], difficulty: 'beginner' },
      { name: 'Lunges', hebrewName: 'לאנג\'ים', type: 'strength', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipment: [], difficulty: 'beginner' },
      { name: 'Plank', hebrewName: 'פלאנק', type: 'strength', muscleGroups: ['core', 'shoulders'], equipment: [], difficulty: 'beginner' },
      { name: 'Burpees', hebrewName: 'ברפי', type: 'cardio', muscleGroups: ['full_body'], equipment: [], difficulty: 'advanced' },

      // Dumbbell exercises
      { name: 'Dumbbell Bench Press', hebrewName: 'לחיצות עם משקולות', type: 'strength', muscleGroups: ['chest', 'shoulders', 'triceps'], equipment: ['dumbbells'], difficulty: 'intermediate' },
      { name: 'Dumbbell Rows', hebrewName: 'שורים עם משקולות', type: 'strength', muscleGroups: ['back', 'biceps'], equipment: ['dumbbells'], difficulty: 'intermediate' },
      { name: 'Dumbbell Shoulder Press', hebrewName: 'לחיצות כתפיים עם משקולות', type: 'strength', muscleGroups: ['shoulders', 'triceps'], equipment: ['dumbbells'], difficulty: 'intermediate' },

      // Cardio exercises
      { name: 'Jumping Jacks', hebrewName: 'קפיצות פתוחות', type: 'cardio', muscleGroups: ['full_body'], equipment: [], difficulty: 'beginner' },
      { name: 'High Knees', hebrewName: 'ברכיים גבוהות', type: 'cardio', muscleGroups: ['legs', 'cardio'], equipment: [], difficulty: 'beginner' },
      { name: 'Mountain Climbers', hebrewName: 'מטפסי הרים', type: 'cardio', muscleGroups: ['core', 'shoulders', 'legs'], equipment: [], difficulty: 'intermediate' }
    ];

    return allExercises.filter(exercise =>
      exercise.equipment.length === 0 ||
      exercise.equipment.some(eq => equipment.includes(eq))
    );
  }

  private selectExercisesForGoal(input: WorkoutPlannerParams, exerciseDatabase: any[]): any[] {
    let exercises = [];

    switch (input.goal) {
      case 'weight_loss':
        exercises = exerciseDatabase.filter(ex => ex.type === 'cardio' || ex.difficulty === 'intermediate');
        break;
      case 'muscle_gain':
        exercises = exerciseDatabase.filter(ex => ex.type === 'strength' && ex.difficulty !== 'beginner');
        break;
      case 'strength':
        exercises = exerciseDatabase.filter(ex => ex.type === 'strength');
        break;
      case 'endurance':
        exercises = exerciseDatabase.filter(ex => ex.type === 'cardio' || ex.muscleGroups.includes('legs'));
        break;
      case 'general_fitness':
        exercises = exerciseDatabase;
        break;
      case 'flexibility':
        exercises = exerciseDatabase.filter(ex => ex.type === 'stretching');
        break;
      default:
        exercises = exerciseDatabase;
    }

    // Filter by workout type if specified
    if (input.workoutType) {
      exercises = this.filterByWorkoutType(exercises, input.workoutType);
    }

    // Filter by focus areas if specified
    if (input.focusAreas && input.focusAreas.length > 0) {
      exercises = exercises.filter(ex =>
        ex.muscleGroups.some(mg => input.focusAreas!.includes(mg))
      );
    }

    // Return appropriate number of exercises
    const targetCount = input.preferences?.exercisesPerWorkout || 6;
    return exercises.slice(0, targetCount);
  }

  private filterByWorkoutType(exercises: any[], workoutType: string): any[] {
    switch (workoutType) {
      case 'upper_body':
        return exercises.filter(ex =>
          ex.muscleGroups.some(mg => ['chest', 'shoulders', 'back', 'biceps', 'triceps'].includes(mg))
        );
      case 'lower_body':
        return exercises.filter(ex =>
          ex.muscleGroups.some(mg => ['quads', 'glutes', 'hamstrings', 'calves'].includes(mg))
        );
      case 'push_pull':
        return exercises; // Would need more complex logic for push/pull split
      case 'cardio':
        return exercises.filter(ex => ex.type === 'cardio');
      case 'hiit':
        return exercises.filter(ex => ex.type === 'cardio' || ex.difficulty === 'advanced');
      case 'flexibility':
        return exercises.filter(ex => ex.type === 'stretching');
      default:
        return exercises;
    }
  }

  private personalizeExercises(exercises: any[], exerciseHistory: any[], fitnessLevel: string): any[] {
    // Simple personalization - avoid overusing exercises the user has done recently
    const recentExercises = new Set(
      exerciseHistory
        .slice(-5)
        .map(ex => ex.name.toLowerCase())
    );

    return exercises.map(exercise => ({
      ...exercise,
      personalization: {
        recentlyUsed: recentExercises.has(exercise.name.toLowerCase()),
        difficulty: this.adjustDifficulty(exercise.difficulty, fitnessLevel),
        notes: this.generatePersonalizationNotes(exercise, exerciseHistory, fitnessLevel)
      }
    }));
  }

  private adjustDifficulty(baseDifficulty: string, fitnessLevel: string): string {
    if (fitnessLevel === 'beginner' && baseDifficulty === 'advanced') {
      return 'intermediate';
    }
    if (fitnessLevel === 'advanced' && baseDifficulty === 'beginner') {
      return 'intermediate';
    }
    return baseDifficulty;
  }

  private generatePersonalizationNotes(exercise: any, exerciseHistory: any[], fitnessLevel: string): string[] {
    const notes = [];

    if (fitnessLevel === 'beginner') {
      notes.push('Focus on proper form');
      notes.push('Start with bodyweight or light weights');
    } else if (fitnessLevel === 'advanced') {
      notes.push('Consider progressive overload');
      notes.push('Focus on mind-muscle connection');
    }

    const history = exerciseHistory.filter(ex => ex.name === exercise.name);
    if (history.length > 0) {
      notes.push(`You've done this exercise ${history.length} times before`);
    }

    return notes;
  }

  private calculateExerciseParameters(exercise: any, input: WorkoutPlannerParams, exerciseHistory: any[]): any {
    const baseParameters = this.getBaseParameters(exercise, input.fitnessLevel, input.intensity);

    // Adjust based on exercise history
    const history = exerciseHistory.filter(ex => ex.name === exercise.name);
    if (history.length > 0) {
      const lastSession = history[history.length - 1];
      if (lastSession.performance) {
        // Slight progressive overload
        if (lastSession.performance.reps) {
          baseParameters.reps = Math.ceil(lastSession.performance.reps * 1.05);
        }
        if (lastSession.performance.weight_kg) {
          baseParameters.weight = lastSession.performance.weight_kg;
        }
      }
    }

    return {
      ...exercise,
      ...baseParameters,
      duration: this.calculateExerciseDuration(exercise, baseParameters),
      rest: this.calculateRestPeriod(exercise, input.preferences?.restPreference)
    };
  }

  private getBaseParameters(exercise: any, fitnessLevel: string, intensity?: string): any {
    const parameters = {
      sets: 3,
      reps: 12,
      weight: null,
      duration: 30
    };

    // Adjust for fitness level
    switch (fitnessLevel) {
      case 'beginner':
        parameters.sets = 2;
        parameters.reps = 10;
        break;
      case 'advanced':
        parameters.sets = 4;
        parameters.reps = 15;
        break;
    }

    // Adjust for intensity
    if (intensity === 'high') {
      parameters.reps = Math.ceil(parameters.reps * 1.2);
      parameters.sets = Math.min(parameters.sets + 1, 5);
    } else if (intensity === 'low') {
      parameters.reps = Math.floor(parameters.reps * 0.8);
      parameters.sets = Math.max(parameters.sets - 1, 2);
    }

    // Exercise-specific adjustments
    if (exercise.type === 'cardio') {
      parameters.sets = 1;
      parameters.duration = fitnessLevel === 'beginner' ? 30 : fitnessLevel === 'advanced' ? 60 : 45;
    }

    return parameters;
  }

  private calculateExerciseDuration(exercise: any, parameters: any): number {
    if (exercise.type === 'cardio') {
      return parameters.duration;
    }

    // Strength exercises: ~3 seconds per rep + setup time
    const repTime = parameters.reps * 3;
    const setupTime = 30;
    return repTime + setupTime;
  }

  private calculateRestPeriod(exercise: any, preference?: string): number {
    const baseRest = exercise.type === 'cardio' ? 30 : 60;

    switch (preference) {
      case 'short':
        return baseRest * 0.75;
      case 'long':
        return baseRest * 1.5;
      default:
        return baseRest;
    }
  }

  private adjustForDuration(exercises: any[], targetDuration: number, preferences?: any): any[] {
    const currentDuration = exercises.reduce((sum, ex) => sum + (ex.duration + (ex.rest || 0)), 0);

    if (currentDuration <= targetDuration) {
      return exercises;
    }

    // Scale down if too long
    const scaleFactor = targetDuration / currentDuration;

    return exercises.map(exercise => ({
      ...exercise,
      duration: Math.floor(exercise.duration * scaleFactor),
      rest: Math.floor((exercise.rest || 60) * scaleFactor)
    }));
  }

  private calculateWorkoutMetrics(workoutPlan: any, input: WorkoutPlannerParams): any {
    const totalActiveTime = workoutPlan.exercises
      .filter(ex => ex.type !== 'recovery')
      .reduce((sum, ex) => sum + ex.duration, 0);

    const calories = Math.round(totalActiveTime * 8 * (input.intensity === 'high' ? 1.3 : input.intensity === 'low' ? 0.7 : 1.0));

    const averageHeartRate = input.intensity === 'high' ? 160 : input.intensity === 'low' ? 120 : 140;

    return {
      calories,
      estimatedHeartRate: averageHeartRate,
      activeTime: totalActiveTime,
      totalTime: workoutPlan.totalDuration,
      intensity: input.intensity || 'moderate'
    };
  }

  private assessDifficulty(workoutPlan: any, input: WorkoutPlannerParams): string {
    const baseDifficulty = input.fitnessLevel;

    // Adjust based on workout complexity
    const complexExercises = workoutPlan.exercises.filter(ex => ex.difficulty === 'advanced').length;
    const totalExercises = workoutPlan.exercises.length;

    if (complexExercises / totalExercises > 0.5) {
      return baseDifficulty === 'beginner' ? 'intermediate' : 'advanced';
    }

    return baseDifficulty;
  }

  private getMuscleGroups(workoutPlan: any): string[] {
    const muscleGroups = new Set<string>();

    workoutPlan.exercises.forEach(exercise => {
      if (exercise.muscleGroups) {
        exercise.muscleGroups.forEach((mg: string) => muscleGroups.add(mg));
      }
    });

    return Array.from(muscleGroups);
  }

  private getEquipmentNeeded(workoutPlan: any): string[] {
    const equipment = new Set<string>();

    workoutPlan.exercises.forEach(exercise => {
      if (exercise.equipment) {
        exercise.equipment.forEach((eq: string) => equipment.add(eq));
      }
    });

    return Array.from(equipment);
  }

  private createProgressionPath(input: WorkoutPlannerParams, workoutPlan: any): any[] {
    const progression = [];

    // Week 1-2: Foundation
    progression.push({
      phase: 'Foundation',
      duration: '2 weeks',
      focus: 'Master form and build consistency',
      modifications: 'Focus on proper technique, use lighter weights if needed'
    });

    // Week 3-4: Intensity increase
    progression.push({
      phase: 'Intensity Building',
      duration: '2 weeks',
      focus: 'Increase weight or reps',
      modifications: 'Add 5-10% weight or 1-2 reps per set'
    });

    // Week 5-8: Advanced variations
    progression.push({
      phase: 'Advanced Progression',
      duration: '4 weeks',
      focus: 'Add complexity and volume',
      modifications: 'Introduce exercise variations, increase sets or decrease rest'
    });

    return progression;
  }

  private generateTrackingRecommendations(workoutPlan: any): string[] {
    return [
      'Track weight, reps, and sets for each exercise',
      'Rate perceived exertion (1-10 scale)',
      'Note any form issues or discomfort',
      'Take progress photos every 2 weeks',
      'Measure key metrics weekly'
    ];
  }

  private createWorkoutVisualizations(workoutPlan: any, metrics: any): any[] {
    return [
      {
        type: 'chart' as const,
        title: 'Workout Timeline',
        data: {
          labels: workoutPlan.exercises.map(ex => ex.name),
          datasets: [{
            label: 'Exercise Duration',
            data: workoutPlan.exercises.map(ex => ex.duration),
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
          }]
        },
        config: {
          type: 'bar',
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: 'Exercise Duration Timeline' }
            }
          }
        }
      },
      {
        type: 'progress' as const,
        title: 'Muscle Group Activation',
        data: this.getMuscleGroups(workoutPlan).map(mg => ({
          name: mg,
          activation: Math.random() * 40 + 60
        }))
      }
    ];
  }
}