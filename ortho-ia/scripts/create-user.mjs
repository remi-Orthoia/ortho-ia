#!/usr/bin/env node
/**
 * Crée un utilisateur dans Supabase auth (auto-confirmé, donc utilisable
 * immédiatement) via l'Admin API. Utilisé pour onboarder un collaborateur
 * dev / un beta tester sans passer par le flow de signup email.
 *
 * Usage :
 *   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/create-user.mjs <email> <password> [<full_name>]
 *
 * Exemple :
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbG... node scripts/create-user.mjs \
 *     stephanie.docher@gmail.com "MotDePasseFort123!" "Stéphanie Docher"
 *
 * Le service role key est dispo dans :
 *   - Supabase dashboard → Settings → API → "service_role" (secret)
 *   - Ou via Vercel env vars (déjà configurée en prod)
 *
 * Le script :
 *   1. Crée la ligne auth.users avec email_confirmed_at non-null (pas de
 *      mail de confirmation à valider — login immédiat).
 *   2. Le trigger handle_new_user (si présent) crée la ligne profiles
 *      automatiquement. Sinon le user existera en auth mais pas en
 *      profiles → la première connexion l'initialisera.
 *   3. Affiche les credentials à transmettre.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Charge .env.local pour récupérer NEXT_PUBLIC_SUPABASE_URL.
// SUPABASE_SERVICE_ROLE_KEY doit être passé en variable d'env explicite à
// l'invocation pour éviter de le commiter dans .env.local.
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL manquant (introuvable dans .env.local).')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant.')
  console.error('   Passe-la en variable d\'env :')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/create-user.mjs <email> <password>')
  console.error('   La clé est dans Supabase dashboard → Settings → API → "service_role".')
  process.exit(1)
}

const [, , email, password, ...nameParts] = process.argv
if (!email || !password) {
  console.error('❌ Usage : node scripts/create-user.mjs <email> <password> [<full_name>]')
  process.exit(1)
}
const fullName = nameParts.join(' ') || null

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log(`→ Création de ${email}...`)

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // auto-confirmé : pas de mail de validation
  user_metadata: fullName ? { full_name: fullName } : undefined,
})

if (error) {
  console.error('❌ Erreur :', error.message)
  // Cas fréquent : user already exists → on tente de récupérer l'id pour info.
  if (error.message?.toLowerCase().includes('already')) {
    console.error('   L\'utilisateur existe déjà. Pour reset son mot de passe :')
    console.error(`   admin.auth.admin.updateUserById(id, { password: '...' })`)
  }
  process.exit(1)
}

console.log('')
console.log('✅ Compte créé avec succès')
console.log('')
console.log(`   Email    : ${email}`)
console.log(`   Password : ${password}`)
console.log(`   User ID  : ${data.user?.id}`)
console.log(`   Status   : email_confirmed (login immédiat sans validation)`)
console.log('')
console.log('→ Stéphanie peut se connecter directement sur https://ortho-ia.vercel.app/auth/login')
console.log('  avec ces credentials. Elle pourra changer son mot de passe via Mon profil.')
