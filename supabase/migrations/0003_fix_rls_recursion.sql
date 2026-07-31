-- =============================================================================
-- 0003 — Fix infinite recursion between visits and access_grants policies
-- =============================================================================
-- 0002 introduced a cycle: visits_shared_read queries access_grants, while
-- access_grants_owner_all queries visits. Evaluating either table's RLS then
-- re-evaluates the other's, and Postgres aborts with:
--   "infinite recursion detected in policy for relation \"visits\""
--
-- Fix: route every cross-table check through SECURITY DEFINER helpers, which
-- read the underlying tables without re-triggering RLS. Policies then contain
-- no direct references to other RLS-protected tables, so no cycle can form.
-- Run this AFTER 0002 in the Supabase SQL editor.
-- =============================================================================

-- Does the current user own the profile this visit belongs to?
create or replace function public.owns_visit(v_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.visits v
    join public.profiles p on p.id = v.profile_id
    where v.id = v_id
      and p.owner_email = public.current_email()
  );
$$;

-- Has the current user been granted read access to this visit?
create or replace function public.has_visit_grant(v_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.access_grants g
    where g.visit_id = v_id
      and g.granted_email = public.current_email()
  );
$$;

-- Has the current user been granted read access to any visit of this profile?
create or replace function public.profile_has_grant(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.visits v
    join public.access_grants g on g.visit_id = v.id
    where v.profile_id = p_id
      and g.granted_email = public.current_email()
  );
$$;

-- ---------------------------------------------------------------------------
-- Recreate the policies that previously embedded cross-table subqueries.
-- ---------------------------------------------------------------------------

-- profiles: viewer read via helper (was a join over visits + access_grants).
drop policy if exists profiles_shared_read on public.profiles;
create policy profiles_shared_read on public.profiles
  for select using (public.profile_has_grant(id));

-- visits: viewer read via helper (was a subquery over access_grants).
drop policy if exists visits_shared_read on public.visits;
create policy visits_shared_read on public.visits
  for select using (public.has_visit_grant(id));

-- documents: owner + viewer via helpers (were subqueries over visits).
drop policy if exists documents_owner_all on public.documents;
create policy documents_owner_all on public.documents
  for all using (public.owns_visit(visit_id))
  with check (public.owns_visit(visit_id));

drop policy if exists documents_shared_read on public.documents;
create policy documents_shared_read on public.documents
  for select using (public.has_visit_grant(visit_id));

-- access_grants: owner management via helper (was a subquery over visits —
-- one half of the cycle).
drop policy if exists access_grants_owner_all on public.access_grants;
create policy access_grants_owner_all on public.access_grants
  for all using (public.owns_visit(visit_id))
  with check (public.owns_visit(visit_id));

-- storage: viewer read via helper (was a subquery over access_grants).
-- Path convention: "{profile_id}/{visit_id}/{category}/{file}".
drop policy if exists health_docs_shared_read on storage.objects;
create policy health_docs_shared_read on storage.objects
  for select using (
    bucket_id = 'health-docs'
    and public.has_visit_grant(((storage.foldername(name))[2])::uuid)
  );
