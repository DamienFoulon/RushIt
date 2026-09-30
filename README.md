# RushIt

Des vidéos de présentation de produit, faites avec [Remotion](https://www.remotion.dev), qu'on se passe entre collègues comme on se passe un fichier.

## Quoi

RushIt est une boîte à outils pour fabriquer la vidéo qui présente un produit logiciel : une minute ou deux, en 1920×1080, calée sur une musique, où l'on voit l'application servir à quelque chose.

Chaque vidéo est un dossier autonome, `videos/<nom>/`. Il contient tout ce qu'il faut pour la rouvrir et la rendre : le scénario, les textes, le thème (couleurs, polices, mise en page), la musique et son montage, les scènes écrites en React. On la rend en MP4, et on l'envoie à quelqu'un d'autre sous la forme d'un fichier `<nom>.rushit.zip`, par le moyen qu'on veut.

Le dépôt fournit :

- un **kit** de mise en scène : colonne de texte, fenêtre du produit avec caméra, pointeur, touches du clavier, calage des scènes sur la musique
- des **commandes** pour créer une vidéo, analyser et monter un morceau, prévisualiser, rendre, exporter et importer
- une **méthode** écrite, étape par étape, dans `method/`, lisible par un humain comme par un agent de code
- un **exemple** complet, « Carnet », une application de notes fictive.

## Pourquoi

Une bonne vidéo de présentation demande du métier : un scénario court, un rythme tenu, des textes qu'on a le temps de lire, un produit montré proprement. Ce métier se perd quand chacun repart de zéro.

RushIt garde ce métier dans un outil. La méthode dit dans quel ordre travailler et où s'arrêter pour faire valider. Le kit évite de réinventer la caméra ou le calage sur la musique. Les règles de mise en scène (longueur des phrases, temps de lecture, place du texte) sont écrites et voyagent avec la vidéo.

Il règle aussi un problème pratique : retoucher la vidéo de quelqu'un d'autre. Un MP4 ne se retouche pas. Un `.rushit.zip` si, et il se rend à l'identique chez celui qui le reçoit, parce que tout ce dont la vidéo dépend est dans le fichier et que les versions sont figées.

## Pour qui

Pour une équipe qui fabrique des produits logiciels et veut les présenter elle-même :

- celui qui fait la vidéo de son produit, sans connaître Remotion, avec l'agent de code de son choix (Claude Code, Codex, Gemini CLI, Cursor…) qui suit `AGENTS.md` et la méthode
- celui qui reçoit la vidéo d'un collègue pour la reprendre, l'ajuster à sa demande, la traduire
- le développeur à l'aise avec React, qui préfère écrire ses scènes à la main.

Aucun look n'est imposé : couleurs, polices et mise en page viennent du produit présenté. Aucun agent n'est imposé : les consignes sont dans `AGENTS.md`, que lisent la plupart des agents. Aucune clé d'API n'est nécessaire.

## Comment

### Installer

```bash
nvm use          # Node 26, figé dans .nvmrc
npm ci           # versions exactes du verrou
npm run doctor   # Node, navigateur et ffmpeg de Remotion
```

`doctor` doit afficher `ok` sur chaque ligne.

### Essayer l'exemple

```bash
npm run new -- demo --from carnet --rules neutre
npm run studio -- demo
npm run render -- demo
```

Le premier `new` télécharge le morceau de l'exemple. Le rendu arrive dans `videos/demo/out/demo.mp4`.

### Faire sa vidéo

| Étape | Commande | Fiche |
|---|---|---|
| 1. Démarrer | `npm run new -- <nom> --rules createur\|neutre\|miennes\|vides` | `method/01-demarrer.md` |
| 2. Scénario | écrire `scenario.md` et `texts.ts` | `method/02-scenario.md` |
| 3. Musique | `npm run music -- add <nom> <fichier\|lien\|slug>` | `method/03-musique.md` |
| 4. Thème | remplir `theme` dans `video.json` | `method/04-theme.md` |
| 5. Animatique | `npm run studio -- <nom>`, composition `Animatic` | `method/05-animatique.md` |
| 6. Scènes | un fichier par scène dans `scenes/`, composition `Film` | `method/06-scenes.md` |
| 7. Rendu | `npm run render -- <nom>` | `method/07-rendu.md` |
| 8. Partager | `npm run export -- <nom>`, `npm run import -- <fichier>` | `method/08-partager.md` |

Trois étapes se valident par un humain, à l'œil et à l'oreille, avant d'aller plus loin : le scénario, le choix de la musique, le rythme de l'animatique.

Les règles de mise en scène se choisissent à la création : les vôtres (le gabarit `vides` pose les questions), un jeu neutre, ou celui du créateur du dépôt, qui n'a pas valeur de référence.

Chaque commande accepte `--json`, pour qu'un agent ou un script lise sa sortie.

### Avec un agent de code

Ouvrir le dépôt avec son agent et lui demander, par exemple : « Fais une vidéo de présentation de mon application, le projet est dans `~/projets/mon-app` ». L'agent lit `AGENTS.md`, suit la méthode, et s'arrête aux trois validations.

## Rendu identique

Garanti : sur une même machine, avec la même version de RushIt installée par `npm ci`, deux rendus d'une même vidéo ont les mêmes images et le même son, y compris après un aller-retour par `export` et `import`. Le test `test/e2e.test.ts` le vérifie image par image et sur le son décodé (le lancer avec `RUSHIT_E2E=1`).

Pour y arriver, RushIt rend avec le navigateur que Remotion télécharge et son moteur graphique logiciel `swiftshader`, charge les polices depuis le dossier de la vidéo, et assemble le montage musical une fois pour toutes dans un fichier WAV que le film joue d'un bout à l'autre.

D'une machine à l'autre, l'identité est mesurée, pas encore garantie. L'intégration continue rend « Carnet » en 640×360, écrit les empreintes de chaque image et du son (`npm run hashes -- <vidéo>`) et les compare à celles de la machine de référence (`test/fixtures/carnet-hashes-640.json`).

## Ce qui arrive

RushIt se construit par lots. Celui-ci est le socle. Viennent ensuite :

- une passe de contrôle automatique, qui repère textes superposés, coupés, trop petits ou trop brefs avant le rendu
- l'affichage du vrai produit, compilé ou capturé depuis son code, isolé dans la vidéo
- des bruitages choisis par intention, et des sons de mouvement fabriqués sur mesure
- la recherche de musique libre de droits
- une grammaire de mouvement pour viser le niveau des présentations de produit des grands éditeurs.

## Licences

RushIt est sous licence MIT.

Remotion, dont il dépend, a sa propre licence : gratuite pour un particulier et pour une entreprise de trois personnes au plus, payante au-delà. Lire https://www.remotion.dev/license avant de l'utiliser dans une entreprise.

Les morceaux de musique ne sont pas dans le dépôt. `catalog/music.json` n'en garde que les références (titre, auteur, licence, lien). Un morceau voyage dans le `.rushit.zip` de la vidéo qui l'utilise, avec sa licence et son crédit.
