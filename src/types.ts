// ── Domain types ─────────────────────────────────────────────────────────────

export interface PlayerProfile {
  id: string;
  pseudo: string;
  highScore: number;
  gamesPlayed: number;
  interests: string[];
  age: number | null;
  difficultyOffset: number;
  createdAt: number;
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
  levelUpTimer: number;  // counts up during LEVEL_UP state (ms)
  nextLevel: number;     // level to start after the LEVEL_UP splash
  player: Player | null;
  grid: Grid | null;
  bullets: Bullets | null;
  // AI question feature
  questionPool: QuestionData[];
  lastQuestionType: 'multiple_choice' | null;
  difficultyOffset: number; // ms added to speed/fire intervals (positive = easier)
  // Profile feature
  activeProfile: PlayerProfile | null;
  onHome: (() => void) | null;
}
