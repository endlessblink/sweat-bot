/**
 * Health Monitoring Skill
 * Tracks and analyzes health metrics, provides insights and recommendations
 */

import { z } from 'zod';
import {
  BaseSkill,
  SkillCategory,
  SkillContext,
  SkillResult,
  ValidationResult
} from '../core/types';

// Schema for health monitoring input
const healthMonitorSchema = z.object({
  metrics: z.object({
    heartRate: z.number().optional().describe('Current heart rate in bpm'),
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number()
    }).optional().describe('Blood pressure reading'),
    weight: z.number().optional().describe('Current weight in kg'),
    sleep: z.object({
      hours: z.number(),
      quality: z.enum(['poor', 'fair', 'good', 'excellent'])
    }).optional().describe('Sleep data'),
    stress: z.number().min(1).max(10).optional().describe('Stress level 1-10'),
    energy: z.number().min(1).max(10).optional().describe('Energy level 1-10'),
    water: z.number().optional().describe('Water intake in liters'),
    steps: z.number().optional().describe('Steps taken today')
  }).describe('Health metrics to analyze'),
  timeframe: z.enum(['today', 'week', 'month']).default('today').describe('Timeframe for analysis'),
  goals: z.object({
    targetWeight: z.number().optional(),
    targetSleep: z.number().optional(),
    targetSteps: z.number().optional(),
    targetWater: z.number().optional()
  }).optional().describe('Health goals')
});

export type HealthMonitorParams = z.infer<typeof healthMonitorSchema>;

export class HealthMonitorSkill extends BaseSkill {
  public readonly id = 'health_monitor';
  public readonly name = 'Comprehensive Health Monitor';
  public readonly description = 'Analyzes health metrics, provides insights, and tracks progress toward health goals';
  public readonly version = '1.0.0';
  public readonly category = SkillCategory.HEALTH_MONITORING;

  public readonly tags = ['health', 'metrics', 'tracking', 'wellness', 'vitals', 'he', 'en'];
  public readonly dependencies = [];

  public readonly config = {
    timeout: 6000,
    retryAttempts: 2,
    requiresBackend: true,
    cacheable: true,
    memoryUsage: 'medium' as const,
    cpuUsage: 'low' as const,
    requiresAuth: true,
    permissions: ['read_health_data', 'write_health_data'],
    compatibleSkills = ['workout_planner', 'nutrition_tracker', 'recovery_analyzer'],
    conflictsWith: []
  };

