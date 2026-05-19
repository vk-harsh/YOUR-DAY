module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const API_KEY = process.env.AI_API_KEY;
    const API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'; // or deepseek/deepseek-chat for openrouter

    if (!API_KEY) {
      return res.status(500).json({ error: 'AI_API_KEY is not set in environment variables' });
    }

    // Prepare system prompt with the planner context
    const systemPrompt = `You are a helpful, concise productivity assistant embedded within "Your Day", a daily planner app.
Your job is to help the user plan their day, suggest habits, and provide brief study guidance.
Current app context:
- Date: ${context?.date || 'Unknown'}
- Open Primary Habits: ${context?.openPrimary || 0}
- Open Secondary Tasks: ${context?.openSecondary || 0}
Keep your answers brief (1-3 sentences) and action-oriented.`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        // For OpenRouter, you can optionally set:
        // 'HTTP-Referer': 'https://yourday-planner.vercel.app',
        // 'X-Title': 'Your Day',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to fetch response from AI' });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "I couldn't process that.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
