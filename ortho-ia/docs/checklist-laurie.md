# Checklist clinique Laurie — vérification CRBO en prod

Cette checklist regroupe les **26 règles cliniques non négociables** validées avec
Laurie Berrio-Arberet (orthophoniste senior). À utiliser pour valider chaque CRBO
généré en production sur `https://ortho-ia.vercel.app`, ou pour auditer le rendu
Word généré localement via `/dev/test-word` (profil Lucile).

Cocher chaque item après vérification visuelle dans le Word téléchargé.

---

## A. En-tête, identification, dates

- [ ] **R1.** En-tête orthophoniste auto-rempli depuis profil Supabase (nom, adresse, CP, ville, tél, mail) — pas saisi à la main dans le formulaire.
- [ ] **R2.** Sous-titre `Bilan initial du [DATE]` **centré** sous le titre principal.
- [ ] **R3.** Date affichée = **`bilan_date` du formulaire**, formatée FR long (`25 avril 2026`), **pas la date du jour**.
- [ ] **R4.** Âge patient calculé **automatiquement depuis date_naissance vs bilan_date** (pas vs date du jour).
- [ ] **R5.** **Pas de badge** "Sévérité globale du profil" affiché en page 1.

## B. Motif et anamnèse

- [ ] **R6.** Motif de consultation **reformulé en 1-2 phrases professionnelles** (jamais les notes brutes).
- [ ] **R7.** **Anti-hallucination familiale** : aucune information non fournie n'est inventée (composition familiale, profession parents, antécédents, suivis…). Si une rubrique n'a pas de note brute, elle est **omise** (pas de `[non renseigné]` dans la prose).

## C. Tests pratiqués

- [ ] **R8.** **Aucun test non explicitement coché** dans le formulaire ne doit apparaître dans le CRBO. Vérifier que `Tests pratiqués` correspond exactement à la sélection.

## D. Graphique HappyNeuron page 1

- [ ] **R9.** **Un seul graphique HappyNeuron en page 1**. Aucun graphique sous les tableaux de domaines.
- [ ] **R10.** **Ligne médiane à P50 = trait plein noir** (pas pointillé rouge).
- [ ] **R11.** **Ligne d'alerte à P10 = trait plein rouge** (frontière fragilité / difficulté Exalang).
- [ ] **R12.** **Tous les labels d'épreuves entièrement visibles** (pas de `…` en fin de label). Titres de groupes wrappés sur 2 lignes si nécessaire.
- [ ] **R13.** Couleurs des bandes : vert (Dans la norme P > 25) · jaune/orange (Fragilité P10-25) · orange foncé (Difficulté P5-9) · rouge/marron (Difficulté sévère P < 5).

## E. Tableaux par domaine

- [ ] **R14.** **Q1 (P25)** classé en **Zone de fragilité** (cellule jaune), **PAS** Dans la norme. C'est l'erreur Exalang la plus fréquente.
- [ ] **R15.** Tous les seuils respectent la grille : P > 25 vert · P10-25 jaune · P5-9 orange · P < 5 rouge.

## F. Commentaires par domaine (règles clinique strictes)

- [ ] **R16.** **Aucune mention** des termes "dyslexie", "dysorthographie", "dyscalculie", "dysphasie", "TDAH" dans les commentaires de domaine. Ces termes apparaissent uniquement dans le **diagnostic final**, entre parenthèses après le libellé DSM-5.
- [ ] **R17.** **Aucun percentile cité** dans les commentaires (pas de "P5", "P25", "P < 2"…). Description clinique uniquement (ex : "performance préservée", "fragilité marquée").
- [ ] **R18.** **Aucun tiret cadratin/demi-cadratin** ("–", "—") qui découpe une idée façon machine. Phrases rédigées et fluides uniquement.
- [ ] **R19.** **Aucune mention** de la rééducation / prise en charge / séances dans les commentaires de domaine. Réservé aux recommandations.
- [ ] **R20.** Si une épreuve est en zone de difficulté ou de difficulté sévère : **une phrase explique les répercussions possibles en milieu scolaire** (compréhension de consignes, copie au tableau, rédaction, calcul mental…).

## G. Diagnostic final

- [ ] **R21.** **Sous-titre "Comportement pendant le bilan" en gras** (rendu H3 vert).
- [ ] **R22.** **Format imposé du diagnostic** : libellé DSM-5/CIM-10 en premier et **en gras**, dénomination courante entre parenthèses pour la compréhension parents :
   > "**trouble spécifique de la lecture** (F81.0 — communément appelé dyslexie) et **trouble spécifique de l'orthographe** (F81.1 — communément appelé dysorthographie)"
- [ ] **R23.** Si comorbidités détectées : listées **séparément** au format `Libellé — code CIM-10 — justification courte` (sans percentile cité).
- [ ] **R24.** **Aucun paragraphe** automatique sur la MDPH, le PPS, le PAP, la RQTH, l'ALD dans le diagnostic ou les recommandations. Ces démarches apparaissent **uniquement** si l'orthophoniste les a explicitement mentionnées dans ses notes.

## H. Recommandations

- [ ] **R25.** **Phrase d'introduction imposée** : "Une prise en charge orthophonique est recommandée, et en parallèle la mise en place d'aménagements en classe." (pas de "rééducation hebdomadaire de 30 séances").
- [ ] **R26.** **Axes thérapeutiques en bullets numérotés** (1. … 2. … 3. …).
- [ ] **R27.** **Aucune prescription** à d'autres professionnels (pas "le neuropsy devra…", "l'ergo mettra en place…"). Toujours formulation type "une consultation X pourrait être envisagée".
- [ ] **R28.** **Aucune mention** "refaire un bilan orthophonique". Préférence "Une réévaluation orthophonique sera programmée…".

## I. Aménagements scolaires (PAP)

- [ ] **R29.** Libellé section : "Aménagements scolaires **conseillés**" (pas "proposés").
- [ ] **R30.** **Maximum 10 aménagements**, présentés en **bullets condensés à plat** (pas de groupement par catégorie hiérarchique).
- [ ] **R31.** **Pas de polices nominatives** ("OpenDyslexic", "Arial 14"…) ni de **logiciels nominatifs** ("Voice Dream", "NaturalReader"…) — formulations générales uniquement.

## J. Conclusion

- [ ] **R32.** **Conclusion finale** ("Compte rendu remis en main propre…") en **petite taille italique grise**, **centrée**, **après la signature** en bas de page.

---

## Profil de référence — Lucile Andreaux (Exalang 11-15)

Cas clinique communiqué par Laurie pour valider tous les points ci-dessus en
une passe. Détails complets dans `app/dev/test-word/page.tsx` (FORM_DATA_LUCILE).

Pour tester rapidement en local sans passer par l'API :
1. `npm run dev`
2. Aller sur `http://localhost:3000/dev/test-word`
3. Cliquer "🔵 Télécharger version Complet"
4. Ouvrir le Word et passer la checklist ci-dessus
5. Cliquer "🟢 Télécharger version Synthétique" et vérifier que le contenu
   est bien condensé (commentaires courts, recommandations 5-7 bullets,
   max 5-7 PAP).

Pour tester en prod (avec passage par l'API Anthropic) :
- Soit reproduire manuellement Lucile dans le formulaire CRBO
- Soit utiliser le snippet DevTools (`docs/test-lucile-devtools.js`)
