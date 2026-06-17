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
  correctType: boolean;    // true = matches the level's target type
  pendingCapture: boolean; // true = capture question in progress
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
  levelType: string;    // target type for this level (e.g. 'fire')
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
  humor_level: 'mild' | 'absurd';
  source?: 'ai' | 'fallback';
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
  bonusMessage: string;      // transient HUD message after correct answer
  bonusMessageTimer: number; // counts down to 0 (ms)
  // Profile feature
  activeProfile: PlayerProfile | null;
  onHome: (() => void) | null;
  // Hard mode (New Game+)
  hardMode: boolean;
  questionsInRound: number;          // total questions to answer per hit (1 normal, 2 hard)
  questionsAnsweredInRound: number;  // questions answered correctly so far this hit
  // Victory / Interlude
  victoryDelay: number;
  interludeMessage: string;
  interludeImage: HTMLImageElement | null;
  // Ammo / quiz mechanic
  ammo: number;          // current pokéballs available to fire
  ammoQuota: number;     // pokéballs needed to start this level (pre-level quiz target)
  quizInProgress: boolean; // true once player has clicked "start quiz" — prevents re-trigger
  // Question variety
  questionHistory: string[]; // textes des 25 dernières questions posées (FIFO anti-doublon)
  topicIndex: number;        // pointeur de rotation des thèmes geek
  pokemonTypePool: QuestionData[]; // questions Pokémon type-centré (balle ennemie)
}