  public validate(input: any): ValidationResult {
    try {
      const parsed = healthMonitorSchema.parse(input);
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
    return healthMonitorSchema;
  }

  public async execute(input: HealthMonitorParams, context: SkillContext): Promise<SkillResult> {
    try {
      // Get historical health data
      const historicalData = await this.getHistoricalHealthData(context, input.timeframe);

      // Analyze current metrics
      const analysis = this.analyzeHealthMetrics(input.metrics, historicalData, context);

      // Generate insights
      const insights = this.generateHealthInsights(analysis, input.metrics, historicalData);

      // Create recommendations
      const recommendations = this.generateHealthRecommendations(analysis, input.goals, context);

      // Calculate health score
      const healthScore = this.calculateHealthScore(analysis);

      // Create health visualizations
      const visualizations = this.createHealthVisualizations(analysis, historicalData);

      return this.createSuccessResult({
        analysis,
        insights,
        recommendations,
        healthScore,
        trends: this.analyzeHealthTrends(historicalData),
        alerts: this.generateHealthAlerts(analysis, input.metrics),
        goalProgress: this.calculateGoalProgress(analysis, input.goals)
      }, [
        `Health analysis completed for ${input.timeframe}`,
        `Overall health score: ${healthScore}/100`,
        `${insights.length} insights generated`,
        `${recommendations.length} personalized recommendations`
      ], recommendations, [
        'Continue tracking your health metrics daily',
        'Follow the personalized recommendations',
        'Schedule regular check-ups as needed'
      ], visualizations);

    } catch (error) {
      console.error('Health monitoring error:', error);
      return this.createErrorResult('Failed to analyze health metrics. Please try again.');
    }
  }

  private async getHistoricalHealthData(context: SkillContext, timeframe: string): Promise<any[]> {
    try {
      const response = await this.callBackend('/api/v1/health/history', {
        userId: context.userId,
        timeframe,
        limit: timeframe === 'today' ? 24 : timeframe === 'week' ? 7 : 30
      }, context);
      return response.data || [];
    } catch (error) {
      console.warn('Could not fetch historical health data:', error);
      return [];
    }
  }

  private analyzeHealthMetrics(metrics: any, historicalData: any[], context: SkillContext): any {
    const analysis = {
      heartRate: this.analyzeHeartRate(metrics.heartRate, context.userProfile),
      bloodPressure: this.analyzeBloodPressure(metrics.bloodPressure, context.userProfile),
      weight: this.analyzeWeight(metrics.weight, historicalData, context.userProfile),
      sleep: this.analyzeSleep(metrics.sleep, context.userProfile),
      stress: this.analyzeStress(metrics.stress, historicalData),
      energy: this.analyzeEnergy(metrics.energy, historicalData),
      hydration: this.analyzeHydration(metrics.water, context.userProfile),
      activity: this.analyzeActivity(metrics.steps, context.userProfile),
      overall: {
        status: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
        concerns: [] as string[],
        strengths: [] as string[]
      }
    };

    // Overall assessment
    analysis.overall = this.assessOverallHealth(analysis);

    return analysis;
  }

  private analyzeHeartRate(heartRate: number | undefined, userProfile: any): any {
    if (!heartRate) return { status: 'no_data', message: 'No heart rate data available' };

    const restingRate = 60; // Average resting rate
    const maxRate = userProfile.age ? 220 - userProfile.age : 180;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    if (heartRate < 60) {
      status = userProfile.activityLevel === 'very_active' ? 'excellent' : 'fair';
      message = 'Low heart rate - may indicate good fitness or bradycardia';
    } else if (heartRate <= 100) {
      status = 'good';
      message = 'Normal resting heart rate';
    } else if (heartRate <= 120) {
      status = 'fair';
      message = 'Elevated heart rate - may indicate stress or recent activity';
    } else {
      status = 'poor';
      message = 'High heart rate - consult healthcare provider if persistent';
    }

    return { status, message, value: heartRate, restingRate, maxRate };
  }

  private analyzeBloodPressure(bloodPressure: any, userProfile: any): any {
    if (!bloodPressure) return { status: 'no_data', message: 'No blood pressure data available' };

    const { systolic, diastolic } = bloodPressure;
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    if (systolic < 120 && diastolic < 80) {
      status = 'excellent';
      message = 'Optimal blood pressure';
    } else if (systolic < 130 && diastolic < 85) {
      status = 'good';
      message = 'Normal blood pressure';
    } else if (systolic < 140 && diastolic < 90) {
      status = 'fair';
      message = 'Elevated blood pressure - monitor and consider lifestyle changes';
    } else {
      status = 'poor';
      message = 'High blood pressure - consult healthcare provider';
    }

    return { status, message, systolic, diastolic };
  }

  private analyzeWeight(weight: number | undefined, historicalData: any[], userProfile: any): any {
    if (!weight) return { status: 'no_data', message: 'No weight data available' };

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;
    let trend: 'stable' | 'increasing' | 'decreasing';

    // Calculate BMI if height is available
    let bmi = null;
    if (userProfile.height) {
      bmi = weight / Math.pow(userProfile.height / 100, 2);
    }

    // Analyze trend from historical data
    if (historicalData.length > 1) {
      const recent = historicalData.slice(-3);
      const older = historicalData.slice(-6, -3);
      const recentAvg = recent.reduce((sum: number, d: any) => sum + (d.weight || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum: number, d: any) => sum + (d.weight || 0), 0) / older.length;

      if (Math.abs(recentAvg - olderAvg) < 0.5) {
        trend = 'stable';
      } else if (recentAvg > olderAvg) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }
    } else {
      trend = 'stable';
    }

    // Assess status based on BMI if available
    if (bmi) {
      if (bmi >= 18.5 && bmi <= 24.9) {
        status = 'excellent';
        message = `Healthy weight (BMI: ${bmi.toFixed(1)})`;
      } else if (bmi >= 25 && bmi <= 29.9) {
        status = 'good';
        message = `Slightly overweight (BMI: ${bmi.toFixed(1)})`;
      } else if (bmi >= 30) {
        status = 'fair';
        message = `Overweight (BMI: ${bmi.toFixed(1)}) - consider weight management`;
      } else {
        status = 'fair';
        message = `Underweight (BMI: ${bmi.toFixed(1)}) - ensure adequate nutrition`;
      }
    } else {
      status = 'good';
      message = 'Weight tracking in progress';
    }

    return { status, message, weight, bmi, trend };
  }

