# Audit SQL Supabase — tables liées à la sauvegarde des formulaires

**Date initiale** : 2026-05-24 (v1 — audit statique sans MCP)
**Mise à jour** : 2026-05-24 (v2 — audit LIVE via MCP Supabase, projet `psxngyjpshweknwrhpck`)

---

## 📌 Statut actuel (après audit v2 live)

| Domaine | Etat reel en DB | Action |
|---------|-----------------|--------|
| Colonnes `crbos` du fix v1 (5 sur 8) | ✅ presentes (audit-fixes v1 partiellement applique OU deja en prod) | rien |
| `crbos.format_crbo`, `crbos.crbo_text` | ❌ pas en DB | **fausse alerte v1** — pas utilisees par le code applicatif. Backlog raye. |
| `crbos.updated_at` + trigger | ❌ toujours manquant | **livre dans v2 §2** |
| `profiles.referral_code` | ✅ presente avec UNIQUE + index | rien |
| `referrals`, `referral_rewards` | ✅ presentes (migrations `20260504*` appliquees) | rien |
| `drafts` (proposee v1) | ❌ pas creee — et **non utilisee par le code** | **retire du backlog** |
| `ortho_feedbacks` | ❌ MANQUANTE — utilisee par `POST /api/feedbacks` | **livre dans v2 §1.1** |
| `bilan_references` | ❌ MANQUANTE — utilisee par `POST /api/feedbacks` (branche score≤3) | **livre dans v2 §1.2** |
| `previous_bilans` | ❌ MANQUANTE — utilisee par `POST /api/extract-previous-bilan` | **livre dans v2 §1.3** |
| `session_journal` | ❌ MANQUANTE — utilisee par `GET/POST/PUT /api/journal/*` (le code log « 42P01 → table manquante ») | **livre dans v2 §1.4** |
| `patient_notes` | ❌ MANQUANTE — utilisee par `GET/POST/PUT/DELETE /api/patients/[id]/notes/*`. **Loupee par l'audit v2**, rattrapee dans la migration `20260524180000_create_patient_notes_table` | **appliquee 2026-05-24** |
| `crbos.smart_objectives`, `crbos.smart_objectives_generated_at` | ❌ MANQUANTES — ecrites par `/api/generate-smart-objectives`, lues par fiche historique. UPDATE rate silencieusement → regeneration a chaque clic (cout Claude) | **livre dans v2 §2** |
| Index couvrants sur 4 FK | ❌ manquants (lint perfo) | **livre dans v2 §3** |
| `search_path` sur 6 fonctions | ❌ mutable (lint secu) | **livre dans v2 §4** |
| `SECURITY DEFINER` exposees a anon (4 douteuses) | ❌ executables par anon (lint secu) | **livre dans v2 §5** |
| 25 policies RLS avec `auth.uid()` nu (lint perfo) | ⚠️ reevaluees par ligne | **livre dans patch `supabase-rls-perf-patch.sql`** |
| 2 policies SELECT permissives sur `referrals` | ⚠️ doublon | **consolide dans `supabase-rls-perf-patch.sql`** |
| Auth `leaked_password_protection` | ❌ desactive | **note v2 §6 — toggle manuel dashboard Auth** |

## 📦 Fichiers livres

- `supabase-audit-fixes-v2.sql` — migration unique a executer dans le SQL Editor Supabase (idempotente, replay safe). Couvre §1 a §5.
- `supabase-rls-perf-patch.sql` — patch separe pour les 25 policies RLS + consolidation referrals. A appliquer hors heure de pointe (lock bref par policy).
- `supabase-audit-fixes.sql` (v1, conservee) — **partiellement obsolete**. Ne pas reappliquer telle quelle : elle cree `drafts` (inutile) et tente d'ajouter `format_crbo`/`crbo_text` (fausses alertes).

## 🚀 Action utilisateur

