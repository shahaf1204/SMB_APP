-- Phase 3A.5 — Lead intake / review lifecycle (additive)
-- Run after supabase/crm.sql

alter table public.crm_leads
  add column if not exists intake_status text
    check (
      intake_status is null
      or intake_status in (
        'new',
        'needs_information',
        'ready_for_review',
        'approved',
        'rejected',
        'converted'
      )
    );

alter table public.crm_leads
  add column if not exists intake_status_history jsonb not null default '[]'::jsonb;

alter table public.crm_leads
  add column if not exists completeness_snapshot jsonb;

alter table public.crm_leads
  add column if not exists intake_updated_at timestamptz;

create index if not exists crm_leads_intake_unresolved_idx
  on public.crm_leads (user_id, business_id, intake_status)
  where intake_status in ('new', 'needs_information', 'ready_for_review');

-- Migration semantics (application-enforced for NULL intake_status):
-- 1. NULL intake_status = legacy grandfathered — NOT counted as unresolved intake alerts.
-- 2. Backfill optional: rows with any converted_to_* set may be intake_status = 'converted'.
-- 3. New external leads (3A.5+) always receive explicit intake_status on insert.
-- 4. Do NOT mass-set existing external rows to 'new' (would flood owners with false alerts).
