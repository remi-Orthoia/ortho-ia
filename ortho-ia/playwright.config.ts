import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright pour les tests E2E ortho.ia.
 *
 * Cible : valider le pipeline de génération CRBO de bout en bout
 * (login → form 3 étapes → pipeline IA → preview → download Word),
 * en complément du script d'analyse JSON `scripts/analyze-crbo.mjs`
 * qui fait l'inspection clinique du structure_json.
 *
 * Variables d'environnement requises (cf. .env.test, à créer en local) :
 *   E2E_BASE_URL          (défaut: http://localhost:3000)
 *   E2E_TEST_EMAIL        (compte Supabase dédié aux tests)
 *   E2E_TEST_PASSWORD     (mot de passe du compte test)
 *
 * Le pipeline IA prenant ~40-80s, on a un timeout généreux par test.
 */
export default defineConfig({
  testDir: './e2e',
  /** Le pipeline IA peut tourner jusqu'à 90s en pic. On ajoute 30s de
   *  marge pour le rendu UI et les assertions. */
  timeout: 180_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  /** Pas de retry en CI tant qu'on stabilise — un retry consomme un
   *  pipeline complet (~0,30€). Augmenter quand la suite est stable. */
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/.report', open: 'never' }],
  ],
  outputDir: 'e2e/.results',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
