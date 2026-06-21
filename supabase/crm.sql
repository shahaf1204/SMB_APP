-- הריצי ב-Supabase → SQL Editor (אחרי schema.sql)
-- CRM: חיבור Meta + לידים מ-webhook (טוקן נגיש רק ל-service role)

create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null,
  page_id text not null unique,
  page_name text not null default '',
  access_token_encrypted text,
  token_expires_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id text not null,
  full_name text not null,
  phone text not null default '',
  email text,
  source text not null default 'facebook',
  status text not null default 'new',
  service_interest text,
  notes text not null default '',
  external_provider text not null,
  external_lead_id text,
  external_form_id text,
  external_form_name text,
  external_page_id text,
  external_page_name text,
  external_campaign_id text,
  external_campaign_name text,
  external_ad_id text,
  external_ad_name text,
  form_answers jsonb not null default '[]'::jsonb,
  status_history jsonb not null default '[]'::jsonb,
  raw_payload jsonb,
  converted_to_event_id text,
  converted_to_card_id text,
  converted_to_project_id text,
  converted_to_class_id text,
  converted_to_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_leads_external_unique_idx
  on public.crm_leads (external_provider, external_lead_id)
  where external_lead_id is not null;

create index if not exists crm_leads_user_business_idx
  on public.crm_leads (user_id, business_id, created_at desc);

create index if not exists meta_connections_user_idx
  on public.meta_connections (user_id, business_id);

alter table public.meta_connections enable row level security;
alter table public.crm_leads enable row level security;

-- משתמש רואה חיבורים שלו (בלי טוקן — העמודה לא נגישה דרך view)
create policy "meta_connections_select_own"
  on public.meta_connections for select
  using (auth.uid() = user_id);

create policy "meta_connections_insert_own"
  on public.meta_connections for insert
  with check (auth.uid() = user_id);

create policy "meta_connections_update_own"
  on public.meta_connections for update
  using (auth.uid() = user_id);

create policy "meta_connections_delete_own"
  on public.meta_connections for delete
  using (auth.uid() = user_id);

create policy "crm_leads_select_own"
  on public.crm_leads for select
  using (auth.uid() = user_id);

create policy "crm_leads_insert_own"
  on public.crm_leads for insert
  with check (auth.uid() = user_id);

create policy "crm_leads_update_own"
  on public.crm_leads for update
  using (auth.uid() = user_id);

create policy "crm_leads_delete_own"
  on public.crm_leads for delete
  using (auth.uid() = user_id);

-- מסך ניהול: משתמש לא יכול לקרוא access_token_encrypted ישירות — רק service role ב-webhook
