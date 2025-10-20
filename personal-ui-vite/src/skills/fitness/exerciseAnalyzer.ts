/**
 * Exercise Analysis Skill
 * Advanced analysis of exercise patterns, form recommendations, and performance insights
 */

import { z } from 'zod';
import {
  BaseSkill,
  SkillCategory,
  SkillContext,
  SkillResult,
  ValidationResult
} from '../core/types';

// Schema for exercise analysis input
const exerciseAnalysisSchema = z.object({
  exerciseName: z.string().describe('Name of the exercise to analyze'),
  performance: z.object({
    reps: z.number().optional().describe('Number of repetitions performed'),
    sets: z.number().optional().describe('Number of sets completed'),
    weight: z.number().optional().describe('Weight used in kg'),
    duration: z.number().optional().describe('Duration in seconds'),
    distance: z.number().optional().describe('Distance in meters'),
    restTime: z.number().optional().describe('Rest time between sets in seconds')
  }).optional().describe('Performance metrics for the exercise'),
  goals: z.array(z.string()).optional().describe('User goals related to this exercise'),
  equipment: z.array(z.string()).optional().describe('Available equipment'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('User fitness level'),
  previousSessions: z.array(z.object({
    date: z.string(),
    performance: z.any()
  })).optional().describe('Previous performance data for trend analysis')
});

export type ExerciseAnalysisParams = z.infer<typeof exerciseAnalysisSchema>;

export class ExerciseAnalyzerSkill extends BaseSkill {
  public readonly id = 'exercise_analyzer';
  public readonly name = 'Advanced Exercise Analyzer';
  public readonly description = 'Provides detailed analysis of exercise performance, form recommendations, and personalized insights';
  public readonly version = '1.0.0';
  public readonly category = SkillCategory.FITNESS_ANALYSIS;

  public readonly tags = ['analysis', 'form', 'technique', 'performance', 'feedback', 'he', 'en'];
  public readonly dependencies = [];

  public readonly config = {
    timeout: 8000,
    retryAttempts: 2,
    requiresBackend: true,
    cacheable: true,
    memoryUsage: 'medium' as const,
    cpuUsage: 'medium' as const,
    requiresAuth: true,
    permissions: ['read_exercises', 'read_statistics'],
    compatibleSkills: ['workout_planner', 'progress_tracker', 'form_analyzer'],
    conflictsWith: []
  };

  public validate(input: any): ValidationResult {
    try {
      const parsed = exerciseAnalysisSchema.parse(input);
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
    return exerciseAnalysisSchema;
  }

  public async execute(input: ExerciseAnalysisParams, context: SkillContext): Promise<SkillResult> {
    try {
      // Get historical data from backend
      const historicalData = await this.getHistoricalData(input.exerciseName, context);

      // Perform analysis
      const analysis = this.analyzeExercise(input, historicalData, context);

      // Generate recommendations
      const recommendations = this.generateRecommendations(input, analysis, context);

      // Create visualizations
      const visualizations = this.createVisualizations(input, analysis, historicalData);

      return this.createSuccessResult({
        exercise: input.exerciseName,
        analysis,
        recommendations,
        performanceScore: analysis.score,
        trends: analysis.trends,
        formTips: analysis.formTips
      }, [
        `Exercise analysis completed for ${input.exerciseName}`,
        `Performance score: ${analysis.score}/100`,
        `${recommendations.length} personalized recommendations generated`
      ], recommendations, [
        'Try the suggested progressions',
        'Focus on form improvement',
        'Track consistency metrics'
      ], visualizations);

    } catch (error) {
      console.error('Exercise analysis error:', error);
      return this.createErrorResult('Failed to analyze exercise. Please try again.');
    }
  }

  private async getHistoricalData(exerciseName: string, context: SkillContext): Promise<any> {
    try {
      const response = await this.callBackend('/api/v1/exercises/history', {
        exerciseName,
        userId: context.userId,
        limit: 30
      }, context);
      return response.exercises || [];
    } catch (error) {
      console.warn('Could not fetch historical data:', error);
      return [];
    }
  }

  private analyzeExercise(input: ExerciseAnalysisParams, historicalData: any[], context: SkillContext) {
    const performance = input.performance || {};
    const analysis = {
      score: 0,
      formTips: [] as string[],
      technique: '',
      difficulty: 'moderate' as 'easy' | 'moderate' | 'hard',
      muscleGroups: [] as string[],
      trends: {
        volume: [] as number[],
        frequency: [] as number[],
        improvement: [] as number[]
      },
      strengths: [] as string[],
      improvements: [] as string[]
    };

    // Exercise-specific analysis
    const exerciseInfo = this.getExerciseInfo(input.exerciseName);
    analysis.muscleGroups = exerciseInfo.muscleGroups;
    analysis.difficulty = exerciseInfo.difficulty;

    // Performance scoring
    if (performance.reps && performance.sets) {
      const totalReps = performance.reps * performance.sets;
      analysis.score = Math.min(100, (totalReps / this.getTargetReps(input.exerciseName, context.userPreferences.fitnessLevel)) * 100);
    }

    // Form analysis based on exercise type
    analysis.formTips = this.getFormTips(input.exerciseName, performance, context.userPreferences.fitnessLevel);

    // Trend analysis
    if (historicalData.length > 0) {
      analysis.trends = this.analyzeTrends(historicalData, performance);
      analysis.improvements = this.identifyImprovements(historicalData, performance);
      analysis.strengths = this.identifyStrengths(historicalData, performance);
    }

    // Technique assessment
    analysis.technique = this.assessTechnique(input.exerciseName, performance, context);

    return analysis;
  }

  private generateRecommendations(input: ExerciseAnalysisParams, analysis: any, context: SkillContext): string[] {
    const recommendations: string[] = [];
    const performance = input.performance || {};

    // Performance-based recommendations
    if (analysis.score < 60) {
      recommendations.push('Focus on proper form before increasing intensity');
      recommendations.push('Consider reducing weight or reps to improve technique');
    } else if (analysis.score >= 80) {
      recommendations.push('Ready to progress to more challenging variations');
      recommendations.push('Consider increasing weight or reducing rest time');
    }

    // Exercise-specific recommendations
    const exerciseRecs = this.getExerciseRecommendations(input.exerciseName, performance, context.userPreferences.fitnessLevel);
    recommendations.push(...exerciseRecs);

    // Frequency recommendations
    if (analysis.trends.frequency.length > 0) {
      const avgFrequency = analysis.trends.frequency.reduce((a: number, b: number) => a + b, 0) / analysis.trends.frequency.length;
      if (avgFrequency < 1) {
        recommendations.push('Try to include this exercise at least once per week');
      } else if (avgFrequency > 3) {
        recommendations.push('Great consistency! Consider varying intensity or trying new exercises');
      }
    }

    // Equipment recommendations
    if (context.userPreferences.availableEquipment.length === 0) {
      recommendations.push('Consider basic equipment like resistance bands for variety');
    }

    return recommendations;
  }

  private createVisualizations(input: ExerciseAnalysisParams, analysis: any, historicalData: any[]) {
    const visualizations = [];

    // Progress chart
    if (historicalData.length > 1) {
      visualizations.push({
        type: 'chart' as const,
        title: 'Performance Progress',
        data: {
          labels: historicalData.map((_, i) => `Session ${i + 1}`),
          datasets: [{
            label: 'Volume',
            data: historicalData.map(session => (session.performance.reps || 0) * (session.performance.sets || 0))
          }]
        },
        config: {
          type: 'line',
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: 'Exercise Volume Over Time' }
            }
          }
        }
      });
    }

    // Muscle group visualization
    if (analysis.muscleGroups.length > 0) {
      visualizations.push({
        type: 'progress' as const,
        title: 'Muscle Groups Targeted',
        data: analysis.muscleGroups.map(muscle => ({
          name: muscle,
          activation: Math.random() * 40 + 60 // Mock activation percentage
        }))
      });
    }

    return visualizations;
  }

  private getExerciseInfo(exerciseName: string) {
    const exercises: Record<string, any> = {
      'סקוואט': {
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'calves'],
        difficulty: 'moderate',
        targetReps: { beginner: 8, intermediate: 12, advanced: 15 }
      },
      'לחיצות': {
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        difficulty: 'moderate',
        targetReps: { beginner: 5, intermediate: 10, advanced: 15 }
      },
      'ריצה': {
        muscleGroups: ['legs', 'core', 'cardio'],
        difficulty: 'moderate',
        targetReps: { beginner: 1000, intermediate: 3000, advanced: 5000 } // meters
      },
      'פלאנק': {
        muscleGroups: ['core', 'shoulders', 'back'],
        difficulty: 'moderate',
        targetReps: { beginner: 30, intermediate: 60, advanced: 120 } // seconds
      }
    };

    return exercises[exerciseName.toLowerCase()] || {
      muscleGroups: ['full_body'],
      difficulty: 'moderate',
      targetReps: { beginner: 10, intermediate: 15, advanced: 20 }
    };
  }

  private getTargetReps(exerciseName: string, fitnessLevel: string): number {
    const info = this.getExerciseInfo(exerciseName);
    return info.targetReps[fitnessLevel] || 12;
  }

  private getFormTips(exerciseName: string, performance: any, fitnessLevel: string): string[] {
    const formTips: Record<string, string[]> = {
      'סקוואט': [
        'Keep your chest up and back straight',
        'Lower until thighs are parallel to ground',
        'Push through heels, not toes',
        'Keep knees aligned with feet'
      ],
      'לחיצות': [
        'Maintain straight line from head to heels',
        'Lower chest close to ground',
        'Keep elbows close to body',
        'Engage core throughout movement'
      ],
      'פלאנק': [
        'Keep body in straight line',
        'Engage core and glutes',
        'Don\'t let hips sag',
        'Breathe steadily'
      ]
    };

    const tips = formTips[exerciseName.toLowerCase()] || ['Focus on proper form', 'Move through full range of motion'];

    // Adjust tips based on fitness level
    if (fitnessLevel === 'beginner') {
      tips.unshift('Start with lighter weight or bodyweight');
      tips.push('Consider working with a trainer for form correction');
    }

    return tips;
  }

  private analyzeTrends(historicalData: any[], currentPerformance: any) {
    const trends = {
      volume: [] as number[],
      frequency: [] as number[],
      improvement: [] as number[]
    };

    // Calculate trends from historical data
    historicalData.forEach((session, index) => {
      const volume = (session.performance.reps || 0) * (session.performance.sets || 0);
      trends.volume.push(volume);

      if (index > 0) {
        const improvement = ((volume - trends.volume[index - 1]) / trends.volume[index - 1]) * 100;
        trends.improvement.push(improvement);
      }
    });

    // Add current performance
    if (currentPerformance) {
      const currentVolume = (currentPerformance.reps || 0) * (currentPerformance.sets || 0);
      trends.volume.push(currentVolume);

      if (trends.volume.length > 1) {
        const lastVolume = trends.volume[trends.volume.length - 2];
        const improvement = ((currentVolume - lastVolume) / lastVolume) * 100;
        trends.improvement.push(improvement);
      }
    }

    return trends;
  }

  private assessTechnique(exerciseName: string, performance: any, context: SkillContext): string {
    // Simple technique assessment based on performance metrics
    if (!performance) return 'No performance data available';

    let technique = 'Good';
    const issues = [];

    if (performance.reps && performance.reps < 5) {
      issues.push('low rep count');
    }
    if (performance.sets && performance.sets < 3 && context.userPreferences.fitnessLevel !== 'beginner') {
      issues.push('insufficient volume');
    }

    if (issues.length > 0) {
      technique = `Needs improvement: ${issues.join(', ')}`;
    }

    return technique;
  }

  private identifyStrengths(historicalData: any[], currentPerformance: any): string[] {
    const strengths = [];

    if (historicalData.length > 1) {
      const recent = historicalData.slice(-3);
      const early = historicalData.slice(0, 3);

      const recentAvg = recent.reduce((sum, session) =>
        sum + (session.performance.reps || 0) * (session.performance.sets || 0), 0
      ) / recent.length;

      const earlyAvg = early.reduce((sum, session) =>
        sum + (session.performance.reps || 0) * (session.performance.sets || 0), 0
      ) / early.length;

      if (recentAvg > earlyAvg) {
        strengths.push('Consistent improvement over time');
      }

      if (recent.every(session => session.performance.reps > 0)) {
        strengths.push('Regular exercise frequency');
      }
    }

    return strengths;
  }

  private identifyImprovements(historicalData: any[], currentPerformance: any): string[] {
    const improvements = [];

    if (historicalData.length > 0) {
      const lastSession = historicalData[historicalData.length - 1];
      if (currentPerformance && lastSession.performance) {
        const lastVolume = (lastSession.performance.reps || 0) * (lastSession.performance.sets || 0);
        const currentVolume = (currentPerformance.reps || 0) * (currentPerformance.sets || 0);

        if (currentVolume > lastVolume * 1.1) {
          improvements.push('Significant volume increase');
        }
      }
    }

    return improvements;
  }

  private getExerciseRecommendations(exerciseName: string, performance: any, fitnessLevel: string): string[] {
    const recommendations: Record<string, string[]> = {
      'סקוואט': [
        'Try squat variations like goblet squats or Bulgarian split squats',
        'Focus on depth before adding weight',
        'Include pause squats for strength building'
      ],
      'לחיצות': [
        'Try incline or decline push-ups for variety',
        'Add tempo changes (slow negatives, explosive positives)',
        'Consider resistance band assistance or resistance'
      ],
      'ריצה': [
        'Incorporate interval training for endurance',
        'Focus on running form and cadence',
        'Gradually increase distance or pace'
      ]
    };

    return recommendations[exerciseName.toLowerCase()] || [
      'Maintain consistent form throughout all repetitions',
      'Focus on mind-muscle connection',
      'Progress gradually to avoid injury'
    ];
  }
}