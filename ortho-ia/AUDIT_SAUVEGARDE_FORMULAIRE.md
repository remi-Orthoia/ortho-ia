# Audit — Système de sauvegarde des formulaires CRBO

**Date** : 2026-05-24  
**Périmètre** : `/dashboard/nouveau-crbo` (formulaire 4 étapes — langage / cognitif). Le formulaire B-CM / B-CMado (`components/bilans/math/BilanMathForm.tsx`) utilise un système indépendant (`ortho-ia:bilan-math-draft:<grille.id>`) qui n'entre pas dans le périmètre.

**Constat général** : la sauvegarde repose ENTIÈREMENT sur `localStorage` (clé `ortho-ia:crbo-draft`). Aucune persistance Supabase tant que le CRBO n'est pas généré. Le mécanisme est solide sur le 1er onglet mais comporte des angles morts (multi-utilisateur, multi-onglet, expiration, anonymisation).

---

## 1. Auto-save localStorage

### 1.1 Auto-save 15s sur toutes les étapes — ✅ OK
- Mécanisme double : debounce 1.5s sur chaque modif (`useEffect [formData, currentStep]`) + filet de sécurité interval 15s via `useRef` pour ne pas se réinitialiser à chaque frappe (page.tsx:539-553).
- Les deux mécanismes tournent quelle que soit l'étape courante, tant que `showResult === false`.

### 1.2 Clé unique par user — ❌ MANQUANT (corrigé)
- **Avant** : `const DRAFT_KEY = 'ortho-ia:crbo-draft'` — chaîne constante, partagée entre tous les comptes utilisant le même navigateur.
- **Risque** : si l'ortho A se déconnecte et l'ortho B se connecte sur le même poste (rare mais possible — poste partagé en cabinet de groupe), B voit apparaître le brouillon de A avec le nom du patient de A dans son formulaire → fuite RGPD + données croisées.
- **Fix appliqué** : clé scopée par `user.id` (`ortho-ia:crbo-draft:<uuid>`). L'ancienne clé globale est nettoyée au premier chargement scoped pour éviter les fuites résiduelles.

### 1.3 Restauration au retour sur l'onglet — ⚠️ PARTIEL (corrigé)
- Le `useEffect [searchParams, router]` lit le draft une seule fois au mount (page.tsx:373-384). OK pour un onglet fermé puis rouvert.
- **Problème** : la restauration est **silencieuse**. Le form apparaît rempli sans aucun feedback à l'ortho. Si elle pensait démarrer un nouveau dossier, elle peut écraser sans s'en rendre compte un brouillon en cours.
- **Fix appliqué** : bandeau "📂 Brouillon restauré — reprise à l'étape X de jj/mm à hh:mm" affiché via `prefillBanner` (le même bandeau emerald déjà utilisé pour les autres prefill).

### 1.4 Anonymisation des données — ❌ MANQUANT
- Nom + prénom + DDN patient sont écrits **en clair** dans `localStorage`. Visibles dans les DevTools du navigateur (Application → Local Storage).
- **Non corrigé dans ce passage** : l'anonymisation est un chantier RGPD plus large (cf. TODO `CLAUDE.md` — "Anonymisation avant envoi Claude"). Le périmètre concerne aussi le payload envoyé à Claude, sessionStorage handoff, etc. À traiter dans une migration dédiée (chiffrement at-rest navigateur via SubtleCrypto + clé dérivée du user.id).
- **Mitigation existante** : la clé est maintenant scopée par user (cf. 1.2), donc le brouillon n'est lisible que par la session de l'ortho qui l'a saisi.

### 1.5 Gestion quota localStorage plein — ⚠️ PARTIEL (corrigé)
- **Avant** : `persistDraft()` capture l'exception mais ne fait rien d'autre que `setSavingFlash(false)` et retourne `false`. L'ortho ne voit aucun avertissement.
- **Fix appliqué** : un toast `error` est émis une seule fois par session (flag `quotaErrorShownRef`) quand `localStorage.setItem` lève `QuotaExceededError`. Message : "Stockage navigateur plein — sauvegarde locale impossible. Téléchargez Word dès que possible." Le flag évite le toast-loop si la persistance échoue à chaque tick 15s.

---

## 2. Sauvegarde Supabase

