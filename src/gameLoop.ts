import {
  S, W, H, STEP,
  PLAYER_W, PLAYER_H, PLAYER_Y,
  ENEMY_W, ENEMY_H,
  ROW_POINTS, CAUGHT_FLASH_MS,
  LEVEL_START_INVINCIBLE_MS, HIT_INVINCIBLE_MS, HIT_INVINCIBLE_CORRECT_MS, CORRECT_ANSWER_BONUS, BONUS_MESSAGE_MS,
  MAX_PLAYER_BULLETS, MAX_ENEMY_BULLETS,
  GAMEOVER_DELAY_MS, LEVEL_UP_MS, VICTORY_DELAY_MS, MAX_LEVELS,
  DIFFICULTY_DELTA_MS, DIFFICULTY_MAX_STEPS,
  LEVEL_CLEAR_RATIO,
  WRONG_TYPE_PENALTY_MS,
  AMMO_FULL_BAG, AMMO_PER_CORRECT_RELOAD, AMMO_PER_WRONG_RELOAD,
} from './constants.js';
import { saveStats } from './flavienProfile.js';
import { keys, consumeKey } from './input.js';
import { createPlayer, updatePlayer } from './Player.js';
import { createGrid, updateGrid, getGridBounds, getEnemyPos } from './PokemonGrid.js';
import { createBullets, updateBullets } from './Bullets.js';
import { getIdsForLevel, getLevelType } from './api/pokeapi.js';
import { drawPlayer, drawPokeball, drawEnemyBullet, drawPokemon, drawHUD, drawPenaltyVignette, drawArenaBackground } from './renderer.js';
import { renderMenuScreen, renderGameOverScreen, renderLevelUpScreen, renderVictoryScreen, renderInterludeScreen, renderPreLevelQuizScreen } from './screens.js';
import { overlap } from './collision.js';
import { showQuestionModal } from './ui/modal.js';
import { getRandomFallback, replenishPool, replenishPokemonPool } from './ai/questionService.js';
import { getInterludeForLevel } from './interludes.js';
import { sendGameEmail } from './email.js';
import type { GameState } from './types.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function trackQuestion(game: GameState, question: { question: string }): void {
  if (game.questionHistory.includes(question.question)) return; // already tracked at generation
  game.questionHistory.push(question.question);
  if (game.questionHistory.length > 25) game.questionHistory.shift();
}

// ── State transitions ────────────────────────────────────────────────────────

function startLevel(game: GameState, level: number): void {
  game.level  = level;
  game.player = createPlayer();
  game.player.invincible = LEVEL_START_INVINCIBLE_MS;
  const { ids, correctFlags, levelType } = getIdsForLevel(level);
  const wrongCount = correctFlags.filter(f => !f).length;
  console.debug(`[GRID] Niveau ${level} → ${correctFlags.length - wrongCount} correct, ${wrongCount} mauvais type`);
  game.grid      = createGrid(level, ids, correctFlags, levelType);
  game.bullets   = createBullets();
  game.ammo      = 0;
  game.ammoQuota = AMMO_FULL_BAG;
  game.quizInProgress = false;
  game.pokemonTypePool = [];
  if (game.skipLevels) {
    game.ammo  = game.ammoQuota;
    game.state = S.PLAYING;
  } else {
    game.state = S.PRE_LEVEL_QUIZ;
  }
  void replenishPool(game);
  void replenishPokemonPool(game);
}

export function startGame(game: GameState): void {
  game.score            = 0;
  game.lives            = 3;
  game.difficultyOffset = game.stats.difficultyOffset;
  game.highScore        = game.stats.highScore;
  game.questionPool     = [];
  game.lastQuestionType = null;
  game.gameStartTime    = Date.now();
  game.emailSent        = false;
  startLevel(game, 1);
  // startLevel sets state to PRE_LEVEL_QUIZ and triggers the quiz
}

function endGame(game: GameState): void {
  game.stats.gamesPlayed++;
  if (game.score > game.stats.highScore) game.stats.highScore = game.score;
  saveStats(game.stats);
  if (game.score > game.highScore) game.highScore = game.score;
  sendGameEmail(game, 'gameover');
  game.gameOverDelay = 0;
  game.state = S.GAME_OVER;
}

// Called when an enemy bullet hits the player.
// Pauses the game (QUESTION state) and shows the AI question modal.
function triggerQuestion(game: GameState): void {
  game.state = S.QUESTION;
  askNextQuestion(game);
}

