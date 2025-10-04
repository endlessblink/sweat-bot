/**
 * Test script for Volt Agent integration
 * Tests all 6 tools with Hebrew commands
 */

import { getSweatBotAgent } from './src/agent/index';

// Set up environment variables for testing
process.env.VITE_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
process.env.VITE_GROQ_API_KEY = process.env.GROQ_API_KEY || '';
process.env.VITE_BACKEND_URL = 'http://localhost:8000';

async function testVoltAgent() {
  console.log('🚀 Starting Volt Agent Tests...\n');
  
  const agent = getSweatBotAgent({
    userId: 'test-user',
    preferredModel: 'gemini',
    enableMemory: true
  });
  
  // Test cases for all 6 tools
  const testCases = [
    {
      name: 'Exercise Logger (Hebrew)',
      input: 'עשיתי 20 סקוואטים',
      expectedTool: 'ExerciseLogger'
    },
    {
      name: 'Statistics Retriever (Hebrew)',
      input: 'כמה נקודות יש לי?',
      expectedTool: 'StatsRetriever'
    },
    {
      name: 'Data Manager (Hebrew)',
      input: 'אפס את הנקודות שלי',
      expectedTool: 'DataManager'
    },
    {
      name: 'Goal Setter (English)',
      input: 'Set me a goal of 100 squats this week',
      expectedTool: 'GoalSetter'
    },
    {
      name: 'Progress Analyzer (Hebrew)',
      input: 'איך אני מתקדם?',
      expectedTool: 'ProgressAnalyzer'
    },
    {
      name: 'Workout Suggester (Hebrew)',
      input: 'מה לעשות היום?',
      expectedTool: 'WorkoutSuggester'
    }
  ];
  
  console.log('Running test cases...\n');
  
  for (const test of testCases) {
    console.log(`Test: ${test.name}`);
    console.log(`Input: "${test.input}"`);
    
    try {
      const response = await agent.chat(test.input);
      console.log(`✅ Response: ${response.substring(0, 100)}...`);
      console.log(`Expected Tool: ${test.expectedTool}\n`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }
  
  // Test agent status
  const status = agent.getStatus();
  console.log('Agent Status:', status);
}

// Run tests
testVoltAgent().catch(console.error);