/**
 * Test E2E par appel direct à l'API /api/generate-crbo (phase=pipeline)
 * depuis le contexte browser Playwright.
 *
 * Stratégie : login UI → cookies de session Supabase posés → page.evaluate
 * fait un fetch direct à l'API (cookies inclus auto). Bypasse les form
 * fillers complexes des bilans à UI structurée (chips percentile, accordéons
 * groupes, etc.) qui sont coûteux à automatiser bilan par bilan.
 *
 * Marche pour TOUS les bilans car la phase 1 extract accepte du texte
 * libre dans `resultats_manuels`. La phase 2 synthesize structure ensuite
 * le rendu CRBO.
 *
 * Pas d'INSERT DB ici (l'INSERT est fait normalement par nouveau-crbo/page.tsx
 * côté client, après réception du complete). On capture juste extracted +
 * synthesized en JSON pour analyse clinique downstream.
 *
 * Coût par run : ~0,30€ par bilan (1 pipeline complet Claude).
 */

import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { FIXTURES, type CRBOFixture } from './fixtures/patients'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD

function saveArtifact(fixtureId: string, filename: string, content: string) {
  const dir = path.join('e2e', '.results', fixtureId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), content, 'utf8')
}

function computeAge(ddn: string, bilanDate: string): number {
  const birth = new Date(ddn)
  const bilan = new Date(bilanDate)
  let years = bilan.getFullYear() - birth.getFullYear()
  const m = bilan.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && bilan.getDate() < birth.getDate())) years--
  return years
}

async function login(page: import('@playwright/test').Page) {
  if (!TEST_EMAIL || !TEST_PASSWORD) throw new Error('E2E_TEST_EMAIL / E2E_TEST_PASSWORD manquants')
  await page.goto('/auth/login')
  await page.locator('input[autocomplete="email"]').fill(TEST_EMAIL)
  await page.locator('input[autocomplete="current-password"]').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/dashboard**', { timeout: 30_000 })
}

for (const fixtureId of Object.keys(FIXTURES)) {
  const fixture = FIXTURES[fixtureId]

  test(`api pipeline — ${fixture.description}`, async ({ page }) => {
    await login(page)

    // formData à envoyer à l'API. Calqué sur ce que nouveau-crbo/page.tsx
    // construit, mais simplifié (pas d'edits ortho, pas de mode renouvellement).
    const formData = {
      patient_prenom: fixture.patient.prenom,
      patient_nom: fixture.patient.nom,
      patient_ddn: fixture.patient.ddn,
      patient_classe: fixture.patient.classe,
      bilan_date: fixture.bilanDate,
      bilan_type: fixture.bilanType,
      test_utilise: [fixture.testUtilise],
      resultats_manuels: fixture.resultats,
      anamnese: fixture.anamnese,
      motif: fixture.motif,
      medecin_nom: `${fixture.medecin.prenom} ${fixture.medecin.nom}`.trim(),
      medecin_tel: '',
      medecin_date_prescription: fixture.medecin.datePrescription,
      comportement_seance: fixture.comportementSeance ?? '',
      duree_seance_minutes: null,
      notes_analyse: fixture.notesAnalyse ?? '',
      format_crbo: 'synthetique',
    }

    // Appel direct à l'API depuis le contexte browser (cookies inclus auto).
    // Timeout 180s : pipeline ~40-80s en moyenne.
    const result = await page.evaluate(async (fd) => {
      try {
        const response = await fetch('/api/generate-crbo?stream=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: 'pipeline',
            formData: fd,
            format: 'synthetique',
          }),
        })

        if (!response.ok) {
          const errBody = await response.text().catch(() => 'unknown')
          return { error: `HTTP ${response.status}: ${errBody.slice(0, 500)}` }
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        let extracted = null as any
        let synthesized = null as any
        let streamError: string | null = null
        const progressEvents: string[] = []

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const events = buf.split('\n\n')
          buf = events.pop() ?? ''
          for (const evt of events) {
            if (!evt.startsWith('data:')) continue
            try {
              const d = JSON.parse(evt.replace(/^data:\s*/, ''))
              if (d.type === 'complete') {
                extracted = d.extracted
                synthesized = d.synthesized
              } else if (d.type === 'error') {
                streamError = d.message
              } else if (d.type === 'progress') {
                progressEvents.push(d.stage)
              }
            } catch {}
          }
        }

        return { extracted, synthesized, error: streamError, progressEvents }
      } catch (err: any) {
        return { error: err?.message ?? 'unknown evaluate error' }
      }
    }, formData)

    // Sauvegarde artefacts
    saveArtifact(fixtureId, 'metadata.json', JSON.stringify({
      fixtureId: fixture.id,
      description: fixture.description,
      testUtilise: fixture.testUtilise,
      bilanType: fixture.bilanType,
      motif: fixture.motif,
      patientClasse: fixture.patient.classe,
      patientAgeAtBilan: computeAge(fixture.patient.ddn, fixture.bilanDate),
    }, null, 2))

    if ((result as any).error) {
      saveArtifact(fixtureId, 'error.txt', String((result as any).error))
      throw new Error(`Pipeline failed for ${fixtureId}: ${(result as any).error}`)
    }

    saveArtifact(fixtureId, 'extracted.json', JSON.stringify((result as any).extracted, null, 2))
    saveArtifact(fixtureId, 'synthesized.json', JSON.stringify((result as any).synthesized, null, 2))
    saveArtifact(fixtureId, 'progress.json', JSON.stringify((result as any).progressEvents ?? [], null, 2))

    expect((result as any).extracted).toBeTruthy()
    expect((result as any).synthesized).toBeTruthy()
    expect((result as any).extracted?.anamnese_redigee?.length || 0).toBeGreaterThan(100)
    expect((result as any).synthesized?.diagnostic?.length || 0).toBeGreaterThan(50)
  })
}
