/**
 * SweatBot Skill Execution Engine
 * Handles skill execution, chaining, and recommendation logic
 */

import {
  Skill,
  SkillEngine,
  SkillContext,
  SkillResult,
  SkillCategory,
  ValidationResult
} from './types';
import { skillRegistry } from './registry';

export class DefaultSkillEngine implements SkillEngine {
  private executionCache = new Map<string, { result: SkillResult, timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Execute a single skill
   */
  public async executeSkill(
    skillId: string,
    input: any,
    context: SkillContext
  ): Promise<SkillResult> {
    const startTime = Date.now();

    try {
      // Get skill from registry
      const skill = skillRegistry.getSkill(skillId);
      if (!skill) {
        return {
          success: false,
          error: `Skill not found: ${skillId}`,
          metrics: {
            executionTime: Date.now() - startTime,
            memoryUsed: 0,
            dataPointsProcessed: 0
          }
        };
      }

      // Check cache if enabled
      if (skill.config.cacheable) {
        const cacheKey = this.getCacheKey(skillId, input, context);
        const cached = this.executionCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
          return {
            ...cached.result,
            metrics: {
              ...cached.result.metrics,
              executionTime: Date.now() - startTime
            }
          };
        }
      }

      // Validate input
      const validation = skill.validate(input);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          metrics: {
            executionTime: Date.now() - startTime,
            memoryUsed: 0,
            dataPointsProcessed: 0
          }
        };
      }

      // Use sanitized input if provided
      const finalInput = validation.sanitizedInput || input;

      // Check dependencies
      for (const depId of skill.dependencies) {
        const depSkill = skillRegistry.getSkill(depId);
        if (!depSkill) {
          return {
            success: false,
            error: `Dependency not found: ${depId}`,
            metrics: {
              executionTime: Date.now() - startTime,
              memoryUsed: 0,
              dataPointsProcessed: 0
            }
          };
        }
      }

      // Execute skill with timeout
      const result = await this.executeWithTimeout(skill, finalInput, context);

      // Update metrics
      result.metrics = {
        ...result.metrics,
        executionTime: Date.now() - startTime
      };

