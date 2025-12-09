#!/usr/bin/env node
const fetch = global.fetch;
const url = process.env.CHATBOT_URL ?? 'http://127.0.0.1:3000/api/chat';
const prompt = process.argv.slice(2).join(' ') || 'List the available tools.';
const payload = {
  messages: [
    {
      id: 'debug-1',
      role: 'user',
      content: prompt,
      parts: [
        { type: 'text', text: prompt }
      ],
    },
  ],
};
(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`[debug-chatbot] Status: ${res.status} ${res.statusText}`);
    if (!res.ok || !res.body) {
      const text = await res.text();
      console.error('[debug-chatbot] Error body:', text);
      process.exit(1);
    }
    const reader = res.body.getReader();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += Buffer.from(value).toString('utf8');
    }
    console.log('[debug-chatbot] Raw stream:\n');
    console.log(buffer);
  } catch (error) {
    console.error('[debug-chatbot] Request failed:', error);
    process.exit(1);
  }
})();
