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
  /** Couleur principale (= fond de la chip en variante active). */
  color: string
  /** Couleur de fond pâle (chip background, variante normale). */
  bg: string
  /** Couleur de texte sur fond pâle (variante normale). */
  fg: string
  /** Couleur de texte en variante active. Par défaut blanc. À surcharger
   *  si `color` est trop clair pour porter du blanc lisiblement. */
  activeFg?: string
}

/**
 * Palette des chips strictement aligne sur la DA Ortho.ia :
 *   Sage (signature) + Terracotta (accent) + Sand.
 *
 * Distribution :
 *   - 2 cocons en SAGE (intensites differentes pour les distinguer)
 *   - 2 cocons en TERRA (intensites differentes)
 *   - 1 cocon en SAND
 *
 * Contraste WCAG verifie pour chaque combinaison bg/fg.
 */
export const COCONS: Record<string, CoconConfig> = {
  'redaction-crbo': {
    slug: 'redaction-crbo',
    label: 'Rédaction CRBO',
    description:
      'Tout pour rédiger un compte rendu de bilan orthophonique conforme : trames, exemples, items obligatoires, formulations diagnostiques.',
    // Sage primary (cœur du produit)
    color: '#2E4A41', // sage 700
    bg: '#DDE6E0',   // sage 100
    fg: '#2E4A41',   // sage 700
  },
  'logiciels-comparatifs': {
    slug: 'logiciels-comparatifs',
    label: 'Logiciels & comparatifs',
    description:
      'Comparatifs honnêtes des logiciels métiers de l\'orthophoniste : facturation, télésoin, dossier patient, aide à la rédaction.',
    // Sage sombre (rigueur, structuré)
    color: '#1F2A2A', // sage 900
    bg: '#A8BBB1',   // sage 300
    fg: '#1F2A2A',   // sage 900
  },
  'outils-gratuits': {
    slug: 'outils-gratuits',
    label: 'Outils gratuits',
    description:
      'Calculateurs, trames, modèles téléchargeables : tout ce qu\'on met à disposition gratuitement pour la pratique quotidienne.',
    // Terra accent (chaleur, generosite)
    color: '#C97B5E', // terra 600 (accent)
    bg: '#F5D9CB',   // terra 100
    fg: '#A55A3F',   // terra 700
  },
  'ia-innovation': {
    slug: 'ia-innovation',
    label: 'IA & innovation',
    description:
      'Comment l\'intelligence artificielle change (ou pas) la pratique orthophonique : usages concrets, limites, éthique.',
    // Terra profond (innovation, intensite)
    color: '#A55A3F', // terra 700
    bg: '#E8B49E',   // terra 300
    fg: '#A55A3F',   // terra 700
  },
  'vie-pro-liberale': {
    slug: 'vie-pro-liberale',
    label: 'Vie pro libérale',
    description:
      'Installation, gestion de cabinet, organisation, équilibre de vie : tout ce qui n\'est pas clinique mais qui fait la vraie vie d\'orthophoniste libérale.',
    // Sand (ancrage, vie quotidienne)
    color: '#D5C5A1', // sand 300
    bg: '#F2EAD8',   // sand 100
    fg: '#557366',   // sage 500 (lecture optimale sur sand 100)
    // Sand 300 est trop clair pour porter du blanc, on garde du sage sombre.
    activeFg: '#2E4A41', // sage 700
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
