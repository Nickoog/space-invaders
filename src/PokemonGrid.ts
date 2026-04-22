import {
  ENEMY_COLS, ENEMY_ROWS, ENEMY_W, ENEMY_H,
  ENEMY_X_GAP, ENEMY_Y_GAP, ENEMY_TOP,
  ENEMY_STEP_X, ENEMY_STEP_D, ENEMY_BULLET_SPEED,
  CAUGHT_FLASH_MS, W,
  GRID_SPEED_BASE, GRID_SPEED_MIN, GRID_ACCEL_RATIO, MOVE_INTERVAL_MIN,
  FIRE_BASE_MS, FIRE_MIN_MS, FIRE_RANDOM_MS,
} from './constants.js';
import type { Grid, Enemy, Bullet } from './types.js';

interface Bounds {
  left: number;
  right: number;
  bottom: number;
}

export function createGrid(level: number, ids: number[]): Grid {
  const totalW = ENEMY_COLS * (ENEMY_W + ENEMY_X_GAP) - ENEMY_X_GAP;
  const startX = (W - totalW) / 2;
  const enemies: Enemy[] = [];

  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        row, col,
        alive: true,
        caughtFlash: 0,
        pokemonId: ids[row * ENEMY_COLS + col] ?? 1,
      });
    }
  }

  const base = Math.max(GRID_SPEED_MIN, GRID_SPEED_BASE - (level - 1) * 70);
  return {
    enemies,
    ox: startX,
    oy: ENEMY_TOP,
    dir: 1,
    moveTimer: base,
    moveInterval: base,
    stepPending: false,
    fireTimer: Math.max(FIRE_MIN_MS, FIRE_BASE_MS - (level - 1) * 100),
  };
}

export function getEnemyPos(grid: Grid, enemy: Enemy): { x: number; y: number } {
  return {
    x: grid.ox + enemy.col * (ENEMY_W + ENEMY_X_GAP),
    y: grid.oy + enemy.row * (ENEMY_H + ENEMY_Y_GAP),
  };
}

export function getAlivePokemon(grid: Grid): Enemy[] {
  return grid.enemies.filter(e => e.alive);
}

// Private helper — avoids re-filtering when alive list is already known.
function getBoundsFromAlive(grid: Grid, alive: Enemy[]): Bounds | null {
  if (!alive.length) return null;
  let minC = ENEMY_COLS, maxC = 0, maxR = 0;
  for (const e of alive) {
    if (e.col < minC) minC = e.col;
    if (e.col > maxC) maxC = e.col;
    if (e.row > maxR) maxR = e.row;
  }
  return {
    left:   grid.ox + minC * (ENEMY_W + ENEMY_X_GAP),
    right:  grid.ox + maxC * (ENEMY_W + ENEMY_X_GAP) + ENEMY_W,
    bottom: grid.oy + maxR * (ENEMY_H + ENEMY_Y_GAP) + ENEMY_H,
  };
}

export function getGridBounds(grid: Grid): Bounds | null {
  return getBoundsFromAlive(grid, getAlivePokemon(grid));
}

// Returns a new enemy bullet object or null. Mutates grid timers and caught flashes.
export function updateGrid(grid: Grid, dt: number, level: number): Bullet | null {
  // Decrement caught-flash timers; mark dead when flash completes
  for (const e of grid.enemies) {
    if (e.caughtFlash > 0) {
      e.caughtFlash -= dt;
      if (e.caughtFlash <= 0) {
        e.caughtFlash = 0;
        e.alive = false;
      }
    }
  }

  // Compute alive list once — reused for movement, acceleration and fire below
  const alive = grid.enemies.filter(e => e.alive);

  // Step-based grid movement
  grid.moveTimer -= dt;
  if (grid.moveTimer <= 0) {
    if (grid.stepPending) {
      grid.oy += ENEMY_STEP_D;
      grid.dir *= -1;
      grid.stepPending = false;
    } else {
      grid.ox += ENEMY_STEP_X * grid.dir;
      const b = getBoundsFromAlive(grid, alive);
      if (b && (b.right >= W || b.left <= 0)) grid.stepPending = true;
    }

    // Accelerate as the grid empties
    const ratio = 1 - alive.length / (ENEMY_COLS * ENEMY_ROWS);
    const base  = Math.max(GRID_SPEED_MIN, GRID_SPEED_BASE - (level - 1) * 70);
    grid.moveInterval = Math.max(MOVE_INTERVAL_MIN, base * (1 - ratio * GRID_ACCEL_RATIO));
    grid.moveTimer    = grid.moveInterval;
  }

  // Enemy fire: random bottom-of-column shooter
  grid.fireTimer -= dt;
  if (grid.fireTimer <= 0) {
    const base = Math.max(FIRE_MIN_MS, FIRE_BASE_MS - (level - 1) * 100);
    grid.fireTimer = base + Math.random() * FIRE_RANDOM_MS;

    if (alive.length) {
      const byCol: Enemy[] = [];
      for (let c = 0; c < ENEMY_COLS; c++) {
        const col = alive
          .filter(e => e.col === c && e.caughtFlash === 0)
          .sort((a, b) => b.row - a.row);
        if (col.length) byCol.push(col[0]!);
      }
      if (byCol.length) {
        const shooter = byCol[Math.floor(Math.random() * byCol.length)]!;
        const pos = getEnemyPos(grid, shooter);
        return {
          x: pos.x + ENEMY_W / 2 - 3,
          y: pos.y + ENEMY_H,
          w: 6, h: 14,
          vy: ENEMY_BULLET_SPEED,
          active: true,
        };
      }
    }
  }

  return null;
}
