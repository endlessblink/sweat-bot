/**
 * SweatBot Tools Index
 * Exports all tool implementations for the Volt Agent
 */

export { exerciseLoggerTool } from './exerciseLogger';
export { statsRetrieverTool } from './statsRetriever';
export { dataManagerTool } from './dataManager';
export { goalSetterTool } from './goalSetter';
export { progressAnalyzerTool } from './progressAnalyzer';
export { workoutSuggesterTool } from './workoutSuggester';

// Export as array for easy agent initialization
export const allTools = [
  exerciseLoggerTool,
  statsRetrieverTool,
  dataManagerTool,
  goalSetterTool,
  progressAnalyzerTool,
  workoutSuggesterTool
];