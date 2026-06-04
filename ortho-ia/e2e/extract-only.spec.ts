/**
 * Test E2E secondaire : extraction des sections d'un CRBO DÉJÀ généré.
 *
 * Utile pour itérer sur les sélecteurs sans repayer une génération IA
 * (~0,30€ par run du test principal). Lit le crbo-id.txt du dossier
 * fixture et navigue directement vers /preview/{id}.
 *
 * Lancé via : npx playwright test extract-only.spec.ts
 */

import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { FIXTURES } from './fixtures/patients'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD

function saveArtifact(fixtureId: string, filename: string, content: string) {
  const dir = path.join('e2e', '.results', fixtureId)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), content, 'utf8')
}

async function login(page: import('@playwright/test').Page) {
  await page.goto('/auth/login')
  await page.locator('input[autocomplete="email"]').fill(TEST_EMAIL!)
  await page.locator('input[autocomplete="current-password"]').fill(TEST_PASSWORD!)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/dashboard**', { timeout: 30_000 })
}

for (const fixtureId of Object.keys(FIXTURES)) {
  const fixture = FIXTURES[fixtureId]
  const crboIdPath = path.join('e2e', '.results', fixtureId, 'crbo-id.txt')

  test(`extract-only — ${fixture.description}`, async ({ page }) => {
    console.log('[debug] cwd:', process.cwd())
    console.log('[debug] crboIdPath:', crboIdPath)
    console.log('[debug] exists:', fs.existsSync(crboIdPath))
    if (!fs.existsSync(crboIdPath)) {
      test.skip(true, `Pas de crbo-id pour ${fixtureId} — lance d'abord pipeline.spec.ts`)
      return
    }
    const crboId = fs.readFileSync(crboIdPath, 'utf8').trim()
    expect(crboId).toMatch(/^[0-9a-f-]{36}$/i)

    await login(page)
    await page.goto(`/dashboard/nouveau-crbo/preview/${crboId}`)
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => null)

    await page.screenshot({
      path: path.join('e2e', '.results', fixtureId, 'step-preview-apercu.png'),
      fullPage: true,
    })

    // Bascule en mode "Éditer".
    await page.getByRole('button', { name: /^Éditer$/i }).first().click().catch(() => null)
    await page.waitForTimeout(800)

    await page.screenshot({
      path: path.join('e2e', '.results', fixtureId, 'step-preview-edit.png'),
      fullPage: true,
    })

    const sections: Record<string, string> = {}
    for (const id of ['sec-anamnese', 'sec-diagnostic', 'sec-axes', 'sec-conclusion', 'sec-pap']) {
      const text = await page.locator(`#${id}`).first().innerText().catch(() => '')
      if (text) sections[id] = text
    }

    saveArtifact(fixtureId, 'preview-sections.json', JSON.stringify(sections, null, 2))
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
    expect(sections['sec-anamnese']?.length || 0).toBeGreaterThan(100)
    expect(sections['sec-diagnostic']?.length || 0).toBeGreaterThan(50)
    expect(sections['sec-conclusion']?.length || 0).toBeGreaterThan(50)
  })
}
