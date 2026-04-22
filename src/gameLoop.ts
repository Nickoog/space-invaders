import {
  S, W, H, STEP,
  PLAYER_W, PLAYER_H, PLAYER_Y,
  ENEMY_W, ENEMY_H,
  ROW_POINTS, CAUGHT_FLASH_MS,
  LEVEL_START_INVINCIBLE_MS, HIT_INVINCIBLE_MS,
  MAX_PLAYER_BULLETS, MAX_ENEMY_BULLETS,
  GAMEOVER_DELAY_MS,
  DIFFICULTY_DELTA_MS, DIFFICULTY_MAX_STEPS,
} from './constants.js';
import { keys, consumeKey } from './input.js';
import { createPlayer, updatePlayer } from './Player.js';
import { createGrid, updateGrid, getAlivePokemon, getGridBounds, getEnemyPos } from './PokemonGrid.js';
import { createBullets, updateBullets } from './Bullets.js';
import { createShields, hitShield } from './Shields.js';
import { getIdsForLevel } from './api/pokeapi.js';
import { drawPlayer, drawPokeball, drawEnemyBullet, drawPokemon, drawShields, drawHUD } from './renderer.js';
import { renderMenuScreen, renderGameOverScreen } from './screens.js';
import { overlap } from './collision.js';
import { showQuestionModal } from './ui/modal.js';
import { getRandomFallback, replenishPool } from './ai/questionService.js';
import type { GameState } from './types.js';

const LS_KEY = 'pokemon_invaders_hi';

// ── State transitions ────────────────────────────────────────────────────────

function startLevel(game: GameState, level: number): void {
  game.level   = level;
  game.player  = createPlayer();
  game.player.invincible = LEVEL_START_INVINCIBLE_MS;
  game.grid    = createGrid(level, getIdsForLevel(level));
  game.bullets = createBullets();
  game.shields = createShields();
}

function startGame(game: GameState): void {
  game.score           = 0;
  game.lives           = 3;
  game.difficultyOffset = 0;
  game.questionPool    = [];
  game.lastQuestionType = null;
  startLevel(game, 1);
  game.state = S.PLAYING;
  // Pre-generate questions in background — never awaited, never blocks the loop
  void replenishPool(game);
}

function endGame(game: GameState): void {
  if (game.score > game.highScore) {
    game.highScore = game.score;
    try { localStorage.setItem(LS_KEY, String(game.highScore)); } catch { /**/ }
  }
  game.gameOverDelay = 0;
  game.state = S.GAME_OVER;
}

// Called when an enemy bullet hits the player.
// Pauses the game (QUESTION state) and shows the AI question modal.
function triggerQuestion(game: GameState): void {
  game.state = S.QUESTION;

  const question = game.questionPool.shift() ?? getRandomFallback();
  game.lastQuestionType = question.type;

  showQuestionModal(question, (correct: boolean) => {
    const limit = DIFFICULTY_DELTA_MS * DIFFICULTY_MAX_STEPS;

    if (correct) {
      // Life saved, game gets a little easier
      game.difficultyOffset = Math.min(limit, game.difficultyOffset + DIFFICULTY_DELTA_MS);
    } else {
      // Life lost, game gets a little harder
      game.difficultyOffset = Math.max(-limit, game.difficultyOffset - DIFFICULTY_DELTA_MS);
      game.lives--;
      if (game.lives <= 0) {
        endGame(game);
        return;
      }
    }

    if (game.player) game.player.invincible = HIT_INVINCIBLE_MS;
    game.state = S.PLAYING;

    // Refill pool in background so the next hit is instant
    void replenishPool(game);
  });
}

// ── Update ───────────────────────────────────────────────────────────────────

