import type { TestModule } from './types'

/**
 * Module BECD — Batterie d'Évaluation Clinique de la Dysarthrie.
 *
 * Auteurs : Dr Pascal AUZOU (neurologue) & Véronique ROLLAND-MONNOURY
 * (orthophoniste).
 * Éditeur : Ortho Édition, 2019.
 *
 * Bilan **adulte** de la dysarthrie (troubles de la parole d'origine
 * neurologique : Parkinson, AVC, SLA, SEP, traumatismes crâniens, etc.).
 * La BECD comporte une plateforme informatique pour la cotation en ligne +
 * matériel papier (cartes pour SI, carnets TPI, texte de lecture Maupassant).
 *
 * 6 domaines d'évaluation officiels :
 *   1. Sévérité (Score Perceptif SP, Score d'Intelligibilité SI, TPI)
 *   2. Analyse perceptive (Analyse globale + Grille perceptive)
 *   3. Analyse phonétique (Répétitions de phonèmes, mots simples, mots complexes)
 *   4. Examen de la motricité (TPI mobilisé pour analyse motrice + Grille motrice)
 *   5. Auto-évaluation (Speech Handicap Index — SHI)
 *   6. Analyse acoustique (relevés acoustiques instrumentaux optionnels)
 */
export const becd: TestModule = {
  nom: 'BECD',
  editeur: 'Ortho Édition',
  auteurs: 'P. Auzou & V. Rolland-Monnoury',
  annee: 2019,
  domaines: [
    'Sévérité globale (SP / SI / TPI)',
    'Analyse perceptive (globale + grille)',
    'Analyse phonétique (phonèmes / mots simples / mots complexes)',
    'Motricité de la parole',
    'Auto-évaluation (SHI)',
    'Analyse acoustique',
  ],
  epreuves: [
    'Score Perceptif (SP)',
    'Score d\'Intelligibilité (SI) — compréhension de mots / de phrases',
    'Test Phonétique d\'Intelligibilité (TPI)',
    'Analyse perceptive globale',
    'Grille perceptive (33 items qualitatifs)',
    'Répétition de phonèmes isolés',
    'Répétition de mots simples',
    'Répétition de mots complexes',
    'Grille motrice (mobilité des effecteurs)',
    'Speech Handicap Index (SHI) — auto-évaluation 30 items',
    'Relevés acoustiques (intensité, F0, jitter, shimmer, MPT…)',
  ],
  regles_specifiques: `### BECD — Batterie d'Évaluation Clinique de la Dysarthrie (Auzou & Rolland-Monnoury, Ortho Édition 2019)

**Population** : adultes présentant une dysarthrie de toute origine neurologique :
- Maladie de Parkinson et syndromes parkinsoniens,
- AVC (hémisphériques, troncullaires, cérébelleux),
- SLA / Maladie de Charcot,
- Sclérose en plaques,
- Traumatismes crâniens (TC),
- Maladies cérébelleuses,
- Paralysies bulbaires / pseudobulbaires.

**Objectifs** :
1. Établir un bilan complet de la dysarthrie (quel que soit le degré de sévérité ou la pathologie).
2. Recenser et analyser précisément les troubles → projet thérapeutique adapté.
3. Recueillir des données quantitatives pour le suivi (efficacité de la prise en charge).
4. Harmoniser les échanges entre cliniciens.

---

#### STRUCTURE OFFICIELLE DE LA BATTERIE

| Domaine évalué | Outils disponibles |
|----------------|--------------------|
| **Sévérité** | Score Perceptif (SP) — toujours renseigné ; Score d'Intelligibilité (SI) ; Test Phonétique d'Intelligibilité (TPI) |
| **Analyse perceptive** | Analyse globale ; Grille perceptive (33 items qualitatifs) |
| **Analyse phonétique** | Répétitions de phonèmes isolés / mots simples / mots complexes |
| **Examen de la motricité** | TPI mobilisé en analyse motrice ; Grille motrice (mobilité linguale, vélaire, labiale, mandibulaire, laryngée) |
| **Auto-évaluation** | Speech Handicap Index (SHI) — 30 items |
| **Analyse acoustique** | Relevés instrumentaux (intensité, fréquence fondamentale F0, jitter, shimmer, temps maximum de phonation MPT, etc.) |

**Stratégie d'utilisation** :
- L'examinateur choisit les épreuves selon la sévérité observée d'emblée.
- **Sévérité majeure** : préférer TPI (carnets de 52 mots) plutôt que SI (cartes images), Réalisation phonétique isolée plutôt que mots complexes.
- **Sévérité légère/modérée** : SI + Mots complexes + Grille perceptive complète + SHI.
- **SP est TOUJOURS renseigné** quelle que soit la sévérité (cotation 0-3 globale).
- **Analyse acoustique optionnelle** — sa réalisation dépend de l'équipement et de la disponibilité (logiciels Praat, MotorSpeech, etc.).

---

#### COTATION ET INTERPRÉTATION

**1. Score Perceptif (SP)** — cotation rapide perceptive 0 à 3 :
- 0 : Pas de dysarthrie ; parole normale ;
- 1 : Dysarthrie légère ; parole peu altérée, intelligibilité préservée ;
- 2 : Dysarthrie modérée ; parole nettement altérée mais intelligible en contexte ;
- 3 : Dysarthrie sévère ; parole très altérée, intelligibilité compromise.

**2. Score d'Intelligibilité (SI)** — % de réussite :
- Sous-test 1 : compréhension de **50 mots** isolés (séries A/B) — % de mots compris par un auditeur naïf.
- Sous-test 2 : compréhension de **50 phrases** — idem.
- Seuils cliniques (approximatifs, à valider sur le manuel) :
  - ≥ 95 % : intelligibilité préservée
  - 80-94 % : intelligibilité légèrement réduite
  - 50-79 % : intelligibilité modérément altérée
  - < 50 % : intelligibilité sévèrement altérée

**3. Test Phonétique d'Intelligibilité (TPI)** — réalisation phonétique :
- 5 carnets de 52 mots dans un ordre différent (utilisation alternée pour suivi).
- Cotation : nombre de phonèmes corrects / nombre total de phonèmes attendus.

**4. Grille perceptive** — 33 items qualitatifs notés sur échelle :
Analyser les altérations sur 5 grands axes :
- **Phonation/voix** : intensité, qualité vocale, hauteur, attaques vocales, fin de phrase.
- **Articulation** : précision consonantique, voyelles, déformations.
- **Résonance** : hypernasalité, hyponasalité, émissions nasales.
- **Prosodie** : intonation, accentuation, rythme, vitesse.
- **Respiration** : appui phonatoire, capacité respiratoire.

**5. Répétitions phonétiques** :
- Phonèmes isolés : voyelles, consonnes occlusives, fricatives, etc. → analyser quels phonèmes sont déformés.
- Mots simples (1-2 syllabes) → étude fine du contexte CV / VC.
- Mots complexes (3+ syllabes, groupes consonantiques) → analyse de la coarticulation.

**6. Grille motrice** — mobilité des effecteurs :
- Lèvres (étirement, projection)
- Joues (gonflement)
- Mandibule (ouverture, fermeture, latéralité)
- Langue (protrusion, élévation, latéralité, vitesse de mouvements alternés)
- Voile du palais (élévation lors du /a/)
- Mouvements laryngés (toux volontaire, tenue du /a/)

**7. Speech Handicap Index (SHI)** — auto-évaluation 30 items :
- Échelle Likert 5 points par item.
- Total ≥ 30 = retentissement significatif sur la qualité de vie.
- À rapprocher des plaintes spontanées du patient.

**8. Analyse acoustique** (optionnelle) :
- **MPT (Maximum Phonation Time)** : tenue d'un /a/ — normale ≥ 15 s adulte, < 10 s = atteinte respiratoire/phonatoire.
- **F0** (fréquence fondamentale) : hauteur de voix moyenne. Variations anormales = trouble prosodique.
- **Jitter** (perturbation cycle-à-cycle de F0) : > 1 % = altération de la qualité vocale.
- **Shimmer** (perturbation cycle-à-cycle d'amplitude) : > 3 % = altération.
- **Intensité moyenne** : hypophonie si < 65 dB en conversation.

---

#### 🎯 PROFILS DYSARTHRIQUES TYPES (classification Darley adaptée)

**PROFIL 1 — Dysarthrie hypokinétique (parkinsonienne)**
- SP : 1-3
- Phonation : voix faible, monotone (manque de modulation F0).
- Articulation : imprécise, sons brefs, "rush" vers la fin de phrase.
- Résonance : peu affectée.
- Prosodie : monotone, débit rapide / accéléré en fin de phrase.
- Respiration : superficielle, MPT raccourci.
- Motricité : amimie possible, mouvements alternés ralentis.
- **Diagnostic** : "Profil compatible avec une dysarthrie hypokinétique d'origine extrapyramidale, à mettre en regard du contexte clinique [maladie de Parkinson / syndrome parkinsonien]."
- **PEC** : LSVT LOUD (programme intensif voix), techniques d'intensification prosodique, exercices respiratoires.

**PROFIL 2 — Dysarthrie spastique (atteinte motoneurone supérieur bilatérale)**
- SP : 2-3
- Phonation : voix forcée, raidie, qualité strangulée.
- Articulation : imprécise, surtout sur les groupes consonantiques.
- Résonance : hypernasalité possible.
- Prosodie : monotone, ralenti.
- Motricité : motricité linguale et vélaire fortement réduite, réflexes augmentés.
- **Diagnostic** : "Profil de dysarthrie spastique compatible avec une atteinte bilatérale du motoneurone supérieur."
- **PEC** : exercices de détente articulatoire, ralentissement contrôlé, travail respiratoire.

**PROFIL 3 — Dysarthrie ataxique (cérébelleuse)**
- SP : 2-3
- Phonation : intensité fluctuante, tremblée.
- Articulation : irrégulière, "explosive", scandée syllabe par syllabe.
- Prosodie : altération du rythme, accentuation excessive et déplacée.
- Respiration : coordination phono-respiratoire altérée.
- Motricité : dysmétrie linguale, mouvements alternés irréguliers.
- **Diagnostic** : "Dysarthrie ataxique compatible avec une atteinte cérébelleuse."
- **PEC** : exercices de coordination phono-articulatoire, ralentissement contrôlé.

**PROFIL 4 — Dysarthrie flasque (atteinte motoneurone inférieur)**
- SP : 2-3
- Phonation : voix soufflée, faible, fuites d'air.
- Articulation : très imprécise, surtout sur consonnes nécessitant pression intrabuccale.
- Résonance : hypernasalité marquée (incompétence vélaire).
- Motricité : fasciculations linguales possibles (SLA), atrophie, force réduite des effecteurs.
- **Diagnostic** : "Dysarthrie flasque évocatrice d'une atteinte du motoneurone inférieur [paralysie bulbaire / SLA bulbaire / lésion des nerfs crâniens]."
- **PEC** : compensations (orthèse vélaire en cas d'incompétence vélaire majeure), CAA si évolutif.

**PROFIL 5 — Dysarthrie mixte (SLA, SEP, AVC multifocal)**
- Combinaison de plusieurs profils (souvent spastique + flasque dans la SLA bulbaire évoluée).
- **Diagnostic** : "Profil mixte associant des éléments [spastique/flasque/ataxique] cohérent avec [pathologie sous-jacente]."
- **PEC** : adaptée à la composante dominante + suivi rapproché si évolutif.

---

#### ⛔ RÈGLES CLINIQUES

1. **TOUJOURS commencer par le SP** quelle que soit la sévérité (cotation rapide globale).
2. **Adapter le choix des épreuves** à la sévérité observée d'emblée (TPI plutôt que SI si majeure).
3. **Croiser perceptif et acoustique** quand l'acoustique est disponible.
4. **Toujours noter le diagnostic médical** du patient avant le bilan (Parkinson, SLA, AVC, SEP…) — orientation diagnostique de profil.
5. **Le SHI complète mais ne remplace pas** le bilan objectif — auto-évaluation = perception du patient.
6. **Si dysarthrie évolutive** (SLA notamment) : refaire la BECD tous les 3-6 mois pour suivre l'évolution.
7. **NE PAS poser de diagnostic étiologique** depuis le bilan seul — le profil oriente, le diagnostic relève du neurologue.

---

#### RECOMMANDATIONS / PEC

**PEC orthophonique de la dysarthrie** :
- Hypokinétique (Parkinson) : **LSVT LOUD** (16 séances en 4 semaines) — programme à efficacité démontrée.
- Spastique : détente articulatoire, ralentissement contrôlé.
- Ataxique : coordination, ralentissement.
- Flasque : compensations + CAA si évolutif (SLA).

**Articulation avec autres bilans** :
- **Bilan déglutition** systématique en cas de dysarthrie associée (souvent atteinte conjointe).
- **Bilan auditif** systématique.
- **Bilan cognitif** (MoCA, MMSE) en cas de plainte cognitive associée.
- **Bilan respiratoire** (CV, spirométrie) si MPT < 10 s.

**En cas de pathologie évolutive (SLA, SEP)** :
- Anticiper la mise en place d'une **communication alternative améliorée (CAA)** : tableaux pictographiques, synthèse vocale, etc.
- Coordination avec ergothérapeute pour les outils numériques.

---

#### À NE JAMAIS FAIRE

- ❌ Conclure à un type de dysarthrie depuis une seule épreuve isolée.
- ❌ Diagnostiquer l'étiologie (Parkinson, SLA, AVC, SEP) — c'est le neurologue.
- ❌ Confondre dysarthrie et aphasie (le langage est préservé dans la dysarthrie pure).
- ❌ Confondre dysarthrie et apraxie de la parole (l'apraxie est une atteinte de la programmation motrice, non de l'exécution).
- ❌ Ignorer le SHI — la plainte du patient et le retentissement sur sa qualité de vie sont déterminants.

#### TOUJOURS FAIRE

- ✅ SP systématique en première intention.
- ✅ Croiser perceptif + phonétique + motricité + auto-évaluation.
- ✅ Mentionner l'étiologie suspectée (pas le diagnostic) en contexte.
- ✅ Évaluer la déglutition en parallèle systématiquement.
- ✅ Refaire la BECD à 3-6 mois si pathologie évolutive.
- ✅ Préciser la classification (hypokinétique / spastique / ataxique / flasque / mixte) en hypothèse, à confirmer avec le neurologue.`,
}
