import type { QuestionData } from '../types.js';
import { QUESTION_ANSWER_SEC } from '../constants.js';

export interface QuestionModalOptions {
  timerSec?: number;
  title?: string;
  subtitle?: string;
  resultCorrect?: string;
  resultWrong?: string;
}
import { ONBOARDING_QUESTIONS } from '../ai/onboarding.js';

// ── Shared styles (injected once) ────────────────────────────────────────────

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    #ai-modal {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.88);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000; font-family: monospace;
    }
    .ai-box {
      background: #0a0a0a; border: 3px solid #00ff44;
      padding: 32px; max-width: 580px; width: 90%;
      box-shadow: 0 0 40px rgba(0,255,68,0.25);
      color: #fff; box-sizing: border-box;
    }
    .ai-title {
      color: #ff4444; font-size: 20px; font-weight: bold;
      text-align: center; margin-bottom: 6px; letter-spacing: 2px;
    }
    .ai-subtitle {
      color: #666; font-size: 12px; text-align: center; margin-bottom: 18px;
    }
    .ai-question {
      color: #00ff44; font-size: 16px; margin-bottom: 20px; line-height: 1.65;
    }
    .ai-timer-bar {
      height: 5px; background: #00ff44; margin-bottom: 18px;
      border-radius: 2px; transition: width 1s linear, background 1s;
    }
    .ai-choice {
      display: block; width: 100%; padding: 11px 14px; margin: 7px 0;
      background: #111; border: 2px solid #2a2a2a; color: #ccc;
      cursor: pointer; font-family: monospace; font-size: 14px;
      text-align: left; box-sizing: border-box;
      transition: border-color 0.12s, color 0.12s;
    }
    .ai-choice:hover:not(:disabled) { border-color: #00ff44; color: #fff; }
    .ai-choice:disabled { cursor: default; }
    .ai-choice.correct { border-color: #00ff44 !important; background: #0a1f0a; color: #00ff44 !important; }
    .ai-choice.wrong   { border-color: #ff4444 !important; background: #1f0a0a; color: #ff4444 !important; }
    .ai-result {
      text-align: center; font-size: 18px; padding: 14px 0; min-height: 52px;
    }
    .ai-result.correct { color: #00ff44; }
    .ai-result.wrong   { color: #ff4444; }
    /* Onboarding */
    .ai-ob-title {
      color: #ffff44; font-size: 18px; font-weight: bold;
      text-align: center; margin-bottom: 6px;
    }
    .ai-ob-welcome {
      color: #888; font-size: 12px; text-align: center; margin-bottom: 20px;
    }
    .ai-ob-progress { color: #555; font-size: 12px; text-align: right; margin-bottom: 14px; }
    .ai-ob-question { color: #fff; font-size: 16px; margin-bottom: 18px; line-height: 1.5; }
    .ai-ob-opt {
      display: block; width: 100%; padding: 11px 14px; margin: 7px 0;
      background: #111; border: 2px solid #2a2a2a; color: #ccc;
      cursor: pointer; font-family: monospace; font-size: 14px;
      text-align: left; box-sizing: border-box;
      transition: border-color 0.12s, color 0.12s;
    }
    .ai-ob-opt:hover { border-color: #ffff44; color: #fff; }
    .ai-ob-opt.selected { border-color: #ffff44; color: #ffff44; background: #1a1a00; }
    .ai-ob-next {
      display: block; width: 100%; padding: 13px; margin-top: 16px;
      background: #ffff44; border: none; color: #000;
      font-family: monospace; font-size: 15px; font-weight: bold; cursor: pointer;
    }
    .ai-ob-next:hover:not(:disabled) { background: #cccc00; }
    .ai-ob-next:disabled { background: #333; color: #666; cursor: not-allowed; }
    .ai-ob-age-input {
      width: 100%; padding: 14px; background: #111; border: 2px solid #444;
      color: #ffff44; font-family: monospace; font-size: 22px; font-weight: bold;
      box-sizing: border-box; outline: none; text-align: center; letter-spacing: 4px;
    }
    .ai-ob-age-input:focus { border-color: #ffff44; }
    .ai-ob-age-input::-webkit-inner-spin-button,
    .ai-ob-age-input::-webkit-outer-spin-button { opacity: 1; }
  `;
  document.head.appendChild(style);
}

function removeModal(): void {
  document.getElementById('ai-modal')?.remove();
}

// ── Onboarding modal ─────────────────────────────────────────────────────────

// Collects age + interests from the player without persisting anything.
// The caller receives (interests, age) and decides where to save.
export function showOnboarding(onComplete: (interests: string[], age: number | null) => void): void {
  injectStyles();

  const overlay = document.createElement('div');
  overlay.id = 'ai-modal';
  document.body.appendChild(overlay);

  let collectedAge: number | null = null;

  // ── Step 0 : age ─────────────────────────────────────────────────────────

  function renderAgeStep(): void {
    overlay.innerHTML = `
      <div class="ai-box">
        <div class="ai-ob-title">⚡ POKEMON INVADERS ⚡</div>
        <div class="ai-ob-welcome">Réponds à quelques questions pour personnaliser tes défis.</div>
        <div class="ai-ob-question" style="margin-top:10px">🎂 Quel âge as-tu ?</div>
        <input class="ai-ob-age-input" id="ob-age" type="number" min="5" max="120"
               placeholder="…" autocomplete="off" />
        <button class="ai-ob-next" id="ob-age-next" disabled style="margin-top:14px">Suivant →</button>
      </div>
    `;

    const input = overlay.querySelector<HTMLInputElement>('#ob-age')!;
    const nextBtn = overlay.querySelector<HTMLButtonElement>('#ob-age-next')!;

    function validate(): void {
      const v = parseInt(input.value, 10);
      nextBtn.disabled = !(Number.isFinite(v) && v >= 5 && v <= 120);
    }

    input.addEventListener('input', validate);
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !nextBtn.disabled) nextBtn.click();
    });

    nextBtn.addEventListener('click', () => {
      const age = parseInt(input.value, 10);
      if (!Number.isFinite(age)) return;
      collectedAge = age;
      renderInterestStep();
    });

    setTimeout(() => input.focus(), 60);
  }

  // ── Steps 1-4 : interests ────────────────────────────────────────────────

  const collected: string[] = [];
  let step = 0;

  function renderInterestStep(): void {
    const q = ONBOARDING_QUESTIONS[step]!;
    const total = ONBOARDING_QUESTIONS.length;

    overlay.innerHTML = `
      <div class="ai-box">
        <div class="ai-ob-title">⚡ POKEMON INVADERS ⚡</div>
        <div class="ai-ob-welcome">Encore ${total - step} question${total - step > 1 ? 's' : ''} pour personnaliser tes défis.</div>
        <div class="ai-ob-progress">${step + 1} / ${total}</div>
        <div class="ai-ob-question">${q.text}</div>
        <div id="ob-opts"></div>
        <button class="ai-ob-next" id="ob-next" disabled>Suivant →</button>
      </div>
    `;

    const optContainer = overlay.querySelector('#ob-opts')!;
    let selected: string | null = null;
    const nextBtn = overlay.querySelector('#ob-next') as HTMLButtonElement;

    for (const opt of q.options) {
      const btn = document.createElement('button');
      btn.className = 'ai-ob-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        optContainer.querySelectorAll<HTMLButtonElement>('.ai-ob-opt').forEach(b => {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        selected = opt;
        nextBtn.disabled = false;
      });
      optContainer.appendChild(btn);
    }

    nextBtn.addEventListener('click', () => {
      if (!selected) return;
      collected.push(`${q.label} : ${selected}`);
      step++;
      if (step >= total) {
        removeModal();
        onComplete(collected, collectedAge);
      } else {
        renderInterestStep();
      }
    });
  }

  renderAgeStep();
}

// ── Question modal (in-game) ─────────────────────────────────────────────────

export function showQuestionModal(
  question: QuestionData,
  onResult: (correct: boolean) => void,
  options: QuestionModalOptions = {},
): void {
  const {
    timerSec     = QUESTION_ANSWER_SEC,
    title        = '⚡ TOUCHÉ ! 😏',
    subtitle     = 'Bonne réponse = vie sauvée · Mauvaise = vie perdue',
    resultCorrect = '✅ BONNE RÉPONSE ! Ennemis ralentis.',
    resultWrong   = '❌ MAUVAISE RÉPONSE ! Ennemis accélérés.',
  } = options;

  injectStyles();

  const overlay = document.createElement('div');
  overlay.id = 'ai-modal';
  document.body.appendChild(overlay);

  let answered = false;
  let secondsLeft = timerSec;
  let timerHandle: ReturnType<typeof setInterval>;

  function resolve(correct: boolean): void {
    if (answered) return;
    answered = true;
    clearInterval(timerHandle);

    const resultEl = overlay.querySelector<HTMLElement>('.ai-result');
    if (resultEl) {
      resultEl.textContent = correct ? resultCorrect : resultWrong;
      resultEl.className = `ai-result ${correct ? 'correct' : 'wrong'}`;
    }

    setTimeout(() => {
      removeModal();
      onResult(correct);
    }, 1400);
  }

  const answersHtml = question.choices.map((c, i) =>
    `<button class="ai-choice" data-idx="${i}">${String.fromCharCode(65 + i)}. ${c}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="ai-box">
      <div class="ai-title">${title}</div>
      <div class="ai-subtitle">${subtitle}</div>
      <div class="ai-timer-bar" id="q-timer-bar"></div>
      <div class="ai-question">${question.question}</div>
      <div id="q-answers">${answersHtml}</div>
      <div class="ai-result"></div>
    </div>
  `;

  // Countdown bar
  const bar = overlay.querySelector<HTMLElement>('#q-timer-bar')!;
  bar.style.width = '100%';

  timerHandle = setInterval(() => {
    secondsLeft--;
    const pct = Math.max(0, (secondsLeft / timerSec) * 100);
    bar.style.width = `${pct}%`;
    if (pct < 30) bar.style.background = '#ff4444';
    else if (pct < 60) bar.style.background = '#ffaa00';
    if (secondsLeft <= 0) resolve(false);
  }, 1000);

  // Wire answers
  overlay.querySelectorAll<HTMLButtonElement>('.ai-choice').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll<HTMLButtonElement>('.ai-choice').forEach(b => {
        b.disabled = true;
      });

      const chosen = question.choices[i]!;
      const correct =
        chosen.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();

      btn.classList.add(correct ? 'correct' : 'wrong');

      if (!correct) {
        overlay.querySelectorAll<HTMLButtonElement>('.ai-choice').forEach((b, j) => {
          if (
            question.choices[j]!.toLowerCase().trim() ===
            question.correct_answer.toLowerCase().trim()
          ) {
            b.classList.add('correct');
          }
        });
      }

      resolve(correct);
    });
  });
}
