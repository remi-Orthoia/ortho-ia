/**
 * Mentions administratives par pays d'exercice de l'orthophoniste.
 *
 * Le pays est saisi par l'ortho dans son profil (champ `country` ISO 3166-1
 * alpha-2). Ces fragments sont injectés dans le system prompt pour adapter
 * les mentions de remboursement, codes professionnels et formules juridiques
 * aux conventions du pays.
 *
 * Sources :
 * - FR : nomenclature AMO (NGAP) Assurance Maladie + décret 2002-721 (corpus
 *   Anne Frouard, Elsa DALL'AGNOL).
 * - BE : INAMI/RIZIV + nomenclature catégorie B2 logopédie (corpus Isabelle
 *   Bruwier CRBO5/6).
 * - CH : conventions tarmed/Suisse romande (LAMal, assurance complémentaire),
 *   convention SLPS (Société Suisse de Logopédie).
 * - LU : Caisse Nationale de Santé (CNS) Luxembourg, ALL (Association
 *   Luxembourgeoise des Logopèdes).
 *
 * Quand un nouveau pays est ouvert, ajouter son fragment ici puis l'exposer
 * dans `index.ts` (export + injection dans buildKnowledgeContext).
 */

export const STYLE_ADMINISTRATIF_FR = `## Mentions administratives, France (pays d'exercice = FR)

L'orthophoniste exerce en **France**. Le CRBO doit utiliser le cadre
administratif français :

### En-tête et identification
- **N° ADELI** ou **N° RPPS** de l'orthophoniste (champ profil \`adeli_rpps\`).
- Forme : "Orthophoniste — N° ADELI XXX XXX XXX" ou "Orthophoniste — N° RPPS 10XXXXXXXXX".

### Forme juridique du diagnostic (référence Anne Frouard)
> "Conformément au décret n°2002-721 du JO du 4 mai 2002 rendant le
> diagnostic orthophonique obligatoire et en référence aux classifications
> internationales en cours (DSM-V / CIM-10), le bilan orthophonique réalisé
> ce jour met en évidence [...]"

### Codes de nomenclature
Cotation **AMO** (Acte Médical d'Orthophonie) selon la **NGAP** (Nomenclature
Générale des Actes Professionnels) :
- **30 AMO 12,1** : suivi des troubles spécifiques du langage écrit.
- **30 AMO 8,4** : suivi des troubles spécifiques du langage oral pédiatrique.
- **30 AMO 9,4** : suivi des troubles du langage oral adulte (aphasie).
- **30 AMO 11,7** : suivi des troubles spécifiques des apprentissages,
  cognition mathématique.
- **30 AMO 13,5** : suivi des troubles de la déglutition.
- **30 AMO 13,8** : suivi des troubles de la communication associés à un
  syndrome neuro-développemental.
- **30 AMO 5** : séance individuelle de rééducation orthophonique standard.
- **15 AMO 12,2** : groupe / atelier d'orthophonie.

### Formule de demande de prise en charge
> "La rééducation s'inscrit dans le cadre de la nomenclature AMO [code]
> ([libellé NGAP entre parenthèses])."

OU, variante NGAP verbatim avec ancrage sur l'ordonnance :

> "Pour démarrer la rééducation, nous utilisons votre ordonnance du [date]
> pour demander une prise en charge à l'assurance maladie pour « [libellé
> NGAP exact entre guillemets français] » selon la NGAP."

### Aménagements scolaires
- **PAP** (Plan d'Accompagnement Personnalisé).
- **PPS** (Projet Personnalisé de Scolarisation, via MDPH).
- **PPRE** (Programme Personnalisé de Réussite Éducative).

🔒 Mentions à NE PAS utiliser pour FR : INAMI (BE), catégorie B2 (BE), tarmed
(CH), CNS (LU), NA (CH).
`

