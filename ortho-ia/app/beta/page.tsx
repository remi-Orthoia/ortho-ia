'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Sparkles, CheckCircle, Loader2 } from 'lucide-react'

export default function BetaPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '',
    email: '',
    ville: '',
    tests_principaux: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.nom.trim() || !form.email.trim()) {
      setError('Merci de renseigner votre nom et votre email.')
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('beta_signups').insert({
        nom: form.nom.trim(),
        email: form.email.trim().toLowerCase(),
        ville: form.ville.trim() || null,
        tests_principaux: form.tests_principaux.trim() || null,
      })
      if (error) {
        if (error.message?.includes('duplicate')) {
          setError('Cet email est déjà inscrit sur la liste beta — on vous contactera très bientôt.')
        } else {
          setError('Une erreur est survenue. Réessayez ou écrivez à remi.berrio@gmail.com')
        }
        return
      }
      setSuccess(true)
    } catch {
      setError('Erreur réseau — réessayez.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-primary-900/20 dark:via-surface-dark dark:to-emerald-900/10 flex items-center justify-center px-4">
        <div className="card-lifted max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-5 animate-check-bounce">
            <CheckCircle className="text-primary-600 dark:text-primary-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Merci pour votre inscription 🙌
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Vous êtes sur la liste des beta testeurs. Nous vous enverrons vos identifiants
            d&apos;accès dans les 48 heures. Surveillez votre boîte mail (pensez à vérifier les
            spams).
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Les <strong>3 premiers mois sont offerts</strong> pour les beta testeurs.
          </p>
          <Link href="/" className="btn-primary mt-6">
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-primary-900/20 dark:via-surface-dark dark:to-emerald-900/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm mb-6"
        >
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <div className="card-lifted p-6 sm:p-10">
          <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400 font-semibold uppercase text-xs tracking-wider">
            <Sparkles size={14} />
            Beta fermée — Accès gratuit 3 mois
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Rejoignez la beta Ortho.ia
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
            Vous êtes orthophoniste diplômé·e et vous voulez tester l&apos;outil qui transforme
            vos bilans Exalang, Examath, MoCA ou BETL en CRBO professionnels en 20 secondes ?
            Inscrivez-vous : <strong>accès gratuit illimité pendant 3 mois</strong>, en échange
            de vos retours réguliers sur le produit.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nom et prénom *" required>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Marie Durand"
                  className="input-modern"
                  autoComplete="name"
                />
              </Field>
              <Field label="Email *" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@exemple.fr"
                  className="input-modern"
                  autoComplete="email"
                />
              </Field>
            </div>

            <Field label="Ville d'exercice">
              <input
                type="text"
                value={form.ville}
                onChange={(e) => setForm({ ...form, ville: e.target.value })}
                placeholder="Lyon, Paris, Marseille…"
                className="input-modern"
              />
            </Field>

            <Field label="Tests que vous utilisez principalement">
              <textarea
                value={form.tests_principaux}
                onChange={(e) => setForm({ ...form, tests_principaux: e.target.value })}
                placeholder="Ex : Exalang 8-11, Examath, BALE, ELO, MoCA…"
                rows={2}
                className="textarea-modern"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Nous priorisons les profils qui utilisent les tests déjà supportés par l&apos;outil
              </p>
            </Field>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-3 px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Rejoindre la beta
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Pas de carte bancaire · réponse sous 48h · données chiffrées
              </p>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-surface-dark-muted text-sm text-gray-500 dark:text-gray-500">
            <p>En nous rejoignant, vous acceptez de recevoir nos emails liés au produit.</p>
            <p className="mt-1">
              Consultez notre{' '}
              <Link href="/confidentialite" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                politique de confidentialité
              </Link>{' '}
              et nos{' '}
              <Link href="/cgu" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                CGU
              </Link>
              . Désinscription possible à tout moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
