-- =============================================================================
-- 0005 — Insurance claim tracking + visit type + symptoms + cost
-- =============================================================================
-- Adds fields to support the app's main goal: tracking which visits have been
-- claimed with insurance. All columns inherit the existing RLS on `visits`.
-- Run this AFTER 0004 in the Supabase SQL editor.
-- =============================================================================

alter table public.visits
  -- Insurance claim status:
  --   'none'     -> Chưa claim (default)
  --   'pending'  -> Đang claim
  --   'rejected' -> Bị từ chối
  --   'claimed'  -> Đã claim
  add column if not exists claim_status text not null default 'none'
    check (claim_status in ('none', 'pending', 'rejected', 'claimed')),
  -- Amount reimbursed by insurance (when claimed).
  add column if not exists claim_amount numeric,
  -- Total out-of-pocket cost of the visit (exam + medicine).
  add column if not exists total_cost numeric,
  -- 'outpatient' (Ngoại trú) | 'inpatient' (Nội trú)
  add column if not exists visit_type text
    check (visit_type is null or visit_type in ('outpatient', 'inpatient')),
  -- Discharge date for inpatient stays (visit_date is the admit date).
  add column if not exists discharge_date date,
  -- Free-text symptoms recorded at the visit.
  add column if not exists symptoms text;
