import { generateText, Output } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { QuestionData, GameState } from '../types.js';
import { FALLBACK_QUESTIONS } from './fallbackQuestions.js';
import { QUESTION_POOL_TARGET, QUESTION_TIMEOUT_MS } from '../constants.js';

// ── Zod schema (source of truth for the AI response shape) ───────────────────

const QuestionSchema = z.object({
  question: z.string().min(5).max(120),
  type: z.literal('multiple_choice'),
  choices: z.array(z.string().max(50)).min(4).max(4),
  correct_answer: z.string().min(1).max(50),
  humor_level: z.enum(['mild', 'absurd']),
});

// ── System prompt (fixed — no dynamic personalization) ───────────────────────

const SYSTEM_PROMPT = `Tu es un quiz master pour un jeu Pokémon Invaders.
Génère une question de culture générale fun pour un ado de 17 ans.
Thèmes à varier : Pokémon, jeux vidéo, TikTok/YouTube/réseaux sociaux, films/séries, sport, culture pop.
Format : 1 question (≤60 caractères), 4 réponses courtes (≤25 caractères chacune), 1 correcte, 3 plausibles.
Style : mélange questions factuelles sérieuses et questions drôles/absurdes.
Langue : français uniquement.`;

// ── Post-processing ──────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

// Ensures display limits regardless of model output.
// Truncates choices and correct_answer identically so the comparison in modal.ts stays valid.
function normalizeQuestion(q: QuestionData): QuestionData {
  const choices = q.choices.map(c => truncate(c, 30));
  const correct = truncate(q.correct_answer, 30);
  return { ...q, question: truncate(q.question, 80), choices, correct_answer: correct };
}

// ── Provider (lazy singleton) ────────────────────────────────────────────────

let _provider: ReturnType<typeof createAnthropic> | null = null;

function getProvider(): ReturnType<typeof createAnthropic> | null {
  if (_provider) return _provider;
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') return null;
  _provider = createAnthropic({
    apiKey,
    // Required header for direct browser access — key is exposed in the bundle.
    // For production with real traffic, use a serverless proxy (Vercel/Netlify).
    headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
  });
  return _provider;
}

// ── Fallback shuffle queue ───────────────────────────────────────────────────

// Cycles through all fallback questions in shuffled order before repeating any.
let _fallbackQueue: number[] = [];
let _fallbackCursor = 0;

function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function getRandomFallback(): QuestionData {
  if (_fallbackCursor >= _fallbackQueue.length) {
    _fallbackQueue = shuffledIndices(FALLBACK_QUESTIONS.length);
    _fallbackCursor = 0;
  }
  const idx = _fallbackQueue[_fallbackCursor++]!;
  return FALLBACK_QUESTIONS[idx]!;
}

async function generateQuestion(): Promise<QuestionData> {
  const provider = getProvider();
  if (!provider) {
    console.debug('[AI] pas de provider — fallback');
    return getRandomFallback();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUESTION_TIMEOUT_MS);

  try {
    const result = await generateText({
      model: provider('claude-haiku-4-5-20251001'),
      output: Output.object({ schema: QuestionSchema }),
      system: SYSTEM_PROMPT,
      prompt: 'Génère une question.',
      maxOutputTokens: 300,
      temperature: 0.7,
      abortSignal: controller.signal,
      providerOptions: {
        anthropic: { structuredOutputMode: 'jsonTool' },
      },
    });
    clearTimeout(timeout);

    const { inputTokens, outputTokens } = result.usage;
    console.debug(`[AI] question générée — in:${inputTokens} out:${outputTokens} tokens`);

    return normalizeQuestion(result.output);
  } catch (err) {
    clearTimeout(timeout);
    console.debug('[AI] erreur génération — fallback', err);
    return getRandomFallback();
  }
}

// Fills game.questionPool up to QUESTION_POOL_TARGET. Fire-and-forget — never throws.
export async function replenishPool(game: GameState): Promise<void> {
  const needed = QUESTION_POOL_TARGET - game.questionPool.length;
  if (needed <= 0) return;

  for (let i = 0; i < needed; i++) {
    try {
      const question = await generateQuestion();
      game.questionPool.push(question);
    } catch {
      // Pool stays smaller — fallback will be used at question time
    }
  }
}
