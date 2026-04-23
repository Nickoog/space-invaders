import {
  W, H, PLAYER_W, PLAYER_H,
  POKEBALL_RADIUS, CAUGHT_FLASH_MS,
  ROW_COLORS, ENEMY_W, ENEMY_H, ENEMY_X_GAP, ENEMY_Y_GAP,
  BLINK_INTERVAL_MS, ENEMY_COLS, ENEMY_ROWS, LEVEL_CLEAR_RATIO,
} from './constants.js';
import type { Player, Bullet, Grid, Enemy, GameState } from './types.js';

// ── Player (trainer silhouette) ───────────────────────────────────
export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  if (player.invincible > 0 && Math.floor(player.invincible / BLINK_INTERVAL_MS) % 2 === 0) return;

  const { x, y } = player;
  const cx = x + PLAYER_W / 2;

  // Hat brim
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(cx - 10, y - 6, 20, 5);
  // Hat top
  ctx.fillRect(cx - 6, y - 14, 12, 10);

  // Head
  ctx.beginPath();
  ctx.arc(cx, y + 4, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c592';
  ctx.fill();

  // Body
  ctx.fillStyle = '#1a1aaa';
  ctx.fillRect(cx - 10, y + 12, 20, 14);

  // Arm extended forward (right side)
  ctx.fillRect(cx + 10, y + 13, 14, 6);
}

// ── Pokeball projectile ───────────────────────────────────────────
export function drawPokeball(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
  const r  = bullet.w / 2;
  const cx = bullet.x + r;
  const cy = bullet.y + r;

  // Top half — red
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.fillStyle = '#dd0000';
  ctx.fill();

  // Bottom half — white
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Dividing line
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Center button
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Enemy projectile (purple seed / spore) ────────────────────────
export function drawEnemyBullet(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
  ctx.fillStyle = '#cc44ff';
  ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
}

// ── Pokemon sprite (with fallback + caught flash) ─────────────────
export function drawPokemon(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  enemy: Enemy,
  spriteMap: Map<number, HTMLImageElement | null>,
): void {
  const x = grid.ox + enemy.col * (ENEMY_W + ENEMY_X_GAP);
  const y = grid.oy + enemy.row * (ENEMY_H + ENEMY_Y_GAP);

  const img = spriteMap.get(enemy.pokemonId);

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x, y, ENEMY_W, ENEMY_H);
  } else {
    // Fallback: colored circle
    ctx.beginPath();
    ctx.arc(x + ENEMY_W / 2, y + ENEMY_H / 2, ENEMY_W / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = ROW_COLORS[enemy.row] ?? '#ffffff';
    ctx.fill();
  }

  // Red tint overlay for wrong-type enemies
  if (!enemy.correctType) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle   = '#ff2020';
    ctx.fillRect(x, y, ENEMY_W, ENEMY_H);
    ctx.globalAlpha = 1;
  }

  // White flash overlay while being caught
  if (enemy.caughtFlash > 0) {
    ctx.globalAlpha = (enemy.caughtFlash / CAUGHT_FLASH_MS) * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 2, ENEMY_W + 4, ENEMY_H + 4);
    ctx.globalAlpha = 1;
  }
}

// ── Wrong-type penalty vignette ───────────────────────────────────────────────
export function drawPenaltyVignette(ctx: CanvasRenderingContext2D, penaltyTimer: number): void {
  // Pulse: blink fast at start, fade as timer runs down
  const blink = Math.sin(Date.now() / 80) * 0.5 + 0.5;
  ctx.globalAlpha = Math.min(0.55, (penaltyTimer / 4000) * 0.55) * blink;
  ctx.fillStyle   = '#ff0000';
  const thickness = 24;
  ctx.fillRect(0, 0, W, thickness);
  ctx.fillRect(0, H - thickness, W, thickness);
  ctx.fillRect(0, 0, thickness, H);
  ctx.fillRect(W - thickness, 0, thickness, H);
  ctx.globalAlpha = 1;
}

// ── HUD ───────────────────────────────────────────────────────────
function drawMiniPokeball(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.fillStyle = '#dd0000';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#ddd';
  ctx.fill();
}

export function drawHUD(ctx: CanvasRenderingContext2D, game: GameState): void {
  const { score, highScore, lives, level } = game;
  ctx.fillStyle = '#00ff44';
  ctx.font = '16px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`POKÉDEX  ${String(score).padStart(4, '0')}`, 20, 30);

  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${String(highScore).padStart(4, '0')}`, W / 2, 30);

  ctx.textAlign = 'right';
  ctx.fillText(`NIVEAU ${level}`, W - 20, 30);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#00ff44';
  ctx.fillText('VIES:', 20, H - 12);
  for (let i = 0; i < lives; i++) {
    drawMiniPokeball(ctx, 78 + i * 26, H - 20, 8);
  }

  // Pokémon remaining to catch before level ends
  const alive     = game.grid?.enemies.filter(e => e.alive).length ?? 0;
  const threshold = Math.floor(ENEMY_COLS * ENEMY_ROWS * (1 - LEVEL_CLEAR_RATIO));
  const toCatch   = Math.max(0, alive - threshold);
  ctx.textAlign = 'right';
  ctx.fillStyle = toCatch === 0 ? '#ffffff' : '#00ff44';
  ctx.fillText(`À attraper : ${toCatch}`, W - 20, H - 12);

  // Bonus message — fades out over the last 500ms
  if (game.bonusMessageTimer > 0) {
    const alpha = Math.min(1, game.bonusMessageTimer / 500);
    ctx.globalAlpha = alpha;
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#ffff44';
    ctx.font        = 'bold 22px monospace';
    ctx.fillText(`Bonne réponse !  ${game.bonusMessage}`, W / 2, H / 2 - 60);
    ctx.globalAlpha = 1;
    ctx.font        = '16px monospace';
  }

  ctx.fillStyle = '#00ff44';
  ctx.fillRect(0, H - 38, W, 2);
}
