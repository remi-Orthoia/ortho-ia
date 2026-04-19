export interface TestModule {
  nom: string
  editeur: string
  auteurs: string
  annee: number
  epreuves?: string[]
  domaines?: string[]
  regles_specifiques?: string
}