      // Cache result if enabled
      if (skill.config.cacheable && result.success) {
        const cacheKey = this.getCacheKey(skillId, finalInput, context);
        this.executionCache.set(cacheKey, {
          result: { ...result },
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
          dataPointsProcessed: 0
        }
      };
    }
  }

  /**
   * Execute a chain of skills in sequence
   */
  public async executeSkillChain(
    skillIds: string[],
    input: any,
    context: SkillContext
  ): Promise<SkillResult[]> {
    const results: SkillResult[] = [];
    let currentInput = input;

    for (const skillId of skillIds) {
      const result = await this.executeSkill(skillId, currentInput, context);
      results.push(result);

      // Stop chain if skill failed
      if (!result.success) {
        break;
      }

      // Use result data as input for next skill
      currentInput = result.data;
    }

    return results;
  }

  /**
   * Get recommended skills based on input and context
   */
  public async getRecommendedSkills(
    input: string,
    context: SkillContext
  ): Promise<Skill[]> {
    const allSkills = skillRegistry.getAllSkills();
    const recommendations: Array<{ skill: Skill, score: number }> = [];

    // Analyze input for skill recommendations
    const lowerInput = input.toLowerCase();

    for (const skill of allSkills) {
      let score = 0;

      // Keyword matching in skill name and description
      if (skill.name.toLowerCase().includes(lowerInput)) {
        score += 10;
      }
      if (skill.description.toLowerCase().includes(lowerInput)) {
        score += 5;
      }

      // Tag matching
      for (const tag of skill.tags) {
        if (tag.toLowerCase().includes(lowerInput)) {
          score += 3;
        }
      }

      // Context-based scoring
      score += this.scoreContextCompatibility(skill, context);

      // User preference matching
      score += this.scoreUserPreferenceCompatibility(skill, context);

      if (score > 0) {
        recommendations.push({ skill, score });
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(rec => rec.skill);
  }

  /**
   * Validate if a skill chain is valid
   */
  public validateSkillChain(skillIds: string[]): boolean {
    for (const skillId of skillIds) {
      const skill = skillRegistry.getSkill(skillId);
      if (!skill) {
        return false;
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const skillId of skillIds) {
      if (this.hasCircularDependency(skillId, visited, recursionStack)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute skill with timeout and retry logic
   */
  private async executeWithTimeout(
    skill: Skill,
    input: any,
    context: SkillContext
  ): Promise<SkillResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= skill.config.retryAttempts; attempt++) {
      try {
        return await Promise.race([
          skill.execute(input, context),
          this.createTimeoutPromise(skill.config.timeout)
        ]);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < skill.config.retryAttempts) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Skill execution timeout')), timeout);
    });
  }

  /**
   * Generate cache key for skill execution
   */
  private getCacheKey(skillId: string, input: any, context: SkillContext): string {
    const inputHash = this.simpleHash(JSON.stringify(input));
    const contextHash = this.simpleHash(JSON.stringify({
      userId: context.userId,
      userPreferences: context.userPreferences
    }));

    return `${skillId}:${inputHash}:${contextHash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Score skill compatibility with user context
   */
  private scoreContextCompatibility(skill: Skill, context: SkillContext): number {
    let score = 0;

    // Fitness level compatibility
    if (skill.tags.includes(context.userPreferences.fitnessLevel)) {
      score += 5;
    }

    // Goal alignment
    for (const goal of context.userPreferences.goals) {
      if (skill.tags.includes(goal)) {
        score += 3;
      }
    }

    // Equipment availability
    const equipmentTags = skill.tags.filter(tag =>
      context.userPreferences.availableEquipment.includes(tag)
    );
    score += equipmentTags.length * 2;

    // Time constraints
    if (skill.tags.includes('quick') && context.userPreferences.timeConstraints <= 15) {
      score += 3;
    }
    if (skill.tags.includes('long') && context.userPreferences.timeConstraints >= 45) {
      score += 3;
    }

    return score;
  }

  /**
   * Score skill compatibility with user preferences
   */
  private scoreUserPreferenceCompatibility(skill: Skill, context: SkillContext): number {
    let score = 0;

    // Workout type preferences
    for (const prefType of context.userPreferences.preferredWorkoutTypes) {
      if (skill.tags.includes(prefType)) {
        score += 4;
      }
    }

    // Language preference
    if (skill.tags.includes(context.userPreferences.language)) {
      score += 2;
    }

    // Category preferences based on goals
    const preferredCategories = this.getPreferredCategories(context.userPreferences.goals);
    if (preferredCategories.includes(skill.category)) {
      score += 6;
    }

    return score;
  }

  /**
   * Get preferred skill categories based on user goals
   */
  private getPreferredCategories(goals: string[]): SkillCategory[] {
    const categoryMap: Record<string, SkillCategory[]> = {
      'weight_loss': [SkillCategory.FITNESS_ANALYSIS, SkillCategory.WORKOUT_PLANNING],
      'muscle_gain': [SkillCategory.WORKOUT_PLANNING, SkillCategory.PERFORMANCE_OPTIMIZATION],
      'endurance': [SkillCategory.HEALTH_MONITORING, SkillCategory.WORKOUT_PLANNING],
      'flexibility': [SkillCategory.RECOVERY, SkillCategory.WORKOUT_PLANNING],
      'health': [SkillCategory.HEALTH_MONITORING, SkillCategory.NUTRITION],
      'nutrition': [SkillCategory.NUTRITION],
      'recovery': [SkillCategory.RECOVERY, SkillCategory.HEALTH_MONITORING]
    };

    const preferred = new Set<SkillCategory>();
    for (const goal of goals) {
      const categories = categoryMap[goal.toLowerCase()];
      if (categories) {
        categories.forEach(cat => preferred.add(cat));
      }
    }

    return Array.from(preferred);
  }

  /**
   * Check for circular dependencies in skill chains
   */
  private hasCircularDependency(
    skillId: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    if (recursionStack.has(skillId)) {
      return true;
    }

    if (visited.has(skillId)) {
      return false;
    }

    visited.add(skillId);
    recursionStack.add(skillId);

    const skill = skillRegistry.getSkill(skillId);
    if (skill) {
      for (const depId of skill.dependencies) {
        if (this.hasCircularDependency(depId, visited, recursionStack)) {
          return true;
        }
      }
    }

    recursionStack.delete(skillId);
    return false;
  }

  /**
   * Clear execution cache
   */
  public clearCache(): void {
    this.executionCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [_, entry] of this.executionCache) {
      if (now - entry.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.executionCache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }
}

// Global engine instance
export const skillEngine = new DefaultSkillEngine();