import type { GameStateName } from './constants.js';
import type { PokemonType } from './api/pokeapi.js';

// ── Domain types ─────────────────────────────────────────────────────────────

export interface FlavienStats {
  highScore: number;
  gamesPlayed: number;
  difficultyOffset: number;
  preQuizCorrect: number;
}

export interface Player {
  x: number;
  y: number;
  invincible: number;
  fireCooldown: number;
}

export interface Enemy {
  row: number;
  col: number;
  alive: boolean;
  caughtFlash: number;
  pokemonId: number;
  correctType: boolean;    // true = matches the level's target type
}

export interface Grid {
  enemies: Enemy[];
  ox: number;
  oy: number;
  dir: number;
  moveTimer: number;
  moveInterval: number;
  stepPending: boolean;
  fireTimer: number;
  levelType: PokemonType; // target type for this level (e.g. 'fire')
  penaltyTimer: number; // ms remaining of wrong-type fire penalty (0 = no penalty)
}

export interface Bullet {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  active: boolean;
}

export interface Bullets {
  player: Bullet[];
  enemy: Bullet[];
}

export interface Shield {
  x: number;
  y: number;
  blocks: number[][];
}

export interface QuestionData {
  question: string;
  type: 'multiple_choice';
  choices: string[];
  correct_answer: string;
  source?: 'ai' | 'fallback';
}

// Narrows GameState for states where player/grid/bullets are guaranteed non-null (PLAYING, QUESTION)
export type ActiveGameState = GameState & {
  readonly player: Player;
  readonly grid: Grid;
  readonly bullets: Bullets;
};

export function isGameActive(game: GameState): game is ActiveGameState {
  return game.player !== null && game.grid !== null && game.bullets !== null;
}

export interface GameState {
  state: GameStateName;
  spriteMap: Map<number, HTMLImageElement | null>;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  gameOverDelay: number;
  levelUpTimer: number;  // counts up during LEVEL_UP state (ms)
  nextLevel: number;     // level to start after the LEVEL_UP splash
  player: Player | null;
  grid: Grid | null;
  bullets: Bullets | null;
  // AI question feature
  questionPool: QuestionData[];
  lastQuestionType: 'multiple_choice' | null;
  difficultyOffset: number; // ms added to speed/fire intervals (positive = easier)
  bonusMessage: string;      // transient HUD message after correct answer
  bonusMessageTimer: number; // counts down to 0 (ms)
  // Flavien's persistent stats
  stats: FlavienStats;
  // Victory / Interlude
  victoryDelay: number;
  interludeImage: HTMLImageElement | null;
  // Ammo / quiz mechanic
  ammo: number;          // current pokéballs available to fire
  ammoQuota: number;     // pokéballs needed to start this level (pre-level quiz target)
  quizInProgress: boolean; // true once player has clicked "start quiz" — prevents re-trigger
  skipLevels: boolean;     // si true, la touche N passe au niveau suivant pendant le jeu
  gameStartTime: number;   // timestamp ms au début de la partie (pour calculer la durée)
  emailSent: boolean;      // empêche l'envoi multiple dans le même frame loop
  // Question variety
  questionHistory: string[]; // textes des 25 dernières questions posées (FIFO anti-doublon)
  topicIndex: number;        // pointeur de rotation des thèmes geek
  pokemonTypePool: QuestionData[]; // questions Pokémon type-centré (balle ennemie)
}
