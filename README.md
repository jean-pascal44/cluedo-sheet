# cluedo-sheet

Feuille de notes numérique pour parties de **Cluedo** (édition française). Éliminez des cartes, marquez celles en main, montrez-les aux autres joueurs et lancez les dés — le tout depuis votre téléphone, même hors ligne.

## Fonctionnalités

- Grille Suspects / Armes / Lieux
- Marquage des cartes en main, élimination, affichage plein écran
- Lanceur de dés (2–12) avec son et annonce vocale
- Annulation et réinitialisation
- Sauvegarde automatique dans le navigateur
- **PWA** installable, utilisable hors ligne

## Démarrage rapide

Aucune installation ni build requis.

```bash
# Servir en local (requis pour le service worker)
npx serve .
```

Ouvrir l'URL affichée, puis **Ajouter à l'écran d'accueil** pour installer l'application.

## Structure

```
├── index.html
├── css/styles.css
├── js/app.js
├── manifest.webmanifest
├── sw.js
├── icons/
└── docs/PROJECT.md    # Documentation détaillée du projet
```

## Documentation

Voir [docs/PROJECT.md](docs/PROJECT.md) pour l'architecture, le modèle de données et le contexte d'usage.

## Déploiement

Compatible **GitHub Pages** : pousser sur la branche `gh-pages` ou activer Pages sur `main`. Le fichier `.nojekyll` est inclus.

## Licence

Usage personnel / familial.
