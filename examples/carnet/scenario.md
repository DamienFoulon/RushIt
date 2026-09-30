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
| 1 | 0 s | Quatre papiers (post-it, e-mail, message, cahier) portant chacun une note | Vos idées traînent partout. | `Scattered` | Un papier arrive par temps, penché, puis tous glissent vers le centre au dernier temps |
| 2 | 4,4 s | La fenêtre de Carnet en plan large, la liste des notes se remplit | Carnet les rassemble. / Une note, un tag, retrouvée. | `Reveal` | Une note entre par temps, puis la caméra zoome sur la liste et le pointeur survole la première note |
| 3 | 11 s | La liste en gros plan, un brouillon s'ouvre en tête | Notez sans quitter le clavier. | `Capture` | Les touches `Ctrl` `N` s'affichent, le brouillon se tape lettre par lettre, puis `Entrée` |
| 4 | 15,5 s | Plein cadre : le mot « Carnet », puis la signature | Carnet. Tout ce qui compte, au même endroit. | `Logo` | Le mot monte et apparaît, la signature suit une mesure plus tard |
