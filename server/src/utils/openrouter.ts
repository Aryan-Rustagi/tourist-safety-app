import OpenAI from 'openai';

/* ─────────────────────────────────────────────────────────
   Lazy-initialized OpenRouter client.
   Must be lazy because dotenv loads AFTER module imports.
───────────────────────────────────────────────────────── */
let client: OpenAI;
const getClient = () => {
  if (!client) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      console.error('[OpenRouter] WARNING: OPENROUTER_API_KEY is not set!');
    }
    client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: key || 'missing-key',
    });
  }
  return client;
};

/* ─────────────────────────────────────────────────────────
   Free model fallback chain – tried in priority order.
   All models are completely FREE on OpenRouter.
───────────────────────────────────────────────────────── */
const FALLBACK_MODELS = [
  'deepseek/deepseek-r1-0528',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen3-coder',
  'google/gemma-3-27b-it',
];

const defaultSafetyPrompt = `You are a tourist safety assistant for travelers in India. Be calm, concise, and practically helpful. If someone appears in immediate danger, tell them to call 112 immediately. Offer actionable next steps, and if needed, advise moving to a public place, contacting trusted people, or contacting 1363 for tourist assistance. Never sound robotic or dismissive. Keep responses short and clear.`;

const localSafetyReply = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('emergency') || normalized.includes('danger') || normalized.includes('help') || normalized.includes('attack') || normalized.includes('stalk')) {
    return 'If you are in immediate danger, move to a public place, tell a nearby staff member or police officer, and call 112 now. For tourist help, call 1363. Share your exact location if you can.';
  }
  if (normalized.includes('first aid') || normalized.includes('injur') || normalized.includes('bleed') || normalized.includes('accident')) {
    return 'For serious injury, call 112. Apply firm pressure to bleeding with clean cloth, avoid moving someone with a possible neck or back injury, and stay with them until responders arrive.';
  }
  if (normalized.includes('lost') || normalized.includes('route') || normalized.includes('stranded')) {
    return 'Stay where other people can see you, avoid isolated shortcuts, and contact 112 or 1363. Share your live location with a trusted contact or local authority.';
  }
  return 'I can help with emergency steps, first aid, getting lost, and tourist safety. For immediate danger, call 112 first. What is happening right now?';
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readContentText = (value: any): string | null => {
  if (!value) return null;

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const joined = value.map(readContentText).filter(Boolean).join('\n');
    return joined || null;
  }

  if (typeof value === 'object') {
    if (typeof value.text === 'string') return value.text;
    if (typeof value.content === 'string') return value.content;
    if (Array.isArray(value.content)) return readContentText(value.content);
    if (Array.isArray(value.parts)) return readContentText(value.parts);
    if (value.message && typeof value.message === 'object') return readContentText(value.message);
  }

  return null;
};

const callGrok = async (messages: any[]) => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = readContentText(data?.choices?.[0]?.message?.content) || readContentText(data?.choices?.[0]?.message);
  if (!text) throw new Error('Empty response from Grok');

  return { role: 'assistant', content: text };
};

const callGemini = async (messages: any[], apiKey?: string) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;

  const conversation = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key.trim()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: defaultSafetyPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: conversation }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = readContentText(data?.candidates?.[0]?.content?.parts);
  if (!text) throw new Error('Empty response from Gemini');

  return { role: 'assistant', content: text };
};

/**
 * Sends a chat request using a provider fallback chain.
 * Priorities: Grok -> Gemini -> Gemini Fallback -> OpenRouter free models -> local emergency fallback.
 */
export const sendChatWithFallback = async (history: any[], contextStr: string) => {
  const userMessage = history.find((item) => item.role === 'user')?.content || '';
  const messages = [
    { role: 'system', content: `${defaultSafetyPrompt}\n\n${contextStr}` },
    ...history,
  ];

  const callGeminiPrimary = (msgs: any[]) => callGemini(msgs, process.env.GEMINI_API_KEY);
  Object.defineProperty(callGeminiPrimary, 'name', { value: 'callGeminiPrimary' });

  const callGeminiFallback = (msgs: any[]) => callGemini(msgs, process.env.GEMINI_FALLBACK_API_KEY);
  Object.defineProperty(callGeminiFallback, 'name', { value: 'callGeminiFallback' });

  const providers = [callGeminiPrimary, callGrok, callGeminiFallback];

  for (const provider of providers) {
    try {
      const result = await provider(messages);
      if (result) {
        console.log(`[AI Chat] ✅ Success from provider: ${provider.name || 'custom'}`);
        return result;
      }
    } catch (error: any) {
      console.error(`[AI Chat] ❌ Provider failed: ${provider.name || 'custom'} → ${error.message}`);
    }
  }

  if (process.env.OPENROUTER_API_KEY) {
    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const currentModel = FALLBACK_MODELS[i];
      try {
        console.log(`[OpenRouter] Trying model ${i + 1}/${FALLBACK_MODELS.length}: ${currentModel}`);

        const response = await getClient().chat.completions.create({
          model: currentModel,
          messages: messages as any,
          max_tokens: 800,
        });

        const reply = readContentText(response.choices?.[0]?.message?.content) || readContentText(response.choices?.[0]?.message);
        if (!reply) throw new Error('Empty response from model');

        console.log(`[OpenRouter] ✅ Success with: ${currentModel}`);
        return response.choices[0].message;

      } catch (error: any) {
        console.error(`[OpenRouter] ❌ Failed: ${currentModel} → ${error.message}`);

        if (i < FALLBACK_MODELS.length - 1) {
          await delay(500);
        }
      }
    }
  }

  console.error('[AI Chat] All providers failed. Returning emergency fallback.');
  return {
    role: 'assistant',
    content: localSafetyReply(userMessage),
  };
};
