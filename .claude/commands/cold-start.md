Run the following command in the browser console to clear the Pokémon sprite cache and force a full reload:

```js
sessionStorage.clear(); location.reload();
```

Then verify each of the following:

- [ ] The loading screen appears with the progress bar counting up
- [ ] All 55 Pokémon sprites load (or gracefully fall back to colored circles)
- [ ] No mixed-content errors in the console (http:// sprite URLs must be upgraded to https://)
- [ ] After loading completes, the menu screen appears
- [ ] The game is fully playable (movement, shooting, collisions, level transition)

**Context:** Sprites are cached in `sessionStorage` under the key `pokemon_invaders_sprites_v1`.
Clearing it simulates what a first-time visitor experiences.
The cache is populated by `src/api/pokeapi.js` during the loading phase.
