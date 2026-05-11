'use client'

/**
 * Page Actualités — newsletter pro intégrée.
 *
 * V1 : articles statiques hardcodés (déclarés en TSX ci-dessous). Plus de
 * friction pour publier qu'un blog complet, mais zéro mail dans la boîte
 * de l'ortho, lecture quand elle veut.
 *
 * V2 : migration vers une table `news_articles` Supabase + page admin.
 * Pour l'instant, les articles tournent au rythme des sorties produit /
 * publis HAS pertinentes. Modifier directement le tableau ci-dessous et
 * redéployer.
 */

import Link from 'next/link'
import { Sparkles, BookOpen, Calendar, Tag, ExternalLink, Mail } from 'lucide-react'

interface Article {
  id: string
  title: string
  excerpt: string
  date: string // ISO
  category: 'produit' | 'recherche' | 'has' | 'communaute' | 'astuce'
  body: React.ReactNode
  /** Lien externe optionnel (publi HAS, article scientifique, etc.) */
  externalLink?: { label: string; url: string }
}

const CATEGORY_LABEL: Record<Article['category'], { label: string; color: string; bg: string }> = {
  produit:     { label: 'Produit',         color: '#1e40af', bg: '#dbeafe' },
  recherche:   { label: 'Recherche',       color: '#7c3aed', bg: '#ede9fe' },
  has:         { label: 'HAS',             color: '#b45309', bg: '#fed7aa' },
  communaute:  { label: 'Communauté',      color: '#0e7490', bg: '#cffafe' },
  astuce:      { label: 'Astuce',          color: '#15803d', bg: '#dcfce7' },
}

