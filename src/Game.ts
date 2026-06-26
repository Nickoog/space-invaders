import { S } from './constants.js';
import { loadStats } from './flavienProfile.js';
import type { GameState } from './types.js';

export function createGame(spriteMap: Map<number, HTMLImageElement | null>): GameState {
  return {
    state:             S.HOME,
    spriteMap,
    score:             0,
    highScore:         0,
    lives:             3,
    level:             1,
    gameOverDelay:     0,
    levelUpTimer:      0,
    nextLevel:         1,
    player:            null,
    grid:              null,
    bullets:           null,
    questionPool:      [],
    lastQuestionType:  null,
    difficultyOffset:  0,
    bonusMessage:      '',
    bonusMessageTimer: 0,
    stats:             loadStats(),
    victoryDelay:              0,
    interludeImage:            null,
    ammo:                      0,
    ammoQuota:                 0,
    quizInProgress:            false,
    skipLevels:                false,
    gameStartTime:             0,
    emailSent:                 false,
    questionHistory:           [],
    topicIndex:                0,
    pokemonTypePool:           [],
  };
}
