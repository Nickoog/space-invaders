import { generateText, Output } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { QuestionData, GameState } from '../types.js';
import { FALLBACK_QUESTIONS } from './fallbackQuestions.js';
import { getPlayerInterests, getPlayerAge } from './onboarding.js';
import { QUESTION_POOL_TARGET, QUESTION_TIMEOUT_MS } from '../constants.js';

// ── Zod schema (source of truth for the AI response shape) ───────────────────

const QuestionSchema = z.object({
  question: z.string().min(10).max(400),
  type: z.literal('multiple_choice'),
  choices: z.array(z.string()).min(4).max(4),
  correct_answer: z.string().min(1).max(200),
  humor_level: z.enum(['mild', 'absurd']),
});

// ── Age profile helper ───────────────────────────────────────────────────────

function ageProfile(age: number): string {
  if (age < 10) {
    return `Le joueur a ${age} ans. Adapte-toi : vocabulaire très simple, phrases courtes, références aux dessins animés, Pokémon, jouets. Évite tout humour adulte ou référence complexe. Questions très faciles.`;
  }
  if (age < 14) {
    return `Le joueur a ${age} ans. Adapte-toi : langage simple et accessible, références aux jeux vidéo populaires, youtubeurs, séries jeunesse. Humour innocent et décalé. Questions de difficulté modérée.`;
  }
  if (age < 18) {
    return `Le joueur a ${age} ans. Adapte-toi : ado/lycéen, langage décontracté avec quelques expressions actuelles, mèmes connus, culture gaming/réseaux sociaux. Humour piquant mais sans grossièreté.`;
  }
  if (age < 30) {
    return `Le joueur a ${age} ans. Adapte-toi : jeune adulte, pop culture actuelle, humour millénial/genz, références gaming/streaming/réseaux. Ton familier et cynique bienvenu.`;
  }
  if (age < 50) {
    return `Le joueur a ${age} ans. Adapte-toi : adulte, nostalgie des années 80-90-2000 bienvenue, humour décalé mais pas vulgaire, références culturelles larges. Questions de culture générale variées.`;
  }
  return `Le joueur a ${age} ans. Adapte-toi : senior, références classiques (cinéma, musique, sport d'époque), vocabulaire soutenu mais accessible, humour élégant et bienveillant. Évite le jargon internet récent.`;
}

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es le maître de quiz d'un jeu Space Invaders façon Pokémon.
Ton rôle : sauver (ou condamner) un joueur francophone qui vient de se faire toucher par un tir ennemi.

RÈGLES ABSOLUES :
- La question est TOUJOURS en français
- Elle DOIT être liée aux intérêts du joueur
- Le ton est TOUJOURS humoristique — stand-up comedian meets commentateur de foot enthousiaste
- "mild" : jeu de mots, moquerie affectueuse, référence culturelle bien placée
- "absurd" : scénario surréaliste, chute complètement inattendue, mauvaises réponses hilarantes
- Exactement 4 options, une seule correcte, les autres plausibles ou désopilantes
- Le joueur n'a que 25 secondes pour répondre — la question doit être compréhensible d'un coup d'œil
- ADAPTE OBLIGATOIREMENT le vocabulaire, les références et la difficulté à l'âge du joueur indiqué

Réponds UNIQUEMENT avec du JSON valide correspondant au schéma fourni. Aucun texte en dehors du JSON.`;

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

// ── Public API ───────────────────────────────────────────────────────────────

export function getRandomFallback(): QuestionData {
  const idx = Math.floor(Math.random() * FALLBACK_QUESTIONS.length);
  return FALLBACK_QUESTIONS[idx]!;
}

export async function generateQuestion(
  interests: string[],
  _lastType: 'multiple_choice' | null,
  age?: number | null,
): Promise<QuestionData> {
  const provider = getProvider();
  if (!provider) return getRandomFallback();

  const resolvedAge = age ?? getPlayerAge();
  const ageContext = resolvedAge !== null
    ? `\nProfil d'âge : ${ageProfile(resolvedAge)}`
    : '';

  const prompt =
    `Intérêts du joueur : ${interests.join(', ')}${ageContext}\n` +
    `Niveau d'humour : ${Math.random() < 0.4 ? 'absurd' : 'mild'}\n\n` +
    `Génère la question maintenant.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUESTION_TIMEOUT_MS);

  try {
    const result = await generateText({
      model: provider('claude-haiku-4-5-20251001'),
      output: Output.object({ schema: QuestionSchema }),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 300, // une question JSON ne dépasse jamais ~150 tokens
      temperature: 0.9,     // un peu d'entropie pour varier le ton
      abortSignal: controller.signal,
      providerOptions: {
        anthropic: { structuredOutputMode: 'jsonTool' },
      },
    });
    clearTimeout(timeout);

    if (import.meta.env.DEV) {
      const { inputTokens, outputTokens } = result.usage;
      console.debug(`[AI] question générée — in:${inputTokens} out:${outputTokens} tokens`);
    }

    return result.output;
  } catch {
    clearTimeout(timeout);
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
      const question = await generateQuestion(interests, game.lastQuestionType, age);
      game.questionPool.push(question);
    } catch {
      // Pool stays smaller — fallback will be used at question time
    }
  }
}
