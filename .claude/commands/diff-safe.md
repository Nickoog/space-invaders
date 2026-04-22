Pre-commit safety checklist for this project. Run each step before committing — there are no automated tests, so this is the only safety net.

**1. List all modified files**
```bash
git diff --name-only
```

**2. Verify `globalAlpha` resets in `renderer.js`**
```bash
grep -n "globalAlpha" src/renderer.js
```
Every `ctx.globalAlpha = <value>` where value ≠ 1 must be immediately followed by `ctx.globalAlpha = 1;` within the same function. A missing reset corrupts all subsequent rendering silently.

**3. Check `ROW_POINTS` / `ROW_COLORS` / `ENEMY_ROWS` are in sync**
```bash
grep -E "ENEMY_ROWS|ROW_POINTS|ROW_COLORS" src/constants.js
```
All three must have the same number of entries (currently 5).

**4. Check for new inline numeric literals outside `constants.js`**
```bash
git diff src/ | grep "^+" | grep -E "[^a-zA-Z_][0-9]{2,}" | grep -v "constants.js"
```
Any hit should be reviewed: add to `constants.js` or document in `AGENTS.md`.

**5. Manual gameplay verification** (no automated tests exist)
- [ ] Pokéball hits a Pokémon → catch flash + score increases
- [ ] Enemy bullet hits player → life lost, player blinks
- [ ] Bullets are blocked by shields (both sides)
- [ ] All Pokémon caught → next level starts
- [ ] Enemy grid reaches player line → game over
