/**
 * Source de vérité des 5 cocons éditoriaux Ortho.ia.
 *
 * Un "cocon" = une catégorie SEO/éditoriale qui regroupe un cluster d'articles
 * autour d'une intention de recherche. Chaque article markdown du blog déclare
 * son cocon via `cocon: <slug>` en frontmatter.
 *
 * Inspiration : pages "alternative", "free tools", "comparatifs" des SaaS US.
 *
 * Ajouter un cocon : ajouter une entrée ci-dessous + créer 1+ article(s) avec
 * le bon `cocon:` en frontmatter. Tout le reste (nav, pages dédiées, chip de
 * card) suit automatiquement.
 */

export interface CoconConfig {
  /** Slug URL : /blog/categorie/<slug>. Doit matcher la valeur frontmatter. */
  slug: string
  /** Label humain affiché sur le site. */
  label: string
  /** Description courte, utilisée en meta description de la page catégorie. */
  description: string
  /** Couleur principale de la chip / accent visuel. */
  color: string
  /** Couleur de fond pâle (chip background). */
  bg: string
  /** Couleur de texte sur fond pâle (chip text). */
  fg: string
}

export const COCONS: Record<string, CoconConfig> = {
  'redaction-crbo': {
    slug: 'redaction-crbo',
    label: 'Rédaction CRBO',
    description:
      'Tout pour rédiger un compte rendu de bilan orthophonique conforme : trames, exemples, items obligatoires, formulations diagnostiques.',
    color: '#2C7A7B',
    bg: '#E6F2F2',
    fg: '#1F5A5B',
  },
  'logiciels-comparatifs': {
    slug: 'logiciels-comparatifs',
    label: 'Logiciels & comparatifs',
    description:
      'Comparatifs honnêtes des logiciels métiers de l\'orthophoniste : facturation, télésoin, dossier patient, aide à la rédaction.',
    color: '#7C3AED',
    bg: '#F1EBFE',
    fg: '#5B21B6',
  },
  'outils-gratuits': {
    slug: 'outils-gratuits',
    label: 'Outils gratuits',
    description:
      'Calculateurs, trames, modèles téléchargeables : tout ce qu\'on met à disposition gratuitement pour la pratique quotidienne.',
    color: '#10B981',
    bg: '#E6F8F1',
    fg: '#047857',
  },
  'ia-innovation': {
    slug: 'ia-innovation',
    label: 'IA & innovation',
    description:
      'Comment l\'intelligence artificielle change (ou pas) la pratique orthophonique : usages concrets, limites, éthique.',
    color: '#0EA5E9',
    bg: '#E3F4FC',
    fg: '#0369A1',
  },
  'vie-pro-liberale': {
    slug: 'vie-pro-liberale',
    label: 'Vie pro libérale',
    description:
      'Installation, gestion de cabinet, organisation, équilibre de vie : tout ce qui n\'est pas clinique mais qui fait la vraie vie d\'orthophoniste libérale.',
    color: '#F59E0B',
    bg: '#FEF3DA',
    fg: '#B45309',
  },
}

/** Liste ordonnée des cocons (l'ordre de COCONS est celui de la nav). */
export const COCON_LIST: CoconConfig[] = Object.values(COCONS)

/** Liste des slugs (utile pour generateStaticParams). */
export const COCON_SLUGS: string[] = COCON_LIST.map((c) => c.slug)

/** Récupère un cocon par slug, ou null si inconnu (cocon retiré, faute de frappe…). */
export function getCocon(slug: string | undefined | null): CoconConfig | null {
  if (!slug) return null
  return COCONS[slug] ?? null
}
