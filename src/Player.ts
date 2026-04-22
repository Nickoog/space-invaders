import { PLAYER_W, PLAYER_Y, PLAYER_SPEED, PLAYER_BULLET_SPEED, PLAYER_FIRE_CD, POKEBALL_RADIUS, W } from './constants.js';
import type { Player, Bullet } from './types.js';

export function createPlayer(): Player {
  return {
    x: W / 2 - PLAYER_W / 2,
    y: PLAYER_Y,
    invincible: 0,
    fireCooldown: 0,
  };
}

// Returns a new bullet object or null. Mutates player timers.
export function updatePlayer(player: Player, dt: number, keys: Record<string, boolean>, hasBullet: boolean): Bullet | null {
  const s = dt / 1000;

  if (keys['ArrowLeft'])  player.x = Math.max(0,          player.x - PLAYER_SPEED * s);
  if (keys['ArrowRight']) player.x = Math.min(W - PLAYER_W, player.x + PLAYER_SPEED * s);

  player.fireCooldown -= dt;
  if (player.invincible > 0) player.invincible -= dt;

  if (keys['Space'] && player.fireCooldown <= 0 && !hasBullet) {
    player.fireCooldown = PLAYER_FIRE_CD;
    const r = POKEBALL_RADIUS;
    return {
      x:  player.x + PLAYER_W / 2 - r,
      y:  player.y - r * 2,
      w:  r * 2,
      h:  r * 2,
      vy: -PLAYER_BULLET_SPEED,
      active: true,
    };
  }
  return null;
}
