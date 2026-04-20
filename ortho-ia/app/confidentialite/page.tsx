import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: "Politique de confidentialité — Ortho.ia",
  description: "Traitement des données personnelles sur Ortho.ia (RGPD)",
}

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} />
            <span className="text-sm">Accueil</span>
          </Link>
          <p className="text-sm font-semibold text-gray-800">Politique de confidentialité</p>
          <div className="w-[80px]" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
        <p className="text-sm text-gray-500 mt-2">Dernière mise à jour : 20 avril 2026</p>

        <Section title="1. Responsable du traitement">
          <p>Rémi Berrio — contact : remi.berrio@gmail.com.</p>
        </Section>

        <Section title="2. Données collectées">
          <p><strong>Compte orthophoniste :</strong> nom, prénom, email, mot de passe (haché), coordonnées professionnelles.</p>
          <p><strong>CRBO et dossiers patients :</strong> prénom, nom, date de naissance, classe, résultats de tests, anamnèse, motif, nom et coordonnées du médecin prescripteur.</p>
          <p><strong>Données techniques :</strong> logs de connexion, adresse IP, user-agent.</p>
        </Section>

        <Section title="3. Finalités du traitement">
          <ul className="list-disc pl-6 space-y-1">
            <li>Authentification et gestion du compte utilisateur·rice ;</li>
            <li>Génération, stockage et export des comptes-rendus ;</li>
            <li>Facturation et gestion de l&apos;abonnement ;</li>
            <li>Amélioration du service (métriques agrégées anonymes) ;</li>
            <li>Respect des obligations légales.</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>
            Le traitement repose sur l&apos;exécution du contrat de service (art. 6.1.b RGPD) pour les
            données nécessaires au fonctionnement du compte, et sur votre consentement explicite
            (art. 6.1.a RGPD) pour les traitements optionnels.
          </p>
        </Section>

        <Section title="5. Transmission à des sous-traitants">
          <p>
            Les données nominatives liées aux <strong>patients</strong> sont <strong>anonymisées avant
            transmission à l&apos;API Claude</strong> (Anthropic, Inc.) pour la génération des brouillons
            de comptes-rendus. Les identifiants réels (prénom, nom du patient, nom du médecin, coordonnées
            de l&apos;orthophoniste) ne quittent jamais notre infrastructure en clair.
          </p>
          <p>Nos sous-traitants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> (hébergement base de données, région Paris eu-west-3) ;</li>
            <li><strong>Vercel</strong> (hébergement de l&apos;application) ;</li>
            <li><strong>Anthropic</strong> (API Claude, données anonymisées uniquement) ;</li>
            <li><strong>Stripe</strong> (paiements, lorsque applicable).</li>
          </ul>
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            ⚠️ L&apos;hébergement actuel n&apos;est pas certifié HDS. Une migration vers un hébergeur
            HDS (Scaleway ou Clever Cloud) est prévue avant la montée en charge commerciale.
          </p>
        </Section>

        <Section title="6. Durée de conservation">
          <p>
            Les données du compte sont conservées tant que le compte est actif, puis 12 mois après
            résiliation avant suppression définitive (sauf obligation légale de conservation plus longue
            pour la comptabilité).
          </p>
          <p>
            Les comptes-rendus peuvent être supprimés à tout moment par l&apos;utilisateur·rice depuis
            l&apos;espace personnel.
          </p>
        </Section>

        <Section title="7. Vos droits">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Droit d&apos;accès et de rectification ;</li>
            <li>Droit à l&apos;effacement (&ldquo;droit à l&apos;oubli&rdquo;) ;</li>
            <li>Droit à la limitation du traitement ;</li>
            <li>Droit à la portabilité (export de vos données au format JSON/CSV) ;</li>
            <li>Droit d&apos;opposition ;</li>
            <li>Droit d&apos;introduire une réclamation auprès de la CNIL.</li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, contactez-nous à{' '}
            <a href="mailto:remi.berrio@gmail.com" className="text-green-600 hover:underline">
              remi.berrio@gmail.com
            </a>.
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Les mots de passe sont hachés. Les communications sont chiffrées en TLS. L&apos;accès aux
            données est restreint par Row-Level Security au niveau de la base de données Supabase — chaque
            utilisateur·rice ne peut accéder qu&apos;à ses propres dossiers.
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            Le Service utilise uniquement des cookies strictement nécessaires au fonctionnement
            (authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
          <Link href="/cgu" className="text-green-600 hover:underline">
            ← Conditions Générales d&apos;Utilisation
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}
