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
  AMMO_PER_CORRECT_QUIZ, AMMO_PER_CORRECT_RELOAD, AMMO_PER_WRONG_RELOAD,
  AMMO_QUOTA_BASE, AMMO_QUOTA_PER_LEVEL, CAPTURE_QUESTION_SEC,
} from './constants.js';
import { updateProfile } from './profiles.js';
import { keys, consumeKey } from './input.js';
import { createPlayer, updatePlayer } from './Player.js';
import { createGrid, updateGrid, getGridBounds, getEnemyPos } from './PokemonGrid.js';
import { createBullets, updateBullets } from './Bullets.js';
import { getIdsForLevel, getLevelType } from './api/pokeapi.js';
import { drawPlayer, drawPokeball, drawEnemyBullet, drawPokemon, drawHUD, drawPenaltyVignette, drawArenaBackground } from './renderer.js';
import { renderMenuScreen, renderGameOverScreen, renderLevelUpScreen, renderVictoryScreen, renderInterludeScreen, renderPreLevelQuizScreen } from './screens.js';
import { overlap } from './collision.js';
import { showQuestionModal } from './ui/modal.js';
import { getRandomFallback, replenishPool } from './ai/questionService.js';
import { getInterludeForLevel } from './interludes.js';
import type { GameState, Enemy } from './types.js';

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
  game.ammoQuota = AMMO_QUOTA_BASE + (level - 1) * AMMO_QUOTA_PER_LEVEL;
  game.state     = S.PRE_LEVEL_QUIZ;
  void replenishPool(game);
  askPreLevelQuestion(game);
}

