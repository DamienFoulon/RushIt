# 6. Construire les scènes

## But

Des scènes finies, une par fichier dans `scenes/`, qui suivent le scénario et le rythme validés.

## Ce qu'on fait

1. Une scène à la fois, dans l'ordre. Chaque composant reçoit `duration`, `beat` (images par temps) et `textsAt`.
2. Se servir de la grammaire du kit, importée de `rushit/kit` :
   - `ProductWindow` et ses plans (`shots`), avec `WIDE(layout)` pour l'écran entier.
   - `Pointer` pour guider le regard, `Keys` pour ce qui se fait au clavier.
   - `typed` pour un texte qui se tape, `at(beat, n)` pour placer un geste sur le n-ième temps, `progress` pour une transition.
   - `useEase` pour la courbe de la vidéo, `useLayout` pour la mise en page du thème.
3. Remplacer le composant vide de la scène dans `index.tsx`.
4. Regarder la scène dans `npm run studio -- <vidéo>`, composition `Film`, au début, au milieu et à la fin.

## Arrêt

Pas d'arrêt obligatoire. Suivre `rules.md` pour les écarts, et montrer chaque scène finie si les règles le demandent.

## Pièges connus

- Tout ce qui bouge dépend de `useCurrentFrame()`. Jamais `Date.now()`, jamais `Math.random()` : le rendu doit être identique d'une machine à l'autre.
- Les images sont locales à la scène : l'image 0 est le début de la scène, pas celui du film.
- La passe de contrôle automatique arrive au lot 2 et les bruitages au lot 4. En attendant, regarder soi-même chaque scène aux trois moments, et vérifier qu'aucun texte ne touche un bord.
