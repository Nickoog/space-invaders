import type { QuestionData, GameState } from '../types.js';
import { FALLBACK_QUESTIONS } from './fallbackQuestions.js';
import { QUESTION_POOL_TARGET, QUESTION_TIMEOUT_MS } from '../constants.js';
import { GEEK_PROMPTS, GEEK_TOPICS, POKEMON_TYPE_PROMPTS, getDifficultyTier } from './promptLibrary.js';
import type { PokemonType } from '../api/pokeapi.js';
import { shuffleArray } from '../utils.js';

// ── Post-processing ──────────────────────────────────────────────────────────

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

// re-export so tests and callers that import from this module continue to work
export { shuffleArray } from '../utils.js';

// Ensures display limits and randomizes choice order (correct_answer is text-matched, not index-based).
function normalizeQuestion(q: QuestionData): QuestionData {
  const choices = shuffleArray(q.choices.map(c => truncate(c, 30)));
  const correct = truncate(q.correct_answer, 30);
  return { ...q, question: truncate(q.question, 80), choices, correct_answer: correct };
}

// ── Fallback shuffle queue ───────────────────────────────────────────────────

// Cycles through all fallback questions in shuffled order before repeating any.
let _fallbackQueue: number[] = [];
let _fallbackCursor = 0;

// ── Public API ───────────────────────────────────────────────────────────────

export function getRandomFallback(): QuestionData {
  if (_fallbackCursor >= _fallbackQueue.length) {
    _fallbackQueue = shuffleArray(Array.from({ length: FALLBACK_QUESTIONS.length }, (_, i) => i));
    _fallbackCursor = 0;
  }
  const idx = _fallbackQueue[_fallbackCursor++]!;
  const q = FALLBACK_QUESTIONS[idx]!;
  return { ...q, choices: shuffleArray([...q.choices]), source: 'fallback' };
}

async function callHaiku(systemPrompt: string, userPrompt: string, label: string): Promise<QuestionData> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userPrompt }),
        signal: AbortSignal.timeout(QUESTION_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as QuestionData;
      return { ...normalizeQuestion(data), source: 'ai' };
    } catch (err) {
      if (attempt < 1) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      console.debug(`[AI] erreur (${label}) — fallback`, err);
    }
  }
  return getRandomFallback();
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

async function generatePokemonQuestion(levelType: PokemonType, level: number, history: string[]): Promise<QuestionData> {
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
