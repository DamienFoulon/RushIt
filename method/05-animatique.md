# 5. Animatique

## But

Une maquette de travail, calée sur la musique, qui permet de juger le rythme avant de construire la moindre scène.

## Ce qu'on fait

1. Dans `index.tsx`, une entrée par scène du scénario : `id`, `title`, `at` (début visé en secondes), `texts` (la clé de `texts.ts`) et `component`. Au début, toutes les scènes peuvent pointer vers un composant vide.
2. Ouvrir `npm run studio -- <vidéo>`, composition `Animatic`. Chaque scène est une carte avec son titre et ses textes. Chaque coupe tombe sur le premier temps de mesure le plus proche de `at`.
3. Ajuster les `at` et les textes jusqu'à ce que la lecture ait le temps de se faire.

## Arrêt

**Obligatoire.** L'humain regarde et écoute l'animatique, et valide le rythme. Tant que le rythme n'est pas validé, on ne construit pas les scènes.

## Pièges connus

- Déplacer `at` d'un rien ne change parfois pas la coupe : elle saute d'une mesure à l'autre. C'est voulu.
- Si les coupes semblent décalées d'un temps, le problème vient de la grille, pas des scènes. Revenir à `method/03-musique.md`.
