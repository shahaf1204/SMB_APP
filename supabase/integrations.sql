-- Business Integrations — credentials server-side only (Vercel API + service role)
-- Run in Supabase SQL Editor after schema.sql

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('finance', 'calendar', 'marketing', 'communication')),
  provider text not null,
  connection_status text not null default 'disconnected'
    check (connection_status in ('disconnected', 'connected', 'error', 'syncing')),
  auth_method text not null default 'api_key' check (auth_method in ('oauth', 'api_key', 'webhook_only')),
  api_key_encrypted text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  last_sync timestamptz,
  next_sync timestamptz,
  sync_status text not null default 'idle'
    check (sync_status in ('idle', 'syncing', 'success', 'error')),
  last_error text,
  account_label text,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider)
);

create index if not exists integration_connections_business_idx
  on public.integration_connections (business_id);

create index if not exists integration_connections_user_idx
  on public.integration_connections (user_id);

alter table public.integration_connections enable row level security;

create policy "integration_connections_select_own"
  on public.integration_connections for select
  using (auth.uid() = user_id);

create policy "integration_connections_insert_own"
  on public.integration_connections for insert
  with check (auth.uid() = user_id);

create policy "integration_connections_update_own"
  on public.integration_connections for update
  using (auth.uid() = user_id);

create policy "integration_connections_delete_own"
  on public.integration_connections for delete
  using (auth.uid() = user_id);

-- Webhook deduplication + audit (service role writes from /api/webhooks)
create table if not exists public.integration_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  business_id text,
  invoice_id text,
  processed boolean not null default false,
  raw_payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create index if not exists integration_webhook_events_provider_idx
  on public.integration_webhook_events (provider, received_at desc);

-- No RLS on webhook_events — accessed only via service role from API routes
