# Plan : Amélioration visuelle du jeu

## Contexte

Le jeu est fonctionnel mais visuellement basique : fond noir uni, balles ennemies en rectangles violets, sprites Pokémon en 96×96px. On veut trois upgrades visuelles ciblées :
1. Sprites haute résolution (official artwork)
2. Projectiles ennemis différents selon le type du niveau (électrique = éclair, feu = flamme, etc.)
3. Fond "arène Pokémon" au lieu du noir uni
4. Police Press Start 2P (retro arcade) pour tout le texte — 1 ligne HTML, impact immédiat

---

## Changements

### 1. Sprites official artwork — `src/api/pokeapi.ts`

**Problème actuel :** `data.sprites.front_default` retourne une PNG 96×96 via l'API PokeAPI.  
**Solution :** Construire l'URL directement sans appel API pour les sprites.

URL pattern :
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
```

Changement dans `preloadSprites()` : ne plus appeler `fetch` pour chaque sprite, construire l'URL directement depuis l'ID. L'API reste utilisée uniquement pour les données de type (déjà séparé dans `getTypeForPokemon`).

Gain : économise 151 appels réseau au démarrage, sprites impeccables à toute taille.

---

### 2. Projectiles ennemis par type — `src/renderer.ts`

**Problème actuel :** `drawEnemyBullet(ctx, bullet)` dessine un rectangle violet fixe.  
**Solution :** `drawEnemyBullet(ctx, bullet, type: string)` — formes et couleurs spécifiques par type.

Palette de projectiles :

| Type | Couleur | Forme |
|------|---------|-------|
| `electric` | Jaune #FFD700 | Zigzag éclair |
| `fire` | Orange #FF6600 | Goutte de flamme + glow |
| `water` | Bleu #4488FF | Goutte d'eau |
| `grass` | Vert #44CC44 | Feuille (deux arcs) |
| `psychic` | Rose #FF44AA | Orbe pulsant étoilé |
| `poison` | Violet #AA44FF | Bulle |
| `ground` | Marron #CC8844 | Losange / rocher |
| `rock` | Gris #888888 | Ovale craquelé |
| `flying` | Blanc #AADDFF | Croissant / rafale |
| `bug` | Vert olive #88BB22 | Ovale |
| `ice` | Cyan #88EEFF | Cristal / diamant |
| `fighting` | Rouge-orange #FF4422 | Étoile d'impact |
| `ghost` | Mauve #8844AA | Ombre fantôme estompée |
| `dragon` | Bleu-violet #6644FF | Orbe énergie |

Chaque forme utilise uniquement le canvas 2D API (arcs, lignes, gradients radiaux pour les glow). Pas de lib externe.

**Mise à jour des appels :**
- Dans `render()` (`src/gameLoop.ts`) :  
  `drawEnemyBullet(ctx, b)` → `drawEnemyBullet(ctx, b, game.grid.levelType)`
- Signature mise à jour dans l'import de `renderer.ts`

---

### 3. Fond "arène Pokémon" — `src/renderer.ts`

**Problème actuel :** `ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)` dans `render()`.  
**Solution :** `drawArenaBackground(ctx, levelType: string)` — fond en deux zones :

**Zone ciel (haut, 60% de l'écran) :**
- Gradient vertical de `#0a0018` (quasi-noir) à `#1a0a2e` (violet nuit profond)
- Quelques étoiles statiques ponctuelles (petits points blancs à positions fixes par seed)

**Zone arène / sol (bas, 40%) :**
- Sol avec lignes de perspective convergeant vers un point de fuite central
- Cercle de combat au centre (comme les arènes Pokémon classiques)
- Couleur de sol subtile selon le type du niveau (ex: sol doré pour électrique, rouge-orangé pour feu, bleu pour eau)

**Ligne d'horizon :** séparation nette entre ciel et sol.

Le fond doit rester **sombre et discret** — les sprites à 40×40 et le HUD vert doivent toujours dominer visuellement.

Signature : `function drawArenaBackground(ctx: CanvasRenderingContext2D, levelType: string): void`  
Appelée dans `render()` à la place du `fillRect` noir.  
Sur les écrans de menu/level-up/victory/etc. : inchangé (chaque écran efface lui-même son fond noir).

---

### 4. Police Press Start 2P — `index.html`

**1 ligne à ajouter dans `<head>` :**
```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

**Dans `src/renderer.ts` et `src/screens.ts` :** remplacer `'monospace'` par `'"Press Start 2P", monospace'` dans toutes les déclarations `ctx.font`.

⚠️ Press Start 2P est une police bitmap compacte — les tailles en px semblent plus petites. Prévoir d'ajuster légèrement les tailles (ex: 16px → 12px, 28px → 22px) et tester que rien ne déborde.

---

## Fichiers modifiés

- `index.html` — import Google Font
- `src/api/pokeapi.ts` — URL sprite direct, supprimer fetch par sprite
- `src/renderer.ts` — `drawEnemyBullet` par type, `drawArenaBackground`, police
- `src/screens.ts` — police Press Start 2P partout
- `src/gameLoop.ts` — passer `game.grid.levelType` à `drawEnemyBullet`

## Fichiers NON modifiés

- `src/types.ts`, `src/constants.ts`, `src/ui/modal.ts` — pas de changement
- `src/gameLoop.ts` — uniquement l'appel à `drawEnemyBullet` (1 ligne)

---

## Vérification

1. `npm run dev` → l'écran de chargement affiche les 151 sprites en haute résolution
2. En jeu : le fond arène s'affiche avec sol en perspective et ciel étoilé
3. Se faire toucher par une balle → vérifier la forme/couleur selon le type du niveau
4. Passer au niveau suivant (type différent) → balle ET couleur de sol changent
5. `npx tsc --noEmit` → zéro erreur TypeScript
6. Vérifier que la police Press Start 2P s'affiche bien sur tous les écrans (pas de débordement)
