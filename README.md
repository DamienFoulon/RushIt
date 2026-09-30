# RushIt

RushIt fabrique des vidéos de présentation de produit avec [Remotion](https://www.remotion.dev). Chaque vidéo est un dossier autonome, `videos/<nom>/`, avec son scénario, son thème, sa musique et ses scènes en React. On la rend en MP4 et on l'échange en `.rushit.zip`, avec la même version de RushIt pour la rendre à l'identique (voir « Rendu identique »).

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

## Rendu identique

Ce qui est garanti : sur une même machine, avec la même version de RushIt installée par `npm ci`, deux rendus d'une même vidéo ont les mêmes images et le même son, y compris après un aller-retour par `export` et `import`. Le test `test/e2e.test.ts` le vérifie image par image et sur le son décodé (lancer avec `RUSHIT_E2E=1`).

Pour y arriver, RushIt rend avec le navigateur que Remotion télécharge et son moteur graphique logiciel `swiftshader`, charge les polices depuis le dossier de la vidéo, et assemble le montage musical une fois pour toutes dans un fichier WAV que le film joue d'un bout à l'autre.

D'une machine à l'autre, l'identité n'est pas encore garantie, elle est mesurée. L'intégration continue rend « Carnet » en 640×360, écrit les empreintes de chaque image et du son (`npm run hashes -- <vidéo>`, qui produit `videos/<vidéo>/out/hashes.json`) et les compare à celles de la machine de référence, `test/fixtures/carnet-hashes-640.json`. Résultats à venir.
