'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  FileText,
  CheckCircle,
  Clock,
  Shield,
  ChevronRight,
  Menu,
  X,
  Star
} from 'lucide-react'
import InfographieB from '@/components/InfographieB'
import FAQ from '@/components/FAQ'
import LandingStats from '@/components/LandingStats'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(true)

  return (
    <div className="min-h-screen bg-white">
      {/* Bandeau Beta */}
      <Link
        href="/beta"
        className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center text-xs sm:text-sm font-medium py-2 px-4 hover:brightness-110 transition block"
      >
        <span className="sm:hidden">✨ Beta · <strong>3 mois offerts</strong> · S&apos;inscrire →</span>
        <span className="hidden sm:inline">✨ Version beta — <strong>3 mois offerts</strong> pour les premiers orthophonistes · <u>Rejoindre la beta</u></span>
      </Link>
      {/* Navigation */}
      <nav className="fixed top-[36px] left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Ortho<span className="text-green-600">.ia</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#fonctionnalites" className="text-gray-600 hover:text-gray-900 transition">Fonctionnalités</a>
              <a href="#tarifs" className="text-gray-600 hover:text-gray-900 transition">Abonnement</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition">FAQ</a>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition">Connexion</Link>
              <Link 
                href="/auth/register" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
              >
                Essai gratuit
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4">
            <div className="flex flex-col space-y-4 px-4">
              <a href="#fonctionnalites" className="text-gray-600">Fonctionnalités</a>
              <a href="#tarifs" className="text-gray-600">Abonnement</a>
              <a href="#faq" className="text-gray-600">FAQ</a>
              <Link href="/auth/login" className="text-gray-600">Connexion</Link>
              <Link 
                href="/auth/register" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-center font-medium"
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Réduisez votre temps de rédaction de comptes rendus,{' '}
              <span className="gradient-text">un point c'est tout.</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Ortho.ia transforme vos notes et résultats de bilan en comptes rendus 
              professionnels et complets en quelques clics !
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register" 
                className="btn-pulse bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition font-semibold text-lg flex items-center justify-center gap-2"
              >
                Commencer mon essai gratuit
                <ChevronRight size={20} />
              </Link>
              <a 
                href="#demo" 
                className="bg-gray-100 text-gray-800 px-8 py-4 rounded-xl hover:bg-gray-200 transition font-semibold text-lg"
              >
                Voir la démo
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              ✓ 3 mois gratuits en Beta &nbsp;&nbsp; ✓ Sans engagement &nbsp;&nbsp; ✓ Sans carte bancaire
            </p>
          </div>

          {/* Infographie avant/après */}
          <div className="mt-16">
            <InfographieB />
          </div>

          {/* Punchline : "Maudire vos CRBO," normal + "c'est du passé !" souligné main levée */}
          <p className="mt-12 text-center text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            <span className="gradient-text">Maudire vos CRBO,</span>{' '}
            <span className="relative inline-block whitespace-nowrap">
              <span className="gradient-text">c&apos;est du passé&nbsp;!</span>
              {/* Underline brush main levée — 2 paths décalés pour effet crayon/pinceau */}
              <svg
                aria-hidden="true"
                viewBox="0 0 300 18"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-x-0 -bottom-1.5 h-[0.45em] w-full text-primary-700 dark:text-primary-500"
              >
                <path
                  d="M 4 11 C 45 5, 85 14, 130 9 S 210 13, 255 8 S 290 12, 296 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-underline-draw"
                />
                <path
                  d="M 8 13 C 60 9, 110 15, 160 11 C 210 8, 250 13, 292 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </svg>
            </span>
          </p>

          {/* Stats publiques animées */}
          <LandingStats />
        </div>
      </section>

      {/* How it works */}
      <section id="fonctionnalites" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Une IA conçue pour les orthos, <span className="text-green-600">par des orthos !</span>
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Trois étapes pour dédier plus de temps à vos patients
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm card-hover">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-green-600 font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Entrez vos résultats</h3>
              <p className="text-gray-600">
                Entrez vos observations et résultats de tests dans notre interface intuitive. 
                Uploadez directement vos PDF ou photos de résultats.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm card-hover">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-green-600 font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Génération par IA</h3>
              <p className="text-gray-600">
                Notre IA spécialisée transforme vos notes en un compte rendu structuré 
                en quelques secondes. Pas de prompt, pas de migraine !
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm card-hover">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-green-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Relisez et finalisez</h3>
              <p className="text-gray-600">
                Révisez si nécessaire, et exportez votre compte rendu en Word, 
                prêt à être envoyé au médecin et au patient !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              En bref, le meilleur des outils CRBO couplé à l'IA
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <Clock className="text-green-600 mb-4" size={28} />
              <h3 className="font-semibold text-gray-900 mb-2">Gain de temps</h3>
              <p className="text-gray-600 text-sm">CRBO généré en 15 minutes, relecture incluse</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <FileText className="text-green-600 mb-4" size={28} />
              <h3 className="font-semibold text-gray-900 mb-2">Initial & Renouvellement</h3>
              <p className="text-gray-600 text-sm">Adapté à tous vos types de bilans</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <Shield className="text-green-600 mb-4" size={28} />
              <h3 className="font-semibold text-gray-900 mb-2">Données sécurisées</h3>
              <p className="text-gray-600 text-sm">Hébergeur certifié HDS (Scaleway)</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <CheckCircle className="text-green-600 mb-4" size={28} />
              <h3 className="font-semibold text-gray-900 mb-2">Tests compatibles</h3>
              <p className="text-gray-600 text-sm">Exalang, EVALO, ELO, et plus encore</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Un tarif simple et transparent
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Commencez gratuitement, passez Pro quand vous êtes prête
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  !billingAnnual
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBillingAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
                  billingAnnual
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annuel
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  billingAnnual ? 'bg-white text-green-700' : 'bg-green-100 text-green-700'
                }`}>
                  -25%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Gratuit</h3>
              <p className="text-gray-600 mt-2">Pour découvrir Ortho.ia</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">0€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  <span className="text-gray-600">3 CRBO gratuits</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  <span className="text-gray-600">Tous les tests supportés</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  <span className="text-gray-600">Export Word</span>
                </li>
              </ul>
              <Link 
                href="/auth/register" 
                className="mt-8 block w-full bg-gray-100 text-gray-800 py-3 rounded-xl text-center font-semibold hover:bg-gray-200 transition"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-green-600 rounded-2xl p-8 shadow-lg relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                ✨ 3 mois offerts (Beta)
              </div>
              <h3 className="text-xl font-semibold text-white">Pro</h3>
              <p className="text-green-100 mt-2">Pour les orthophonistes en activité</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-white">
                  {billingAnnual ? '14,90€' : '19,90€'}
                </span>
                <span className="text-green-100">/mois</span>
              </div>
              <p className="mt-2 text-xs text-green-100 min-h-[18px]">
                {billingAnnual
                  ? 'Facturé 178,80€/an · économisez 60€'
                  : 'Sans engagement · résiliable à tout moment'}
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-white flex-shrink-0" size={20} />
                  <span className="text-white">CRBO illimités</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-white flex-shrink-0" size={20} />
                  <span className="text-white">Tous les tests supportés</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-white flex-shrink-0" size={20} />
                  <span className="text-white">Export Word</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-white flex-shrink-0" size={20} />
                  <span className="text-white">Historique complet</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-white flex-shrink-0" size={20} />
                  <span className="text-white">Support prioritaire</span>
                </li>
              </ul>
              <Link
                href={`/auth/register?plan=pro&billing=${billingAnnual ? 'annual' : 'monthly'}`}
                className="mt-8 block w-full bg-white text-green-600 py-3 rounded-xl text-center font-semibold hover:bg-green-50 transition"
              >
                Commencer l&apos;essai Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="temoignages" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Témoignages à venir
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Les premier·ère·s utilisateur·rice·s testent actuellement Ortho.ia. <br className="hidden sm:block" />
              Leurs retours seront publiés ici prochainement.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white shadow-sm mb-4">
                <Star className="text-yellow-400 fill-current" size={24} />
              </div>
              <p className="text-gray-700 text-lg font-medium">
                Vous êtes orthophoniste et vous aimeriez tester Ortho.ia en avant-première&nbsp;?
              </p>
              <p className="text-gray-600 mt-3">
                Rejoignez les premier·ère·s utilisateur·rice·s — 3 CRBO gratuits, sans carte bancaire.
              </p>
              <Link
                href="/auth/register"
                className="mt-6 inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Commencer l&apos;essai gratuit
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Prêt·e à gagner du temps ?
          </h2>
          <p className="mt-4 text-xl text-green-100">
            Rejoignez les orthophonistes qui ont déjà adopté Ortho.ia
          </p>
          <Link 
            href="/auth/register" 
            className="mt-8 inline-block bg-white text-green-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-50 transition"
          >
            Commencer mon essai gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="font-bold text-xl text-white">Ortho<span className="text-green-400">.ia</span></span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-400 text-sm justify-center">
              <Link href="/beta" className="hover:text-white transition">Rejoindre la beta</Link>
              <Link href="/roadmap" className="hover:text-white transition">Roadmap</Link>
              <Link href="/cgu" className="hover:text-white transition">CGU</Link>
              <Link href="/confidentialite" className="hover:text-white transition">Confidentialité</Link>
              <a href="mailto:remi.berrio@gmail.com" className="hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Ortho.ia. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
