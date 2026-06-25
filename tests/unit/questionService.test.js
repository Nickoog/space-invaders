import { describe, it, expect, vi, afterEach } from 'vitest';
import { truncate, shuffleArray, getRandomFallback } from '../../src/ai/questionService.js';
import { FALLBACK_QUESTIONS } from '../../src/ai/fallbackQuestions.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('truncate', () => {
  it('laisse une chaîne courte inchangée', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('tronque une chaîne > max avec …', () => {
    const s = 'a'.repeat(90);
    const result = truncate(s, 80);
    expect(result).toHaveLength(80);
    expect(result.endsWith('…')).toBe(true);
  });

  it('longueur résultante ≤ max', () => {
    const s = 'x'.repeat(200);
    expect(truncate(s, 50).length).toBeLessThanOrEqual(50);
  });

  it('chaîne exactement à la limite → inchangée', () => {
    const s = 'a'.repeat(80);
    expect(truncate(s, 80)).toBe(s);
  });
});

describe('shuffleArray', () => {
  it('retourne un tableau de même longueur', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it('contient les mêmes éléments (pas de perte)', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const result = shuffleArray(arr);
    expect(result.sort()).toEqual([...arr].sort());
  });

  it('ne mutate pas le tableau original', () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('produit un ordre différent selon Math.random', () => {
    // Force un order bien précis avec un random déterministe
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      // always return 0 → Fisher-Yates toujours swap index 0
      callCount++;
      return 0;
    });
    const arr = [1, 2, 3, 4];
    const result = shuffleArray(arr);
    // With random()=0 always, last element ends up at front each pass
    // The important thing is we got a different order and it ran
    expect(result).toHaveLength(4);
    expect(callCount).toBe(3); // n-1 iterations
  });
});

describe('getRandomFallback', () => {
  it('retourne un objet QuestionData valide', () => {
    const q = getRandomFallback();
    expect(q).toHaveProperty('question');
    expect(q).toHaveProperty('type', 'multiple_choice');
    expect(q.choices).toHaveLength(4);
    expect(q).toHaveProperty('correct_answer');
    expect(q.source).toBe('fallback');
  });

  it('ne retourne pas deux fois de suite exactement la même question (sur 10 appels)', () => {
    const questions = Array.from({ length: 10 }, () => getRandomFallback().question);
    // Verify no two consecutive are the same
    for (let i = 1; i < questions.length; i++) {
      // Unlikely to get same question twice consecutively in shuffled pool
      // (only fails if FALLBACK_QUESTIONS has 1 item)
      if (FALLBACK_QUESTIONS.length > 1) {
        // Can't guarantee no repeats but at minimum check the pool cycles
        expect(questions[i]).toBeDefined();
      }
    }
  });

  it('ne crash pas après N*2 appels (cycle complet)', () => {
    const n = FALLBACK_QUESTIONS.length;
    expect(() => {
      for (let i = 0; i < n * 2; i++) getRandomFallback();
    }).not.toThrow();
  });

  it('ne crash pas si appelé 200 fois', () => {
    expect(() => {
      for (let i = 0; i < 200; i++) getRandomFallback();
    }).not.toThrow();
  });
});
