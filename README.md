# Cluelog

*Le journal de votre enquête Cluedo*

Application web légère pour accompagner une partie de **Cluedo** (Clue). Pensée pour le mobile, elle remplace la feuille papier : vous y enregistrez vos cartes en main, éliminez les possibilités et marquez vos suspects au fil de l'enquête.

**Version actuelle : 1.3.0** (28 juin 2026)

## Fonctionnalités

- Sélection des cartes reçues en début de partie (suspects, armes, lieux)
- Élimination des cartes prouvées impossibles pendant la partie
- Marquage des suspects potentiels
- Onglets **Main**, **Suspects**, **Armes** et **Lieux** avec navigation au swipe
- Thème clair / sombre
- Sauvegarde automatique dans le navigateur (localStorage)
- Installation en **PWA** (Progressive Web App) pour un accès hors ligne

## Lancer l'application

Aucune dépendance ni étape de build : le projet est du HTML/CSS/JS statique.

```bash
npx serve .
```

Puis ouvrez l'URL affichée (généralement `http://localhost:3000`) dans un navigateur. Sur mobile, vous pouvez aussi ajouter l'application à l'écran d'accueil via le menu du navigateur.

## Comment s'en servir

### 1. Phase de sélection (début de partie)

1. Parcourez les onglets **Suspects**, **Armes** et **Lieux**.
2. Appuyez sur chaque carte que vous avez en main : elle est ajoutée à l'onglet **Main**.
3. Appuyez à nouveau sur une carte pour la retirer de votre main.
4. Quand toutes vos cartes sont sélectionnées, appuyez sur le bouton **▶** (en bas à droite) pour commencer la partie.

### 2. Pendant la partie

- **Éliminer** une carte : appuyez sur le **✖** à côté de la carte (elle disparaît des onglets actifs mais reste visible en fantôme pour pouvoir être restaurée).
- **Marquer un suspect** : appuyez sur la carte du suspect pour la surligner ; appuyez à nouveau pour retirer le marquage.
- **Voir une carte de votre main** : appuyez dessus dans l'onglet **Main** pour l'afficher en grand.
- **Restaurer** une carte éliminée par erreur : appuyez sur sa version fantôme.

### 3. Menu (☰ en haut à droite)

- **Nouvelle partie** : efface toutes les données et repasse en phase de sélection.
- **Mode sombre / clair** : change le thème d'affichage.
- **À propos** : version, crédits et auteur.

## Stack technique

- HTML, CSS et JavaScript vanilla
- Service Worker pour le cache et le fonctionnement hors ligne
- Manifeste web pour l'installation PWA

## Crédits

Créé par **hypo59** avec [Cursor](https://cursor.com/).

Icônes de [Game-icons.net](https://game-icons.net/) ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)).
