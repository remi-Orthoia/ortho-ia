'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  question: string
  answer: React.ReactNode
}

const FAQS: FAQItem[] = [
  {
    question: "Mes données patients sont-elles sécurisées ?",
    answer: (
      <>
        <p>
          Oui. Avant tout envoi à l&apos;IA (Claude d&apos;Anthropic), les données
          nominatives de vos patients (prénom, nom, nom du médecin, vos
          coordonnées) sont <strong>anonymisées par des identifiants techniques</strong>.
          Elles sont réhydratées uniquement sur nos serveurs après réception.
        </p>
        <p className="mt-2">
          Les mots de passe sont hachés, les communications sont chiffrées en TLS,
          et un Row-Level Security PostgreSQL empêche tout accès croisé aux
          données d&apos;un autre orthophoniste. Une migration vers un hébergeur
          certifié <strong>HDS (Hébergeur de Données de Santé)</strong> est
          prévue avant la montée en charge commerciale.
        </p>
      </>
    ),
  },
  {
    question: "Quels tests orthophoniques sont compatibles ?",
    answer: (
      <>
        <p>Ortho.ia connaît les référentiels de :</p>
        <ul className="list-disc pl-5 mt-2 space-y-0.5">
          <li><strong>Batterie HappyNeuron</strong> — Exalang 3-6, 5-8, 8-11, 11-15 et Examath</li>
          <li><strong>Langage oral</strong> — ELO, EVALO 2-6, N-EEL, BILO, EVALEO 6-15</li>
          <li><strong>Langage écrit</strong> — BALE, BELEC</li>
          <li><strong>Adulte / senior</strong> — MoCA (screening), BETL</li>
          <li><strong>Observation clinique</strong> — OMF / Déglutition</li>
        </ul>
        <p className="mt-2 text-sm text-gray-500">
          Chaque module intègre les règles de conversion de percentiles (Q1→P25, Med→P50, Q3→P75)
          et les seuils cliniques officiels (FNO).
        </p>
      </>
    ),
  },
  {
    question: "Combien de temps pour générer un CRBO ?",
    answer: (
      <p>
        Entre <strong>15 et 40 secondes</strong> selon la complexité du bilan
        (nombre de tests, longueur de l&apos;anamnèse). Sur un bilan Exalang 8-11
        standard, comptez 20 secondes. La relecture clinique reste obligatoire
        avant envoi au médecin et au patient.
      </p>
    ),
  },
  {
    question: "L'IA peut-elle remplacer mon jugement clinique ?",
    answer: (
      <>
        <p>
          <strong>Non — et c&apos;est volontaire.</strong> Ortho.ia produit un
          brouillon structuré, cliniquement cohérent, mais vous restez
          entièrement responsable du diagnostic, de l&apos;interprétation et du
          contenu final du compte-rendu.
        </p>
        <p className="mt-2">
          L&apos;outil est conçu pour vous faire gagner du temps sur la rédaction,
          pas pour se substituer à votre expertise. Chaque CRBO doit être
          relu et validé avant transmission.
        </p>
      </>
    ),
  },
  {
    question: "Comment fonctionne l'import PDF ?",
    answer: (
      <p>
        Vous uploadez le PDF de résultats de votre logiciel (Exalang, Examath…) directement
        dans Ortho.ia. Claude Vision extrait automatiquement chaque épreuve avec son score,
        son écart-type et son percentile, dans la notation exacte du document (Q1, Med, Q3, P5…).
        Les percentiles ne sont <strong>jamais recalculés depuis l&apos;écart-type</strong>,
        les normes du test priment.
      </p>
    ),
  },
  {
    question: "Mes CRBOs sont-ils conservés ?",
    answer: (
      <p>
        Tous vos CRBOs sont sauvegardés dans votre historique personnel, classés par
        patient avec timeline d&apos;évolution des scores. Vous pouvez les télécharger
        en Word à tout moment, les éditer, ou les supprimer. Les données sont
        conservées tant que votre compte est actif, puis 12 mois après résiliation
        (obligation légale de conservation comptable).
      </p>
    ),
  },
  {
    question: "Que contient le Word généré ?",
    answer: (
      <>
        <p>Un CRBO professionnel complet incluant :</p>
        <ul className="list-disc pl-5 mt-2 space-y-0.5">
          <li>En-tête de vos coordonnées professionnelles</li>
          <li>Fiche patient + médecin prescripteur</li>
          <li>Badge de sévérité globale (Léger / Modéré / Sévère)</li>
          <li>Graphique de synthèse des percentiles moyens par domaine</li>
          <li>Anamnèse rédigée en prose fluide (jamais de notes brutes)</li>
          <li>Tableaux par domaine avec code couleur par seuil clinique et colonne Interprétation</li>
          <li>Diagnostic, comorbidités suspectées, recommandations, aménagements PAP/PPS</li>
          <li>Glossaire des termes techniques pour les parents et médecins</li>
          <li>Pour un renouvellement : tableau comparatif avec flèches d&apos;évolution</li>
        </ul>
      </>
    ),
  },
  {
    question: "Comment se passe la période Beta ?",
    answer: (
      <>
        <p>
          Les <strong>3 premiers mois sont offerts</strong> à tout orthophoniste
          qui s&apos;inscrit pendant la phase Beta. Aucune carte bancaire n&apos;est
          demandée à l&apos;inscription.
        </p>
        <p className="mt-2">
          En échange, un retour régulier sur l&apos;outil nous aide à affiner le
          prompt et à corriger les coquilles. Nous privilégions un groupe réduit
          pour itérer vite.
        </p>
      </>
    ),
  },
  {
    question: "Puis-je l'utiliser sur tablette ou téléphone ?",
    answer: (
      <p>
        Oui, l&apos;interface est responsive. Pour la prise de notes en séance sur
        smartphone, cela fonctionne. Pour la génération et l&apos;export Word, un
        écran d&apos;ordinateur reste plus confortable, notamment pour relire les
        tableaux détaillés.
      </p>
    ),
  },
  {
    question: "Et si je veux arrêter ?",
    answer: (
      <p>
        Vous pouvez résilier votre abonnement mensuel à tout moment depuis votre
        espace personnel ; la résiliation prend effet en fin de période. L&apos;abonnement
        annuel n&apos;est pas remboursable mais reste actif jusqu&apos;à échéance.
        Vous pouvez également exporter et supprimer l&apos;ensemble de vos données
        conformément au RGPD.
      </p>
    ),
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Questions fréquentes
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Tout ce que vous devez savoir avant de vous lancer.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const open = openIndex === idx
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                  aria-expanded={open}
                >
                  <span className="font-semibold text-gray-900">{item.question}</span>
                  {open ? (
                    <ChevronUp className="shrink-0 text-green-600" size={20} />
                  ) : (
                    <ChevronDown className="shrink-0 text-gray-400" size={20} />
                  )}
                </button>
                {open && (
                  <div className="px-6 pb-5 text-gray-700 leading-relaxed border-t border-gray-100 pt-4">
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-600">
            Une autre question ? Écrivez-nous à{' '}
            <Link href="mailto:remi.berrio@gmail.com" className="text-green-600 hover:underline font-medium">
              remi.berrio@gmail.com
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
