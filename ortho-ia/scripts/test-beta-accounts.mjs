#!/usr/bin/env node
/**
 * Validation end-to-end des comptes beta-testeuses.
 *
 * Simule un vrai parcours utilisatrice (login, lecture profile, insertion
 * patient/medecin/CRBO via RLS) pour CHAQUE compte, en utilisant la cle
 * anon Supabase (donc soumis aux memes policies RLS qu'un navigateur).
 * Cleanup automatique apres chaque test pour ne pas polluer la DB.
 *
 * Usage :
 *   node scripts/test-beta-accounts.mjs                 # mode DB-only (cheap)
 *   node scripts/test-beta-accounts.mjs --full          # + appel /api/generate-crbo (consomme tokens)
 *   node scripts/test-beta-accounts.mjs --user=cindy    # un seul compte
 *
 * Mode DB-only valide tout sauf l'appel Claude (qui depend des env vars
 * Vercel, pas du compte user). Mode --full hit la prod et tente une
 * generation reelle — couteux ~$0.20 par CRBO genere.
 *
 * Sortie : OK / FAIL pour chaque etape, par compte.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const PROD_URL = 'https://ortho-ia.vercel.app'

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquant dans .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const FULL_MODE = args.includes('--full')
const userArg = args.find(a => a.startsWith('--user='))?.split('=')[1]

const ACCOUNTS = [
  { name: 'Cindy', email: 'cindydendievel@gmail.com', password: 'Cindy-Ortho-2026' },
  { name: 'Marie-Cécile', email: 'mariececilevermeersch@gmail.com', password: 'Marie-Ortho-2026' },
  { name: 'Laetitia', email: 'lettys.b@gmail.com', password: 'Laetitia-Ortho-2026' },
].filter(a => !userArg || a.name.toLowerCase().includes(userArg.toLowerCase()))

if (ACCOUNTS.length === 0) {
  console.error(`❌ Aucun compte ne matche --user=${userArg}`)
  process.exit(1)
}

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
}

async function step(label, fn) {
  process.stdout.write(`  ${label}... `)
  try {
    const result = await fn()
    console.log(c.green('✓'))
    return result
  } catch (e) {
    console.log(c.red(`✗  ${e.message}`))
    throw e
  }
}

async function testAccount(account) {
  console.log(c.bold(`\n=== ${account.name} (${account.email}) ===`))

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const createdIds = { patient: null, medecin: null, crbo: null }
  let user

  try {
    // ============ 1. LOGIN ============
    const session = await step('Login signInWithPassword', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      })
      if (error) throw new Error(error.message)
      if (!data.user || !data.session) throw new Error('Session vide apres login')
      user = data.user
      return data.session
    })

    // ============ 2. getUser apres login (verifie que le token est valide) ============
    await step('getUser (token valide)', async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) throw new Error(error?.message || 'getUser retourne null')
      if (data.user.id !== user.id) throw new Error('User ID incoherent')
    })

    // ============ 3. SELECT profile (RLS test SELECT) ============
    const profile = await step('SELECT profile RLS', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, prenom, nom, referral_code')
        .eq('id', user.id)
        .single()
      if (error) throw new Error(`RLS bloque le SELECT : ${error.message}`)
      if (data.email !== account.email) throw new Error('Email profile incoherent')
      return data
    })

    // ============ 4. SELECT subscription ============
    await step('SELECT subscription (plan/quota)', async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, crbo_limit')
        .eq('user_id', user.id)
        .single()
      if (error) throw new Error(error.message)
      if (data.plan !== 'pro') throw new Error(`plan=${data.plan} (attendu pro)`)
      if (data.crbo_limit !== -1) throw new Error(`limit=${data.crbo_limit} (attendu -1 illimite)`)
    })

    // ============ 5. UPDATE profile (RLS test UPDATE) ============
    await step('UPDATE profile RLS', async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ adresse: 'Test cabinet (auto-cleanup)' })
        .eq('id', user.id)
      if (error) throw new Error(`RLS bloque l'UPDATE : ${error.message}`)
    })

    // ============ 6. INSERT patient (RLS test INSERT) ============
    createdIds.patient = await step('INSERT patient RLS', async () => {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          prenom: 'TEST',
          nom: 'AUTOCLEAN',
          date_naissance: '2015-06-01',
          classe: 'CE2',
        })
        .select('id')
        .single()
      if (error) throw new Error(`RLS bloque l'INSERT patient : ${error.message}`)
      return data.id
    })

    // ============ 7. INSERT medecin ============
    createdIds.medecin = await step('INSERT medecin RLS', async () => {
      const { data, error } = await supabase
        .from('medecins')
        .insert({
          user_id: user.id,
          nom: 'TEST-AUTOCLEAN',
          specialite: 'Pédiatre',
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      return data.id
    })

    // ============ 8. INSERT CRBO minimal (sans appel Claude) ============
    // Ce test verifie que la table accepte un INSERT pour cet user via RLS.
    // Pas d'appel reel a /api/generate-crbo en mode standard.
    createdIds.crbo = await step('INSERT crbo minimal RLS', async () => {
      const { data, error } = await supabase
        .from('crbos')
        .insert({
          user_id: user.id,
          patient_prenom: 'TEST',
          patient_nom: 'AUTOCLEAN',
          patient_ddn: '2015-06-01',
          patient_classe: 'CE2',
          bilan_date: new Date().toISOString().slice(0, 10),
          bilan_type: 'initial',
          test_utilise: 'TEST',
          motif: 'Test automatise (auto-cleanup)',
          anamnese: 'Test',
          resultats: 'Test',
          crbo_genere: '[Test automatise — sera supprime]',
          statut: 'a_rediger',
        })
        .select('id')
        .single()
      if (error) throw new Error(`RLS bloque l'INSERT crbo : ${error.message}`)
      return data.id
    })

    // ============ 9. SELECT crbos (RLS — doit voir au moins le test) ============
    await step('SELECT crbos own', async () => {
      const { data, error } = await supabase
        .from('crbos')
        .select('id')
        .eq('user_id', user.id)
      if (error) throw new Error(error.message)
      if (!data || data.length < 1) throw new Error('Aucun CRBO visible')
    })

    // ============ 10. RPC get_monthly_crbo_count ============
    await step('RPC get_monthly_crbo_count', async () => {
      const { data, error } = await supabase.rpc('get_monthly_crbo_count', { p_user_id: user.id })
      if (error) throw new Error(error.message)
      if (typeof data !== 'number') throw new Error(`Type retour inattendu : ${typeof data}`)
    })

    // ============ 11. (Optionnel) Hit /api/generate-crbo en prod ============
    if (FULL_MODE) {
      await step('POST /api/generate-crbo (prod, full)', async () => {
        const res = await fetch(`${PROD_URL}/api/generate-crbo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'Cookie': `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`,
          },
          body: JSON.stringify({
            phase: 'extract',
            formData: {
              ortho_nom: profile.prenom + ' ' + profile.nom,
              ortho_adresse: 'Test',
              ortho_cp: '75001',
              ortho_ville: 'Test',
              ortho_tel: '0100000000',
              ortho_email: account.email,
              patient_prenom: 'Test',
              patient_nom: 'Patient',
              patient_ddn: '2015-06-01',
              patient_classe: 'CE2',
              bilan_date: new Date().toISOString().slice(0, 10),
              bilan_type: 'initial',
              motif: 'Test automatise',
              anamnese: 'Patient de 10 ans, scolarise en CE2, plainte de lenteur en lecture.',
              test_utilise: ['Exalang 8-11'],
              resultats_manuels: 'Lecture mots : -1.5 ET',
              notes_analyse: '',
            },
            format: 'synthetique',
          }),
        })
        if (!res.ok) {
          const body = await res.text()
          throw new Error(`HTTP ${res.status} : ${body.slice(0, 200)}`)
        }
      })
    }

    // ============ CLEANUP ============
    console.log(c.gray('  Cleanup...'))
    await Promise.all([
      createdIds.crbo && supabase.from('crbos').delete().eq('id', createdIds.crbo),
      createdIds.patient && supabase.from('patients').delete().eq('id', createdIds.patient),
      createdIds.medecin && supabase.from('medecins').delete().eq('id', createdIds.medecin),
      supabase.from('profiles').update({ adresse: null }).eq('id', user.id),
    ].filter(Boolean))
    await supabase.auth.signOut()

    console.log(c.green(c.bold(`  ✅ ${account.name} : tous les checks passent`)))
    return true
  } catch (e) {
    // Cleanup best-effort meme en cas d'erreur
    try {
      if (createdIds.crbo) await supabase.from('crbos').delete().eq('id', createdIds.crbo)
      if (createdIds.patient) await supabase.from('patients').delete().eq('id', createdIds.patient)
      if (createdIds.medecin) await supabase.from('medecins').delete().eq('id', createdIds.medecin)
      if (user) await supabase.from('profiles').update({ adresse: null }).eq('id', user.id)
      await supabase.auth.signOut()
    } catch { /* ignore */ }
    console.log(c.red(c.bold(`  ❌ ${account.name} : ${e.message}`)))
    return false
  }
}

// ============ MAIN ============
console.log(c.bold(`Validation comptes beta — mode ${FULL_MODE ? c.yellow('FULL (hit /api/generate-crbo prod, $$)') : 'DB-only'}`))
console.log(c.gray(`Cleanup automatique apres chaque test.`))

let allOk = true
for (const account of ACCOUNTS) {
  const ok = await testAccount(account)
  if (!ok) allOk = false
}

console.log('')
if (allOk) {
  console.log(c.green(c.bold(`✅ Tous les comptes (${ACCOUNTS.length}) sont 100% fonctionnels.`)))
  process.exit(0)
} else {
  console.log(c.red(c.bold(`❌ Au moins un compte echoue. Voir les erreurs ci-dessus.`)))
  process.exit(1)
}
