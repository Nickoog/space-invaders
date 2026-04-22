import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createGrid, getEnemyPos, getAlivePokemon, getGridBounds, updateGrid,
} from '../../src/PokemonGrid.js';
import {
  ENEMY_COLS, ENEMY_ROWS, ENEMY_W, ENEMY_H,
  ENEMY_X_GAP, ENEMY_Y_GAP, ENEMY_TOP, ENEMY_STEP_D, W,
} from '../../src/constants.js';

const TOTAL = ENEMY_COLS * ENEMY_ROWS;
const makeIds = () => Array.from({ length: TOTAL }, (_, i) => i + 1);

afterEach(() => vi.restoreAllMocks());

// ── createGrid ────────────────────────────────────────────────────────────────

describe('createGrid', () => {
  it('creates the correct number of enemies', () => {
    expect(createGrid(1, makeIds()).enemies).toHaveLength(TOTAL);
  });

  it('all enemies start alive', () => {
    const { enemies } = createGrid(1, makeIds());
    expect(enemies.every(e => e.alive)).toBe(true);
  });

  it('all enemies start with no caught flash', () => {
    const { enemies } = createGrid(1, makeIds());
    expect(enemies.every(e => e.caughtFlash === 0)).toBe(true);
  });

  it('assigns pokemon IDs in order', () => {
    const ids = makeIds();
    const { enemies } = createGrid(1, ids);
    expect(enemies[0].pokemonId).toBe(ids[0]);
    expect(enemies[TOTAL - 1].pokemonId).toBe(ids[TOTAL - 1]);
  });

  it('centers the grid horizontally', () => {
    const grid = createGrid(1, makeIds());
    const totalW = ENEMY_COLS * (ENEMY_W + ENEMY_X_GAP) - ENEMY_X_GAP;
    expect(grid.ox).toBeCloseTo((W - totalW) / 2);
  });

  it('starts at ENEMY_TOP vertically', () => {
    expect(createGrid(1, makeIds()).oy).toBe(ENEMY_TOP);
  });

  it('moves faster at higher levels (shorter move interval)', () => {
    const g1 = createGrid(1, makeIds());
    const g5 = createGrid(5, makeIds());
    expect(g5.moveInterval).toBeLessThan(g1.moveInterval);
  });

  it('fires more frequently at higher levels (shorter fire timer)', () => {
    const g1 = createGrid(1, makeIds());
    const g9 = createGrid(9, makeIds());
    expect(g9.fireTimer).toBeLessThan(g1.fireTimer);
  });
});

// ── getEnemyPos ───────────────────────────────────────────────────────────────

describe('getEnemyPos', () => {
  it('returns grid origin for top-left enemy', () => {
    const grid = createGrid(1, makeIds());
    const enemy = grid.enemies.find(e => e.row === 0 && e.col === 0);
    const pos = getEnemyPos(grid, enemy);
    expect(pos.x).toBe(grid.ox);
    expect(pos.y).toBe(grid.oy);
  });

  it('accounts for column gap between adjacent enemies', () => {
    const grid = createGrid(1, makeIds());
    const e0 = grid.enemies.find(e => e.row === 0 && e.col === 0);
    const e1 = grid.enemies.find(e => e.row === 0 && e.col === 1);
    expect(getEnemyPos(grid, e1).x - getEnemyPos(grid, e0).x).toBe(ENEMY_W + ENEMY_X_GAP);
  });

  it('accounts for row gap between adjacent enemies', () => {
    const grid = createGrid(1, makeIds());
    const e0 = grid.enemies.find(e => e.row === 0 && e.col === 0);
    const e1 = grid.enemies.find(e => e.row === 1 && e.col === 0);
    expect(getEnemyPos(grid, e1).y - getEnemyPos(grid, e0).y).toBe(ENEMY_H + ENEMY_Y_GAP);
  });

  it('updates position when grid offset changes', () => {
    const grid = createGrid(1, makeIds());
    const enemy = grid.enemies[0];
    const before = getEnemyPos(grid, enemy).x;
    grid.ox += 10;
    expect(getEnemyPos(grid, enemy).x).toBe(before + 10);
  });
});

// ── getAlivePokemon ───────────────────────────────────────────────────────────

describe('getAlivePokemon', () => {
  it('returns all enemies when all are alive', () => {
    const grid = createGrid(1, makeIds());
    expect(getAlivePokemon(grid)).toHaveLength(TOTAL);
  });

  it('excludes dead enemies', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies[0].alive = false;
    expect(getAlivePokemon(grid)).toHaveLength(TOTAL - 1);
  });

  it('returns empty array when all enemies are dead', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies.forEach(e => { e.alive = false; });
    expect(getAlivePokemon(grid)).toHaveLength(0);
  });

  it('includes enemies still in caught flash (alive=true, caughtFlash>0)', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies[0].caughtFlash = 200;
    expect(getAlivePokemon(grid)).toHaveLength(TOTAL);
  });
});

// ── getGridBounds ─────────────────────────────────────────────────────────────

