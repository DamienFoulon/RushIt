# RushIt, consignes pour l'agent

RushIt fabrique des vidéos de présentation de produit avec Remotion. Une vidéo est un dossier `videos/<nom>/` autonome, qu'on partage en `.rushit.zip`.

## Avant tout

- Lire `rules.md` de la vidéo. Il dit comment l'humain veut travailler : « s'arrêter et demander à chaque écart » ou « trancher et signaler à la fin ». Le respecter.
- Trois arrêts sont obligatoires, quelles que soient les règles : faire valider le **scénario**, faire écouter et choisir la **musique**, faire valider le **rythme** sur l'animatique. Un agent ne peut pas les juger seul.

## Garde-fous

- Ne rien inventer sur le produit : fonctions, chiffres et témoignages viennent du code ou de l'humain.
- Données de démo seulement. Ne jamais lire `.env`, clés ou secrets, ni afficher une vraie adresse e-mail ou un vrai nom.
- Tout ce qui bouge dépend de `useCurrentFrame()`, jamais d'une horloge ni de `Math.random()`.
- Ne jamais imposer le look d'une autre vidéo : couleurs, polices et mise en page viennent du produit présenté.
- Après chaque scène, lancer `check --scene`. Ne jamais passer `--force` sans l'accord de l'humain.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run doctor` | vérifie l'installation |
| `npm run new -- <nom> --rules createur\|neutre\|miennes\|vides [--from carnet]` | crée une vidéo (demander à l'humain quelles règles) |
| `npm run music -- add <vidéo> <fichier\|lien\|slug du catalogue> [--licence …] [--credit …]` | analyse et monte le morceau |
| `npm run music -- shift <vidéo> --beats <N>` | décale les premiers temps de N temps si le témoin de mesure tombe à côté |
| `npm run music -- catalog` | liste les morceaux de référence |
| `npm run studio -- <vidéo>` | ouvre Remotion Studio (compositions `Animatic` et `Film`) |
| `npm run check -- <vidéo> [--scene <id>] [--every <s>] [--accept <id> --reason "…"] [--open]` | passe de contrôle : signale textes superposés, coupés, trop petits, trop brefs, attentes non tenues, écrit `qa/report.html` |
| `npm run render -- <vidéo> [--scale 0.333] [--force]` | lance la passe complète, puis rend `videos/<vidéo>/out/<vidéo>.mp4` et son affiche s'il ne reste aucune erreur |
| `npm run export -- <vidéo>` | produit `<vidéo>.rushit.zip` |
| `npm run import -- <fichier> [--as <nom>]` | importe une vidéo reçue |

Chaque commande accepte `--json`. Aucune ne pose de question : quand une option manque, l'erreur la nomme. Poser alors la question à l'humain plutôt que de choisir à sa place.

## Quelle fiche lire

| Étape | Fiche |
|---|---|
| Démarrer une vidéo | `method/01-demarrer.md` |
| Écrire le scénario | `method/02-scenario.md` |
| Choisir la musique | `method/03-musique.md` |
| Poser le thème | `method/04-theme.md` |
| Animatique | `method/05-animatique.md` |
| Construire les scènes | `method/06-scenes.md` |
| Rendre | `method/07-rendu.md` |
| Partager ou retoucher une vidéo reçue | `method/08-partager.md` |
