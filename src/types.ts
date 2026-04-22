// ── Domain types ─────────────────────────────────────────────────────────────

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
  humor_level: 'mild' | 'absurd';
}

export interface GameState {
  state: string;
  spriteMap: Map<number, HTMLImageElement | null>;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  gameOverDelay: number;
  player: Player | null;
  grid: Grid | null;
  bullets: Bullets | null;
  shields: Shield[] | null;
  // AI question feature
  questionPool: QuestionData[];
  lastQuestionType: 'multiple_choice' | null;
  difficultyOffset: number; // ms added to speed/fire intervals (positive = easier)
}
