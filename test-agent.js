// Simple test to verify SweatBot Agent functionality
// Run with: node test-agent.js

import { getSweatBotAgent } from './personal-ui-vite/src/agent/index.ts';

async function testAgent() {
  console.log('🧪 Testing SweatBot Agent...');
  
  try {
    const agent = getSweatBotAgent();
    console.log('✅ Agent created successfully');
    console.log('Agent status:', agent.getStatus());
    
    // Test a simple Hebrew exercise command
    console.log('\n🧪 Testing Hebrew exercise: "עשיתי 4 טיפוסי חבל"');
    const response = await agent.chat('עשיתי 4 טיפוסי חבל');
    console.log('🤖 Response:', response);
    
  } catch (error) {
    console.error('❌ Agent test failed:', error);
    console.error('Error details:', error.stack);
  }
}

testAgent();