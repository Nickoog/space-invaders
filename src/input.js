export const keys = {};

const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Space', 'Enter']);

export function initInput() {
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
  });
}

// Consume a key press (returns true once, then false until key is released and re-pressed).
// Prevents held-Enter from instantly cycling through states.
export function consumeKey(code) {
  const v = keys[code];
  keys[code] = false;
  return v;
}
