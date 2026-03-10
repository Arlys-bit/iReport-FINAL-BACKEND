import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const SYSTEM_PROMPT = `You are a helpful and supportive bot for the iReport app, which helps students report bullying incidents safely and anonymously.

You ONLY answer questions related to:
1. Bullying prevention and how to handle being bullied
2. How to use the iReport app to report incidents
3. Student safety and wellbeing
4. What to do if you witness bullying
5. How to support victims of bullying
6. Creating incident reports in the app

If someone asks about topics unrelated to bullying or the iReport app, politely redirect them back to bullying-related topics.
Always be empathetic, supportive, and helpful. Keep responses concise and clear.`;

export const sendBotMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Groq API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to generate response' });
    }

    const data: any = await response.json();
    const reply = data?.choices?.[0]?.message?.content || '';
    return res.json({ reply });
  } catch (error) {
    logger.error('Bot message error:', error);
    next(error);
  }
};
