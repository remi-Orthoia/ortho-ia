# Audit SQL Supabase — tables liées à la sauvegarde des formulaires

**Date** : 2026-05-24
**Périmètre** : toutes les tables Postgres référencées par le système de sauvegarde et de génération CRBO.

## ⚠️ Méthode (à lire avant tout)

Le MCP Supabase n'est PAS configuré dans cet environnement (seuls Gmail / Calendar / Drive sont disponibles). **Je n'ai donc pas pu inspecter la base live.**

L'audit est fait en mode **statique** sur deux sources :
1. **Les fichiers `supabase-*.sql`** du repo (source de vérité versionnée)
2. **Le code applicatif** (`from('table').insert / select / update`) qui révèle les colonnes/tables réellement utilisées

Le **delta** entre (1) et (2) est probablement comblé en prod par des `ALTER TABLE` exécutés via le SQL Editor Supabase sans être committés. La migration `supabase-audit-fixes.sql` (livrée avec cet audit) est **100 % idempotente** (`IF NOT EXISTS` partout) — sûre à rejouer même si les colonnes existent déjà.

**Action requise** : exécuter `supabase-audit-fixes.sql` dans le SQL Editor de Supabase Studio. La migration ne touche aucune donnée existante.

---

## 1. Inventaire des tables

Toutes les tables référencées dans le repo, statut migration + code :

| Table | Migration | Référencée par code | Statut |
|-------|-----------|--------------------|----|
| `profiles` | `supabase-schema.sql` | ✅ partout | ⚠️ colonne `referral_code` manquante (cf. §3) |
| `subscriptions` | `supabase-schema.sql` + `supabase-quota-mensuel.sql` | ✅ dashboard, register, /api/quota | ✅ OK |
| `crbos` | `supabase-schema.sql` + 5 migrations additives | ✅ partout | ⚠️ 7 colonnes manquantes vs code (cf. §2) |
| `patients` | `supabase-update-kanban.sql` | ✅ dashboard, carnet, fiche | ✅ OK (différence de naming mineure cf. §4) |
| `medecins` | `supabase-update-kanban.sql` + `supabase-medecins-fields.sql` | ✅ carnet médecins | ✅ OK |
| `previous_bilans` | `supabase-previous-bilans.sql` | ✅ import PDF/Word de bilan externe | ✅ OK |
| `prefill_sessions` | `supabase-prefill-sessions.sql` | ✅ /api/prefill (extension Chrome) | ✅ OK |
| `bilan_references` | `supabase-bilan-references.sql` | ✅ /api/generate-crbo (few-shot) | ✅ OK |
| `ortho_feedbacks` | `supabase-ortho-feedbacks.sql` | ✅ FeedbackBanner | ✅ OK |
| `patient_notes` | `supabase-patient-notes.sql` | ✅ fiche patient | ✅ OK |
| `session_journal` | `supabase-session-journal.sql` | ✅ carnet de session | ✅ OK |
| `user_google_tokens` | `supabase-google-calendar.sql` | ✅ /api/calendar | ✅ OK |
| `webinaire_inscriptions` | `supabase-webinaire-inscriptions.sql` | ✅ landing /webinaire | ✅ OK |
| `abuse_signals` | `supabase-anti-abuse.sql` | ✅ /api/auth/finalize-signup | ✅ OK |
| `referrals` | ❌ AUCUNE | ✅ register, profil | ❌ **table manquante** (cf. §5) |
| `referral_rewards` | ❌ AUCUNE | ✅ profil | ❌ **table manquante** (cf. §5) |
| `drafts` | ❌ AUCUNE | ❌ pas utilisée par le code | ❌ **à créer** (demande utilisateur, cf. §6) |

---

## 2. Table `crbos` — colonnes manquantes des migrations versionnées

La table `crbos` est créée par `supabase-schema.sql` puis étendue par 5 migrations additives. Mais le code applicatif utilise des colonnes qui ne sont créées par **aucune** migration committée. Elles ont probablement été ajoutées en prod via SQL Editor sans commit.

### Colonnes confirmées par les migrations
✅ `id`, `user_id`, `patient_prenom`, `patient_nom`, `patient_ddn`, `patient_classe`, `bilan_date`, `bilan_type`, `medecin_nom`, `medecin_tel`, `motif`, `anamnese`, `test_utilise`, `resultats`, `notes_analyse`, `crbo_genere`, `document_url`, `created_at`
✅ `statut` (kanban), `patient_id` (FK), `bilan_subtype` (math), `smart_objectives`, `smart_objectives_generated_at`

