Search for numeric literals across `src/` that are not defined in `constants.js`:

```bash
grep -rn --include="*.js" -E '[^a-zA-Z_"'"'"'][0-9]{2,}' src/ | grep -v "src/constants.js"
```

Review each result and decide whether it should be moved to `constants.js`.

**Known intentional magic numbers** (documented in `AGENTS.md` — do not blindly move these):

| Value | File | Meaning |
|-------|------|---------|
| `700`, `120` | `PokemonGrid.js` | Difficulty formula base values |
| `0.85` | `PokemonGrid.js` | Grid acceleration coefficient |
| `2000` | `Game.js` | Player invincibility duration (ms) |
| `1500` | `Game.js` | Delay before "press Enter to replay" (ms) |
| `100` | `renderer.js` | Invincibility blink interval (ms) |
| `500` | `screens.js` | Menu text blink interval (ms) |

Any value **not** in this list should be added to `constants.js` with an appropriate name and, if it represents a duration, the `_MS` suffix.
