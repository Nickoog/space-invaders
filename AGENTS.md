# AGENTS.md — AI Agent Guide

This file is intended for AI agents (Claude Code and others) working on this project.
It contains everything an agent needs to know before touching the code.

---

## Project Description

**Pokemon Invaders** is a Space Invaders clone with a Pokémon theme.
The invaders are the 151 first-generation Pokémon, whose sprites are loaded in real time
from the public [PokéAPI](https://pokeapi.co). The player throws Pokéballs to catch Pokémon
rather than destroy them.

The game runs in the browser, with no framework, on an 800×600 canvas.
It is automatically deployed to GitHub Pages on every push to `master`.

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| JavaScript ES Modules | ES2020+ | Main language (vanilla, no framework) |
| Canvas 2D API | Native | Graphics rendering |
| Vite | ^5.0.0 | Bundler / dev server |
| Node.js | 20 (CI) | Build environment |
| PokéAPI | v2 | Pokémon sprite source |
| GitHub Actions | — | CI/CD → GitHub Pages |
| sessionStorage | Native | Sprite URL cache |
| Vitest | ^4.1.5 | Unit test runner |

**No runtime dependencies.** No UI framework, no game engine.

---

## Architecture — Key Files and Their Roles

```
src/
├── constants.js       Single source of truth for all game constants
├── main.js            Entry point: canvas setup, input, preload, game loop start
├── Game.js            Central hub: main loop, collision detection, state machine
├── Player.js          Player state and logic (movement, invincibility, shooting)
├── PokemonGrid.js     Enemy grid: coordinated movement, enemy fire, catch mechanic
├── Bullets.js         Player and enemy projectiles (creation, movement, filtering)
├── Shields.js         Destructible shields (2D bitmask, 4×8 blocks per shield)
├── renderer.js        draw* functions per entity (Canvas 2D, immediate rendering)
├── screens.js         Non-gameplay screens: loading, menu, game over
├── input.js           Keyboard: global `keys` object + consumeKey()
└── api/
    └── pokeapi.js     Sprite fetching, sessionStorage cache, 8s timeout
```

### Dependency Map
```
main.js
  └── Game.js ──────── Player.js
               ├────── PokemonGrid.js
               ├────── Bullets.js
               ├────── Shields.js
               ├────── renderer.js
               ├────── screens.js
               ├────── input.js
               └────── api/pokeapi.js
All modules depend on constants.js
input.js and constants.js have no dependencies
```

### Architectural Pattern
- **Functional + Data-Oriented**: no `class`, only factory functions
- **Single mutable `game` object** passed to all functions
- **Fixed timestep 60 FPS**: delta accumulator → `update(STEP)` → `render(ctx, game)`
- **Clean separation**: logic in `update()`, drawing in `draw*` functions

---

## What an Agent CAN Do Freely

- Read any file to understand the code
- Add or modify constants in `constants.js`
- Add `draw*` functions in `renderer.js` following the existing pattern
- Add `render*Screen` functions in `screens.js`
- Modify scoring values (`ROW_POINTS`, `ROW_COLORS`)
- Modify difficulty parameters in `PokemonGrid.js` (the `base`/`ratio` formula)
- Fix bugs contained within a single file
- Improve comments following the existing style

---

## What an Agent MUST NOT Do Without Explicit Confirmation

- **Modify more than one file at a time** without first presenting a complete plan to the user
- **Change `ENEMY_COLS` or `ENEMY_ROWS`** without simultaneously updating `ROW_POINTS`, `ROW_COLORS`, and the cache key in `pokeapi.js`
- **Reorder initialization in `main.js`** — the sequence `initInput → preload → createGame → startLoop` is critical
- **Call `initInput()` more than once** — event listeners accumulate with no cleanup
- **Replace `catch { /**/ }` with `console.error`** without an explicit reason — the silence is intentional
- **Remove the colored-circle fallback** in `drawPokemon()` — it is intentional (missing sprite = graceful degradation)
- **Add npm dependencies** without confirmation — the project is intentionally zero runtime dependencies
- **Modify `vite.config.js`** — the `base: '/space-invaders/'` is tied to the GitHub Pages deployment
- **Push to `master`** — this triggers an automatic production deployment

---

## Code Conventions

### Naming

| Type | Convention | Examples |
|------|-----------|---------|
| Variables / properties | camelCase | `spriteMap`, `fireCooldown`, `caughtFlash` |
| Coordinates and dimensions | Short abbreviations | `x, y, w, h, r, c, dt, s` |
| Factory functions | `create*()` | `createPlayer()`, `createGrid()` |
| Update functions | `update*()` | `updatePlayer()`, `updateBullets()` |
| Entity render functions | `draw*()` | `drawPokemon()`, `drawHUD()` |
| Screen render functions | `render*Screen()` | `renderMenuScreen()` |
| Accessor functions | `get*()` | `getAlivePokemon()`, `getGridBounds()` |
| Constants | SCREAMING_SNAKE_CASE | `PLAYER_SPEED`, `CAUGHT_FLASH_MS` |
| Domain module files | PascalCase | `Player.js`, `PokemonGrid.js` |
| Utility files | camelCase | `renderer.js`, `input.js` |

### Implicit Units
- **All durations = milliseconds** — constants must use the `_MS` suffix
- **All speeds = pixels/second** — converted at runtime: `speed * (dt / 1000)`

### JavaScript Style
- `const` by default, `let` only in `for` loops
- Arrow functions for all callbacks
- Systematic destructuring in imports and at the top of functions
- No `class`, no `this`, no `var`
- Side effects documented in comments: `// Mutates player timers.`

### Comments
```javascript
// ── Section title ─────────────────────────────────────────── (renderer.js)
// Returns X. Mutates Y.                                        (before a function)
// Non-obvious reason                                           (inline, rare)
catch { /**/ }                                                  (intentional silence)
```

### Canvas 2D
- `ctx.globalAlpha` → **always reset to `1` immediately after use**
- Sprite fallback: `spriteMap?.get(id)` + check `img.complete && img.naturalWidth > 0`
- Immediate rendering (no scene graph, no dirty tracking)

---

## Running, Building, and Testing

```bash
# Install dependencies
npm install

# Start development server (hot reload)
npm run dev
# → http://localhost:5173/space-invaders/

# Build for production
npm run build
# → outputs to dist/

# Preview the production build
npm run preview
```

**Deployment:** automatic via GitHub Actions on every push to `master`.
The workflow installs, builds, and deploys `dist/` to the `gh-pages` branch.

**Tests (automated):**
```bash
# Run all unit tests once
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Run a single test file
npx vitest run tests/unit/<File>.test.js

# Run tests matching a pattern
npx vitest run -t "test name"
```

Test files live in `tests/unit/`. Environment: `node` (no DOM, no Canvas).
See `SKILL.md` at `.claude/skills/testing/SKILL.md` for full conventions.

**Manual verification** — always play in the browser after logic changes. Key scenarios:
- Collisions (Pokéball vs Pokémon, enemy bullets vs player, vs shields)
- Level transition (all caught → next level)
- Game over condition (invasion: grid reaches the player line)
- Sprite loading (run `sessionStorage.clear()` in the browser console to test cold start)
- Loading screen with progress bar

---

## Tests — Core Rules

### Coverage overview

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

### Non-negotiable rules

1. **Never mock the module under test.** `vi.mock('../../src/Player.js')` tests the mock, not the code.
2. **Test behaviours, not implementations.** If internal logic changes but the observable output is identical, the test must still pass as-is.
3. **AAA pattern.** Every `it` block follows Arrange → Act → Assert with no interleaving.
4. **Full independence.** Each test builds its own state via factory helpers (`makeX()`). No shared mutable objects between tests.
5. **Regression test for every bug fix.** Write the failing test first, then fix the code.

### When a new test is required

| Situation | Action |
|-----------|--------|
| New exported function | One `describe`, minimum: happy path + one edge case |
| Bug fix | Write the failing test **first**, then fix the code |
| Edge case flagged in review | Add an `it` to the existing `describe` |

### When NOT to write a test

- Functions that only call Canvas 2D (`draw*`, `render*Screen`) — no logic to verify
- DOM event handlers in `input.js` — trivial and jsdom cost is not justified
- `main.js` — entry point, integration test out of scope
- Async sprite loading in `pokeapi.js` — `fetch` + `Image` + `sessionStorage` require heavy mocking with low ROI

---

## Known Pitfalls and Sensitive Areas

### `ctx.globalAlpha` — risk of corrupted screen
Used for the catch flash effect in `renderer.js`. If an error occurs before the reset,
`globalAlpha` stays < 1 and all subsequent rendering appears transparent.
**Always** bracket usage: `ctx.globalAlpha = value;` ... `ctx.globalAlpha = 1;`

### `ROW_POINTS` / `ROW_COLORS` / `ENEMY_ROWS` — implicit coupling
These three values must stay in sync. `ROW_POINTS` and `ROW_COLORS` must have exactly
`ENEMY_ROWS` entries (currently 5). Changing `ENEMY_ROWS` without updating both arrays
causes silent out-of-bounds access (returns `undefined`, no error thrown).

### sessionStorage cache — silent failures
The `catch { /**/ }` blocks in `pokeapi.js` swallow all exceptions.
If the cache is corrupted or full, the game reloads all sprites without any warning.
To test cold start: run `sessionStorage.clear()` in the browser console.

### `getAlivePokemon()` and `getGridBounds()` — called every frame
These functions allocate new arrays/objects 60 times per second. Do not call them
outside of `update()` or add extra calls inside a tight inner loop.

### `initInput()` — no cleanup
`addEventListener` calls are never removed. Do not call `initInput()` more than once.

### Magic numbers not in `constants.js`
These values exist in code but are not in `constants.js` — treat them with care:

| Value | Location | Meaning |
|-------|----------|---------|
| `700`, `120` | `PokemonGrid.js` | Difficulty formula parameters |
| `0.85` | `PokemonGrid.js` | Grid acceleration coefficient |
| `2000` | `Game.js` | Player invincibility duration (ms) |
| `1500` | `Game.js` | Delay before "press Enter to replay" (ms) |
| `100` | `renderer.js` | Invincibility blink interval (ms) |
| `500` | `screens.js` | Menu text blink interval (ms) |

---

## Claude Code — Specific Instructions

- **Always read a file before modifying it** — never assume its contents
- **Before touching `Game.js`**: re-read `// Mutates` comments to understand side effects
- **Before touching `PokemonGrid.js`**: verify that `ROW_POINTS` remains consistent
- **After any change to `renderer.js`**: confirm that `ctx.globalAlpha` is always reset to `1`
- **For any new constant**: add it to `constants.js` and import from there — never inline
- If a change spans multiple interdependent files, **present the full plan before writing a single line**

---

## Expected Behavior — Confirm Before Multi-File Changes

Before any intervention touching more than one file, the agent must:

1. **Explicitly list** all files that will be modified and why
2. **Describe potential side effects** (shared constants, inter-module contracts)
3. **Wait for explicit user confirmation** before writing anything

Example of good practice:
> "This change touches `PokemonGrid.js` (logic), `constants.js` (new constant),
> and `renderer.js` (new draw function). Here is the full plan — shall I proceed?"

Single-file bug fixes can be applied directly without prior confirmation,
unless they modify a contract between modules.
