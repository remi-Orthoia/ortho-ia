import type Anthropic from '@anthropic-ai/sdk'

/**
 * Tool + prompts pour l'extraction d'un bilan orthophonique précédent
 * (CRBO rédigé OU feuille de résultats brute) au moment d'un renouvellement.
 *
 * Extrait dans un module dédié pour pouvoir être importé tel quel par :
 *   - app/api/extract-previous-bilan/route.ts (production)
 *   - scripts/test-extract-previous.ts (test local de complétude)
 */

export const EXTRACT_PREVIOUS_TOOL: Anthropic.Tool = {
  name: 'extract_previous_bilan',
  description:
    "Extrait d'un compte-rendu de bilan orthophonique externe (Word ou PDF) " +
    "les éléments structurés nécessaires à l'analyse comparative dans un " +
    "bilan de renouvellement : date, tests, scores, percentiles, diagnostic, " +
    "aménagements proposés.",
  input_schema: {
    type: 'object',
    required: ['bilan_date', 'tests_utilises', 'domains', 'diagnostic'],
    properties: {
      bilan_date: {
        type: 'string',
        description:
          "Date du bilan au format ISO YYYY-MM-DD (ex: '2024-09-15'). Si " +
          "ambiguë (juste 'septembre 2024'), le 1er du mois. Si introuvable, ''.",
      },
      tests_utilises: {
        type: 'array',
        items: { type: 'string' },
        description:
          "Noms des tests/batteries pratiqués (ex: ['Exalang 8-11', 'BALE']). " +
          "Liste vide si non indiqué.",
      },
      anamnese_redigee: {
        type: 'string',
        description:
          "Court résumé de l'anamnèse extraite du document, en prose. Max " +
          "3-4 phrases. Vide si rien d'exploitable.",
      },
      domains: {
        type: 'array',
        description:
          "Résultats groupés par domaine. Pour chaque domaine, lister les " +
          "épreuves avec leur score et percentile. Si le percentile n'est pas " +
          "fourni explicitement mais l'É-T oui, ne PAS recalculer — laisser " +
          "percentile_value=null. Respecter la grille 5 zones d'interprétation (alignée Exalang).",
        items: {
          type: 'object',
          required: ['nom', 'epreuves'],
          properties: {
            nom: {
              type: 'string',
              description:
                "Nom du domaine clinique (ex: 'A.1 Boucle phonologique', " +
                "'B.2 Lecture'). Utiliser la nomenclature officielle si " +
                "présente dans le document, sinon un libellé naturel.",
            },
            epreuves: {
              type: 'array',
              items: {
                type: 'object',
                required: ['nom', 'score', 'percentile', 'percentile_value', 'interpretation'],
                properties: {
                  nom: { type: 'string' },
                  score: { type: 'string', description: 'Score brut (ex: "16/25", "TPS 480").' },
                  et: { type: ['string', 'null'] },
                  percentile: {
                    type: 'string',
                    description: "Notation telle qu'utilisée dans le document (Q1, Med, P10...).",
                  },
                  percentile_value: {
                    type: 'number',
                    description:
                      'Valeur numérique 0-100. Q1→25, Med→50, Q3→75. ' +
                      'Si introuvable et ne peut pas être déduit du percentile texte, mettre 50 par défaut.',
                    minimum: 0,
                    maximum: 100,
                  },
                  interpretation: {
                    type: 'string',
                    enum: ['Moyenne haute', 'Moyenne', 'Zone de fragilité', 'Difficulté', 'Difficulté sévère'],
                    description:
                      "Grille 5 zones alignée sur les seuils officiels Exalang " +
                      "(manuel Exalang 11-15 p. 65-67) : 'Moyenne haute' (P ≥ 75), " +
                      "'Moyenne' (P26-74), 'Zone de fragilité' (P10-25, Q1 inclus — " +
                      "« zone à surveiller »), 'Difficulté' (P5-9, seuil pathologique " +
                      "consensuel P10), 'Difficulté sévère' (< P5, seuil strict -1,65 σ).",
                  },
                },
              },
            },
            commentaire: { type: 'string' },
          },
        },
      },
      diagnostic: {
        type: 'string',
        description: "Diagnostic orthophonique tel qu'il figure dans le document. Pas de reformulation.",
      },
      amenagements: {
        type: 'array',
        items: { type: 'string' },
        description:
          "Aménagements scolaires/PAP listés dans le document (ex: 'Temps majoré', " +
          "'Tolérance orthographique'). Tableau vide si rien.",
      },
    },
  },
}

