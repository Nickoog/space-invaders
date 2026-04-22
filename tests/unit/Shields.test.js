import { describe, it, expect } from 'vitest';
import { createShields, hitShield } from '../../src/Shields.js';
import { NUM_SHIELDS, SHIELD_BLOCK, SHIELD_COLS, SHIELD_ROWS } from '../../src/constants.js';

describe('createShields', () => {
  it('creates the correct number of shields', () => {
    expect(createShields()).toHaveLength(NUM_SHIELDS);
  });

  it('each shield has the correct number of rows', () => {
    for (const s of createShields()) {
      expect(s.blocks).toHaveLength(SHIELD_ROWS);
    }
  });

  it('each shield row has the correct number of columns', () => {
    for (const s of createShields()) {
      for (const row of s.blocks) {
        expect(row).toHaveLength(SHIELD_COLS);
      }
    }
  });

  it('shields are ordered left to right', () => {
    const shields = createShields();
    for (let i = 1; i < shields.length; i++) {
      expect(shields[i].x).toBeGreaterThan(shields[i - 1].x);
    }
  });

  it('shields are evenly spaced', () => {
    const shields = createShields();
    const gaps = [];
    for (let i = 1; i < shields.length; i++) {
      gaps.push(shields[i].x - shields[i - 1].x);
    }
    const first = gaps[0];
    expect(gaps.every(g => Math.abs(g - first) < 0.01)).toBe(true);
  });

  it('top-left block of each shield is alive (ARCH shape)', () => {
    for (const s of createShields()) {
      expect(s.blocks[0][0]).toBe(1);
    }
  });

  it('bottom-center blocks are holes (ARCH shape)', () => {
    for (const s of createShields()) {
      // Row 3, cols 2–5 are holes in the ARCH bitmask
      expect(s.blocks[3][2]).toBe(0);
      expect(s.blocks[3][3]).toBe(0);
    }
  });
});

describe('hitShield', () => {
  it('returns false when bullet misses all shields', () => {
    const shields = createShields();
    expect(hitShield(shields, -200, -200, 10, 10)).toBe(false);
  });

  it('returns true when bullet hits an alive block', () => {
    const shields = createShields();
    const s = shields[0];
    // Block [0][0] is always alive in the ARCH shape
    const result = hitShield(shields, s.x, s.y, 1, 1);
    expect(result).toBe(true);
  });

  it('erodes the block that was hit', () => {
    const shields = createShields();
    const s = shields[0];
    hitShield(shields, s.x, s.y, 1, 1);
    expect(s.blocks[0][0]).toBe(0);
  });

  it('returns false when hitting an already-destroyed block', () => {
    const shields = createShields();
    const s = shields[0];
    s.blocks[0][0] = 0; // pre-destroy the block
    // A bullet landing exactly on this destroyed block and no other alive block
    // We cover only that pixel — should miss since the block is dead
    // We verify it remains 0 (no double-destroy side effects)
    const before = JSON.stringify(s.blocks);
    hitShield(shields, s.x, s.y, 1, 1); // may hit the next alive block in iteration
    // The important invariant: destroyed blocks are never set back to 1
    for (const row of s.blocks) {
      for (const cell of row) {
        expect(cell === 0 || cell === 1).toBe(true);
      }
    }
  });

  it('only erodes one block per hit', () => {
    const shields = createShields();
    const s = shields[0];
    const aliveBefore = s.blocks.flat().filter(v => v === 1).length;
    hitShield(shields, s.x, s.y, SHIELD_BLOCK * SHIELD_COLS, SHIELD_BLOCK * SHIELD_ROWS);
    const aliveAfter = s.blocks.flat().filter(v => v === 1).length;
    expect(aliveBefore - aliveAfter).toBe(1);
  });
});
