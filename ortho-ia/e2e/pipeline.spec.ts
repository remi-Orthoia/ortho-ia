/**
 * Test E2E du pipeline de génération CRBO de bout en bout.
 *
 * Flow validé :
 *   1. Login Supabase (compte test dédié)
 *   2. Navigation /dashboard/nouveau-crbo
 *   3. Remplissage étape Dossier (Patient + Médecin + Motif)
 *   4. Remplissage étape Anamnèse
 *   5. Remplissage étape Résultats (test + résultats collés)
 *   6. Clic "Générer le CRBO" → attente pipeline IA (~40-80s)
 *   7. Apparition de /preview/{id}
 *   8. Capture screenshots + extraction du contenu rendu
 *   9. Sauvegarde des artefacts dans e2e/.results/{fixture-id}/
 *
 * Les artefacts servent ensuite au script d'analyse clinique
 * (`scripts/analyze-crbo.mjs`) qui vérifie les règles métier
 * (P25 = fragilité pas difficulté sévère, présence des sections
 * obligatoires, AMO mentionnée, etc.).
 *
 * Pré-requis : variables d'env E2E_TEST_EMAIL + E2E_TEST_PASSWORD
 * pointant sur un compte Supabase dédié avec quota CRBO suffisant.
 */

import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { FIXTURES, type CRBOFixture } from './fixtures/patients'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD

test.skip(
  !TEST_EMAIL || !TEST_PASSWORD,
  'E2E_TEST_EMAIL et E2E_TEST_PASSWORD requis (cf. e2e/.env.test.example)',
)

/** Sauvegarde un artefact sous e2e/.results/{fixtureId}/{filename}. */
function saveArtifact(fixtureId: string, filename: string, content: string) {
  const dir = path.join('e2e', '.results', fixtureId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), content, 'utf8')
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  // AppInput component rend un label custom non associé à l'input via for/id,
  // donc page.getByLabel() ne fonctionne pas. On cible par autocomplete (stable).
  await page.locator('input[autocomplete="email"]').fill(TEST_EMAIL!)
  await page.locator('input[autocomplete="current-password"]').fill(TEST_PASSWORD!)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/dashboard**', { timeout: 30_000 })
}

async function fillStepDossier(page: import('@playwright/test').Page, f: CRBOFixture) {
  // Étape 1 "Dossier" : Patient + Médecin + Motif fusionnés (refonte 2026-06).
  await page.locator('input[name="patient_prenom"]').fill(f.patient.prenom)
  await page.locator('input[name="patient_nom"]').fill(f.patient.nom)
  await page.locator('input[name="patient_ddn"]').fill(f.patient.ddn)
  await page.locator('select[name="patient_classe"]').selectOption(f.patient.classe)
  await page.locator('input[name="bilan_date"]').fill(f.bilanDate)

  // Médecin (saisie manuelle, pas via la banque).
  await page.locator('input[name="medecin_nom"]').fill(`${f.medecin.prenom} ${f.medecin.nom}`)
  await page.locator('input[name="medecin_date_prescription"]').fill(f.medecin.datePrescription)

  // Chips motif : on clique celui qui correspond exactement au libellé.
  for (const m of f.motif.split(',').map((s) => s.trim()).filter(Boolean)) {
    await page.getByRole('button', { name: m, exact: true }).first().click()
  }

  // Suivant → Anamnèse.
  await page.getByRole('button', { name: /suivant/i }).click()
}

async function fillStepAnamnese(page: import('@playwright/test').Page, f: CRBOFixture) {
  await page.locator('textarea[name="anamnese"]').fill(f.anamnese)
  await page.getByRole('button', { name: /suivant/i }).click()
}

