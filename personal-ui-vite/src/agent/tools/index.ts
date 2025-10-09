/**
 * SweatBot Tools Index
 * Exports all tool implementations for the Volt Agent
 */

import { exerciseLoggerTool } from './exerciseLogger';
import { statsRetrieverTool } from './statsRetriever';
import { dataManagerTool } from './dataManager';
import { goalSetterTool } from './goalSetter';
import { progressAnalyzerTool } from './progressAnalyzer';

export {
  exerciseLoggerTool,
  statsRetrieverTool,
  dataManagerTool,
  goalSetterTool,
  progressAnalyzerTool
};

// Export as array for easy agent initialization
export const allTools = [
  exerciseLoggerTool,
  statsRetrieverTool,
  dataManagerTool,
  goalSetterTool,
  progressAnalyzerTool
];
