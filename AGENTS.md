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
| TypeScript | ^5.0 | Main language (strict mode, no framework) |
| Canvas 2D API | Native | Graphics rendering |
| Vite | ^5.0.0 | Bundler / dev server (compiles TS natively) |
| Node.js | 20 (CI) | Build environment |
| PokéAPI | v2 | Pokémon sprite source |
| GitHub Actions | — | CI/CD → GitHub Pages |
| sessionStorage | Native | Sprite URL cache |
| Vitest | ^4.1.5 | Unit test runner |
| ai (Vercel AI SDK) | ^4.x | Structured text generation |
| @ai-sdk/anthropic | ^1.x | Anthropic provider for the AI SDK |
| zod | ^3.x | Schema validation for AI responses |

**No UI framework, no game engine.** The AI SDK (`ai`, `@ai-sdk/anthropic`, `zod`) are optional runtime dependencies — the game runs fully without them if `VITE_ANTHROPIC_API_KEY` is absent.

---

## Architecture — Key Files and Their Roles

```
src/
├── constants.ts       Single source of truth for all game constants
├── types.ts           Shared TypeScript interfaces (Player, Grid, Bullet, GameState…)
├── main.ts            Entry point: canvas setup, input, preload, game loop start
├── Game.ts            createGame factory — returns the initial GameState object
├── gameLoop.ts        Main loop, update, render, state machine (MENU/PLAYING/GAME_OVER)
├── collision.ts       Pure AABB overlap function
├── Player.ts          Player state and logic (movement, invincibility, shooting)
├── PokemonGrid.ts     Enemy grid: coordinated movement, enemy fire, catch mechanic
├── Bullets.ts         Player and enemy projectiles (creation, movement, filtering)
├── Shields.ts         Destructible shields (2D bitmask, 4×8 blocks per shield)
├── renderer.ts        draw* functions per entity (Canvas 2D, immediate rendering)
├── screens.ts         Non-gameplay screens: loading, menu, game over
├── input.ts           Keyboard: global `keys` object + consumeKey()
├── ai/
│   ├── questionService.ts    AI question generation (Anthropic SDK) + fallback logic
│   ├── fallbackQuestions.ts  Local question bank — 20 multiple_choice questions (no API)
│   └── onboarding.ts         Player interest/age collection + localStorage persistence
├── ui/
│   └── modal.ts              Onboarding modal + in-game question modal (DOM overlay)
└── api/
    └── pokeapi.ts     Sprite fetching, sessionStorage cache, 8s timeout
```

### Dependency Map
```
main.ts
  ├── Game.ts          (createGame)
  └── gameLoop.ts ──── Player.ts
                  ├─── PokemonGrid.ts
                  ├─── Bullets.ts
                  ├─── Shields.ts
                  ├─── collision.ts
                  ├─── renderer.ts
                  ├─── screens.ts
                  ├─── input.ts
                  ├─── api/pokeapi.ts
                  ├─── ai/questionService.ts ── ai/fallbackQuestions.ts
                  │                         └── ai/onboarding.ts
                  └─── ui/modal.ts ──────────── ai/onboarding.ts
All modules depend on constants.ts and types.ts
input.ts and constants.ts have no dependencies
```

### Architectural Pattern
- **Functional + Data-Oriented**: no `class`, only factory functions
- **Single mutable `game` object** passed to all functions
- **Fixed timestep 60 FPS**: delta accumulator → `update(STEP)` → `render(ctx, game)`
- **Clean separation**: logic in `update()`, drawing in `draw*` functions

---

## What an Agent CAN Do Freely

- Read any file to understand the code
- Add or modify constants in `constants.ts` (always add to `types.ts` if a new shape is introduced)
- Add `draw*` functions in `renderer.ts` following the existing pattern
- Add `render*Screen` functions in `screens.ts`
- Modify scoring values (`ROW_POINTS`, `ROW_COLORS`)
- Modify difficulty parameters in `PokemonGrid.ts` (the `base`/`ratio` formula)
- Fix bugs contained within a single file
- Improve comments following the existing style

---

## What an Agent MUST NOT Do Without Explicit Confirmation

- **Modify more than one file at a time** without first presenting a complete plan to the user
- **Change `ENEMY_COLS` or `ENEMY_ROWS`** without simultaneously updating `ROW_POINTS`, `ROW_COLORS`, and the cache key in `pokeapi.ts`
- **Reorder initialization in `main.ts`** — the sequence `initInput → preload → createGame → startLoop` is critical
- **Call `initInput()` more than once** — event listeners accumulate with no cleanup
- **Replace `catch { /**/ }` with `console.error`** without an explicit reason — the silence is intentional
- **Remove the colored-circle fallback** in `drawPokemon()` — it is intentional (missing sprite = graceful degradation)
- **Add npm dependencies** without confirmation — keep the dependency footprint minimal
- **Reintroduce the `open` question type** in `QuestionData` — removed intentionally; all questions are `multiple_choice`
- **Expose `VITE_ANTHROPIC_API_KEY` in logs or UI** — it is embedded in the browser bundle; do not leak it further
- **Modify `vite.config.js`** — the `base: '/space-invaders/'` is tied to the GitHub Pages deployment
- **Weaken TypeScript config** (`strict`, `noUncheckedIndexedAccess`) without explicit confirmation
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
| TypeScript interfaces | PascalCase | `Player`, `Grid`, `GameState` |
| Domain module files | PascalCase | `Player.ts`, `PokemonGrid.ts` |
| Utility files | camelCase | `renderer.ts`, `input.ts` |

