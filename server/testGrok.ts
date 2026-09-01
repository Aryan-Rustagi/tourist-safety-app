async function testGrok() {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer FAKE_KEY`,
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}
testGrok();
