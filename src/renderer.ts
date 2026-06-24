import {
  W, H, PLAYER_W,
  CAUGHT_FLASH_MS, WRONG_TYPE_PENALTY_MS,
  ROW_COLORS, ENEMY_W, ENEMY_H, ENEMY_X_GAP, ENEMY_Y_GAP,
  BLINK_INTERVAL_MS, LEVEL_CLEAR_RATIO,
} from './constants.js';
import { TYPE_COLORS } from './api/pokeapi.js';
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

// ── Arena background ──────────────────────────────────────────────────────────

// Floor tint per type (subtle — must not obscure sprites)
const ARENA_FLOOR_TINTS: Record<string, string> = {
  fire:     '#2a0800', water:    '#001a2a', grass:    '#001a00',
  electric: '#1a1a00', psychic:  '#1a0014', poison:   '#0f0018',
  ground:   '#1a0f00', rock:     '#0f0f0f', flying:   '#00101a',
  bug:      '#0a1000', ice:      '#001a1a', fighting: '#1a0000',
  ghost:    '#0a000f', dragon:   '#06001a',
};

// Static star field — same positions every frame for performance
const STARS: Array<{ x: number; y: number; r: number; a: number }> = Array.from({ length: 60 }, (_, i) => ({
  x: ((i * 137.508) % W),
  y: ((i * 97.3) % (H * 0.58)),
  r: i % 5 === 0 ? 1.5 : 0.8,
  a: 0.4 + (i % 3) * 0.2,
}));

