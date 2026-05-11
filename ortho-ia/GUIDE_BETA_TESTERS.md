# 👋 Bienvenue dans la beta Ortho.ia

Merci de tester Ortho.ia avant son lancement public. Ce guide vous explique :

1. Comment générer votre premier CRBO dans l'app
2. Quoi nous envoyer pour améliorer le modèle (votre cabinet, à votre rythme)
3. Les types de bilans prioritaires à tester en ce moment
4. Comment nous joindre

---

## 1. Générer votre premier CRBO dans l'app

### Pré-requis (5 minutes, une fois pour toutes)

1. Connectez-vous sur **https://ortho-ia.vercel.app**
2. Allez dans **Mon profil** (sidebar gauche)
3. Vérifiez que vos infos sont complètes : prénom, nom, adresse, téléphone, email.
   Ces informations apparaîtront en en-tête du Word généré.
4. (Optionnel) Configurez vos **snippets perso** et votre **vocabulaire perso** dans Mon profil.

### Workflow standard CRBO (5-10 minutes par bilan)

1. **Cliquez "Nouveau CRBO"** depuis le dashboard (ou utilisez le bouton vocal "Démarrer en vocal" si vous voulez dicter une commande).

2. **Étape 1 — Patient** : sélectionnez un patient du carnet ou créez un nouveau. Si vous arrivez depuis la fiche patient (bouton "Refaire un bilan"), c'est pré-rempli.

3. **Étape 2 — Médecin** : sélectionnez le médecin prescripteur dans votre carnet et indiquez le motif de consultation (multi-sélection : lecture / écrit / oral / mémoire / déglutition / etc.).

4. **Étape 3 — Anamnèse** : tapez votre anamnèse en vrac.
   - **Astuces** :
     - Tapez `/fatigue`, `/anxiete`, `/encouragements` pour insérer vos formulations habituelles.
     - Cliquez le bouton **micro** pour dicter — Whisper transcrit votre voix.
     - Le mode focus se déclenche automatiquement (sidebar et chrome cachés pour ne pas vous distraire).

5. **Étape 4 — Résultats** : ajoutez les tests pratiqués et les scores.
   - **Glissez-déposez vos PDFs de résultats** (HappyNeuron Exalang, Examath, etc.) — Claude Vision les extrait automatiquement. Vous pouvez glisser jusqu'à 3 PDFs en même temps (page 1 + page 2 d'un Exalang par exemple).
   - Vérifiez les scores extraits, complétez à la main si besoin.

6. **Cliquez "Générer le CRBO"** :
   - Phase 1 (extraction, ~15 s) : structure les domaines et propose un commentaire initial pour chaque domaine.
   - Vous arrivez sur la **page Résultats** où vous validez/ajustez l'anamnèse, le motif, et ajoutez vos commentaires qualitatifs par domaine (fatigue, anxiété, distracteurs…).
   - Phase 2 (synthèse, ~30 s) : Claude rédige le diagnostic, recommandations, axes, PAP en **streaming live** (vous voyez le texte se construire avec les termes cliniques surlignés en couleur).

7. **Téléchargement automatique du Word** + un **bandeau feedback discret** apparaît sur le dashboard. **Merci de le remplir** :
   - Note 5 étoiles
   - Sections que vous avez modifiées
   - Ce que vous avez corrigé (texte libre)

   Ces retours alimentent notre base de **références validées** qui calibrent l'IA pour vos prochains CRBOs.

8. **Exportez aussi en PDF** si besoin (icône à côté du téléchargement Word) — utile pour envoi au médecin prescripteur.

---

## 2. Quoi nous envoyer pour améliorer le modèle

Notre IA s'améliore beaucoup plus vite avec des **cas réels et anonymisés**. À votre rythme (1 cas par semaine est déjà très utile), envoyez-nous par email à **contact@ortho-ia.fr** un ZIP contenant :

### Pour chaque cas que vous voulez nous partager

1. **Le PDF HappyNeuron des résultats** (ou la photo des résultats si pas de PDF)
   → ce qui alimente notre extraction Vision

2. **Vos notes brutes d'anamnèse** (Word, .txt, ou même photo manuscrite)
   → le matériau brut tel que vous l'aviez

3. **Le CRBO final tel que VOUS l'auriez rédigé** (Word, anonymisé : remplacez prénom/nom par X)
   → c'est notre "gold standard" — l'output qu'on cherche à reproduire

4. **Votre retour 5 étoiles + corrections** déjà donné dans l'app (rien à refaire si déjà fait)

### Anonymisation

Avant d'envoyer, **anonymisez** votre Word de référence :
- Remplacez prénom du patient par `X` ou `Léa` (prénom fictif).
- Remplacez nom de famille par `Y` ou un nom fictif.
- Retirez votre adresse + email si présents.
- Le médecin prescripteur peut rester anonymisé "Dr X".

