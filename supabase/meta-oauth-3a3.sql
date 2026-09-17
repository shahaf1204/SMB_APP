-- Phase 3A.3 — Meta OAuth state + short-lived connection attempts (server/service role only)

create table if not exists public.meta_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_token text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists meta_oauth_states_expires_idx
  on public.meta_oauth_states (expires_at);

create table if not exists public.meta_oauth_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null,
  meta_user_id text,
  pages_payload_encrypted text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'expired', 'failed')),
  connection_baseline_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists meta_oauth_attempts_user_business_idx
  on public.meta_oauth_attempts (user_id, business_id, created_at desc);

create index if not exists meta_oauth_attempts_expires_idx
  on public.meta_oauth_attempts (expires_at);

-- One active connected Meta Page per business (app rule for 3A.3).
-- FAILS if duplicate is_active=true rows already exist for one business_id — dedupe before apply.
create unique index if not exists meta_connections_one_active_per_business_idx
  on public.meta_connections (business_id)
  where is_active = true;

-- Page ownership: meta_connections.page_id remains globally UNIQUE (crm.sql).
-- Cross-business Page conflicts are rejected in application code (page_already_connected).

-- No RLS — service role only from API routes