### Implicit Units
- **All durations = milliseconds** — constants must use the `_MS` suffix
- **All speeds = pixels/second** — converted at runtime: `speed * (dt / 1000)`

### TypeScript Style
- `const` by default, `let` only in `for` loops
- Arrow functions for all callbacks
- Systematic destructuring in imports and at the top of functions
- No `class`, no `this`, no `var`
- Explicit return types on all exported functions
- Use `import type` for type-only imports
- Non-null assertion (`!`) only when the value is guaranteed by game logic — add a comment explaining why
- Side effects documented in comments: `// Mutates player timers.`

### Comments
```typescript
// ── Section title ─────────────────────────────────────────── (renderer.ts)
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
| `collision.ts` | `Game.overlap.test.js` | ✅ |
| `Player.ts` | `Player.test.js` | ✅ |
| `Bullets.ts` | `Bullets.test.js` | ✅ |
| `Shields.ts` | `Shields.test.js` | ✅ |
| `PokemonGrid.ts` | `PokemonGrid.test.js` | ✅ |
| `api/pokeapi.ts` | `pokeapi.test.js` | ✅ `getIdsForLevel` only |
| `renderer.ts` | — | ❌ Canvas, skip |
| `screens.ts` | — | ❌ Canvas, skip |
| `input.ts` | — | ❌ DOM, low ROI |
| `main.ts` | — | ❌ Entry point |
| `ai/questionService.ts` | — | ❌ Anthropic API + fetch, skip |
| `ai/fallbackQuestions.ts` | — | ❌ Static data, skip |
| `ai/onboarding.ts` | — | ❌ localStorage + DOM, skip |
| `ui/modal.ts` | — | ❌ DOM overlay, skip |

### Non-negotiable rules

1. **Never mock the module under test.** `vi.mock('../../src/Player.ts')` tests the mock, not the code.
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
Used for the catch flash effect in `renderer.ts`. If an error occurs before the reset,
`globalAlpha` stays < 1 and all subsequent rendering appears transparent.
**Always** bracket usage: `ctx.globalAlpha = value;` ... `ctx.globalAlpha = 1;`

### `ROW_POINTS` / `ROW_COLORS` / `ENEMY_ROWS` — implicit coupling
These three values must stay in sync. `ROW_POINTS` and `ROW_COLORS` must have exactly
`ENEMY_ROWS` entries (currently 5). Changing `ENEMY_ROWS` without updating both arrays
causes silent out-of-bounds access (returns `undefined`, caught by `noUncheckedIndexedAccess`
at compile time but only for typed arrays).

### sessionStorage cache — silent failures
The `catch { /**/ }` blocks in `pokeapi.ts` swallow all exceptions.
If the cache is corrupted or full, the game reloads all sprites without any warning.
To test cold start: run `sessionStorage.clear()` in the browser console.

### `getAlivePokemon()` and `getGridBounds()` — called every frame
These functions allocate new arrays/objects 60 times per second. Do not call them
outside of `update()` or add extra calls inside a tight inner loop.

### `initInput()` — no cleanup
`addEventListener` calls are never removed. Do not call `initInput()` more than once.

### AI question feature — key invariants

**`VITE_ANTHROPIC_API_KEY` absente ou invalide** → `getProvider()` retourne `null` et `getRandomFallback()` est utilisé silencieusement. C'est le comportement attendu, pas un bug.

**`questionPool` dans `GameState`** — rechargé en fire-and-forget via `replenishPool()` appelé depuis `gameLoop.ts`. Ne jamais `await` cette fonction dans la boucle principale ; elle ne lance jamais d'exception.

**`QuestionData.type` est toujours `'multiple_choice'`** — le type `open` a été supprimé intentionnellement. `choices` est un tableau requis (non-optionnel). Ne pas réintroduire la branche `open` dans `modal.ts` ou le schema Zod.

**Onboarding** — les intérêts et l'âge du joueur sont persistés dans `localStorage` via `ai/onboarding.ts`. Si `localStorage` est indisponible (navigation privée, quota), les fonctions retournent `null` silencieusement et la génération de questions se fait sans contexte de personnalisation.

### `GameState` nullability — `player`, `grid`, `bullets`, `shields`
These fields are `null` in MENU and GAME_OVER states and populated in PLAYING state.
`gameLoop.ts` guards them with `if (!player || !grid || ...) return;` before use.
Any new function that receives `GameState` and touches these fields must do the same check.

---

## Claude Code — Specific Instructions

- **Always read a file before modifying it** — never assume its contents
- **Before touching `gameLoop.ts`**: re-read `// Mutates` comments and null guards to understand side effects
- **Before touching `PokemonGrid.ts`**: verify that `ROW_POINTS` remains consistent
- **After any change to `renderer.ts`**: confirm that `ctx.globalAlpha` is always reset to `1`
- **For any new constant**: add it to `constants.ts` and import from there — never inline
- **For any new data shape**: add an interface to `types.ts` and use `import type` in consumers
- **TypeScript**: run `npx tsc --noEmit` to type-check before marking a task complete
- If a change spans multiple interdependent files, **present the full plan before writing a single line**

---

## Expected Behavior — Confirm Before Multi-File Changes

Before any intervention touching more than one file, the agent must:

1. **Explicitly list** all files that will be modified and why
2. **Describe potential side effects** (shared constants, inter-module contracts)
3. **Wait for explicit user confirmation** before writing anything

Example of good practice:
> "This change touches `PokemonGrid.ts` (logic), `constants.ts` (new constant),
> and `renderer.ts` (new draw function). Here is the full plan — shall I proceed?"

Single-file bug fixes can be applied directly without prior confirmation,
unless they modify a contract between modules.
