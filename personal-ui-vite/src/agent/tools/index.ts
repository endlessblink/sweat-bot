/**
 * SweatBot Tools Index
 * Exports all tool implementations for the Volt Agent
 */

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
