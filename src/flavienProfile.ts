import type { FlavienStats } from './types.js';

const LS_KEY = 'pokemon_invaders_flavien';

const DEFAULT: FlavienStats = {
  highScore:        0,
  gamesPlayed:      0,
  difficultyOffset: 0,
  preQuizCorrect:   3,
};

export function loadStats(): FlavienStats {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) as Partial<FlavienStats> };
  } catch { /* ignore */ }
  return { ...DEFAULT };
}

export function saveStats(s: FlavienStats): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
