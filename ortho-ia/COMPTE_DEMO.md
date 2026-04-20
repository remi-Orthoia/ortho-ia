# Compte de démonstration — Ortho.ia Beta

## Identifiants

- **URL prod** : https://ortho-ia.vercel.app/auth/login
- **Email** : `demo@ortho-ia.fr`
- **Mot de passe** : `DemoBeta2026!`

Compte configuré en plan **Pro illimité** (crbo_limit 9 999) pour que les beta testeurs puissent explorer librement sans quota.

## Ce qui est pré-chargé

### Profil orthophoniste (onglet *Mon profil*)
- **Sophie DEMO** — 24 avenue de la République, 75011 Paris
- 01 43 00 00 00 — demo@ortho-ia.fr

### 5 patients couvrant les profils cliniques variés (onglet *Mes patients*)

| Prénom · Nom | DDN | Classe | École | Médecin |
|---|---|---|---|---|
| **Noah** BERTRAND | 10/08/2016 | CM2 | École du Parc | Dr Claire LEVY |
| **Chloé** RICHARD | 12/04/2016 | CM1 | École Jean Moulin | Dr Pauline BERTIN |
| **Gabriel** LEGRAND | 25/11/2020 | GS | École Paul Eluard | Dr Marc HENRY |
| **Inès** DUBOIS | 14/02/2013 | 5ème | Collège Rousseau | Dr Claire LEVY |
| **Michel** FONTAINE | 03/07/1958 | Adulte | — | Dr Isabelle FOUCHÉ |

### 5 CRBOs de qualité professionnelle (onglet *Historique* + Kanban)

| # | Patient | Test | Sévérité | Statut | Profil clinique clé |
|---|---|---|---|---|---|
| 1 | **Noah** (CM2) | Exalang 8-11 | 🔴 Sévère | Terminé | **Dyslexie mixte sévère** — les 2 voies de lecture atteintes + fragilité métaphonologique profonde + suspicion TDA associé. PPS/MDPH indiqué. |
| 2 | **Chloé** (CM1) | Examath | 🟠 Modéré | Terminé | **Dyscalculie développementale** — déficit central du sens du nombre, géométrie préservée (critère différentiel). Anxiété maths secondaire. PAP. |
| 3 | **Gabriel** (GS, 5 ans) | Exalang 3-6 + ELO | 🔴 Sévère | Terminé | **TDL (Trouble Développemental du Langage) sévère** — atteinte bilatérale réceptive/expressive + phonologique. Orientation CRTLA urgente. |
| 4 | **Inès** (5ème) | Exalang 11-15 | 🟢 Léger | À relire | **Renouvellement** — dyslexie compensée après 3 ans de PEC, lecture normalisée (P5→P25), orthographe résiduelle. Synthèse d'évolution avec progrès. |
| 5 | **Michel** (68 ans) | MoCA + BETL | 🟠 Modéré | À relire | **Trouble cognitif léger adulte** — atteinte mnésique + lexico-sémantique, orientation neurologue + neuropsy. Composante thymique à évaluer. |

Chaque CRBO contient :
- Anamnèse rédigée en prose professionnelle (150-400 mots, 3ème personne)
- Tableaux par domaine avec É-T et percentiles
- Commentaires cliniques détaillés (3-6 phrases par domaine)
- Diagnostic + diagnostic différentiel argumenté
- **Score de sévérité global** (Léger / Modéré / Sévère)
- **Comorbidités détectées** automatiquement (TDA, anxiété, thymique…)
- **Aménagements PAP proposés** adaptés au profil
- **Synthèse d'évolution** pour le renouvellement (CRBO 4)
- **Glossaire** pédagogique en fin de document
- Structure JSON complète → export Word avec graphiques et couleurs

## Tour de force pour le beta testeur

1. **Login** `demo@ortho-ia.fr` / `DemoBeta2026!` → voir le Kanban avec badges de sévérité colorés.
2. **Drag & drop** : essayer de déplacer une carte entre colonnes (statut persisté en DB).
3. **Ouvrir un CRBO** : cliquer sur Noah ou Michel → voir la structure préview mise en forme.
4. **Télécharger un Word** → vérifier : graphique page 1, badge sévérité, tableau comparatif (Inès renouvellement uniquement), colonne Interprétation colorée, glossaire final.
5. **Partage 24h** : cliquer "Partager (24h)" → copie automatique du lien → ouvrir dans un autre navigateur/incognito pour simuler un médecin qui relit.
6. **Timeline patient** : cliquer sur un patient dans "Mes patients" → voir la fiche détaillée (avec graphique si plusieurs CRBOs).
7. **Créer un nouveau CRBO** : tester le formulaire 5 étapes avec le chronomètre, les tags de comportement, le raccourci ⌘+Entrée, et l'écran de génération animé.

## Reset du compte démo

Pour remettre à zéro (5 patients + 5 CRBO initiaux) :

```bash
python3 /tmp/gen-demo-v2.py
```

Le script purge d'abord les CRBOs et patients existants du user puis réinjecte la configuration complète.

## Beta readiness

- ✅ Profil Sophie DEMO complet (pré-remplissage automatique dans nouveau CRBO)
- ✅ Plan Pro illimité pour exploration
- ✅ 5 CRBOs couvrant TOUS les profils cliniques : dyslexie mixte, dyscalculie, TDL sévère, renouvellement, adulte BETL
- ✅ Timeline activable (ajouter un 2e bilan sur un patient existant pour voir les courbes)
- ✅ Export Word complet pour tous les profils
- ✅ Statuts Kanban variés (3 Terminés + 2 À relire)
