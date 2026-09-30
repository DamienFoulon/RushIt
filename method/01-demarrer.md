# 1. Démarrer une vidéo

## But

Un dossier `videos/<nom>/` prêt à recevoir le scénario, avec les règles de travail choisies par l'humain.

## Ce qu'on fait

1. Vérifier l'installation : `npm run doctor`. Chaque ligne doit commencer par `ok`. Sinon, corriger d'abord (version de Node dans `.nvmrc`, puis `npm ci`).
2. Demander à l'humain comment il veut travailler. Trois choix, plus un gabarit :
   - `createur` : les règles de l'auteur de RushIt, exigeantes sur le texte et le rythme.
   - `neutre` : des valeurs prudentes, sans parti pris de style.
   - `miennes` : les règles qu'il a enregistrées dans `~/.rushit/rules.md`.
   - `vides` : un gabarit à remplir ensemble, une rubrique à la fois. Chaque question a deux exemples de réponse. Ne pas répondre à sa place.
3. Créer la vidéo : `npm run new -- <nom> --rules <choix>`. Pour partir de l'exemple : `npm run new -- <nom> --rules <choix> --from carnet`.
4. Lire la sortie. Un nom avec espaces, majuscules ou accents devient un nom de dossier sûr (`Présentation Atelier` donne `presentation-atelier`) et la commande le dit. Utiliser ce nom-là ensuite.
5. Lire `videos/<nom>/rules.md` en entier avant d'aller plus loin.

## Arrêt

Pas d'arrêt obligatoire. Mais le choix des règles revient à l'humain : `new` refuse de démarrer sans `--rules`, et l'agent pose la question plutôt que de choisir.

## Pièges connus

- L'inspection automatique du produit arrive au lot 3. En attendant, lire soi-même le code du produit présenté pour repérer ses couleurs, ses polices et ses écrans, et noter d'où vient chaque valeur.
- `--from carnet` télécharge le morceau de l'exemple depuis le catalogue s'il manque. Il faut donc une connexion la première fois.
- `new` refuse une vidéo qui existe déjà. Choisir un autre nom, ne jamais effacer le dossier existant.
