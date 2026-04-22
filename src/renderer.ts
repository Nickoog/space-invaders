import {
  W, H, PLAYER_W, PLAYER_H,
  SHIELD_COLS, SHIELD_ROWS, SHIELD_BLOCK,
  POKEBALL_RADIUS, CAUGHT_FLASH_MS,
  ROW_COLORS, ENEMY_W, ENEMY_H, ENEMY_X_GAP, ENEMY_Y_GAP,
  BLINK_INTERVAL_MS,
} from './constants.js';
import type { Player, Bullet, Grid, Enemy, Shield, GameState } from './types.js';

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

  // White flash overlay while being caught
  if (enemy.caughtFlash > 0) {
    ctx.globalAlpha = (enemy.caughtFlash / CAUGHT_FLASH_MS) * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, y - 2, ENEMY_W + 4, ENEMY_H + 4);
    ctx.globalAlpha = 1;
  }
}

// ── Shields ───────────────────────────────────────────────────────
export function drawShields(ctx: CanvasRenderingContext2D, shields: Shield[]): void {
  ctx.fillStyle = '#00ee44';
  for (const s of shields) {
    for (let r = 0; r < SHIELD_ROWS; r++) {
      for (let c = 0; c < SHIELD_COLS; c++) {
        if (!s.blocks[r]?.[c]) continue;
        ctx.fillRect(
          s.x + c * SHIELD_BLOCK,
          s.y + r * SHIELD_BLOCK,
          SHIELD_BLOCK, SHIELD_BLOCK
        );
      }
    }
  }
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

export function drawHUD(ctx: CanvasRenderingContext2D, { score, highScore, lives, level }: GameState): void {
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

  ctx.fillStyle = '#00ff44';
  ctx.fillRect(0, H - 38, W, 2);
}
