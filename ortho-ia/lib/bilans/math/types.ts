/**
 * Types des bilans de cognition mathématique B-CM (enfant) et B-CMado (ado).
 *
 * Structure matricielle inspirée du PDF source (Elsa DALL'AGNOL, Profil-B CM) :
 *   Chaque grille contient une ou plusieurs SECTIONS, chacune étant un
 *   tableau 2D :
 *     - lignes = niveaux développementaux (âge en mois, ou classe scolaire)
 *     - colonnes = sous-épreuves (tests, groupés par épreuve macro)
 *     - cellules = pastilles cotables individuellement
 *
 * Différence radicale vs les bilans langage du projet : scoring purement
 * qualitatif (vert / orange / rouge) — pas de percentile, pas d'écart-type.
 */

/** État d'une pastille de cotation.
 *  - gris   : non renseigné (défaut)
 *  - vert   : réussite spontanée
 *  - orange : réussite après étayage / autocorrection
 *  - rouge  : échec */
export type PastilleEtat = 'gris' | 'vert' | 'orange' | 'rouge'

/** Ligne de la matrice — un niveau développemental ou scolaire. */
export interface Niveau {
  /** Identifiant stable, sert de clé en persistance JSON. */
  id: string
  /** Libellé principal (ex: "8 ans", "CM1"). */
  label: string
  /** Sous-libellé optionnel (ex: "96-98 mo" pour la tranche d'âge en mois). */
  subLabel?: string
}

/** Colonne du tableau — un test individuel. */
export interface SousEpreuve {
  id: string
  label: string
}

/** Groupe de colonnes — une "épreuve macro" qui regroupe ses tests.
 *  L'épreuve elle-même n'est PAS cotable directement ; seuls ses tests le sont. */
export interface Epreuve {
  id: string
  label: string
  sousEpreuves: SousEpreuve[]
}

/** Section de la grille — une sous-matrice avec ses propres niveaux (lignes).
 *  B-CM a 2 sections : développementale (ages 5-10) et scolaire (GSM-CM2).
 *  B-CMado a une structure similaire adaptée au collège. */
export interface SectionMatrix {
  id: string
  label: string
  /** Description courte affichée sous le titre de section. */
  description?: string
  /** Lignes du tableau. Ordre top-to-bottom du rendu UI. */
  niveaux: Niveau[]
  /** Colonnes groupées par épreuve. */
  epreuves: Epreuve[]
}

export interface GrilleBilan {
  id: 'b-cm' | 'b-cmado'
  label: string
  description: string
  /** Une ou plusieurs sections — chaque section est une matrice indépendante. */
  sections: SectionMatrix[]
}

/** État d'une épreuve : cellules cotées + notes + texte IA.
 *  Les cellules sont indexées par "niveauId:sousEpreuveId" pour pouvoir
 *  tracer la cotation d'un test à un niveau précis. */
export interface EpreuveState {
  /** Pastilles par cellule, clé = "niveauId:sousEpreuveId". */
  cells: Record<string, PastilleEtat>
  /** Observations cliniques brutes saisies par l'ortho pendant la passation. */
  notes: string
  /** Texte généré par l'IA pour cette épreuve, éditable par l'ortho. */
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
  /** État de chaque épreuve, indexé par epreuve.id (peu importe la section). */
  epreuves: Record<string, EpreuveState>
  /** Timestamp Unix ms de dernière modification (pour invalidation localStorage). */
  updatedAt: number
}
