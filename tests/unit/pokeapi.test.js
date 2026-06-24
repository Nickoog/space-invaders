import { describe, it, expect } from 'vitest';
import { getIdsForLevel } from '../../src/api/pokeapi.js';
import { GEN1_COUNT, ENEMY_COLS, ENEMY_ROWS } from '../../src/constants.js';

const TOTAL = ENEMY_COLS * ENEMY_ROWS;

describe('getIdsForLevel', () => {
  it('returns the correct number of IDs', () => {
    expect(getIdsForLevel(1).ids).toHaveLength(TOTAL);
  });

  it('level 1 starts at Pokémon ID 1', () => {
    expect(getIdsForLevel(1).ids[0]).toBe(1);
  });

  it('level 1 ends at Pokémon ID 55', () => {
    expect(getIdsForLevel(1).ids.at(-1)).toBe(TOTAL);
  });

  it('level 2 continues immediately after level 1', () => {
    const last1 = getIdsForLevel(1).ids.at(-1);
    const first2 = getIdsForLevel(2).ids[0];
    expect(first2).toBe((last1 % GEN1_COUNT) + 1);
  });

  it('all IDs are within Gen 1 range (1–151) for any level', () => {
    for (let level = 1; level <= 10; level++) {
      const { ids } = getIdsForLevel(level);
      expect(ids.every(id => id >= 1 && id <= GEN1_COUNT)).toBe(true);
    }
  });

  it('wraps around after Gen 1 is exhausted', () => {
    // Level 3: IDs go from 111 to 151, then wrap back to 1–14
    const { ids } = getIdsForLevel(3);
    expect(ids.some(id => id >= 111)).toBe(true);
    expect(ids.some(id => id <= 14)).toBe(true);
  });

  it('has no duplicates within a single level', () => {
    const { ids } = getIdsForLevel(1);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('produces different IDs for different levels', () => {
    const ids1 = getIdsForLevel(1).ids;
    const ids2 = getIdsForLevel(2).ids;
    expect(ids1).not.toEqual(ids2);
  });

  it('cycles back to the same IDs after GEN1_COUNT Pokémon', () => {
    // After cycling through all 151, level N and level N+K should share the same IDs
    // when K * TOTAL is a multiple of GEN1_COUNT
    // LCM(55, 151) = 8305, so after 8305/55 = 151 levels the pattern repeats
    const ids1 = getIdsForLevel(1).ids;
    const ids152 = getIdsForLevel(1 + GEN1_COUNT).ids; // 152nd level restarts the cycle
    expect(ids152).toEqual(ids1);
  });
});