export const STYLE_ADMINISTRATIF_BE = `## Mentions administratives, Belgique (pays d'exercice = BE)

L'orthophoniste (en Belgique, **logopède**) exerce en **Belgique**. Le CRBO
doit utiliser le cadre administratif belge (INAMI/RIZIV).

### Vocabulaire
- Utiliser **"logopède"** ou **"logopédiste"** plutôt que "orthophoniste".
- Utiliser **"bilan logopédique"** plutôt que "bilan orthophonique".
- Utiliser **"prise en charge logopédique"** plutôt que "prise en charge
  orthophonique".

### En-tête et identification
- **N° INAMI** du logopède : format X-XXXXX-XX-XXX (ex. 5-89079-03-802).
- **N° Visa** (autorisation Communauté française ou flamande).
- Forme : "Logopède — N° INAMI X-XXXXX-XX-XXX / N° Visa XXXXX".

### Pas de forme juridique de type décret 2002-721
La forme juridique française (décret 2002-721) ne s'applique PAS en Belgique.
Le diagnostic logopédique belge est plus direct, sans formule juridique
obligatoire. Forme type :
> "L'évaluation logopédique a permis de mettre en évidence [diagnostic]
> caractérisé par [caractéristiques cliniques]."

### Formule de demande de prise en charge
Pas de code AMO/NGAP. Le remboursement passe par les **mutuelles** belges
(INAMI + complémentaire) selon des **catégories de prise en charge**
logopédique. Format type :

> "En conclusion, nous sollicitons l'accord de la mutuelle pour une prise en
> charge en [langage oral / langage écrit / troubles cognitifs] à raison
> [d'une heure par semaine / de deux séances par semaine / de N séances
> sur N mois], et ce, pour une période de [durée], catégorie [B2 / autre]."

### Catégories de prise en charge INAMI principales
- **Catégorie B2** : troubles d'apprentissage du langage écrit chez l'enfant
  (dyslexie, dysorthographie) — 156 séances sur 2 ans renouvelable.
- **Catégorie B1** : troubles d'apprentissage du langage oral chez l'enfant
  (dysphasie, retard de langage) — 280 séances sur 2 ans renouvelable.
- **Catégorie E** : troubles cognitifs adulte (aphasie post-AVC) — 250
  séances sur 1 an renouvelable.
- **Catégorie A** : troubles de la voix, de la déglutition — barème distinct.

### Aménagements scolaires
- En Communauté française : **PIA** (Plan Individuel d'Apprentissage),
  **PPP** (Plan Pédagogique Particulier).
- En Communauté flamande : **GON** (Geïntegreerd Onderwijs / enseignement
  intégré) + équipements adaptés selon décret M (2014).
- Pas de "PAP" ni "PPS" (terminologie française).

🔒 Mentions à NE PAS utiliser pour BE : "orthophoniste" (utiliser logopède),
AMO/NGAP (FR), N° ADELI/RPPS (FR), décret 2002-721 (FR), PAP/PPS (FR),
MDPH (FR).
`

