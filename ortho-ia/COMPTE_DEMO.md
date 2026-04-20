# Compte de démonstration — Ortho.ia Beta

## Identifiants

- **URL prod** : https://ortho-ia.vercel.app/auth/login
- **Email** : `demo.orthoia@proton.me`
- **Mot de passe** : `DemoBeta2026!`

Compte configuré en plan **Pro** avec limite 999 CRBOs (illimité pratique) pour que les beta testeurs puissent explorer librement.

## Ce qui est pré-chargé

### Profil orthophoniste (onglet *Mon profil*)
- Laurie DEMO — 15 avenue des Orthophonistes, 75015 Paris
- 01 42 00 00 00 — demo.orthoia@proton.me

### Patients (onglet *Mes patients*)
1. **Léa MARTIN** — 15/09/2017, CE2, École Jules Ferry (Dr Bernard LEROY)
2. **Emma PETIT** — 20/06/2016, CM1, École Pasteur (Dr Paul GARNIER)
3. **Jacques BERNARD** — 10/03/1954, Adulte (Dr Véronique CHEVALIER)

### 3 CRBOs exemples (onglet *Historique*)

| # | Patient | Test | Statut | Profil clinique |
|---|---------|------|--------|-----------------|
| 1 | Léa MARTIN (CE2) | Exalang 8-11 | Terminé | Dyslexie phonologique développementale — atteinte voie d'assemblage, métaphono déficitaire |
| 2 | Emma PETIT (CM1) | Examath | Terminé | Dyscalculie développementale — déficit central sens du nombre, géométrie préservée |
| 3 | Jacques BERNARD (72 ans) | MoCA + BETL | À relire | Trouble cognitif léger — manque du mot + mémoire mnésique — orientation neuro/neuropsy |

Chaque CRBO a :
- Anamnèse rédigée en prose professionnelle (150-400 mots, 3ème personne)
- Tableaux structurés par domaine avec É-T et percentiles
- Commentaire clinique détaillé par domaine (3-6 phrases)
- Diagnostic + diagnostic différentiel argumenté
- Recommandations concrètes avec démarches administratives (PAP / MDPH / RQTH / ALD selon pertinence)
- Conclusion standard
- **Structure JSON complète → export Word avec graphiques et couleurs**

## Tour de force pour le beta testeur

1. **Login** → voir le Kanban : 2 en *Terminé*, 1 en *À relire*.
2. **Drag & drop** : essayer de déplacer un CRBO de colonne.
3. **Cliquer sur un CRBO** → voir le contenu détaillé.
4. **Télécharger un Word** → vérifier : graphique page 1, couleurs par seuil clinique, tableaux propres, colonne Interprétation.
5. **Créer un nouveau CRBO** → voir le pré-remplissage automatique du profil + possibilité de rattacher à un patient existant.
6. **Mon profil** → modifier une info, sauvegarder, refaire un nouveau CRBO → voir la propagation.

## Reset du compte démo

Pour remettre à zéro (3 CRBO initiaux + suppression des nouveaux) :

```bash
python3 /tmp/gen-demo-crbos.py
```

Le script nettoie les CRBO existants du user et réinjecte les 3 exemples.
