import { S } from './constants.js';
import type { GameState } from './types.js';

// Returns the initial game state. spriteMap is a Map<pokemonId, HTMLImageElement|null>.
// highScore and difficultyOffset are restored from the active profile when a game starts.
export function createGame(spriteMap: Map<number, HTMLImageElement | null>): GameState {
  return {
    state:            S.HOME,
    spriteMap,
    score:            0,
    highScore:        0,
    lives:            3,
    level:            1,
    gameOverDelay:    0,
    levelUpTimer:     0,
    nextLevel:        1,
    player:           null,
    grid:             null,
    bullets:          null,
    questionPool:      [],
    lastQuestionType:  null,
    difficultyOffset:  0,
    bonusMessage:      '',
    bonusMessageTimer: 0,
    activeProfile:    null,
    onHome:           null,
    hardMode:                  false,
    questionsInRound:          1,
    questionsAnsweredInRound:  0,
    victoryDelay:              0,
    interludeMessage:          '',
    interludeImage:            null,
    ammo:                      0,
    ammoQuota:                 0,
  };
}
