-- =============================================================================
-- 0004 — Guest access per patient + multiple diagnoses per visit
-- =============================================================================
-- Adds a "guest" (khách) sharing model: an admin or a patient's owner grants a
-- guest read-only access to specific PATIENTS (profiles). The guest can view
-- those patients' timeline + documents, and nothing else. This replaces the
-- old per-visit sharing for the guest flow.
--
-- Also lets a visit carry multiple diagnoses (each with an ICD-10 code).
-- Run this AFTER 0003 in the Supabase SQL editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Per-patient guest grants
-- ---------------------------------------------------------------------------
create table if not exists public.profile_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  granted_email text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, granted_email)
);

create index if not exists profile_grants_email_idx
  on public.profile_grants (granted_email);

-- Normalize granted emails to lowercase.
create or replace function public.lowercase_profile_grant_email()
returns trigger language plpgsql as $$
begin
  new.granted_email := lower(new.granted_email);
  return new;
end;
$$;

drop trigger if exists trg_lowercase_profile_grant_email on public.profile_grants;
create trigger trg_lowercase_profile_grant_email
  before insert or update on public.profile_grants
  for each row execute function public.lowercase_profile_grant_email();

alter table public.profile_grants enable row level security;

-- Has the current user been granted access to this profile? (SECURITY DEFINER
-- so it never re-triggers RLS — same pattern as 0003.)
create or replace function public.has_profile_grant(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profile_grants g
    where g.profile_id = p_id
      and g.granted_email = public.current_email()
  );
$$;

-- Does the current user own the profile that owns this visit? (used below)
-- Already defined in 0003 as owns_visit(); reused here.

-- profile_grants policies: admin manages all; a profile's owner manages grants
-- for their own patients; a grantee may read their own grant rows.
drop policy if exists profile_grants_admin_all on public.profile_grants;
create policy profile_grants_admin_all on public.profile_grants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists profile_grants_owner_all on public.profile_grants;
create policy profile_grants_owner_all on public.profile_grants
  for all using (public.owns_profile(profile_id))
  with check (public.owns_profile(profile_id));

drop policy if exists profile_grants_read_self on public.profile_grants;
create policy profile_grants_read_self on public.profile_grants
  for select using (granted_email = public.current_email());

-- ---------------------------------------------------------------------------
-- Extend viewer-read policies to include per-patient guest grants.
-- (Keeps the existing per-visit share paths so old shares still work.)
-- ---------------------------------------------------------------------------

drop policy if exists profiles_shared_read on public.profiles;
create policy profiles_shared_read on public.profiles
  for select using (
    public.has_profile_grant(id) or public.profile_has_grant(id)
  );

drop policy if exists visits_shared_read on public.visits;
create policy visits_shared_read on public.visits
  for select using (
    public.has_profile_grant(profile_id) or public.has_visit_grant(id)
  );

drop policy if exists documents_shared_read on public.documents;
create policy documents_shared_read on public.documents
  for select using (
    public.has_visit_grant(visit_id)
    or exists (
      select 1 from public.visits v
      where v.id = documents.visit_id
        and public.has_profile_grant(v.profile_id)
    )
  );

-- storage path: "{profile_id}/{visit_id}/{category}/{file}"
drop policy if exists health_docs_shared_read on storage.objects;
create policy health_docs_shared_read on storage.objects
  for select using (
    bucket_id = 'health-docs'
    and (
      public.has_profile_grant(((storage.foldername(name))[1])::uuid)
      or public.has_visit_grant(((storage.foldername(name))[2])::uuid)
    )
  );

-- ---------------------------------------------------------------------------
-- Multiple diagnoses per visit
-- ---------------------------------------------------------------------------
-- Array of { "code": "F32", "name": "Giai đoạn trầm cảm" }. The scalar
-- diagnosis/icd_code columns are kept as a derived summary for display and
-- search, written by the app alongside this array.
alter table public.visits
  add column if not exists diagnoses jsonb not null default '[]'::jsonb;

-- Backfill the array from the existing single diagnosis/icd_code where present.
update public.visits
set diagnoses = jsonb_build_array(
  jsonb_build_object('code', coalesce(icd_code, ''), 'name', coalesce(diagnosis, ''))
)
where diagnoses = '[]'::jsonb
  and (diagnosis is not null or icd_code is not null);
