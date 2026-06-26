# Compréhension du projet — cluedo-sheet

## Objectif

**cluedo-sheet** est une application web légère pour accompagner une partie de Cluedo en groupe. Elle remplace la feuille de notes papier : on y suit les cartes éliminées, celles en main, et on peut montrer une carte aux autres joueurs ou lancer les dés.

L'application est conçue pour le **mobile** (usage à une main pendant la partie) et fonctionne **hors ligne** une fois installée (PWA).

## Public et contexte d'usage

- Joueurs de Cluedo (édition française) autour d'une table
- Un téléphone par joueur, ou un seul appareil partagé
- Pas de compte, pas de serveur : tout est local

## Fonctionnalités

### Grille de cartes

Trois catégories, conformes au Cluedo français :

| Catégorie | Éléments |
|-----------|----------|
| Suspects | Mlle Rose, Col. Moutarde, Mme Pervenche, Dr Olive, Mme Leblanc, Prof. Violet |
| Armes | Poignard, Chandelier, Revolver, Corde, Matraque, Clé Anglaise |
| Lieux | Cuisine, Salle de bal, Salon, Salle à Manger, Billard, Bibliothèque, Bureau, Hall, Véranda |

### Actions par carte

| Action | Gestuelle | Effet |
|--------|-----------|-------|
| Marquer en main | Clic sur le nom | Carte surlignée en violet, icône 🃏 |
| Éliminer | Bouton ✖ | Carte retirée de la liste |
| Montrer | Bouton 👁️ (cartes en main) | Overlay plein écran pour montrer la carte |

### Barre de contrôle

- **Dés** : tirage aléatoire entre 2 et 12, son (Web Audio API) puis annonce vocale en français (Speech Synthesis)
- **Annuler** : restaure l'état précédent (pile d'historique en mémoire)
- **Reset** : efface toutes les annotations (avec confirmation)

## Modèle de données

État persisté dans `localStorage`, clé `cluedo_local_v3`.

Chaque carte a un statut numérique :

| Valeur | Signification |
|--------|---------------|
| `0` | Neutre (visible, non annotée) |
| `1` | Éliminée (masquée au rendu) |
| `2` | En main (surlignée) |

L'historique d'annulation est **volatil** (mémoire uniquement, non persisté).

## Architecture

```
cluedo-sheet/
├── index.html              # Structure HTML, métadonnées PWA
├── css/styles.css          # Thème sombre, grille, overlay, barre fixe
├── js/app.js               # Logique métier, rendu, persistance, PWA
├── manifest.webmanifest    # Manifeste d'installation PWA
├── sw.js                   # Service worker (cache hors ligne)
├── icons/                  # Icônes SVG et PNG
├── docs/PROJECT.md         # Ce document
└── .nojekyll               # Compatibilité GitHub Pages
```

### Stack technique

- **Vanilla HTML / CSS / JavaScript** — aucune dépendance, aucun build
- **localStorage** — persistance de l'état de partie
- **Web Audio API** — son des dés
- **Speech Synthesis API** — annonce vocale du résultat
- **Service Worker** — cache des assets pour usage hors ligne

### Rendu

Le DOM est régénéré à chaque action via `innerHTML` dans `#app`. Les interactions utilisent la délégation d'événements sur `#app` (pas de `onclick` inline).

## Interface

- Thème sombre (`#1a1a1a`), accent rouge Cluedo (`#d32f2f`)
- Largeur max 450 px, barre d'actions fixée en bas
- Légende : `🃏 main | ✖ éliminer | 👁️ montrer`

## Déploiement

Prévu pour **GitHub Pages** (fichier `.nojekyll` présent). Chemins relatifs pour compatibilité avec un sous-répertoire (`/cluedo-sheet/`).

Pour tester en local avec le service worker (contexte sécurisé requis) :

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080` et installer via le navigateur (« Ajouter à l'écran d'accueil »).

## Limites connues

- Pas de synchronisation multi-joueurs
- Pas de configuration des éditions (noms de cartes figés)
- La synthèse vocale dépend du navigateur et des voix installées
- L'audio des dés peut nécessiter une interaction utilisateur préalable (politique autoplay)

## Évolutions possibles

- Support d'autres éditions / langues
- Export / import de l'état de partie
- Mode « partie partagée » via URL ou QR code
- Tests automatisés sur la logique d'état
