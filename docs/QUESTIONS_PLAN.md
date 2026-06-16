# Plan : Refonte des questions (prompt simplifié, meilleure qualité)

## Contexte

Les questions générées par l'IA sont de mauvaise qualité : le prompt actuel est trop vague, la température est trop haute (0.9), et la personnalisation dynamique (âge, intérêts, contexte de jeu) ne produit pas de résultats cohérents. De plus, les contraintes de longueur (≤12 mots / ≤4 mots) génèrent des questions et réponses tronquées et bancales.

**Décision :** remplacer par un prompt fixe et ciblé sur l'univers de Flavien (Pokémon, gaming, réseaux sociaux, culture ado), sans personnalisation dynamique. Style : mix humour + trivia.

---

## Changements

### 1. `src/ai/questionService.ts` — Nouveau prompt simplifié

**Supprimer :**
- `ageProfile()` (helper de description d'âge en 6 tranches)
- `buildGameContext()` (contexte de jeu aléatoire, ex. "encerclé par des Magicarpes")
- Les paramètres `interests`, `age`, `context` de `generateQuestion()`
- La logique qui construit le user prompt dynamique

**Nouveau system prompt (fixe) :**
```
Tu es un quiz master pour un jeu Pokémon Invaders.
Génère une question de culture générale fun pour un ado de 17 ans.
Thèmes à varier : Pokémon, jeux vidéo, TikTok/YouTube/réseaux sociaux, films/séries, sport, culture pop.
Format : 1 question (≤60 caractères), 4 réponses courtes (≤25 caractères chacune), 1 correcte, 3 plausibles.
Style : mélange questions factuelles sérieuses et questions drôles/absurdes.
Langue : français uniquement.
```

**Nouveau user prompt (fixe) :**
```
Génère une question.
```

**Autres ajustements :**
- Temperature : `0.9` → `0.7`
- Contraintes de longueur dans le post-processing : question 80 chars, options 30 chars (inchangé)

**Signature `generateQuestion` simplifiée :**
```ts
async function generateQuestion(): Promise<QuestionData>
```

**`replenishPool(game)`** : supprimer l'extraction de `game.activeProfile?.interests` et `game.activeProfile?.age`.

### 2. `src/ai/fallbackQuestions.ts` — Banque de questions améliorée

Remplacer les 20 questions génériques par ~40 questions thématiques de qualité, réparties en :
- **Pokémon** (types, Pokédex, films, jeux, attaques emblématiques)
- **Gaming** (Minecraft, Fortnite, GTA, FIFA, dates de sortie, personnages)
- **Réseaux sociaux** (TikTok, YouTube, Instagram, créateurs)
- **Culture ado** (Netflix, Marvel, musique rap, mèmes)
- **Questions drôles** (absurdes mais avec une vraie réponse)

---

## Fichiers modifiés
- `src/ai/questionService.ts` — prompt simplifié, paramètres supprimés, température baissée
- `src/ai/fallbackQuestions.ts` — nouvelle banque de ~40 questions thématiques

## Fichiers NON modifiés
- `src/ai/onboarding.ts` — laissé intact (le profil FLAVIEN est créé automatiquement)
- `src/constants.ts`, `src/types.ts`, `src/ui/modal.ts` — aucun changement nécessaire
- `src/gameLoop.ts` — `replenishPool(game)` est appelé de la même façon

---

## Vérification
1. Lancer le jeu avec `npm run dev`
2. Se faire toucher par un ennemi → vérifier que la question porte sur Pokémon / gaming / réseaux sociaux
3. Se faire toucher plusieurs fois → vérifier la variété des thèmes
4. Tester en coupant le réseau (DevTools → Network → Offline) → fallback questions de bonne qualité
5. Vérifier en console que les appels API génèrent des questions sans erreur de parsing
