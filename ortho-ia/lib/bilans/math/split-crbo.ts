/**
 * Decoupe le CRBO markdown genere par le LLM (bilans math B-CM / B-CMado)
 * en chunks correspondants aux sections de la grille, pour permettre un
 * rendu interleaved (matrice de section X suivie du commentaire des
 * epreuves de cette section, puis matrice suivante, etc.).
 *
 * Stratgie :
 *  - On extrait toutes les headers H2 (`**Title**`) du markdown.
 *  - Pour chaque section de la grille, on cherche le premier H2 dont le
 *    titre matche un keyword extrait du `section.label`.
 *  - On detecte aussi la position du Diagnostic / Projet therapeutique (tail).
 *  - On split le markdown en :
 *      * head    : du debut jusqu'a la 1re section de grille (Motif, Anamnese,
 *                  Bilan realise)
 *      * chunks[id] : pour chaque section.id de la grille
 *      * tail    : Diagnostic + Projet therapeutique
 *  - Si aucun matching n'est trouve (LLM a emis un format inattendu),
 *    on retourne `head = tout le texte` et chunks/tail vides — la page
 *    fait alors un fallback vers le rendu actuel (tout le CRBO en bloc).
 */

import type { GrilleBilan } from './types'

export interface CrboSplit {
  head: string
  /** Map section.id (grille-1, grille-2, ...) → markdown chunk de cette section. */
  bySection: Map<string, string>
  tail: string
}

