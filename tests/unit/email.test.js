import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn().mockResolvedValue({ status: 200, text: 'OK' }) },
}));

import { diffLabel, sendGameEmail } from '../../src/email.js';
import { DIFFICULTY_DELTA_MS } from '../../src/constants.js';
import emailjs from '@emailjs/browser';

afterEach(() => {
  vi.clearAllMocks();
});

describe('diffLabel', () => {
  it('offset=0 → Normal', () => {
    expect(diffLabel(0)).toBe('Normal');
  });

  it('offset=+DIFFICULTY_DELTA_MS → +1 (plus facile)', () => {
    expect(diffLabel(DIFFICULTY_DELTA_MS)).toBe('+1 (plus facile)');
  });

  it('offset=-2*DIFFICULTY_DELTA_MS → -2 (plus difficile)', () => {
    expect(diffLabel(-2 * DIFFICULTY_DELTA_MS)).toBe('-2 (plus difficile)');
  });

  it('arrondi correct si offset est un multiple non-exact', () => {
    // +1.5 steps arrondi à 2
    const label = diffLabel(Math.round(1.5) * DIFFICULTY_DELTA_MS);
    expect(label).toBe('+2 (plus facile)');
  });
});

function makeGame(overrides = {}) {
  return {
    emailSent: false,
    score: 100,
    highScore: 80,
    level: 3,
    lives: 2,
    gameStartTime: Date.now() - 120_000,
    stats: { gamesPlayed: 5, difficultyOffset: 0, highScore: 80 },
    ...overrides,
  };
}

describe('sendGameEmail', () => {
  it('ne fait rien si game.emailSent = true', () => {
    const game = makeGame({ emailSent: true });
    sendGameEmail(game, 'gameover');
    expect(emailjs.send).not.toHaveBeenCalled();
  });

  it('ne fait rien si les variables env sont vides', () => {
    vi.stubEnv('VITE_EMAILJS_SERVICE_ID',  '');
    vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', '');
    vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY',  '');
    vi.stubEnv('VITE_NOTIFICATION_EMAIL',  '');
    const game = makeGame();
    sendGameEmail(game, 'gameover');
    expect(emailjs.send).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('set game.emailSent = true après appel (guard double-envoi)', () => {
    // On force les env vars pour tester le path qui envoie
    vi.stubEnv('VITE_EMAILJS_SERVICE_ID',  'svc');
    vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'tpl');
    vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY',  'key');
    vi.stubEnv('VITE_NOTIFICATION_EMAIL',  'test@example.com');

    const game = makeGame();
    sendGameEmail(game, 'gameover');
    expect(game.emailSent).toBe(true);
    vi.unstubAllEnvs();
  });

  it('appelle emailjs.send avec player_name = Flavien', () => {
    vi.stubEnv('VITE_EMAILJS_SERVICE_ID',  'svc');
    vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'tpl');
    vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY',  'key');
    vi.stubEnv('VITE_NOTIFICATION_EMAIL',  'test@example.com');

    const game = makeGame();
    sendGameEmail(game, 'victory');

    expect(emailjs.send).toHaveBeenCalledOnce();
    const params = emailjs.send.mock.calls[0][2];
    expect(params.player_name).toBe('Flavien');
    vi.unstubAllEnvs();
  });
});
