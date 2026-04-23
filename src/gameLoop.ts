import {
  S, W, H, STEP,
  PLAYER_W, PLAYER_H, PLAYER_Y,
  ENEMY_W, ENEMY_H,
  ROW_POINTS, CAUGHT_FLASH_MS,
  LEVEL_START_INVINCIBLE_MS, HIT_INVINCIBLE_MS, HIT_INVINCIBLE_CORRECT_MS, CORRECT_ANSWER_BONUS, BONUS_MESSAGE_MS,
  MAX_PLAYER_BULLETS, MAX_ENEMY_BULLETS,
  GAMEOVER_DELAY_MS, LEVEL_UP_MS,
  DIFFICULTY_DELTA_MS, DIFFICULTY_MAX_STEPS,
  ENEMY_COLS, ENEMY_ROWS, LEVEL_CLEAR_RATIO,
} from './constants.js';
import { updateProfile } from './profiles.js';
import { keys, consumeKey } from './input.js';
import { createPlayer, updatePlayer } from './Player.js';
import { createGrid, updateGrid, getAlivePokemon, getGridBounds, getEnemyPos } from './PokemonGrid.js';
import { createBullets, updateBullets } from './Bullets.js';
import { getIdsForLevel } from './api/pokeapi.js';
import { drawPlayer, drawPokeball, drawEnemyBullet, drawPokemon, drawHUD } from './renderer.js';
import { renderMenuScreen, renderGameOverScreen, renderLevelUpScreen } from './screens.js';
import { overlap } from './collision.js';
import { showQuestionModal } from './ui/modal.js';
import { getRandomFallback, replenishPool } from './ai/questionService.js';
import type { GameState } from './types.js';

// ── State transitions ────────────────────────────────────────────────────────

function startLevel(game: GameState, level: number): void {
  game.level   = level;
  game.player  = createPlayer();
  game.player.invincible = LEVEL_START_INVINCIBLE_MS;
  game.grid    = createGrid(level, getIdsForLevel(level));
  game.bullets = createBullets();
  game.state   = S.PLAYING;
}

// Exported so homeScreen.ts can call it after profile selection.
export function startGame(game: GameState): void {
  game.score            = 0;
  game.lives            = 3;
  game.difficultyOffset = game.activeProfile?.difficultyOffset ?? 0; // Restores per-profile difficulty.
  game.highScore        = game.activeProfile?.highScore ?? 0;         // Restores per-profile high score.
  game.questionPool     = [];
  game.lastQuestionType = null;
  startLevel(game, 1);
  game.state = S.PLAYING;
  // Pre-generate questions in background — never awaited, never blocks the loop
  void replenishPool(game);
}

function endGame(game: GameState): void {
  // Persist stats to the active profile before showing game over screen.
  if (game.activeProfile) {
    game.activeProfile.gamesPlayed++;
    if (game.score > game.activeProfile.highScore) {
      game.activeProfile.highScore = game.score;
    }
    game.activeProfile.difficultyOffset = game.difficultyOffset;
    updateProfile(game.activeProfile);
  }
  if (game.score > game.highScore) game.highScore = game.score;
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
      // Life saved, score bonus, longer invincibility, game gets a little easier
      game.score             += CORRECT_ANSWER_BONUS;
      game.bonusMessage       = `+${CORRECT_ANSWER_BONUS} pts`;
      game.bonusMessageTimer  = BONUS_MESSAGE_MS;
      game.difficultyOffset   = Math.min(limit, game.difficultyOffset + DIFFICULTY_DELTA_MS);
      if (game.player) game.player.invincible = HIT_INVINCIBLE_CORRECT_MS;
    } else {
      // Life lost, game gets a little harder
      game.difficultyOffset = Math.max(-limit, game.difficultyOffset - DIFFICULTY_DELTA_MS);
      game.lives--;
      if (game.lives <= 0) {
        endGame(game);
        return;
      }
      if (game.player) game.player.invincible = HIT_INVINCIBLE_MS;
    }
    game.state = S.PLAYING;

    // Refill pool in background so the next hit is instant
    void replenishPool(game);
  });
}

// ── Update ───────────────────────────────────────────────────────────────────

// Advances game state by one fixed timestep. Mutates game.
function update(game: GameState, dt: number): void {
  const { player, grid, bullets } = game;

  // Guards — state is PLAYING so these are always set, but TS needs the check
  if (!player || !grid || !bullets) return;

  // Bonus message timer
  if (game.bonusMessageTimer > 0) game.bonusMessageTimer -= dt;

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

  // Pokeball vs pokemon
  for (const b of bullets.player) {
    if (!b.active) continue;
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

  // Enemy bullets vs player
  for (const b of bullets.enemy) {
    if (!b.active) continue;
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

  // Level clear — enough pokemon caught (LEVEL_CLEAR_RATIO threshold)
  if (getAlivePokemon(grid).length <= Math.floor(ENEMY_COLS * ENEMY_ROWS * (1 - LEVEL_CLEAR_RATIO))) {
    game.nextLevel    = game.level + 1;
    game.levelUpTimer = 0;
    game.state        = S.LEVEL_UP;
  }
}

// ── Render ───────────────────────────────────────────────────────────────────

function render(ctx: CanvasRenderingContext2D, game: GameState): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (!game.player || !game.grid || !game.bullets) return;

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

    if (game.state === S.HOME) {
      // DOM overlay (homeScreen.ts) handles all UI — canvas stays black.
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
    } else if (game.state === S.PLAYING) {
      acc += delta;
      while (acc >= STEP) {
        update(game, STEP);
        acc -= STEP;
      }
      render(ctx, game);
    } else if (game.state === S.LEVEL_UP) {
      game.levelUpTimer += delta;
      renderLevelUpScreen(ctx, game.nextLevel, game.levelUpTimer);
      if (game.levelUpTimer >= LEVEL_UP_MS) {
        startLevel(game, game.nextLevel);
        void replenishPool(game);
      }
    } else if (game.state === S.QUESTION) {
      // Game frozen — keep rendering the frozen frame behind the HTML modal
      render(ctx, game);
    } else if (game.state === S.MENU) {
      if (consumeKey('Enter')) startGame(game);
      renderMenuScreen(ctx, game.highScore);
    } else if (game.state === S.GAME_OVER) {
      game.gameOverDelay += delta;
      if (game.gameOverDelay > GAMEOVER_DELAY_MS && consumeKey('Enter')) {
        game.activeProfile = null;
        game.state = S.HOME;
        game.onHome?.();
      }
      renderGameOverScreen(ctx, game.score, game.highScore, game.level, game.gameOverDelay);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
