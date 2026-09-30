# Scénario

Carnet est un produit fictif, une application de notes inventée pour montrer la méthode de RushIt. Son écran est dessiné dans `app/NotesApp.tsx`.

## Public

Des personnes qui prennent des notes un peu partout (post-it, e-mails, messages, cahiers) et qui ne les retrouvent plus quand elles en ont besoin.

## Ce qu'il faut retenir

Carnet rassemble toutes les notes au même endroit, et on en ajoute une sans lâcher le clavier.

## Cadre

- Format : 1920×1080, 30 images par seconde
- Durée : 20 s visées, 19 s une fois le morceau monté
- Musique : « Beauty Flow », Kevin MacLeod (CC BY 4.0), début et fin du morceau
- Règles : voir `rules.md`

## Scènes

| # | Temps | Ce qu'on voit | Texte à l'écran | Composant | Mouvement et gestes |
|---|-------|---------------|-----------------|-----------|---------------------|
| 1 | 0 s | Quatre papiers (post-it, e-mail, message, cahier) portant chacun une note | Vos idées traînent partout. | `Scattered` | Un papier arrive par temps, penché. Puis ils s'empilent, opaques, le dernier au-dessus. Le papier du dessus se vide, puis grandit jusqu'à devenir la fenêtre de Carnet |
| 2 | 4,4 s | La fenêtre de Carnet en plan large, la liste des notes se remplit | Carnet les rassemble. / Une note, un tag, retrouvée. | `Reveal` | La fenêtre se remplit, une note par temps. La barre latérale s'efface, puis la caméra cadre la liste avec sa marge. Le pointeur entre par le bord et survole la première note |
| 3 | 11 s | La liste en gros plan, un brouillon s'ouvre en tête | Notez sans quitter le clavier. | `Capture` | Les touches `Ctrl` `N` s'affichent, le brouillon s'ouvre et la caméra lui fait de la place, il se tape lettre par lettre, puis `Entrée` l'enregistre. La fenêtre se vide puis s'en va |
| 4 | 15,5 s | Plein cadre : le mot « Carnet », puis la signature | Carnet. Tout ce qui compte, au même endroit. | `Logo` | Le mot monte lettre par lettre, la signature suit une mesure plus tard |
