import { describe, it, expect } from 'vitest';
import { overlap } from '../../src/collision.js';

describe('overlap', () => {
  it('returns true for overlapping rectangles', () => {
    expect(overlap(0, 0, 10, 10, 5, 5, 10, 10)).toBe(true);
  });

  it('returns true when one rect is fully inside another', () => {
    expect(overlap(0, 0, 100, 100, 10, 10, 20, 20)).toBe(true);
  });

  it('returns true for partial overlap', () => {
    expect(overlap(0, 0, 15, 15, 10, 10, 15, 15)).toBe(true);
  });

  it('returns false when separated horizontally', () => {
    expect(overlap(0, 0, 10, 10, 20, 0, 10, 10)).toBe(false);
  });

  it('returns false when separated vertically', () => {
    expect(overlap(0, 0, 10, 10, 0, 20, 10, 10)).toBe(false);
  });

  it('returns false when rects touch on the right edge but do not overlap', () => {
    expect(overlap(0, 0, 10, 10, 10, 0, 10, 10)).toBe(false);
  });

  it('returns false when rects touch on the bottom edge but do not overlap', () => {
    expect(overlap(0, 0, 10, 10, 0, 10, 10, 10)).toBe(false);
  });

  it('returns false when rects are far apart', () => {
    expect(overlap(0, 0, 5, 5, 100, 100, 5, 5)).toBe(false);
  });
});
