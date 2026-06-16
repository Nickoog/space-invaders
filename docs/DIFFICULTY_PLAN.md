# Plan : Difficulté accrue — Questions omniprésentes

## Contexte

Le jeu ne déclenche des questions que lorsqu'une balle ennemie touche le joueur, ce qui peut être rare si on esquive bien. Le but est de rendre les questions centrales au gameplay. Deux mécaniques combinées :

1. **Quiz pré-niveau** — avant chaque niveau, le joueur répond à des questions pour gagner ses pokéballs. Le quiz tourne en boucle jusqu'à atteindre le quota du niveau. Plus on avance, plus le quota est élevé = plus de questions à répondre avant de jouer.
2. **Questions à la capture** — chaque Pokémon du bon type attrapé déclenche une question pour valider la capture. Bonne réponse = capture confirmée + score. Mauvaise réponse = Pokémon relâché (reste vivant, aucun point).

---

## Flux de jeu complet

```
LEVEL_UP → S.PRE_LEVEL_QUIZ
  ┌─ Affiche quota du niveau (ex: 12 pokéballs pour niveau 5)
  │  Affiche pokéballs accumulées jusqu'ici
  │  Déclenche une question
  │  Correct → game.ammo += 3
  │  Mauvais → game.ammo += 0  (continue à demander)
  └─ Répète jusqu'à game.ammo >= levelAmmoQuota(level)
     → S.PLAYING (niveau commence)

S.PLAYING : Pokéball touche ennemi du bon type
  → enemy.pendingCapture = true
  → S.QUESTION [timer 15 s]
  → Correct : capture confirmée, score
  → Mauvais  : ennemi relâché (reste vivant)
  → S.PLAYING

S.PLAYING : ammo === 0 + Espace pressé
  → S.QUESTION (question de recharge rapide)
  → Correct : game.ammo += 3
  → Mauvais  : game.ammo += 1  (pénalité légère)
  → S.PLAYING
```

### Mauvais type — inchangé
Pénalité feu immédiate, pas de question.

---

## Quota de pokéballs par niveau

Formule : `quota = 6 + (level - 1) * 2`

| Niveaux | Quota | Réponses correctes min. |
|---------|-------|-------------------------|
| 1       | 6     | 2                       |
| 5       | 14    | 5                       |
| 9       | 22    | 8                       |
| 13      | 30    | 10                      |
| 17      | 38    | 13                      |

Si le joueur rate des questions, le quiz continue — il répondra plus de questions avant de jouer.

---

## Nouveau state : `S.PRE_LEVEL_QUIZ`

À ajouter dans `src/constants.ts` (objet `S`) :
```ts
PRE_LEVEL_QUIZ: 'PRE_LEVEL_QUIZ'
```

---

## Fichiers à modifier

### `src/constants.ts`
```ts
export const AMMO_PER_CORRECT_QUIZ    = 3;   // quiz pré-niveau
export const AMMO_PER_CORRECT_RELOAD  = 3;   // recharge mid-level
export const AMMO_PER_WRONG_RELOAD    = 1;
export const AMMO_QUOTA_BASE          = 6;
export const AMMO_QUOTA_PER_LEVEL     = 2;
export const CAPTURE_QUESTION_SEC     = 15;
// Objet S : ajouter PRE_LEVEL_QUIZ: 'PRE_LEVEL_QUIZ'
```

### `src/types.ts`
- Dans le type `Enemy` : ajouter `pendingCapture: boolean`
- Dans `GameState` : ajouter `ammo: number`, `ammoQuota: number`

### `src/PokemonGrid.ts`
Initialiser `pendingCapture: false` dans chaque ennemi.

### `src/Game.ts`
Initialiser `ammo: 0`, `ammoQuota: 0`.

### `src/ui/modal.ts`
Ajouter un paramètre optionnel `timerSec = 25` à `showQuestionModal()`.

### `src/gameLoop.ts`