// Exported so homeScreen.ts can call it after profile selection.
// hardMode = true activates New Game+ (2 questions per enemy hit).
export function startGame(game: GameState, hardMode = false): void {
  game.score                    = 0;
  game.lives                    = 3;
  game.hardMode                 = hardMode;
  game.questionsInRound         = 1;
  game.questionsAnsweredInRound = 0;
  game.difficultyOffset = game.activeProfile?.difficultyOffset ?? 0;
  game.highScore        = game.activeProfile?.highScore ?? 0;
  game.questionPool     = [];
  game.lastQuestionType = null;
  startLevel(game, 1);
  // startLevel sets state to PRE_LEVEL_QUIZ and triggers the quiz
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
// In hard mode (game.hardMode), 2 questions must be answered per hit.
function triggerQuestion(game: GameState): void {
  game.state                    = S.QUESTION;
  game.questionsAnsweredInRound = 0;
  game.questionsInRound         = game.hardMode ? 2 : 1;
  askNextQuestion(game);
}

function askNextQuestion(game: GameState): void {
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

      game.questionsAnsweredInRound++;
      if (game.questionsAnsweredInRound < game.questionsInRound) {
        // Hard mode: chain to the next question in this round
        askNextQuestion(game);
        return;
      }
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

// ── Pre-level quiz ───────────────────────────────────────────────────────────

function askPreLevelQuestion(game: GameState): void {
  const question = game.questionPool.shift() ?? getRandomFallback();
  const quota    = game.ammoQuota;
  showQuestionModal(question, (correct) => {
    if (correct) game.ammo += AMMO_PER_CORRECT_QUIZ;
    void replenishPool(game);
    if (game.ammo >= quota) {
      game.state = S.PLAYING;
    } else {
      askPreLevelQuestion(game);
    }
  }, {
    title:         `⚡ NIVEAU ${game.level} — POKÉBALLS !`,
    subtitle:      `Objectif : ${game.ammoQuota} pokéballs · Bonne réponse = +${AMMO_PER_CORRECT_QUIZ} · Mauvaise = +0`,
    resultCorrect: `✅ +${AMMO_PER_CORRECT_QUIZ} pokéballs !`,
    resultWrong:   '❌ Encore une question !',
  });
}

// ── Capture question ─────────────────────────────────────────────────────────

function triggerCaptureQuestion(game: GameState, enemy: Enemy): void {
  enemy.pendingCapture = true;
  game.state = S.QUESTION;
  const question = game.questionPool.shift() ?? getRandomFallback();
  const pts = ROW_POINTS[enemy.row] ?? 10;
  showQuestionModal(question, (correct) => {
    if (correct) {
      enemy.caughtFlash      = CAUGHT_FLASH_MS;
      game.score             += pts;
      game.bonusMessage       = `+${pts} pts  ATTRAPÉ !`;
      game.bonusMessageTimer  = BONUS_MESSAGE_MS;
    } else {
      enemy.pendingCapture = false;
    }
    game.state = S.PLAYING;
    void replenishPool(game);
  }, {
    timerSec:      CAPTURE_QUESTION_SEC,
    title:         '🎯 ATTRAPE-LE !',
    subtitle:      'Bonne réponse = capture ! Mauvaise = Pokémon relâché.',
    resultCorrect: `✅ POKÉMON ATTRAPÉ ! +${pts} pts`,
    resultWrong:   '❌ Le Pokémon s\'est échappé...',
  });
}

// ── Reload question ──────────────────────────────────────────────────────────

function triggerReloadQuestion(game: GameState): void {
  game.state = S.QUESTION;
  const question = game.questionPool.shift() ?? getRandomFallback();
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

  // Reload question when ammo runs out and player presses Space
  if (noAmmo && consumeKey('Space')) {
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
      if (!e.alive || e.caughtFlash > 0 || e.pendingCapture) continue;
      const pos = getEnemyPos(grid, e);
      if (overlap(b.x, b.y, b.w, b.h, pos.x, pos.y, ENEMY_W, ENEMY_H)) {
        b.active = false;
        if (e.correctType) {
          triggerCaptureQuestion(game, e);
          return; // game is now QUESTION — exit update immediately
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
      const won = game.nextLevel > MAX_LEVELS;
      renderLevelUpScreen(ctx, game.nextLevel, game.levelUpTimer, getLevelType(game.nextLevel), won);
      if (game.levelUpTimer >= LEVEL_UP_MS) {
        if (won) {
          // All 17 levels completed — save stats then show victory screen
          if (game.activeProfile) {
            game.activeProfile.gamesPlayed++;
            if (game.score > game.activeProfile.highScore) game.activeProfile.highScore = game.score;
            game.activeProfile.difficultyOffset = game.difficultyOffset;
            updateProfile(game.activeProfile);
          }
          if (game.score > game.highScore) game.highScore = game.score;
          game.victoryDelay = 0;
          game.state = S.VICTORY;
        } else {
          const interlude = getInterludeForLevel(game.level);
          if (interlude) {
            game.interludeMessage = interlude.message;
            if (interlude.photo) {
              const img = new Image();
              img.src = `/interludes/${interlude.photo}`;
              game.interludeImage = img;
            } else {
              game.interludeImage = null;
            }
            game.state = S.INTERLUDE;
          } else {
            startLevel(game, game.nextLevel);
          }
        }
      }
    } else if (game.state === S.INTERLUDE) {
      renderInterludeScreen(ctx, game.interludeMessage, game.interludeImage);
      if (consumeKey('Enter')) {
        startLevel(game, game.nextLevel);
      }
    } else if (game.state === S.VICTORY) {
      game.victoryDelay += delta;
      renderVictoryScreen(ctx, game.score, game.highScore, game.victoryDelay);
      if (game.victoryDelay > VICTORY_DELAY_MS) {
        if (consumeKey('Enter')) {
          // New Game+ — replay from level 1 in hard mode
          startGame(game, true);
        } else if (consumeKey('Escape')) {
          game.activeProfile = null;
          game.state = S.HOME;
          game.onHome?.();
        }
      }
    } else if (game.state === S.PRE_LEVEL_QUIZ) {
      // Quiz modal is open on top — canvas shows the quiz info screen behind it
      renderPreLevelQuizScreen(ctx, game.ammo, game.ammoQuota, game.level, game.grid?.levelType ?? 'normal');
    } else if (game.state === S.QUESTION) {
      // Game frozen — keep rendering the frozen arena behind the HTML modal
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
