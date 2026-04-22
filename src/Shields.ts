import { SHIELD_COLS, SHIELD_ROWS, SHIELD_BLOCK, SHIELD_W, SHIELD_Y, NUM_SHIELDS, W } from './constants.js';
import type { Shield } from './types.js';

// Arch shape bitmask (1 = alive). Rows top→bottom, columns left→right.
const ARCH: number[][] = [
  [1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1],
  [1,1,1,0,0,1,1,1],
  [1,1,0,0,0,0,1,1],
];

export function createShields(): Shield[] {
  const gap = (W - NUM_SHIELDS * SHIELD_W) / (NUM_SHIELDS + 1);
  return Array.from({ length: NUM_SHIELDS }, (_, i) => ({
    x: gap + i * (SHIELD_W + gap),
    y: SHIELD_Y,
    blocks: ARCH.map(row => [...row]),
  }));
}

// Returns true and erodes the first block hit; false if no hit.
export function hitShield(shields: Shield[], bx: number, by: number, bw: number, bh: number): boolean {
  for (const s of shields) {
    for (let r = 0; r < SHIELD_ROWS; r++) {
      for (let c = 0; c < SHIELD_COLS; c++) {
        if (!s.blocks[r]?.[c]) continue;
        const sx = s.x + c * SHIELD_BLOCK;
        const sy = s.y + r * SHIELD_BLOCK;
        if (bx < sx + SHIELD_BLOCK && bx + bw > sx &&
            by < sy + SHIELD_BLOCK && by + bh > sy) {
          s.blocks[r]![c] = 0;
          return true;
        }
      }
    }
  }
  return false;
}
