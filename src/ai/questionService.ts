import { generateText, Output } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { QuestionData, GameState } from '../types.js';
import { FALLBACK_QUESTIONS } from './fallbackQuestions.js';
import { getPlayerInterests, getPlayerAge } from './onboarding.js';
import { QUESTION_POOL_TARGET, QUESTION_TIMEOUT_MS } from '../constants.js';

// ── Zod schema (source of truth for the AI response shape) ───────────────────

const QuestionSchema = z.object({
  question: z.string().min(5).max(120),
  type: z.literal('multiple_choice'),
  choices: z.array(z.string().max(50)).min(4).max(4),
  correct_answer: z.string().min(1).max(50),
  humor_level: z.enum(['mild', 'absurd']),
});

// ── Age profile helper ───────────────────────────────────────────────────────

function ageProfile(age: number): string {
  if (age < 10)  return `${age} ans. Dessin animé/Pokémon. Très simple.`;
  if (age < 14)  return `${age} ans. Jeux vidéo/youtubeurs. Accessible.`;
  if (age < 18)  return `${age} ans. Ado. Mèmes/gaming. Piquant OK.`;
  if (age < 30)  return `${age} ans. Pop culture actuelle. Cynique OK.`;
  if (age < 50)  return `${age} ans. Nostalgie 80-90. Culture générale.`;
  return          `${age} ans. Classiques cinéma/sport. Soutenu.`;
}

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Quiz master. Langue : français.
Question liée aux intérêts du joueur, adaptée à son âge.
4 options : 1 correcte, 3 plausibles ou drôles.
mild = jeu de mots / référence culturelle.
absurd = scénario surréaliste / chute inattendue.
Question ≤ 12 mots. Chaque option ≤ 4 mots. Style télégraphique.`;
 
// ── Game context builder ─────────────────────────────────────────────────────

const FLAVOR_CONTEXTS = [
  'a raté un Pokémon légendaire de justesse',
  'essaie d\'attraper Pikachu depuis trop longtemps',
  'a réussi un tir impossible mais personne n\'a vu',
  'est encerclé par des Magicarpes en colère',
  'vient de se faire surprendre par une Ronflex',
  'pense pouvoir battre le record mais en doute',
  'a raté le dernier ennemi de la vague',
  'est convaincu que les Pokéballs sont buguées',
] as const;

// Returns a situation string derived from actual game state when available.
function buildGameContext(game: GameState): string {
  const { score, lives, level } = game;

  if (lives === 1 && score === 0)  return 'commence la partie et est déjà en danger';
  if (lives === 1)                 return `est à sa dernière vie (${score} pts) et sue à grosses gouttes`;
  if (level >= 3 && lives === 3)   return `domine la vague ${level} sans une égratignure`;
  if (level >= 3)                  return `survit péniblement à la vague ${level}`;
  if (score === 0)                 return 'vient de commencer et n\'a encore rien attrapé';
  if (score > 3000)                return `accumule ${score} points et commence à se croire invincible`;
  if (score > 1000)                return `progresse bien avec ${score} points`;

  return FLAVOR_CONTEXTS[Math.floor(Math.random() * FLAVOR_CONTEXTS.length)]!;
}

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

export async function generateQuestion(
  interests: string[],
  _lastType: 'multiple_choice' | null,
  age?: number | null,
  context?: string,
): Promise<QuestionData> {
  const provider = getProvider();
  if (!provider) {
    console.debug('[AI] pas de provider — fallback');
    return getRandomFallback();
  }
 
  const resolvedAge = age ?? getPlayerAge();
 
  const humorLevel = Math.random() < 0.4 ? 'absurd' : 'mild';
  const resolvedContext = context ?? 'joue à Space Invaders';

  const prompt = [
    `Intérêts : ${interests.join(', ')}`,
    resolvedAge !== null ? `Âge : ${resolvedAge} ans (${ageProfile(resolvedAge)})` : '',
    `Situation : le joueur ${resolvedContext}`,
    `Humour : ${humorLevel}`,
  ]
    .filter(Boolean)
    .join('\n');
 
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUESTION_TIMEOUT_MS);
 
  try {
    const result = await generateText({
      model: provider('claude-haiku-4-5-20251001'),
      output: Output.object({ schema: QuestionSchema }),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 300,
      temperature: 0.9,
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

  // Read interests and age from the active profile — falls back to legacy keys if absent
  const interests = game.activeProfile?.interests ?? getPlayerInterests() ?? [];
  if (interests.length === 0) return;

  const age = game.activeProfile?.age ?? getPlayerAge();

  for (let i = 0; i < needed; i++) {
    try {
      const question = await generateQuestion(interests, game.lastQuestionType, age, buildGameContext(game));
      game.questionPool.push(question);
    } catch {
      // Pool stays smaller — fallback will be used at question time
    }
  }
}
