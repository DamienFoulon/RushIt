# 7. Rendre

## But

Le fichier `videos/<vidéo>/out/<vidéo>.mp4`, avec son affiche `poster.jpg` placée en image 0.

## Ce qu'on fait

1. Lancer `npm run render -- <vidéo>`. Pour un essai rapide en petite taille : `--scale 0.333`.
2. Ouvrir `out/poster.jpg`. Par défaut c'est l'image une seconde avant la fin. Pour en choisir une autre, régler `posterSeconds` dans `video.json` et relancer.
3. Regarder le MP4 en entier, avec le son.
4. Vérifier le crédit musical : si la licence l'exige (`creditRequired`), il s'affiche pendant la dernière scène.

## Arrêt

Pas d'arrêt obligatoire. Montrer le rendu et l'affiche à l'humain avant de le dire fini.

## Pièges connus

- Un fichier déclaré dans `video.json` mais absent (police, morceau) arrête le rendu avant qu'il commence, avec son nom.
- Le fichier `.raw.mp4` dans `out/` est intermédiaire. Il ne part pas à l'export.
