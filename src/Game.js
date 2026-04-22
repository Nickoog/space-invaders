import {
  S, W, H, STEP,
  PLAYER_W, PLAYER_H, PLAYER_Y,
  ENEMY_W, ENEMY_H,
  ROW_POINTS, CAUGHT_FLASH_MS,
  LEVEL_START_INVINCIBLE_MS, HIT_INVINCIBLE_MS,
  MAX_PLAYER_BULLETS, MAX_ENEMY_BULLETS,
} from './constants.js';

const LS_KEY = 'pokemon_invaders_hi';
import { keys, consumeKey } from './input.js';
import { createPlayer, updatePlayer } from './Player.js';
import { createGrid, updateGrid, getAlivePokemon, getGridBounds, getEnemyPos } from './PokemonGrid.js';
import { createBullets, updateBullets } from './Bullets.js';
import { createShields, hitShield } from './Shields.js';
import { getIdsForLevel } from './api/pokeapi.js';
import { drawPlayer, drawPokeball, drawEnemyBullet, drawPokemon, drawShields, drawHUD } from './renderer.js';
import { renderMenuScreen, renderGameOverScreen } from './screens.js';

function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function startLevel(game, level) {
  game.level   = level;
  game.player  = createPlayer();
  game.player.invincible = LEVEL_START_INVINCIBLE_MS;
  game.grid    = createGrid(level, getIdsForLevel(level));
  game.bullets = createBullets();
  game.shields = createShields();
}

function startGame(game) {
  game.score = 0;
  game.lives = 3;
  startLevel(game, 1);
  game.state = S.PLAYING;
}

function endGame(game) {
  if (game.score > game.highScore) {
    game.highScore = game.score;
    try { localStorage.setItem(LS_KEY, String(game.highScore)); } catch { /**/ }
  }
  game.gameOverDelay = 0;
  game.state = S.GAME_OVER;
}

function update(game, dt) {
  const { player, grid, bullets, shields } = game;

  // Player movement + fire (up to MAX_PLAYER_BULLETS simultaneous)
  const activePBullets = bullets.player.filter(b => b.active).length;
  const newPlayerBullet = updatePlayer(player, dt, keys, activePBullets >= MAX_PLAYER_BULLETS);
  if (newPlayerBullet) bullets.player.push(newPlayerBullet);

  // Enemy grid step + fire (capped at MAX_ENEMY_BULLETS simultaneous)
  const newEnemyBullet = updateGrid(grid, dt, game.level);
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
      b.active         = false;
      game.lives--;
      player.invincible = HIT_INVINCIBLE_MS;
      if (game.lives <= 0) { endGame(game); return; }
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

function render(ctx, game) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

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

export function createGame(spriteMap) {
  const saved = parseInt(localStorage.getItem(LS_KEY), 10);
  return {
    state:         S.MENU,
    spriteMap,
    score:         0,
    highScore:     isNaN(saved) ? 0 : saved,
    lives:         3,
    level:         1,
    gameOverDelay: 0,
    player:        null,
    grid:          null,
    bullets:       null,
    shields:       null,
  };
}

export function startLoop(game, ctx) {
  let lastTime = null;
  let acc = 0;

  function loop(ts) {
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
    } else if (game.state === S.MENU) {
      if (consumeKey('Enter')) startGame(game);
      renderMenuScreen(ctx, game.highScore);
    } else if (game.state === S.GAME_OVER) {
      game.gameOverDelay += delta;
      if (game.gameOverDelay > 1500 && consumeKey('Enter')) startGame(game);
      renderGameOverScreen(ctx, game.score, game.highScore, game.level, game.gameOverDelay);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