  private analyzeSleep(sleep: any, userProfile: any): any {
    if (!sleep) return { status: 'no_data', message: 'No sleep data available' };

    const { hours, quality } = sleep;
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    const recommendedHours = userProfile.age ? (userProfile.age < 26 ? 9 : userProfile.age < 65 ? 8 : 7) : 8;

    if (hours >= recommendedHours - 1 && quality === 'excellent') {
      status = 'excellent';
      message = `Excellent sleep duration and quality`;
    } else if (hours >= recommendedHours - 1 && ['good', 'excellent'].includes(quality)) {
      status = 'good';
      message = `Good sleep - ${hours} hours with ${quality} quality`;
    } else if (hours >= recommendedHours - 2) {
      status = 'fair';
      message = `Adequate sleep but could be improved in duration or quality`;
    } else {
      status = 'poor';
      message = `Insufficient sleep - aim for ${recommendedHours} hours per night`;
    }

    return { status, message, hours, quality, recommendedHours };
  }

  private analyzeStress(stress: number | undefined, historicalData: any[]): any {
    if (!stress) return { status: 'no_data', message: 'No stress data available' };

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    if (stress <= 3) {
      status = 'excellent';
      message = 'Low stress level - excellent stress management';
    } else if (stress <= 5) {
      status = 'good';
      message = 'Moderate stress level - well managed';
    } else if (stress <= 7) {
      status = 'fair';
      message = 'Elevated stress - consider stress reduction techniques';
    } else {
      status = 'poor';
      message = 'High stress level - prioritize stress management';
    }

    // Analyze trend
    let trend = 'stable';
    if (historicalData.length > 1) {
      const recent = historicalData.slice(-3).map((d: any) => d.stress).filter(Boolean);
      if (recent.length > 1) {
        const avgRecent = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
        trend = stress > avgRecent ? 'increasing' : stress < avgRecent ? 'decreasing' : 'stable';
      }
    }

    return { status, message, value: stress, trend };
  }

  private analyzeEnergy(energy: number | undefined, historicalData: any[]): any {
    if (!energy) return { status: 'no_data', message: 'No energy data available' };

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    if (energy >= 8) {
      status = 'excellent';
      message = 'High energy levels - great overall vitality';
    } else if (energy >= 6) {
      status = 'good';
      message = 'Good energy levels';
    } else if (energy >= 4) {
      status = 'fair';
      message = 'Moderate energy - could be improved';
    } else {
      status = 'poor';
      message = 'Low energy - consider lifestyle adjustments';
    }

    return { status, message, value: energy };
  }

  private analyzeHydration(water: number | undefined, userProfile: any): any {
    if (!water) return { status: 'no_data', message: 'No hydration data available' };

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    const weight = userProfile.weight || 70; // Default weight
    const recommendedWater = weight * 0.033; // 33ml per kg

    if (water >= recommendedWater * 0.9) {
      status = 'excellent';
      message = 'Excellent hydration';
    } else if (water >= recommendedWater * 0.7) {
      status = 'good';
      message = 'Good hydration';
    } else if (water >= recommendedWater * 0.5) {
      status = 'fair';
      message = 'Could increase water intake';
    } else {
      status = 'poor';
      message = 'Insufficient hydration - increase water intake';
    }

    return { status, message, intake: water, recommended: recommendedWater };
  }

  private analyzeActivity(steps: number | undefined, userProfile: any): any {
    if (!steps) return { status: 'no_data', message: 'No activity data available' };

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    const goalSteps = 10000; // Standard recommendation

    if (steps >= goalSteps) {
      status = 'excellent';
      message = 'Excellent activity level - exceeded daily step goal';
    } else if (steps >= goalSteps * 0.75) {
      status = 'good';
      message = 'Good activity level';
    } else if (steps >= goalSteps * 0.5) {
      status = 'fair';
      message = 'Moderate activity - could increase daily movement';
    } else {
      status = 'poor';
      message = 'Low activity - increase daily movement';
    }

    return { status, message, steps, goal: goalSteps };
  }

