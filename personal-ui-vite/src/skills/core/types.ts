/**
 * SweatBot Skills Framework
 * Core interfaces and types for implementing advanced fitness skills
 */

import { z } from 'zod';

// Core skill interface following Anthropic's best practices
export interface Skill {
  // Skill identification
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: SkillCategory;

  // Skill metadata
  readonly tags: string[];
  readonly dependencies: string[];
  readonly author: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Skill configuration
  readonly config: SkillConfig;

  // Core skill methods
  validate(input: any): ValidationResult;
  execute(input: any, context: SkillContext): Promise<SkillResult>;
  getSchema(): z.ZodSchema;
  getInfo(): SkillInfo;
}

export interface SkillConfig {
  // Execution settings
  timeout: number; // milliseconds
  retryAttempts: number;
  requiresBackend: boolean;
  cacheable: boolean;

  // Resource requirements
  memoryUsage: 'low' | 'medium' | 'high';
  cpuUsage: 'low' | 'medium' | 'high';

  // Security settings
  requiresAuth: boolean;
  permissions: string[];

  // Integration settings
  compatibleSkills: string[];
  conflictsWith: string[];
}

export enum SkillCategory {
  FITNESS_ANALYSIS = 'fitness_analysis',
  WORKOUT_PLANNING = 'workout_planning',
  HEALTH_MONITORING = 'health_monitoring',
  NUTRITION = 'nutrition',
  RECOVERY = 'recovery',
  MOTIVATION = 'motivation',
  DATA_VISUALIZATION = 'data_visualization',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization'
}

export interface SkillContext {
  userId: string;
  sessionId?: string;
  conversationHistory: Array<{role: string, content: string, timestamp?: string}>;
  userPreferences: UserPreferences;
  userProfile: UserProfile;
  environment: 'development' | 'production';
  backendUrl: string;
  authToken?: string;
}

export interface UserPreferences {
  language: 'he' | 'en';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  availableEquipment: string[];
  timeConstraints: number; // minutes per session
  preferredWorkoutTypes: string[];
  units: 'metric' | 'imperial';
}

export interface UserProfile {
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  gender?: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  fitnessGoals: string[];
  medicalConditions?: string[];
  injuries?: string[];
  personalRecords: Record<string, number>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedInput?: any;
}

export interface SkillResult {
  success: boolean;
  data?: any;
  insights?: string[];
  recommendations?: string[];
  nextActions?: string[];
  visualizations?: VisualizationData[];
  followUpSkills?: string[];
  metrics?: {
    executionTime: number;
    memoryUsed: number;
    dataPointsProcessed: number;
  };
  error?: string;
}

export interface VisualizationData {
  type: 'chart' | 'graph' | 'table' | 'progress' | 'achievement';
  title: string;
  data: any;
  config?: any;
}

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  category: SkillCategory;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  averageRating: number;
  dependencies: string[];
  compatibleSkills: string[];
  examples: SkillExample[];
}

export interface SkillExample {
  input: any;
  output: SkillResult;
  description: string;
}

// Skill registry interface
export interface SkillRegistry {
  register(skill: Skill): void;
  unregister(skillId: string): void;
  getSkill(skillId: string): Skill | null;
  getSkillsByCategory(category: SkillCategory): Skill[];
  getSkillsByTag(tag: string): Skill[];
  searchSkills(query: string): Skill[];
  getAllSkills(): Skill[];
  validateSkill(skill: Skill): ValidationResult;
}

// Skill execution engine
export interface SkillEngine {
  executeSkill(skillId: string, input: any, context: SkillContext): Promise<SkillResult>;
  executeSkillChain(skillIds: string[], input: any, context: SkillContext): Promise<SkillResult[]>;
  getRecommendedSkills(input: string, context: SkillContext): Promise<Skill[]>;
  validateSkillChain(skillIds: string[]): boolean;
}

// Skill analytics
export interface SkillAnalytics {
  trackSkillUsage(skillId: string, result: SkillResult, context: SkillContext): void;
  getSkillMetrics(skillId: string): SkillMetrics;
  getPopularSkills(limit: number): Skill[];
  getSkillSuccessRate(skillId: string): number;
}

export interface SkillMetrics {
  usageCount: number;
  successRate: number;
  averageExecutionTime: number;
  averageRating: number;
  lastUsed: Date;
  errorCount: number;
  commonErrors: Array<{error: string, count: number}>;
}

// Base abstract class for skill implementation
export abstract class BaseSkill implements Skill {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly version: string;
  public abstract readonly category: SkillCategory;
  public abstract readonly config: SkillConfig;

  public readonly tags: string[] = [];
  public readonly dependencies: string[] = [];
  public readonly author = 'SweatBot Team';
  public readonly createdAt = new Date();
  public readonly updatedAt = new Date();

  public abstract validate(input: any): ValidationResult;
  public abstract execute(input: any, context: SkillContext): Promise<SkillResult>;
  public abstract getSchema(): z.ZodSchema;

  public getInfo(): SkillInfo {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      category: this.category,
      tags: this.tags,
      author: this.author,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      usageCount: 0,
      averageRating: 0,
      dependencies: this.dependencies,
      compatibleSkills: this.config.compatibleSkills,
      examples: []
    };
  }

  protected async callBackend(endpoint: string, data: any, context: SkillContext): Promise<any> {
    if (!context.authToken) {
      throw new Error('Authentication required for this skill');
    }

    const response = await fetch(`${context.backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Backend call failed: ${response.statusText}`);
    }

    return await response.json();
  }

  protected createSuccessResult(data: any, insights: string[] = []): SkillResult {
    return {
      success: true,
      data,
      insights,
      metrics: {
        executionTime: 0, // Will be set by engine
        memoryUsed: 0,
        dataPointsProcessed: 1
      }
    };
  }

  protected createErrorResult(error: string): SkillResult {
    return {
      success: false,
      error,
      metrics: {
        executionTime: 0,
        memoryUsed: 0,
        dataPointsProcessed: 0
      }
    };
  }
}

// Utility functions
export function createSkillContext(
  userId: string,
  authToken?: string,
  backendUrl?: string
): SkillContext {
  return {
    userId,
    sessionId: undefined,
    conversationHistory: [],
    userPreferences: {
      language: 'he',
      fitnessLevel: 'intermediate',
      goals: [],
      availableEquipment: [],
      timeConstraints: 30,
      preferredWorkoutTypes: [],
      units: 'metric'
    },
    userProfile: {
      activityLevel: 'moderate',
      fitnessGoals: [],
      personalRecords: {}
    },
    environment: 'development',
    backendUrl: backendUrl || 'http://localhost:8000',
    authToken
  };
}