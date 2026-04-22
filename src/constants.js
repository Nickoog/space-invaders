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
export const ENEMY_BULLET_SPEED = 200;

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
export const MAX_ENEMY_BULLETS  = 3;

// Level transition
export const LEVEL_START_INVINCIBLE_MS = 2000;
export const HIT_INVINCIBLE_MS         = 2000;

// Game states
export const S = { LOADING: 'LOADING', MENU: 'MENU', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER' };
