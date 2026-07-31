-- =============================================================================
-- 0002 — Managers (multi-family), profile ownership, ICD-10 code
-- =============================================================================
-- New model:
--   * admin  — sees and can do everything (unchanged).
--   * manager — appointed by admin; runs their own family: creates their own
--     patients and has full CRUD over those patients' visits/documents, plus
--     can share read access to their visits. Managers cannot see each other's
--     (or the admin's) patients.
--   * viewer — unchanged: read-only on visits shared with their email.
-- Run this AFTER 0001 in the Supabase SQL editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Managers
-- ---------------------------------------------------------------------------
create table if not exists public.managers (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.managers enable row level security;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.managers m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

drop policy if exists managers_admin_all on public.managers;
create policy managers_admin_all on public.managers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists managers_select_self on public.managers;
create policy managers_select_self on public.managers
  for select using (email = public.current_email());

-- ---------------------------------------------------------------------------
-- Profile ownership
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists owner_email text;

-- Existing rows belong to the admin.
update public.profiles
set owner_email = (select email from public.admins limit 1)
where owner_email is null;

-- Default new rows to the creator.
create or replace function public.set_profile_owner()
returns trigger
language plpgsql
as $$
begin
  if new.owner_email is null or new.owner_email = '' then
    new.owner_email := public.current_email();
  end if;
  new.owner_email := lower(new.owner_email);
  return new;
end;
$$;

drop trigger if exists trg_set_profile_owner on public.profiles;
create trigger trg_set_profile_owner
  before insert on public.profiles
  for each row execute function public.set_profile_owner();

-- Does the current user own this profile?
create or replace function public.owns_profile(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_id
      and p.owner_email = public.current_email()
  );
$$;

-- ---------------------------------------------------------------------------
-- ICD-10 code on visits
-- ---------------------------------------------------------------------------
alter table public.visits add column if not exists icd_code text;

-- ---------------------------------------------------------------------------
-- Rewritten policies
-- ---------------------------------------------------------------------------

-- profiles: admin all; owner all on own rows; only admins/managers may insert
-- (and only as themselves unless admin); viewers keep shared read.
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists profiles_owner_select on public.profiles;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;
drop policy if exists profiles_owner_delete on public.profiles;

create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy profiles_owner_select on public.profiles
  for select using (owner_email = public.current_email());

create policy profiles_owner_insert on public.profiles
  for insert with check (
    public.is_manager() and owner_email = public.current_email()
  );

create policy profiles_owner_update on public.profiles
  for update using (
    public.is_manager() and owner_email = public.current_email()
  ) with check (
    public.is_manager() and owner_email = public.current_email()
  );

create policy profiles_owner_delete on public.profiles
  for delete using (
    public.is_manager() and owner_email = public.current_email()
  );

-- (profiles_shared_read from 0001 stays as-is for viewers.)

-- visits: admin all; profile owner all; viewers keep shared read.
drop policy if exists visits_admin_all on public.visits;
drop policy if exists visits_owner_all on public.visits;

create policy visits_admin_all on public.visits
  for all using (public.is_admin()) with check (public.is_admin());

create policy visits_owner_all on public.visits
  for all using (public.owns_profile(profile_id))
  with check (public.owns_profile(profile_id));

-- documents: admin all; owner of the visit's profile all; viewers shared read.
drop policy if exists documents_admin_all on public.documents;
drop policy if exists documents_owner_all on public.documents;

create policy documents_admin_all on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

create policy documents_owner_all on public.documents
  for all using (
    exists (
      select 1 from public.visits v
      where v.id = documents.visit_id
        and public.owns_profile(v.profile_id)
    )
  ) with check (
    exists (
      select 1 from public.visits v
      where v.id = documents.visit_id
        and public.owns_profile(v.profile_id)
    )
  );

-- access_grants: admin all; owner of the visit's profile manages their own
-- shares; grantees keep read-own (from 0001).
drop policy if exists access_grants_admin_all on public.access_grants;
drop policy if exists access_grants_owner_all on public.access_grants;

create policy access_grants_admin_all on public.access_grants
  for all using (public.is_admin()) with check (public.is_admin());

create policy access_grants_owner_all on public.access_grants
  for all using (
    exists (
      select 1 from public.visits v
      where v.id = access_grants.visit_id
        and public.owns_profile(v.profile_id)
    )
  ) with check (
    exists (
      select 1 from public.visits v
      where v.id = access_grants.visit_id
        and public.owns_profile(v.profile_id)
    )
  );

-- storage: path is "{profile_id}/{visit_id}/{category}/{file}". Owners of the
-- profile folder get full access; admin + shared read stay from 0001.
drop policy if exists health_docs_owner_all on storage.objects;
create policy health_docs_owner_all on storage.objects
  for all using (
    bucket_id = 'health-docs'
    and public.owns_profile(((storage.foldername(name))[1])::uuid)
  ) with check (
    bucket_id = 'health-docs'
    and public.owns_profile(((storage.foldername(name))[1])::uuid)
  );
