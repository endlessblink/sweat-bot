// Simple test to verify the core functions don't crash
console.log('Testing core components...');

// Test 1: ResponseSanitizer
try {
  const { isResponseSafe, sanitizeResponse } = require('./src/agent/utils/responseSanitizer.ts');
  console.log('✅ ResponseSanitizer imports successfully');
  
  const testResponse = "שלום! איך אני יכול לעזור לך?";
  const isSafe = isResponseSafe(testResponse);
  console.log('✅ isResponseSafe works:', isSafe);
  
  const cleaned = sanitizeResponse(testResponse);
  console.log('✅ sanitizeResponse works:', cleaned.substring(0, 50));
  
} catch (error) {
  console.error('❌ ResponseSanitizer test failed:', error.message);
}

// Test 2: Check API keys
const apiKeys = {
  gemini: process.env.VITE_GEMINI_API_KEY || 'MISSING',
  groq: process.env.VITE_GROQ_API_KEY || 'MISSING',
  openai: process.env.VITE_OPENAI_API_KEY || 'MISSING'
};

console.log('API Keys status:', Object.entries(apiKeys).map(([k, v]) => `${k}: ${v.length > 10 ? 'SET' : 'MISSING'}`).join(', '));

console.log('Core tests completed!');