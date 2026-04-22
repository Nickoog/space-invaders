import { H } from './constants.js';

export function createBullets() {
  return { player: [], enemy: [] };
}

export function updateBullets(bullets, dt) {
  const s = dt / 1000;
  for (const b of bullets.player) b.y += b.vy * s;
  for (const b of bullets.enemy)  b.y += b.vy * s;
  bullets.player = bullets.player.filter(b => b.active && b.y + b.h > 0);
  bullets.enemy  = bullets.enemy.filter( b => b.active && b.y < H + 20);
}