  private assessOverallHealth(analysis: any): any {
    const categories = ['heartRate', 'bloodPressure', 'weight', 'sleep', 'stress', 'energy', 'hydration', 'activity'];
    const scores = categories.map(cat => {
      const status = analysis[cat]?.status;
      switch (status) {
        case 'excellent': return 4;
        case 'good': return 3;
        case 'fair': return 2;
        case 'poor': return 1;
        default: return 2; // 'no_data' gets average score
      }
    });

    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    let overallStatus: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageScore >= 3.5) overallStatus = 'excellent';
    else if (averageScore >= 2.5) overallStatus = 'good';
    else if (averageScore >= 1.5) overallStatus = 'fair';
    else overallStatus = 'poor';

    const concerns = categories.filter(cat => {
      const status = analysis[cat]?.status;
      return status === 'poor' || status === 'fair';
    }).map(cat => cat.replace(/([A-Z])/g, ' $1').trim());

    const strengths = categories.filter(cat => {
      const status = analysis[cat]?.status;
      return status === 'excellent' || status === 'good';
    }).map(cat => cat.replace(/([A-Z])/g, ' $1').trim());

    return {
      status: overallStatus,
      score: Math.round((averageScore / 4) * 100),
      concerns,
      strengths
    };
  }

  private generateHealthInsights(analysis: any, metrics: any, historicalData: any[]): string[] {
    const insights = [];

    // Heart rate insights
    if (analysis.heartRate.status === 'excellent') {
      insights.push('Your heart rate indicates excellent cardiovascular fitness');
    } else if (analysis.heartRate.status === 'poor') {
      insights.push('Consider cardiovascular exercise to improve heart health');
    }

    // Sleep insights
    if (analysis.sleep.status === 'excellent') {
      insights.push('Great sleep quality is supporting your overall health');
    } else if (analysis.sleep.status === 'poor') {
      insights.push('Poor sleep may be affecting your energy and stress levels');
    }

    // Stress-energy correlation
    if (metrics.stress && metrics.energy) {
      if (metrics.stress > 7 && metrics.energy < 4) {
        insights.push('High stress may be contributing to low energy levels');
      } else if (metrics.stress < 4 && metrics.energy > 7) {
        insights.push('Good stress management is supporting high energy levels');
      }
    }

    // Activity and weight insights
    if (analysis.activity.status === 'excellent' && analysis.weight.status === 'good') {
      insights.push('Your activity level is supporting healthy weight management');
    }

    // Hydration insights
    if (analysis.hydration.status === 'poor') {
      insights.push('Inadequate hydration may be affecting your energy and performance');
    }

    return insights;
  }

  private generateHealthRecommendations(analysis: any, goals: any, context: SkillContext): string[] {
    const recommendations = [];

    // Heart rate recommendations
    if (analysis.heartRate.status !== 'excellent') {
      recommendations.push('Incorporate regular cardiovascular exercise (30 min, 3-5 times per week)');
    }

    // Sleep recommendations
    if (analysis.sleep.status !== 'excellent') {
      recommendations.push('Maintain consistent sleep schedule and aim for 7-9 hours nightly');
      recommendations.push('Create a relaxing bedtime routine and avoid screens before bed');
    }

    // Stress management
    if (analysis.stress.status !== 'excellent') {
      recommendations.push('Practice stress reduction techniques like meditation, deep breathing, or yoga');
      recommendations.push('Schedule regular breaks and prioritize self-care activities');
    }

    // Hydration
    if (analysis.hydration.status !== 'excellent') {
      recommendations.push('Increase water intake to at least 2-3 liters per day');
      recommendations.push('Set reminders to drink water throughout the day');
    }

    // Activity
    if (analysis.activity.status !== 'excellent') {
      recommendations.push('Increase daily movement with short walks or stretching breaks');
      recommendations.push('Aim for 10,000 steps per day through accumulated activity');
    }

    // Weight management
    if (analysis.weight.status === 'fair' || analysis.weight.status === 'poor') {
      recommendations.push('Consult with healthcare provider for personalized weight management plan');
      recommendations.push('Focus on balanced nutrition and regular physical activity');
    }

    return recommendations;
  }

  private calculateHealthScore(analysis: any): number {
    return analysis.overall.score || 75;
  }

  private analyzeHealthTrends(historicalData: any[]): any {
    if (historicalData.length < 2) return { insufficient: true };

    const trends = {
      improving: [] as string[],
      declining: [] as string[],
      stable: [] as string[]
    };

    // Simple trend analysis for each metric
    const metrics = ['heartRate', 'stress', 'energy', 'weight', 'sleep_hours'];

    metrics.forEach(metric => {
      const recent = historicalData.slice(-3).map((d: any) => d[metric]).filter(Boolean);
      const older = historicalData.slice(-6, -3).map((d: any) => d[metric]).filter(Boolean);

      if (recent.length > 1 && older.length > 1) {
        const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length;

        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (Math.abs(change) > 10) {
          if (metric === 'stress' || metric === 'weight') {
            // For these, lower is better
            if (change < -10) trends.improving.push(metric);
            else if (change > 10) trends.declining.push(metric);
          } else {
            // For these, higher is better
            if (change > 10) trends.improving.push(metric);
            else if (change < -10) trends.declining.push(metric);
          }
        } else {
          trends.stable.push(metric);
        }
      }
    });

    return trends;
  }

  private generateHealthAlerts(analysis: any, metrics: any): string[] {
    const alerts = [];

    // Critical alerts
    if (analysis.bloodPressure.status === 'poor') {
      alerts.push('⚠️ High blood pressure detected - consult healthcare provider');
    }

    if (metrics.heartRate && metrics.heartRate > 120) {
      alerts.push('⚠️ Elevated heart rate - monitor and seek medical advice if persistent');
    }

    if (analysis.stress.value && analysis.stress.value > 8) {
      alerts.push('⚠️ Very high stress level - prioritize stress management');
    }

    // Warning alerts
    if (analysis.sleep.status === 'poor') {
      alerts.push('Poor sleep quality affecting overall health');
    }

    if (analysis.hydration.status === 'poor') {
      alerts.push('Dehydration risk - increase water intake immediately');
    }

    return alerts;
  }

  private calculateGoalProgress(analysis: any, goals: any): any {
    if (!goals) return { no_goals: true };

    const progress: any = {};

    if (goals.targetWeight && analysis.weight.weight) {
      const currentWeight = analysis.weight.weight;
      const difference = Math.abs(currentWeight - goals.targetWeight);
      const percentage = Math.max(0, 100 - (difference / goals.targetWeight) * 100);
      progress.weight = {
        current: currentWeight,
        target: goals.targetWeight,
        progress: Math.round(percentage),
        status: percentage >= 95 ? 'achieved' : percentage >= 70 ? 'on_track' : 'needs_work'
      };
    }

    if (goals.targetSleep && analysis.sleep.hours) {
      const progress = Math.min(100, (analysis.sleep.hours / goals.targetSleep) * 100);
      progress.sleep = {
        current: analysis.sleep.hours,
        target: goals.targetSleep,
        progress: Math.round(progress),
        status: progress >= 95 ? 'achieved' : progress >= 80 ? 'on_track' : 'needs_work'
      };
    }

    if (goals.targetSteps && analysis.activity.steps) {
      const progress = Math.min(100, (analysis.activity.steps / goals.targetSteps) * 100);
      progress.steps = {
        current: analysis.activity.steps,
        target: goals.targetSteps,
        progress: Math.round(progress),
        status: progress >= 95 ? 'achieved' : progress >= 80 ? 'on_track' : 'needs_work'
      };
    }

    return progress;
  }

  private createHealthVisualizations(analysis: any, historicalData: any[]): any[] {
    const visualizations = [];

    // Health score gauge
    visualizations.push({
      type: 'gauge' as const,
      title: 'Overall Health Score',
      data: {
        value: analysis.overall.score,
        min: 0,
        max: 100,
        thresholds: [
          { value: 0, color: '#ff4444' },
          { value: 50, color: '#ffaa00' },
          { value: 75, color: '#44ff44' }
        ]
      }
    });

    // Trend chart if historical data available
    if (historicalData.length > 1) {
      visualizations.push({
        type: 'chart' as const,
        title: 'Health Metrics Trends',
        data: {
          labels: historicalData.map((_, i) => `Day ${i + 1}`),
          datasets: [
            {
              label: 'Energy',
              data: historicalData.map(d => d.energy || 0),
              borderColor: 'rgb(255, 99, 132)'
            },
            {
              label: 'Stress',
              data: historicalData.map(d => d.stress || 0),
              borderColor: 'rgb(54, 162, 235)'
            }
          ]
        },
        config: {
          type: 'line',
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 10
              }
            }
          }
        }
      });
    }

    return visualizations;
  }
}