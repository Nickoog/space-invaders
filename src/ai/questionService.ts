import { generateText, Output } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { QuestionData, GameState } from '../types.js';
import { FALLBACK_QUESTIONS } from './fallbackQuestions.js';
import { QUESTION_POOL_TARGET, QUESTION_TIMEOUT_MS } from '../constants.js';
import { GEEK_PROMPTS, GEEK_TOPICS, POKEMON_TYPE_PROMPTS, getDifficultyTier } from './promptLibrary.js';

// ── Zod schema (source of truth for the AI response shape) ───────────────────

const QuestionSchema = z.object({
  question: z.string().min(5).max(120),
  type: z.literal('multiple_choice'),
  choices: z.array(z.string().max(50)).min(4).max(4),
  correct_answer: z.string().min(1).max(50),
  humor_level: z.enum(['mild', 'absurd']),
});


// ── Post-processing ──────────────────────────────────────────────────────────

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// Ensures display limits and randomizes choice order (correct_answer is text-matched, not index-based).
function normalizeQuestion(q: QuestionData): QuestionData {
  const choices = shuffleArray(q.choices.map(c => truncate(c, 30)));
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
  const q = FALLBACK_QUESTIONS[idx]!;
  return { ...q, choices: shuffleArray([...q.choices]), source: 'fallback' };
}

async function callHaiku(systemPrompt: string, userPrompt: string, label: string): Promise<QuestionData> {
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
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 300,
      temperature: 1.0,
      abortSignal: controller.signal,
      providerOptions: {
        anthropic: { structuredOutputMode: 'jsonTool' },
      },
    });
    clearTimeout(timeout);

    const { inputTokens, outputTokens } = result.usage;
    console.debug(`[AI] ${label} — in:${inputTokens} out:${outputTokens} tokens`);

    return { ...normalizeQuestion(result.output), source: 'ai' };
  } catch (err) {
    clearTimeout(timeout);
    console.debug(`[AI] erreur (${label}) — fallback`, err);
    return getRandomFallback();
  }
}

async function generateQuestion(history: string[], topicIndex: number, level: number): Promise<QuestionData> {
  const tier   = getDifficultyTier(level);
  const topic  = GEEK_TOPICS[topicIndex % GEEK_TOPICS.length]!;
  const avoid  = history.length > 0
    ? `\nQuestions déjà posées (à éviter) :\n${history.map(q => `- "${q}"`).join('\n')}`
    : '';
  const prompt = `Thème : ${topic}\nDifficulté : ${tier}${avoid}\n\nGénère une question.`;
  return callHaiku(GEEK_PROMPTS[tier], prompt, `geek/${topic}`);
}

async function generatePokemonQuestion(levelType: string, level: number, history: string[]): Promise<QuestionData> {
  const tier   = getDifficultyTier(level);
  const system = POKEMON_TYPE_PROMPTS[levelType] ?? POKEMON_TYPE_PROMPTS['fire']!;
  const avoid  = history.length > 0
    ? `\nQuestions déjà posées (à éviter) :\n${history.map(q => `- "${q}"`).join('\n')}`
    : '';
  const prompt = `Niveau ${level}/17 — Difficulté : ${tier}${avoid}\n\nGénère une question.`;
  return callHaiku(system, prompt, `pokémon-type/${levelType}`);
}

function trackInHistory(game: GameState, question: QuestionData): void {
  game.questionHistory.push(question.question);
  if (game.questionHistory.length > 25) game.questionHistory.shift();
}

// Fills game.questionPool (geek culture) up to QUESTION_POOL_TARGET.
export async function replenishPool(game: GameState): Promise<void> {
  const needed = QUESTION_POOL_TARGET - game.questionPool.length;
  if (needed <= 0) return;

  for (let i = 0; i < needed; i++) {
    try {
      const question = await generateQuestion(game.questionHistory, game.topicIndex, game.level);
      game.questionPool.push(question);
      game.topicIndex++;
      trackInHistory(game, question);
    } catch {
      // Pool stays smaller — fallback will be used at question time
    }
  }
}

// Fills game.pokemonTypePool (type-specific) up to QUESTION_POOL_TARGET.
export async function replenishPokemonPool(game: GameState): Promise<void> {
  const needed = QUESTION_POOL_TARGET - game.pokemonTypePool.length;
  if (needed <= 0) return;

  const levelType = game.grid?.levelType ?? 'fire';
  for (let i = 0; i < needed; i++) {
    try {
      const question = await generatePokemonQuestion(levelType, game.level, game.questionHistory);
      game.pokemonTypePool.push(question);
      trackInHistory(game, question);
    } catch {
      // Pool stays smaller — fallback will be used at question time
    }
  }
}
