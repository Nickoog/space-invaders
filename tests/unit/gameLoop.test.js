import { describe, it, expect, vi, afterEach } from 'vitest';

// Mocks AVANT les imports (hoistés par Vitest)
vi.mock('../../src/ui/modal.js', () => ({
  showQuestionModal: vi.fn(),
}));
vi.mock('../../src/email.js', () => ({
  sendGameEmail: vi.fn(),
  diffLabel:     vi.fn().mockReturnValue('Normal'),
}));
vi.mock('../../src/ai/questionService.js', () => ({
  replenishPool:        vi.fn().mockResolvedValue(undefined),
  replenishPokemonPool: vi.fn().mockResolvedValue(undefined),
  getRandomFallback:    vi.fn().mockReturnValue({
    question: 'Q?', type: 'multiple_choice',
    choices: ['A', 'B', 'C', 'D'], correct_answer: 'A',
    source: 'fallback',
  }),
}));
vi.mock('../../src/flavienProfile.js', () => ({
  loadStats: vi.fn().mockImplementation(() => ({ highScore: 100, gamesPlayed: 3, difficultyOffset: 0, preQuizCorrect: 5 })),
  saveStats: vi.fn(),
}));

import { startGame, startLevel, endGame } from '../../src/gameLoop.js';
import { createGame } from '../../src/Game.js';
import { S } from '../../src/constants.js';
import { saveStats } from '../../src/flavienProfile.js';
import { sendGameEmail } from '../../src/email.js';

afterEach(() => {
  vi.clearAllMocks();
});

function makeGame() {
  return createGame(new Map());
}

// ── startGame ────────────────────────────────────────────────────────────────

describe('startGame', () => {
  it('remet score à 0', () => {
    const game = makeGame();
    game.score = 999;
    startGame(game);
    expect(game.score).toBe(0);
  });

  it('remet lives à 3', () => {
    const game = makeGame();
    game.lives = 0;
    startGame(game);
    expect(game.lives).toBe(3);
  });

  it('charge highScore depuis game.stats.highScore', () => {
    const game = makeGame();
    // game.stats.highScore = 100 (valeur du mock loadStats)
    startGame(game);
    expect(game.highScore).toBe(100);
  });

  it('charge difficultyOffset depuis game.stats.difficultyOffset', () => {
    const game = makeGame();
    game.stats.difficultyOffset = 200;
    startGame(game);
    expect(game.difficultyOffset).toBe(200);
  });

  it('set gameStartTime à un timestamp récent', () => {
    const before = Date.now();
    const game = makeGame();
    startGame(game);
    const after = Date.now();
    expect(game.gameStartTime).toBeGreaterThanOrEqual(before);
    expect(game.gameStartTime).toBeLessThanOrEqual(after);
  });

  it('remet emailSent à false', () => {
    const game = makeGame();
    game.emailSent = true;
    startGame(game);
    expect(game.emailSent).toBe(false);
  });
});

// ── startLevel ───────────────────────────────────────────────────────────────

describe('startLevel', () => {
  it('crée un player non-null', () => {
    const game = makeGame();
    startLevel(game, 1);
    expect(game.player).not.toBeNull();
  });

  it('crée une grille non-null', () => {
    const game = makeGame();
    startLevel(game, 1);
    expect(game.grid).not.toBeNull();
  });

  it('crée bullets non-null', () => {
    const game = makeGame();
    startLevel(game, 1);
    expect(game.bullets).not.toBeNull();
  });

  it('remet ammo à 0', () => {
    const game = makeGame();
    game.ammo = 99;
    startLevel(game, 1);
    expect(game.ammo).toBe(0);
  });

  it('remet quizInProgress à false', () => {
    const game = makeGame();
    game.quizInProgress = true;
    startLevel(game, 1);
    expect(game.quizInProgress).toBe(false);
  });

  it('state → S.PRE_LEVEL_QUIZ sans skipLevels', () => {
    const game = makeGame();
    game.skipLevels = false;
    startLevel(game, 1);
    expect(game.state).toBe(S.PRE_LEVEL_QUIZ);
  });

  it('state → S.PLAYING avec skipLevels = true', () => {
    const game = makeGame();
    game.skipLevels = true;
    startLevel(game, 1);
    expect(game.state).toBe(S.PLAYING);
  });
});

// ── endGame ──────────────────────────────────────────────────────────────────

describe('endGame', () => {
  it('incrémente game.stats.gamesPlayed', () => {
    const game = makeGame();
    const before = game.stats.gamesPlayed;
    endGame(game);
    expect(game.stats.gamesPlayed).toBe(before + 1);
  });

  it('met à jour game.stats.highScore si score > ancien record', () => {
    const game = makeGame();
    game.score = 500;             // > stats.highScore (100 du mock)
    endGame(game);
    expect(game.stats.highScore).toBe(500);
  });

  it('ne met PAS à jour highScore si score ≤ ancien record', () => {
    const game = makeGame();
    game.score = 50;              // < stats.highScore (100 du mock)
    endGame(game);
    expect(game.stats.highScore).toBe(100);
  });

  it('appelle saveStats', () => {
    const game = makeGame();
    endGame(game);
    expect(saveStats).toHaveBeenCalledWith(game.stats);
  });

  it('appelle sendGameEmail avec gameover', () => {
    const game = makeGame();
    endGame(game);
    expect(sendGameEmail).toHaveBeenCalledWith(game, 'gameover');
  });

  it('state → S.GAME_OVER', () => {
    const game = makeGame();
    endGame(game);
    expect(game.state).toBe(S.GAME_OVER);
  });
});