function askNextQuestion(game: GameState): void {
  const question = game.pokemonTypePool.shift() ?? game.questionPool.shift() ?? getRandomFallback();
  game.lastQuestionType = question.type;
  trackQuestion(game, question);
  void replenishPokemonPool(game);

  showQuestionModal(question, (correct: boolean) => {
    if (correct) {
      game.score            += CORRECT_ANSWER_BONUS;
      game.bonusMessage      = `+${CORRECT_ANSWER_BONUS} pts`;
      game.bonusMessageTimer = BONUS_MESSAGE_MS;
      if (game.player) game.player.invincible = HIT_INVINCIBLE_CORRECT_MS;
    } else {
      game.lives--;
      if (game.lives <= 0) {
        endGame(game);
        return;
      }
      if (game.player) game.player.invincible = HIT_INVINCIBLE_MS;
    }
    game.state = S.PLAYING;
    void replenishPool(game);
  });
}

// ── Pre-level quiz ───────────────────────────────────────────────────────────

function askPreLevelQuestion(game: GameState): void {
  const question      = game.questionPool.shift() ?? getRandomFallback();
  trackQuestion(game, question);
  const quota         = game.ammoQuota;
  const preQuizCorrect = game.stats.preQuizCorrect;
  const ammoPerAnswer  = Math.ceil(quota / preQuizCorrect);

  showQuestionModal(question, (correct) => {
    if (correct) game.ammo = Math.min(quota, game.ammo + ammoPerAnswer);
    void replenishPool(game);
    if (game.ammo >= quota) {
      game.state = S.PLAYING;
    } else {
      askPreLevelQuestion(game);
    }
  }, {
    title:         `⚡ NIVEAU ${game.level} — POKÉBALLS !`,
    subtitle:      `Bonne réponse = +${ammoPerAnswer} pokéball${ammoPerAnswer > 1 ? 's' : ''} · Mauvaise = +0`,
    resultCorrect: `✅ +${ammoPerAnswer} pokéball${ammoPerAnswer > 1 ? 's' : ''} !`,
    resultWrong:   '❌ Encore une question !',
    progress:      { current: game.ammo, max: quota },
  });
}

// ── Reload question ──────────────────────────────────────────────────────────