export const STYLE_ADMINISTRATIF_CH = `## Mentions administratives, Suisse (pays d'exercice = CH)

L'orthophoniste (en Suisse, **logopédiste**) exerce en **Suisse**. Le CRBO
doit utiliser le cadre administratif suisse (LAMal + cantons).

### Vocabulaire
- Utiliser **"logopédiste"** (Suisse romande) ou **"logopädin/logopäde"**
  (Suisse alémanique). Adapter selon la langue du CRBO.
- Utiliser **"bilan logopédique"** plutôt que "bilan orthophonique".

### En-tête et identification
- **N° GLN** (Global Location Number) pour les professionnels de santé
  suisses, format 7601001XXXXXX (13 chiffres).
- Pas d'INAMI ni d'ADELI.
- Forme : "Logopédiste diplômée — N° GLN 7601001XXXXXX".

### Forme juridique du diagnostic
Pas de décret 2002-721 (français). Référence aux classifications
internationales standardisées :
> "Le bilan logopédique réalisé ce jour met en évidence [diagnostic],
> objectivé par [scores] et compatible avec les critères [DSM-5 / CIM-11]."

### Formule de demande de prise en charge
Pas de code AMO/NGAP. Deux régimes coexistent en Suisse :
1. **LAMal (Assurance obligatoire des soins)** : prise en charge sur
   prescription médicale, pas de cotation à l'acte standardisée — la
   logopédiste facture selon le **tarif convention SLPS** (Société Suisse
   de Logopédie) accepté par les assureurs.
2. **AI (Assurance Invalidité)** : pour les enfants avec infirmité
   congénitale reconnue, prise en charge AI selon les directives OFAS.
3. **Convention cantonale** : variation selon canton (Vaud, Genève, Berne,
   Zurich) — la prise en charge scolaire est gérée par le SESAF (Vaud),
   SMP (Genève), SAS (Berne), etc.

Format type (cas standard LAMal) :
> "Une prise en charge logopédique à raison [d'une / deux] séance(s) par
> semaine est indiquée. Le tarif appliqué est celui de la convention SLPS
> en vigueur, sur la base de la prescription médicale du [date]."

### Aménagements scolaires (variables par canton)
- **Vaud** : SESAF (Service de l'Enseignement Spécialisé et de l'Appui à la
  Formation) + équipe pluridisciplinaire d'établissement.
- **Genève** : SMP (Service Médico-Pédagogique) + Office médico-pédagogique.
- **Berne / Zurich** : Sonderpädagogik + IBEM (Integrative Begabungs- und
  Bestensförderung).
- Pas de "PAP" ni "PPS" (terminologie française).

🔒 Mentions à NE PAS utiliser pour CH : AMO/NGAP (FR), INAMI (BE), N° ADELI/
RPPS (FR), N° Visa (BE), décret 2002-721 (FR), PAP/PPS (FR), MDPH (FR),
catégorie B2 (BE).
`

export const STYLE_ADMINISTRATIF_LU = `## Mentions administratives, Luxembourg (pays d'exercice = LU)

L'orthophoniste (au Luxembourg, **orthophoniste** ou **logopède**) exerce
au Grand-Duché. Le CRBO doit utiliser le cadre administratif luxembourgeois
(CNS — Caisse Nationale de Santé).

### Vocabulaire
- Les deux termes "orthophoniste" et "logopède" coexistent au Luxembourg.
  Utiliser **"orthophoniste"** par défaut (terminologie CNS officielle).

### En-tête et identification
- **N° de code prestataire CNS** (format à 8 chiffres).
- Diplôme reconnu via le Ministère de la Santé luxembourgeois.

### Formule de demande de prise en charge
Pas de code AMO/NGAP. Le remboursement passe par la **CNS** (assurance
maladie universelle luxembourgeoise) sur prescription médicale.

Format type :
> "Une prise en charge orthophonique à raison [d'une / deux] séance(s) par
> semaine est indiquée. Cette prise en charge est demandée à la CNS sur la
> base de la prescription médicale du [date], dans le cadre de la
> nomenclature des actes pris en charge par l'assurance maladie."

### Aménagements scolaires
- Système scolaire luxembourgeois trilingue (français / allemand /
  luxembourgeois). Les aménagements sont gérés par la **CCPP** (Commission
  Consultative pour les enfants à besoins éducatifs particuliers ou
  spécifiques) du **MENJE** (Ministère de l'Éducation Nationale, de
  l'Enfance et de la Jeunesse).
- Pas de "PAP" ni "PPS" (terminologie française).

🔒 Mentions à NE PAS utiliser pour LU : AMO/NGAP (FR), INAMI (BE), N° ADELI/
RPPS (FR), N° GLN (CH), décret 2002-721 (FR), PAP/PPS (FR), MDPH (FR),
catégorie B2 (BE).
`

import type { OrthoCountry } from '../../types'

/**
 * Sélecteur : retourne le fragment administratif correspondant au pays
 * de l'orthophoniste. Default 'FR' si non spécifié.
 */
export function getStyleAdministratifByCountry(country: OrthoCountry | undefined): string {
  switch (country) {
    case 'BE': return STYLE_ADMINISTRATIF_BE
    case 'CH': return STYLE_ADMINISTRATIF_CH
    case 'LU': return STYLE_ADMINISTRATIF_LU
    case 'FR':
    default:
      return STYLE_ADMINISTRATIF_FR
  }
}