Vous pouvez aussi utiliser **le bouton "Anonymiser"** de Word (Inspecteur de document).

### Format de l'email à contact@ortho-ia.fr

```
Sujet : [Beta Ortho.ia] Cas de référence — [Test pratiqué] — [Profil clinique]

Bonjour,

Voici un cas pour calibrer Ortho.ia :

- Test pratiqué : Examath 8-15
- Patient : Léa, CM2 (anonymisée)
- Profil clinique : dyscalculie développementale avec dyslexie associée
- Mon retour dans l'app : score 3/5 — corrections appliquées sur l'anamnèse + diagnostic
- Pièces jointes :
    * PDF résultats HappyNeuron (anonymisé)
    * Notes anamnèse brutes
    * CRBO final.docx (anonymisé)

Bien à vous,
[Nom]
```

---

## 3. Bilans prioritaires à tester en ce moment

Notre audit interne (cf. `AUDIT_MODULES.md`) montre que **certains types de bilans sont moins calibrés** que d'autres. Si vous en faites passer dans votre activité, **votre retour sur ces types est particulièrement précieux** :

| Test | Pourquoi prioritaire | Profils où votre retour aide le plus |
|---|---|---|
| **OMF / Déglutition** | Récemment enrichi avec 5 profils types (enfant atypique, adulte AVC, presbyphagie, ATM/bruxisme) | Adulte post-AVC, presbyphagie, ATM |
| **MoCA** | Enrichi avec 7 profils (MCI, Alzheimer débutant, vasculaire, post-Covid, etc.) | MCI, dépression masquée, post-Covid |
| **BETL** | Enrichi avec 7 profils (vieillissement, APP logopénique, démence sémantique, aphasie post-AVC) | APP, démence sémantique, post-AVC |
| **Examath 8-15** | Nouveau profil DYS+dyscalculie mixte à valider | Comorbidité dyslexie + dyscalculie |

Si vous testez les **modules HappyNeuron Exalang** (8-11, 11-15) — ils sont déjà bien calibrés mais tout retour est utile.

**À éviter pour la beta** (modules pas encore enrichis, sortie générique probable) : aucun bloqueur, mais N-EEL et ELO sont les moins déployés en profils types — gardez en tête que le draft sera plus générique.

---

## 4. Ce qu'on attend de vous, factuellement

- **3-5 CRBOs par semaine** en utilisation réelle.
- **Note 5 étoiles à chaque fois** dans le bandeau post-génération (3 secondes).
- **1 cas de référence ZIP par semaine** envoyé à contact@ortho-ia.fr (idéalement sur un test prioritaire).
- **Un appel court (15-30 min)** chaque 2 semaines pour échanger sur l'usage — calé selon vos disponibilités.

Pas de pression — **votre temps clinique passe avant**. Mais plus vous nous envoyez de matière, plus l'outil sera précis pour vous.

---

## 5. Bugs et suggestions

Pour signaler un bug ou suggérer une fonctionnalité :
- **Bandeau Feedback** dans l'app (en bas à droite) — pour les retours rapides
- **Email** : contact@ortho-ia.fr — pour tout ce qui demande du contexte

Réponse sous 24-48h en semaine.

---

## 6. Confidentialité et RGPD

- **Anonymisation systématique** des données patient avant transmission à l'API Claude (la rehydratation se fait côté serveur, jamais le prénom/nom complets ne quitte l'UE en clair).
- **Hébergement Europe** (Supabase EU + Vercel régions européennes).
- **Stockage Supabase** : chaque ortho voit uniquement ses propres CRBOs (RLS strict).
- **Vos données ne sont jamais utilisées pour entraîner un modèle** sans votre consentement explicite par cas (cf. workflow ci-dessus avec ZIP envoyé manuellement).

---

## 7. Roadmap visible

Pour suivre les mises à jour : **page "Actualités"** dans la sidebar.

Quelques évolutions à venir post-beta selon vos retours :
- Compte cabinet (plusieurs orthos partagent un carnet patients)
- Partage de cas de référence entre orthos (opt-in)
- Plus de tests intégrés (TEDI-MATH, NEPSY-II, MT-86…)

---

## 8. Récap : votre check-list quotidienne

À chaque CRBO généré :

- [ ] J'ai utilisé l'app pour générer le CRBO
- [ ] J'ai laissé une note 5 étoiles + une ligne de retour
- [ ] (Si possible) j'ai gardé le PDF + mes notes brutes pour envoyer en ZIP

Hebdomadairement :

- [ ] J'ai envoyé 1 ZIP de cas à contact@ortho-ia.fr
- [ ] J'ai jeté un œil aux Actualités dans l'app

C'est tout. Merci infiniment pour votre temps — vous participez à construire un outil qui aidera des milliers d'orthos après vous.

À très vite,
**L'équipe Ortho.ia**
contact@ortho-ia.fr
