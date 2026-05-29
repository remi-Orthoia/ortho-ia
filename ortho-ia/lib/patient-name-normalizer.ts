/**
 * Normalisation de l'orthographe du prenom/nom patient dans les textes libres
 * (anamnese dictee, motif reformule, notes d'analyse, commentaires qualitatifs).
 *
 * Pourquoi ?
 *
 * Whisper transcrit phonetiquement → un prenom rare comme "Meline" peut
 * sortir "Melina" / "Mellina" / "Melyne". Plus tard, l'anonymizer cherche
 * l'orthographe exacte du form ("Meline") dans le texte pour la tokeniser
 * avant d'envoyer a Claude. Sans match, "Melina" passe en clair → Claude
 * paraphrase avec "Melina" → le CRBO final melange deux orthographes.
 *
 * Solution : avant anonymize() (et aussi en live cote MicButton pour le
 * retour visuel), on detecte les variantes phonetiquement proches du
 * prenom/nom canonique du form et on les remplace par l'orthographe
 * officielle.
 *
 * Heuristique :
 *   1. Tokenise le texte en mots (preservant la ponctuation et la casse).
 *   2. Pour chaque mot qui ressemble a un nom propre (commence par capitale
 *      OU on est en debut de phrase) :
 *      - Compare a chaque nom canonique (case-insensitive)
 *      - Si match exact → on ne touche pas (rien a corriger)
 *      - Si distance Levenshtein ≤ tolerance ET meme initiale ET longueurs
 *        comparables → remplace, en preservant la casse du mot d'origine
 *   3. Reconstruit le texte.
 *
 * Tolerance Levenshtein adaptee a la longueur :
 *   - ≤ 4 chars : 1 erreur max
 *   - 5-7 chars : 2 erreurs max
 *   - 8+ chars : 3 erreurs max
 *   (au-dela on bascule en faux positif territory)
 *
 * Garde-fous anti faux positifs :
 *   - Ne touche jamais les mots de < 3 lettres
 *   - Ne touche jamais les mots dans une stoplist (pronoms, mots-outils FR)
 *   - Min longueur du nom canonique : 3 chars (sinon trop de bruit)
 */

/** Mots qu'on ne reecrit JAMAIS, meme si Levenshtein matche. */
const STOPWORDS = new Set([
  // Pronoms / determinants
  'elle', 'lui', 'son', 'sa', 'ses', 'leur', 'leurs', 'mon', 'ma', 'mes',
  'ton', 'ta', 'tes', 'notre', 'votre', 'nos', 'vos',
  // Mots-outils qui peuvent ressembler a un prenom court
  'avec', 'mais', 'donc', 'puis', 'pour', 'sans', 'sous', 'sur', 'dans',
  'chez', 'vers', 'avant', 'apres', 'pendant', 'depuis',
  // Verbes auxiliaires courts
  'etre', 'avoir', 'aller', 'faire', 'dire', 'voir',
  // Termes cliniques qui peuvent ressembler par coincidence
  'oral', 'ecrit', 'lecture', 'ecriture', 'langage',
])

