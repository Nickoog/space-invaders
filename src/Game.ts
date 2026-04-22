import { S } from './constants.js';
import type { GameState } from './types.js';

const LS_KEY = 'pokemon_invaders_hi';

// Returns the initial game state. spriteMap is a Map<pokemonId, HTMLImageElement|null>.
export function createGame(spriteMap: Map<number, HTMLImageElement | null>): GameState {
  const saved = parseInt(localStorage.getItem(LS_KEY) ?? '', 10);
  return {
    state:         S.MENU,
    spriteMap,
    score:         0,
    highScore:     isNaN(saved) ? 0 : saved,
    lives:         3,
    level:         1,
    gameOverDelay: 0,
    player:        null,
    grid:          null,
    bullets:       null,
    shields:       null,
  };
}
