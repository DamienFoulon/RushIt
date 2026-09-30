# 6. Construire les scènes

## But

Des scènes finies, une par fichier dans `scenes/`, qui suivent le scénario et le rythme validés.

## Ce qu'on fait

1. Une scène à la fois, dans l'ordre. Chaque composant reçoit `duration`, `beat` (images par temps) et `textsAt`.
2. Se servir de la grammaire du kit, importée de `rushit/kit` :
   - `ProductWindow` et ses plans (`shots`), avec `WIDE(layout)` pour l'écran entier.
   - `Pointer` pour guider le regard, `Keys` pour ce qui se fait au clavier.
   - `typed` pour un texte qui se tape, `at(beat, n)` pour placer un geste sur le n-ième temps, `progress` pour une transition.
   - `useEase` pour la courbe de la vidéo, `useLayout` pour la mise en page du thème.
3. Remplacer le composant vide de la scène dans `index.tsx`.
4. Regarder la scène dans `npm run studio -- <vidéo>`, composition `Film`, au début, au milieu et à la fin.
5. Lancer la passe de contrôle sur cette scène : `npm run check -- <vidéo> --scene <id>`. Elle rend la scène image par image comme le rendu final la produira et signale ce qui cloche, avec sa cause.
6. Lire les signalements (dans le terminal, ou dans `qa/report.html` avec `--open`), corriger la scène, relancer. Passer à la scène suivante quand il ne reste aucune erreur.

## La passe de contrôle

Elle regarde une image toutes les 0,5 s (`--every <s>` pour changer ce pas), plus les instants clés : le début et la fin de chaque scène, l'apparition de chaque ligne de la colonne de texte. Elle signale :

- en erreur : un texte qui en chevauche un autre (`chevauchement`), un texte coupé par son bloc (`coupe`), un texte qui sort de l'image (`hors-cadre`), une attente non tenue (`attente`)
- en avertissement : un texte trop petit à l'écran (`petit-texte`), un contraste trop faible (`contraste`), un texte qui ne reste pas assez longtemps pour être lu (`lecture`), un texte posé hors de la colonne et de la zone de la scène (`zone`), un texte à moins de 32 px du bord de la fenêtre qui le contient ou de l'image (`marge`).

Les seuils et les niveaux viennent de la section « Seuils de la passe de contrôle » de `rules.md`. Sans elle, les seuils neutres s'appliquent : 0,3 s par mot, 24 px, contraste de 4,5, marge de 32 px (ligne `- marge minimale : 32 px`).

### Dire ce qui doit se voir : `Expect`

La passe ne devine pas ce qui compte dans une scène. `Expect` le lui dit : son contenu doit être visible, ou caché, entre deux images de la scène (bornes comprises).

```tsx
import { Expect } from "rushit/kit";

<Expect id="bouton-partager" visible={[20, 60]}>
  <ShareButton />
</Expect>
<Expect id="menu-ferme" hidden={[0, 19]}>
  <Menu />
</Expect>
```

Si le bouton est rogné, recouvert, transparent, hors du cadre ou pas monté pendant ces images, la passe le dit en erreur, avec la cause. Chaque `id` est unique dans la vidéo.

### Dire ce qui est voulu : `Allow` et `Layer`

- `<Allow checks={["petit-texte"]} reason="détail en plan large">` accepte, pour tout ce qu'il contient, les contrôles nommés. La raison s'affiche dans le rapport.
- `<Layer>` pose un calque fait pour recouvrir ce qui est dessous, une bulle ou une carte par exemple : ses textes ne sont pas signalés comme chevauchant.

### Corriger ou accepter

Corriger d'abord. Accepter seulement quand le signalement décrit un choix de mise en scène, et que ce choix est tenu : `npm run check -- <vidéo> --accept <id> --reason "…"`, avec l'identifiant affiché entre crochets. L'acceptation va dans `qa/accepted.json` et voyage avec la vidéo. Si plus rien ne lui correspond après une retouche, la passe le signale.

Une attente ne s'accepte jamais : si elle n'est pas tenue, corriger la scène, ou l'attente si c'est elle qui se trompe.

## Arrêt

Pas d'arrêt obligatoire. Suivre `rules.md` pour les écarts, et montrer chaque scène finie si les règles le demandent.

## Pièges connus

- Tout ce qui bouge dépend de `useCurrentFrame()`. Jamais `Date.now()`, jamais `Math.random()` : le rendu doit être identique d'une machine à l'autre.
- Les images sont locales à la scène : l'image 0 est le début de la scène, pas celui du film.
- La passe voit les textes et les attentes, pas le goût. Regarder quand même chaque scène aux trois moments.
- Un texte qui se tape lettre par lettre change à chaque image. La passe ignore ce qu'elle ne voit que sur une seule image : ce n'est pas un oubli.
- Les bruitages arrivent au lot 4.