/**
 * Distance de Levenshtein classique (insertion/suppression/substitution = 1).
 * Implementation iterative O(m*n) memoire O(n).
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,        // insertion
        prev[j] + 1,            // suppression
        prev[j - 1] + cost,     // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}

/** Retire les diacritiques pour comparaison sans accent (NFD + retire combinings). */
function deburr(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Tolerance Levenshtein selon longueur du mot canonique. */
function toleranceFor(canonicalLen: number): number {
  if (canonicalLen <= 4) return 1
  if (canonicalLen <= 7) return 2
  return 3
}

/**
 * Preserve la casse du mot d'origine sur le remplacement.
 *   - "MELINA" → "MELINE" (upper)
 *   - "Melina" → "Meline" (Title)
 *   - "melina" → "meline" (lower)
 *   - autre  → orthographe canonique brute
 */
function matchCase(original: string, canonical: string): string {
  if (original === original.toUpperCase()) return canonical.toUpperCase()
  if (original === original.toLowerCase()) return canonical.toLowerCase()
  // Title case : 1ere lettre majuscule, reste minuscule (cas le plus courant)
  if (original[0] === original[0]?.toUpperCase()
    && original.slice(1) === original.slice(1).toLowerCase()) {
    return canonical[0].toUpperCase() + canonical.slice(1).toLowerCase()
  }
  return canonical
}

export interface NormalizeResult {
  /** Texte corrige. */
  text: string
  /** Liste des remplacements appliques pour debug/log. */
  replacements: Array<{ from: string; to: string }>
}

/**
 * Normalise le texte en remplacant toute variante phonetiquement proche du
 * prenom/nom canonique par l'orthographe exacte.
 *
 * Non-destructif : si aucune correspondance trouvee, retourne le texte
 * inchange (et `replacements: []`).
 *
 * Sur prenom/nom vides ou trop courts (< 3 chars), retourne le texte tel
 * quel (pas assez d'info pour matcher avec confiance).
 */
export function normalizePatientName(
  text: string,
  prenom: string | undefined | null,
  nom: string | undefined | null,
): NormalizeResult {
  if (!text || typeof text !== 'string') return { text: text || '', replacements: [] }

  const canonicals: string[] = []
  for (const c of [prenom, nom]) {
    const trimmed = (c || '').trim()
    if (trimmed.length >= 3) canonicals.push(trimmed)
  }
  if (canonicals.length === 0) return { text, replacements: [] }

  const replacements: Array<{ from: string; to: string }> = []

  // Tokenisation : on capture chaque "mot" (lettres latines avec accents
  // FR) tout en preservant la ponctuation/espaces pour reconstruction.
  // On evite le flag \p{L} / u qui exige TS target es2018+ (le projet n'a
  // pas de target explicite → defaut es3). Le character class couvre
  // l'essentiel des accents francais (À-ÖØ-öø-ÿ ≈ Latin Extended).
  const WORD_CHAR = "A-Za-zÀ-ÖØ-öø-ÿ"
  const tokens = text.split(new RegExp(`([${WORD_CHAR}]+(?:[''-][${WORD_CHAR}]+)*)`, 'g'))

  const normalized = tokens.map(tok => {
    // Token non-mot (espaces, ponctuation) → inchange
    if (!tok || !new RegExp(`[${WORD_CHAR}]`).test(tok)) return tok
    if (tok.length < 3) return tok

    const lowerTok = tok.toLowerCase()
    if (STOPWORDS.has(lowerTok)) return tok

    // Pour chaque nom canonique, evalue si le token est une variante proche
    for (const canonical of canonicals) {
      const lowerCanonical = canonical.toLowerCase()

      // Match exact (case-insensitive) → rien a faire
      if (lowerTok === lowerCanonical) return tok

      // Contraintes : meme premiere lettre (apres deburr pour gerer Etienne/Étienne)
      const tokDeburr = deburr(lowerTok)
      const canDeburr = deburr(lowerCanonical)
      if (tokDeburr[0] !== canDeburr[0]) continue

      // Contrainte longueur : ±2 chars maximum
      if (Math.abs(tokDeburr.length - canDeburr.length) > 2) continue

      const dist = levenshtein(tokDeburr, canDeburr)
      const tolerance = toleranceFor(canDeburr.length)
      if (dist === 0) {
        // Diacritiques differents uniquement (ex: "Meline" tape sans accent
        // vs "Méline" canonique) → on remet l'orthographe canonique avec
        // accents preserves.
        const fixed = matchCase(tok, canonical)
        if (fixed !== tok) replacements.push({ from: tok, to: fixed })
        return fixed
      }
      if (dist <= tolerance) {
        const fixed = matchCase(tok, canonical)
        replacements.push({ from: tok, to: fixed })
        return fixed
      }
    }

    return tok
  }).join('')

  return { text: normalized, replacements }
}

/**
 * Version "fluent" qui ne renvoie que le texte (cas usage simple, sans log).
 * Pour les appels API ou client qui veulent juste le texte corrige.
 */
export function normalizePatientNameText(
  text: string,
  prenom: string | undefined | null,
  nom: string | undefined | null,
): string {
  return normalizePatientName(text, prenom, nom).text
}
