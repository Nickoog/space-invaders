# Plan : Personnalisation du jeu pour les 17 ans de Flavien

## Contexte

Le jeu est un Space Invaders à base de Pokémon offert en cadeau d'anniversaire pour Flavien (17 ans). L'objectif est de le personnaliser : limiter à 17 niveaux avec une vraie condition de victoire, pré-remplir le profil, afficher des messages personnels avec photos entre certains niveaux, et un écran de victoire animé.

Flavien est fan de gaming et de réseaux sociaux → les questions IA seront orientées dans ce sens.

---

## Changements implémentés

### 1. Constantes — `src/constants.ts`
- `MAX_LEVELS = 17`
- `VICTORY` et `INTERLUDE` ajoutés à l'objet `S`
- `VICTORY_DELAY_MS = 2000`

### 2. Config des interludes — `src/interludes.ts`
Fichier de configuration avec les messages personnels et photos, déclenché après certains niveaux.
Les interludes se déclenchent après les niveaux 4, 8, 12 et 16.

**Pour personnaliser :**
- Modifier les `message` dans `src/interludes.ts`
- Déposer les photos dans `public/interludes/` (JPG/PNG)
- Mettre à jour le champ `photo` avec le nom du fichier

### 3. Boucle de jeu — `src/gameLoop.ts`
- Après le niveau 17, transition vers `VICTORY` (avec stats sauvegardées)
- Après certains niveaux, transition vers `INTERLUDE` (message + photo)
- Mode difficile : 2 questions en séquence par touche ennemie
- `startGame(game, hardMode?)` accepte le flag de difficulté

### 4. Écrans — `src/renderer.ts` + `src/screens.ts`
- `renderInterludeScreen()` : photo centrée + message + "Appuie sur Entrée"
- `renderVictoryScreen()` : "JOYEUX ANNIVERSAIRE FLAVIEN !", "17 ANS !", confettis canvas, score
- `renderLevelUpScreen()` : affiche "DERNIER NIVEAU !" quand on arrive au niveau 17
- HUD : "NIV. X / 17" + badge "★ MODE HARD" en mode difficile

### 5. Profil pré-rempli — `src/profiles.ts` + `src/main.ts`
- `ensureFlavienProfile()` crée automatiquement le profil FLAVIEN au premier lancement
- `{ pseudo: "FLAVIEN", age: 17, interests: ["gaming", "réseaux sociaux", "jeux vidéo"] }`

### 6. Mode difficile après la victoire (New Game+)
Sur l'écran `VICTORY` :
- **[Entrée]** → rejouer en MODE HARD (2 questions par touche ennemie)
- **[Échap]** → retour au menu

---

## Fichiers modifiés
- `src/constants.ts`
- `src/types.ts`
- `src/Game.ts`
- `src/profiles.ts`
- `src/main.ts`
- `src/gameLoop.ts`
- `src/renderer.ts`
- `src/screens.ts`
- `src/interludes.ts` (nouveau)
- `public/interludes/` (nouveau dossier — déposer les photos ici)

---

## Pour personnaliser les interludes

Ouvrir `src/interludes.ts` et modifier :
```ts
export const INTERLUDES: InterludeConfig[] = [
  { afterLevel: 4,  message: "Ton message ici...", photo: 'photo1.jpg' },
  // ...
];
```

Puis déposer les photos (JPG/PNG) dans `public/interludes/`.

## Vérification
1. Lancer le jeu → le profil "FLAVIEN" doit être pré-créé
2. Compléter le niveau 4 → l'écran interlude s'affiche
3. Entrée → reprendre normalement
4. Compléter le niveau 17 → écran VICTOIRE animé
5. Entrée → rejouer en MODE HARD (2 questions par touche)
6. Échap → retour au menu
7. En MODE HARD, vérifier que 2 questions s'enchaînent quand un ennemi touche le joueur
