import { generateText, Output } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const QuestionSchema = z.object({
  question:       z.string().min(5).max(160),
  type:           z.literal('multiple_choice'),
  choices:        z.array(z.string().max(50)).min(4).max(4),
  correct_answer: z.string().min(1).max(60),
});

const TIMEOUT_MS = 12_000;

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode: 500, body: 'API key not configured' };

  let systemPrompt: string;
  let userPrompt: string;
  try {
    ({ systemPrompt, userPrompt } = JSON.parse(event.body ?? '{}') as {
      systemPrompt: string;
      userPrompt: string;
    });
  } catch {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const anthropic = createAnthropic({ apiKey });
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      output: Output.object({ schema: QuestionSchema }),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 300,
      temperature: 1.0,
      providerOptions: { anthropic: { structuredOutputMode: 'jsonTool' } },
      abortSignal: controller.signal,
    });
    clearTimeout(timeout);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.output),
    };
  } catch {
    clearTimeout(timeout);
    return { statusCode: 500, body: JSON.stringify({ error: 'AI generation failed' }) };
  }
};
