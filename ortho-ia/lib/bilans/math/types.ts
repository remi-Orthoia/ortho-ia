/**
 * Types des bilans de cognition mathématique B-CM (enfant) et B-CMado (ado).
 *
 * Différence radicale vs les bilans langage du projet : scoring purement
 * qualitatif (vert / orange / rouge) — pas de percentile, pas d'écart-type.
 * Voir docs/Bilans Sources/Profil-B CM.pdf et l'exemple "Lola 6ème" (Elsa
 * DALL'AGNOL, 2019) pour la logique clinique sous-jacente.
 */

/** État d'une pastille de cotation.
 *  - gris   : non renseigné (défaut)
 *  - vert   : réussite spontanée
 *  - orange : réussite après étayage / autocorrection
 *  - rouge  : échec */
export type PastilleEtat = 'gris' | 'vert' | 'orange' | 'rouge'

export interface SousEpreuve {
  /** Identifiant stable (sert de clé en persistance JSON) */
  id: string
  /** Libellé affiché */
  label: string
}

export interface Epreuve {
  id: string
  label: string
  /** Tableau vide = épreuve mono-pastille : on cote directement l'épreuve,
   *  pas de sous-épreuve à afficher. */
  sousEpreuves: SousEpreuve[]
}

export interface Domaine {
  id: string
  label: string
  epreuves: Epreuve[]
}

export interface GrilleBilan {
  id: 'b-cm' | 'b-cmado'
  label: string
  /** Description courte affichée en haut de page (~2 lignes). */
  description: string
  domaines: Domaine[]
}

/** État de saisie d'une épreuve, persisté en JSON dans crbos.resultats (Phase 3). */
export interface EpreuveState {
  /** Pour les épreuves multi-pastilles : état de chaque sous-épreuve. */
  sousEpreuves: Record<string, PastilleEtat>
  /** Pour les épreuves mono-pastille : état direct sur l'épreuve. */
  direct?: PastilleEtat
  /** Observations cliniques brutes saisies par l'ortho pendant la passation. */
  notes: string
  /** Texte généré par l'IA pour cette épreuve, éditable par l'ortho (Phase 2). */
  iaText?: string
}

export interface BilanMathDraft {
  /** Type de bilan — détermine la grille appliquée. */
  type: GrilleBilan['id']
  /** Bilan initial ou renouvellement (impacte le ton du CRBO IA). */
  mode: 'initial' | 'renouvellement'
  /** Coordonnées patient saisies inline (intégration carnet patients : Phase 4). */
  patient: {
    prenom: string
    nom: string
    /** Format YYYY-MM-DD */
    date_naissance: string
    /** Classe / niveau scolaire (texte libre, ex: "6ème", "CM1") */
    classe: string
  }
  /** État de chaque épreuve, indexé par epreuve.id */
  epreuves: Record<string, EpreuveState>
  /** Timestamp Unix ms de dernière modification (pour invalidation localStorage). */
  updatedAt: number
}
