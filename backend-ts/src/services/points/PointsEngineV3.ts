/**
 * Unified Points Calculation Engine v3 (TypeScript)
 * Single source of truth for all points calculations with YAML configuration
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { PointsConfigurationV3 } from '../../entities/PointsConfigurationV3';
import { PointsCalculationV3 } from '../../entities/PointsCalculationV3';

// Types
export enum CalculationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CACHED = 'cached'
}

export interface PointsBreakdown {
  basePoints: number;
  repsPoints: number;
  setsPoints: number;
  weightPoints: number;
  distancePoints: number;
  durationPoints: number;
  bonusPoints: number;
  multiplierValue: number;
  totalBeforeMultiplier: number;
  totalPoints: number;
  appliedBonuses: Array<{ id: string; name: string; value: number }>;
  appliedMultipliers: Array<{ id: string; name: string; value: number }>;
}

export interface CalculationResult {
  totalPoints: number;
  breakdown: PointsBreakdown;
  status: CalculationStatus;
  calculationTime: number;
  exerciseKey: string;
  exerciseNameHe: string;
  appliedRules: string[];
  errors: string[];
  warnings: string[];
}

export interface ExerciseConfig {
  exerciseKey: string;
  name: string;
  nameHe: string;
  category: string;
  basePoints: number;
  multipliers: {
    reps?: number;
    sets?: number;
    weight?: number;
    distanceKm?: number;
    durationMin?: number;
    durationSec?: number;
  };
  enabled: boolean;
  description?: string;
}

export interface RuleConfig {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  ruleType: 'bonus' | 'multiplier';
  condition: string;
  value: number;
  enabled: boolean;
  priority: number;
}

export interface AchievementConfig {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  points: number;
  icon: string;
  category: string;
  condition: string;
  enabled: boolean;
}

export interface UserContext {
  userId: string;
  totalPoints: number;
  totalWorkouts: number;
  streakDays: number;
  sessionExerciseCount: number;
  workoutHour: number;
  [key: string]: any;
}

export interface CalculatePointsParams {
  exerciseKey: string;
  reps?: number;
  sets?: number;
  weightKg?: number;
  distanceKm?: number;
  durationSeconds?: number;
  isPersonalRecord?: boolean;
  userContext?: Partial<UserContext>;
}

/**
 * Unified Points Calculation Engine v3
 * Loads configuration from YAML and provides centralized calculation logic
 */
export class PointsEngineV3 {
  private exercisesConfig: Record<string, ExerciseConfig> = {};
  private rulesConfig: Record<string, RuleConfig> = {};
  private achievementsConfig: Record<string, AchievementConfig> = {};
  private configLoaded = false;
  private redis?: Redis;
  private memoryCache: Map<string, any> = new Map();
  private readonly cacheTTL = 3600; // 1 hour

  private readonly configDir = path.join(process.cwd(), 'config', 'points');

  constructor(private redisUrl = 'redis://:sweatbot_redis_pass@localhost:8003') {}

  /**
   * Initialize engine by loading all configurations
   */
  async initialize(): Promise<void> {
    try {
      // Load YAML configurations
      const [exercisesData, rulesData, achievementsData] = await Promise.all([
        this.loadYAML<any>(path.join(this.configDir, 'exercises.yaml')),
        this.loadYAML<any>(path.join(this.configDir, 'rules.yaml')),
        this.loadYAML<any>(path.join(this.configDir, 'achievements.yaml'))
      ]);

      // Parse exercises
      if (exercisesData?.exercises) {
        for (const [key, config] of Object.entries(exercisesData.exercises)) {
          this.exercisesConfig[key] = {
            exerciseKey: key,
            ...(config as any)
          };
        }
      }

      // Parse rules
      if (rulesData?.rules) {
        for (const [key, config] of Object.entries(rulesData.rules)) {
          this.rulesConfig[key] = config as RuleConfig;
        }
      }

      // Parse achievements
      if (achievementsData?.achievements) {
        for (const [key, config] of Object.entries(achievementsData.achievements)) {
          this.achievementsConfig[key] = config as AchievementConfig;
        }
      }

      this.configLoaded = true;

      console.log(`✅ Points Engine v3 initialized`);
      console.log(`   - Loaded ${Object.keys(this.exercisesConfig).length} exercises`);
      console.log(`   - Loaded ${Object.keys(this.rulesConfig).length} rules`);
      console.log(`   - Loaded ${Object.keys(this.achievementsConfig).length} achievements`);

      // Initialize Redis (optional)
      try {
        this.redis = new Redis(this.redisUrl);
        await this.redis.ping();
        console.log(`✅ Connected to Redis for points caching`);
      } catch (error) {
        console.warn(`⚠️  Redis not available, using memory cache:`, error);
        this.redis = undefined;
      }
    } catch (error) {
      console.error(`❌ Failed to initialize Points Engine v3:`, error);
      throw error;
    }
  }

