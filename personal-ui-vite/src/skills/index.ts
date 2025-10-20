/**
 * SweatBot Skills System
 * Main entry point for the advanced skills framework
 */

// Core exports
export * from './core';

// Skill implementations
export { ExerciseAnalyzerSkill } from './fitness/exerciseAnalyzer';
export { WorkoutPlannerSkill } from './fitness/workoutPlanner';
export { HealthMonitorSkill } from './health/healthMonitor';
export { NutritionTrackerSkill } from './nutrition/nutritionTracker';

// Registry and setup
import { skillRegistry } from './core/registry';
import { ExerciseAnalyzerSkill } from './fitness/exerciseAnalyzer';
import { WorkoutPlannerSkill } from './fitness/workoutPlanner';
import { HealthMonitorSkill } from './health/healthMonitor';
import { NutritionTrackerSkill } from './nutrition/nutritionTracker';

/**
 * Initialize and register all available skills
 */
export function initializeSkills() {
  console.log('🚀 Initializing SweatBot Skills System...');

  // Register all skills
  skillRegistry.register(new ExerciseAnalyzerSkill());
  skillRegistry.register(new WorkoutPlannerSkill());
  skillRegistry.register(new HealthMonitorSkill());
  skillRegistry.register(new NutritionTrackerSkill());

  const stats = skillRegistry.getStats();
  console.log(`✅ Skills System Initialized:`);
  console.log(`   - Total skills: ${stats.totalSkills}`);
  console.log(`   - Categories: ${Object.keys(stats.categoryBreakdown).join(', ')}`);

  return skillRegistry;
}

/**
 * Get skill recommendations based on user input
 */
export async function getSkillRecommendations(input: string, context: any) {
  const { skillEngine } = await import('./core/engine');
  return await skillEngine.getRecommendedSkills(input, context);
}

/**
 * Execute a skill by ID
 */
export async function executeSkill(skillId: string, input: any, context: any) {
  const { skillEngine } = await import('./core/engine');
  return await skillEngine.executeSkill(skillId, input, context);
}

/**
 * Get all available skills by category
 */
export function getSkillsByCategory(category: string) {
  const { SkillCategory } = require('./core/types');
  return skillRegistry.getSkillsByCategory(category as any);
}

/**
 * Search for skills by query
 */
export function searchSkills(query: string) {
  return skillRegistry.searchSkills(query);
}

/**
 * Get skill information
 */
export function getSkillInfo(skillId: string) {
  const skill = skillRegistry.getSkill(skillId);
  return skill ? skill.getInfo() : null;
}

// Auto-initialize when imported
initializeSkills();