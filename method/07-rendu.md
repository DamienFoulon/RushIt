# 7. Rendre

## But

Le fichier `videos/<vidéo>/out/<vidéo>.mp4`, avec son affiche `poster.jpg` placée en image 0.

## Ce qu'on fait

1. Lancer `npm run render -- <vidéo>`. Pour un essai rapide en petite taille : `--scale 0.333`. Pour le rendu final : `--quality max`, qui rend au double de la taille puis réduit, pour des textes et des bords nets. C'est environ quatre fois plus lent. `--scale` et `--quality max` ne vont pas ensemble.
   Le rendu lance d'abord la passe de contrôle complète. S'il reste une erreur, il refuse de rendre, résume les erreurs et donne le chemin de `qa/report.html`. Lire le rapport, corriger la scène en cause (voir `method/06-scenes.md`), relancer.
2. Ouvrir `out/poster.jpg`. Par défaut c'est l'image une seconde avant la fin. Pour en choisir une autre, régler `posterSeconds` dans `video.json` et relancer.
3. Regarder le MP4 en entier, avec le son.
4. Vérifier le crédit musical : si la licence l'exige (`creditRequired`), il s'affiche en bas de l'image un temps après le début de la dernière scène.

## Arrêt

Pas d'arrêt obligatoire. Montrer le rendu et l'affiche à l'humain avant de le dire fini.

## Pièges connus

- Un fichier déclaré dans `video.json` mais absent (police, morceau) arrête le rendu avant qu'il commence, avec son nom.
- Les fichiers `.raw.mp4` et `.raw4k.mp4` dans `out/` sont intermédiaires. Ils ne partent pas à l'export.
- `--force` rend malgré les erreurs. Le rapport le note (`forced` dans `qa/report.json`, « rendu forcé » dans `qa/report.html`). Ne s'en servir qu'avec l'accord de l'humain.
