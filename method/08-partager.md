# 8. Partager ou retoucher une vidéo reçue

## But

Envoyer une vidéo à quelqu'un, ou reprendre une vidéo reçue avec un rendu identique à celui de son auteur.

## Ce qu'on fait

Pour envoyer :

1. `npm run export -- <vidéo>` produit `<vidéo>.rushit.zip` à la racine du dépôt.
2. L'envoyer par n'importe quel moyen.

Pour recevoir :

1. `npm run import -- <fichier.rushit.zip>`, avec un chemin absolu ou relatif à la racine du dépôt. Si une vidéo du même nom existe déjà, ajouter `--as <autre nom>`.
2. Lire le conseil de version. Si la vidéo a été faite avec une autre version de RushIt, la sortie donne la commande pour s'aligner.
3. `npm run render -- <vidéo>` avant toute retouche, pour vérifier que le rendu est bien le même.
4. Retoucher en suivant le `rules.md` de la vidéo, pas ses propres habitudes.

## Arrêt

Pas d'arrêt obligatoire. Si l'import refuse le zip, le dire à l'humain avec le message exact.

## Pièges connus

- L'import refuse un zip dont un fichier est altéré, manquant ou en trop, ou dont un nom ou un chemin sortirait du dossier de la vidéo. Ne pas contourner : demander un nouvel export.
- Un rendu différent vient presque toujours d'une version différente de RushIt ou de ses paquets. S'aligner avant de chercher ailleurs.