1. **Ouvrir le SQL Editor Supabase** (https://supabase.com/dashboard/project/psxngyjpshweknwrhpck/sql)
2. **Coller et executer `supabase-audit-fixes-v2.sql`** (1 a 3 s)
3. **Coller et executer `supabase-rls-perf-patch.sql`** (1 a 3 s — choisir une fenetre creuse)
4. **Aller dans Auth → Sign In / Up → Password Settings → activer « Check against HaveIBeenPwned »**
5. **Relancer `get_advisors`** pour verifier que les warnings ont disparu
6. **Tester en local** les routes `/api/feedbacks`, `/api/journal`, `/api/extract-previous-bilan`, `/api/generate-smart-objectives` — elles retournent maintenant 200 au lieu de 500/42P01 ou de ne pas persister

## 🔎 Methode v2

L'environnement dispose maintenant du MCP Supabase configure pour le projet `psxngyjpshweknwrhpck`. L'audit v2 inspecte directement :

- `mcp__supabase__list_tables(verbose=true)` — schema reel
- `mcp__supabase__list_migrations` — historique appliquee (3 entries : `prefill_sessions`, `referrals_program`, `lookup_referrer_rpc`)
- `mcp__supabase__list_extensions` — extensions activees (pgcrypto, pg_stat_statements, uuid-ossp, vault — soit le minimum standard)
- `mcp__supabase__get_advisors(security)` — 25 warnings (search_path + SECURITY DEFINER expose + RLS true + leaked password)
- `mcp__supabase__get_advisors(performance)` — 41 lints (unindexed FK + auth_rls_initplan + unused indexes + multiple permissive policies)
- `mcp__supabase__execute_sql` — pg_policies, pg_indexes, pg_proc, information_schema.triggers, to_regclass(...) pour cross-check chaque colonne / table / policy

Cross-check du code applicatif via Grep sur `from('table_name')` a permis de detecter les 4 tables fantomes (referencees par le code, absentes en DB).

## ⚠️ Limites v2

- **Aucun test fonctionnel** — les 4 routes `/api/feedbacks`, `/api/journal/*`, `/api/extract-previous-bilan` n'ont pas ete testees apres re-creation des tables. Risque que le schema reel attendu par le code differe legerement de ce que les migrations originales declarent (faible — les schemas v2 sont copies depuis les SQL files versionnes).
- **`increment_crbo_count` garde EXECUTE pour `authenticated`** par precaution (commente dans le fichier). Si l'audit usage montre qu'il n'y a que des appels serveur via service_role, on peut le revoke aussi.
- **`get_public_stats`, `get_shared_crbo`, `lookup_referrer_by_code` gardent EXECUTE anon** parce que appeles depuis pages publiques (stats landing, partage CRBO, formulaire register avec code parrain). A confirmer en revue.

---

## 📚 ARCHIVE — Audit v1 (2026-05-24 17h54, statique sans MCP)

> Sections originales conservees pour traceabilite. **Plusieurs conclusions sont obsoletes** (cf. §statut actuel ci-dessus) :
> - `format_crbo` / `crbo_text` → fausses alertes
> - Table `drafts` → inutile (code ne l'utilise pas)
> - Tables `previous_bilans`, `bilan_references`, `ortho_feedbacks`, `session_journal` → l'audit v1 les declarait « ✅ OK » sur la foi de la presence du fichier `supabase-*.sql` dans le repo, alors qu'**elles n'ont jamais ete appliquees en prod**

### Methode v1

Le MCP Supabase n'etait PAS configure dans cet environnement (seuls Gmail / Calendar / Drive etaient disponibles). L'audit etait fait en mode **statique** sur deux sources :
1. Les fichiers `supabase-*.sql` du repo
2. Le code applicatif (`from('table').insert / select / update`)

Le delta entre (1) et (2) etait suppose comble en prod par des `ALTER TABLE` executes via le SQL Editor sans etre committes. **L'audit v2 a montre que cette hypothese etait fausse pour 4 tables** — les fichiers `.sql` etaient bien dans le repo, mais l'operateur n'avait pas execute les migrations correspondantes.

### Lecon

> La presence d'un fichier `supabase-*.sql` versionne ne prouve PAS qu'il a ete applique en prod. Ne jamais inferer l'etat reel de la DB depuis le repo seul — toujours croiser avec une inspection live (MCP, psql, ou minimum `select * from pg_tables`).

---

## 📑 Annexe — Tables `crbos` (apres audit v2)

Colonnes reellement presentes en DB (26) :
- `id`, `user_id`, `patient_prenom`, `patient_nom`, `patient_ddn`, `patient_classe`
- `bilan_date`, `bilan_type`, `bilan_subtype`, `bilan_precedent_id`
- `medecin_nom`, `medecin_tel`, `motif`, `anamnese`
- `test_utilise`, `resultats`, `notes_analyse`
- `crbo_genere`, `document_url`, `structure_json`
- `comportement_seance`, `duree_seance_minutes`, `severite_globale`
- `statut`, `patient_id`, `created_at`

Manquantes au 2026-05-24 (corriges par v2) :
- `updated_at` (+ trigger)

Manquantes au 2026-05-24 pour la feature SMART (corriges par v2 §2) :
- `smart_objectives` (JSONB) — sinon regeneration a chaque clic
- `smart_objectives_generated_at` (TIMESTAMPTZ)

Non implementees, non necessaires :
- `format_crbo` (existe en formData mais jamais persiste — bug latent applicatif separe)
- `crbo_text` (jamais reference dans le code applicatif — pure fiction de l'audit v1)