**`startLevel()` :** au lieu de passer à `S.PLAYING`, passer à `S.PRE_LEVEL_QUIZ` + calculer `game.ammoQuota = AMMO_QUOTA_BASE + (level - 1) * AMMO_QUOTA_PER_LEVEL`, `game.ammo = 0`.

**Nouvelle fonction `askPreLevelQuestion(game)` :**
```ts
function askPreLevelQuestion(game: GameState): void {
  const question = game.questionPool.shift() ?? getRandomFallback();
  showQuestionModal(question, (correct) => {
    if (correct) game.ammo += AMMO_PER_CORRECT_QUIZ;
    if (game.ammo >= game.ammoQuota) {
      game.state = S.PLAYING;  // quota atteint → on joue
    } else {
      askPreLevelQuestion(game);  // pas encore → question suivante
    }
    void replenishPool(game);
  });
}
```

**Boucle principale :** gérer `S.PRE_LEVEL_QUIZ` :
```ts
} else if (game.state === S.PRE_LEVEL_QUIZ) {
  renderPreLevelQuizScreen(ctx, game.ammo, game.ammoQuota, game.level);
  // La question est déclenchée une fois à l'entrée du state dans startLevel()
}
```

**Tir (dans `update()`) :**
- Ne créer une pokéball que si `game.ammo > 0`, décrémenter à chaque tir
- Si `game.ammo === 0` + Space pressé → `triggerReloadQuestion(game)`

**Collision pokéball vs ennemi :**
- `e.correctType && !e.pendingCapture` → `triggerCaptureQuestion(game, e)` (pas de score immédiat)
- `!e.correctType` → comportement actuel

**Nouvelles fonctions `triggerCaptureQuestion` et `triggerReloadQuestion`** — voir flux ci-dessus.

**Level clear check :** ignorer les ennemis `pendingCapture = true` dans le décompte.

### `src/screens.ts`
Ajouter `renderPreLevelQuizScreen(ctx, ammo, quota, level, levelType)` :

**Layout :**
```
┌─────────────────────────────────────┐
│  NIVEAU X — GAGNE TES POKÉBALLS !   │  ← titre
│                                     │
│  ← → Bouger   |   ESPACE Tirer      │  ← rappel contrôles
│                                     │
│  Attrape les Pokémon [TYPE] !       │  ← objectif du niveau
│  (Évite ceux avec une teinte rouge) │
│  Chaque capture = une question      │  ← règles clés
│  Balle ennemie reçue = une question │
│  Plus de Pokéballs ? ESPACE → quiz  │
│                                     │
│  POKÉBALLS : ●●●○○○○○○○○○  6/12    │  ← progression ammo
│  Bonne réponse → +3  |  Mauvais → 0│
│                                     │
│  [question modale s'affiche ici]    │
└─────────────────────────────────────┘
```

Au niveau 1 uniquement : texte d'intro légèrement plus long avec "Bienvenue, Flavien !" avant les règles.

### `src/renderer.ts` — HUD
Afficher `game.ammo` dans le HUD (ex : `×12` à côté d'une icône pokéball).

---

## Estimation des questions par niveau (niveau 9, quota=22)

| Source | Nombre |
|--------|--------|
| Quiz pré-niveau (quota 22, ~70% correct) | ~11 questions |
| Captures (~20 Pokémon, timer 15 s) | ~20 questions |
| Recharge mid-level si manque d'ammo | 2–5 questions |
| Se faire toucher | 2–3 questions |
| **Total niveau 9** | **~35 questions** |

---

## Vérification

1. `npx tsc --noEmit` → zéro erreur TypeScript
2. Fin de niveau → écran quiz pré-niveau suivant s'affiche
3. Répondre correctement → barre progresse, quota atteint → niveau démarre
4. Rater → barre ne bouge pas, question suivante immédiate
5. Tirer toutes les pokéballs → Espace déclenche question de recharge
6. Attraper ennemi du bon type → modal capture 15 s
7. Mauvaise réponse capture → ennemi reste vivant
8. Mauvais type → pénalité feu seule, pas de question
9. `npm run build` → build propre
