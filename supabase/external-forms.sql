-- External Forms: persistent connections and submission queue (production)
-- Run after schema.sql

create table if not exists external_form_connections (
  id text primary key,
  business_id text not null references businesses(id) on delete cascade,
  owner_id text not null,
  provider text not null check (provider in (
    'forms_app', 'google_forms', 'typeform', 'jotform', 'tally', 'custom'
  )),
  form_name text not null,
  form_url text,
  webhook_url text not null,
  secret_key text not null,
  activity_type text not null check (activity_type in ('event', 'card', 'program', 'course')),
  is_active boolean not null default false,
  field_mapping jsonb not null default '[]'::jsonb,
  submission_count integer not null default 0,
  last_submission_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_form_connections_business_idx
  on external_form_connections (business_id);

create table if not exists external_form_submissions (
  id text primary key,
  business_id text not null references businesses(id) on delete cascade,
  connection_id text not null references external_form_connections(id) on delete cascade,
  provider text not null,
  external_submission_id text,
  dedupe_hash text,
  raw_payload jsonb not null,
  normalized_payload jsonb,
  created_activity_id text,
  created_client_id text,
  status text not null check (status in ('received', 'mapped', 'created', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_form_submissions_connection_idx
  on external_form_submissions (connection_id, created_at desc);

create unique index if not exists external_form_submissions_dedupe_idx
  on external_form_submissions (connection_id, coalesce(external_submission_id, dedupe_hash))
  where status = 'created';
