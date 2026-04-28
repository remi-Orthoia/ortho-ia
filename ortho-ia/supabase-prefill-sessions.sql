-- ============================================================================
-- Table prefill_sessions
-- ----------------------------------------------------------------------------
-- Sessions courtes (1h) qui stockent les résultats d'extraction d'un screenshot
-- HappyNeuron envoyé par l'extension Chrome. L'utilisateur reçoit un session_id
-- et est redirigé vers /dashboard/nouveau-crbo?prefill=<id>, où le formulaire
-- charge les données et auto-remplit.
--
-- Insertion : uniquement par l'API serveur (service role) → pas de policy INSERT.
-- Lecture / suppression : par le propriétaire (RLS via auth.uid()).
-- ============================================================================

create table if not exists prefill_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  source text default 'screenshot',
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null
);

create index if not exists prefill_sessions_user_id_idx on prefill_sessions(user_id);
create index if not exists prefill_sessions_expires_at_idx on prefill_sessions(expires_at);

alter table prefill_sessions enable row level security;

-- Lecture : uniquement ses propres sessions, et pas si expirée.
drop policy if exists "Users read own prefill sessions" on prefill_sessions;
create policy "Users read own prefill sessions"
  on prefill_sessions for select
  using (auth.uid() = user_id and expires_at > now());

-- Suppression : ses propres sessions (utile après consommation).
drop policy if exists "Users delete own prefill sessions" on prefill_sessions;
create policy "Users delete own prefill sessions"
  on prefill_sessions for delete
  using (auth.uid() = user_id);

-- Insertion : l'API serveur utilise idéalement la service_role (qui bypass RLS).
-- Si elle tombe en fallback sur la clé anon authentifiée, on autorise l'insert
-- pour ses propres user_id — ça évite un échec silencieux quand
-- SUPABASE_SERVICE_ROLE_KEY n'est pas configuré.
drop policy if exists "Users insert own prefill sessions" on prefill_sessions;
create policy "Users insert own prefill sessions"
  on prefill_sessions for insert
  with check (auth.uid() = user_id);

-- Job de nettoyage : à brancher sur un cron Supabase (pg_cron) ou simplement
-- déclencher manuellement de temps en temps.
--
-- delete from prefill_sessions where expires_at < now() - interval '1 day';
