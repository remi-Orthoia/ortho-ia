# GUIDE ORTHO.IA — pour ma sœur (orthophoniste)

Ce fichier explique, sans jargon, comment le site fonctionne et où aller toucher ce qu'il faut pour le faire évoluer.

---

## C'est quoi Ortho.ia ?

Un site qui t'aide à rédiger tes **Comptes Rendus de Bilan Orthophonique (CRBO)**. Tu remplis un formulaire en 5 étapes, tu colles les résultats du test (ou tu importes le PDF), et Claude (l'IA d'Anthropic) rédige automatiquement le compte rendu. Tu le télécharges ensuite en Word avec les tableaux colorés et les graphiques de percentiles.

- **URL prod** : https://ortho-ia.vercel.app
- **Tarif cible** : 14,90 € / mois

---

## Lancer le site en local (sur l'ordi)

```bash
npm run dev      # Ouvre http://localhost:3000
npm run build    # Vérifie que tout compile
```

La clé API Claude et les clés Supabase sont dans `.env.local` (ne jamais commit ce fichier, il contient des secrets).

---

## Où est quoi — la carte du projet

```
ortho-ia/
├── app/
│   ├── api/
│   │   ├── generate-crbo/route.ts   ← appelle Claude pour générer le CRBO
│   │   └── extract-pdf/route.ts     ← lit un PDF de résultats avec Claude Vision
│   └── dashboard/
│       ├── page.tsx                 ← le Kanban des CRBO
│       ├── nouveau-crbo/page.tsx    ← le formulaire 5 étapes + export Word
│       ├── patients/page.tsx        ← carnet patients
│       └── profil/page.tsx          ← tes infos d'orthophoniste
└── lib/
    ├── prompts/                     ← ⭐ NOUVELLE ARCHI : les "instructions" à Claude
    │   ├── index.ts                   (façade publique)
    │   ├── system-base.ts             (règles générales + seuils cliniques)
    │   ├── user-prompt.ts             (mise en forme des données formulaire)
    │   ├── extraction.ts              (prompt pour lire les PDF)
    │   ├── tool-schema.ts             (forme JSON du CRBO renvoyé par Claude)
    │   └── tests/                   ← un fichier par test orthophonique
    │       ├── index.ts               (le "registre" qui route test → module)
    │       ├── types.ts               (définition d'un module de test)
    │       ├── exalang-3-6.ts
    │       ├── exalang-5-8.ts
    │       ├── exalang-8-11.ts
    │       ├── exalang-11-15.ts
    │       ├── evalo-2-6.ts
    │       ├── elo.ts
    │       ├── bale.ts
    │       ├── evaleo-6-15.ts
    │       ├── n-eel.ts
    │       ├── bilo.ts
    │       ├── belec.ts
    │       └── examath.ts
    ├── types.ts                     ← types TypeScript + liste TESTS_OPTIONS
    └── supabase.ts                  ← connexion à la base de données
```

---

## La nouvelle architecture `lib/prompts/` — comment ça marche

Avant, tout était dans un seul fichier `lib/prompts.ts` de 220 lignes qui mélangeait règles globales + référentiel de TOUS les tests. Difficile d'ajouter un test sans tout casser.

Maintenant : **une base commune + un module par test**, avec routage automatique.

### Le flux de génération

1. Tu sélectionnes des tests dans l'étape 5 (ex. `Exalang 8-11` + `EVALO 2-6`).
2. L'API `/api/generate-crbo` reçoit la liste.
3. `buildSystemPrompt(tests)` (dans `system-base.ts`) construit le prompt :
   - Base commune (identité, règles percentiles Q1=P25, seuils cliniques, format de sortie).
   - **+** les règles spécifiques de chaque test sélectionné, lues depuis son module.
4. Claude répond **obligatoirement** via un outil appelé `generate_crbo` (défini dans `tool-schema.ts`). Il renvoie du JSON structuré : anamnèse rédigée + domaines + épreuves (avec percentile numérique + interprétation) + diagnostic + recommandations + conclusion.
5. Le front lit ce JSON pour dessiner le Word.

### Le registre des tests

Dans `lib/prompts/tests/index.ts` :

