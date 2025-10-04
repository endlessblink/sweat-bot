const OpenAI = require('openai');

const apiKey = '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';

console.log('Testing OpenAI API Key...');
console.log('Key starts with:', apiKey.substring(0, 15));

const openai = new OpenAI({ apiKey });

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hi in 3 words' }],
      max_tokens: 10
    });
    console.log('✅ API Key is valid!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ API Key test failed:', error.message);
    if (error.status === 401) {
      console.log('The API key is invalid or expired.');
    }
  }
}

test();