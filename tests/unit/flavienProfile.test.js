import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadStats, saveStats } from '../../src/flavienProfile.js';

const LS_KEY = 'pokemon_invaders_flavien';

const DEFAULT = { highScore: 0, gamesPlayed: 0, difficultyOffset: 0, preQuizCorrect: 3 };

let store = {};

function makeLocalStorageMock(overrides = {}) {
  return {
    getItem:  (k) => store[k] ?? null,
    setItem:  (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    clear:    () => { store = {}; },
    ...overrides,
  };
}

afterEach(() => {
  store = {};
  vi.unstubAllGlobals();
});

describe('loadStats', () => {
  it('retourne DEFAULT si localStorage est vide', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    expect(loadStats()).toEqual(DEFAULT);
  });

  it('retourne DEFAULT si le JSON est invalide', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    store[LS_KEY] = 'not-json{{{';
    expect(loadStats()).toEqual(DEFAULT);
  });

  it('merge avec DEFAULT si des champs sont manquants', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    store[LS_KEY] = JSON.stringify({ highScore: 999 });
    const result = loadStats();
    expect(result.highScore).toBe(999);
    expect(result.gamesPlayed).toBe(0);
    expect(result.difficultyOffset).toBe(0);
    expect(result.preQuizCorrect).toBe(3);
  });

  it('retourne l\'objet complet si toutes les clés sont présentes', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    const saved = { highScore: 500, gamesPlayed: 10, difficultyOffset: 200, preQuizCorrect: 3 };
    store[LS_KEY] = JSON.stringify(saved);
    expect(loadStats()).toEqual(saved);
  });
});

describe('saveStats', () => {
  it('persiste le JSON en localStorage', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    const stats = { highScore: 1000, gamesPlayed: 5, difficultyOffset: -100, preQuizCorrect: 4 };
    saveStats(stats);
    expect(JSON.parse(store[LS_KEY])).toEqual(stats);
  });

  it('ne crash pas si setItem lève une erreur', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock({
      setItem: () => { throw new Error('QuotaExceededError'); },
    }));
    expect(() => saveStats(DEFAULT)).not.toThrow();
  });
});

describe('round-trip', () => {
  it('saveStats puis loadStats redonne le même objet', () => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
    const stats = { highScore: 750, gamesPlayed: 3, difficultyOffset: 100, preQuizCorrect: 2 };
    saveStats(stats);
    expect(loadStats()).toEqual(stats);
  });
});