  /**
   * Load and parse YAML file
   */
  private async loadYAML<T>(filePath: string): Promise<T | null> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      return yaml.load(fileContent) as T;
    } catch (error) {
      console.warn(`⚠️  Failed to load YAML from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Get exercise configuration
   */
  getExerciseConfig(exerciseKey: string): ExerciseConfig | null {
    const config = this.exercisesConfig[exerciseKey];

    if (!config) {
      console.warn(`Exercise not found in config: ${exerciseKey}`);
      return null;
    }

    if (!config.enabled) {
      console.warn(`Exercise is disabled: ${exerciseKey}`);
      return null;
    }

    return config;
  }

  /**
   * Calculate points for an exercise with full breakdown
   */
  async calculatePoints(params: CalculatePointsParams): Promise<CalculationResult> {
    const startTime = Date.now();

    if (!this.configLoaded) {
      await this.initialize();
    }

    // Get exercise configuration
    const exerciseConfig = this.getExerciseConfig(params.exerciseKey);
    if (!exerciseConfig) {
      return {
        totalPoints: 0,
        breakdown: this.createEmptyBreakdown(),
        status: CalculationStatus.FAILED,
        calculationTime: 0,
        exerciseKey: params.exerciseKey,
        exerciseNameHe: params.exerciseKey,
        appliedRules: [],
        errors: [`Exercise not found or disabled: ${params.exerciseKey}`],
        warnings: []
      };
    }

    // Initialize breakdown
    const breakdown: PointsBreakdown = {
      basePoints: exerciseConfig.basePoints,
      repsPoints: 0,
      setsPoints: 0,
      weightPoints: 0,
      distancePoints: 0,
      durationPoints: 0,
      bonusPoints: 0,
      multiplierValue: 1.0,
      totalBeforeMultiplier: 0,
      totalPoints: 0,
      appliedBonuses: [],
      appliedMultipliers: []
    };

    // Get multipliers with defaults
    const reps = params.reps || 0;
    const sets = params.sets || 1;
    const weightKg = params.weightKg || 0;
    const distanceKm = params.distanceKm || 0;
    const durationSeconds = params.durationSeconds || 0;

    const multipliers = exerciseConfig.multipliers;

    // Calculate component points
    if (reps > 0 && multipliers.reps) {
      breakdown.repsPoints = Math.floor(breakdown.basePoints * reps * multipliers.reps);
    }

    if (sets > 1 && multipliers.sets) {
      breakdown.setsPoints = Math.floor(breakdown.basePoints * sets * multipliers.sets);
    }

    if (weightKg > 0 && multipliers.weight) {
      breakdown.weightPoints = Math.floor(weightKg * multipliers.weight);
    }

    if (distanceKm > 0 && multipliers.distanceKm) {
      breakdown.distancePoints = Math.floor(distanceKm * multipliers.distanceKm);
    }

    if (durationSeconds > 0) {
      if (multipliers.durationSec) {
        breakdown.durationPoints = Math.floor(durationSeconds * multipliers.durationSec);
      } else if (multipliers.durationMin) {
        const durationMin = durationSeconds / 60;
        breakdown.durationPoints = Math.floor(durationMin * multipliers.durationMin);
      }
    }

    // Calculate total before bonuses
    breakdown.totalBeforeMultiplier =
      breakdown.basePoints +
      breakdown.repsPoints +
      breakdown.setsPoints +
      breakdown.weightPoints +
      breakdown.distancePoints +
      breakdown.durationPoints;

    // Build context for rule evaluation
    const context: Record<string, any> = {
      reps,
      sets,
      weight_kg: weightKg,
      distance_km: distanceKm,
      duration_seconds: durationSeconds,
      duration_minutes: durationSeconds > 0 ? durationSeconds / 60 : 0,
      is_personal_record: params.isPersonalRecord || false,
      ...params.userContext
    };

    // Apply rules (bonuses and multipliers)
    const appliedRules: string[] = [];

    // Sort rules by priority
    const sortedRules = Object.entries(this.rulesConfig).sort(
      ([, a], [, b]) => (a.priority || 999) - (b.priority || 999)
    );

    // Apply bonus rules first
    for (const [ruleId, ruleConfig] of sortedRules) {
      if (!ruleConfig.enabled || ruleConfig.ruleType !== 'bonus') continue;

      if (this.evaluateCondition(ruleConfig.condition, context)) {
        breakdown.bonusPoints += ruleConfig.value;
        breakdown.appliedBonuses.push({
          id: ruleId,
          name: ruleConfig.name,
          value: ruleConfig.value
        });
        appliedRules.push(ruleId);
      }
    }

    // Calculate total with bonuses
    const currentTotal = breakdown.totalBeforeMultiplier + breakdown.bonusPoints;

    // Apply multiplier rules
    for (const [ruleId, ruleConfig] of sortedRules) {
      if (!ruleConfig.enabled || ruleConfig.ruleType !== 'multiplier') continue;

      if (this.evaluateCondition(ruleConfig.condition, context)) {
        breakdown.multiplierValue *= ruleConfig.value;
        breakdown.appliedMultipliers.push({
          id: ruleId,
          name: ruleConfig.name,
          value: ruleConfig.value
        });
        appliedRules.push(ruleId);
      }
    }

    // Apply final multiplier
    breakdown.totalPoints = Math.floor(currentTotal * breakdown.multiplierValue);

    const calculationTime = Date.now() - startTime;

    return {
      totalPoints: breakdown.totalPoints,
      breakdown,
      status: CalculationStatus.COMPLETED,
      calculationTime,
      exerciseKey: params.exerciseKey,
      exerciseNameHe: exerciseConfig.nameHe,
      appliedRules,
      errors: [],
      warnings: []
    };
  }

  /**
   * Safely evaluate a condition string with context
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    if (!condition) return true;

    try {
      // Simple condition parser for safety
      // Supports: variable >= value, variable > value, variable == value, etc.
      const match = condition.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(.+)$/);
      if (!match) return false;

      const [, variable, operator, valueStr] = match;
      const contextValue = context[variable];
      const compareValue = valueStr === 'true' ? true :
                          valueStr === 'false' ? false :
                          isNaN(parseFloat(valueStr)) ? valueStr.replace(/['"]/g, '') :
                          parseFloat(valueStr);

      switch (operator) {
        case '>=': return contextValue >= compareValue;
        case '<=': return contextValue <= compareValue;
        case '>': return contextValue > compareValue;
        case '<': return contextValue < compareValue;
        case '==': return contextValue == compareValue;
        case '!=': return contextValue != compareValue;
        default: return false;
      }
    } catch (error) {
      console.warn(`Failed to evaluate condition '${condition}':`, error);
      return false;
    }
  }

  /**
   * Check achievements for a user
   */
  async checkAchievements(userStats: Record<string, any>): Promise<AchievementConfig[]> {
    const earnedAchievements: AchievementConfig[] = [];

    for (const [achievementId, achievementConfig] of Object.entries(this.achievementsConfig)) {
      if (!achievementConfig.enabled) continue;

      if (this.evaluateCondition(achievementConfig.condition, userStats)) {
        earnedAchievements.push(achievementConfig);
      }
    }

    return earnedAchievements;
  }

  /**
   * Reload configuration from YAML files
   */
  async reloadConfig(): Promise<void> {
    console.log('🔄 Reloading points configuration...');
    this.configLoaded = false;
    this.memoryCache.clear();
    if (this.redis) {
      await this.redis.flushdb();
    }
    await this.initialize();
    console.log('✅ Configuration reloaded successfully');
  }

  /**
   * Get from cache (Redis or memory)
   */
  async cacheGet(key: string): Promise<any> {
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.warn('Redis get failed:', error);
      }
    }

    return this.memoryCache.get(key);
  }

  /**
   * Set to cache (Redis or memory)
   */
  async cacheSet(key: string, value: any, ttl?: number): Promise<void> {
    const cacheTTL = ttl || this.cacheTTL;

    if (this.redis) {
      try {
        await this.redis.setex(key, cacheTTL, JSON.stringify(value));
        return;
      } catch (error) {
        console.warn('Redis set failed:', error);
      }
    }

    this.memoryCache.set(key, value);
  }

  /**
   * Create empty breakdown for error cases
   */
  private createEmptyBreakdown(): PointsBreakdown {
    return {
      basePoints: 0,
      repsPoints: 0,
      setsPoints: 0,
      weightPoints: 0,
      distancePoints: 0,
      durationPoints: 0,
      bonusPoints: 0,
      multiplierValue: 1.0,
      totalBeforeMultiplier: 0,
      totalPoints: 0,
      appliedBonuses: [],
      appliedMultipliers: []
    };
  }

  /**
   * Get all exercise configurations
   */
  getAllExercises(): ExerciseConfig[] {
    return Object.values(this.exercisesConfig).filter(ex => ex.enabled);
  }

  /**
   * Get all rules
   */
  getAllRules(): RuleConfig[] {
    return Object.values(this.rulesConfig).filter(rule => rule.enabled);
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): AchievementConfig[] {
    return Object.values(this.achievementsConfig).filter(ach => ach.enabled);
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
export const pointsEngineV3 = new PointsEngineV3();
