-- ============================================================================
-- Trigger : auto-création profiles + subscriptions à l'insert dans auth.users
-- ============================================================================
-- Couvre les 3 chemins d'inscription :
--   1. Flow normal via /auth/register (signUp client)
--   2. Création manuelle via le dashboard Supabase Auth (beta-testeuses)
--   3. Création via API admin (createUser)
--
-- Avant ce trigger, seul le chemin 1 créait les lignes profiles/subscriptions
-- (côté client, dans /auth/register). Les chemins 2 et 3 laissaient l'ortho
-- avec un compte auth orphelin → handleSave faisait un UPDATE sur 0 ligne en
-- silence, l'ortho croyait avoir sauvegardé alors que rien n'était en base.
--
-- Idempotent (ON CONFLICT DO NOTHING) : relançable comme backfill si besoin,
-- ne touche pas les profils déjà créés.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prenom text;
  v_nom text;
  v_referral_code text;
begin
  -- raw_user_meta_data est alimenté par signUp({ options: { data: {...} } })
  -- côté /auth/register. Pour les comptes créés via dashboard Supabase, il
  -- est vide → on insère des chaînes vides, l'ortho complètera via /profil.
  v_prenom := coalesce(nullif(new.raw_user_meta_data->>'prenom', ''), '');
  v_nom    := coalesce(nullif(new.raw_user_meta_data->>'nom', ''), '');

  -- generate_referral_code peut ne pas être déployée (best-effort).
  -- Si elle n'existe pas, on garde NULL — un backfill SQL ultérieur pourra
  -- remplir, et la section parrainage reste simplement masquée en attendant.
  begin
    select public.generate_referral_code(
      case when v_prenom <> '' then v_prenom else split_part(new.email, '@', 1) end
    ) into v_referral_code;
  exception when others then
    v_referral_code := null;
  end;

  insert into public.profiles (id, email, prenom, nom, referral_code)
  values (new.id, new.email, v_prenom, v_nom, v_referral_code)
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status, crbo_count, crbo_limit)
  values (new.id, 'free', 'active', 0, 3)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Drop puis recreate pour rejouabilité du script
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Backfill des comptes orphelins déjà créés (Léa et autres beta testeuses)
-- ============================================================================
-- Réinsère via le trigger pour profiter de la même logique. Comme on ne peut
-- pas re-déclencher AFTER INSERT, on appelle handle_new_user manuellement
-- pour chaque auth.users sans profile.

insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.subscriptions (user_id, plan, status, crbo_count, crbo_limit)
select u.id, 'free', 'active', 0, 3
from auth.users u
left join public.subscriptions s on s.user_id = u.id
where s.user_id is null;
