import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: "CGU — Ortho.ia",
  description: "Conditions Générales d'Utilisation d'Ortho.ia",
}

export default function CGUPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--fg-1)', fontFamily: 'var(--font-body)' }}>
      <header
        className="sticky top-0 z-50 backdrop-blur"
        style={{
          borderBottom: '1px solid var(--border-ds)',
          background: 'color-mix(in srgb, var(--bg-canvas) 92%, transparent)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ color: 'var(--fg-2)', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            <span style={{ fontSize: 14 }}>Accueil</span>
          </Link>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)' }}>CGU</p>
          <div style={{ width: 80 }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--fg-1)' }}>
          Conditions Générales d&apos;Utilisation
        </h1>
        <p style={{ fontSize: 14, color: 'var(--fg-3)', marginTop: 8 }}>Dernière mise à jour : 20 avril 2026</p>

        <Section title="1. Éditeur du service">
          <p>
            Ortho.ia (ci-après &ldquo;le Service&rdquo;) est édité par Rémi Berrio.
            Contact : remi.berrio@gmail.com.
          </p>
        </Section>

        <Section title="2. Description du service">
          <p>
            Ortho.ia est un service SaaS destiné aux orthophonistes diplômé·e·s exerçant en France.
            Il permet de rédiger, stocker et exporter des Comptes Rendus de Bilan Orthophonique (CRBO)
            assistés par un système de génération de texte automatisé.
          </p>
        </Section>

        <Section title="3. Génération automatique des contenus">
          <p>
            <strong>Rédaction automatique :</strong> Le Service utilise un système de génération de
            texte automatisé propriétaire, paramétré pour l&apos;orthophonie francophone, afin de
            produire des brouillons de comptes-rendus à partir des informations saisies par
            l&apos;utilisateur (anamnèse, résultats de tests, notes d&apos;analyse).
          </p>
          <p>
            <strong>Anonymisation préalable :</strong> Avant tout traitement automatique,
            les données nominatives (prénom et nom du patient, prénom et nom du médecin prescripteur,
            coordonnées de l&apos;orthophoniste) sont remplacées par des identifiants techniques non
            signifiants. Aucune donnée nominative n&apos;est transmise au système de génération.
            Les valeurs réelles sont réintégrées uniquement côté serveur après réception de la réponse.
          </p>
          <p>
            <strong>Responsabilité clinique :</strong> Les contenus générés constituent
            exclusivement des <em>brouillons techniques</em>. L&apos;orthophoniste utilisateur·rice demeure
            <strong> seul·e responsable</strong> du diagnostic, de l&apos;interprétation clinique et du
            contenu final du compte-rendu transmis au patient ou au médecin prescripteur. Toute relecture
            et validation clinique avant envoi est obligatoire.
          </p>
          <p>
            <strong>Hébergement :</strong> L&apos;application est hébergée dans l&apos;Union Européenne.
            Une migration vers un hébergeur certifié HDS (Hébergeur de Données de Santé) est planifiée.
          </p>
        </Section>

        <Section title="4. Création de compte et éligibilité">
          <p>
            L&apos;inscription est ouverte aux orthophonistes diplômé·e·s. L&apos;utilisateur·rice déclare,
            en créant son compte, disposer d&apos;un numéro ADELI / RPPS valide et exercer légalement la
            profession d&apos;orthophoniste en France ou dans l&apos;Union Européenne.
          </p>
          <p>
            L&apos;utilisateur·rice s&apos;engage à fournir des informations exactes lors de son inscription
            et à maintenir la confidentialité de ses identifiants.
          </p>
        </Section>

        <Section title="5. Abonnement et tarification">
          <p>
            <strong>Phase beta :</strong> Pendant la période beta, l&apos;accès au Service est gratuit
            et sans engagement. Aucune carte bancaire n&apos;est demandée à l&apos;inscription.
          </p>
          <p>
            <strong>Offre Pro (à venir) :</strong> 24,90 €/mois en facturation mensuelle sans engagement,
            ou 199 €/an en facturation annuelle (économie ~33 % par rapport au mensuel). Les prix sont
            indiqués TTC.
          </p>
          <p>
            L&apos;abonnement mensuel est résiliable à tout moment depuis l&apos;espace client. La
            résiliation prend effet à la fin de la période en cours. L&apos;abonnement annuel n&apos;est
            pas remboursable une fois la période commencée, sauf cas prévus par la loi.
          </p>
        </Section>

        <Section title="6. Obligations de l'utilisateur">
          <p>L&apos;utilisateur·rice s&apos;engage à :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ne saisir que des informations strictement nécessaires à la rédaction du compte-rendu ;</li>
            <li>
              Obtenir le consentement éclairé du patient (ou de son représentant légal) pour
              l&apos;utilisation d&apos;un outil d&apos;aide à la rédaction automatique ;
            </li>
            <li>Relire intégralement chaque compte-rendu généré avant transmission ;</li>
            <li>
              Ne pas utiliser le Service à des fins frauduleuses ou contraires à la déontologie
              professionnelle.
            </li>
          </ul>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>
            Les comptes-rendus générés via le Service appartiennent à l&apos;orthophoniste utilisateur·rice,
            qui conserve tous les droits sur les contenus produits. Les marques et interfaces du Service
            demeurent la propriété exclusive de son éditeur.
          </p>
        </Section>

        <Section title="8. Données personnelles (RGPD)">
          <p>
            Voir notre{' '}
            <Link href="/confidentialite" style={{ color: 'var(--fg-link)', textDecoration: 'underline' }}>
              politique de confidentialité
            </Link>{' '}
            pour le détail du traitement des données, vos droits d&apos;accès, de rectification, de
            suppression et de portabilité, et les modalités d&apos;exercice de ces droits.
          </p>
        </Section>

        <Section title="9. Responsabilité et garanties">
          <p>
            Le Service est fourni &ldquo;en l&apos;état&rdquo;. L&apos;éditeur ne peut être tenu responsable
            des conséquences cliniques, administratives ou financières liées à l&apos;utilisation de
            brouillons générés automatiquement sans relecture clinique de l&apos;orthophoniste.
          </p>
        </Section>

        <Section title="10. Modification des CGU">
          <p>
            L&apos;éditeur peut modifier les présentes CGU. Les utilisateurs seront informés par email au
            moins 15 jours avant l&apos;entrée en vigueur des nouvelles conditions.
          </p>
        </Section>

        <Section title="11. Droit applicable et juridiction">
          <p>
            Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des
            tribunaux français.
          </p>
        </Section>

        <div
          className="mt-12 pt-8"
          style={{ borderTop: '1px solid var(--border-ds)', fontSize: 14, color: 'var(--fg-3)' }}
        >
          <Link href="/confidentialite" style={{ color: 'var(--fg-link)', textDecoration: 'underline' }}>
            Politique de confidentialité →
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <div style={{ color: 'var(--fg-2)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </section>
  )
}
