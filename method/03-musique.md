# 3. Choisir la musique

## But

Un morceau choisi par l'humain, analysé et monté à la durée de la vidéo, avec sa licence et son crédit enregistrés dans `video.json`.

## Ce qu'on fait

1. Demander à l'humain un morceau. Soit il fournit un fichier ou un lien, soit il choisit dans le catalogue : `npm run music -- catalog`.
2. Lancer l'analyse et le montage :
   - morceau du catalogue : `npm run music -- add <vidéo> <slug>`
   - fichier ou lien : `npm run music -- add <vidéo> <fichier|lien> --licence "…" [--credit "…"]`. Un chemin relatif part de la racine du dépôt.
3. Lire la sortie : tempo, montage proposé, durée du film. Un avertissement (morceau plus court que la durée visée, par exemple) se transmet tel quel à l'humain.
4. Ouvrir l'animatique pour l'écoute : `npm run studio -- <vidéo>`, composition `Animatic`. Le témoin en bas à droite clignote sur chaque premier temps de mesure.

## Arrêt

**Obligatoire.** Un agent n'entend pas la musique. L'humain écoute dans l'animatique et valide le morceau, le montage et le calage des mesures.

S'il faut corriger :

- le témoin tombe à côté du premier temps : `npm run music -- shift <vidéo> --beats <N>` (N entier, négatif pour reculer), puis réécouter.
- le montage ne convient pas : relancer `music add` avec `--segments '[[a,b],[c,d]]'` (secondes du morceau, jouées bout à bout), ou avec `--downbeat-offset <secondes>`.

## Pièges connus

- La grille des mesures est une proposition, jamais une vérité. Seule l'écoute de l'humain la valide.
- Certains morceaux du catalogue n'ont pas de lien de téléchargement. L'humain le télécharge depuis la page du morceau, puis on passe le fichier avec `--licence` et `--credit`.
- Sans `--licence`, `music add` refuse. Ne jamais inventer une licence.
- `music add` assemble le montage une fois pour toutes dans `audio/<morceau>.edit.wav`, que le film joue d'un bout à l'autre. Ne pas modifier ce fichier à la main : changer le montage passe par `music add`.