function normalize(s: string): string {
  // ̀-ͯ = Combining Diacritical Marks range, robuste a tout encoding.
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const STOP_WORDS = new Set([
  'les', 'des', 'une', 'aux', 'avec', 'pour', 'dans', 'sur', 'sous',
  'que', 'qui', 'son', 'sa', 'ses', 'leur', 'leurs', 'cette', 'cet',
  'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'votre', 'vos',
  'notre', 'nos', 'plus', 'mais', 'donc', 'car', 'comme', 'tres',
  // 'nombre' deliberement laisse pour matcher "SENS DU NOMBRE" / grille-2.
])

/**
 * Extrait des mots-cles distinctifs d'un label de section. Decoupe sur
 * separateurs typiques (`,`, `—`, `-`, espaces), normalise les accents,
 * filtre les mots courts et les stop-words.
 */
function extractKeywords(label: string): string[] {
  return normalize(label)
    .split(/[,;:—–\-/&\s]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 5)
    .filter(w => !STOP_WORDS.has(w))
}

/** Regex H2 markdown : `**Title**` ou `**Title :**` ou `**Title** : suite`. */
function matchH2Header(line: string): string | null {
  // Format A/B : **Title** ou **Title :** seul sur la ligne
  let m = line.match(/^\s*\*\*([^*]+)\*\*\s*:?\s*$/)
  if (m) return m[1].trim().replace(/\s*:\s*$/, '')
  // Format C : **Title** : contenu inline
  m = line.match(/^\s*\*\*([^*]+)\*\*\s*[:—–-]\s+.+$/)
  if (m) return m[1].trim().replace(/\s*:\s*$/, '')
  return null
}

const TAIL_KEYWORDS = ['diagnostic', 'projet therapeutique', 'projet']

/**
 * Supprime la section "**Bilan realise**" (et son contenu jusqu'au prochain
 * H2) d'un texte markdown. La phrase verbatim "Bilan realise avec des
 * epreuves de manipulations..." est desormais rendue automatiquement sous
 * "Tests pratiques" cote renderer (Word + preview), donc on supprime
 * toute trace LLM-emitted de cette section pour eviter la duplication
 * sur les CRBO generes avant ce changement OU sur des CRBO recents si le
 * LLM ne respecte pas l'instruction du prompt.
 *
 * Match insensible aux accents et a la variante de titre :
 *   **Bilan realise**, **Bilan réalisé**, **Bilan réalisé :**, **Bilan**
 */
export function stripBilanRealiseSection(text: string): string {
  if (!text) return text
  const lines = text.split('\n')
  const out: string[] = []
  let skipping = false
  for (const line of lines) {
    const header = (() => {
      let m = line.match(/^\s*\*\*([^*]+)\*\*\s*:?\s*$/)
      if (m) return m[1].trim().replace(/\s*:\s*$/, '')
      m = line.match(/^\s*\*\*([^*]+)\*\*\s*[:—–-]\s+.+$/)
      if (m) return m[1].trim().replace(/\s*:\s*$/, '')
      return null
    })()
    if (header) {
      const norm = normalize(header)
      // Detection "Bilan realise" : commence par "bilan realise" ou
      // "bilan-realise". On evite de matcher "Bilan" tout court (trop large).
      if (/^bilan\s*realise/i.test(norm)) {
        skipping = true
        continue
      }
      // Tout autre H2 met fin au skip.
      if (skipping) {
        skipping = false
      }
    }
    if (skipping) continue
    out.push(line)
  }
  // Nettoie les paragraphes vides en cascade laisses apres suppression.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function splitCrboByGrilleSections(crboText: string, grille: GrilleBilan): CrboSplit {
  const empty: CrboSplit = { head: crboText, bySection: new Map(), tail: '' }
  if (!crboText || !grille.sections.length) return empty

  const lines = crboText.split('\n')

  // 1. Identifier toutes les positions de H2 + leur titre normalise.
  type H2Pos = { line: number; titleNorm: string }
  const h2Positions: H2Pos[] = []
  for (let i = 0; i < lines.length; i++) {
    const header = matchH2Header(lines[i])
    if (header) {
      h2Positions.push({ line: i, titleNorm: normalize(header) })
    }
  }

  if (h2Positions.length === 0) return empty

  // 2. Pour chaque section de grille, trouver le 1er H2 qui matche.
  type Match = { sectionId: string; startLine: number }
  const matches: Match[] = []
  const usedH2Lines = new Set<number>()
  for (const section of grille.sections) {
    // Combine label + description pour augmenter les chances de matching.
    // Grille-1 a label = "Classifications, Combinatoire, Seriation,
    // Inclusion, Conservation" et description = "Competences logiques." :
    // si le LLM titre "LES COMPETENCES LOGIQUES", seule la description
    // permet de capturer cette section sans toucher au prompt.
    const labelKeywords = extractKeywords(section.label)
    const descKeywords = section.description ? extractKeywords(section.description) : []
    const keywords = Array.from(new Set([...labelKeywords, ...descKeywords]))
    if (keywords.length === 0) continue
    const found = h2Positions.find(h => {
      if (usedH2Lines.has(h.line)) return false
      return keywords.some(k => h.titleNorm.includes(k))
    })
    if (found) {
      matches.push({ sectionId: section.id, startLine: found.line })
      usedH2Lines.add(found.line)
    }
  }

  // 3. Identifier la position du tail (Diagnostic / Projet therapeutique).
  let tailStart = lines.length
  for (const h of h2Positions) {
    if (TAIL_KEYWORDS.some(k => h.titleNorm.includes(k))) {
      tailStart = h.line
      break
    }
  }

  // 4. Si aucune section grille n'a matche → tout est head (fallback safe).
  if (matches.length === 0) {
    return { head: crboText, bySection: new Map(), tail: '' }
  }

  // 5. Trier les matches par position dans le texte.
  matches.sort((a, b) => a.startLine - b.startLine)

  // 6. Decouper.
  const bySection = new Map<string, string>()
  const head = lines.slice(0, matches[0].startLine).join('\n').trimEnd()
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].startLine
    const end = i + 1 < matches.length ? matches[i + 1].startLine : tailStart
    const chunk = lines.slice(start, end).join('\n').trim()
    if (chunk) bySection.set(matches[i].sectionId, chunk)
  }
  const tail = lines.slice(tailStart).join('\n').trim()

  return { head, bySection, tail }
}