### 2.1 Brouillons en base — ❌ MANQUANT (décision conservée)
- La table `crbos` n'a pas de statut `brouillon` (cf. `supabase-update-kanban.sql:43-44` — CHECK constraint `('a_rediger', 'en_cours', 'a_relire', 'termine')`).
- Aucun INSERT dans `crbos` avant la génération réussie (`resultats/page.tsx:477-505`). Tout se joue côté localStorage.
- **Décision conservée** : ne PAS créer de brouillons en DB. Raisons :
  1. Coût quota CRBO (`increment_crbo_count` côté DB) n'est consommé qu'à la génération réussie — un brouillon en DB compliquerait le décompte.
  2. Le kanban actuel (À rédiger / À relire / Terminé) reflète des CRBO terminés. Un 4e statut brouillon ajouterait du bruit visuel sans bénéfice clinique évident.
  3. La perte d'un brouillon coûte ~15 min de re-saisie. Le coût d'ingénierie pour une persistance DB robuste (sync conflicts, retry queue, RLS) est disproportionné.
- **À reconsidérer** si : retour utilisateur signale des pertes fréquentes, ou ajout d'un workflow "préparer en cabinet, finir à la maison" (multi-device).

### 2.2 Déclenchement par étape — N/A (cf. 2.1)
- Aucune sauvegarde Supabase par étape, conformément à la décision 2.1.

### 2.3 Visibilité d'un CRBO commencé dans l'UI — ⚠️ PARTIEL (corrigé)
- **Avant** : le brouillon n'apparaissait NULLE PART hors de `/dashboard/nouveau-crbo`. Si l'ortho revenait au dashboard, elle ne savait pas qu'un brouillon attendait.
- **Fix appliqué** : un bandeau "📝 Brouillon en cours — Reprendre" est affiché en haut du dashboard quand `localStorage` contient un draft non-vide pour l'user courant. Clic → redirige vers `/dashboard/nouveau-crbo` qui restaurera (cf. 1.3).

### 2.4 Fallback si Supabase offline — ✅ OK (par construction)
- Comme tout est localStorage, l'offline n'affecte pas la sauvegarde du brouillon. La génération en ligne reste évidemment requise (appel `/api/generate-crbo`).

---

## 3. Reprise d'un formulaire commencé

### 3.1 Avertissement de brouillon existant — ⚠️ PARTIEL (corrigé)
- Cf. 1.3 — fix bandeau "Brouillon restauré" + 2.3 — fix bandeau dashboard.

### 3.2 Reprise à l'étape exacte — ✅ OK
- Le draft sérialise `{ step, formData }` (page.tsx:506) et la restauration appelle `setCurrentStep(draft.step || 1)` (page.tsx:379). Reprise à l'étape, pas seulement aux données.

### 3.3 Brouillon visible depuis dashboard / historique — ⚠️ PARTIEL (corrigé)
- Cf. 2.3 — bandeau dashboard. Pas d'entrée dans "Historique" (qui liste les CRBO terminés). À ce stade un seul brouillon à la fois, donc une entrée dédiée historique serait redondante.

---

## 4. Gestion des conflits multi-onglets

### 4.1 Même formulaire dans 2 onglets — ❌ MANQUANT (corrigé)
- **Avant** : aucun listener `'storage'`. Les deux onglets écrivent dans la même clé localStorage en parallèle → last-write-wins, et l'onglet qui n'a pas le focus continue d'écraser avec un état périmé à chaque tick 15s.
- **Fix appliqué** : listener `window.addEventListener('storage', ...)` sur la clé draft scopée. Quand un autre onglet modifie le draft, on rafraîchit l'état local (`setFormData` + `setCurrentStep`). On évite la boucle infinie via un flag `localOriginRef` qui n'absorbe que les events provenant d'AUTRES onglets.

### 4.2 Génération onglet 2 pendant saisie onglet 1 — ⚠️ PARTIEL (corrigé)
- **Avant** : onglet 2 supprime `DRAFT_KEY` (page.tsx:1145) → onglet 1 continue de taper → re-sauvegarde un draft "ghost" → confusion.
- **Fix appliqué** : grâce au listener 'storage', l'onglet 1 détecte la suppression (event avec `newValue === null`) et bascule en mode "auto-save désactivé" (flag `staleTab` + banner rouge "Ce CRBO vient d'être généré ou supprimé dans un autre onglet — fermez cet onglet pour éviter d'écraser des données"). Les champs restent éditables mais aucune écriture localStorage n'est plus émise, donc plus de brouillon fantôme.