export function drawArenaBackground(ctx: CanvasRenderingContext2D, levelType: string): void {
  const skyH  = Math.floor(H * 0.60);
  const floorY = skyH;

  // ── Sky gradient ──────────────────────────────────────────────────────────
  const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
  skyGrad.addColorStop(0, '#04000e');
  skyGrad.addColorStop(1, '#110820');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, skyH);

  // ── Stars ─────────────────────────────────────────────────────────────────
  for (const s of STARS) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Arena floor ───────────────────────────────────────────────────────────
  const floorH = H - floorY;
  const floorTint = ARENA_FLOOR_TINTS[levelType] ?? '#0a0a0a';
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
  floorGrad.addColorStop(0, floorTint);
  floorGrad.addColorStop(1, '#000000');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, W, floorH);

  // Horizon line
  const typeColor = TYPE_COLORS[levelType] ?? '#334455';
  ctx.strokeStyle = typeColor;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(W, floorY);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Perspective grid lines on floor ──────────────────────────────────────
  const vp = { x: W / 2, y: floorY };     // vanishing point at horizon center
  ctx.strokeStyle = typeColor;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;
  const gridLines = 9;
  for (let i = 0; i <= gridLines; i++) {
    const bx = (W / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(vp.x, vp.y);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }

  // Horizontal floor lines (perspective spacing)
  const hLines = 5;
  for (let i = 1; i <= hLines; i++) {
    const t = (i / hLines) ** 1.6;          // exponential spacing for perspective feel
    const y = floorY + t * floorH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Arena circle at floor level
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = typeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(W / 2, floorY + floorH * 0.18, 120, 28, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// ── Enemy projectile by type ──────────────────────────────────────────────────

export function drawEnemyBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, levelType = 'poison'): void {
  const cx = bullet.x + bullet.w / 2;
  const cy = bullet.y + bullet.h / 2;
  const r  = Math.max(bullet.w, bullet.h) / 2;

  ctx.save();
  ctx.translate(cx, cy);

  switch (levelType) {

    case 'electric': {
      // Yellow zigzag lightning bolt
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 6;
      const h = r * 2.5;
      ctx.beginPath();
      ctx.moveTo(2,    -h);
      ctx.lineTo(-2,   -h * 0.2);
      ctx.lineTo(3,    -h * 0.2);
      ctx.lineTo(-2,    h);
      ctx.stroke();
      break;
    }

    case 'fire': {
      // Orange teardrop with glow
      ctx.fillStyle = '#FF6600';
      ctx.shadowColor = '#FF4400';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.moveTo(-r * 0.4, r * 0.3);
      ctx.quadraticCurveTo(0, -r * 1.8, r * 0.4, r * 0.3);
      ctx.fill();
      break;
    }

    case 'water': {
      // Blue teardrop
      ctx.fillStyle = '#4488FF';
      ctx.shadowColor = '#2266FF';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, r * 0.4, r * 0.75, 0, Math.PI * 2);
      ctx.moveTo(-r * 0.35, r * 0.4);
      ctx.quadraticCurveTo(0, -r * 1.6, r * 0.35, r * 0.4);
      ctx.fill();
      break;
    }

    case 'grass': {
      // Green leaf (two arcs)
      ctx.fillStyle = '#44CC44';
      ctx.shadowColor = '#22AA22';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.4);
      ctx.bezierCurveTo(r * 1.2, -r * 0.4, r * 0.8, r * 1.0, 0, r * 1.0);
      ctx.bezierCurveTo(-r * 0.8, r * 1.0, -r * 1.2, -r * 0.4, 0, -r * 1.4);
      ctx.fill();
      break;
    }

    case 'psychic': {
      // Pink pulsing star
      ctx.fillStyle = '#FF44AA';
      ctx.shadowColor = '#FF44AA';
      ctx.shadowBlur = 10;
      const pts = 4, outer = r * 1.2, inner = r * 0.5;
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) {
        const angle = (i * Math.PI) / pts - Math.PI / 2;
        const rad   = i % 2 === 0 ? outer : inner;
        i === 0 ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
                : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'ice': {
      // Cyan crystal / diamond
      ctx.strokeStyle = '#88EEFF';
      ctx.fillStyle   = 'rgba(136,238,255,0.3)';
      ctx.shadowColor = '#88EEFF';
      ctx.shadowBlur  = 8;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.4);
      ctx.lineTo(r * 0.7, 0);
      ctx.lineTo(0, r * 1.4);
      ctx.lineTo(-r * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'ghost': {
      // Mauve shadow — fading orb
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
      grad.addColorStop(0,   'rgba(136,68,170,0.9)');
      grad.addColorStop(0.5, 'rgba(100,40,130,0.5)');
      grad.addColorStop(1,   'rgba(80,20,100,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'dragon': {
      // Blue-violet energy orb with outer ring
      ctx.fillStyle   = '#6644FF';
      ctx.shadowColor = '#8866FF';
      ctx.shadowBlur  = 12;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,160,255,0.6)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'fighting': {
      // Red-orange impact star (4 points)
      ctx.fillStyle   = '#FF4422';
      ctx.shadowColor = '#FF6600';
      ctx.shadowBlur  = 6;
      const sp = 4, so = r * 1.1, si = r * 0.4;
      ctx.beginPath();
      for (let i = 0; i < sp * 2; i++) {
        const angle = (i * Math.PI) / sp - Math.PI / 4;
        const rad   = i % 2 === 0 ? so : si;
        i === 0 ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
                : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'poison': {
      // Purple bubble
      ctx.fillStyle   = 'rgba(170,68,255,0.25)';
      ctx.strokeStyle = '#AA44FF';
      ctx.shadowColor = '#AA44FF';
      ctx.shadowBlur  = 6;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Highlight
      ctx.fillStyle = 'rgba(220,180,255,0.5)';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'rock': {
      // Gray irregular polygon
      ctx.fillStyle   = '#999999';
      ctx.shadowColor = '#555555';
      ctx.shadowBlur  = 3;
      ctx.beginPath();
      ctx.moveTo(0,       -r * 1.2);
      ctx.lineTo(r * 0.9, -r * 0.4);
      ctx.lineTo(r * 0.7,  r * 0.9);
      ctx.lineTo(-r * 0.6, r * 1.0);
      ctx.lineTo(-r * 1.0, r * 0.2);
      ctx.lineTo(-r * 0.5, -r * 1.0);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'ground': {
      // Brown/tan diamond
      ctx.fillStyle   = '#CC8844';
      ctx.shadowColor = '#AA6622';
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.3);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r * 1.3);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'flying': {
      // White crescent gust lines
      ctx.strokeStyle = '#AADDFF';
      ctx.lineWidth   = 2;
      ctx.shadowColor = '#AADDFF';
      ctx.shadowBlur  = 5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(r * 0.4, i * r * 0.6, r * 0.9, Math.PI * 0.6, Math.PI * 1.4);
        ctx.stroke();
      }
      break;
    }

    case 'bug': {
      // Green olive oval
      ctx.fillStyle   = '#88BB22';
      ctx.shadowColor = '#66AA00';
      ctx.shadowBlur  = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.7, r * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      // Fallback: simple colored circle
      const col = TYPE_COLORS[levelType] ?? '#cc44ff';
      ctx.fillStyle   = col;
      ctx.shadowColor = col;
      ctx.shadowBlur  = 5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ── Wrong-type penalty vignette ───────────────────────────────────────────────
export function drawPenaltyVignette(ctx: CanvasRenderingContext2D, penaltyTimer: number): void {
  // Pulse: blink fast at start, fade as timer runs down
  const blink = Math.sin(Date.now() / 80) * 0.5 + 0.5;
  ctx.globalAlpha = Math.min(0.55, (penaltyTimer / WRONG_TYPE_PENALTY_MS) * 0.55) * blink;
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
  ctx.font = '11px "Press Start 2P", monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`POKÉDEX  ${String(score).padStart(4, '0')}`, 20, 30);

  ctx.textAlign = 'center';
  ctx.fillText(`HI  ${String(highScore).padStart(4, '0')}`, W / 2, 30);

  ctx.textAlign = 'right';
  ctx.fillText(`NIV. ${level} / 17`, W - 20, 30);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#00ff44';
  ctx.fillText('VIES:', 20, H - 12);
  for (let i = 0; i < lives; i++) {
    drawMiniPokeball(ctx, 78 + i * 26, H - 20, 8);
  }

  // Ammo counter
  ctx.textAlign = 'center';
  ctx.fillStyle = game.ammo > 0 ? '#00ff44' : '#ff4444';
  ctx.fillText(`AMMO ×${game.ammo}`, W / 2, H - 12);
  if (game.ammo === 0) {
    ctx.fillStyle = '#ffff00';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('[ ESPACE ] recharger', W / 2, H - 28);
  }

  // Pokémon remaining to catch before level ends — only correct-type count
  const aliveCorrect = game.grid?.enemies.filter(e => e.alive && e.correctType).length ?? 0;
  const totalCorrect = game.grid?.enemies.filter(e => e.correctType).length ?? 0;
  const toCatch      = Math.max(0, aliveCorrect - Math.floor(totalCorrect * (1 - LEVEL_CLEAR_RATIO)));
  ctx.textAlign = 'right';
  ctx.fillStyle = toCatch === 0 ? '#ffffff' : '#00ff44';
  ctx.fillText(`À attraper : ${toCatch}`, W - 20, H - 12);

  // Bonus message — fades out over the last 500ms
  if (game.bonusMessageTimer > 0) {
    const alpha = Math.min(1, game.bonusMessageTimer / 500);
    ctx.globalAlpha = alpha;
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#ffff44';
    ctx.font        = '13px "Press Start 2P", monospace';
    ctx.fillText(`Bonne réponse !  ${game.bonusMessage}`, W / 2, H / 2 - 60);
    ctx.globalAlpha = 1;
    ctx.font        = '11px "Press Start 2P", monospace';
  }


  ctx.fillStyle = '#00ff44';
  ctx.fillRect(0, H - 38, W, 2);
}
