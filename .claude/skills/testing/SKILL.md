---
name: testing
description: Advanced conventions for writing and maintaining unit tests in this project. Invoke manually with @testing. Core rules live in AGENTS.md and apply automatically to every session.
---

## Standard test file structure

```js
// 1. Vitest imports
import { describe, it, expect, vi, afterEach } from 'vitest';

// 2. Module under test
import { functionA, functionB } from '../../src/Module.js';

// 3. Constants used in assertions (import, never hardcode)
import { SOME_CONSTANT } from '../../src/constants.js';

// 4. Local factory helpers — build fresh state per test
function makeX(overrides = {}) {
  return { field: defaultValue, ...overrides };
}

// 5. Spy cleanup
afterEach(() => vi.restoreAllMocks());

// 6. One describe per exported function, one it per behaviour
describe('functionA', () => {
  it('does X when Y', () => { /* Arrange → Act → Assert */ });
  it('returns null when Z', () => { /* Arrange → Act → Assert */ });
});
```

## Naming rules

| Element | Convention | Example |
|---------|-----------|---------|
| `describe` | exact function name | `describe('updatePlayer', ...)` |
| `describe` (grouped) | `'function — category'` | `describe('updatePlayer — shooting', ...)` |
| `it` | `'verb + expected outcome'` | `'fires a bullet when Space is pressed'` |
| test file | `SourceFile.test.js` | `PokemonGrid.test.js` |
| factory helper | `make*` | `makeGrid()`, `makeBullet()` |

Avoid: `'should ...'`, `'test that ...'`, `'works correctly'`.

## When to create a new test

| Situation | Action |
|-----------|--------|
| New exported function | One `describe`, minimum: happy path + one edge case |
| Bug fix | Write the failing test **first**, then fix the code |
| Edge case flagged in review | Add an `it` to the existing `describe` |

## When to update an existing test

- The function's public contract changes (return type, new required parameter)
- A constant it references is renamed
- The behaviour has **intentionally** changed

Do NOT update a test because the internal implementation changed —
if the observable behaviour is preserved, the test must still pass as-is.

## When to delete a test

- The tested function has been removed from the public API
- The test is an exact duplicate of another (same inputs, same assertions)

When in doubt: keep it. A redundant test is cheaper than a missing one.

## How to detect a test that tests nothing

```js
// 1. Assertion always true regardless of the implementation
expect(typeof result).toBe('object');

// 2. Passes even if the function is replaced with () => null
it('calls updatePlayer', () => {
  updatePlayer(player, 100, {}, false);
  expect(true).toBe(true); // ← tests nothing
});

// 3. Asserts internal state the public API never exposes
expect(player._internalTimer).toBe(400); // fragile, tied to implementation

// 4. Mocks the module under test
vi.mock('../../src/Player.js'); // now testing the mock, not the code
```

Fix: replace with a behavioural assertion — what does the **caller** observe?

## Handling non-determinism (Math.random)

```js
afterEach(() => vi.restoreAllMocks());

it('fires a bullet when fire timer expires', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const grid = createGrid(1, makeIds());
  const bullet = updateGrid(grid, grid.fireTimer + 1, 1);
  expect(bullet).not.toBeNull();
});
```

Only mock `Math.random` in tests that actually depend on it.

## Module coverage status

| Module | Test file | Status |
|--------|-----------|--------|
| `Game.js` (overlap) | `Game.overlap.test.js` | ✅ |
| `Player.js` | `Player.test.js` | ✅ |
| `Bullets.js` | `Bullets.test.js` | ✅ |
| `Shields.js` | `Shields.test.js` | ✅ |
| `PokemonGrid.js` | `PokemonGrid.test.js` | ✅ |
| `api/pokeapi.js` | `pokeapi.test.js` | ✅ `getIdsForLevel` only |
| `renderer.js` | — | ❌ Canvas, skip |
| `screens.js` | — | ❌ Canvas, skip |
| `input.js` | — | ❌ DOM, low ROI |
| `main.js` | — | ❌ Entry point |
