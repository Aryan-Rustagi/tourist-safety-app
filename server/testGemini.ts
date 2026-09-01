import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const defaultSafetyPrompt = `You are a safety assistant.`;
const key = process.env.GEMINI_API_KEY;

console.log('GEMINI_API_KEY loaded:', key ? 'YES (' + key.substring(0, 5) + '...)' : 'NO');

async function testGemini() {
  const conversation = "USER: hello";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: defaultSafetyPrompt }] },
          contents: [{ role: 'user', parts: [{ text: conversation }] }],
        }),
      }
    );
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
testGemini();
