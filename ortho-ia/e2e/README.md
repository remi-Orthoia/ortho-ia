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

Architecture en 2 couches : règles transverses (s'appliquent à tous les
bilans) + règles spécifiques (par bilan, basées sur les prompts cliniques).

### Couche 1+2 — Règles transverses (7)

| Règle | Sévérité | Description |
|---|---|---|
| `no-q1-difficulte-severe` | error | Q1/P25 ≠ "Difficulté sévère" |
| `no-ia-mention` | error | Aucune mention "Claude" / "Anthropic" / "IA" / "en tant qu'assistant" |
| `no-gamification-tone` | error | Pas de "Bravo", "Bien joué", encouragements infantilisants |
| `no-em-dash-french` | warn | Em-dash (—) rares en prose narrative |
| `anamnese-completeness` | error | Anamnèse rédigée ≥ 150 chars (règle 0 anti-suppression) |
| `sections-presence` | error | Diagnostic + conclusion + axes thérapeutiques présents et substantiels |
| `no-diagnostic-evasion-without-substance` | warn | Diagnostic engagé (pas pure modalisation courte) |

### Couche 3 — Règles spécifiques Exalang 8-11 (6)

Extraites de `lib/prompts/tests/exalang-8-11.ts` (sections "À NE PAS FAIRE" / "TOUJOURS FAIRE").

| Règle | Sévérité | Description |
|---|---|---|
| `exalang811-no-dyslexia-before-ce1` | error | Pas de dyslexie ferme posée avant fin CE1 (DSM-5 persistance 18 mois) |
| `exalang811-wisc-mentioned-if-pps` | warn | WISC-V mentionné si PPS suggéré (critère D DSM-5) |
| `exalang811-orl-ophta-recommended` | warn | Bilan ORL / ophtalmologique mentionné (bonne pratique) |
| `exalang811-amo-84-conclusion` | warn | AMO 8.4 cité en conclusion (nomenclature obligatoire) |
| `exalang811-renouvellement-citation-nominale` | error | Renouvellement : citation par nom d'épreuve, pas "plusieurs progrès" |
| `exalang811-no-recalc-from-et` | error | Pas de trace de recalcul de percentile depuis l'É-T |

### Couche 3 — Règles spécifiques EVALEO 6-15 (6)

Extraites de `lib/prompts/tests/evaleo-6-15.ts` (sections "INTERDICTION ABSOLUE" / "PIEGES" + format Anne Frouard décret 2002-721).

| Règle | Sévérité | Description |
|---|---|---|
| `evaleo-uses-7-classes-not-6-zones` | warn | Grille 7 classes officielle EVALEO, pas vocabulaire Exalang ("Zone de fragilité"...) |
| `evaleo-no-class-restatement-in-comments` | error | Pas de phrase d'intro qui re-cite la classe (4 patterns interdits) |
| `evaleo-diagnostic-anne-frouard-length` | warn | Diagnostic ~10-15 lignes max (Anne Frouard, pas un pavé) |
| `evaleo-amo-84-conclusion` | warn | AMO 8.4 ou 9.4 cité en conclusion |
| `evaleo-decret-2002-721-formalism` | warn | Formalisme juridique décret 2002-721 dans conclusion |
| `evaleo-renouvellement-citation-nominale` | error | Renouvellement : citation par nom d'épreuve |

**Total : 19 règles** (7 transverses + 12 spécifiques sur 2 bilans).

### Comment ajouter une règle

1. **Règle transverse** : éditer le tableau `TRANSVERSE_RULES` dans `scripts/analyze-crbo.mjs`. Une règle = `{ id, description, check(sections, meta) }`. La fonction `check` retourne `null` (passe) ou `{ severity: 'error'|'warn', message }`.

2. **Règle spécifique** : éditer le tableau correspondant (`EXALANG811_RULES`, `EVALEO_RULES`). Si nouveau bilan, créer un nouveau tableau + ajouter au dispatcher `BILAN_RULESETS`.

### Comment étendre à un nouveau bilan

1. Créer une fixture clinique dans `e2e/fixtures/patients.ts`.
2. Créer un nouveau tableau `<BILAN>_RULES` dans `analyze-crbo.mjs` en s'inspirant de Exalang 8-11 / EVALEO.
3. L'enregistrer dans `BILAN_RULESETS[<nom du test>]`.
4. Re-run `npm run test:pipeline` — la nouvelle fixture est testée auto.

## Coût agrégé

- 1 fixture = 1 pipeline complet = ~0,30 € en Sonnet 4.6 (cf. estimation
  détaillée dans la conversation audit).
- Suite de 10 fixtures représentatives (1 par bilan ouvert) = ~3 €.
- À chaque release majeure : ~3 € de validation.

## Rollback / désinstallation

- Désinstaller : `npm uninstall @playwright/test`
- Supprimer : `playwright.config.ts`, dossier `e2e/`, `scripts/analyze-crbo.mjs`
- Retirer les scripts npm `test:e2e*` et `test:pipeline` de `package.json`
