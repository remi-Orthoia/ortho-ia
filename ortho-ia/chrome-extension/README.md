# Chrome Extension — Ortho.ia HappyNeuron

Extension MV3 qui déclenche une capture HappyNeuron via l'agent local
(`localhost:7842`) et ouvre le formulaire CRBO pré-rempli sur ortho-ia.

## Installation locale (dev)

1. Ouvrir `chrome://extensions/`
2. Activer le **Mode développeur** (en haut à droite)
3. Cliquer sur **Charger l'extension non empaquetée**
4. Sélectionner ce dossier `chrome-extension/`

## Configuration

L'utilisateur doit coller son **access token Supabase** dans le panneau
Configuration du popup. Il est récupérable dans `dashboard/profil#extension`
(à câbler côté ortho-ia).

Le token est stocké dans `chrome.storage.local` et envoyé en
`Authorization: Bearer …` à `/api/extract-screenshot`.

## Switch dev/prod

Pour pointer sur localhost:3000 au lieu de prod :

```js
// Console DevTools du popup
await chrome.storage.local.set({ ortho_ia_env: "dev" })
```

Repasser en prod :

```js
await chrome.storage.local.set({ ortho_ia_env: "prod" })
```

## Publication Chrome Web Store

Avant publication :

1. Créer des icônes 16/32/48/128 et les ajouter à `manifest.json` (`icons`).
2. Créer un screenshot 1280×800 du popup en action.
3. Vérifier que `host_permissions` ne contient pas de wildcard inutile.