const ARTICLES: Article[] = [
  {
    id: '2026-05-streaming',
    title: 'Génération en streaming : voyez le diagnostic se rédiger en direct',
    excerpt: "Plus besoin d'attendre 30s en regardant un spinner. Le diagnostic, les recommandations et la conclusion apparaissent mot par mot.",
    date: '2026-05-11',
    category: 'produit',
    body: (
      <>
        <p>
          Depuis cette semaine, la génération de la synthèse CRBO se fait en streaming SSE.
          Concrètement : pendant que Claude rédige, vous voyez le texte apparaître progressivement
          à l&apos;écran, section par section (points forts, difficultés, diagnostic, recommandations).
        </p>
        <p>
          Les termes cliniques sont automatiquement surlignés au passage : <strong>dyslexie</strong> en violet,
          les percentiles <strong>P5 / P25</strong> en bleu, les zones <strong>« fragilité »</strong> en
          orange, <strong>« préservé »</strong> en vert.
        </p>
        <p>
          Bénéfice clinique : vous repérez immédiatement si l&apos;IA prend une direction qui ne vous convient
          pas, sans avoir à attendre la fin pour annuler. Et c&apos;est, on le reconnaît, assez satisfaisant à
          regarder.
        </p>
      </>
    ),
  },
  {
    id: '2026-05-voice-command',
    title: 'Démarrer un CRBO à la voix en 3 secondes',
    excerpt: "Dictez \"Nouveau bilan Léa CE2, motif lenteur lecture, Exalang 8-11\" et le formulaire se pré-remplit automatiquement.",
    date: '2026-05-10',
    category: 'produit',
    body: (
      <>
        <p>
          Nouveau bouton en haut du dashboard : <em>« Démarrer en vocal »</em>. Vous cliquez,
          vous dictez une phrase naturelle, et Whisper + Claude transforment ça en formulaire
          pré-rempli (prénom, classe, motif, test).
        </p>
        <p>
          Le système comprend les approximations : <em>« cinquième »</em> → 5ème,
          <em>« examang pour CM2 »</em> → Exalang 8-11. Si la commande est ambiguë,
          un encart d&apos;aperçu vous laisse vérifier avant de confirmer.
        </p>
        <p>
          Idéal pour démarrer un bilan entre 2 consultations, ou pour les orthos qui préfèrent
          la dictée à la frappe.
        </p>
      </>
    ),
  },
  {
    id: '2026-05-snippets',
    title: 'Vos formulations habituelles à portée de raccourci',
    excerpt: "Tapez /fatigue dans l'anamnèse, votre phrase type est insérée. Personnalisez vos snippets dans le profil.",
    date: '2026-05-08',
    category: 'astuce',
    body: (
      <>
        <p>
          Toutes les orthos ont leurs phrases types : <em>« L&apos;enfant a nécessité de fréquents
          encouragements »</em>, <em>« On note une fatigabilité notable en fin de séance »</em>, etc.
          Au lieu de les retaper, créez un snippet une fois et réutilisez via raccourci <code>/clé</code>.
        </p>
        <p>
          8 snippets sont pré-installés par défaut (fatigue, anxiété, coopérant, empan-faible…),
          tapez <code>/</code> dans n&apos;importe quelle zone de texte pour les voir. Gérez les vôtres
          depuis <Link href="/dashboard/profil" style={{ color: 'var(--ds-primary, #16a34a)' }}>
            Mon profil
          </Link>.
        </p>
      </>
    ),
  },
  {
    id: '2026-04-renouvellement',
    title: "Renouvellement : un clic depuis la fiche patient",
    excerpt: "Le bouton « Refaire un bilan » pré-remplit l'anamnèse, le médecin et lie le bilan initial automatiquement.",
    date: '2026-04-28',
    category: 'produit',
    body: (
      <>
        <p>
          Pour un patient déjà bilanné une fois dans Ortho.ia, la fiche patient propose désormais un
          bouton <strong>« Refaire un bilan »</strong> qui pré-remplit la quasi-totalité du formulaire :
          bilan_type renouvellement, lien vers le bilan précédent, anamnèse stable héritée,
          médecin / tests précédents pré-cochés.
        </p>
        <p>
          Vous atterrissez directement à l&apos;étape Anamnèse pour ajouter les évolutions récentes,
          sans avoir à re-saisir le patient et le médecin. Gain typique : 2-3 minutes par renouvellement.
        </p>
      </>
    ),
  },
  {
    id: '2026-04-anonymisation',
    title: "Mise à jour anonymisation RGPD : prénoms accentués correctement scrubés",
    excerpt: "Un bug subtil dans la regex d'anonymisation laissait passer Émélie et autres prénoms commençant par une lettre accentuée. Corrigé.",
    date: '2026-04-22',
    category: 'produit',
    body: (
      <>
        <p>
          Pour la transparence : nous avons corrigé un bug dans la fonction d&apos;anonymisation
          qui précède chaque envoi à l&apos;API Anthropic. La regex <code>\b</code> (mot-frontière)
          en JavaScript ne traite pas correctement les lettres accentuées comme caractères de
          mot — résultat : un prénom comme <em>Émélie</em> en début de phrase n&apos;était
          parfois pas substitué par son token avant transmission.
        </p>
        <p>
          La regex utilise désormais des look-arounds Unicode (<code>(?&lt;![\p{'{'}L\p{'{'}N])</code>)
          avec flag <code>u</code>. 7 cas critiques sont couverts par un test automatisé.
        </p>
        <p>
          <em>Aucune donnée n&apos;a fuité hors UE</em> grâce à cette correction : tous les rendus
          finaux côté Word étaient corrects (rehydration côté serveur), mais le scrub côté
          anthropic.com pouvait être incomplet. Nous tenions à le partager pour transparence.
        </p>
      </>
    ),
  },
  {
    id: '2026-04-multi-pdf',
    title: 'Import multi-PDFs pour les résultats Exalang sur 2 pages',
    excerpt: "Importez page 1 + page 2 d'un Exalang ensemble, l'extraction consolide les résultats automatiquement.",
    date: '2026-04-15',
    category: 'produit',
    body: (
      <>
        <p>
          Vous pouvez désormais glisser jusqu&apos;à 3 PDFs en même temps lors de l&apos;import des
          résultats. Cas typique : une feuille HappyNeuron Exalang qui tient sur 2 pages.
          Chaque PDF est analysé séparément par Claude Vision, puis les résultats sont
          consolidés en un seul JSON.
        </p>
        <p>
          En cas de doublon (la même épreuve présente sur 2 PDFs), c&apos;est <strong>le dernier
          fichier importé qui l&apos;emporte</strong> — pratique si vous avez un PDF mis à jour
          par-dessus l&apos;ancien.
        </p>
      </>
    ),
  },
  {
    id: '2026-04-has-tsa',
    title: 'HAS — recommandations 2026 sur les troubles spécifiques des apprentissages',
    excerpt: "La HAS publie des recommandations actualisées sur le repérage et la prise en charge des TSA, dont la place de l'orthophoniste.",
    date: '2026-04-03',
    category: 'has',
    body: (
      <>
        <p>
          La Haute Autorité de Santé a publié en avril 2026 une mise à jour de ses recommandations
          de bonne pratique sur les troubles spécifiques des apprentissages (TSA), incluant un
          chapitre dédié au rôle de l&apos;orthophoniste dans le repérage précoce et la
          coordination interdisciplinaire.
        </p>
        <p>
          Points saillants : insistance sur l&apos;importance des outils étalonnés (Exalang, BALE,
          BELEC), recommandation d&apos;une réévaluation systématique tous les 6-12 mois pour les
          formes sévères, et clarification du périmètre de la PEC remboursable.
        </p>
      </>
    ),
    externalLink: {
      label: 'Lire les recommandations HAS',
      url: 'https://www.has-sante.fr/',
    },
  },
]

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function ActualitesPage() {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Sparkles size={20} style={{ color: 'var(--ds-primary, #16a34a)' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: 'var(--fg-1)' }}>
            Actualités
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>
          Mises à jour Ortho.ia, publis HAS, nouveaux étalonnages, astuces orthophoniques.
          Directement ici, pas un mail de plus dans votre boîte.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {ARTICLES.map((article) => {
          const cat = CATEGORY_LABEL[article.category]
          return (
            <article
              key={article.id}
              style={{
                background: 'var(--bg-surface, white)',
                border: '1px solid var(--border-ds, #E5E7EB)',
                borderRadius: 14,
                padding: 24,
                transition: 'transform 200ms, box-shadow 200ms',
              }}
            >
              {/* Méta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px',
                    background: cat.bg,
                    color: cat.color,
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  <Tag size={10} />
                  {cat.label}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--fg-3, #6B7280)' }}>
                  <Calendar size={11} />
                  {formatDate(article.date)}
                </span>
              </div>

              <h2 style={{
                margin: 0, marginBottom: 8,
                fontSize: 20, fontWeight: 700,
                color: 'var(--fg-1)',
                lineHeight: 1.3,
              }}>
                {article.title}
              </h2>

              <p style={{
                margin: 0, marginBottom: 12,
                fontSize: 14.5,
                color: 'var(--fg-2)',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}>
                {article.excerpt}
              </p>

              <div style={{
                fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.7,
              }} className="prose-actualites">
                {article.body}
              </div>

              {article.externalLink && (
                <div style={{ marginTop: 16 }}>
                  <a
                    href={article.externalLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px',
                      background: 'var(--bg-surface-2, #F3F4F6)',
                      color: 'var(--fg-1)',
                      border: '1px solid var(--border-ds-strong, #D1D5DB)',
                      borderRadius: 8,
                      fontSize: 13, fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} />
                    {article.externalLink.label}
                  </a>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* Footer page : encouragement à la suggestion d'articles */}
      <div style={{
        marginTop: 48, padding: 20,
        background: 'var(--bg-surface-2, #F9FAFB)',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--fg-2)',
      }}>
        <Mail size={18} style={{ color: 'var(--ds-primary, #16a34a)', marginBottom: 6 }} />
        <p style={{ margin: 0 }}>
          Une étude récente, une publi HAS, un nouvel étalonnage à signaler ?
          {' '}
          <a
            href="mailto:LeBureauDuSupport@orthoia.fr?subject=Suggestion%20pour%20Actualit%C3%A9s"
            style={{ color: 'var(--ds-primary, #16a34a)', fontWeight: 600 }}
          >
            Écrivez-nous
          </a>, nous publions les meilleurs ici.
        </p>
      </div>

      <style jsx>{`
        .prose-actualites :global(p) {
          margin: 0 0 10px;
        }
        .prose-actualites :global(p:last-child) {
          margin-bottom: 0;
        }
        .prose-actualites :global(strong) {
          color: var(--fg-1);
          font-weight: 600;
        }
        .prose-actualites :global(em) {
          color: var(--fg-2);
        }
        .prose-actualites :global(code) {
          background: var(--bg-surface-2);
          padding: 1px 6px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--fg-1);
        }
      `}</style>
    </div>
  )
}
