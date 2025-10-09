/**
 * Test script for GPT-5-mini integration with SweatBot
 * This script tests the new GPT-5 model with Hebrew language support and tool calling
 */

// Test 1: Basic Hebrew conversation without tools
async function testHebrewConversation() {
  console.log('\n=== Test 1: Basic Hebrew Conversation ===');

  try {
    const response = await fetch('http://localhost:8005', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'שלום, איך אתה?'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Hebrew conversation test passed');
      console.log('Response:', data.response?.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ Hebrew conversation test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Hebrew conversation test error:', error.message);
    return false;
  }
}

// Test 2: Exercise logging with tool calling
async function testExerciseLogging() {
  console.log('\n=== Test 2: Exercise Logging Tool Calling ===');

  try {
    const response = await fetch('http://localhost:8005', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'עשיתי 20 סקוואטים'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Exercise logging test passed');
      console.log('Response:', data.response?.substring(0, 100) + '...');

      // Check if exercise was logged (should contain "רשמתי" or similar)
      if (data.response?.includes('רשמתי') || data.response?.includes('נקודות')) {
        console.log('✅ Tool execution successful');
        return true;
      } else {
        console.log('⚠️ Tool execution may have failed');
        return false;
      }
    } else {
      console.log('❌ Exercise logging test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Exercise logging test error:', error.message);
    return false;
  }
}

// Test 3: Statistics retrieval
async function testStatisticsRetrieval() {
  console.log('\n=== Test 3: Statistics Retrieval ===');

  try {
    const response = await fetch('http://localhost:8005', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'כמה נקודות יש לי?'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Statistics retrieval test passed');
      console.log('Response:', data.response?.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ Statistics retrieval test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Statistics retrieval test error:', error.message);
    return false;
  }
}

// Test 4: Complex fitness query (tests reasoning)
async function testComplexFitnessQuery() {
  console.log('\n=== Test 4: Complex Fitness Query (Reasoning) ===');

  try {
    const response = await fetch('http://localhost:8005', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'אני רוצה להתחיל להתאמן, אני מתחיל מאפס. מה תמליץ לי להתחיל איתו ולאן להגיע בחודש הקרוב?'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Complex fitness query test passed');
      console.log('Response:', data.response?.substring(0, 200) + '...');

      // Check for reasonable response length (indicates good reasoning)
      if (data.response && data.response.length > 100) {
        console.log('✅ Good reasoning response length');
        return true;
      } else {
        console.log('⚠️ Short response, reasoning might be limited');
        return false;
      }
    } else {
      console.log('❌ Complex fitness query test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Complex fitness query test error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Testing GPT-5-mini Integration with SweatBot');
  console.log('==========================================');

  const tests = [
    { name: 'Hebrew Conversation', fn: testHebrewConversation },
    { name: 'Exercise Logging', fn: testExerciseLogging },
    { name: 'Statistics Retrieval', fn: testStatisticsRetrieval },
    { name: 'Complex Fitness Query', fn: testComplexFitnessQuery }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const result = await test.fn();
    if (result) passed++;

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passed}/${total} tests`);

  if (passed === total) {
    console.log('🎉 All tests passed! GPT-5-mini integration is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Check if server is running and run tests
async function main() {
  try {
    console.log('Checking if SweatBot server is running...');
    const response = await fetch('http://localhost:8005');

    if (response.ok) {
      console.log('✅ Server is running, starting tests...');
      await runAllTests();
    } else {
      console.log('❌ Server responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start SweatBot first:');
    console.log('   cd personal-ui-vite && npm run dev');
    console.log('   Then run this test again.');
  }
}

// Run the tests
main();