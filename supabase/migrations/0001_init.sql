-- =============================================================================
-- Health Record — schema, security (RLS), and storage policies
-- =============================================================================
-- Security model:
--   * A single "admin" (you) can read/write everything and grant view access.
--   * Regular users can only READ the visits an admin has explicitly shared
--     with their email address — enforced at the database layer via RLS, so a
--     bug in the app can never leak data across users.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Admins: single source of truth for who is an admin.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);

comment on table public.admins is 'Email addresses with full admin access. Seed your own email here.';

-- Helper: is the current authenticated user an admin?
-- SECURITY DEFINER so it can read public.admins regardless of the caller's RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Helper: current user's email, lowercased.
create or replace function public.current_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per family member.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  relationship text,                       -- e.g. "Bản thân", "Ba", "Mẹ", "Con"
  dob date,
  gender text,                             -- "male" | "female" | "other"
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Visits: one row per clinic/hospital visit.
-- ---------------------------------------------------------------------------
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visit_date date not null,
  hospital text,                           -- bệnh viện
  specialty text,                          -- chuyên khoa
  diagnosis text,                          -- chẩn đoán
  doctor text,                             -- bác sĩ
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists visits_profile_id_idx on public.visits (profile_id);
create index if not exists visits_visit_date_idx on public.visits (visit_date desc);

-- ---------------------------------------------------------------------------
-- Documents: files attached to a visit, grouped by category (the UI tabs).
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  category text not null check (
    category in ('lab_imaging', 'prescription', 'exam_form', 'invoice', 'other')
  ),
  storage_path text not null,              -- path within the "health-docs" bucket
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);

create index if not exists documents_visit_id_idx on public.documents (visit_id);

-- ---------------------------------------------------------------------------
-- Access grants: admin shares a specific visit with an email address.
-- ---------------------------------------------------------------------------
create table if not exists public.access_grants (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits(id) on delete cascade,
  granted_email text not null,
  created_at timestamptz not null default now(),
  unique (visit_id, granted_email)
);

create index if not exists access_grants_email_idx on public.access_grants (granted_email);

-- Normalize granted emails to lowercase.
create or replace function public.lowercase_granted_email()
returns trigger
language plpgsql
as $$
begin
  new.granted_email := lower(new.granted_email);
  return new;
end;
$$;

drop trigger if exists trg_lowercase_granted_email on public.access_grants;
create trigger trg_lowercase_granted_email
  before insert or update on public.access_grants
  for each row execute function public.lowercase_granted_email();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admins        enable row level security;
alter table public.profiles      enable row level security;
alter table public.visits        enable row level security;
alter table public.documents     enable row level security;
alter table public.access_grants enable row level security;

-- admins: a user may read only their own admin row (to check their status).
drop policy if exists admins_select_self on public.admins;
create policy admins_select_self on public.admins
  for select using (email = public.current_email());

-- profiles: admin full access; regular users may read a profile only if they
-- have been granted at least one visit belonging to that profile.
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_shared_read on public.profiles;
create policy profiles_shared_read on public.profiles
  for select using (
    exists (
      select 1
      from public.visits v
      join public.access_grants g on g.visit_id = v.id
      where v.profile_id = profiles.id
        and g.granted_email = public.current_email()
    )
  );

-- visits: admin full access; regular users read only granted visits.
drop policy if exists visits_admin_all on public.visits;
create policy visits_admin_all on public.visits
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists visits_shared_read on public.visits;
create policy visits_shared_read on public.visits
  for select using (
    exists (
      select 1 from public.access_grants g
      where g.visit_id = visits.id
        and g.granted_email = public.current_email()
    )
  );

-- documents: admin full access; regular users read docs of granted visits.
drop policy if exists documents_admin_all on public.documents;
create policy documents_admin_all on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists documents_shared_read on public.documents;
create policy documents_shared_read on public.documents
  for select using (
    exists (
      select 1 from public.access_grants g
      where g.visit_id = documents.visit_id
        and g.granted_email = public.current_email()
    )
  );

-- access_grants: only admin manages; users may read grants addressed to them.
drop policy if exists access_grants_admin_all on public.access_grants;
create policy access_grants_admin_all on public.access_grants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists access_grants_read_self on public.access_grants;
create policy access_grants_read_self on public.access_grants
  for select using (granted_email = public.current_email());

-- ---------------------------------------------------------------------------
-- Storage: private bucket + policies mirroring the table rules (defense in depth).
-- File uploads/downloads flow through server actions using the service role,
-- but these policies ensure the bucket is never publicly readable.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('health-docs', 'health-docs', false)
on conflict (id) do nothing;

-- Admin: full access to objects in the bucket.
drop policy if exists health_docs_admin_all on storage.objects;
create policy health_docs_admin_all on storage.objects
  for all using (
    bucket_id = 'health-docs' and public.is_admin()
  ) with check (
    bucket_id = 'health-docs' and public.is_admin()
  );

-- Regular users: read an object only if it belongs to a granted visit.
-- Path convention: "{profile_id}/{visit_id}/{category}/{filename}"
drop policy if exists health_docs_shared_read on storage.objects;
create policy health_docs_shared_read on storage.objects
  for select using (
    bucket_id = 'health-docs'
    and exists (
      select 1 from public.access_grants g
      where g.visit_id = ((storage.foldername(name))[2])::uuid
        and g.granted_email = public.current_email()
    )
  );
