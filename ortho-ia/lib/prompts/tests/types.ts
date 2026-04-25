export interface TestGroupe {
  /** Code officiel du groupe (ex: "A.1", "B.2"). */
  code: string
  /** Libellé court du groupe (ex: "Langage oral", "Mémoire"). */
  nom: string
}

export interface TestModule {
  nom: string
  editeur: string
  auteurs: string
  annee: number
  epreuves?: string[]
  domaines?: string[]
  /**
   * Groupes officiels du test (HappyNeuron : A.1, A.2, B.1, B.2, C.1…).
   * Injecté dans le prompt système comme nomenclature OBLIGATOIRE pour
   * `domains[].nom` du CRBO — garantit que le graphique HappyNeuron du
   * Word groupe les barres avec les bons libellés.
   */
  groupes?: TestGroupe[]
  regles_specifiques?: string
}
