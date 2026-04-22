import { describe, it, expect } from 'vitest';
import { createPlayer, updatePlayer } from '../../src/Player.js';
import { W, PLAYER_W, PLAYER_Y, PLAYER_FIRE_CD } from '../../src/constants.js';

describe('createPlayer', () => {
  it('starts centered horizontally', () => {
    const player = createPlayer();
    expect(player.x).toBe(W / 2 - PLAYER_W / 2);
  });

  it('starts at PLAYER_Y', () => {
    const player = createPlayer();
    expect(player.y).toBe(PLAYER_Y);
  });

  it('starts with no invincibility', () => {
    const player = createPlayer();
    expect(player.invincible).toBe(0);
  });

  it('starts with no fire cooldown', () => {
    const player = createPlayer();
    expect(player.fireCooldown).toBe(0);
  });
});

describe('updatePlayer — movement', () => {
  it('moves left when ArrowLeft is held', () => {
    const player = createPlayer();
    const startX = player.x;
    updatePlayer(player, 100, { ArrowLeft: true }, false);
    expect(player.x).toBeLessThan(startX);
  });

  it('moves right when ArrowRight is held', () => {
    const player = createPlayer();
    const startX = player.x;
    updatePlayer(player, 100, { ArrowRight: true }, false);
    expect(player.x).toBeGreaterThan(startX);
  });

  it('clamps to left boundary', () => {
    const player = createPlayer();
    player.x = 0;
    updatePlayer(player, 5000, { ArrowLeft: true }, false);
    expect(player.x).toBeGreaterThanOrEqual(0);
  });

  it('clamps to right boundary', () => {
    const player = createPlayer();
    player.x = W - PLAYER_W;
    updatePlayer(player, 5000, { ArrowRight: true }, false);
    expect(player.x).toBeLessThanOrEqual(W - PLAYER_W);
  });

  it('does not move without key input', () => {
    const player = createPlayer();
    const startX = player.x;
    updatePlayer(player, 100, {}, false);
    expect(player.x).toBe(startX);
  });
});

describe('updatePlayer — shooting', () => {
  it('fires a bullet when Space is pressed and cooldown is ready', () => {
    const player = createPlayer();
    const bullet = updatePlayer(player, 100, { Space: true }, false);
    expect(bullet).not.toBeNull();
    expect(bullet.active).toBe(true);
  });

  it('fires a bullet moving upward (negative vy)', () => {
    const player = createPlayer();
    const bullet = updatePlayer(player, 100, { Space: true }, false);
    expect(bullet.vy).toBeLessThan(0);
  });

  it('fires from above the player position', () => {
    const player = createPlayer();
    const bullet = updatePlayer(player, 100, { Space: true }, false);
    expect(bullet.y).toBeLessThan(player.y);
  });

  it('does not fire when hasBullet is true', () => {
    const player = createPlayer();
    const bullet = updatePlayer(player, 100, { Space: true }, true);
    expect(bullet).toBeNull();
  });

  it('does not fire during cooldown', () => {
    const player = createPlayer();
    updatePlayer(player, 100, { Space: true }, false); // first shot sets cooldown
    const second = updatePlayer(player, 100, { Space: true }, false);
    expect(second).toBeNull();
  });

  it('can fire again after cooldown expires', () => {
    const player = createPlayer();
    updatePlayer(player, 100, { Space: true }, false);
    const bullet = updatePlayer(player, PLAYER_FIRE_CD + 1, { Space: true }, false);
    expect(bullet).not.toBeNull();
  });

  it('sets fire cooldown after shooting', () => {
    const player = createPlayer();
    updatePlayer(player, 100, { Space: true }, false);
    expect(player.fireCooldown).toBeGreaterThan(0);
  });
});

describe('updatePlayer — invincibility', () => {
  it('decrements invincibility timer', () => {
    const player = createPlayer();
    player.invincible = 500;
    updatePlayer(player, 100, {}, false);
    expect(player.invincible).toBe(400);
  });

  it('does not decrement when invincibility is already zero', () => {
    const player = createPlayer();
    player.invincible = 0;
    updatePlayer(player, 100, {}, false);
    expect(player.invincible).toBe(0);
  });
});
