-- Phase 3A.1 — additive migration (run after integrations.sql and crm.sql)
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- External event ingestion (durable boundary before domain processing)
alter table public.integration_webhook_events
  add column if not exists event_type text,
  add column if not exists connection_id uuid,
  add column if not exists lead_id uuid,
  add column if not exists processing_status text not null default 'received'
    check (processing_status in ('received', 'processing', 'processed', 'failed')),
  add column if not exists processed_at timestamptz,
  add column if not exists error text;

create index if not exists integration_webhook_events_status_idx
  on public.integration_webhook_events (provider, processing_status, received_at desc);

-- Meta connection lifecycle (OAuth in 3A.3 — columns only in 3A.1)
alter table public.meta_connections
  add column if not exists connection_status text not null default 'disconnected'
    check (connection_status in (
      'disconnected',
      'connecting',
      'connected',
      'error',
      'reconnect_required'
    )),
  add column if not exists last_error text,
  add column if not exists last_lead_received_at timestamptz,
  add column if not exists webhook_subscribed_at timestamptz;

-- Backfill processing_status for rows created before 3A.1
update public.integration_webhook_events
set processing_status = case when processed then 'processed' else 'received' end
where processing_status is null
   or (processed = true and processing_status = 'received');
