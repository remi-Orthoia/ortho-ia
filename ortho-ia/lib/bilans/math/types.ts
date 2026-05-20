/**
 * Types des bilans de cognition mathématique B-CM (enfant) et B-CMado (ado).
 *
 * Structure matricielle inspirée du PDF source (Elsa DALL'AGNOL, Profil-B CM) :
 *   Chaque grille contient une ou plusieurs SECTIONS, chacune étant un
 *   tableau 2D :
 *     - lignes (niveaux) = âge ou classe scolaire
 *     - colonnes = sous-épreuves (tests, groupés par épreuve macro)
 *     - cellules = critères graduels SPÉCIFIQUES à chaque test, placés au
 *       bon niveau (ex: "Classe selon 2 critères" placé à 6 ans pour le
 *       test "Classification jetons"). Le tableau est donc SPARSE — toutes
 *       les intersections (niveau × test) ne sont pas remplies.
 *
 * Cotation purement qualitative : vert / orange / rouge / gris.
 */

export type PastilleEtat = 'gris' | 'vert' | 'orange' | 'rouge'

/** Ligne de la matrice — un niveau développemental ou scolaire. */
export interface Niveau {
  id: string
  /** Libellé principal (ex: "8 ans", "CM1"). */
  label: string
  /** Sous-libellé optionnel (ex: rare ici depuis qu'on a simplifié à l'année). */
  subLabel?: string
}

/** Critère graduel d'un test, placé à un niveau précis.
 *  C'est l'élément cotable — l'ortho coche le critère atteint par le patient. */
export interface Criterion {
  /** Identifiant stable au sein du test parent. */
  id: string
  /** Niveau (âge ou classe) auquel ce critère est attendu. */
  niveauId: string
  /** Texte du critère (ex: "Classe selon 2 critères", "12/12"). */
  label: string
}

/** Colonne du tableau — un test individuel.
 *  Chaque test a ses critères propres gradués (3-5 typiquement). */
export interface SousEpreuve {
  id: string
  label: string
  criteres: Criterion[]
}

/** Groupe de colonnes — une "épreuve macro" qui regroupe ses tests.
 *  L'épreuve elle-même n'est PAS cotable directement ; seuls ses critères le sont. */
export interface Epreuve {
  id: string
  label: string
  sousEpreuves: SousEpreuve[]
}

/** Section de la grille — une sous-matrice avec ses propres niveaux (lignes). */
export interface SectionMatrix {
  id: string
  label: string
  description?: string
  niveaux: Niveau[]
  epreuves: Epreuve[]
}

export interface GrilleBilan {
  id: 'b-cm' | 'b-cmado'
  label: string
  description: string
  sections: SectionMatrix[]
}

/** État d'une épreuve : critères cotés + notes + texte IA.
 *  Les cellules sont indexées par "sousEpreuveId:criterionId". */
export interface EpreuveState {
  /** Pastilles par critère, clé = "sousEpreuveId:criterionId". */
  cells: Record<string, PastilleEtat>
  /** Observations cliniques brutes saisies par l'ortho pendant la passation. */
  notes: string
  /** Texte généré par l'IA pour cette épreuve, éditable par l'ortho. */
  iaText?: string
}

export interface BilanMathDraft {
  type: GrilleBilan['id']
  mode: 'initial' | 'renouvellement'
  patient: {
    prenom: string
    nom: string
    date_naissance: string
    classe: string
  }
  epreuves: Record<string, EpreuveState>
  updatedAt: number
}
