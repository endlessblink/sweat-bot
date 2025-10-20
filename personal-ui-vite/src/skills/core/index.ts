/**
 * SweatBot Skills Framework
 * Core exports for the skills system
 */

// Core types and interfaces
export {
  Skill,
  SkillRegistry,
  SkillEngine,
  SkillConfig,
  SkillContext,
  SkillResult,
  ValidationResult,
  SkillCategory,
  SkillInfo,
  SkillMetrics,
  SkillAnalytics,
  BaseSkill,
  createSkillContext,
  type UserPreferences,
  type UserProfile,
  type VisualizationData,
  type SkillExample
} from './types';

// Registry implementation
export { DefaultSkillRegistry, skillRegistry } from './registry';

// Engine implementation
export { DefaultSkillEngine, skillEngine } from './engine';