---

## 5. Nettoyage des données

### 5.1 Purge >30 jours — ❌ MANQUANT (corrigé)
- **Avant** : aucun timestamp sur le draft, aucune purge. Un brouillon abandonné en 2024 pouvait ressurgir en 2026 si l'ortho revenait sur l'onglet.
- **Fix appliqué** : ajout `savedAt: number` dans la sérialisation du draft. À la restauration, si `Date.now() - savedAt > 30j`, on supprime la clé et on n'affiche rien (silencieux — un draft expiré n'apporte aucune valeur clinique).

### 5.2 Suppression après génération réussie — ✅ OK
- `localStorage.removeItem(DRAFT_KEY)` est appelé en 3 endroits :
  - À la fin de `handleGenerate` juste avant la nav vers `/resultats` (page.tsx:1145)
  - Bouton "Nouveau dossier" depuis l'écran résultat (page.tsx:1294)
  - `handleResetFormForNewPatient` — bouton "Changer" du bandeau sticky (page.tsx:1040)

---

## 6. UX de la sauvegarde

### 6.1 Indicateur visible sur toutes les étapes — ✅ OK
- `<AutoSaveIndicator>` est rendu dans le header au-dessus de `<StepProgress>` (page.tsx:1426-1430), donc présent sur les 4 étapes.
- 3 états : "Sauvegarde…" (~500ms), "Enregistré il y a Xs", rien (avant le 1er save).

### 6.2 Indicateur n'apparaît qu'après le 1er save — ⚠️ PARTIEL (volontaire)
- Si l'ortho tape juste 1 caractère puis attend, l'auto-save se déclenche après 1.5s (debounce) → l'indicateur passe à "Enregistré à l'instant". OK.
- Si elle ne tape rien (juste navigue d'une étape à l'autre), l'indicateur reste invisible. Volontaire (cf. commentaire dans `AutoSaveIndicator.tsx:41-44`).

### 6.3 Erreur de sauvegarde visible — ❌ MANQUANT (corrigé)
- Cf. 1.5 — fix toast d'erreur quota.

---

## Synthèse

| # | Point | Statut avant | Statut après fix |
|---|-------|--------------|------------------|
| 1.1 | Auto-save 15s toutes étapes | ✅ | ✅ |
| 1.2 | Clé unique par user | ❌ | ✅ |
| 1.3 | Restauration silencieuse | ⚠️ | ✅ |
| 1.4 | Anonymisation localStorage | ❌ | ❌ (chantier RGPD à part) |
| 1.5 | Erreur quota plein | ⚠️ | ✅ |
| 2.1 | Brouillons en DB | ❌ | ❌ (décision : pas nécessaire) |
| 2.3 | Visibilité brouillon dashboard | ⚠️ | ✅ |
| 2.4 | Fallback offline | ✅ | ✅ |
| 3.1 | Avertissement brouillon | ⚠️ | ✅ |
| 3.2 | Reprise à l'étape | ✅ | ✅ |
| 3.3 | Brouillon depuis dashboard | ⚠️ | ✅ |
| 4.1 | Multi-onglets | ❌ | ✅ |
| 4.2 | Conflit génération multi-onglet | ⚠️ | ✅ |
| 5.1 | Purge >30j | ❌ | ✅ |
| 5.2 | Cleanup après génération | ✅ | ✅ |
| 6.1 | Indicateur visible | ✅ | ✅ |
| 6.3 | Erreur visible | ❌ | ✅ |

## Fichiers modifiés

- `app/dashboard/nouveau-crbo/page.tsx` — clé scopée user, banner restauration, toast quota, listener 'storage' multi-tab, expiration 30j
- `app/dashboard/page.tsx` — bandeau "Brouillon en cours" si draft existe pour l'user courant

## Reste à faire (hors périmètre de cet audit)

- **Anonymisation localStorage** (1.4) — chiffrement at-rest via SubtleCrypto, à mutualiser avec l'anonymisation Claude (TODO `CLAUDE.md`).
- **Brouillons en DB** (2.1) — à reconsidérer si retour utilisateur signale des pertes ou besoin multi-device.
