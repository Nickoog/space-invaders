import emailjs from '@emailjs/browser';
import { DIFFICULTY_DELTA_MS } from './constants.js';
import type { GameState } from './types.js';

export function diffLabel(offset: number): string {
  const steps = Math.round(offset / DIFFICULTY_DELTA_MS);
  if (steps === 0) return 'Normal';
  return steps > 0 ? `+${steps} (plus facile)` : `${steps} (plus difficile)`;
}

export function sendGameEmail(game: GameState, type: 'victory' | 'gameover'): void {
  if (game.emailSent) return;

  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined;
  const toEmail    = import.meta.env.VITE_NOTIFICATION_EMAIL  as string | undefined;
  if (!serviceId || !templateId || !publicKey || !toEmail) return;

  game.emailSent = true;

  const durationMs = Date.now() - game.gameStartTime;
  const minutes    = Math.floor(durationMs / 60_000);
  const seconds    = Math.floor((durationMs % 60_000) / 1000);
  const isRecord   = game.score > 0 && game.score >= game.highScore;

  const params = {
    to_email:     toEmail,
    event:        type === 'victory' ? 'a GAGNÉ ! 🏆' : `bloqué niveau ${game.level}`,
    event_title:  type === 'victory'
      ? '🏆 Flavien a terminé le jeu !'
      : `💀 Game Over — Niveau ${game.level}`,
    player_name:  'Flavien',
    score:        String(game.score),
    level:        String(game.level),
    lives:        String(game.lives),
    duration:     `${minutes}m ${seconds}s`,
    games_played: String(game.stats.gamesPlayed),
    new_record:   isRecord ? 'OUI ✓' : 'non',
    difficulty:   diffLabel(game.stats.difficultyOffset),
  };

  emailjs.send(serviceId, templateId, params, { publicKey }).catch((err: unknown) => {
    console.error('[EmailJS] échec envoi :', err);
  });
}
