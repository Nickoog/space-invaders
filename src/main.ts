import { W, H, GEN1_COUNT } from './constants.js';
import { initInput } from './input.js';
import { preloadSprites } from './api/pokeapi.js';
import { renderLoadingScreen } from './screens.js';
import { createGame } from './Game.js';
import { startLoop } from './gameLoop.js';
import { migrateFromLegacy, ensureFlavienProfile } from './profiles.js';
import { showHomeScreen } from './ui/homeScreen.js';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx    = canvas.getContext('2d') as CanvasRenderingContext2D;
canvas.width  = W;
canvas.height = H;

initInput();

// Preload all Gen 1 sprites upfront so every level has sprites available.
const ids = Array.from({ length: GEN1_COUNT }, (_, i) => i + 1);

renderLoadingScreen(ctx, 0, ids.length);

preloadSprites(ids, (loaded, total) => {
  renderLoadingScreen(ctx, loaded, total);
}).then(spriteMap => {
  // Silently migrate old single-profile localStorage data if present.
  migrateFromLegacy();
  // Birthday gift: create Flavien's profile automatically on first launch.
  ensureFlavienProfile();

  const game = createGame(spriteMap);

  // onHome is called from GAME_OVER and on initial load.
  game.onHome = () => showHomeScreen(game);

  startLoop(game, ctx);
  game.onHome();
});