### Colonnes utilisées par le code mais sans migration — corrigé par `supabase-audit-fixes.sql`

| Colonne | Type | Source de l'usage | Fix |
|---------|------|-------------------|-----|
| `structure_json` | JSONB | `resultats/page.tsx:495` INSERT, `/api/crbo/[id]/route.ts` PATCH, dashboard SELECT | ✅ ADD COLUMN IF NOT EXISTS |
| `comportement_seance` | TEXT | `resultats/page.tsx:496` INSERT | ✅ ADD COLUMN IF NOT EXISTS |
| `duree_seance_minutes` | INTEGER | `resultats/page.tsx:497` INSERT | ✅ ADD COLUMN IF NOT EXISTS + CHECK 1-600 min |
| `severite_globale` | TEXT | `resultats/page.tsx:498` INSERT, dashboard SELECT | ✅ ADD COLUMN IF NOT EXISTS + CHECK enum |
| `bilan_precedent_id` | UUID FK self | `resultats/page.tsx:499`, dashboard SELECT pour résoudre chaîne renouvellements | ✅ ADD COLUMN IF NOT EXISTS + FK |
| `format_crbo` | TEXT | `nouveau-crbo/page.tsx:263` formData (jamais persisté ! cf. §2bis) | ✅ ADD COLUMN IF NOT EXISTS default 'synthetique' |
| `crbo_text` | TEXT | `dashboard/page.tsx:53,306,363` SELECT en fallback de `crbo_genere` | ✅ ADD COLUMN IF NOT EXISTS |
| `updated_at` | TIMESTAMPTZ | demandé par l'audit utilisateur, absent de toute migration | ✅ ADD COLUMN + trigger |

### §2bis — `format_crbo` n'est PAS écrit par le code
Le champ existe côté formData et est consommé par `lib/word-export.ts` pour décider du nombre de pages, mais `resultats/page.tsx` ne l'inclut PAS dans l'`insert` vers `crbos`. Conséquence : re-générer un Word depuis le dashboard repart toujours en `'synthetique'`, peu importe ce que l'ortho avait choisi initialement. **Bug latent, hors périmètre du fix SQL — à corriger dans une PR applicative séparée** (ajouter `format_crbo: fd.format_crbo` dans l'insert + lecture côté dashboard handleDownload).

### Colonnes attendues par l'audit utilisateur mais hors scope
- `test_type` — l'app utilise `test_utilise` (TEXT, comma-joined). Renommer casserait le code partout. **Conservé tel quel.**
- `scores_json` — l'app utilise `resultats` (TEXT plain) + `structure_json` (JSONB post-génération). Renommer casserait `/api/crbo/[id]`. **Conservé tel quel.**
- `crbo_word_url` — équivalent `document_url` existe en DB mais n'est jamais écrit (le Word est généré côté client via `docx` + `file-saver`, jamais uploadé). **Conservé comme legacy, pas d'usage actif.**

### Statut final crbos : ⚠️ **PARTIEL → ✅ après application de `supabase-audit-fixes.sql`**

---

## 3. `profiles.referral_code` — colonne manquante

`supabase-auto-create-profile.sql` ligne 47 fait :
```sql
insert into public.profiles (id, email, prenom, nom, referral_code) values (...)
```

Et `app/auth/register/page.tsx:140` + `app/dashboard/profil/page.tsx:81` lisent `referral_code`. Mais aucune migration ne déclare cette colonne sur `profiles`. Elle existe certainement en prod (sinon `handle_new_user()` planterait à chaque inscription), mais sans migration committée.

**Fix** : `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE` + index — dans `supabase-audit-fixes.sql` §2.

**Statut : ⚠️ → ✅ après fix.**

---

## 4. Table `patients` — différences de naming

L'audit utilisateur demande la colonne `niveau_scolaire`. L'app utilise `classe` (créée par `supabase-update-kanban.sql:13`). Le code (`fiche patient`, `nouveau-crbo`) accède partout à `classe`.

**Décision : ne PAS renommer.** Renommer `classe` → `niveau_scolaire` casserait 10+ fichiers TSX et le code applicatif. La sémantique est identique (CE2 / 5e / Adulte).

Autres colonnes demandées : `id, user_id, prenom, nom, date_naissance, created_at, updated_at` — toutes présentes ✅.

