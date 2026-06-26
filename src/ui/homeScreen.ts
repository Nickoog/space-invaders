import { DIFFICULTY_DELTA_MS, DIFFICULTY_MAX_STEPS, AMMO_FULL_BAG } from '../constants.js';
import { saveStats } from '../flavienProfile.js';
import { diffLabel } from '../email.js';
import type { GameState } from '../types.js';

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    #home-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.96);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
    }
    .home-box {
      background: #0a0a0a; border: 3px solid #00ff44;
      padding: 36px 40px; max-width: 500px; width: 90%;
      box-shadow: 0 0 40px rgba(0,255,68,0.2);
      color: #fff; box-sizing: border-box;
      font-family: 'Press Start 2P', monospace;
    }
    .home-title {
      color: #ff4444; font-size: 16px; text-align: center;
      margin-bottom: 6px; letter-spacing: 2px;
    }
    .home-sub {
      color: #00ff44; font-size: 11px; text-align: center; margin-bottom: 28px;
    }
    .home-stat {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid #1a1a1a; font-size: 10px;
    }
    .home-stat span:first-child { color: #888; }
    .home-stat span:last-child  { color: #ffffff; }
    .home-actions { display: flex; gap: 12px; margin-top: 24px; }
    .home-btn {
      flex: 1; padding: 13px 8px; background: #111;
      border: 2px solid #2a2a2a; color: #aaa; cursor: pointer;
      font-family: 'Press Start 2P', monospace; font-size: 10px;
      text-align: center; transition: border-color 0.12s, color 0.12s;
    }
    .home-btn:hover    { border-color: #00ff44; color: #fff; }
    .home-btn.primary  { border-color: #00ff44; color: #00ff44; }
    .home-btn.primary:hover { background: #001800; }
    .home-setting-block { margin-top: 24px; }
    .home-setting-row   { margin-bottom: 22px; }
    .home-setting-label { font-size: 9px; color: #666; margin-bottom: 10px; }
    .home-stepper       { display: flex; align-items: center; gap: 10px; }
    .home-stepper-btn   {
      width: 34px; height: 34px; background: #111; border: 2px solid #333;
      color: #ccc; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.1s; flex-shrink: 0;
    }
    .home-stepper-btn:hover { border-color: #00ff44; color: #fff; }
    .home-stepper-val   { flex: 1; text-align: center; font-size: 10px; color: #fff; line-height: 1.5; }
    .home-stepper-hint  { font-size: 8px; color: #555; margin-top: 6px; text-align: center; }
  `;
  document.head.appendChild(style);
}

export function removeHomeScreen(): void {
  document.getElementById('home-overlay')?.remove();
}

export function showHomeScreen(game: GameState, onPlay: (g: GameState) => void): void {
  injectStyles();
  removeHomeScreen();

  const overlay = document.createElement('div');
  overlay.id = 'home-overlay';
  document.body.appendChild(overlay);

  renderMain();

  function renderMain(): void {
    const { highScore, gamesPlayed, difficultyOffset, preQuizCorrect } = game.stats;

    overlay.innerHTML = `
      <div class="home-box">
        <div class="home-title">POKÉMON INVADERS</div>
        <div class="home-sub">BIENVENUE, FLAVIEN !</div>
        <div id="home-stats"></div>
        <div class="home-actions">
          <button class="home-btn" id="home-settings-btn">⚙ Paramètres</button>
          <button class="home-btn primary" id="home-play-btn">▶ JOUER</button>
        </div>
      </div>
    `;

    // Stats via textContent (XSS-safe)
    const statsContainer = overlay.querySelector<HTMLElement>('#home-stats')!;
    const rows: [string, string][] = [
      ['🏆 Meilleur score',   String(highScore).padStart(4, '0')],
      ['🎮 Parties jouées',   String(gamesPlayed)],
      ['⚡ Difficulté',       diffLabel(difficultyOffset)],
      ['❓ Questions / niveau', String(preQuizCorrect)],
    ];
    for (const [label, value] of rows) {
      const row = document.createElement('div');
      row.className = 'home-stat';
      const l = document.createElement('span'); l.textContent = label;
      const v = document.createElement('span'); v.textContent = value;
      row.appendChild(l);
      row.appendChild(v);
      statsContainer.appendChild(row);
    }

    overlay.querySelector('#home-settings-btn')!.addEventListener('click', renderSettings);
    overlay.querySelector('#home-play-btn')!.addEventListener('click', () => {
      removeHomeScreen();
      onPlay(game);
    });
  }

  function renderSettings(): void {
    let tempOffset = game.stats.difficultyOffset;
    let tempQuiz   = game.stats.preQuizCorrect;

    const ammoPerAnswer = (q: number) => Math.ceil(AMMO_FULL_BAG / Math.max(1, q));

    overlay.innerHTML = `
      <div class="home-box">
        <div class="home-title">⚙ PARAMÈTRES</div>
        <div class="home-setting-block">
          <div class="home-setting-row">
            <div class="home-setting-label">DIFFICULTÉ</div>
            <div class="home-stepper">
              <button class="home-stepper-btn" id="diff-down">◄</button>
              <div class="home-stepper-val" id="diff-val"></div>
              <button class="home-stepper-btn" id="diff-up">►</button>
            </div>
          </div>
          <div class="home-setting-row">
            <div class="home-setting-label">QUESTIONS PAR NIVEAU</div>
            <div class="home-stepper">
              <button class="home-stepper-btn" id="quiz-down">◄</button>
              <div class="home-stepper-val" id="quiz-val"></div>
              <button class="home-stepper-btn" id="quiz-up">►</button>
            </div>
            <div class="home-stepper-hint" id="quiz-hint"></div>
          </div>
        </div>
        <div class="home-actions">
          <button class="home-btn" id="settings-cancel">← Annuler</button>
          <button class="home-btn primary" id="settings-save">✅ Sauvegarder</button>
        </div>
      </div>
    `;

    function refresh(): void {
      overlay.querySelector<HTMLElement>('#diff-val')!.textContent = diffLabel(tempOffset);
      const n = ammoPerAnswer(tempQuiz);
      overlay.querySelector<HTMLElement>('#quiz-val')!.textContent  = String(tempQuiz);
      overlay.querySelector<HTMLElement>('#quiz-hint')!.textContent =
        `= ${n} pokéball${n > 1 ? 's' : ''} par bonne réponse`;
    }
    refresh();

    overlay.querySelector('#diff-down')!.addEventListener('click', () => {
      if (tempOffset > -DIFFICULTY_MAX_STEPS * DIFFICULTY_DELTA_MS) { tempOffset -= DIFFICULTY_DELTA_MS; refresh(); }
    });
    overlay.querySelector('#diff-up')!.addEventListener('click', () => {
      if (tempOffset < DIFFICULTY_MAX_STEPS * DIFFICULTY_DELTA_MS) { tempOffset += DIFFICULTY_DELTA_MS; refresh(); }
    });
    overlay.querySelector('#quiz-down')!.addEventListener('click', () => {
      if (tempQuiz > 1) { tempQuiz--; refresh(); }
    });
    overlay.querySelector('#quiz-up')!.addEventListener('click', () => {
      if (tempQuiz < 10) { tempQuiz++; refresh(); }
    });
    overlay.querySelector('#settings-cancel')!.addEventListener('click', renderMain);
    overlay.querySelector('#settings-save')!.addEventListener('click', () => {
      game.stats.difficultyOffset = tempOffset;
      game.stats.preQuizCorrect   = tempQuiz;
      saveStats(game.stats);
      renderMain();
    });
  }
}
