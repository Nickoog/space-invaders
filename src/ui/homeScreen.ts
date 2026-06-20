import type { GameState } from '../types.js';
import type { PlayerProfile } from '../types.js';
import {
  loadProfiles, addProfile, deleteProfile,
  createProfile, validatePseudo, MAX_PROFILES,
} from '../profiles.js';
import { showOnboarding } from './modal.js';
import { startGame } from '../gameLoop.js';
import { DIFFICULTY_DELTA_MS, DIFFICULTY_MAX_STEPS, AMMO_FULL_BAG } from '../constants.js';
import { updateProfile } from '../profiles.js';

// ── Overlay singleton ─────────────────────────────────────────────────────────

let _overlay: HTMLDivElement | null = null;
let _stylesInjected = false;

function injectStyles(): void {
  if (_stylesInjected) return;
  _stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    #home-overlay {
      position: fixed; inset: 0;
      background: #000;
      display: flex; justify-content: center; align-items: center;
      z-index: 900; font-family: monospace;
    }
    .home-box {
      background: #000; border: 3px solid #00ff44;
      padding: 36px 36px 32px; max-width: 700px; width: 94%;
      box-shadow: 0 0 40px rgba(0,255,68,0.18);
      color: #fff; box-sizing: border-box;
    }
    .home-title {
      color: #ff4444; font-size: 30px; font-weight: bold;
      text-align: center; letter-spacing: 5px; margin-bottom: 2px;
    }
    .home-title2 {
      color: #ffff44; font-size: 30px; font-weight: bold;
      text-align: center; letter-spacing: 5px; margin-bottom: 8px;
    }
    .home-subtitle {
      color: #555; font-size: 13px; text-align: center; margin-bottom: 30px;
    }
    /* ── Cards ── */
    .home-cards {
      display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
    }
    .home-card {
      position: relative;
      background: #0a0a0a; border: 2px solid #2a2a2a;
      padding: 20px 18px 18px; width: 168px; min-height: 110px;
      cursor: pointer; box-sizing: border-box;
      transition: border-color 0.12s;
    }
    .home-card:hover { border-color: #00ff44; }
    .home-card-del {
      position: absolute; top: 7px; right: 9px;
      background: none; border: none; color: #333; cursor: pointer;
      font-size: 17px; font-family: monospace; padding: 0; line-height: 1;
      transition: color 0.12s;
    }
    .home-card:hover .home-card-del { color: #ff4444; }
    .home-card-pseudo {
      color: #ffff44; font-size: 15px; font-weight: bold;
      margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      padding-right: 16px;
    }
    .home-card-stat { color: #888; font-size: 12px; margin-bottom: 5px; }
    /* New-player card */
    .home-card-new {
      background: #0a0a0a; border: 2px dashed #333;
      padding: 20px 18px; width: 168px; min-height: 110px;
      cursor: pointer; box-sizing: border-box;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px;
      color: #444; font-size: 13px;
      transition: border-color 0.12s, color 0.12s;
    }
    .home-card-new:hover { border-color: #ffff44; color: #ffff44; }
    .home-card-new-icon { font-size: 30px; }
    /* Delete confirm (replaces a card in-place) */
    .home-del-confirm {
      background: #0a0a0a; border: 2px solid #ff4444;
      padding: 18px 16px; width: 168px; min-height: 110px;
      box-sizing: border-box;
    }
    .home-del-label  { color: #ff4444; font-size: 12px; margin-bottom: 6px; }
    .home-del-pseudo { color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 14px;
                       overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .home-del-btns   { display: flex; gap: 8px; }
    .home-del-btn {
      flex: 1; padding: 8px 4px; border: 2px solid; background: #000;
      font-family: monospace; font-size: 12px; cursor: pointer;
    }
    .home-del-btn.yes { border-color: #ff4444; color: #ff4444; }
    .home-del-btn.yes:hover { background: #ff4444; color: #000; }
    .home-del-btn.no  { border-color: #333; color: #555; }
    .home-del-btn.no:hover  { background: #222; color: #fff; }
    /* Confirm / form box */
    .home-confirm-pseudo {
      color: #ffff44; font-size: 22px; font-weight: bold; margin-bottom: 22px;
    }
    .home-stat-row   { display: flex; justify-content: space-between; align-items: baseline;
                       margin-bottom: 12px; font-size: 14px; }
    .home-stat-label { color: #555; }
    .home-stat-val   { color: #ccc; text-align: right; max-width: 58%; }
    .home-stat-val.easy { color: #00ff44; }
    .home-stat-val.hard { color: #ff4444; }
    .home-actions    { display: flex; gap: 12px; margin-top: 26px; }
    .home-btn {
      flex: 1; padding: 13px; border: 2px solid #00ff44; background: #000;
      color: #00ff44; font-family: monospace; font-size: 15px; font-weight: bold;
      cursor: pointer; transition: background 0.12s, color 0.12s;
    }
    .home-btn:hover { background: #00ff44; color: #000; }
    .home-btn.sec   { border-color: #333; color: #555; }
    .home-btn.sec:hover { background: #222; color: #fff; border-color: #555; }
    /* Pseudo form */
    .home-input {
      width: 100%; padding: 14px; background: #111; border: 2px solid #444;
      color: #ffff44; font-family: monospace; font-size: 18px; letter-spacing: 2px;
      box-sizing: border-box; outline: none; margin-bottom: 8px;
    }
    .home-input:focus { border-color: #ffff44; }
    .home-hint  { font-size: 12px; color: #444; margin-bottom: 4px; }
    .home-error { font-size: 13px; color: #ff4444; min-height: 20px; margin-bottom: 10px; }
    /* Skip-questions toggle */
    .home-skip-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 20px; padding: 12px 0; border-top: 1px solid #1a1a1a;
    }
    .home-skip-label { color: #555; font-size: 13px; }
    .home-skip-btn {
      padding: 7px 16px; border: 2px solid #333; background: #000;
      font-family: monospace; font-size: 12px; cursor: pointer;
      color: #555; transition: all 0.12s;
    }
    .home-skip-btn.on  { border-color: #ffff44; color: #ffff44; }
    .home-skip-btn:hover { background: #111; }
    /* Settings page */
    .home-settings-section { margin-bottom: 28px; }
    .home-settings-lbl {
      color: #555; font-size: 11px; letter-spacing: 2px;
      margin-bottom: 12px; display: block;
    }
    .home-settings-ctrl { display: flex; align-items: center; gap: 16px; }
    .home-settings-val  { flex: 1; text-align: center; }
    .home-settings-name { color: #fff; font-size: 16px; font-weight: bold; }
    .home-settings-sub  { color: #555; font-size: 11px; margin-top: 5px; }
    .home-stepper {
      padding: 8px 14px; border: 2px solid #333; background: #000;
      color: #aaa; font-family: monospace; font-size: 18px; cursor: pointer;
      transition: border-color 0.12s, color 0.12s;
    }
    .home-stepper:hover:not(:disabled) { border-color: #00ff44; color: #00ff44; }
    .home-stepper:disabled { opacity: 0.2; cursor: default; }
  `;
  document.head.appendChild(style);
}

function removeHomeOverlay(): void {
  _overlay?.remove();
  _overlay = null;
}

function getOverlay(): HTMLDivElement {
  if (_overlay) { _overlay.innerHTML = ''; return _overlay; }
  const div = document.createElement('div');
  div.id = 'home-overlay';
  document.body.appendChild(div);
  _overlay = div;
  return div;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function diffLabel(offset: number): { text: string; cls: string } {
  const steps = Math.round(offset / DIFFICULTY_DELTA_MS);
  if (steps > 0) return { text: `+${steps} cran${steps > 1 ? 's' : ''} (plus facile)`, cls: 'easy' };
  if (steps < 0) return { text: `${steps} cran${Math.abs(steps) > 1 ? 's' : ''} (plus difficile)`, cls: 'hard' };
  return { text: 'normal', cls: '' };
}

// ── Public entry point ────────────────────────────────────────────────────────

export function showHomeScreen(game: GameState): void {
  injectStyles();
  renderSelection(game);
}

// ── View : profile selection ──────────────────────────────────────────────────

function renderSelection(game: GameState): void {
  const overlay  = getOverlay();
  const profiles = loadProfiles();

  const cardsHtml = profiles.map(p => `
    <div class="home-card" data-id="${esc(p.id)}">
      <button class="home-card-del" data-del="${esc(p.id)}" title="Supprimer">×</button>
      <div class="home-card-pseudo">${esc(p.pseudo)}</div>
      <div class="home-card-stat">🏆 ${p.highScore} pts</div>
      <div class="home-card-stat">🎮 ${p.gamesPlayed} partie${p.gamesPlayed !== 1 ? 's' : ''}</div>
    </div>
  `).join('');

  const newCardHtml = profiles.length < MAX_PROFILES
    ? `<div class="home-card-new" id="home-new">
         <span class="home-card-new-icon">+</span>
         <span>Nouveau joueur</span>
       </div>`
    : '';

  overlay.innerHTML = `
    <div class="home-box">
      <div class="home-title">POKEMON</div>
      <div class="home-title2">INVADERS</div>
      <div class="home-subtitle">Choisis ton dresseur</div>
      <div class="home-cards" id="home-cards">
        ${cardsHtml}
        ${newCardHtml}
      </div>
    </div>
  `;

  // Click on a profile card (not delete button)
  overlay.querySelectorAll<HTMLDivElement>('.home-card').forEach(card => {
    card.addEventListener('click', e => {
      if ((e.target as HTMLElement).closest('.home-card-del')) return;
      const id = card.dataset['id']!;
      const profile = profiles.find(p => p.id === id);
      if (profile) renderConfirm(game, profile);
    });
  });

  // Delete button — show inline confirmation within the card
  overlay.querySelectorAll<HTMLButtonElement>('.home-card-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset['del']!;
      const profile = profiles.find(p => p.id === id);
      const cardEl = btn.closest<HTMLDivElement>('.home-card');
      if (profile && cardEl) renderDeleteConfirm(game, profile, cardEl);
    });
  });

  // New player
  overlay.querySelector('#home-new')?.addEventListener('click', () => {
    renderNewPlayerForm(game);
  });
}

// ── View : player confirm ─────────────────────────────────────────────────────

function renderConfirm(game: GameState, profile: PlayerProfile): void {
  const overlay = getOverlay();
  const diff    = diffLabel(profile.difficultyOffset);
  const interests = profile.interests.length > 0 ? profile.interests.join(', ') : '—';

  const skipCls   = game.skipLevels ? 'on' : '';
  const skipLabel = game.skipLevels ? '✅ ACTIVÉ' : '☐ DÉSACTIVÉ';

  overlay.innerHTML = `
    <div class="home-box">
      <div class="home-confirm-pseudo">${esc(profile.pseudo)}</div>
      <div class="home-stat-row">
        <span class="home-stat-label">Meilleur score</span>
        <span class="home-stat-val">${profile.highScore} pts</span>
      </div>
      <div class="home-stat-row">
        <span class="home-stat-label">Parties jouées</span>
        <span class="home-stat-val">${profile.gamesPlayed}</span>
      </div>
      <div class="home-stat-row">
        <span class="home-stat-label">Difficulté</span>
        <span class="home-stat-val ${diff.cls}">${diff.text}</span>
      </div>
      <div class="home-stat-row">
        <span class="home-stat-label">Intérêts</span>
        <span class="home-stat-val">${esc(interests)}</span>
      </div>
      <div class="home-skip-row">
        <span class="home-skip-label">Passer les niveaux (touche N)</span>
        <button class="home-skip-btn ${skipCls}" id="home-skip">${skipLabel}</button>
      </div>
      <div style="text-align:right; margin-top:10px;">
        <button class="home-btn sec" id="home-settings"
                style="flex:none; padding:8px 18px; font-size:13px;">
          ⚙ Paramètres
        </button>
      </div>
      <div class="home-actions">
        <button class="home-btn sec" id="home-back">← Retour</button>
        <button class="home-btn" id="home-play">JOUER →</button>
      </div>
    </div>
  `;

  overlay.querySelector('#home-skip')?.addEventListener('click', () => {
    game.skipLevels = !game.skipLevels;
    renderConfirm(game, profile);
  });

  overlay.querySelector('#home-settings')?.addEventListener('click', () => {
    renderSettings(game, profile);
  });

  overlay.querySelector('#home-back')?.addEventListener('click', () => {
    renderSelection(game);
  });

  overlay.querySelector('#home-play')?.addEventListener('click', () => {
    game.activeProfile = profile;
    removeHomeOverlay();
    startGame(game);
  });
}

// ── View : settings ──────────────────────────────────────────────────────────

function renderSettings(game: GameState, profile: PlayerProfile): void {
  const overlay = getOverlay();

  let steps     = Math.round(profile.difficultyOffset / DIFFICULTY_DELTA_MS);
  let nQuestions = profile.preQuizCorrect;

  function diffText(s: number): string {
    const r = diffLabel(s * DIFFICULTY_DELTA_MS);
    return r.text;
  }

  function render(): void {
    overlay.innerHTML = `
      <div class="home-box">
        <div class="home-title2" style="font-size:20px;margin-bottom:24px;">⚙ PARAMÈTRES</div>

        <div class="home-settings-section">
          <span class="home-settings-lbl">DIFFICULTÉ DE DÉPART</span>
          <div class="home-settings-ctrl">
            <button class="home-stepper" id="diff-dec"
                    ${steps <= -DIFFICULTY_MAX_STEPS ? 'disabled' : ''}>◄</button>
            <div class="home-settings-val">
              <div class="home-settings-name">${diffText(steps)}</div>
              <div class="home-settings-sub">cran ${steps > 0 ? '+' : ''}${steps} / +4 max</div>
            </div>
            <button class="home-stepper" id="diff-inc"
                    ${steps >= DIFFICULTY_MAX_STEPS ? 'disabled' : ''}>►</button>
          </div>
        </div>

        <div class="home-settings-section">
          <span class="home-settings-lbl">QUESTIONS AVANT LE NIVEAU</span>
          <div class="home-settings-ctrl">
            <button class="home-stepper" id="quiz-dec"
                    ${nQuestions <= 1 ? 'disabled' : ''}>◄</button>
            <div class="home-settings-val">
              <div class="home-settings-name">${nQuestions} bonne${nQuestions > 1 ? 's' : ''} réponse${nQuestions > 1 ? 's' : ''}</div>
              <div class="home-settings-sub">+${Math.ceil(AMMO_FULL_BAG / nQuestions)} pokéball${Math.ceil(AMMO_FULL_BAG / nQuestions) > 1 ? 's' : ''} par réponse</div>
            </div>
            <button class="home-stepper" id="quiz-inc"
                    ${nQuestions >= 10 ? 'disabled' : ''}>►</button>
          </div>
        </div>

        <div class="home-actions">
          <button class="home-btn sec" id="settings-cancel">← Annuler</button>
          <button class="home-btn" id="settings-save">✅ SAUVEGARDER</button>
        </div>
      </div>
    `;

    overlay.querySelector('#diff-dec')?.addEventListener('click', () => {
      steps--;
      render();
    });
    overlay.querySelector('#diff-inc')?.addEventListener('click', () => {
      steps++;
      render();
    });
    overlay.querySelector('#quiz-dec')?.addEventListener('click', () => {
      nQuestions--;
      render();
    });
    overlay.querySelector('#quiz-inc')?.addEventListener('click', () => {
      nQuestions++;
      render();
    });
    overlay.querySelector('#settings-cancel')?.addEventListener('click', () => {
      renderConfirm(game, profile);
    });
    overlay.querySelector('#settings-save')?.addEventListener('click', () => {
      profile.difficultyOffset = steps * DIFFICULTY_DELTA_MS;
      profile.preQuizCorrect   = nQuestions;
      updateProfile(profile);
      renderConfirm(game, profile);
    });
  }

  render();
}

// ── View : new player form ────────────────────────────────────────────────────

function renderNewPlayerForm(game: GameState): void {
  const overlay  = getOverlay();
  const profiles = loadProfiles();

  overlay.innerHTML = `
    <div class="home-box">
      <div class="home-title2">NOUVEAU DRESSEUR</div>
      <div class="home-subtitle">Crée ton profil</div>
      <label style="color:#666;font-size:13px;display:block;margin-bottom:8px">
        Choisis ton pseudo :
      </label>
      <input class="home-input" id="home-pseudo" type="text" maxlength="12"
             placeholder="ex: Sacha" autocomplete="off" spellcheck="false" />
      <div class="home-hint">2 à 12 caractères — lettres, chiffres, _ et -</div>
      <div class="home-error" id="home-pseudo-err"></div>
      <div class="home-actions">
        <button class="home-btn sec" id="home-back">← Retour</button>
        <button class="home-btn" id="home-next" disabled>Suivant →</button>
      </div>
    </div>
  `;

  const input   = overlay.querySelector<HTMLInputElement>('#home-pseudo')!;
  const errEl   = overlay.querySelector<HTMLDivElement>('#home-pseudo-err')!;
  const nextBtn = overlay.querySelector<HTMLButtonElement>('#home-next')!;

  function validate(): void {
    const err = validatePseudo(input.value, profiles);
    errEl.textContent  = err ?? '';
    nextBtn.disabled   = err !== null;
  }

  input.addEventListener('input', validate);
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !nextBtn.disabled) nextBtn.click();
  });

  overlay.querySelector('#home-back')?.addEventListener('click', () => {
    renderSelection(game);
  });

  nextBtn.addEventListener('click', () => {
    const pseudo = input.value.trim();
    const err = validatePseudo(pseudo, profiles);
    if (err) { errEl.textContent = err; return; }

    // Onboarding modal appears on top (z-index 1000 > 900) while home overlay stays behind
    showOnboarding((interests, age) => {
      const profile = createProfile(pseudo, interests, age);
      addProfile(profile);
      game.activeProfile = profile;
      removeHomeOverlay();
      startGame(game);
    });
  });

  setTimeout(() => input.focus(), 60);
}

// ── View : delete confirmation (inline inside the card) ───────────────────────

function renderDeleteConfirm(
  game: GameState,
  profile: PlayerProfile,
  cardEl: HTMLDivElement,
): void {
  cardEl.className  = 'home-del-confirm';
  cardEl.dataset['id'] = ''; // prevent accidental re-selection
  cardEl.innerHTML  = `
    <div class="home-del-label">Supprimer ?</div>
    <div class="home-del-pseudo">${esc(profile.pseudo)}</div>
    <div class="home-del-btns">
      <button class="home-del-btn no"  id="del-no">Non</button>
      <button class="home-del-btn yes" id="del-yes">Oui</button>
    </div>
  `;

  cardEl.querySelector('#del-no')?.addEventListener('click', () => {
    renderSelection(game);
  });

  cardEl.querySelector('#del-yes')?.addEventListener('click', () => {
    deleteProfile(profile.id);
    renderSelection(game);
  });
}