**Statut : ✅ OK** (mismatch de naming documenté, pas de fix nécessaire).

---

## 5. Tables `referrals` et `referral_rewards` — manquantes

Le système de parrainage est entièrement référencé par le code mais aucune migration ne crée les tables.

**Évidence** :
- `app/auth/register/page.tsx:144` — `supabase.from('referrals').insert({ referrer_id, referred_id, referral_code, status: 'pending' })`
- `app/dashboard/profil/page.tsx:89` — `from('referrals').select('id, referred_id, status, activated_at, created_at')`
- `app/dashboard/profil/page.tsx:94` — `from('referral_rewards').select('amount, type, status')`

**Soit elles existent en prod (ajoutées via SQL Editor), soit le code échoue en silence** (les blocs sont en `try/catch` best-effort qui swallow l'erreur). La page Profil affichant 0 filleule par défaut, on ne peut pas distinguer "0 filleule" de "table absente" sans accès à la DB.

**Fix** : `CREATE TABLE IF NOT EXISTS referrals (...)` + `referral_rewards (...)` dans `supabase-audit-fixes.sql` §4-5. Schéma inféré du code applicatif :
- `referrals(id, referrer_id, referred_id, referral_code, status, activated_at, created_at, UNIQUE(referred_id))`
- `referral_rewards(id, user_id, referral_id, amount, type, status, month, notes, created_at)`

⚠️ **Si la table existe déjà en prod avec un schéma différent**, `CREATE TABLE IF NOT EXISTS` ne fait rien — il faudra alors aligner manuellement. Le risque est faible (les colonnes lues par le code dictent largement le schéma).

**Statut : ❌ → ✅ après fix** (sous réserve de vérification post-application).

---

## 6. Table `drafts` — nouvelle table demandée

L'audit utilisateur précédent (`AUDIT_SAUVEGARDE_FORMULAIRE.md`) avait conservé la décision "pas de brouillons en DB, localStorage suffit". Cet audit-ci revient sur cette décision : créer la table pour préparer une éventuelle bascule.

**Important** : la table est créée vide. **Le code applicatif ne l'utilise PAS encore.** Le wiring (auto-save → INSERT/UPDATE drafts, dashboard → SELECT drafts) reste à faire dans une PR séparée. Cette migration prépare uniquement le terrain.

Schéma livré (cf. `supabase-audit-fixes.sql` §3) :
```sql
CREATE TABLE drafts (
  id UUID PK,
  user_id UUID FK profiles ON DELETE CASCADE,
  etape INT 1..10 DEFAULT 1,
  form_data JSONB DEFAULT '{}',
  test_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + 30 days
);
```

Avec :
- RLS user-scoped (FOR ALL)
- Index `(user_id)`, `(expires_at)`, `(user_id, updated_at DESC)`
- Trigger `updated_at` auto
- Fonction `delete_expired_drafts()` pour cleanup (cf. §8)

**Statut : ❌ → ✅ après fix.**

---

## 7. RLS — toutes les tables

Vérification ligne-à-ligne des migrations :

| Table | RLS | Policies |
|-------|-----|----------|
| `profiles` | ✅ | SELECT/UPDATE/INSERT auth.uid()=id |
| `subscriptions` | ✅ | SELECT/INSERT/UPDATE auth.uid()=user_id |
| `crbos` | ✅ | SELECT/INSERT/UPDATE/DELETE auth.uid()=user_id |
| `patients` | ✅ | 4 policies CRUD |
| `medecins` | ✅ | 4 policies CRUD |
| `previous_bilans` | ✅ | 4 policies CRUD |
| `prefill_sessions` | ✅ | SELECT (auth + not expired), INSERT (own), DELETE (own) |
| `bilan_references` | ✅ | FOR ALL auth.uid()=user_id |
| `ortho_feedbacks` | ✅ | FOR ALL auth.uid()=user_id |
| `patient_notes` | ✅ | 4 policies CRUD + check patient ownership en INSERT |
| `session_journal` | ✅ | 4 policies CRUD |
| `user_google_tokens` | ✅ | SELECT/DELETE own, pas d'INSERT/UPDATE client (service_role only) |
| `webinaire_inscriptions` | ✅ | INSERT public, SELECT service_role only |
| `abuse_signals` | ✅ | Aucune policy = invisible client (insert via RPC SECURITY DEFINER) |
| `drafts` (nouvelle) | ✅ | FOR ALL auth.uid()=user_id (créée par audit-fixes) |
| `referrals` (nouvelle) | ✅ | SELECT own + INSERT referred_id=self (créée par audit-fixes) |
| `referral_rewards` (nouvelle) | ✅ | SELECT own (créée par audit-fixes) |

**Statut RLS : ✅ OK** sur toutes les tables existantes et nouvelles.

---

## 8. Indexes manquants

Vérifiés contre les requêtes du code :

### crbos
- ✅ `idx_crbos_user_id` (schema initial)
- ✅ `idx_crbos_created_at` DESC (schema initial)
- ✅ `idx_crbos_statut` (kanban migration)
- ✅ `idx_crbos_patient_id` (kanban migration)
- ✅ `idx_crbos_bilan_subtype` partial (math migration)
- ❌ `idx_crbos_updated_at` DESC → **ajouté par audit-fixes §6**
- ❌ `idx_crbos_user_statut` composite → **ajouté par audit-fixes §6**
- ❌ `idx_crbos_bilan_precedent_id` partial → **ajouté par audit-fixes §6**

### patients
- ✅ `idx_patients_user_id`
- ❌ `idx_patients_user_nom` composite → **ajouté par audit-fixes §6**

### drafts (nouvelle)
- ✅ `idx_drafts_user_id` (créé par audit-fixes)
- ✅ `idx_drafts_expires_at` (créé par audit-fixes)
- ✅ `idx_drafts_user_updated` composite (créé par audit-fixes)

**Statut indexes : ⚠️ → ✅ après fix.**

---

## 9. Cleanup automatique des drafts expirés

Demande explicite de l'audit utilisateur.

Livré dans `supabase-audit-fixes.sql` §7 :
```sql
CREATE OR REPLACE FUNCTION delete_expired_drafts() RETURNS INTEGER ...
```

Retourne le nombre de lignes supprimées (utile pour audits).

**Activation cron** : pg_cron doit être activé manuellement (Database → Extensions → pg_cron dans le Dashboard Supabase). Une fois activé :
```sql
SELECT cron.schedule(
  'cleanup-expired-drafts',
  '0 3 * * *',
  $$ SELECT delete_expired_drafts() $$
);
```

Alternative sans pg_cron : appel best-effort depuis le dashboard à l'ouverture, via `supabase.rpc('delete_expired_drafts')`.

**Statut : ✅ fonction prête**, scheduling à l'opérateur.

---

## Synthèse globale

| Domaine | Avant | Après `supabase-audit-fixes.sql` |
|---------|-------|----------------------------------|
| Schéma crbos vs code | ⚠️ 8 colonnes implicites en prod | ✅ 8 colonnes idempotent ajoutées |
| profiles.referral_code | ⚠️ implicite | ✅ explicite + index |
| Table drafts | ❌ | ✅ créée |
| Tables referrals/rewards | ❌ | ✅ créées (schéma inféré) |
| RLS | ✅ | ✅ |
| Indexes | ⚠️ manquants | ✅ complétés |
| Cleanup drafts | ❌ | ✅ fonction RPC livrée |

## Fichiers livrés

- `supabase-audit-fixes.sql` — migration idempotente à appliquer une fois dans le SQL Editor
- `AUDIT_SQL_SAUVEGARDE.md` — ce rapport

## Action requise (utilisateur)

1. **Ouvrir le SQL Editor Supabase** (https://supabase.com/dashboard/project/<id>/sql)
2. **Coller et exécuter `supabase-audit-fixes.sql`** — exécution typique 1-3 s, idempotent
3. **(Optionnel)** Activer pg_cron et planifier `delete_expired_drafts()` quotidien
4. **(Suivi)** Brancher le code applicatif sur la table `drafts` si décision de basculer hors localStorage (PR séparée, hors périmètre de cet audit)

## Limites de l'audit

- ❌ **Aucune vérification live de la prod** (MCP Supabase non configuré).
- ❌ **Impossible de confirmer que les colonnes "manquantes" sont vraiment absentes en prod** — elles ont vraisemblablement été ajoutées via SQL Editor sans commit. La migration est idempotente, donc sans risque même si elles existent déjà.
- ⚠️ **Schémas `referrals` / `referral_rewards` inférés du code** — si la prod a un schéma divergent, `CREATE TABLE IF NOT EXISTS` n'écrasera rien. À vérifier manuellement après application.
