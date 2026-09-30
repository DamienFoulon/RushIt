# 4. Poser le thème

## But

Le bloc `theme` de `video.json` rempli avec les couleurs, les polices et la mise en page du produit présenté.

## Ce qu'on fait

1. Couleurs : `theme.colors`. Les noms sont libres (minuscules, chiffres et tirets). Chaque nom devient une variable CSS : `accent` donne `--accent`. Reprendre les valeurs du code du produit.
2. Polices : copier les fichiers dans `assets/fonts/`, avec leur licence à côté, puis les déclarer dans `theme.fonts` (`family`, `file`, `weight`).
3. Mise en page : `theme.layout`. `stage` est la zone où vit la fenêtre du produit, `window` sa taille logique avant mise à l'échelle, `textColumn` la colonne de texte. Sans `textColumn`, les textes ne s'affichent pas.
4. Courbe d'accélération propre à la vidéo, si besoin : `theme.ease`, quatre nombres de `cubic-bezier`.
5. Vérifier dans `npm run studio -- <vidéo>`.

## Arrêt

Pas d'arrêt obligatoire. Suivre `rules.md` pour les écarts.

## Pièges connus

- Jamais une police système ni un CDN : un fichier déclaré mais absent arrête le rendu avec une erreur qui le nomme, sans police de repli.
- Ne pas reprendre les couleurs ou les polices d'une autre vidéo, ni celles de l'exemple. Le look vient du produit présenté.
- Une police sans licence connue ne s'embarque pas. Demander à l'humain.