describe('getGridBounds', () => {
  it('returns null when no enemies are alive', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies.forEach(e => { e.alive = false; });
    expect(getGridBounds(grid)).toBeNull();
  });

  it('left bound equals grid origin for a full grid', () => {
    const grid = createGrid(1, makeIds());
    expect(getGridBounds(grid).left).toBe(grid.ox);
  });

  it('right bound covers the last column', () => {
    const grid = createGrid(1, makeIds());
    const expected = grid.ox + (ENEMY_COLS - 1) * (ENEMY_W + ENEMY_X_GAP) + ENEMY_W;
    expect(getGridBounds(grid).right).toBe(expected);
  });

  it('bottom bound covers the last row', () => {
    const grid = createGrid(1, makeIds());
    const expected = grid.oy + (ENEMY_ROWS - 1) * (ENEMY_H + ENEMY_Y_GAP) + ENEMY_H;
    expect(getGridBounds(grid).bottom).toBe(expected);
  });

  it('left bound shifts right when leftmost column is cleared', () => {
    const grid = createGrid(1, makeIds());
    const before = getGridBounds(grid).left;
    grid.enemies.filter(e => e.col === 0).forEach(e => { e.alive = false; });
    expect(getGridBounds(grid).left).toBeGreaterThan(before);
  });

  it('right bound shifts left when rightmost column is cleared', () => {
    const grid = createGrid(1, makeIds());
    const before = getGridBounds(grid).right;
    grid.enemies.filter(e => e.col === ENEMY_COLS - 1).forEach(e => { e.alive = false; });
    expect(getGridBounds(grid).right).toBeLessThan(before);
  });
});

// ── updateGrid ────────────────────────────────────────────────────────────────

describe('updateGrid — caught flash', () => {
  it('marks enemy as dead when caught flash expires', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies[0].caughtFlash = 100;
    updateGrid(grid, 200, 1);
    expect(grid.enemies[0].alive).toBe(false);
  });

  it('keeps enemy alive while caught flash is still running', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies[0].caughtFlash = 500;
    updateGrid(grid, 100, 1);
    expect(grid.enemies[0].alive).toBe(true);
  });

  it('decrements caught flash timer each tick', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies[0].caughtFlash = 500;
    updateGrid(grid, 100, 1);
    expect(grid.enemies[0].caughtFlash).toBe(400);
  });
});

describe('updateGrid — movement', () => {
  it('moves the grid horizontally when move timer fires', () => {
    const grid = createGrid(1, makeIds());
    const startOx = grid.ox;
    updateGrid(grid, grid.moveTimer + 1, 1);
    expect(grid.ox).not.toBe(startOx);
  });

  it('sets stepPending when right wall is reached', () => {
    const grid = createGrid(1, makeIds());
    const bounds = getGridBounds(grid);
    grid.ox += W - bounds.right; // push grid to right edge
    updateGrid(grid, grid.moveTimer + 1, 1);
    expect(grid.stepPending).toBe(true);
  });

  it('sets stepPending when left wall is reached', () => {
    const grid = createGrid(1, makeIds());
    grid.dir = -1;
    const bounds = getGridBounds(grid);
    grid.ox -= bounds.left; // push grid to left edge
    updateGrid(grid, grid.moveTimer + 1, 1);
    expect(grid.stepPending).toBe(true);
  });

  it('descends and flips direction when stepPending is true', () => {
    const grid = createGrid(1, makeIds());
    grid.stepPending = true;
    const startOy = grid.oy;
    const startDir = grid.dir;
    updateGrid(grid, grid.moveTimer + 1, 1);
    expect(grid.oy).toBe(startOy + ENEMY_STEP_D);
    expect(grid.dir).toBe(-startDir);
    expect(grid.stepPending).toBe(false);
  });

  it('resets move timer after each step', () => {
    const grid = createGrid(1, makeIds());
    updateGrid(grid, grid.moveTimer + 1, 1);
    expect(grid.moveTimer).toBeGreaterThan(0);
  });

  it('accelerates as enemies are eliminated', () => {
    const grid1 = createGrid(1, makeIds());
    const grid2 = createGrid(1, makeIds());
    // Kill half the enemies in grid2
    grid2.enemies.slice(0, TOTAL / 2).forEach(e => { e.alive = false; });
    updateGrid(grid1, grid1.moveTimer + 1, 1);
    updateGrid(grid2, grid2.moveTimer + 1, 1);
    expect(grid2.moveInterval).toBeLessThan(grid1.moveInterval);
  });
});

describe('updateGrid — enemy fire', () => {
  it('fires a bullet when fire timer expires', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const grid = createGrid(1, makeIds());
    const bullet = updateGrid(grid, grid.fireTimer + 1, 1);
    expect(bullet).not.toBeNull();
    expect(bullet.active).toBe(true);
  });

  it('bullet moves downward (positive vy)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const grid = createGrid(1, makeIds());
    const bullet = updateGrid(grid, grid.fireTimer + 1, 1);
    expect(bullet.vy).toBeGreaterThan(0);
  });

  it('does not fire when no enemies are alive', () => {
    const grid = createGrid(1, makeIds());
    grid.enemies.forEach(e => { e.alive = false; });
    const bullet = updateGrid(grid, grid.fireTimer + 1, 1);
    expect(bullet).toBeNull();
  });

  it('does not fire before fire timer expires', () => {
    const grid = createGrid(1, makeIds());
    const bullet = updateGrid(grid, grid.fireTimer - 1, 1);
    expect(bullet).toBeNull();
  });

  it('resets fire timer after firing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const grid = createGrid(1, makeIds());
    updateGrid(grid, grid.fireTimer + 1, 1);
    expect(grid.fireTimer).toBeGreaterThan(0);
  });
});
