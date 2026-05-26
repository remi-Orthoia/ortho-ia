/**
 * Types des bilans de cognition mathématique B-CM (enfant) et B-CMado (ado).
 *
 * Structure matricielle :
 *   - Chaque grille a une ou plusieurs SECTIONS, chacune un tableau 2D :
 *     - lignes (niveaux) = âge en mois ou classe scolaire
 *     - colonnes = tests (sous-épreuves) groupés par épreuve macro
 *     - cellules = critères graduels PROPRES à chaque test, placés au bon
 *       niveau. Un critère peut FUSIONNER plusieurs niveaux consécutifs
 *       (rowspan dans le rendu HTML).
 *   - Certaines cellules sont GRISÉES — non cotables, juste signalées
 *     visuellement comme inapplicables à ce niveau.
 *
 * Cotation purement qualitative : vert / orange / rouge / gris.
 */

export type PastilleEtat = 'gris' | 'vert' | 'orange' | 'rouge'

/** Ligne de la matrice — un niveau développemental ou scolaire. */
export interface Niveau {
  id: string
  /** Libellé principal (ex: "8 ans", "CM1"). */
  label: string
  /** Sous-libellé optionnel (ex: "99-101 mo" pour la tranche d'âge en mois). */
  subLabel?: string
}

/** Critère graduel d'un test. Cotable (pastille). */
export interface Criterion {
  /** Identifiant stable au sein du test parent. */
  id: string
  /** Niveaux (lignes) que ce critère couvre — fusion verticale si plusieurs.
   *  L'ordre doit correspondre à la séquence des niveaux dans Section.niveaux
   *  pour permettre le rowspan correct côté UI. */
  niveauIds: string[]
  /** Texte du critère (ex: "isole 2 critères", "12/12"). */
  label: string
}

/** Colonne du tableau — un test individuel. */
export interface SousEpreuve {
  id: string
  label: string
  /** Critères gradués de ce test. */
  criteres: Criterion[]
  /** Niveaux à afficher en GRISÉ (non cotables, juste marqués visuellement).
   *  Utile pour signaler "non applicable à cette classe / cet âge". */
  niveauxGrises?: string[]
}

/** Groupe de colonnes — une épreuve macro qui regroupe ses tests. */
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
  /** Si vrai, fusionne dans la colonne Niveau les lignes consécutives qui
   *  partagent le même label (rowspan) et masque leurs subLabels.
   *  Utilisé pour B-CMado où "Collège 1 / Collège 2 / Collège 3" deviennent
   *  une seule cellule "Collège" fusionnée. */
  mergeNiveauxByLabel?: boolean
  /** Active la coloration de fond par cycle (Collège vert tinte, Cycle II
   *  sable tinte, Cycle III neutre). Utilisé conjointement avec
   *  mergeNiveauxByLabel pour B-CMado. */
  cycleBackgrounds?: boolean
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
  cells: Record<string, PastilleEtat>
  notes: string
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
  /** Anamnèse + motif récupérés depuis le handoff Nouveau CRBO (étapes 1-3).
   *  Affichés en lecture seule au-dessus de la matrice et transmis au prompt
   *  Claude pour mieux orienter le choix du profil diagnostique. */
  anamnese?: string
  motif?: string
  /** Date du bilan (ISO) — handoff depuis l'etape 2 du wizard. */
  bilanDate?: string
  /** Medecin prescripteur (etape 2 du wizard) + date de prescription. */
  medecin?: { nom: string; tel: string; date_prescription?: string }
  /** Observations comportement seance (etape 5 du wizard). */
  comportementSeance?: string
  /** Duree totale seance en minutes (etape 5 du wizard). */
  dureeSeanceMinutes?: number
  /** Donnees specifiques au renouvellement.
   *  - Quand un bilan precedent ortho.ia est selectionne via dropdown :
   *    bilanPrecedentId/Date/Anamnese + bilanPrecedentEpreuves (JSON grille) +
   *    bilanPrecedentCrboGenere (markdown CRBO) sont remplis depuis la DB.
   *  - Quand un PDF/Word externe est uploade : bilanPrecedentDate +
   *    bilanPrecedentTexteExterne (texte extrait par Vision) sont remplis,
   *    pas de comparaison structuree (table de comparaison vide), seul le
   *    LLM exploite le texte en prose.
   *  - evolutionNotes : champ libre de l'ortho pour resumer la trajectoire.
   *  - elementsStables : champ libre pour les elements anamnese inchanges. */
  renouvellement?: {
    evolutionNotes?: string
    elementsStables?: string
    /** ID du CRBO precedent (selection dropdown). NULL pour upload externe. */
    bilanPrecedentId?: string
    bilanPrecedentDate?: string
    bilanPrecedentAnamnese?: string
    /** Cellules grille du bilan precedent (parsed JSON de crbos.resultats).
     *  Sert au calcul de delta cote API + tableau comparatif au rendu. */
    bilanPrecedentEpreuves?: Record<string, EpreuveState>
    /** Texte markdown du CRBO precedent (depuis crbos.crbo_genere). Sert au
     *  LLM comme contexte prose pour formuler les evolutions. */
    bilanPrecedentCrboGenere?: string
    /** Texte brut extrait d'un PDF/Word externe via Vision. Mutuellement
     *  exclusif avec bilanPrecedentId. */
    bilanPrecedentTexteExterne?: string
    /** Nom du fichier uploade (affichage UI seulement). */
    bilanPrecedentFilename?: string
  }
  epreuves: Record<string, EpreuveState>
  updatedAt: number
}
