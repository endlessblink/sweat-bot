import { config } from 'dotenv';
config();

// Mock browser environment
global.window = {
  location: { href: 'http://localhost:8005' }
};
global.document = {};

async function testAgent() {
  console.log('Testing SweatBot Agent...');
  
  // Test API keys
  console.log('VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'SET' : 'MISSING');
  console.log('VITE_GROQ_API_KEY:', process.env.VITE_GROQ_API_KEY ? 'SET' : 'MISSING');
  
  try {
    // Import and test the agent
    const { getSweatBotAgent } = await import('./src/agent/index.ts');
    const agent = getSweatBotAgent();
    
    console.log('Agent created successfully');
    
    // Test a simple greeting
    const response = await agent.chat('שלום');
    console.log('Response:', response);
    console.log('Response type:', typeof response);
    console.log('Response length:', response?.length || 0);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAgent();