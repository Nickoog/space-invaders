# Pokemon Invaders

Un Space Invaders revisité sur le thème Pokémon, développé en JavaScript vanilla avec Vite.

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

- JavaScript ES Modules (vanilla, sans framework)
- Canvas 2D pour le rendu (800 × 600)
- [PokéAPI](https://pokeapi.co) pour les sprites
- [Vite](https://vitejs.dev) comme bundler/dev server
- Cache `sessionStorage` pour éviter de re-télécharger les sprites

## Installation

```bash
npm install
```

## Lancement en développement

```bash
npm run dev
```

## Build de production

```bash
npm run build
```

## Structure du projet

```
src/
├── api/
│   └── pokeapi.js     # Chargement et cache des sprites PokéAPI
├── Bullets.js         # Gestion des projectiles (Pokéballs et tirs ennemis)
├── constants.js       # Constantes du jeu (dimensions, vitesses, scoring...)
├── Game.js            # Boucle principale, logique de jeu et collisions
├── input.js           # Gestion du clavier
├── main.js            # Point d'entrée, initialisation du canvas
├── Player.js          # Déplacement et tir du joueur
├── PokemonGrid.js     # Grille ennemie et déplacement des Pokémon
├── renderer.js        # Fonctions de dessin (joueur, Pokémon, HUD...)
├── screens.js         # Écrans de chargement, menu et game over
└── Shields.js         # Boucliers destructibles
```
