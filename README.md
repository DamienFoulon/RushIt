# RushIt

RushIt fabrique des vidéos de présentation de produit avec [Remotion](https://www.remotion.dev). Chaque vidéo est un dossier autonome, `videos/<nom>/`, avec son scénario, son thème, sa musique et ses scènes en React. On la rend en MP4 et on l'échange en `.rushit.zip` avec un rendu identique d'une machine à l'autre.

RushIt se pilote très bien avec un agent de code : il lit `AGENTS.md` et suit la méthode. Ce README s'adresse à qui travaille sans agent.

## Installation

```bash
nvm use          # Node 26, figé dans .nvmrc
npm ci           # versions exactes du verrou
npm run doctor   # Node, navigateur et ffmpeg de Remotion
```

`doctor` doit afficher `ok` sur chaque ligne.

## Licence de Remotion

RushIt est sous licence MIT. Remotion, dont il dépend, a sa propre licence : gratuite pour un particulier et pour une entreprise de trois personnes au plus, payante au-delà. Lire https://www.remotion.dev/license avant de l'utiliser dans une entreprise.

## Essayer l'exemple

```bash
npm run new -- demo --from carnet --rules neutre
npm run studio -- demo
npm run render -- demo
```

« Carnet » est une application de notes fictive, en quatre scènes d'une vingtaine de secondes. Le premier `new` télécharge son morceau.

## Les huit étapes

| Étape | Commande | Fiche |
|---|---|---|
| 1. Démarrer | `npm run new -- <nom> --rules createur\|neutre\|miennes\|vides` | `method/01-demarrer.md` |
| 2. Scénario | écrire `scenario.md` et `texts.ts` | `method/02-scenario.md` |
| 3. Musique | `npm run music -- add <nom> <fichier\|lien\|slug>` (voir `npm run music -- catalog`) | `method/03-musique.md` |
| 4. Thème | remplir `theme` dans `video.json` | `method/04-theme.md` |
| 5. Animatique | `npm run studio -- <nom>`, composition `Animatic` | `method/05-animatique.md` |
| 6. Scènes | un fichier par scène dans `scenes/`, puis composition `Film` | `method/06-scenes.md` |
| 7. Rendu | `npm run render -- <nom>` | `method/07-rendu.md` |
| 8. Partager | `npm run export -- <nom>` et `npm run import -- <fichier>` | `method/08-partager.md` |

Le scénario, la musique et le rythme de l'animatique se valident à l'oreille et à l'œil. Prendre le temps de les faire relire avant de construire les scènes.

Chaque commande accepte `--json` pour une sortie lisible par un programme.