function triggerReloadQuestion(game: GameState): void {
  game.state = S.QUESTION;
  const question = game.questionPool.shift() ?? getRandomFallback();
  trackQuestion(game, question);
  showQuestionModal(question, (correct) => {
    game.ammo += correct ? AMMO_PER_CORRECT_RELOAD : AMMO_PER_WRONG_RELOAD;
    game.state = S.PLAYING;
    void replenishPool(game);
  }, {
    title:         '⚡ PLUS DE POKÉBALLS !',
    subtitle:      `Bonne réponse = +${AMMO_PER_CORRECT_RELOAD} pokéballs · Mauvaise = +${AMMO_PER_WRONG_RELOAD}`,
    resultCorrect: `✅ +${AMMO_PER_CORRECT_RELOAD} POKÉBALLS !`,
    resultWrong:   `⚠️ +${AMMO_PER_WRONG_RELOAD} pokéball... Continue !`,
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

  // Player movement — blocked from firing when ammo is empty
  const noAmmo = game.ammo <= 0;
  const activePBullets = bullets.player.filter(b => b.active).length;
  const newPlayerBullet = updatePlayer(player, dt, keys, activePBullets >= MAX_PLAYER_BULLETS || noAmmo);
  if (newPlayerBullet) {
    bullets.player.push(newPlayerBullet);
    game.ammo--;
  }

  // Reload question — recount AFTER potentially adding a new bullet this frame
  const activePBulletsNow = bullets.player.filter(b => b.active).length;
  if (game.ammo <= 0 && activePBulletsNow === 0 && consumeKey('Space')) {
    triggerReloadQuestion(game);
    return;
  }

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
        if (e.correctType) {
          game.score += ROW_POINTS[e.row] ?? 10;
        } else {
          // Wrong type — trigger fire penalty, no score
          grid.penaltyTimer = WRONG_TYPE_PENALTY_MS;
        }
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

  // Level clear — only correct-type catches count toward progression
  const aliveCorrect   = grid.enemies.filter(e => e.alive && e.correctType).length;
  const totalCorrect   = grid.enemies.filter(e => e.correctType).length;
  const clearThreshold = Math.floor(totalCorrect * (1 - LEVEL_CLEAR_RATIO));
  if (aliveCorrect <= clearThreshold) {
    game.nextLevel    = game.level + 1;
    game.levelUpTimer = 0;
    game.state        = S.LEVEL_UP;
  }
}

// ── Render ───────────────────────────────────────────────────────────────────

function render(ctx: CanvasRenderingContext2D, game: GameState): void {
  drawArenaBackground(ctx, game.grid?.levelType ?? 'poison');

  if (!game.player || !game.grid || !game.bullets) return;

  drawPlayer(ctx, game.player);

  for (const e of game.grid.enemies) {
    if (!e.alive) continue;
    drawPokemon(ctx, game.grid, e, game.spriteMap);
  }

  for (const b of game.bullets.player) drawPokeball(ctx, b);
  for (const b of game.bullets.enemy)  drawEnemyBullet(ctx, b, game.grid.levelType);

  drawHUD(ctx, game);

  // Penalty vignette — shown when a wrong-type enemy was hit
  if (game.grid.penaltyTimer > 0) drawPenaltyVignette(ctx, game.grid.penaltyTimer);
}

// ── Game loop ────────────────────────────────────────────────────────────────

export function startLoop(game: GameState, ctx: CanvasRenderingContext2D): void {
  let lastTime: number | null = null;
  let acc = 0;
  let skipLevelPending = false;

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'KeyN') skipLevelPending = true;
  });

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

    // Skip-level cheat — works in any active game state
    if (skipLevelPending) {
      skipLevelPending = false;
      const activeGameState = game.state !== S.MENU && game.state !== S.GAME_OVER && game.state !== S.VICTORY;
      if (game.skipLevels && activeGameState) {
        game.nextLevel    = game.level + 1;
        game.levelUpTimer = 0;
        game.state        = S.LEVEL_UP;
      }
    }

    if (game.state === S.PLAYING) {
      acc += delta;
      while (acc >= STEP) {
        update(game, STEP);
        acc -= STEP;
      }
      render(ctx, game);
    } else if (game.state === S.LEVEL_UP) {
      game.levelUpTimer += delta;
      const won = game.nextLevel > MAX_LEVELS;
      renderLevelUpScreen(ctx, game.nextLevel, game.levelUpTimer, getLevelType(game.nextLevel), won);
      if (game.levelUpTimer >= LEVEL_UP_MS) {
        if (won) {
          // All 17 levels completed — save stats then show victory screen
          game.stats.gamesPlayed++;
          if (game.score > game.stats.highScore) game.stats.highScore = game.score;
          saveStats(game.stats);
          if (game.score > game.highScore) game.highScore = game.score;
          sendGameEmail(game, 'victory');
          game.victoryDelay = 0;
          game.state = S.VICTORY;
        } else {
          const interlude = getInterludeForLevel(game.level);
          if (interlude) {
            const img = new Image();
            img.onload = () => { game.interludeImage = img; };
            img.src = `${import.meta.env.BASE_URL}interludes/${interlude.photo}`;
            game.interludeImage = null;
            game.levelUpTimer = 0;
            consumeKey('Enter');
            game.state = S.INTERLUDE;
          } else {
            startLevel(game, game.nextLevel);
          }
        }
      }
    } else if (game.state === S.INTERLUDE) {
      game.levelUpTimer += delta;
      renderInterludeScreen(ctx, game.interludeImage);
      if (game.levelUpTimer > 1500 && consumeKey('Enter')) {
        startLevel(game, game.nextLevel);
      }
    } else if (game.state === S.VICTORY) {
      game.victoryDelay += delta;
      renderVictoryScreen(ctx, game.score, game.highScore, game.victoryDelay);
      if (game.victoryDelay > VICTORY_DELAY_MS) {
        if (consumeKey('Enter')) {
          game.stats.difficultyOffset = -2 * DIFFICULTY_DELTA_MS;
          game.stats.preQuizCorrect   = 5;
          saveStats(game.stats);
          startGame(game);
        } else if (consumeKey('Escape')) {
          game.state = S.MENU;
        }
      }
    } else if (game.state === S.PRE_LEVEL_QUIZ) {
      renderPreLevelQuizScreen(ctx, game.ammo, game.ammoQuota, game.level, game.grid?.levelType ?? 'normal', game.quizInProgress);
      if (!game.quizInProgress && consumeKey('Enter')) {
        game.quizInProgress = true;
        askPreLevelQuestion(game);
      }
    } else if (game.state === S.QUESTION) {
      // Game frozen — keep rendering the frozen arena behind the HTML modal
      render(ctx, game);
    } else if (game.state === S.MENU) {
      if (consumeKey('Enter')) startGame(game);
      renderMenuScreen(ctx, game.highScore);
    } else if (game.state === S.GAME_OVER) {
      game.gameOverDelay += delta;
      if (game.gameOverDelay > GAMEOVER_DELAY_MS && consumeKey('Enter')) {
        startGame(game);
      }
      renderGameOverScreen(ctx, game.score, game.highScore, game.level, game.gameOverDelay);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
