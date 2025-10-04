/**
 * Test Script - JSON Concatenation Bug Fix Verification
 * 
 * This script tests the VoltAgent directly to verify the JSON concatenation bug is fixed.
 * It simulates the exact scenario that was causing the issue.
 */

import { getSweatBotAgent } from './personal-ui-vite/src/agent/index.js';

async function testJSONConcatenationFix() {
  console.log('🧪 Testing JSON Concatenation Bug Fix...\n');
  
  try {
    // Initialize the SweatBot agent
    const agent = getSweatBotAgent({ userId: 'test-user' });
    
    // Test with Hebrew exercise command that was causing the bug
    const testMessage = "אני רוצה לתעד אימון";
    console.log(`📝 Test Message: "${testMessage}"`);
    console.log('Expected: Clean Hebrew response only');
    console.log('Bug Behavior: JSON object + Hebrew concatenation\n');
    
    // Call the agent
    console.log('🚀 Calling agent.chat()...');
    const response = await agent.chat(testMessage);
    
    // Analyze the response
    console.log('\n📊 RESPONSE ANALYSIS:');
    console.log('─'.repeat(50));
    console.log(`Response Type: ${typeof response}`);
    console.log(`Response Length: ${response?.length || 0}`);
    console.log(`Contains JSON: ${response.includes('{') && response.includes('}')}`);
    console.log(`Contains "model": ${response.includes('"model"')}`);
    console.log(`Contains "toolCalls": ${response.includes('"toolCalls"')}`);
    console.log('─'.repeat(50));
    console.log('\n📄 FULL RESPONSE:');
    console.log(`"${response}"`);
    
    // Verdict
    if (typeof response === 'string' && !response.includes('{"content"') && !response.includes('"model"')) {
      console.log('\n✅ SUCCESS: JSON concatenation bug is FIXED!');
      console.log('✅ Response is clean Hebrew text only');
    } else {
      console.log('\n❌ FAILED: JSON concatenation bug still present');
      console.log('❌ Response contains JSON objects mixed with Hebrew');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testJSONConcatenationFix().catch(console.error);