export const W = 800, H = 600;
export const STEP = 1000 / 60;

// Player
export const PLAYER_W = 40, PLAYER_H = 24;
export const PLAYER_SPEED = 250;
export const PLAYER_Y = H - 60;
export const PLAYER_BULLET_SPEED = 420;
export const PLAYER_FIRE_CD = 500;

// Enemies
export const ENEMY_COLS = 11, ENEMY_ROWS = 5;
export const ENEMY_W = 40, ENEMY_H = 40;
export const ENEMY_X_GAP = 8, ENEMY_Y_GAP = 8;
export const ENEMY_TOP = 60;
export const ENEMY_STEP_X = 8;
export const ENEMY_STEP_D = 20;
export const ENEMY_BULLET_SPEED = 260;

// Shields
export const SHIELD_COLS = 8, SHIELD_ROWS = 4;
export const SHIELD_BLOCK = 6;
export const SHIELD_W = SHIELD_COLS * SHIELD_BLOCK;
export const SHIELD_H = SHIELD_ROWS * SHIELD_BLOCK;
export const SHIELD_Y = PLAYER_Y - 70;
export const NUM_SHIELDS = 4;

// Pokemon theme
export const POKEBALL_RADIUS = 9;
export const CAUGHT_FLASH_MS = 350;
export const GEN1_COUNT = 151;
export const POKEMON_LOAD_TIMEOUT_MS = 8000;

// Scoring (top row = most points)
export const ROW_POINTS = [30, 20, 20, 10, 10];
export const ROW_COLORS = ['#ffff44', '#ff9900', '#ff9900', '#ff4444', '#ff4444'];

// Bullets
export const MAX_PLAYER_BULLETS = 3;
export const MAX_ENEMY_BULLETS  = 5;

// Level transition
export const LEVEL_START_INVINCIBLE_MS  = 2000;
export const HIT_INVINCIBLE_MS          = 2000; // after wrong answer
export const HIT_INVINCIBLE_CORRECT_MS  = 2500; // after correct answer — bonus repositioning time
export const CORRECT_ANSWER_BONUS       = 300;  // score points awarded for a correct answer
export const BONUS_MESSAGE_MS           = 1500; // duration of the bonus HUD message (ms)

// Typed enemy feature
export const WRONG_TYPE_RATIO           = 0.3;  // fraction of wrong-type enemies per level
export const WRONG_TYPE_PENALTY_MS      = 4000; // penalty duration when wrong type is hit (ms)
export const WRONG_TYPE_FIRE_MS         = 90;   // fire interval during penalty (ms) — ~x8 faster

// Level progression
export const LEVEL_CLEAR_RATIO = 0.5;   // fraction of enemies to eliminate to clear a level

// Difficulty formula (PokemonGrid)
export const GRID_SPEED_BASE   = 480;   // base interval at level 1 (ms) — was 700
export const GRID_SPEED_MIN    = 60;    // minimum interval from level scaling (ms)
export const GRID_ACCEL_RATIO  = 0.85;  // how much interval shrinks as grid empties
export const MOVE_INTERVAL_MIN = 40;    // absolute floor for move interval (ms)
export const FIRE_BASE_MS      = 900;   // base fire interval at level 1 (ms) — was 1200
export const FIRE_MIN_MS       = 160;   // minimum fire interval from level scaling (ms) — was 400
export const FIRE_RANDOM_MS    = 400;   // random jitter added to fire timer (ms) — was 600

// UI timing
export const GAMEOVER_DELAY_MS = 1500;  // delay before "press Enter to replay" appears (ms)
export const BLINK_INTERVAL_MS = 100;   // invincibility blink interval (ms)
export const MENU_BLINK_MS     = 500;   // menu/game-over text blink interval (ms)

// Game states
export const S = { LOADING: 'LOADING', MENU: 'MENU', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER', QUESTION: 'QUESTION', LEVEL_UP: 'LEVEL_UP', VICTORY: 'VICTORY', INTERLUDE: 'INTERLUDE', PRE_LEVEL_QUIZ: 'PRE_LEVEL_QUIZ' };

// Flavien's birthday personalisation
export const MAX_LEVELS        = 17;   // number of levels before the victory screen
export const VICTORY_DELAY_MS  = 2000; // delay before victory inputs are accepted (ms)

// Level transition screen
export const LEVEL_UP_MS = 1500; // duration of the "NIVEAU X" splash (ms)

// Ammo / quiz mechanic
export const AMMO_FULL_BAG           = 20;  // taille fixe du sac de pokéballs (quota pré-niveau)
export const AMMO_PER_CORRECT_QUIZ   = 3;   // pokéballs gagnées par bonne réponse (si preQuizCorrect = 5)
export const AMMO_PER_CORRECT_RELOAD = 3;   // pokéballs gained per correct reload question
export const AMMO_PER_WRONG_RELOAD   = 1;   // pokéballs gained per wrong reload question
export const CAPTURE_QUESTION_SEC    = 15;  // timer for capture confirmation questions (shorter)

// AI question feature
export const DIFFICULTY_DELTA_MS   = 100;  // ms offset per correct/wrong answer
export const DIFFICULTY_MAX_STEPS  = 4;    // max cumulative steps in each direction
export const QUESTION_POOL_TARGET  = 3;    // questions to pre-generate and keep ready
export const QUESTION_TIMEOUT_MS   = 8000; // ms before API call falls back to local bank
export const QUESTION_ANSWER_SEC   = 25;   // seconds the player has to answer
