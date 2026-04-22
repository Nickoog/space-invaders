# Pokemon Invaders

Un Space Invaders revisité sur le thème Pokémon, développé en TypeScript vanilla avec Vite.

## Concept

Les envahisseurs sont remplacés par les 151 Pokémon de la première génération, dont les sprites sont chargés en temps réel depuis [PokéAPI](https://pokeapi.co). Au lieu de tirer des lasers, le joueur lance des Pokéballs pour capturer les Pokémon.

Chaque niveau charge une nouvelle vague de 55 Pokémon (11 colonnes × 5 rangées). Les générations se succèdent en boucle sur les 151 Pokémon de Kanto.

## Contrôles

| Touche | Action |
|--------|--------|
| `←` / `→` | Déplacer le dresseur |
| `Espace` | Lancer une Pokéball |
| `Entrée` | Démarrer / Rejouer |

## Scoring

| Rangée | Points |
|--------|--------|
| 1ère (haut) | 30 pts |
| 2e et 3e | 20 pts |
| 4e et 5e (bas) | 10 pts |

## Règles

- Le joueur dispose de **3 vies**
- Une vie est perdue si un tir ennemi touche le dresseur
- La partie se termine si les Pokémon atteignent la ligne du joueur
- **4 boucliers** peuvent absorber les tirs (des deux côtés)
- Capturer tous les Pokémon d'une vague passe au niveau suivant

## Stack technique

- TypeScript (strict, sans framework)
- Canvas 2D pour le rendu (800 × 600)
- [PokéAPI](https://pokeapi.co) pour les sprites
- [Vite](https://vitejs.dev) comme bundler/dev server
- [Vitest](https://vitest.dev) pour les tests unitaires
- Cache `sessionStorage` pour éviter de re-télécharger les sprites

## Installation

```bash
npm install
```

## Lancement en développement

```bash
npm run dev
```

## Tests

```bash
# Lancer les tests une fois
npm test

# Mode watch (relance à chaque modification)
npm run test:watch
```

93 tests unitaires couvrent la logique pure du jeu (`Player`, `PokemonGrid`, `Bullets`, `Shields`, `Game.overlap`, `pokeapi.getIdsForLevel`).

## Build de production

```bash
npm run build
```

## Structure du projet

```
src/
├── api/
│   └── pokeapi.ts     # Chargement et cache des sprites PokéAPI
├── Bullets.ts         # Gestion des projectiles (Pokéballs et tirs ennemis)
├── collision.ts       # Détection de collision AABB (overlap)
├── constants.ts       # Constantes du jeu (dimensions, vitesses, scoring...)
├── Game.ts            # Factory createGame — état initial du jeu
├── gameLoop.ts        # Boucle principale, update, render, machine à états
├── input.ts           # Gestion du clavier
├── main.ts            # Point d'entrée, initialisation du canvas
├── Player.ts          # Déplacement et tir du joueur
├── PokemonGrid.ts     # Grille ennemie et déplacement des Pokémon
├── renderer.ts        # Fonctions de dessin (joueur, Pokémon, HUD...)
├── screens.ts         # Écrans de chargement, menu et game over
├── Shields.ts         # Boucliers destructibles
└── types.ts           # Interfaces TypeScript (Player, Grid, Bullet, GameState…)
```