export const EXTRACT_PROMPT_PDF = `# RÔLE

Tu es un assistant qui extrait des données structurées depuis un document orthophonique francophone. Le document peut être :
  - un compte-rendu de bilan orthophonique (CRBO) rédigé,
  - une feuille de résultats brute d'une batterie de tests (HappyNeuron Exalang, Examath, BALE, etc.),
  - un PDF natif ou scanné, mono ou **multi-pages**.

Tu utilises l'outil \`extract_previous_bilan\` pour rendre une structure JSON.

# OBJECTIF

Cette extraction nourrit la **synthèse comparative** d'un bilan de renouvellement : la chaîne en aval comparera ÉPREUVE PAR ÉPREUVE les scores actuels avec ceux que tu extraies. **Tout épreuve manquée sera marquée à tort comme "nouvelle"** dans le rendu final — c'est la pire erreur possible. L'exhaustivité prime sur tout le reste.

# CONSIGNES — EXHAUSTIVITÉ ABSOLUE

1. **Date** : repère "Bilan du X" / "Date : X" / la date en haut du document. Format ISO YYYY-MM-DD. Si introuvable, ''.
2. **Tests** : repère les batteries citées (Exalang 8-11, BALE, Examath, MoCA…).
3. 🚨 **Toutes les épreuves de toutes les pages** : un document HappyNeuron tient souvent sur 2-3 pages, parcours-les TOUTES sans exception. Chaque ligne d'un tableau d'épreuves = une entrée \`epreuves[]\`.
4. 🚨 **Sous-épreuves SÉPARÉES** : si une épreuve a plusieurs modalités (score, temps, ratio, erreurs, mots lus, note pondérée…), retourne une entrée DISTINCTE pour chacune avec son nom complet ("Lecture de mots — score", "Lecture de mots — temps", "Lecture de mots — ratio", "Lecture de mots — erreurs"). Ne JAMAIS fusionner.
5. Pour chaque épreuve : nom complet (avec la sous-modalité), score brut, écart-type si présent, percentile (Q1/Med/Q3/Pxx).
6. **Conversion quartiles** (HappyNeuron / Exalang) :
   - Q1 → percentile_value = 25, interpretation = "Zone de fragilité" (« zone à surveiller » Exalang)
   - Med / Q2 → 50 / "Moyenne"
   - Q3 → 75 / "Moyenne haute"
   - Pxx → la valeur exacte
7. **Ne JAMAIS recalculer un percentile depuis un É-T**. Si le document ne donne que l'É-T sans percentile, marque \`percentile_value: null\` et laisse \`interpretation: "Moyenne"\` (valeur prudente par défaut).
8. **Préserver la hiérarchie des groupes** : si le document affiche un en-tête A.1/A.2/B.1/B.2/C.1, reporte ce code dans \`domains[].nom\` (ex: "A.1 Langage oral"). Ne mélange pas les groupes.
9. Diagnostic : repère "Diagnostic", "Conclusion clinique", "Trouble identifié". Garde la formulation exacte. Si le document est une feuille de résultats brute sans diagnostic, laisse \`diagnostic: ''\`.
10. Aménagements : extrais ceux mentionnés ("temps majoré", "tolérance orthographique", etc.) — pas d'invention. Tableau vide si absent.

# AUTOCONTRÔLE AVANT D'APPELER L'OUTIL

Avant de finaliser, compte mentalement le nombre d'épreuves visibles dans le document. Pour un Exalang 8-11 complet, tu dois trouver entre **25 et 40 épreuves** (sous-modalités incluses). Si tu n'en as listé que 10-15 alors que le document en contient plus, c'est que tu en as oubliées : reprends ta lecture page par page.

**Aucune hallucination** : on préfère manquer une donnée que l'inventer. Mais on préfère listée 35 vraies épreuves que d'en omettre 20.`

export const EXTRACT_PROMPT_DOCX = `# RÔLE

Tu reçois le **texte brut** d'un document orthophonique extrait d'un fichier Word (.docx) — soit un compte-rendu de bilan rédigé, soit une transcription d'une feuille de résultats. Tu utilises l'outil \`extract_previous_bilan\` pour rendre une structure JSON.

# OBJECTIF

Cette extraction nourrit la **synthèse comparative** d'un bilan de renouvellement : la chaîne en aval comparera ÉPREUVE PAR ÉPREUVE les scores actuels avec ceux que tu extraies. **Toute épreuve manquée sera marquée à tort comme "nouvelle"** dans le rendu final — c'est la pire erreur possible. Sois exhaustif.

# CONSIGNES — EXHAUSTIVITÉ ABSOLUE

1. Date au format ISO YYYY-MM-DD ; tests pratiqués ; épreuves avec score + É-T + percentile + interprétation.
2. 🚨 **Toutes les épreuves** présentes dans le document, quelle que soit la longueur. Pour un Exalang 8-11 complet, attends-toi à 25-40 entrées (sous-modalités incluses).
3. 🚨 **Sous-épreuves SÉPARÉES** : "Lecture de mots — score", "Lecture de mots — temps", "Lecture de mots — ratio", "Lecture de mots — erreurs" sont 4 entrées distinctes. Ne JAMAIS fusionner.
4. **Préserver la hiérarchie des groupes** A.1 / A.2 / B.1 / B.2 / C.1 dans \`domains[].nom\`.
5. **Q1 = P25 = "Zone de fragilité"** (« zone à surveiller » Exalang). Med = P50 = "Moyenne". Q3 = P75 = limite "Moyenne haute".
6. **Ne JAMAIS convertir É-T → percentile**. Si percentile manquant, \`percentile_value: null\`.
7. Diagnostic et aménagements : prendre la formulation littérale du document. Vide si absent.

# AUTOCONTRÔLE

Avant d'appeler l'outil, vérifie que tu as bien extrait CHAQUE ligne du tableau d'épreuves. Si le document liste 32 épreuves et que ton JSON n'en contient que 12, recommence : tu en as oubliées.

Aucune hallucination. Tableau vide si rubrique absente.`