```ts
export const TEST_REGISTRY = {
  'Exalang 3-6': exalang36,
  'Exalang 5-8': exalang58,
  'Exalang 8-11': exalang811,
  'Exalang 11-15': exalang1115,
  'EVALO 2-6': evalo26,
  'ELO': elo,
  'BALE': bale,
  'EVALEO 6-15': evaleo615,
  'N-EEL': neel,
  'BILO': bilo,
  'BELEC': belec,
  'Examath': examath,
}
```

**12 modules**. Chacun est un objet avec nom, éditeur, auteurs, année, domaines, épreuves, et règles spécifiques (facultatif).

---

## Recettes : comment faire X

### ➕ Ajouter un nouveau test (ex. "Odedys")

1. Créer `lib/prompts/tests/odedys.ts` :

   ```ts
   import type { TestModule } from './types'

   export const odedys: TestModule = {
     nom: 'Odedys',
     editeur: 'Laboratoire Cogni-Sciences',
     auteurs: 'Jacquier-Roux, Valdois, Zorman',
     annee: 2005,
     domaines: ['Lecture', 'Orthographe', 'Phonologie'],
     regles_specifiques: `### ODEDYS
   - Destiné aux enfants du CE1 au CM2.
   - Utilise des centiles explicites (pas de quartiles).`,
   }
   ```

2. L'enregistrer dans `lib/prompts/tests/index.ts` :

   ```ts
   import { odedys } from './odedys'

   export const TEST_REGISTRY = {
     // ... autres tests
     'Odedys': odedys,
   }
   ```

3. L'ajouter dans `lib/types.ts` → `TESTS_OPTIONS` pour qu'il apparaisse dans la checklist de l'étape 5 :

   ```ts
   export const TESTS_OPTIONS = [
     // ...
     'Odedys',
     'Autre',
   ] as const
   ```

4. (Facultatif) Ajouter un pattern de détection PDF dans `app/api/extract-pdf/route.ts` → `testPatterns`.

C'est tout. Le prompt système injectera automatiquement les règles spécifiques d'Odedys quand l'utilisateur cochera ce test.

### ✏️ Modifier les seuils cliniques globaux

Tout est dans `lib/prompts/system-base.ts`. Cherche la section `RÈGLE N°3 : Interprétation clinique`. Si on change par ex. le seuil Fragile de "P7-P15" à "P6-P14", on change le tableau ici — rien d'autre à modifier, tous les tests hériteront de la nouvelle règle.

### 🎨 Modifier les couleurs du Word

Dans `app/dashboard/nouveau-crbo/page.tsx`, fonctions `getPercentileColor` (couleur cellule) et `getPercentileCssColor` (couleur graphique). Les valeurs sont en hexa (sans `#` pour docx, avec `#` pour Canvas).

### 📊 Modifier le graphique

Le graphique est dessiné en pur Canvas dans la fonction `generateBarChart` du même fichier. Taille, axes, couleurs, rotation des labels… tout est là.

---

## Les règles ultra-critiques à ne PAS oublier

1. **Percentiles Exalang** : `Q1 = P25 = Normal`. Pas `P6 = déficitaire` même si l'É-T est à -1.5. La colonne Percentiles du PDF fait foi.
2. **Seuils** : P ≥ 25 Normal · P16-24 Limite basse · P7-15 Fragile · P2-6 Déficitaire · P < 2 Pathologique.
3. **Modèle Claude** : `claude-sonnet-4-6` (et pas `claude-sonnet-4-20250514` qui est l'ancien identifiant).
4. **JSON structuré** : Claude utilise l'outil `generate_crbo` (forcé via `tool_choice`). Jamais de texte libre.

---

## Dépannage rapide

| Symptôme | Piste |
|---|---|
| "Clé API Claude non configurée" | vérifier `.env.local` → `ANTHROPIC_API_KEY` |
| "Claude n'a pas renvoyé de structure" | relancer. Si ça persiste, regarder les logs Vercel pour voir la réponse brute |
| Le Word ne contient pas de graphique | le JSON est sûrement vide (`domains: []`) → vérifier les résultats saisis |
| Build qui plante en WSL | erreur `EPERM copyfile` = bug Windows/WSL, pas le code. Le code lui-même compile, il faut juste builder sur Linux/macOS ou sur Vercel directement |

---

## Pour déployer

```bash
git add .
git commit -m "feat: ..."
git push
```

Vercel déploie automatiquement depuis la branche `master`. Tu peux suivre le déploiement sur https://vercel.com.
