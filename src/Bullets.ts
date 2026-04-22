import { H } from './constants.js';
import type { Bullet, Bullets } from './types.js';

export function createBullets(): Bullets {
  return { player: [], enemy: [] };
}

export function updateBullets(bullets: Bullets, dt: number): void {
  const s = dt / 1000;
  for (const b of bullets.player) b.y += b.vy * s;
  for (const b of bullets.enemy)  b.y += b.vy * s;
  bullets.player = bullets.player.filter((b: Bullet) => b.active && b.y + b.h > 0);
  bullets.enemy  = bullets.enemy.filter( (b: Bullet) => b.active && b.y < H + 20);
}
