import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
import OpenAI from 'openai';

async function testGrok() {
  console.log('--- Testing Grok ---');
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.log('⚠️ XAI_API_KEY is not set in .env');
    return;
  }
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: 'Say "hello from Grok"' }],
        temperature: 0.5,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Grok failed: ${response.status} ${errText}`);
    } else {
      const data = await response.json();
      console.log(`✅ Grok Success:`, data.choices[0].message.content);
    }
  } catch (err: any) {
    console.error(`❌ Grok Exception:`, err.message);
  }
}

async function testGemini() {
  console.log('\n--- Testing Gemini ---');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('⚠️ GEMINI_API_KEY is not set in .env');
    return;
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say "hello from Gemini"' }] }],
        }),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Gemini failed: ${response.status} ${errText}`);
    } else {
      const data = await response.json();
      console.log(`✅ Gemini Success:`, data.candidates[0].content.parts[0].text);
    }
  } catch (err: any) {
    console.error(`❌ Gemini Exception:`, err.message);
  }
}

async function testOpenRouter() {
  console.log('\n--- Testing OpenRouter (first model) ---');
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log('⚠️ OPENROUTER_API_KEY is not set in .env');
    return;
  }
  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
  const model = 'deepseek/deepseek-r1-0528';
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Say "hello from OpenRouter"' }],
      max_tokens: 500,
    });
    console.log(`✅ OpenRouter (${model}) Success:`, response.choices[0].message.content);
  } catch (err: any) {
    console.error(`❌ OpenRouter Exception:`, err.message);
  }
}

async function runAll() {
  await testGrok();
  await testGemini();
  await testOpenRouter();
  console.log('\n--- All tests complete ---');
}

runAll();
