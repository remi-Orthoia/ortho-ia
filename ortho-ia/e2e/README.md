# Tests E2E ortho.ia (option D du chantier audit UX)

Suite Playwright qui pilote un Chromium headless de bout en bout (login → form
3 étapes → pipeline IA ~70s → preview) + script Node d'analyse clinique des
CRBO générés.

## Setup une fois

1. **Compte Supabase test** (à créer côté toi) :
   - Email type : `test-e2e@ortho-ia.test` (ou n'importe quel mail réservé aux tests)
   - Profil complet rempli en BDD (sinon le 1er CRBO est bloqué — cf. `nouveau-crbo/page.tsx:312`)
   - Quota CRBO suffisant pour la suite (1 fixture = 1 CRBO consommé)

2. **Variables d'env** :
   ```bash
   cp e2e/.env.test.example .env.test
   # éditer .env.test avec les vrais credentials
   ```

3. **Pré-requis serveur** :
   ```bash
   npm run dev  # sur :3000, dans un terminal séparé
   ```

## Commandes principales

| Commande | Effet | Coût API |
|---|---|---|
| `npm run test:e2e` | Lance Playwright en headless, 1 run par fixture | ~0,30 € × N fixtures |
| `npm run test:e2e:ui` | UI interactif Playwright (utile pour debug) | 0 si pas de génération |
| `npm run test:e2e:headed` | Browser visible (debug visuel) | ~0,30 € × N |
| `npm run test:analyze` | Analyse clinique des artefacts (offline, gratuit) | 0 |
| `npm run test:pipeline` | Enchaîne `test:e2e` puis `test:analyze` | ~0,30 € × N |

## Arborescence

```
e2e/
├── fixtures/
│   └── patients.ts          # cas cliniques test (1 fixture = 1 CRBO)
├── pipeline.spec.ts         # test E2E principal (1 it() par fixture)
├── .env.test.example        # template variables d'env
├── .results/                # gitignored — artefacts par run
│   └── {fixtureId}/
│       ├── step-generation-loader.png
│       ├── step-preview.png
│       ├── preview-sections.json
│       ├── preview-url.txt
│       └── crbo-id.txt
└── .report/                 # gitignored — rapport HTML Playwright
```

## Ajouter une fixture clinique

Éditer `e2e/fixtures/patients.ts` :

```ts
export const FIXTURE_EVALEO_DYSLEXIE: CRBOFixture = {
  id: 'evaleo-6-15-dyslexie-ce2',
  description: 'CE2 dyslexie phonologique modérée (EVALEO 6-15)',
  patient: { ... },
  bilanDate: '2026-06-04',
  bilanType: 'initial',
  motif: 'Langage écrit',
  medecin: { ... },
  anamnese: '...',
  testUtilise: 'EVALEO 6-15',
  resultats: '...',  // texte qui sera collé dans resultats_manuels
}

export const FIXTURES = {
  [FIXTURE_EXALANG_811_DYSLEXIE.id]: FIXTURE_EXALANG_811_DYSLEXIE,
  [FIXTURE_EVALEO_DYSLEXIE.id]: FIXTURE_EVALEO_DYSLEXIE,  // ← nouvelle
}
```

Puis `npm run test:pipeline` — la nouvelle fixture est automatiquement testée.

## Règles cliniques vérifiées par `analyze-crbo.mjs`

| Règle | Sévérité | Description |
|---|---|---|
| `no-q1-difficulte-severe` | error | Q1/P25 ≠ "Difficulté sévère" |
| `no-ia-mention` | error | Aucune mention "Claude" / "Anthropic" / "IA" |
| `amo-nomenclature` | warn | Conclusion mentionne AMO 8.4 / 9.4 / 11.7 |
| `diagnostic-not-evasive` | warn | Diagnostic engagé (pas "pourrait évoquer..." court) |
| `anamnese-completeness` | error | Anamnèse rédigée ≥ 100 chars (règle 0 anti-suppression) |
| `no-em-dash-french` | warn | Em-dash (—) rares en prose narrative |

Pour ajouter une règle : éditer `RULES` dans `scripts/analyze-crbo.mjs`. Chaque
règle prend `sections` (objet { sec-anamnese, sec-diagnostic, ... }) et retourne
`null` (passe) ou `{ severity, message }`.

## Coût agrégé

- 1 fixture = 1 pipeline complet = ~0,30 € en Sonnet 4.6 (cf. estimation
  détaillée dans la conversation audit).
- Suite de 10 fixtures représentatives (1 par bilan ouvert) = ~3 €.
- À chaque release majeure : ~3 € de validation.

## Rollback / désinstallation

- Désinstaller : `npm uninstall @playwright/test`
- Supprimer : `playwright.config.ts`, dossier `e2e/`, `scripts/analyze-crbo.mjs`
- Retirer les scripts npm `test:e2e*` et `test:pipeline` de `package.json`