async function fillStepResultats(page: import('@playwright/test').Page, f: CRBOFixture) {
  // Le test peut être dans n'importe quelle famille (accordéon).
  // On clique le checkbox via le label visible. Si la famille est fermée,
  // on ouvre l'accordéon avant.
  const testLabel = page.locator(`label`, { hasText: f.testUtilise }).first()
  if (!(await testLabel.isVisible().catch(() => false))) {
    // Ouvre toutes les familles pour être robuste.
    const accordions = page.locator('button:has(span:has-text("Langage écrit")), button:has(span:has-text("Langage oral")), button:has(span:has-text("Adultes")), button:has(span:has-text("Cognition")), button:has(span:has-text("Autres"))')
    for (let i = 0; i < (await accordions.count()); i++) {
      const isOpen = await accordions.nth(i).getAttribute('aria-expanded')
      if (isOpen !== 'true') await accordions.nth(i).click().catch(() => null)
    }
  }
  await testLabel.click()

  // Le textarea de résultats est conditionnel selon le test sélectionné.
  // Pour les bilans avec form structuré, on utilise plutôt le textarea
  // générique "Résultats" qui couvre tous les cas.
  const resultatsTextarea = page.locator('textarea[name="resultats_manuels"]').first()
  if (await resultatsTextarea.isVisible().catch(() => false)) {
    await resultatsTextarea.fill(f.resultats)
  } else {
    // Fallback : on cherche une textarea avec un placeholder évocateur.
    await page.locator('textarea').filter({ hasText: /' resultats|coller/i }).first().fill(f.resultats)
  }

  // Comportement séance (optionnel).
  if (f.comportementSeance) {
    const compTextarea = page.locator('textarea[name="comportement_seance"]').first()
    if (await compTextarea.isVisible().catch(() => false)) {
      await compTextarea.fill(f.comportementSeance)
    }
  }
}

/** Test E2E principal : un test par fixture déclarée. */
for (const fixtureId of Object.keys(FIXTURES)) {
  const fixture = FIXTURES[fixtureId]

  test(`pipeline CRBO — ${fixture.description}`, async ({ page }) => {
    await login(page)

    await page.goto('/dashboard/nouveau-crbo')
    await expect(page.locator('h2:has-text("Patient")').first().or(page.locator('h2:has-text("Dossier")').first())).toBeVisible({ timeout: 10_000 })

    await fillStepDossier(page, fixture)
    await fillStepAnamnese(page, fixture)
    await fillStepResultats(page, fixture)

    // Clic Générer — déclenche le pipeline phase=pipeline (~40-80s).
    const generateBtn = page.getByRole('button', { name: /générer le crbo/i }).first()
    await generateBtn.click()

    // Capture du GenerationLoader.
    await page.screenshot({
      path: path.join('e2e', '.results', fixtureId, 'step-generation-loader.png'),
      fullPage: true,
    })

    // Attente de l'arrivée sur /preview/{id} (pipeline ~70s max).
    await page.waitForURL('**/nouveau-crbo/preview/**', { timeout: 120_000 })

    const previewUrl = page.url()
    const crboId = previewUrl.split('/preview/')[1]?.split('?')[0]?.split('#')[0] || ''

    // Laisse le temps au mount complet de la preview (load CRBO + statut).
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => null)

    // Capture du rendu preview en mode "Aperçu" (défaut WYSIWYG).
    await page.screenshot({
      path: path.join('e2e', '.results', fixtureId, 'step-preview-apercu.png'),
      fullPage: true,
    })

    // Bascule en mode "Éditer" — les ancres sec-anamnese, sec-diagnostic
    // etc. sont rendues uniquement dans ce mode (le mode preview est un
    // WYSIWYG Word qui n'expose pas ces IDs). Cf. preview/[id]/page.tsx:573.
    await page.getByRole('button', { name: /^Éditer$/i }).first().click().catch(() => null)
    await page.waitForTimeout(500)

    await page.screenshot({
      path: path.join('e2e', '.results', fixtureId, 'step-preview-edit.png'),
      fullPage: true,
    })

    // Extraction du contenu rendu pour l'analyse clinique downstream.
    const sections: Record<string, string> = {}
    for (const id of ['sec-anamnese', 'sec-diagnostic', 'sec-axes', 'sec-conclusion', 'sec-pap']) {
      const text = await page.locator(`#${id}`).first().innerText().catch(() => '')
      if (text) sections[id] = text
    }

    saveArtifact(fixtureId, 'crbo-id.txt', crboId)
    saveArtifact(fixtureId, 'preview-sections.json', JSON.stringify(sections, null, 2))
    saveArtifact(fixtureId, 'preview-url.txt', previewUrl)
    // Metadata pour l'analyse downstream — permet à analyze-crbo.mjs de
    // dispatcher les règles spécifiques par bilan sans heuristique fragile.
    saveArtifact(fixtureId, 'metadata.json', JSON.stringify({
      fixtureId: fixture.id,
      description: fixture.description,
      testUtilise: fixture.testUtilise,
      bilanType: fixture.bilanType,
      motif: fixture.motif,
      patientClasse: fixture.patient.classe,
      patientAgeAtBilan: (() => {
        const birth = new Date(fixture.patient.ddn)
        const bilan = new Date(fixture.bilanDate)
        let years = bilan.getFullYear() - birth.getFullYear()
        const m = bilan.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && bilan.getDate() < birth.getDate())) years--
        return years
      })(),
    }, null, 2))

    // Assertions minimales — l'analyse fine se fait dans le script Node.
    expect(crboId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(sections['sec-anamnese']?.length || 0).toBeGreaterThan(100)
    expect(sections['sec-diagnostic']?.length || 0).toBeGreaterThan(50)
    expect(sections['sec-conclusion']?.length || 0).toBeGreaterThan(50)
  })
}
