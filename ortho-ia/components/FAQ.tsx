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
          <strong>Oui.</strong> Avant tout traitement automatique, les données nominatives
          de vos patients (prénom, nom, nom du médecin, vos coordonnées) sont
          <strong> anonymisées par des identifiants techniques</strong>.
          Elles sont <strong>réhydratées uniquement sur nos serveurs</strong> après
          réception.
        </p>
        <p className="mt-2">
          Les <strong>mots de passe sont hachés</strong>, les communications sont{' '}
          <strong>chiffrées en TLS</strong>, et un <strong>Row-Level Security
          PostgreSQL</strong> empêche tout accès croisé aux données d&apos;un autre
          orthophoniste. Une migration vers un hébergeur certifié{' '}
          <strong>HDS (Hébergeur de Données de Santé)</strong> est prévue avant la
          montée en charge commerciale.
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
          Chaque module intègre les <strong>règles de conversion de percentiles</strong>{' '}
          (Q1→P25, Med→P50, Q3→P75) et les <strong>seuils cliniques officiels (FNO)</strong>.
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
        standard, comptez <strong>20 secondes</strong>. La <strong>relecture
        clinique reste obligatoire</strong> avant envoi au médecin et au patient.
      </p>
    ),
  },
  {
    question: "Ortho.ia peut-il remplacer mon jugement clinique ?",
    answer: (
      <>
        <p>
          <strong>Non — et c&apos;est volontaire.</strong> Ortho.ia produit un{' '}
          <strong>brouillon complet</strong> structuré et cliniquement cohérent,
          mais vous restez <strong>entièrement responsable du diagnostic</strong>,
          de l&apos;interprétation et du contenu final du compte-rendu.
        </p>
        <p className="mt-2">
          L&apos;outil est conçu pour vous faire gagner du temps sur la rédaction,
          pas pour se substituer à votre expertise. Nous vous{' '}
          <strong>conseillons de relire et valider</strong> chaque CRBO avant
          transmission.
        </p>
      </>
    ),
  },
  {
    question: "En quoi Ortho.ia est-il meilleur que ChatGPT pour rédiger mes CRBO ?",
    answer: (
      <>
        <p>
          ChatGPT est un couteau suisse généraliste. <strong>Ortho.ia est un outil
          clinique, conçu pour et avec des orthophonistes.</strong> La différence se
          joue sur huit points concrets :
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            <strong>Connaissance des batteries françaises</strong> — Exalang (3-6, 5-8,
            8-11, 11-15), Examath, ELO, EVALO, N-EEL, BILO, EVALEO, BALE, BELEC, MoCA,
            BETL, OMF. Chaque module connaît les domaines évalués, les seuils, les
            pièges cliniques.
          </li>
          <li>
            <strong>Règles de percentiles FNO respectées</strong> — Q1 = P25, Med = P50,
            Q3 = P75. Les normes du test priment toujours sur l&apos;écart-type.
            ChatGPT recalcule à tort P6 depuis un É-T de -1.53 et vous transforme un
            Normal en Déficitaire.
          </li>
          <li>
            <strong>Anonymisation RGPD automatique</strong> — prénom, nom, médecin,
            coordonnées sont tokenisés avant l&apos;API, jamais besoin de les retirer
            à la main avant de prompter.
          </li>
          <li>
            <strong>Sortie structurée prête à envoyer</strong> — Word professionnel
            avec en-tête, graphiques de percentiles, tableaux colorés par seuil
            clinique, conclusions, PAP/PPS. Pas un bloc de texte à remettre en
            forme.
          </li>
          <li>
            <strong>Gestion du renouvellement</strong> — comparaison automatique avec
            le bilan précédent, tableau d&apos;évolution avec flèches ↑ ↓ →, synthèse
            narrative de la progression.
          </li>
          <li>
            <strong>Historique patient + carnet intégré</strong> — timeline des scores,
            Kanban des CRBO en cours, carnet patients et médecins. ChatGPT vous oblige
            à tout recopier à chaque session.
          </li>
          <li>
            <strong>Zéro prompt à rédiger</strong> — vous remplissez un formulaire clair,
            l&apos;outil fait le reste. Pas de formule magique à mémoriser, pas de
            paramètres à régler, pas de &quot;tu es un orthophoniste expert…&quot;.
          </li>
          <li>
            <strong>Prompts validés cliniquement</strong> — itérés avec des
            orthophonistes en exercice sur de vrais bilans, pas par un modèle généraliste
            qui invente parfois des épreuves qui n&apos;existent pas.
          </li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">
          Autrement dit : ChatGPT peut vous aider à écrire un email ; Ortho.ia rédige
          votre CRBO à votre place, dans le cadre clinique correct.
        </p>
      </>
    ),
  },
  {
    question: "Comment fonctionne l'import PDF ?",
    answer: (
      <p>
        Vous uploadez le PDF de résultats de votre logiciel (Exalang, Examath…) directement
        dans Ortho.ia. <strong>Le moteur d&apos;extraction lit automatiquement</strong> chaque épreuve
        avec son score, son écart-type et son percentile, dans la{' '}
        <strong>notation exacte du document</strong> (Q1, Med, Q3, P5…). Les percentiles ne
        sont <strong>jamais recalculés depuis l&apos;écart-type</strong>, les normes du test
        priment.
      </p>
    ),
  },
  {
    question: "Mes CRBOs sont-ils conservés ?",
    answer: (
      <p>
        Tous vos CRBOs sont sauvegardés dans votre <strong>historique personnel</strong>,
        classés par patient avec <strong>timeline d&apos;évolution des scores</strong>.
        Vous pouvez les <strong>télécharger en Word à tout moment</strong>, les éditer, ou
        les supprimer. Les données sont conservées tant que votre compte est actif, puis{' '}
        <strong>12 mois après résiliation</strong> (obligation légale de conservation
        comptable).
      </p>
    ),
  },
  {
    question: "Que contient le Word généré ?",
    answer: (
      <>
        <p>Un <strong>CRBO professionnel complet</strong> incluant :</p>
        <ul className="list-disc pl-5 mt-2 space-y-0.5">
          <li><strong>En-tête</strong> de vos coordonnées professionnelles</li>
          <li><strong>Fiche patient + médecin prescripteur</strong></li>
          <li><strong>Badge de sévérité globale</strong> (Léger / Modéré / Sévère)</li>
          <li><strong>Graphique de synthèse</strong> des percentiles moyens par domaine</li>
          <li><strong>Anamnèse rédigée en prose fluide</strong> (jamais de notes brutes)</li>
          <li><strong>Tableaux par domaine</strong> avec code couleur par seuil clinique et colonne Interprétation</li>
          <li><strong>Diagnostic, comorbidités, recommandations, aménagements PAP/PPS</strong></li>
          <li>Pour un <strong>renouvellement</strong> : tableau comparatif avec flèches d&apos;évolution</li>
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
          qui s&apos;inscrit pendant la phase Beta. <strong>Aucune carte bancaire</strong>{' '}
          n&apos;est demandée à l&apos;inscription.
        </p>
        <p className="mt-2">
          En échange, un <strong>retour régulier sur l&apos;outil</strong> nous aide à
          affiner le prompt et à corriger les coquilles. Nous privilégions un{' '}
          <strong>groupe réduit pour itérer vite</strong>.
        </p>
      </>
    ),
  },
  {
    question: "Puis-je l'utiliser sur tablette ou téléphone ?",
    answer: (
      <p>
        <strong>Oui, l&apos;interface est responsive.</strong> Pour la{' '}
        <strong>prise de notes en séance sur smartphone</strong>, cela fonctionne.
        Pour la <strong>génération et l&apos;export Word</strong>, un écran
        d&apos;ordinateur reste plus confortable, notamment pour relire les tableaux
        détaillés.
      </p>
    ),
  },
  {
    question: "Et si je veux arrêter ?",
    answer: (
      <p>
        Vous pouvez <strong>résilier votre abonnement mensuel à tout moment</strong>{' '}
        depuis votre espace personnel ; la résiliation prend effet{' '}
        <strong>en fin de période</strong>. Vous pouvez également{' '}
        <strong>mettre en pause votre abonnement mensuel à tout moment</strong>, pour
        vos congés ou une période sans bilan — <strong>vous ne serez pas facturé·e
        pendant la pause</strong> et <strong>vos données restent intactes</strong>.
        L&apos;abonnement annuel <strong>n&apos;est pas remboursable</strong> mais
        reste actif jusqu&apos;à échéance. Vous pouvez également{' '}
        <strong>exporter et supprimer l&apos;ensemble de vos données</strong>{' '}
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
            <Link href="mailto:LeBureauDuSupport@orthoia.fr" className="text-green-600 hover:underline font-medium">
              LeBureauDuSupport@orthoia.fr
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
