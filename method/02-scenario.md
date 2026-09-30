# 2. Écrire le scénario

## But

Un `scenario.md` validé par l'humain, qui dit à qui parle la vidéo, ce qu'il faut retenir, et ce qu'on voit scène par scène.

## Ce qu'on fait

1. Ouvrir `videos/<nom>/scenario.md`. Le gabarit a quatre rubriques : public, ce qu'il faut retenir, cadre, scènes.
2. Remplir le public et le message avec l'humain. Ce sont ses mots, pas ceux de l'agent.
3. Remplir le tableau des scènes, une scène par ligne : temps visé, ce qu'on voit, texte à l'écran, composant du produit, mouvement et gestes.
4. Recopier chaque texte à l'écran dans `texts.ts`, une clé par scène. Tous les textes vivent dans ce fichier, pour qu'une traduction ne touche que lui.
5. Relire le scénario avec `rules.md` sous les yeux : longueur des phrases, ton, prénoms ou rôles, place du texte.

## Arrêt

**Obligatoire.** Montrer le scénario complet à l'humain et attendre sa validation avant la musique et les scènes. Un scénario non validé ne sert de base à rien.

## Pièges connus

- Ne rien inventer sur le produit : une fonction, un chiffre ou un témoignage vient du code ou de l'humain.
- Pas de vraie personne dans les exemples : ni vrai nom, ni vraie adresse e-mail.
- Un texte trop long pour sa scène se voit à l'animatique. Mieux vaut le couper ici.
