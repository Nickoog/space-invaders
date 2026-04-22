import { describe, it, expect } from 'vitest';
import { createBullets, updateBullets } from '../../src/Bullets.js';
import { H } from '../../src/constants.js';

function makeBullet(overrides = {}) {
  return { x: 100, y: 300, w: 10, h: 10, vy: -100, active: true, ...overrides };
}

describe('createBullets', () => {
  it('creates empty player and enemy arrays', () => {
    const bullets = createBullets();
    expect(bullets.player).toEqual([]);
    expect(bullets.enemy).toEqual([]);
  });
});

describe('updateBullets — movement', () => {
  it('moves player bullets upward (negative vy)', () => {
    const bullets = createBullets();
    bullets.player.push(makeBullet({ y: 300, vy: -200 }));
    updateBullets(bullets, 500); // 0.5 s
    expect(bullets.player[0].y).toBeCloseTo(200); // 300 - 200*0.5
  });

  it('moves enemy bullets downward (positive vy)', () => {
    const bullets = createBullets();
    bullets.enemy.push(makeBullet({ y: 100, vy: 200 }));
    updateBullets(bullets, 500);
    expect(bullets.enemy[0].y).toBeCloseTo(200); // 100 + 200*0.5
  });

  it('moves proportionally to dt', () => {
    const b1 = makeBullet({ y: 300, vy: -100 });
    const b2 = makeBullet({ y: 300, vy: -100 });
    const bullets1 = createBullets();
    const bullets2 = createBullets();
    bullets1.player.push(b1);
    bullets2.player.push(b2);
    updateBullets(bullets1, 200);
    updateBullets(bullets2, 400);
    expect(b2.y).toBeLessThan(b1.y);
  });
});

describe('updateBullets — filtering', () => {
  it('removes player bullets that exit the top of the screen', () => {
    const bullets = createBullets();
    bullets.player.push(makeBullet({ y: -20, h: 10, vy: -100 })); // y + h = -10 < 0
    updateBullets(bullets, 16);
    expect(bullets.player).toHaveLength(0);
  });

  it('removes enemy bullets that exit the bottom of the screen', () => {
    const bullets = createBullets();
    bullets.enemy.push(makeBullet({ y: H + 30, vy: 100 }));
    updateBullets(bullets, 16);
    expect(bullets.enemy).toHaveLength(0);
  });

  it('removes inactive player bullets', () => {
    const bullets = createBullets();
    bullets.player.push(makeBullet({ active: false }));
    updateBullets(bullets, 16);
    expect(bullets.player).toHaveLength(0);
  });

  it('removes inactive enemy bullets', () => {
    const bullets = createBullets();
    bullets.enemy.push(makeBullet({ active: false, vy: 100 }));
    updateBullets(bullets, 16);
    expect(bullets.enemy).toHaveLength(0);
  });

  it('keeps active bullets that are still on screen', () => {
    const bullets = createBullets();
    bullets.player.push(makeBullet({ y: 300 }));
    updateBullets(bullets, 16);
    expect(bullets.player).toHaveLength(1);
  });

  it('handles multiple bullets and removes only the ones out of bounds', () => {
    const bullets = createBullets();
    bullets.player.push(makeBullet({ y: 300 }));           // in bounds
    bullets.player.push(makeBullet({ y: -20, h: 10 }));    // out of bounds
    updateBullets(bullets, 16);
    expect(bullets.player).toHaveLength(1);
  });
});