// Advances game state by one fixed timestep. Mutates game.
function update(game: GameState, dt: number): void {
  const { player, grid, bullets, shields } = game;

  // Guards — state is PLAYING so these are always set, but TS needs the check
  if (!player || !grid || !bullets || !shields) return;

  // Player movement + fire (up to MAX_PLAYER_BULLETS simultaneous)
  const activePBullets = bullets.player.filter(b => b.active).length;
  const newPlayerBullet = updatePlayer(player, dt, keys, activePBullets >= MAX_PLAYER_BULLETS);
  if (newPlayerBullet) bullets.player.push(newPlayerBullet);

  // Enemy grid step + fire (capped at MAX_ENEMY_BULLETS simultaneous)
  const newEnemyBullet = updateGrid(grid, dt, game.level, game.difficultyOffset);
  if (newEnemyBullet && bullets.enemy.filter(b => b.active).length < MAX_ENEMY_BULLETS) {
    bullets.enemy.push(newEnemyBullet);
  }

  // Move all bullets
  updateBullets(bullets, dt);

  // Pokeball vs shields + pokemon
  for (const b of bullets.player) {
    if (!b.active) continue;
    if (hitShield(shields, b.x, b.y, b.w, b.h)) {
      b.active = false;
      continue;
    }
    for (const e of grid.enemies) {
      if (!e.alive || e.caughtFlash > 0) continue;
      const pos = getEnemyPos(grid, e);
      if (overlap(b.x, b.y, b.w, b.h, pos.x, pos.y, ENEMY_W, ENEMY_H)) {
        e.caughtFlash = CAUGHT_FLASH_MS;
        b.active      = false;
        game.score   += ROW_POINTS[e.row] ?? 10;
        break;
      }
    }
  }

  // Enemy bullets vs shields + player
  for (const b of bullets.enemy) {
    if (!b.active) continue;
    if (hitShield(shields, b.x, b.y, b.w, b.h)) {
      b.active = false;
      continue;
    }
    if (player.invincible <= 0 &&
        overlap(b.x, b.y, b.w, b.h, player.x, player.y, PLAYER_W, PLAYER_H)) {
      b.active = false;
      triggerQuestion(game);
      return; // game is now QUESTION — exit update immediately
    }
  }

  // Enemies invade — reach the player line
  const gb = getGridBounds(grid);
  if (gb && gb.bottom >= PLAYER_Y) { endGame(game); return; }

  // Level clear — all pokemon caught (alive=false or finishing flash)
  if (getAlivePokemon(grid).length === 0) {
    startLevel(game, game.level + 1);
  }
}

// ── Render ───────────────────────────────────────────────────────────────────

function render(ctx: CanvasRenderingContext2D, game: GameState): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (!game.shields || !game.player || !game.grid || !game.bullets) return;

  drawShields(ctx, game.shields);
  drawPlayer(ctx, game.player);

  for (const e of game.grid.enemies) {
    if (!e.alive) continue;
    drawPokemon(ctx, game.grid, e, game.spriteMap);
  }

  for (const b of game.bullets.player) drawPokeball(ctx, b);
  for (const b of game.bullets.enemy)  drawEnemyBullet(ctx, b);

  drawHUD(ctx, game);
}

// ── Game loop ────────────────────────────────────────────────────────────────

export function startLoop(game: GameState, ctx: CanvasRenderingContext2D): void {
  let lastTime: number | null = null;
  let acc = 0;

  function loop(ts: number): void {
    if (lastTime === null) lastTime = ts;

    // Pause when tab is hidden — reset lastTime to avoid delta accumulation on return
    if (document.hidden) {
      lastTime = ts;
      requestAnimationFrame(loop);
      return;
    }

    const delta = Math.min(ts - lastTime, 100);
    lastTime = ts;

    if (game.state === S.PLAYING) {
      acc += delta;
      while (acc >= STEP) {
        update(game, STEP);
        acc -= STEP;
      }
      render(ctx, game);
    } else if (game.state === S.QUESTION) {
      // Game frozen — keep rendering the frozen frame behind the HTML modal
      render(ctx, game);
    } else if (game.state === S.MENU) {
      if (consumeKey('Enter')) startGame(game);
      renderMenuScreen(ctx, game.highScore);
    } else if (game.state === S.GAME_OVER) {
      game.gameOverDelay += delta;
      if (game.gameOverDelay > GAMEOVER_DELAY_MS && consumeKey('Enter')) startGame(game);
      renderGameOverScreen(ctx, game.score, game.highScore, game.level, game.gameOverDelay);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
