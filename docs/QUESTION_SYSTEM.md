# Système de questions — Pokémon Invaders

## Vue d'ensemble

Deux pools de questions indépendants, chacun alimenté par un type de prompt distinct.

```
game.questionPool      ← culture geek    (quiz pré-niveau + rechargement ammo)
game.pokemonTypePool   ← Pokémon typé    (balle ennemie touche le joueur)
```

## Flux par déclencheur

| Déclencheur | Pool consommé | Bibliothèque |
|---|---|---|
| `askPreLevelQuestion` | `questionPool` | `GEEK_PROMPTS[tier]` |
| `triggerReloadQuestion` | `questionPool` | `GEEK_PROMPTS[tier]` |
| `askNextQuestion` (balle) | `pokemonTypePool` → `questionPool` → fallback | `POKEMON_TYPE_PROMPTS[levelType]` |

## Bibliothèques de prompts (`src/ai/promptLibrary.ts`)

### `POKEMON_TYPE_PROMPTS`
14 prompts, un par type Pokémon Gen 1. Chaque prompt liste explicitement les Pokémon concernés
(noms français, numéros Pokédex, attaques, faiblesses) pour ancrer l'IA sur des faits réels.

Types couverts : `fire`, `water`, `grass`, `electric`, `psychic`, `poison`, `ground`,
`rock`, `flying`, `bug`, `ice`, `fighting`, `ghost`, `dragon`.

### `GEEK_PROMPTS`
3 prompts par palier de difficulté (`easy` / `medium` / `hard`), axés culture geek 17 ans
(jeux vidéo, réseaux sociaux, streamers, anime, rap fr, tech).

### `GEEK_TOPICS`
10 thèmes en rotation (injectés dans le user prompt) pour varier les sujets à l'intérieur
d'un même palier.

### `getDifficultyTier(level)`
```
niveaux 1–6  → 'easy'
niveaux 7–12 → 'medium'
niveaux 13–17 → 'hard'
```

## Anti-répétition

- `game.questionHistory` : textes des 25 dernières questions posées (FIFO)
- Tracké dès la **génération** (dans `replenishPool` / `replenishPokemonPool`) pour que
  les questions du même batch ne se répètent pas
- Aussi tracké à l'**affichage** (`trackQuestion`) pour les fallbacks locaux

## Refill des pools

- `replenishPool(game)` — appelé après chaque question geek, remplit jusqu'à 3
- `replenishPokemonPool(game)` — appelé au début de chaque niveau ET après chaque question
  de type balle; recrée le pool avec le bon `levelType`
- À chaque `startLevel()` : `game.pokemonTypePool = []` est vidé pour forcer le recalcul
  avec le nouveau type

## Fallback local

38 questions statiques dans `src/ai/fallbackQuestions.ts`, servies en shuffle sans remise.
Utilisées si l'API est absente, timeout, ou erreur.

## Ajouter un nouveau type

1. Ajouter une entrée dans `POKEMON_TYPE_PROMPTS` dans `promptLibrary.ts`
2. Lister les Pokémon du type avec leurs `#numéro`, attaques et faiblesses
3. S'assurer que le type correspond à une valeur retournée par `getLevelType()` dans `pokeapi.ts`
